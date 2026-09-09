import React, { useState, useEffect } from "react";
import { RowData } from "../types";
import { X, Copy, Check, Sparkles, Loader2, MessageSquare, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

interface EnrollmentSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  rows: RowData[];
  isDarkMode: boolean;
  viewMode: "daily" | "monthly";
}

export default function EnrollmentSummaryModal({
  isOpen,
  onClose,
  date,
  rows,
  isDarkMode,
  viewMode
}: EnrollmentSummaryModalProps) {
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // Filter rows active for the selected date
  const activeRows = viewMode === "daily"
    ? rows.filter((r) => r.date === date)
    : rows.filter((r) => r.date.startsWith(date.substring(0, 7)));

  const generateSummary = async () => {
    setLoading(true);
    setError("");
    setSummary("");
    setCopied(false);

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: viewMode === "daily" ? date : `${date.substring(0, 7)}月份汇总`,
          rows: activeRows,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "生成综述时发生未知错误");
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err: any) {
      console.error("生成招生综述失败:", err);
      setError(err.message || "请求服务器失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // Automatically trigger generation when the modal is opened
  useEffect(() => {
    if (isOpen) {
      generateSummary();
    }
  }, [isOpen, date, viewMode]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className={`rounded-2xl shadow-2xl max-w-lg w-full border overflow-hidden ${
          isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
        }`}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"
        }`}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-500">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm">
                AI 智能生成{viewMode === "daily" ? "今日" : "本月"}招生综述
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                基于【{viewMode === "daily" ? date : `${date.substring(0, 7)}月`}】的专业数据及备注一键撰写
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="relative">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 animate-ping" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  AI 正在深度分析各项专业招生指标...
                </p>
                <p className="text-[10px] text-slate-400">
                  提炼亮点渠道与备注异常原因，这可能需要几秒钟
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-3 bg-red-500/10 rounded-full text-red-500">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-red-500">生成招生综述失败</p>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                  {error}
                </p>
              </div>
              <button
                onClick={generateSummary}
                className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>重试生成</span>
              </button>
            </div>
          )}

          {!loading && !error && summary && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                <span>日报预览 (Daily Report Draft)</span>
                <span className="text-indigo-500">双击或点击下方复制</span>
              </div>

              <div className={`p-4 rounded-xl border text-xs leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap ${
                isDarkMode 
                  ? "bg-slate-950 border-slate-800 text-slate-200" 
                  : "bg-slate-50/70 border-slate-150 text-slate-800"
              }`}>
                {summary}
              </div>

              <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-[10px] text-indigo-500/80 leading-relaxed flex items-start gap-2">
                <MessageSquare className="w-4 h-4 shrink-0 text-indigo-500 mt-0.5" />
                <span>
                  本摘要文案支持一键点击复制，排版已专为微信/企业微信/钉钉招生工作汇报群进行了优化。
                </span>
              </div>
            </div>
          )}

          {!loading && !error && !summary && activeRows.length === 0 && (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-slate-400">
                选中时间段内暂无可用招生数据，无法生成综述
              </p>
              <p className="text-[10px] text-slate-500">
                请先在主表格中填写专业完成量及相关异常备注
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`flex items-center justify-between px-5 py-3 border-t ${
          isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-150"
        }`}>
          <div className="text-[10px] text-slate-400">
            {activeRows.length > 0 ? `包含 ${activeRows.length} 个专业条目` : "无数据条目"}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                isDarkMode ? "text-slate-450" : "text-slate-600"
              }`}
            >
              关闭
            </button>

            {summary && (
              <>
                <button
                  type="button"
                  onClick={generateSummary}
                  disabled={loading}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border flex items-center gap-1.5 cursor-pointer transition-colors ${
                    isDarkMode 
                      ? "border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300" 
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>重新生成</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-4 py-1.5 text-[11px] text-white font-bold rounded-lg shadow-sm cursor-pointer transition-all duration-200 ${
                    copied 
                      ? "bg-emerald-500 hover:bg-emerald-600" 
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>已成功复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>复制工作群文案</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
