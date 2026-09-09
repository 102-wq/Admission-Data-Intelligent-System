import React, { useState, useMemo, useEffect, useCallback } from "react";
import { RowData, TableConfig } from "../types";
import { 
  X, TrendingUp, Target, Layers, Calendar, BarChart2, 
  CheckCircle2, AlertTriangle, Trophy, Zap, Activity, Filter, Maximize2, Sparkles, History,
  ArrowUpRight, ArrowDownRight, Users, PieChart as PieChartIcon, LineChart as LineChartIcon, Clock,
  Copy, Download, Check, Share2, Award, ChevronRight, BarChart3, LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import D3HistoryComparisonChart from "./D3HistoryComparisonChart";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  PieChart as RechartsPieChart,
  Pie,
  Sector
} from "recharts";

interface MajorChannelDetailModalProps {
  isOpen?: boolean;
  onClose: () => void;
  majorName: string;
  rows: RowData[];
  config?: TableConfig;
  isDarkMode: boolean;
  selectedDate: string;
  onOpenTrendModal?: (majorName: string) => void;
}

export default function MajorChannelDetailModal({
  isOpen = true,
  onClose,
  majorName,
  rows,
  config,
  isDarkMode,
  selectedDate,
  onOpenTrendModal
}: MajorChannelDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "7day_trend" | "channel_lines" | "cumulative_path" | "channel_table" | "history_comparison">("dashboard");
  const [dateScope, setDateScope] = useState<"month" | "all">("month");
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Channel color palette with high aesthetic contrast
  const channelColors = [
    "#3b82f6", // 线上推广 - Blue
    "#10b981", // 线下宣讲 - Emerald
    "#f59e0b", // 转介绍 - Amber
    "#8b5cf6", // 高中合作 - Purple
    "#ec4899", // 社媒引流 - Pink
    "#06b6d4", // 招生简章 - Cyan
    "#64748b"  // 其它渠道 - Slate
  ];

  const monthPrefix = selectedDate ? selectedDate.substring(0, 7) : new Date().toISOString().substring(0, 7);
  const channelNames = config?.channels || [
    "线上推广", "线下宣讲", "转介绍", "高中合作", "社媒引流", "招生简章", "其它渠道"
  ];

  // Filter rows for this major
  const majorRows = useMemo(() => {
    if (!isOpen || !majorName) return [];
    return rows.filter((r) => {
      if (r.name !== majorName) return false;
      if (dateScope === "month") {
        return r.date.startsWith(monthPrefix);
      }
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [rows, majorName, dateScope, monthPrefix, isOpen]);

  // Prepare daily data array for active dateScope
  const dailyData = useMemo(() => {
    if (!isOpen || !majorName) return [];
    let cumActualSum = 0;
    let cumTargetSum = 0;

    return majorRows.map((row) => {
      const channelActuals: { [key: string]: number } = {};
      const channelTargets: { [key: string]: number } = {};
      let dayActualTotal = 0;
      let dayTargetTotal = 0;

      channelNames.forEach((name, idx) => {
        const ch = row.channels && row.channels[idx] ? row.channels[idx] : { target: 0, actual: 0 };
        const a = typeof ch.actual === "number" ? ch.actual : Number(ch.actual) || 0;
        const t = typeof ch.target === "number" ? ch.target : Number(ch.target) || 0;
        channelActuals[name] = a;
        channelTargets[name] = t;
        dayActualTotal += a;
        dayTargetTotal += t;
      });

      const otherActual = typeof row.other === "number" ? row.other : (typeof row.other === "object" && row.other !== null && "actual" in row.other ? (row.other as { actual: number }).actual : 0);
      channelActuals["其它/补录"] = otherActual;
      dayActualTotal += otherActual;

      cumActualSum += dayActualTotal;
      cumTargetSum += dayTargetTotal;

      const shortDate = row.date.length >= 10 ? row.date.substring(5) : row.date;

      return {
        date: row.date,
        shortDate,
        dayActualTotal,
        dayTargetTotal,
        cumActual: cumActualSum,
        cumTarget: cumTargetSum,
        ...channelActuals
      };
    });
  }, [majorRows, channelNames, isOpen, majorName]);

  // Calculate Past 7 Days Growth Trend Data for this major only
  const last7DaysData = useMemo(() => {
    if (!isOpen || !majorName) return [];
    const sortedMajorRows = rows
      .filter((r) => r.name === majorName && !r.isMergedGroup && r.date <= (selectedDate || "9999-12-31"))
      .sort((a, b) => a.date.localeCompare(b.date));

    const sliced = sortedMajorRows.slice(-7);
    const final7 = sliced.length > 0 ? sliced : sortedMajorRows.slice(-7);

    let cum7 = 0;
    return final7.map((row, idx) => {
      let dayActualTotal = 0;
      let dayTargetTotal = 0;
      const channelVals: { [key: string]: number } = {};

      channelNames.forEach((cName, cIdx) => {
        const ch = row.channels && row.channels[cIdx] ? row.channels[cIdx] : { target: 0, actual: 0 };
        const a = typeof ch.actual === "number" ? ch.actual : Number(ch.actual) || 0;
        const t = typeof ch.target === "number" ? ch.target : Number(ch.target) || 0;
        channelVals[cName] = a;
        dayActualTotal += a;
        dayTargetTotal += t;
      });

      const otherActual = typeof row.other === "number" ? row.other : (typeof row.other === "object" && row.other !== null && "actual" in row.other ? (row.other as { actual: number }).actual : 0);
      channelVals["其它/补录"] = otherActual;
      dayActualTotal += otherActual;

      cum7 += dayActualTotal;

      const shortDate = row.date.length >= 10 ? row.date.substring(5) : row.date;

      // Day over day calculation
      let prevVal = 0;
      if (idx > 0) {
        const prevRow = final7[idx - 1];
        const pCh = prevRow.channels ? prevRow.channels.reduce((sum, c) => sum + (Number(c.actual) || 0), 0) : 0;
        const pO = typeof prevRow.other === "number" ? prevRow.other : (typeof prevRow.other === "object" && prevRow.other !== null && "actual" in prevRow.other ? (prevRow.other as { actual: number }).actual : 0);
        prevVal = pCh + pO;
      }
      const diff = idx > 0 ? dayActualTotal - prevVal : 0;

      // Top channel on that day
      let topChName = channelNames[0] || "线上推广";
      let topChVal = -1;
      Object.entries(channelVals).forEach(([cn, val]) => {
        if (val > topChVal) {
          topChVal = val;
          topChName = cn;
        }
      });

      return {
        date: row.date,
        shortDate,
        dayActualTotal,
        dayTargetTotal,
        cum7,
        diff,
        topChName,
        topChVal,
        ...channelVals
      };
    });
  }, [rows, majorName, selectedDate, channelNames]);

  // 7-day metrics
  const total7DayActual = last7DaysData.reduce((acc, d) => acc + d.dayActualTotal, 0);
  const avg7DayActual = last7DaysData.length > 0 ? (total7DayActual / last7DaysData.length) : 0;
  const peak7Day = [...last7DaysData].sort((a, b) => b.dayActualTotal - a.dayActualTotal)[0];

  // Aggregated Channel Stats for the selected scope
  const channelAggregates = channelNames.map((name, idx) => {
    let tSum = 0;
    let aSum = 0;

    majorRows.forEach((r) => {
      const ch = r.channels && r.channels[idx] ? r.channels[idx] : { target: 0, actual: 0 };
      tSum += typeof ch.target === "number" ? ch.target : Number(ch.target) || 0;
      aSum += typeof ch.actual === "number" ? ch.actual : Number(ch.actual) || 0;
    });

    const rate = tSum > 0 ? (aSum / tSum) * 100 : 0;
    return {
      name,
      target: tSum,
      actual: aSum,
      rate,
      gap: Math.max(0, tSum - aSum),
      color: channelColors[idx % channelColors.length]
    };
  });

  // Calculate other/supplemental actual
  const otherTotal = majorRows.reduce((acc, r) => {
    const o = typeof r.other === "number" ? r.other : (typeof r.other === "object" && r.other !== null && "actual" in r.other ? (r.other as { actual: number }).actual : 0);
    return acc + Number(o || 0);
  }, 0);

  // Calculate total major stats
  const totalTarget = channelAggregates.reduce((acc, c) => acc + c.target, 0);
  const channelActualTotal = channelAggregates.reduce((acc, c) => acc + c.actual, 0);
  const totalActual = channelActualTotal + otherTotal;
  const overallRate = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
  const totalGap = Math.max(0, totalTarget - totalActual);
  const totalSurplus = Math.max(0, totalActual - totalTarget);

  // Pie chart data preparation for channel contribution
  const pieChartData = useMemo(() => {
    if (!isOpen || !majorName) return [];
    const items = channelAggregates
      .filter((c) => c.actual > 0)
      .map((c) => ({
        name: c.name,
        value: c.actual,
        target: c.target,
        rate: c.rate,
        color: c.color,
        pct: totalActual > 0 ? Number(((c.actual / totalActual) * 100).toFixed(1)) : 0
      }));

    if (otherTotal > 0) {
      items.push({
        name: "其它/补录",
        value: otherTotal,
        target: 0,
        rate: 100,
        color: "#64748b",
        pct: totalActual > 0 ? Number(((otherTotal / totalActual) * 100).toFixed(1)) : 0
      });
    }

    // Sort by actual contribution descending
    return items.sort((a, b) => b.value - a.value);
  }, [channelAggregates, otherTotal, totalActual, isOpen, majorName]);

  // Find top channel
  const topChannel = pieChartData[0] || null;

  const theme = {
    bg: isDarkMode ? "bg-slate-950" : "bg-slate-50",
    cardBg: isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80 shadow-2xs",
    textPrimary: isDarkMode ? "text-slate-100" : "text-slate-900",
    textSecondary: isDarkMode ? "text-slate-400" : "text-slate-500",
    grid: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
    axisText: isDarkMode ? "#94a3b8" : "#64748b"
  };

  // Copy Briefing to Clipboard
  const handleCopySummary = () => {
    const summaryText = [
      `📊 【${majorName}】专业招生深度分析报告`,
      `📅 统计截止: ${selectedDate} | 统计范围: ${dateScope === "month" ? `当月 (${monthPrefix})` : "全时域"}`,
      `🎯 招生目标: ${totalTarget}人 | 实际完成: ${totalActual}人 | 达成率: ${overallRate.toFixed(1)}%`,
      `📈 近7天招生总量: ${total7DayActual}人 | 日均招募: ${avg7DayActual.toFixed(1)}人/天 | 7天单日峰值: ${peak7Day ? `${peak7Day.dayActualTotal}人 (${peak7Day.shortDate})` : "无"}`,
      `🏆 主力贡献渠道: ${topChannel ? `${topChannel.name} (贡献 ${topChannel.value}人, 占比 ${topChannel.pct}%)` : "无"}`,
      `📋 各渠道贡献详情:`,
      ...pieChartData.map((p, i) => `  ${i + 1}. ${p.name}: ${p.value}人 (占 ${p.pct}%, 渠道达成率 ${p.rate.toFixed(1)}%)`),
      `\n由招生管理与分析决策看板自动生成`
    ].join("\n");

    navigator.clipboard.writeText(summaryText);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  if (!isOpen || !majorName) return null;

  return (
    <AnimatePresence>
      <div 
        key="major-channel-detail-modal-overlay"
        id="major-channel-detail-modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      >
        <motion.div
          id="major-analysis-dashboard-panel"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className={`w-full max-w-6xl max-h-[94vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
            isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100 ring-1 ring-slate-700/50" : "bg-white border-slate-200 text-slate-800"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 ${
            isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50/90 border-slate-200/80"
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>【{majorName}】专业招生深度分析看板</span>
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    达成率 {overallRate.toFixed(1)}%
                  </span>
                  {overallRate >= 100 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-400/40 flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-amber-500" />
                      提前达标
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span className="text-indigo-500 dark:text-indigo-400 font-bold">Major Analysis Dashboard</span>
                  <span>•</span>
                  <span>各渠道贡献占比饼图 & 7天招生走势洞察</span>
                  <span>•</span>
                  <span>统计截止: {selectedDate}</span>
                </p>
              </div>
            </div>

            {/* Scope Toggle & Actions & Close */}
            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              <button
                type="button"
                id="btn-copy-major-summary"
                onClick={handleCopySummary}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="一键复制该专业招生简要报告"
              >
                {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedToast ? "已复制简报" : "复制简报"}</span>
              </button>

              {onOpenTrendModal && (
                <button
                  type="button"
                  id="btn-ai-trend-modal"
                  onClick={() => onOpenTrendModal(majorName)}
                  className="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="调起 AI 招生走势与多维预测分析"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>AI 趋势预测</span>
                </button>
              )}

              <div className={`flex p-0.5 rounded-lg border text-xs ${
                isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              }`}>
                <button
                  type="button"
                  onClick={() => setDateScope("month")}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    dateScope === "month"
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                >
                  当月 ({monthPrefix})
                </button>
                <button
                  type="button"
                  onClick={() => setDateScope("all")}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    dateScope === "all"
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                >
                  全时间域
                </button>
              </div>

              <button
                type="button"
                id="btn-close-major-modal"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="关闭弹窗 (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Top KPI Analytics Bar */}
          <div className={`px-6 py-3 border-b grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0 ${
            isDarkMode ? "bg-slate-950/60 border-slate-800/80" : "bg-slate-100/70 border-slate-200/70"
          }`}>
            <div className={`p-2.5 rounded-xl border flex items-center gap-3 ${theme.cardBg}`}>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 font-bold block">实际 / 计划总额</span>
                <span className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400 truncate block">
                  {totalActual} <span className="text-xs text-slate-400 font-normal">/ {totalTarget} 人</span>
                </span>
                <div className="text-[9px] text-slate-400 truncate">
                  {totalSurplus > 0 ? `超额 +${totalSurplus}人` : totalGap > 0 ? `尚缺 ${totalGap}人` : "已刚好满额"}
                </div>
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border flex items-center gap-3 ${theme.cardBg}`}>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 font-bold block">近 7 天招生总量</span>
                <span className="text-sm font-mono font-black text-indigo-600 dark:text-indigo-400 truncate block">
                  {total7DayActual} <span className="text-xs text-slate-400 font-normal">人</span>
                </span>
                <div className="text-[9px] text-slate-400 truncate">
                  7天日均 <strong className="font-mono text-indigo-500">{avg7DayActual.toFixed(1)}</strong> 人/天
                </div>
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border flex items-center gap-3 ${theme.cardBg}`}>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 font-bold block">主力渠道 (Top 1)</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate block">
                  {topChannel ? topChannel.name : "暂无数据"}
                </span>
                <div className="text-[9px] text-amber-600 dark:text-amber-400 font-mono font-bold truncate">
                  {topChannel ? `贡献 ${topChannel.value}人 (占 ${topChannel.pct}%)` : "-"}
                </div>
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border flex items-center gap-3 ${theme.cardBg}`}>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 font-bold block">7天单日峰值</span>
                <span className="text-xs font-mono font-black text-purple-600 dark:text-purple-400 truncate block">
                  {peak7Day ? `${peak7Day.dayActualTotal}人` : "0人"}
                </span>
                <div className="text-[9px] text-slate-400 truncate">
                  发生于 {peak7Day ? peak7Day.shortDate : "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 pt-2.5 border-b dark:border-slate-800 border-slate-200 flex items-center gap-2 shrink-0 overflow-x-auto">
            <button
              type="button"
              id="tab-major-dashboard"
              onClick={() => setActiveTab("dashboard")}
              className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === "dashboard"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>深度分析看板 (Dashboard)</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                核心
              </span>
            </button>

            <button
              type="button"
              id="tab-major-7day-trend"
              onClick={() => setActiveTab("7day_trend")}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === "7day_trend"
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>7天复合走势与均线</span>
            </button>

            <button
              type="button"
              id="tab-major-channel-lines"
              onClick={() => setActiveTab("channel_lines")}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === "channel_lines"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>各渠道走势拆解</span>
            </button>

            <button
              type="button"
              id="tab-major-cumulative-path"
              onClick={() => setActiveTab("cumulative_path")}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === "cumulative_path"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>目标达成路径 vs 累计</span>
            </button>

            <button
              type="button"
              id="tab-major-channel-table"
              onClick={() => setActiveTab("channel_table")}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === "channel_table"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>全渠道明细矩阵</span>
            </button>

            <button
              type="button"
              id="tab-major-history"
              onClick={() => setActiveTab("history_comparison")}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === "history_comparison"
                  ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              <History className="w-3.5 h-3.5 text-emerald-500" />
              <span>历史对比 (D3)</span>
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 thin-scrollbar">
            {dailyData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2 border-2 border-dashed rounded-2xl dark:border-slate-800 border-slate-200">
                <BarChart2 className="w-8 h-8 opacity-40" />
                <p className="text-xs font-bold">当前筛选区间内暂无【{majorName}】的详细每日登记数据</p>
              </div>
            ) : (
              <>
                {/* TAB 1 (DEFAULT): MAJOR ANALYSIS DASHBOARD - PIE CHART + 7-DAY TREND LINE */}
                {activeTab === "dashboard" && (
                  <div className="space-y-6">
                    {/* Visual Deck Split 2-Column: Left Pie Chart (Channel Breakdown), Right 7-Day Trend Line (Major Only) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      
                      {/* Left: Channel Contribution Breakdown via Pie / Donut Chart */}
                      <div className={`lg:col-span-6 p-4 sm:p-5 rounded-2xl border ${theme.cardBg} flex flex-col justify-between space-y-4`}>
                        <div className="flex items-center justify-between border-b pb-3 border-current/10">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                              <PieChartIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <span>各招生渠道贡献分布</span>
                                <span className="text-[10px] px-2 py-0.2 rounded-full font-mono font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                                  占比分析
                                </span>
                              </h3>
                              <p className="text-[10.5px] text-slate-400 mt-0.5">
                                该专业各渠道实际报到人数在总招募中的比重拆解
                              </p>
                            </div>
                          </div>

                          <div className="text-right font-mono">
                            <span className="text-[9px] text-slate-400 block">有效渠道数</span>
                            <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                              {pieChartData.length} 个
                            </span>
                          </div>
                        </div>

                        {/* Donut / Pie Chart View */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4 min-h-[220px]">
                          {/* Pie Canvas */}
                          <div className="sm:col-span-6 h-56 relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsPieChart>
                                <Tooltip
                                  content={({ active, payload }: any) => {
                                    if (!active || !payload || !payload.length) return null;
                                    const d = payload[0]?.payload;
                                    if (!d) return null;
                                    return (
                                      <div className={`p-2.5 rounded-xl border shadow-xl text-xs font-mono space-y-1 ${
                                        isDarkMode ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
                                      }`}>
                                        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 pb-1 border-b border-current/10">
                                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                                          <span>{d.name}</span>
                                        </div>
                                        <div className="flex justify-between gap-4 text-slate-500 dark:text-slate-400">
                                          <span>实际招录:</span>
                                          <strong className="text-emerald-600 dark:text-emerald-400">{d.value} 人</strong>
                                        </div>
                                        <div className="flex justify-between gap-4 text-slate-500 dark:text-slate-400">
                                          <span>专业总贡献比:</span>
                                          <strong className="text-indigo-600 dark:text-indigo-400">{d.pct}%</strong>
                                        </div>
                                        {d.target > 0 && (
                                          <div className="flex justify-between gap-4 text-slate-500 dark:text-slate-400">
                                            <span>渠道目标:</span>
                                            <span>{d.target} 人 ({d.rate.toFixed(1)}%)</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }}
                                />
                                <Pie
                                  data={pieChartData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={52}
                                  outerRadius={80}
                                  paddingAngle={3}
                                  dataKey="value"
                                  onMouseEnter={(_, index) => setActivePieIndex(index)}
                                  onMouseLeave={() => setActivePieIndex(null)}
                                >
                                  {pieChartData.map((entry, index) => (
                                    <Cell
                                      key={`pie-cell-${entry.name}-${index}`}
                                      fill={entry.color}
                                      stroke={isDarkMode ? "#0f172a" : "#ffffff"}
                                      strokeWidth={activePieIndex === index ? 3 : 1.5}
                                      style={{
                                        filter: activePieIndex === index ? "drop-shadow(0px 0px 8px rgba(99,102,241,0.5))" : "none",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease"
                                      }}
                                    />
                                  ))}
                                </Pie>
                              </RechartsPieChart>
                            </ResponsiveContainer>

                            {/* Center Readout in Donut */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">总招生</span>
                              <span className="text-base font-black font-mono text-slate-900 dark:text-slate-100">
                                {totalActual}<span className="text-[9px] text-slate-400 font-normal">人</span>
                              </span>
                              <span className="text-[8.5px] font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                                {overallRate.toFixed(0)}% 达成
                              </span>
                            </div>
                          </div>

                          {/* Channel Breakdown List alongside Pie */}
                          <div className="sm:col-span-6 space-y-1.5 max-h-56 overflow-y-auto pr-1 thin-scrollbar">
                            {pieChartData.map((item, idx) => (
                              <div
                                key={`legend-ch-${item.name}-${idx}`}
                                onMouseEnter={() => setActivePieIndex(idx)}
                                onMouseLeave={() => setActivePieIndex(null)}
                                className={`p-1.5 rounded-lg border text-xs font-mono transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                  activePieIndex === idx
                                    ? "bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/30"
                                    : "bg-black/5 dark:bg-white/5 border-transparent hover:border-current/15"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                  <span className="font-bold text-[11px] truncate text-slate-800 dark:text-slate-200">
                                    {item.name}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100">
                                    {item.value}人
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded font-extrabold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 min-w-[42px] text-right">
                                    {item.pct}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: 7-Day Trend Line for this major only */}
                      <div className={`lg:col-span-6 p-4 sm:p-5 rounded-2xl border ${theme.cardBg} flex flex-col justify-between space-y-4`}>
                        <div className="flex items-center justify-between border-b pb-3 border-current/10">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                              <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <span>近 7 天招生增长走势 (该专业专享)</span>
                                <span className="text-[10px] px-2 py-0.2 rounded-full font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                  7-Day Trend
                                </span>
                              </h3>
                              <p className="text-[10.5px] text-slate-400 mt-0.5">
                                仅展示【{majorName}】每日新增招募人数与7天均线对照
                              </p>
                            </div>
                          </div>

                          <div className="text-right font-mono">
                            <span className="text-[9px] text-slate-400 block">7天日均基准</span>
                            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                              {avg7DayActual.toFixed(1)} 人/天
                            </span>
                          </div>
                        </div>

                        {/* 7-Day Line Chart Canvas */}
                        <div className="h-56 w-full pt-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={last7DaysData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorMajorTrend7" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
                              <XAxis 
                                dataKey="shortDate" 
                                stroke={theme.axisText} 
                                tick={{ fontSize: 10.5, fontWeight: "bold" }}
                              />
                              <YAxis 
                                stroke={theme.axisText} 
                                tick={{ fontSize: 10.5 }}
                                unit="人"
                              />
                              <Tooltip
                                content={({ active, payload }: any) => {
                                  if (!active || !payload || !payload.length) return null;
                                  const d = payload[0]?.payload;
                                  if (!d) return null;
                                  return (
                                    <div className={`p-2.5 rounded-xl border shadow-xl text-xs font-mono space-y-1 ${
                                      isDarkMode ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
                                    }`}>
                                      <div className="font-extrabold text-slate-900 dark:text-slate-100 pb-1 border-b border-current/10 flex justify-between gap-3">
                                        <span>📅 {d.date}</span>
                                        <span className="text-emerald-500 font-bold">当日新增</span>
                                      </div>
                                      <div className="flex justify-between gap-4">
                                        <span className="text-slate-400">单日招募:</span>
                                        <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-black">{d.dayActualTotal} 人</strong>
                                      </div>
                                      {d.diff !== 0 && (
                                        <div className="flex justify-between gap-4">
                                          <span className="text-slate-400">较前一日:</span>
                                          <span className={`font-bold ${d.diff > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                            {d.diff > 0 ? `+${d.diff}` : d.diff} 人
                                          </span>
                                        </div>
                                      )}
                                      <div className="flex justify-between gap-4 pt-1 border-t border-current/10 text-[10px]">
                                        <span className="text-slate-400">当日主力:</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{d.topChName} ({d.topChVal}人)</span>
                                      </div>
                                    </div>
                                  );
                                }}
                              />
                              
                              {/* 7-Day Average Reference Line */}
                              {avg7DayActual > 0 && (
                                <ReferenceLine 
                                  y={avg7DayActual} 
                                  stroke="#f59e0b" 
                                  strokeDasharray="4 4"
                                  label={{ 
                                    value: `7天均线: ${avg7DayActual.toFixed(1)}人`, 
                                    fill: '#f59e0b', 
                                    fontSize: 10,
                                    position: 'insideTopRight'
                                  }} 
                                />
                              )}

                              <Area
                                type="monotone"
                                dataKey="dayActualTotal"
                                name="单日招生人数"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorMajorTrend7)"
                                dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#ffffff" }}
                                activeDot={{ r: 6, fill: "#059669", stroke: "#ffffff", strokeWidth: 2 }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: 7-Day Day-by-Day Micro Cards Grid */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          <span>近 7 天每日增量明细与主力渠道拆解 (7-Day Daily Micro Cards)</span>
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">
                          共 7 天时间切片
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                        {last7DaysData.map((d, i) => {
                          const isPeak = peak7Day && peak7Day.date === d.date;
                          const isUp = d.diff >= 0;

                          return (
                            <div
                              key={`dashboard-micro-7d-${d.date}-${i}`}
                              className={`p-3 rounded-xl border transition-all ${
                                isPeak
                                  ? isDarkMode
                                    ? "bg-purple-950/30 border-purple-800/60 shadow-xs ring-1 ring-purple-500/30"
                                    : "bg-purple-50/90 border-purple-300 shadow-2xs ring-1 ring-purple-200"
                                  : theme.cardBg
                              } hover:shadow-md`}
                            >
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                                <span className="font-extrabold">{d.shortDate}</span>
                                {isPeak ? (
                                  <span className="text-[8.5px] px-1.5 py-0.2 rounded font-mono font-extrabold bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-400/30">
                                    峰值
                                  </span>
                                ) : (
                                  <span className="text-[8px] opacity-70">第{i + 1}天</span>
                                )}
                              </div>

                              <div className="flex items-baseline justify-between mb-1">
                                <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                                  {d.dayActualTotal}<span className="text-[10px] text-slate-400 font-normal">人</span>
                                </span>

                                {i > 0 && (
                                  <span className={`text-[9.5px] font-mono font-bold flex items-center ${
                                    isUp ? "text-emerald-500" : "text-rose-500"
                                  }`}>
                                    {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {isUp ? `+${d.diff}` : d.diff}
                                  </span>
                                )}
                              </div>

                              <div className="text-[9.5px] text-slate-400 truncate pt-1 border-t border-current/10">
                                <span className="opacity-80">主力: </span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">{d.topChName} ({d.topChVal}人)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section 3: Channel Matrix Cards Breakdown */}
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-indigo-500" />
                            <span>全渠道招生目标、完成数与贡献度拆解 (Channel Breakdown Matrix)</span>
                          </h3>
                          <p className="text-[10.5px] text-slate-400 mt-0.5">
                            各招生渠道的目标达成率、缺口数与在专业总招生中的贡献占比
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {channelAggregates.map((ch, idx) => {
                          const isMet = ch.actual >= ch.target && ch.target > 0;
                          const contribPct = totalActual > 0 ? (ch.actual / totalActual) * 100 : 0;

                          return (
                            <div
                              key={`dashboard-ch-card-${ch.name}-${idx}`}
                              className={`p-3.5 rounded-xl border transition-all ${theme.cardBg} hover:shadow-md`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span 
                                    className="w-3 h-3 rounded-full shrink-0 shadow-2xs" 
                                    style={{ backgroundColor: ch.color }} 
                                  />
                                  <span className="text-xs font-bold truncate text-slate-900 dark:text-slate-100">
                                    {ch.name}
                                  </span>
                                </div>

                                <span className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded border ${
                                  isMet
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                    : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                                }`}>
                                  {ch.rate.toFixed(1)}%
                                </span>
                              </div>

                              <div className="flex items-baseline justify-between font-mono mb-2">
                                <div>
                                  <span className="text-slate-400 block text-[9.5px]">实际 / 计划</span>
                                  <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                                    {ch.actual} <span className="text-xs font-normal text-slate-400">/ {ch.target}人</span>
                                  </span>
                                </div>

                                <div className="text-right">
                                  <span className="text-slate-400 block text-[9.5px]">全专业占比</span>
                                  <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400">
                                    {contribPct.toFixed(1)}%
                                  </span>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(100, ch.rate)}%`,
                                    backgroundColor: ch.color
                                  }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-[9.5px] text-slate-400 mt-1.5">
                                <span>{ch.gap > 0 ? `缺口: ${ch.gap}人` : "已完成目标"}</span>
                                <span className="font-bold text-slate-600 dark:text-slate-300">贡献 {ch.actual}人</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Past 7 Days Growth Trend & Dual Axis Chart */}
                {activeTab === "7day_trend" && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-extrabold flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-500" />
                          <span>过去 7 天招生复合增长趋势 (Composed 7-Day Trend)</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          每日新增柱状图与7天累计递增曲线叠加分析
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                          7天总量: {total7DayActual}人
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold">
                          7天均值: {avg7DayActual.toFixed(1)}人/日
                        </span>
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border ${theme.cardBg} h-[340px] relative`}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={last7DaysData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
                          <XAxis 
                            dataKey="shortDate" 
                            stroke={theme.axisText} 
                            tick={{ fontSize: 11, fontWeight: "bold" }}
                          />
                          <YAxis 
                            yAxisId="left"
                            stroke={theme.axisText} 
                            tick={{ fontSize: 11 }}
                            label={{ value: '单日新增(人)', angle: -90, position: 'insideLeft', style: { fontSize: '10px', fill: theme.axisText } }}
                          />
                          <YAxis 
                            yAxisId="right"
                            orientation="right"
                            stroke={theme.axisText} 
                            tick={{ fontSize: 11 }}
                            label={{ value: '7天累计(人)', angle: 90, position: 'insideRight', style: { fontSize: '10px', fill: theme.axisText } }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                              borderColor: isDarkMode ? "#334155" : "#e2e8f0",
                              borderRadius: "12px",
                              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
                              fontSize: "12px"
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />

                          {/* Average Baseline Reference Line */}
                          {avg7DayActual > 0 && (
                            <ReferenceLine 
                              yAxisId="left"
                              y={avg7DayActual} 
                              stroke="#f59e0b" 
                              strokeDasharray="4 4"
                              label={{ 
                                value: `7天日均线 (${avg7DayActual.toFixed(1)}人)`, 
                                fill: '#f59e0b', 
                                fontSize: 10,
                                position: 'insideTopRight'
                              }} 
                            />
                          )}

                          {/* Daily New Admissions Bar */}
                          <Bar 
                            yAxisId="left"
                            dataKey="dayActualTotal" 
                            name="单日招生人数" 
                            radius={[6, 6, 0, 0]}
                            maxBarSize={40}
                          >
                            {last7DaysData.map((entry, index) => (
                              <Cell 
                                key={`cell-7day-comp-${index}`} 
                                fill={entry.dayActualTotal >= avg7DayActual ? "#10b981" : "#3b82f6"} 
                              />
                            ))}
                          </Bar>

                          {/* 7-Day Cumulative Line */}
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="cum7"
                            name="7天累计人数"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "#8b5cf6" }}
                            activeDot={{ r: 6 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* TAB 3: Channel Lines Chart */}
                {activeTab === "channel_lines" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-extrabold flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-indigo-500" />
                          <span>各渠道每日报到走势拆解 (Channel Daily Trends)</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          细化观察主要招生渠道与补录渠道在不同日期的贡献波动
                        </p>
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border ${theme.cardBg} h-[380px]`}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
                          <XAxis 
                            dataKey="shortDate" 
                            stroke={theme.axisText} 
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis stroke={theme.axisText} tick={{ fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                              borderColor: isDarkMode ? "#334155" : "#e2e8f0",
                              borderRadius: "12px",
                              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)",
                              fontSize: "12px"
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />

                          {channelNames.map((cName, idx) => (
                            <Line
                              key={`line-ch-${cName}-${idx}`}
                              type="monotone"
                              dataKey={cName}
                              name={cName}
                              stroke={channelColors[idx % channelColors.length]}
                              strokeWidth={2.5}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5, strokeWidth: 2 }}
                            />
                          ))}
                          {!channelNames.includes("其它/补录") && (
                            <Line
                              key="line-ch-other"
                              type="monotone"
                              dataKey="其它/补录"
                              name="其它/补录"
                              stroke="#64748b"
                              strokeWidth={2}
                              strokeDasharray="4 4"
                              dot={{ r: 3 }}
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* TAB 4: Cumulative Target vs Actual Pace */}
                {activeTab === "cumulative_path" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-extrabold flex items-center gap-2">
                          <Target className="w-4 h-4 text-emerald-500" />
                          <span>累计招生完成曲线 vs 计划目标基准线</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          对比实际招生累计爬升进度与计划全额的差距
                        </p>
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border ${theme.cardBg} h-[380px]`}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCumActual" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
                          <XAxis dataKey="shortDate" stroke={theme.axisText} tick={{ fontSize: 11 }} />
                          <YAxis stroke={theme.axisText} tick={{ fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                              borderColor: isDarkMode ? "#334155" : "#e2e8f0",
                              borderRadius: "12px",
                              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)",
                              fontSize: "12px"
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />

                          {totalTarget > 0 && (
                            <ReferenceLine
                              y={totalTarget}
                              stroke="#6366f1"
                              strokeDasharray="5 5"
                              label={{ value: `总目标: ${totalTarget}人`, fill: '#6366f1', fontSize: 11, position: 'insideTopLeft' }}
                            />
                          )}

                          <Area
                            type="monotone"
                            dataKey="cumActual"
                            name="实际累计完成人数"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorCumActual)"
                            dot={{ r: 4, fill: "#10b981" }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* TAB 5: Full Channel Matrix Table */}
                {activeTab === "channel_table" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-extrabold flex items-center gap-2">
                          <Layers className="w-4 h-4 text-indigo-500" />
                          <span>【{majorName}】全渠道招生数据明细矩阵</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          各渠道计划人数、实际完成、完成率、缺口及全专业贡献占比一览
                        </p>
                      </div>
                    </div>

                    <div className={`rounded-xl border overflow-hidden ${theme.cardBg}`}>
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className={`border-b font-extrabold ${
                            isDarkMode ? "bg-slate-950/80 border-slate-800 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700"
                          }`}>
                            <th className="py-2.5 px-4">渠道名称</th>
                            <th className="py-2.5 px-4 text-right">计划目标</th>
                            <th className="py-2.5 px-4 text-right">实际招募</th>
                            <th className="py-2.5 px-4 text-right">达成率</th>
                            <th className="py-2.5 px-4 text-right">缺口/超额</th>
                            <th className="py-2.5 px-4 text-right">专业内贡献比</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-800 divide-slate-150 font-mono">
                          {channelAggregates.map((ch, idx) => {
                            const isMet = ch.actual >= ch.target && ch.target > 0;
                            const contribPct = totalActual > 0 ? (ch.actual / totalActual) * 100 : 0;

                            return (
                              <tr key={`matrix-row-${ch.name}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="py-2.5 px-4 font-bold font-sans flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ch.color }} />
                                  <span className="text-slate-800 dark:text-slate-200">{ch.name}</span>
                                </td>
                                <td className="py-2.5 px-4 text-right text-slate-500">{ch.target} 人</td>
                                <td className="py-2.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">{ch.actual} 人</td>
                                <td className="py-2.5 px-4 text-right font-extrabold">
                                  <span className={`px-2 py-0.5 rounded text-[11px] ${
                                    isMet
                                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                      : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                                  }`}>
                                    {ch.rate.toFixed(1)}%
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-right font-bold">
                                  {ch.actual >= ch.target ? (
                                    <span className="text-emerald-500">+{ch.actual - ch.target}人</span>
                                  ) : (
                                    <span className="text-rose-500">缺 {ch.gap}人</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-4 text-right font-extrabold text-indigo-600 dark:text-indigo-400">
                                  {contribPct.toFixed(1)}%
                                </td>
                              </tr>
                            );
                          })}
                          
                          {/* Summary Row */}
                          <tr className={`border-t-2 font-black ${
                            isDarkMode ? "bg-slate-950/60 border-slate-700 text-slate-100" : "bg-slate-100 border-slate-300 text-slate-900"
                          }`}>
                            <td className="py-3 px-4 font-sans">合计 / 汇总</td>
                            <td className="py-3 px-4 text-right">{totalTarget} 人</td>
                            <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 text-sm">{totalActual} 人</td>
                            <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">{overallRate.toFixed(1)}%</td>
                            <td className="py-3 px-4 text-right">
                              {totalSurplus > 0 ? (
                                <span className="text-emerald-500">+{totalSurplus}人</span>
                              ) : (
                                <span className="text-rose-500">缺 {totalGap}人</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">100.0%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 6: Historical Comparison (D3) */}
                {activeTab === "history_comparison" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-extrabold flex items-center gap-2">
                          <History className="w-4 h-4 text-emerald-500" />
                          <span>【{majorName}】历史同期与标杆多维对比 (D3 Visualization)</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          基于 D3 引擎对比该专业与历史同期及全校标杆的数据走势
                        </p>
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border ${theme.cardBg}`}>
                      <D3HistoryComparisonChart
                        majorName={majorName}
                        rows={rows}
                        selectedDate={selectedDate}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className={`px-6 py-3 border-t flex items-center justify-between text-xs shrink-0 ${
            isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
          }`}>
            <div className="flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>当前正在查看专业: <strong className="text-slate-900 dark:text-slate-100 font-bold">{majorName}</strong></span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] hidden sm:inline text-slate-400">
                支持按 ESC 键或点击遮罩快速退出
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-all cursor-pointer"
              >
                关闭看板
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
