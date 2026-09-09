/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { RowData } from "../types";
import { 
  ArrowLeftRight, X, TrendingUp, TrendingDown, Target, Users, Activity, 
  Trophy, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight,
  BarChart3, LineChart as LineChartIcon, Layers, Sparkles, ChevronRight,
  Download, Copy, Check
} from "lucide-react";
import { motion } from "motion/react";
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

export interface MajorComparisonViewProps {
  isDarkMode: boolean;
  primaryMajor: string;
  compareMajor: string;
  onSelectCompareMajor: (major: string) => void;
  onSwapMajors: () => void;
  onCloseComparison: () => void;
  allMajorNames: string[];
  rows: RowData[];
  channelNames: string[];
  selectedDate: string;
  timeScope: "current" | "month" | "all";
  onTimeScopeChange: (scope: "current" | "month" | "all") => void;
  onToast?: (msg: string) => void;
}

export const MajorComparisonView: React.FC<MajorComparisonViewProps> = ({
  isDarkMode,
  primaryMajor,
  compareMajor,
  onSelectCompareMajor,
  onSwapMajors,
  onCloseComparison,
  allMajorNames,
  rows,
  channelNames,
  selectedDate,
  timeScope,
  onTimeScopeChange,
  onToast,
}) => {
  const [chartView, setChartView] = useState<"cumulative" | "daily">("cumulative");
  const [copiedSummary, setCopiedSummary] = useState(false);

  const monthPrefix = selectedDate ? selectedDate.substring(0, 7) : new Date().toISOString().substring(0, 7);

  // Helper to compute stats for any major name
  const computeMajorStats = (majorName: string) => {
    const majorRows = rows
      .filter(r => r.name === majorName && !r.isMergedGroup)
      .sort((a, b) => a.date.localeCompare(b.date));

    const selectedDayRow = majorRows.find(r => r.date === selectedDate) || majorRows[majorRows.length - 1];

    let scopedRows: RowData[] = [];
    if (timeScope === "current") {
      scopedRows = selectedDayRow ? [selectedDayRow] : [];
    } else if (timeScope === "month") {
      scopedRows = majorRows.filter(r => r.date.startsWith(monthPrefix));
    } else {
      scopedRows = majorRows;
    }

    // Channels aggregate
    const channelMetrics = channelNames.map((cName, idx) => {
      let targetSum = 0;
      let actualSum = 0;

      scopedRows.forEach(row => {
        const ch = row.channels && row.channels[idx] ? row.channels[idx] : { target: 0, actual: 0 };
        targetSum += Number(ch.target) || 0;
        actualSum += Number(ch.actual) || 0;
      });

      const rate = targetSum > 0 ? (actualSum / targetSum) * 100 : (actualSum > 0 ? 100 : 0);
      return {
        name: cName,
        target: targetSum,
        actual: actualSum,
        rate: Number(rate.toFixed(1)),
        diff: actualSum - targetSum
      };
    });

    // Other channel
    let otherActual = 0;
    scopedRows.forEach(row => {
      const o = typeof row.other === "number" ? row.other : (typeof row.other === "object" && row.other !== null && "actual" in row.other ? (row.other as { actual: number }).actual : 0);
      otherActual += o;
    });

    if (otherActual > 0) {
      channelMetrics.push({
        name: "其它/补录",
        target: 0,
        actual: otherActual,
        rate: 100,
        diff: otherActual
      });
    }

    const totalTarget = channelMetrics.reduce((acc, c) => acc + c.target, 0);
    const totalActual = channelMetrics.reduce((acc, c) => acc + c.actual, 0);
    const overallRate = totalTarget > 0 ? Number(((totalActual / totalTarget) * 100).toFixed(1)) : (totalActual > 0 ? 100 : 0);
    const totalDiff = totalActual - totalTarget;

    const topChannel = channelMetrics.length > 0 ? [...channelMetrics].sort((a, b) => b.actual - a.actual)[0] : null;

    // Time series trend data
    let cumActual = 0;
    let cumTarget = 0;
    const timeSeries = majorRows.map(row => {
      let dayTarget = 0;
      let dayActual = 0;
      channelNames.forEach((_, idx) => {
        const ch = row.channels && row.channels[idx] ? row.channels[idx] : { target: 0, actual: 0 };
        dayTarget += Number(ch.target) || 0;
        dayActual += Number(ch.actual) || 0;
      });
      const o = typeof row.other === "number" ? row.other : (typeof row.other === "object" && row.other !== null && "actual" in row.other ? (row.other as { actual: number }).actual : 0);
      dayActual += o;

      cumActual += dayActual;
      cumTarget += dayTarget;

      return {
        date: row.date,
        shortDate: row.date.length >= 10 ? row.date.substring(5) : row.date,
        dayActual,
        dayTarget,
        cumActual,
        cumTarget,
        dayRate: dayTarget > 0 ? Number(((dayActual / dayTarget) * 100).toFixed(1)) : (dayActual > 0 ? 100 : 0),
        cumRate: cumTarget > 0 ? Number(((cumActual / cumTarget) * 100).toFixed(1)) : 0,
      };
    });

    const avgDaily = timeSeries.length > 0 
      ? Math.round((timeSeries.reduce((a, b) => a + b.dayActual, 0) / timeSeries.length) * 10) / 10 
      : 0;

    return {
      majorName,
      scopedRows,
      channelMetrics,
      totalTarget,
      totalActual,
      overallRate,
      totalDiff,
      topChannel,
      timeSeries,
      avgDaily,
      totalDays: majorRows.length
    };
  };

  const primaryStats = useMemo(() => computeMajorStats(primaryMajor), [primaryMajor, rows, channelNames, timeScope, selectedDate, monthPrefix]);
  const compareStats = useMemo(() => computeMajorStats(compareMajor), [compareMajor, rows, channelNames, timeScope, selectedDate, monthPrefix]);

  // Delta calculations
  const actualDelta = primaryStats.totalActual - compareStats.totalActual;
  const targetDelta = primaryStats.totalTarget - compareStats.totalTarget;
  const rateDelta = Number((primaryStats.overallRate - compareStats.overallRate).toFixed(1));
  const avgDailyDelta = Number((primaryStats.avgDaily - compareStats.avgDaily).toFixed(1));

  // Channel by channel side-by-side comparison data
  const channelComparisonData = useMemo(() => {
    const allChannelsList = Array.from(new Set([
      ...primaryStats.channelMetrics.map(c => c.name),
      ...compareStats.channelMetrics.map(c => c.name)
    ]));

    return allChannelsList.map(cName => {
      const p = primaryStats.channelMetrics.find(c => c.name === cName) || { target: 0, actual: 0, rate: 0, diff: 0 };
      const c = compareStats.channelMetrics.find(c => c.name === cName) || { target: 0, actual: 0, rate: 0, diff: 0 };

      const diffActual = p.actual - c.actual;
      const diffRate = Number((p.rate - c.rate).toFixed(1));

      let winner: "primary" | "compare" | "tie" = "tie";
      if (diffActual > 0 || (diffActual === 0 && diffRate > 0)) {
        winner = "primary";
      } else if (diffActual < 0 || (diffActual === 0 && diffRate < 0)) {
        winner = "compare";
      }

      return {
        name: cName,
        primaryTarget: p.target,
        primaryActual: p.actual,
        primaryRate: p.rate,
        compareTarget: c.target,
        compareActual: c.actual,
        compareRate: c.rate,
        diffActual,
        diffRate,
        winner
      };
    });
  }, [primaryStats, compareStats]);

  // Unified time series for comparative chart overlay
  const combinedTrendData = useMemo(() => {
    const dateSet = new Set<string>();
    primaryStats.timeSeries.forEach(t => dateSet.add(t.date));
    compareStats.timeSeries.forEach(t => dateSet.add(t.date));

    const sortedDates = Array.from(dateSet).sort();

    const pMap = new Map(primaryStats.timeSeries.map(t => [t.date, t]));
    const cMap = new Map(compareStats.timeSeries.map(t => [t.date, t]));

    let lastPCum = 0;
    let lastCCum = 0;

    return sortedDates.map(date => {
      const p = pMap.get(date);
      const c = cMap.get(date);

      if (p) lastPCum = p.cumActual;
      if (c) lastCCum = c.cumActual;

      const pDaily = p ? p.dayActual : 0;
      const cDaily = c ? c.dayActual : 0;
      const pCum = p ? p.cumActual : lastPCum;
      const cCum = c ? c.cumActual : lastCCum;
      const pRate = p ? p.cumRate : (p ? p.cumRate : 0);
      const cRate = c ? c.cumRate : (c ? c.cumRate : 0);

      return {
        date,
        shortDate: date.length >= 10 ? date.substring(5) : date,
        primaryDaily: pDaily,
        compareDaily: cDaily,
        primaryCumulative: pCum,
        compareCumulative: cCum,
        primaryRate: pRate,
        compareRate: cRate,
        diffDaily: pDaily - cDaily,
        diffCum: pCum - cCum
      };
    });
  }, [primaryStats.timeSeries, compareStats.timeSeries]);

  // Copy Comparison Report
  const handleCopyComparisonReport = () => {
    const scopeLabel = timeScope === "current" ? `当日(${selectedDate})` : timeScope === "month" ? `${monthPrefix}月度累计` : "全部历史区间";
    let text = `【专业横向对比分析简报】\n`;
    text += `对比周期: ${scopeLabel} | 基准日期: ${selectedDate}\n`;
    text += `------------------------------------\n`;
    text += `【主选专业】: ${primaryMajor}\n`;
    text += `  • 计划目标: ${primaryStats.totalTarget}人 | 实际招收: ${primaryStats.totalActual}人 | 达成率: ${primaryStats.overallRate}%\n`;
    text += `  • 最优渠道: ${primaryStats.topChannel ? `${primaryStats.topChannel.name} (${primaryStats.topChannel.actual}人)` : "无"}\n\n`;
    text += `【对比专业】: ${compareMajor}\n`;
    text += `  • 计划目标: ${compareStats.totalTarget}人 | 实际招收: ${compareStats.totalActual}人 | 达成率: ${compareStats.overallRate}%\n`;
    text += `  • 最优渠道: ${compareStats.topChannel ? `${compareStats.topChannel.name} (${compareStats.topChannel.actual}人)` : "无"}\n\n`;
    text += `【差异对比结果】:\n`;
    text += `  • 实际招收差异: ${actualDelta > 0 ? `+${actualDelta}` : actualDelta}人 (${actualDelta > 0 ? `「${primaryMajor}」领先` : actualDelta < 0 ? `「${compareMajor}」领先` : "持平"})\n`;
    text += `  • 达成率差异: ${rateDelta > 0 ? `+${rateDelta}%` : `${rateDelta}%`} (${rateDelta > 0 ? `「${primaryMajor}」更高` : rateDelta < 0 ? `「${compareMajor}」更高` : "持平"})\n`;
    text += `  • 日均推进进度: ${primaryMajor} ${primaryStats.avgDaily}人/天 vs ${compareMajor} ${compareStats.avgDaily}人/天\n`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
    if (onToast) onToast(`已复制「${primaryMajor} vs ${compareMajor}」对比分析简报！`);
  };

  // Export Comparison CSV
  const handleExportComparisonCsv = () => {
    const fileName = `专业对比_${primaryMajor}_vs_${compareMajor}_${selectedDate}.csv`;
    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const lines: string[] = [];
    lines.push([escapeCsv(`【专业对比分析】${primaryMajor} VS ${compareMajor}`)].join(","));
    lines.push([
      escapeCsv("统计周期"),
      escapeCsv(timeScope === "current" ? `当日(${selectedDate})` : timeScope === "month" ? `${monthPrefix}月度累计` : "全部历史区间"),
      escapeCsv("导出时间"),
      escapeCsv(new Date().toLocaleString())
    ].join(","));
    lines.push("");

    // Core Metrics Row
    lines.push([
      escapeCsv("指标项"),
      escapeCsv(`主选专业: ${primaryMajor}`),
      escapeCsv(`对比专业: ${compareMajor}`),
      escapeCsv("差异净值 (主选 - 对比)"),
      escapeCsv("优势方")
    ].join(","));

    lines.push([
      escapeCsv("计划目标(人)"),
      escapeCsv(primaryStats.totalTarget),
      escapeCsv(compareStats.totalTarget),
      escapeCsv(targetDelta > 0 ? `+${targetDelta}` : targetDelta),
      escapeCsv("-")
    ].join(","));

    lines.push([
      escapeCsv("实际招收(人)"),
      escapeCsv(primaryStats.totalActual),
      escapeCsv(compareStats.totalActual),
      escapeCsv(actualDelta > 0 ? `+${actualDelta}` : actualDelta),
      escapeCsv(actualDelta > 0 ? primaryMajor : actualDelta < 0 ? compareMajor : "持平")
    ].join(","));

    lines.push([
      escapeCsv("达成率(%)"),
      escapeCsv(`${primaryStats.overallRate}%`),
      escapeCsv(`${compareStats.overallRate}%`),
      escapeCsv(rateDelta > 0 ? `+${rateDelta}%` : `${rateDelta}%`),
      escapeCsv(rateDelta > 0 ? primaryMajor : rateDelta < 0 ? compareMajor : "持平")
    ].join(","));

    lines.push([
      escapeCsv("日均招收(人/天)"),
      escapeCsv(primaryStats.avgDaily),
      escapeCsv(compareStats.avgDaily),
      escapeCsv(avgDailyDelta > 0 ? `+${avgDailyDelta}` : avgDailyDelta),
      escapeCsv(avgDailyDelta > 0 ? primaryMajor : avgDailyDelta < 0 ? compareMajor : "持平")
    ].join(","));

    lines.push("");
    lines.push([escapeCsv("--- 分渠道指标横向对比 ---")].join(","));
    lines.push([
      escapeCsv("渠道名称"),
      escapeCsv(`${primaryMajor}-计划`),
      escapeCsv(`${primaryMajor}-实际`),
      escapeCsv(`${primaryMajor}-达成率`),
      escapeCsv(`${compareMajor}-计划`),
      escapeCsv(`${compareMajor}-实际`),
      escapeCsv(`${compareMajor}-达成率`),
      escapeCsv("实际招收差额"),
      escapeCsv("渠道领先方")
    ].join(","));

    channelComparisonData.forEach(c => {
      lines.push([
        escapeCsv(c.name),
        escapeCsv(c.primaryTarget),
        escapeCsv(c.primaryActual),
        escapeCsv(`${c.primaryRate}%`),
        escapeCsv(c.compareTarget),
        escapeCsv(c.compareActual),
        escapeCsv(`${c.compareRate}%`),
        escapeCsv(c.diffActual > 0 ? `+${c.diffActual}` : c.diffActual),
        escapeCsv(c.winner === "primary" ? primaryMajor : c.winner === "compare" ? compareMajor : "持平")
      ].join(","));
    });

    const csvContent = "\uFEFF" + lines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onToast) onToast(`已导出「${primaryMajor} vs ${compareMajor}」对比分析 CSV`);
  };

  const candidateMajors = allMajorNames.filter(m => m !== primaryMajor);

  return (
    <div id="major-comparison-view-container" className="space-y-5 animate-in fade-in duration-200">
      
      {/* Comparison Top Control Banner */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 select-none ${
        isDarkMode 
          ? "bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/30 shadow-lg" 
          : "bg-gradient-to-r from-indigo-50/90 via-sky-50/60 to-purple-50/90 border-indigo-200 shadow-sm"
      }`}>
        
        {/* Majors Selection & VS Badge */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Primary Major Pill */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border bg-indigo-600 text-white font-black text-xs md:text-sm shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-tight">{primaryMajor}</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded font-normal">主选</span>
          </div>

          {/* VS & Swap Button */}
          <div className="flex items-center space-x-1">
            <span className="font-black font-mono text-xs px-2 py-1 rounded-lg bg-slate-500/15 text-indigo-400 dark:text-indigo-300">
              VS
            </span>
            <button
              type="button"
              id="major-compare-swap-btn"
              onClick={onSwapMajors}
              className={`p-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                isDarkMode 
                  ? "bg-slate-800 border-slate-700 text-indigo-300 hover:bg-slate-700" 
                  : "bg-white border-slate-300 text-indigo-700 hover:bg-indigo-50"
              }`}
              title="对调两个专业的前后对比位置"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Comparison Major Selector Dropdown */}
          <div className="relative">
            <select
              id="major-compare-select"
              value={compareMajor}
              onChange={(e) => onSelectCompareMajor(e.target.value)}
              className={`text-xs md:text-sm font-black py-1.5 pl-3 pr-8 rounded-xl border outline-none cursor-pointer appearance-none transition-all ${
                isDarkMode 
                  ? "bg-amber-950/40 border-amber-500/40 text-amber-300 focus:border-amber-400 shadow-md" 
                  : "bg-white border-amber-300 text-amber-900 focus:border-amber-500 shadow-sm"
              }`}
            >
              {candidateMajors.map((m, idx) => (
                <option key={`compare-opt-${m}-${idx}`} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronRight className="w-3.5 h-3.5 rotate-90 absolute right-2.5 top-2.5 pointer-events-none text-amber-500" />
          </div>

          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
            对比目标
          </span>
        </div>

        {/* Right Action Tools: Time Scope, Copy, Export, Close */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Time Scope Toggle */}
          <div className={`flex items-center p-0.5 rounded-xl border text-[11px] font-bold ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-300 shadow-2xs"
          }`}>
            <button
              type="button"
              onClick={() => onTimeScopeChange("current")}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                timeScope === "current"
                  ? isDarkMode ? "bg-indigo-600 text-white font-extrabold" : "bg-indigo-600 text-white font-extrabold shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              当日
            </button>
            <button
              type="button"
              onClick={() => onTimeScopeChange("month")}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                timeScope === "month"
                  ? isDarkMode ? "bg-indigo-600 text-white font-extrabold" : "bg-indigo-600 text-white font-extrabold shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              本月
            </button>
            <button
              type="button"
              onClick={() => onTimeScopeChange("all")}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                timeScope === "all"
                  ? isDarkMode ? "bg-indigo-600 text-white font-extrabold" : "bg-indigo-600 text-white font-extrabold shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              全部
            </button>
          </div>

          {/* Copy Report */}
          <button
            type="button"
            onClick={handleCopyComparisonReport}
            className={`p-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              isDarkMode 
                ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" 
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs"
            }`}
            title="复制横向对比简报"
          >
            {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedSummary ? "已复制" : "复制对比"}</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportComparisonCsv}
            className={`p-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              isDarkMode 
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60" 
                : "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 shadow-2xs"
            }`}
            title="导出两专业对比明细 CSV 表格"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">导出对比CSV</span>
          </button>

          {/* Close / Return to Single Major Dashboard */}
          <button
            type="button"
            id="major-compare-exit-btn"
            onClick={onCloseComparison}
            className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-xs ${
              isDarkMode 
                ? "bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/60" 
                : "bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100"
            }`}
            title="退出横向对比视图，返回单专业看板"
          >
            <X className="w-3.5 h-3.5" />
            <span>退出对比</span>
          </button>
        </div>
      </div>

      {/* Executive Delta Summary Insight Callout */}
      <div className={`p-4 rounded-2xl border flex items-start space-x-3.5 ${
        rateDelta > 0 
          ? isDarkMode ? "bg-emerald-950/25 border-emerald-500/30" : "bg-emerald-50/80 border-emerald-200"
          : rateDelta < 0
          ? isDarkMode ? "bg-amber-950/25 border-amber-500/30" : "bg-amber-50/80 border-amber-200"
          : isDarkMode ? "bg-indigo-950/25 border-indigo-500/30" : "bg-indigo-50/80 border-indigo-200"
      }`}>
        <div className={`p-2 rounded-xl shrink-0 ${
          rateDelta > 0 
            ? "bg-emerald-500/20 text-emerald-500" 
            : rateDelta < 0 
            ? "bg-amber-500/20 text-amber-500" 
            : "bg-indigo-500/20 text-indigo-500"
        }`}>
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs md:text-sm font-black tracking-tight">
              对比诊断结论:
            </h4>
            <span className={`text-[11px] px-2 py-0.2 rounded-full font-bold ${
              rateDelta > 0
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : rateDelta < 0
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                : "bg-slate-500/20 text-slate-600 dark:text-slate-300 border border-slate-500/30"
            }`}>
              {rateDelta > 0 
                ? `「${primaryMajor}」达成率领先 +${rateDelta}%` 
                : rateDelta < 0 
                ? `「${compareMajor}」达成率反超 +${Math.abs(rateDelta)}%` 
                : "双方达成率持平"}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            在当前选定周期内，<strong className="text-indigo-600 dark:text-indigo-400 font-bold">「{primaryMajor}」</strong>实际招收 <strong>{primaryStats.totalActual}</strong> 人（达成率 {primaryStats.overallRate}%，日均 {primaryStats.avgDaily} 人）；
            <strong className="text-amber-600 dark:text-amber-400 font-bold">「{compareMajor}」</strong>实际招收 <strong>{compareStats.totalActual}</strong> 人（达成率 {compareStats.overallRate}%，日均 {compareStats.avgDaily} 人）。
            实际招收人次差额为 <strong className={actualDelta >= 0 ? "text-emerald-500 font-black" : "text-rose-500 font-black"}>{actualDelta > 0 ? `+${actualDelta}` : actualDelta} 人</strong>。
          </p>
        </div>
      </div>

      {/* Side-by-Side KPI Cards Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Actual Enrollment */}
        <div className={`p-4 rounded-2xl border space-y-2.5 ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              实际招收人数
            </span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
              actualDelta > 0 ? "bg-emerald-500/15 text-emerald-500" : actualDelta < 0 ? "bg-rose-500/15 text-rose-500" : "bg-slate-500/15 text-slate-400"
            }`}>
              差额: {actualDelta > 0 ? `+${actualDelta}` : actualDelta}人
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            {/* Primary Major */}
            <div className="p-2 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block truncate">{primaryMajor}</span>
              <div className="text-lg md:text-xl font-black font-mono mt-0.5 text-indigo-600 dark:text-indigo-300">
                {primaryStats.totalActual} <span className="text-[10px] font-normal text-slate-400">人</span>
              </div>
            </div>

            {/* Compare Major */}
            <div className="p-2 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block truncate">{compareMajor}</span>
              <div className="text-lg md:text-xl font-black font-mono mt-0.5 text-amber-600 dark:text-amber-300">
                {compareStats.totalActual} <span className="text-[10px] font-normal text-slate-400">人</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Completion Rate */}
        <div className={`p-4 rounded-2xl border space-y-2.5 ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              目标达成率
            </span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
              rateDelta > 0 ? "bg-emerald-500/15 text-emerald-500" : rateDelta < 0 ? "bg-rose-500/15 text-rose-500" : "bg-slate-500/15 text-slate-400"
            }`}>
              差额: {rateDelta > 0 ? `+${rateDelta}%` : `${rateDelta}%`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            {/* Primary Major */}
            <div className="p-2 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block truncate">{primaryMajor}</span>
              <div className="text-lg md:text-xl font-black font-mono mt-0.5 text-indigo-600 dark:text-indigo-300">
                {primaryStats.overallRate}%
              </div>
            </div>

            {/* Compare Major */}
            <div className="p-2 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block truncate">{compareMajor}</span>
              <div className="text-lg md:text-xl font-black font-mono mt-0.5 text-amber-600 dark:text-amber-300">
                {compareStats.overallRate}%
              </div>
            </div>
          </div>
        </div>

        {/* 3. Target Quota */}
        <div className={`p-4 rounded-2xl border space-y-2.5 ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-blue-500" />
              计划总指标
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-slate-500/10 text-slate-400">
              差额: {targetDelta > 0 ? `+${targetDelta}` : targetDelta}人
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block truncate">{primaryMajor}</span>
              <div className="text-lg md:text-xl font-black font-mono mt-0.5 text-indigo-600 dark:text-indigo-300">
                {primaryStats.totalTarget} <span className="text-[10px] font-normal text-slate-400">人</span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block truncate">{compareMajor}</span>
              <div className="text-lg md:text-xl font-black font-mono mt-0.5 text-amber-600 dark:text-amber-300">
                {compareStats.totalTarget} <span className="text-[10px] font-normal text-slate-400">人</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Top Channel */}
        <div className={`p-4 rounded-2xl border space-y-2.5 ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              各自最强主力渠道
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-indigo-500/5 border border-indigo-500/15 min-w-0">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block truncate">{primaryMajor}</span>
              <div className="text-xs font-bold truncate mt-0.5 text-slate-800 dark:text-slate-100">
                {primaryStats.topChannel ? primaryStats.topChannel.name : "无"}
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                {primaryStats.topChannel ? `${primaryStats.topChannel.actual}人` : "-"}
              </div>
            </div>

            <div className="p-2 rounded-xl bg-amber-500/5 border border-amber-500/15 min-w-0">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block truncate">{compareMajor}</span>
              <div className="text-xs font-bold truncate mt-0.5 text-slate-800 dark:text-slate-100">
                {compareStats.topChannel ? compareStats.topChannel.name : "无"}
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                {compareStats.topChannel ? `${compareStats.topChannel.actual}人` : "-"}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Comparative Multi-Channel Bar Chart & Side-by-Side Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left 7 cols: Comparative Channel Bar Chart */}
        <div className={`lg:col-span-7 p-4 md:p-5 rounded-2xl border space-y-4 ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs md:text-sm font-black">各渠道实际招收人次横向对比</h4>
                <p className="text-[10px] text-slate-400">直观比对各招生渠道在两专业间的招收效能分布</p>
              </div>
            </div>

            {/* Legend Indicators */}
            <div className="flex items-center space-x-3 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                <span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block" />
                {primaryMajor}
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
                {compareMajor}
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: isDarkMode ? "#94a3b8" : "#64748b", fontSize: 11 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fill: isDarkMode ? "#94a3b8" : "#64748b", fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                    borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                  }}
                  formatter={(val: any, name: string) => [
                    `${val} 人`,
                    name === "primaryActual" ? primaryMajor : compareMajor
                  ]}
                />
                <Bar dataKey="primaryActual" name="primaryActual" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="compareActual" name="compareActual" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 5 cols: Channel Performance Breakdown Table */}
        <div className={`lg:col-span-5 p-4 md:p-5 rounded-2xl border space-y-3 flex flex-col justify-between ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div className="flex items-center justify-between border-b pb-2.5 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs md:text-sm font-black">渠道招收差额清单</h4>
            </div>
            <span className="text-[10px] text-slate-400">
              共 {channelComparisonData.length} 个渠道
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-56 space-y-1.5 pr-1 thin-scrollbar">
            {channelComparisonData.map((c, idx) => (
              <div 
                key={`comp-row-${c.name}-${idx}`}
                className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                  c.winner === "primary"
                    ? isDarkMode ? "bg-indigo-950/15 border-indigo-500/20" : "bg-indigo-50/40 border-indigo-100"
                    : c.winner === "compare"
                    ? isDarkMode ? "bg-amber-950/15 border-amber-500/20" : "bg-amber-50/40 border-amber-100"
                    : isDarkMode ? "bg-slate-950/30 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="min-w-0 pr-2">
                  <span className="font-bold block truncate">{c.name}</span>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                    <span className="text-indigo-500 font-bold">{c.primaryActual}人 ({c.primaryRate}%)</span>
                    <span>vs</span>
                    <span className="text-amber-500 font-bold">{c.compareActual}人 ({c.compareRate}%)</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-[11px] font-mono font-black ${
                    c.diffActual > 0 ? "text-emerald-500" : c.diffActual < 0 ? "text-rose-500" : "text-slate-400"
                  }`}>
                    {c.diffActual > 0 ? `+${c.diffActual}` : c.diffActual}人
                  </span>
                  <div className="text-[9px] font-bold">
                    {c.winner === "primary" ? (
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">「{primaryMajor}」胜</span>
                    ) : c.winner === "compare" ? (
                      <span className="text-amber-600 dark:text-amber-400 font-bold">「{compareMajor}」胜</span>
                    ) : (
                      <span className="text-slate-400">持平</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t text-[11px] text-slate-400 flex items-center justify-between dark:border-slate-800">
            <span>净差额总计:</span>
            <span className={`font-mono font-black ${actualDelta >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {actualDelta >= 0 ? `+${actualDelta}` : actualDelta} 人 (达成率差: {rateDelta > 0 ? `+${rateDelta}%` : `${rateDelta}%`})
            </span>
          </div>
        </div>

      </div>

      {/* Dual-Major Time-Series Trend Overlay Chart */}
      <div className={`p-4 md:p-5 rounded-2xl border space-y-4 ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <LineChartIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs md:text-sm font-black">历史推进时间序列走势横向比对</h4>
              <p className="text-[10px] text-slate-400">比对两专业在历史推进进程中的累计与单日速度差异</p>
            </div>
          </div>

          {/* Chart view switch: Cumulative vs Daily */}
          <div className={`flex items-center p-0.5 rounded-xl border text-[10px] font-bold self-start sm:self-auto ${
            isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
          }`}>
            <button
              type="button"
              onClick={() => setChartView("cumulative")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                chartView === "cumulative"
                  ? isDarkMode ? "bg-indigo-600 text-white font-black" : "bg-white text-indigo-900 shadow-2xs font-black"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              累计实际走势
            </button>
            <button
              type="button"
              onClick={() => setChartView("daily")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                chartView === "daily"
                  ? isDarkMode ? "bg-indigo-600 text-white font-black" : "bg-white text-indigo-900 shadow-2xs font-black"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              单日招收波动
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedTrendData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} vertical={false} />
              <XAxis 
                dataKey="shortDate" 
                tick={{ fill: isDarkMode ? "#94a3b8" : "#64748b", fontSize: 10 }}
              />
              <YAxis tick={{ fill: isDarkMode ? "#94a3b8" : "#64748b", fontSize: 10 }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                  borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                }}
                formatter={(val: any, name: string) => [
                  `${val} 人`,
                  name.includes("primary") ? primaryMajor : compareMajor
                ]}
              />
              <Legend 
                verticalAlign="top"
                height={36}
                formatter={(value) => {
                  if (value === "primary") return <span className="text-indigo-600 dark:text-indigo-400 font-bold">{primaryMajor}</span>;
                  if (value === "compare") return <span className="text-amber-600 dark:text-amber-400 font-bold">{compareMajor}</span>;
                  return value;
                }}
              />
              {chartView === "cumulative" ? (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="primaryCumulative" 
                    name="primary"
                    stroke="#6366f1" 
                    strokeWidth={3}
                    dot={{ r: 3, fill: "#6366f1" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="compareCumulative" 
                    name="compare"
                    stroke="#f59e0b" 
                    strokeWidth={3}
                    dot={{ r: 3, fill: "#f59e0b" }}
                    activeDot={{ r: 6 }}
                  />
                </>
              ) : (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="primaryDaily" 
                    name="primary"
                    stroke="#6366f1" 
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: "#6366f1" }}
                    activeDot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="compareDaily" 
                    name="compare"
                    stroke="#f59e0b" 
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: "#f59e0b" }}
                    activeDot={{ r: 5 }}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
