import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  X, 
  CheckCircle2, 
  Filter, 
  ArrowRight, 
  Sparkles, 
  Calendar,
  Sliders,
  Download,
  AlertCircle,
  Search,
  ChevronRight,
  Zap,
  Info
} from "lucide-react";
import { RowData, TableConfig } from "../types";
import { MAJOR_METADATA } from "../data";

export interface DeviationItem {
  id: string;
  date: string;
  majorName: string;
  totalTarget: number;
  totalActual: number;
  diff: number;
  rate: number; // percentage, e.g. 70.0
  deviationPct: number; // percentage, e.g. -30.0 or +35.0
  type: "underperforming" | "overachieving" | "unbudgeted";
  severity: "critical" | "warning" | "surging";
  note?: string;
  channels: {
    name: string;
    target: number;
    actual: number;
    diff: number;
    rate: number;
  }[];
  topChannel?: string;
  weakestChannel?: string;
  recommendation: string;
}

interface DeviationNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: RowData[];
  selectedDate: string;
  config: TableConfig;
  isDarkMode: boolean;
  thresholdPct: number;
  onThresholdPctChange: (pct: number) => void;
  onSelectMajorForFocus?: (majorName: string) => void;
}

export default function DeviationNotificationModal({
  isOpen,
  onClose,
  rows,
  selectedDate,
  config,
  isDarkMode,
  thresholdPct,
  onThresholdPctChange,
  onSelectMajorForFocus
}: DeviationNotificationModalProps) {
  const [activeTab, setActiveTab] = useState<"all" | "underperforming" | "overachieving">("all");
  const [dateScope, setDateScope] = useState<"current" | "all">("current");
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate deviation items based on scope and thresholdPct
  const deviationData = useMemo(() => {
    const targetRows = dateScope === "current"
      ? rows.filter((r) => r.date === selectedDate)
      : rows;

    const items: DeviationItem[] = [];

    targetRows.forEach((row) => {
      // Ignore merged group summary rows if present
      if (row.isMergedGroup) return;

      const totalTarget = row.channels.reduce((sum, ch) => sum + ch.target, 0);
      const totalActual = row.channels.reduce((sum, ch) => sum + ch.actual, 0) + row.other;
      const diff = totalActual - totalTarget;

      let rate = 0;
      let deviationPct = 0;
      let isFlagged = false;
      let type: "underperforming" | "overachieving" | "unbudgeted" = "underperforming";

      if (totalTarget > 0) {
        rate = (totalActual / totalTarget) * 100;
        deviationPct = ((totalActual - totalTarget) / totalTarget) * 100;
        if (Math.abs(deviationPct) >= thresholdPct) {
          isFlagged = true;
          type = deviationPct < 0 ? "underperforming" : "overachieving";
        }
      } else if (totalActual > 0) {
        // Unbudgeted actual surge
        rate = 100;
        deviationPct = 100;
        isFlagged = true;
        type = "unbudgeted";
      }

      if (isFlagged) {
        // Channel breakdown
        const channelDetails = row.channels.map((ch, idx) => {
          const chName = config.channels[idx] || `渠道${idx + 1}`;
          const chDiff = ch.actual - ch.target;
          const chRate = ch.target > 0 ? (ch.actual / ch.target) * 100 : (ch.actual > 0 ? 100 : 0);
          return {
            name: chName,
            target: ch.target,
            actual: ch.actual,
            diff: chDiff,
            rate: chRate
          };
        });

        // Sort channels to find top & weakest
        const sortedChs = [...channelDetails].sort((a, b) => b.diff - a.diff);
        const topCh = sortedChs[0]?.diff > 0 ? sortedChs[0].name : undefined;
        const weakestCh = sortedChs[sortedChs.length - 1]?.diff < 0 ? sortedChs[sortedChs.length - 1].name : undefined;

        // Determine severity
        let severity: "critical" | "warning" | "surging" = "warning";
        if (type === "underperforming") {
          severity = rate <= 60 || diff <= -5 ? "critical" : "warning";
        } else {
          severity = "surging";
        }

        // Generate intelligent recommendation
        let rec = "";
        if (type === "underperforming") {
          const absDiff = Math.abs(diff);
          rec = `该专业比计划偏低 ${absDiff} 人 (${Math.abs(deviationPct).toFixed(1)}%)。${
            weakestCh ? `主要由于「${weakestCh}」未达预期。` : ""
          } 建议安排团队重点对高意向客户进行二次回访，优先推进尾款交付。`;
        } else if (type === "overachieving") {
          rec = `该专业超过计划 ${diff} 人 (+${deviationPct.toFixed(1)}%)。${
            topCh ? `「${topCh}」带来主要增量。` : ""
          } 建议关注师资班型承载力，必要时申请扩增预科名额。`;
        } else {
          rec = `该专业原计划为0，实际录入 ${totalActual} 人，属于无预算爆发项目。建议补录计划或同步开班通知。`;
        }

        items.push({
          id: `${row.date}-${row.name}-${row.id}`,
          date: row.date,
          majorName: row.name,
          totalTarget,
          totalActual,
          diff,
          rate,
          deviationPct,
          type,
          severity,
          note: row.note,
          channels: channelDetails,
          topChannel: topCh,
          weakestChannel: weakestCh,
          recommendation: rec
        });
      }
    });

    // Sort: critical first, then largest negative deviation, then largest positive deviation
    return items.sort((a, b) => {
      if (a.severity === "critical" && b.severity !== "critical") return -1;
      if (b.severity === "critical" && a.severity !== "critical") return 1;
      return Math.abs(b.deviationPct) - Math.abs(a.deviationPct);
    });
  }, [rows, selectedDate, dateScope, thresholdPct, config.channels]);

  // Tab counts
  const counts = useMemo(() => {
    let under = 0;
    let over = 0;
    deviationData.forEach((item) => {
      if (item.type === "underperforming") under++;
      else over++;
    });
    return { all: deviationData.length, under, over };
  }, [deviationData]);

  // Filtered list
  const filteredData = useMemo(() => {
    return deviationData.filter((item) => {
      if (activeTab === "underperforming" && item.type !== "underperforming") return false;
      if (activeTab === "overachieving" && item.type === "underperforming") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.majorName.toLowerCase().includes(q) ||
          item.date.includes(q) ||
          (item.note && item.note.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [deviationData, activeTab, searchQuery]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalGap = deviationData
      .filter(i => i.diff < 0)
      .reduce((sum, i) => sum + Math.abs(i.diff), 0);
    const totalSurplus = deviationData
      .filter(i => i.diff > 0)
      .reduce((sum, i) => sum + i.diff, 0);

    return { totalGap, totalSurplus };
  }, [deviationData]);

  const handleExportReport = () => {
    if (deviationData.length === 0) return;
    const header = "日期,专业名称,计划目标,实际完成,差额,完成率,偏离幅度,预警类型,诊断与建议\n";
    const body = deviationData.map(i => 
      `"${i.date}","${i.majorName}",${i.totalTarget},${i.totalActual},${i.diff},"${i.rate.toFixed(1)}%","${i.deviationPct > 0 ? '+' : ''}${i.deviationPct.toFixed(1)}%","${i.type === 'underperforming' ? '滞后预警' : '超额爆发'}","${i.recommendation.replace(/"/g, '""')}"`
    ).join("\n");

    const blob = new Blob(["\uFEFF" + header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `招生计划偏离预警报告_${dateScope === 'current' ? selectedDate : '全时期'}_(±${thresholdPct}%).csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div key="deviation-notification-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`relative w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden z-10 ${
            isDarkMode
              ? "bg-slate-900 border-slate-800 text-slate-100"
              : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          {/* Top Banner & Header */}
          <div className={`p-4 md:p-5 border-b flex items-center justify-between shrink-0 ${
            isDarkMode 
              ? "bg-slate-950/60 border-slate-800" 
              : "bg-gradient-to-r from-rose-50/50 via-amber-50/30 to-emerald-50/40 border-slate-200/80"
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 shrink-0">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base md:text-lg font-black tracking-tight flex items-center gap-2">
                    招生计划偏离预警通知中心
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                    阈值: ±{thresholdPct}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  智能监控 daily 视图中实际报读与招生计划偏离 ≥±{thresholdPct}% 的专业明细
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDarkMode
                  ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300"
                  : "bg-white border-slate-200 hover:bg-slate-100 text-slate-600 shadow-xs"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Controls & Threshold Selector Toolbar */}
          <div className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs ${
            isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-slate-50 border-slate-200/70"
          }`}>
            {/* Left: Scope & Search */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Date Scope Buttons */}
              <div className={`flex p-0.5 rounded-lg border font-bold text-[11px] ${
                isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200 shadow-3xs"
              }`}>
                <button
                  type="button"
                  onClick={() => setDateScope("current")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    dateScope === "current"
                      ? "bg-rose-500 text-white font-extrabold shadow-xs"
                      : (isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900")
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>聚焦日 ({selectedDate})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDateScope("all")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    dateScope === "all"
                      ? "bg-rose-500 text-white font-extrabold shadow-xs"
                      : (isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900")
                  }`}
                >
                  <span>全历史日期库</span>
                </button>
              </div>

              {/* Threshold Selection */}
              <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200 dark:border-slate-800">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400">
                  偏离阈值:
                </span>
                <div className="flex gap-1">
                  {[10, 15, 20, 25, 30].map((pct, pctIdx) => (
                    <button
                      key={`thresh-pct-${pct}-${pctIdx}`}
                      type="button"
                      onClick={() => onThresholdPctChange(pct)}
                      className={`px-2 py-0.5 rounded font-mono font-extrabold text-[11px] transition-all cursor-pointer ${
                        thresholdPct === pct
                          ? "bg-amber-500 text-slate-950 shadow-xs"
                          : (isDarkMode ? "bg-slate-800 text-slate-400 hover:text-slate-200" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200")
                      }`}
                    >
                      ±{pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Search & Export */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索专业或备注..."
                  className={`w-full pl-8 pr-3 py-1 rounded-lg border text-xs outline-none transition-all ${
                    isDarkMode
                      ? "bg-slate-950 border-slate-800 text-white focus:border-rose-500"
                      : "bg-white border-slate-200 text-slate-800 focus:border-rose-500 shadow-3xs"
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={handleExportReport}
                disabled={deviationData.length === 0}
                className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  deviationData.length > 0
                    ? "bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-800 dark:hover:bg-slate-700 shadow-xs"
                    : "opacity-40 cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                }`}
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>导出预警 CSV</span>
              </button>
            </div>
          </div>

          {/* Metric Summary Bar */}
          <div className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 ${
            isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-100/60 border-slate-200/60"
          }`}>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">评估专业总数:</span>
                <span className="font-mono font-black text-slate-700 dark:text-slate-200">
                  {dateScope === "current" ? rows.filter(r => r.date === selectedDate).length : rows.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">偏离预警触发:</span>
                <span className="font-mono font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                  {deviationData.length} 个
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">计划总缺口人次:</span>
                <span className="font-mono font-black text-rose-600 dark:text-rose-400">
                  -{summaryMetrics.totalGap} 人
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">计划总超额人次:</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                  +{summaryMetrics.totalSurplus} 人
                </span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                全部 ({counts.all})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("underperforming")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === "underperforming"
                    ? "bg-rose-500 text-white shadow-2xs"
                    : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>🚨 严重滞后 ({counts.under})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("overachieving")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === "overachieving"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>🚀 极速超额 ({counts.over})</span>
              </button>
            </div>
          </div>

          {/* List Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredData.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                  暂无符合当前阈值 (±{thresholdPct}%) 的偏离预警专业
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  当前评估范围内所有专业的实际完成率均在正常计划区间内。您可以尝试降低阈值（如±10%或±15%）查看更细粒度的波动。
                </p>
              </div>
            ) : (
              filteredData.map((item, itemIdx) => {
                const isUnder = item.type === "underperforming";
                const meta = MAJOR_METADATA[item.majorName];

                return (
                  <div
                    key={`dev-item-${item.id}-${itemIdx}`}
                    className={`p-4 rounded-xl border transition-all duration-200 space-y-3 ${
                      isUnder
                        ? (isDarkMode
                            ? "bg-rose-950/20 border-rose-900/50 hover:border-rose-700"
                            : "bg-rose-50/40 border-rose-200/90 hover:border-rose-300 shadow-xs")
                        : (isDarkMode
                            ? "bg-emerald-950/20 border-emerald-900/50 hover:border-emerald-700"
                            : "bg-emerald-50/40 border-emerald-200/90 hover:border-emerald-300 shadow-xs")
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {dateScope === "all" && (
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-800 text-slate-200">
                            {item.date}
                          </span>
                        )}
                        <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                          {item.majorName}
                        </h3>
                        {meta && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                            ({meta.summary})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status Tag */}
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1 ${
                          isUnder
                            ? "bg-rose-500 text-white shadow-2xs"
                            : "bg-emerald-600 text-white shadow-2xs"
                        }`}>
                          {isUnder ? (
                            <>
                              <TrendingDown className="w-3.5 h-3.5" />
                              <span>严重滞后 {item.deviationPct.toFixed(1)}%</span>
                            </>
                          ) : (
                            <>
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span>超额爆发 +{item.deviationPct.toFixed(1)}%</span>
                            </>
                          )}
                        </span>

                        {/* Focus Button */}
                        {onSelectMajorForFocus && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectMajorForFocus(item.majorName);
                              onClose();
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1 ${
                              isDarkMode
                                ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-amber-400"
                                : "bg-white border-slate-200 hover:bg-slate-50 text-amber-600 shadow-2xs"
                            }`}
                            title="在数据表格中快速定位并修改"
                          >
                            <span>📌 表格定位</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress & Deviation Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            🎯 计划目标: <strong className="font-mono text-slate-800 dark:text-slate-100">{item.totalTarget}人</strong>
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            📈 实际登记: <strong className={`font-mono ${isUnder ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>{item.totalActual}人</strong>
                          </span>
                        </div>
                        <span className="font-mono font-extrabold text-xs text-slate-700 dark:text-slate-300">
                          完成度: {item.rate.toFixed(1)}% ({item.diff > 0 ? `+${item.diff}` : item.diff}人)
                        </span>
                      </div>

                      {/* Visual Progress Line */}
                      <div className="relative w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isUnder ? "bg-rose-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(item.rate, 100)}%` }}
                        />
                        {/* 100% Target Reference Line */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-900 dark:bg-white z-10 opacity-70"
                          style={{ left: "100%" }}
                        />
                      </div>
                    </div>

                    {/* Channel Pills Breakdown */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        各渠道明细:
                      </span>
                      {item.channels.map((ch, cIdx) => (
                        <span
                          key={`ch-pill-${ch.name}-${cIdx}`}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                            ch.diff < 0
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              : ch.diff > 0
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-slate-200/50 dark:bg-slate-800 text-slate-500"
                          }`}
                        >
                          <span>{ch.name}:</span>
                          <span>{ch.actual}/{ch.target}</span>
                          <span className="opacity-75">
                            ({ch.diff > 0 ? `+${ch.diff}` : ch.diff})
                          </span>
                        </span>
                      ))}
                    </div>

                    {/* Recommendation Box */}
                    <div className={`p-2.5 rounded-xl text-xs leading-relaxed flex items-start gap-2 ${
                      isDarkMode ? "bg-slate-950/60 text-slate-300" : "bg-white text-slate-700 border border-slate-200/80"
                    }`}>
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold text-amber-600 dark:text-amber-400 mr-1">
                          预警诊断建议:
                        </span>
                        <span>{item.recommendation}</span>
                        {item.note && (
                          <div className="mt-1 pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
                            📝 登记备注: <span className="italic text-slate-600 dark:text-slate-300">{item.note}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className={`p-4 border-t flex items-center justify-between text-xs shrink-0 ${
            isDarkMode ? "bg-slate-950/60 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
          }`}>
            <div className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-500" />
              <span>提示: 偏差率计算公式为 <code>(实际 - 计划) / 计划 * 100%</code></span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-1.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all cursor-pointer shadow-xs"
            >
              了解并关闭
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
