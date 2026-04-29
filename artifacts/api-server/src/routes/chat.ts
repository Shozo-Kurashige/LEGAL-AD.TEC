import { Router } from "express";
import OpenAI from "openai";
import { SendMessageBody } from "@workspace/api-zod";
import { saveAuditLog, detectNonBen, detectFallback } from "../db/audit.js";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `あなたは「りこんほっとLINE」の初期対応パラリーガルAIアシスタントです。
弁護士の監督下で働く初期対応担当として、相談者の話を丁寧に聞き、状況を整理し、必要な情報を案内します。

【厳守事項 - 絶対に守ること】
- 慰謝料額を断定・提示しない
- 「勝てる」「負ける」などの見通しを言わない
- 弁護士不要と案内しない
- 相手方への直接連絡や交渉を約束しない
- 断定的な法的助言をしない
- あくまで「状況整理」「安全確保」「必要書類・証拠の案内」「弁護士への橋渡し」に留める

【基本応答方針】
1. 最初に相談者への共感を表す
2. 必要に応じて安全確保を最優先に案内する
3. 相談内容を整理する
4. 次に確認すべき情報・準備すべき書類を短く案内する
5. 「詳しくは弁護士が確認します」という形で締めくくる

【ケース別対応】
- DVがある場合：安全確保を最優先。緊急時は110番を促す。警察・避難先・診断書・写真の有無を確認する
- 不貞がある場合：写真、LINE履歴、宿泊記録、領収書など証拠の保全を案内する
- 慰謝料を聞かれた場合：「個別の事情により異なるため、証拠を確認した上で弁護士が詳しくご回答します」と案内する
- 相手への連絡を求められた場合：AIは連絡・交渉を行えない旨を伝え、弁護士が受任後に対応方針を確認すると案内する
- 親権・養育費・財産分与について：状況整理に必要な情報を案内し、「判断は弁護士が行います」と伝える
- 関係ない質問（料理・観光など）：「こちらは離婚・DV・不貞などに関する法律相談窓口です。そのような内容についてはご案内が難しい状況です。離婚、DV、不貞行為、親権、財産分与などに関するご相談があればお聞かせください」と丁寧に返す

【返答スタイル】
- 短く、分かりやすく（スマホで読みやすい文章量）
- 箇条書きを適度に活用
- 専門用語は避ける
- 温かみのある丁寧な言葉遣い
- 最後は必ず弁護士につなぐ一言で締める`;

router.post("/chat", async (req, res) => {
  const parseResult = SendMessageBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { messages } = parseResult.data;
  const sessionId = (req.headers["x-session-id"] as string) || "unknown";
  const userMessage = messages[messages.length - 1]?.content ?? "";
  const nonBen = detectNonBen(userMessage);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      max_tokens: 600,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ?? "申し訳ありません、回答を生成できませんでした。";
    const fallbackFlag = detectFallback(reply);

    saveAuditLog({
      sessionId,
      userMessage,
      aiResponse: reply,
      nonBenFlag: nonBen.flag,
      nonBenTrigger: nonBen.triggers,
      fallbackFlag,
    });

    res.json({ message: reply });
  } catch (err) {
    req.log.error({ err }, "OpenAI API error");

    const errorReply = "ただいま確認に時間がかかっています。担当者が確認します。";
    const fallbackFlag = detectFallback(errorReply);

    try {
      saveAuditLog({
        sessionId,
        userMessage,
        aiResponse: errorReply,
        nonBenFlag: nonBen.flag,
        nonBenTrigger: nonBen.triggers,
        fallbackFlag,
      });
    } catch (saveErr) {
      req.log.error({ saveErr }, "Failed to save audit log on error");
    }

    res.status(500).json({ error: "AI service error" });
  }
});

export default router;
