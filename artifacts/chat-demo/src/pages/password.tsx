import { useState } from "react";

interface PasswordPageProps {
  onSuccess: () => void;
}

export default function PasswordPage({ onSuccess }: PasswordPageProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json() as { success: boolean; error?: string };

      if (data.success) {
        sessionStorage.setItem("app_auth", "1");
        onSuccess();
      } else {
        setError(data.error ?? "パスワードが違います");
        setPassword("");
      }
    } catch {
      setError("接続エラーが発生しました。再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center bg-gray-100 min-h-[100dvh] w-full font-sans">
      <div className="w-full max-w-[480px] bg-white flex flex-col h-[100dvh] shadow-xl">

        {/* Header */}
        <header className="bg-primary text-white flex items-center px-4 py-3 shrink-0 shadow-sm">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg">りこんほっとLINE</h1>
              <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-sm font-medium border border-white/30 tracking-wider">デモ</span>
            </div>
            <p className="text-[10px] opacity-90 mt-0.5">AIは法律判断を行わず、相談内容の整理を行います</p>
          </div>
        </header>

        {/* Password Form */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">アクセス確認</h2>
              <p className="text-sm text-gray-500">パスワードを入力してください</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード"
                disabled={loading}
                autoFocus
                data-testid="input-password"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 disabled:opacity-50 transition-all bg-gray-50 focus:bg-white"
              />

              {error && (
                <p data-testid="text-error" className="text-sm text-red-500 text-center">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!password.trim() || loading}
                data-testid="button-submit"
                className="w-full py-3 rounded-xl font-semibold text-white text-[15px] transition-all bg-primary disabled:opacity-40 active:scale-[0.98]"
              >
                {loading ? "確認中..." : "入力"}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
