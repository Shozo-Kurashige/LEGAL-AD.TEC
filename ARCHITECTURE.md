# りこんほっとLINE AI相談デモ — アーキテクチャ概要

## 目的

LINE相談にAIを接続した体験を商談・PoCで見せるためのデモアプリ。
弁護士事務所が「LステップにAIをつなぐとこういう体験になります」と直感的に説明できる状態を実現する。

---

## システム全体構成

```
ブラウザ (React SPA)
    │
    │ HTTP (プロキシ経由)
    ▼
[Replit リバースプロキシ]
    │
    ├──▶ / (chat-demo: Vite dev/静的ビルド)
    │        フロントエンド React アプリ
    │
    └──▶ /api (api-server: Express)
             ├── POST /api/auth   ← パスワード認証
             └── POST /api/chat   ← OpenAI 呼び出し
                     │
                     ▼
               OpenAI API (GPT-4o)
```

---

## モノレポ構成 (pnpm workspaces)

```
workspace/
├── artifacts/
│   ├── chat-demo/          # フロントエンド (React + Vite)
│   └── api-server/         # バックエンド (Express 5)
├── lib/
│   ├── api-spec/           # OpenAPI 定義 (openapi.yaml)
│   ├── api-client-react/   # 自動生成 React Query フック
│   ├── api-zod/            # 自動生成 Zod スキーマ
│   └── db/                 # Drizzle ORM (将来拡張用)
└── scripts/                # 共通ユーティリティ
```

---

## フロントエンド (artifacts/chat-demo)

| 項目 | 内容 |
|------|------|
| フレームワーク | React 19 + Vite |
| スタイリング | Tailwind CSS v4 |
| UIコンポーネント | shadcn/ui (Radix UI ベース) |
| ルーティング | wouter |
| API通信 | TanStack React Query + Orval 生成フック |
| 状態管理 | React useState（チャット履歴はフロント保持） |
| 認証状態 | sessionStorage (`app_auth`) |

### 主要ページ

| パス | コンポーネント | 役割 |
|------|-------------|------|
| `/` | `PasswordPage` | パスワード入力画面（未認証時） |
| `/` | `ChatPage` | LINE風チャット画面（認証済み時） |

### チャットUI仕様

- **チャット背景色**：`#EFE5DC`（LINEのベージュ）
- **ユーザー吹き出し**：右側・グリーン（`#06C755`）・白文字
- **AI吹き出し**：左側・白・アバターアイコン付き
- **入力中インジケーター**：3点アニメーション（LINEと同じ動作）
- **Enterキー**：改行のみ（送信は送信ボタンのみ）← LINEと同じ挙動
- **サンプル質問ボタン**：初回メッセージ送信後に非表示

---

## バックエンド (artifacts/api-server)

| 項目 | 内容 |
|------|------|
| フレームワーク | Express 5 |
| ロギング | pino / pino-http |
| バリデーション | Zod (Orval 自動生成スキーマ) |
| ビルド | esbuild (CJS → ESM バンドル) |

### エンドポイント

#### `POST /api/auth`
パスワード照合。

```
Request:  { password: string }
Response: { success: boolean, error?: string }
```

- パスワードは環境変数 `APP_PASSWORD` と照合（コード非埋め込み）
- 不一致時は HTTP 401 を返す

#### `POST /api/chat`
OpenAI API を呼び出してAI返信を生成。

```
Request:  { messages: { role: "user"|"assistant", content: string }[] }
Response: { message: string }
```

- モデル：`gpt-4o`
- 最大トークン：600
- チャット履歴を全件送信してコンテキストを維持
- エラー時はフロントで「ただいま確認に時間がかかっています。担当者が確認します。」を表示

---

## AIシステムプロンプト設計

AIは「弁護士監督下の初期対応パラリーガル」として動作する。

### 厳守事項（絶対禁止）

- 慰謝料額の断定
- 勝訴・敗訴の見通し発言
- 弁護士不要の案内
- 相手方への直接連絡・交渉の約束
- 断定的な法的助言

### 応答フロー

1. 相談者への共感
2. 安全確保の案内（必要な場合）
3. 相談内容の整理
4. 次に確認すべき情報の案内
5. 「詳しくは弁護士が確認します」で締め

### ケース別対応

| 相談内容 | 対応方針 |
|---------|---------|
| DV | 安全確保最優先。緊急時は110番を促す |
| 不貞 | 証拠保全（写真・LINE履歴・領収書等）を案内 |
| 慰謝料 | 「証拠確認後に弁護士が回答」と案内 |
| 相手への連絡依頼 | AI不可・弁護士受任後に対応方針確認と案内 |
| 親権・養育費・財産分与 | 状況整理のみ。判断は弁護士 |
| 関係ない質問 | 丁寧に断り、相談内容の入力を促す |

---

## セキュリティ

| 項目 | 対策 |
|------|------|
| パスワード | Replit Secrets に保存・コード非埋め込み |
| OpenAI APIキー | Replit Secrets (`OPENAI_API_KEY`) |
| GitHub Token | Replit Secrets (`GITHUB_TOKEN`)・URLに直接埋め込まない |
| パスワード照合 | サーバーサイドのみ（フロントに値を返さない） |
| セッション管理 | `sessionStorage`（タブを閉じるとリセット） |

---

## 環境変数一覧

| 変数名 | 種別 | 用途 |
|--------|------|------|
| `OPENAI_API_KEY` | Secret | OpenAI API認証 |
| `APP_PASSWORD` | Secret | アプリアクセスパスワード |
| `GITHUB_TOKEN` | Secret | GitHubへのPush認証 |
| `SESSION_SECRET` | Secret | （将来のセッション管理用） |
| `PORT` | Env | 各サービスのポート番号（Replit自動割当） |
| `BASE_PATH` | Env | フロントエンドのベースパス |

---

## デプロイ構成

| 項目 | 内容 |
|------|------|
| ホスティング | Replit Autoscale |
| フロントエンド | 静的ビルド（Vite build） |
| バックエンド | Node.js サーバー（常時起動） |
| ドメイン | `.replit.app` サブドメイン |
| リポジトリ | `github.com/Shozo-Kurashige/LEGAL-AD.TEC` (mainブランチ) |

---

## 今後の拡張ポイント（参考）

- **本番LINE連携**：LINE Messaging APIと接続し、Webhook経由でチャットを受信
- **管理画面**：相談履歴の確認・分析ダッシュボード
- **多言語対応**：英語・中国語など外国籍の相談者向け
- **弁護士エスカレーション**：特定キーワード検知時に担当弁護士へSlack/メール通知
- **DB永続化**：`lib/db`（PostgreSQL + Drizzle）を使った相談履歴保存
