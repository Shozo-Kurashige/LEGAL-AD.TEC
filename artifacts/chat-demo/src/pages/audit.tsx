import { useGetAuditLogs } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { ArrowLeft, RefreshCw, ShieldAlert, AlertTriangle } from "lucide-react";

export default function AuditPage() {
  const [, setLocation] = useLocation();
  const { data, isLoading, isError, refetch, isFetching } = useGetAuditLogs();

  const logs = data?.logs ?? [];

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("ja-JP", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const truncate = (text: string, len = 40) =>
    text.length > len ? text.slice(0, len) + "…" : text;

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3 shadow-sm shrink-0">
        <button
          onClick={() => setLocation("/")}
          className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          aria-label="チャットに戻る"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-base">監査ログ</h1>
          <p className="text-[10px] opacity-90">AI相談の入力・出力・リスク検知を記録</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1.5 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
          aria-label="更新"
        >
          <RefreshCw size={18} className={isFetching ? "animate-spin" : ""} />
        </button>
      </header>

      {/* Description */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 text-xs text-gray-600 leading-relaxed">
        この画面では、AI相談の入力・出力・非弁リスク検知・フォールバック発生を確認できます。PoCでは、このログをもとに回答品質と安全性を改善します。
      </div>

      {/* Stats Bar */}
      {logs.length > 0 && (
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex gap-4 text-xs text-gray-500">
          <span>全 <strong className="text-gray-800">{logs.length}</strong> 件</span>
          <span className="text-amber-600 flex items-center gap-1">
            <ShieldAlert size={12} />
            非弁検知 <strong>{logs.filter(l => l.nonBenFlag).length}</strong> 件
          </span>
          <span className="text-red-500 flex items-center gap-1">
            <AlertTriangle size={12} />
            フォールバック <strong>{logs.filter(l => l.fallbackFlag).length}</strong> 件
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading && (
          <div className="flex justify-center items-center h-40 text-gray-400 text-sm">
            読み込み中...
          </div>
        )}

        {isError && (
          <div className="flex justify-center items-center h-40 text-red-500 text-sm">
            ログの取得に失敗しました
          </div>
        )}

        {!isLoading && !isError && logs.length === 0 && (
          <div className="flex flex-col justify-center items-center h-40 text-gray-400 text-sm gap-2">
            <p>まだ監査ログがありません</p>
            <p className="text-xs">チャットで相談を送信するとログが記録されます</p>
          </div>
        )}

        {!isLoading && !isError && logs.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full text-xs bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-left">
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">時刻</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">ユーザー入力</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">AI応答</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap text-center">非弁</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">検知キーワード</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap text-center">FB</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const isNonBen = log.nonBenFlag;
                  const isFallback = log.fallbackFlag;
                  const rowClass = isNonBen
                    ? "bg-amber-50 border-l-4 border-amber-400"
                    : isFallback
                    ? "bg-red-50 border-l-4 border-red-300"
                    : i % 2 === 0
                    ? "bg-white"
                    : "bg-gray-50";

                  return (
                    <tr key={log.id} className={`${rowClass} border-b border-gray-100 hover:brightness-95 transition-all`}>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                        {formatTime(log.createdAt)}
                      </td>
                      <td className="px-3 py-2.5 max-w-[160px]">
                        <span title={log.userMessage} className="text-gray-800 leading-relaxed">
                          {truncate(log.userMessage, 35)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 max-w-[180px]">
                        <span title={log.aiResponse} className="text-gray-600 leading-relaxed">
                          {truncate(log.aiResponse, 40)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {isNonBen ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-white font-bold text-[10px]">
                            !
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 max-w-[120px]">
                        {log.nonBenTrigger ? (
                          <span className="text-amber-700 font-medium">
                            {log.nonBenTrigger}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {isFallback ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-400 text-white font-bold text-[10px]">
                            F
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
