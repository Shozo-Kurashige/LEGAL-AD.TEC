import { useState, useRef, useEffect } from "react";
import { useSendMessage } from "@workspace/api-client-react";
import { Send, User as UserIcon, ClipboardList } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocation } from "wouter";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const SAMPLE_QUESTIONS = [
  "夫から暴力を受けています。どうしたらいいですか？",
  "不倫されたので慰謝料はいくら取れますか？",
  "相手に電話してやめるように言ってもらえますか？",
  "近くの美味しいラーメン屋を教えてください"
];

const WELCOME_MESSAGE = `はじめまして。りこんほっとLINEの初期対応担当です。
離婚・DV・不貞行為・親権・財産分与などについて、まずは状況をお聞かせください。
お気持ちを整理するお手伝いをします。詳しい判断は弁護士が行います。`;

export default function ChatPage() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: WELCOME_MESSAGE,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sendMessage = useSendMessage();
  const isLoading = sendMessage.isPending;
  const hasUserMessage = messages.some(m => m.role === "user");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    const newMessages = [...messages, newUserMsg];
    setMessages(newMessages);
    setInput("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const apiMessages = newMessages.map(m => ({
      role: m.role,
      content: m.content
    }));

    sendMessage.mutate(
      { data: { messages: apiMessages } },
      {
        onSuccess: (data) => {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "assistant",
              content: data.message,
              timestamp: new Date()
            }
          ]);
        },
        onError: () => {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "assistant",
              content: "ただいま確認に時間がかかっています。担当者が確認します。",
              timestamp: new Date()
            }
          ]);
        }
      }
    );
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 80)}px`;
    }
  };

  const handleSampleClick = (q: string) => {
    setInput(q);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="flex justify-center bg-gray-100 min-h-[100dvh] w-full font-sans">
      <div className="w-full max-w-[480px] bg-background flex flex-col h-[100dvh] relative shadow-xl overflow-hidden">
        
        {/* Header */}
        <header className="bg-primary text-primary-foreground flex items-center px-4 py-3 shrink-0 z-10 shadow-sm relative">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg">りこんほっとLINE</h1>
              <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-sm font-medium border border-white/30 backdrop-blur-sm tracking-wider">デモ</span>
            </div>
            <p className="text-[10px] opacity-90 mt-0.5">AIは法律判断を行わず、相談内容の整理を行います</p>
          </div>
          <button
            onClick={() => setLocation("/audit")}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition-colors px-3 py-1.5 rounded-full text-[11px] font-medium border border-white/20"
            aria-label="監査ログを見る"
          >
            <ClipboardList size={13} />
            監査ログ
          </button>
        </header>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scroll-smooth">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <Avatar className="w-8 h-8 mr-2 shrink-0 border border-black/5 bg-white">
                  <AvatarFallback className="bg-white text-primary">
                    <UserIcon size={16} />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={`flex flex-col max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`px-3.5 py-2.5 shadow-sm text-[15px] leading-relaxed break-words whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-[18px] rounded-tr-[4px]"
                      : "bg-white text-gray-900 rounded-[18px] rounded-tl-[4px]"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-gray-500 mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex w-full justify-start animate-in fade-in duration-300">
              <Avatar className="w-8 h-8 mr-2 shrink-0 border border-black/5 bg-white">
                <AvatarFallback className="bg-white text-primary">
                  <UserIcon size={16} />
                </AvatarFallback>
              </Avatar>
              <div className="bg-white px-4 py-3.5 rounded-[18px] rounded-tl-[4px] shadow-sm flex items-center gap-1 h-10">
                <div className="w-2 h-2 bg-gray-400 rounded-full line-typing-dot" />
                <div className="w-2 h-2 bg-gray-400 rounded-full line-typing-dot" />
                <div className="w-2 h-2 bg-gray-400 rounded-full line-typing-dot" />
              </div>
            </div>
          )}

          {/* Sample Questions */}
          {!hasUserMessage && (
            <div className="flex flex-col gap-2 mt-2 max-w-[85%] mr-auto ml-10">
              {SAMPLE_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSampleClick(q)}
                  className="bg-white border border-primary/30 text-primary text-sm py-2 px-4 rounded-full text-left hover:bg-primary/5 transition-colors shadow-sm animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${(i + 1) * 150}ms`, animationFillMode: 'both' }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-2 pb-safe px-3 flex gap-2 items-end shrink-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            placeholder="メッセージを入力"
            disabled={isLoading}
            className="flex-1 bg-gray-100 rounded-2xl py-2.5 px-4 outline-none resize-none max-h-[80px] min-h-[40px] text-[15px] disabled:opacity-50 transition-all border border-transparent focus:border-primary/20 focus:bg-white"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-colors mb-0.5 ${
              input.trim() && !isLoading
                ? "bg-primary text-white"
                : "bg-gray-200 text-gray-400"
            }`}
          >
            <Send size={18} className={input.trim() && !isLoading ? "translate-x-[-1px] translate-y-[1px]" : "translate-x-[-1px]"} />
          </button>
        </div>

      </div>
    </div>
  );
}
