import React, { useState } from "react";
import { RowData } from "../types";
import { Award, ChevronDown, ChevronUp, BarChart3, TrendingUp, CheckCircle2, AlertTriangle, Target } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MajorRankingChartProps {
  rows: RowData[];
  isDarkMode: boolean;
  selectedDate: string;
  viewMode: "daily" | "monthly";
}

type SortMode = "actual" | "rate" | "gap";

export default function MajorRankingChart({
  rows,
  isDarkMode,
  selectedDate,
  viewMode
}: MajorRankingChartProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("actual");

  // 1. Filter rows for active period
  const activeRows = viewMode === "daily"
    ? rows.filter((r) => r.date === selectedDate)
    : rows.filter((r) => r.date.startsWith(selectedDate.substring(0, 7)));

  // 2. Aggregate actual completions & targets by Major Name
  const aggregation: { [name: string]: { target: number; actual: number } } = {};

  activeRows.forEach((row) => {
    const rowTarget = row.channels.reduce((sum, ch) => sum + ch.target, 0);
    const rowActual = row.channels.reduce((sum, ch) => sum + ch.actual, 0) + row.other;

    if (!aggregation[row.name]) {
      aggregation[row.name] = { target: 0, actual: 0 };
    }
    aggregation[row.name].target += rowTarget;
    aggregation[row.name].actual += rowActual;
  });

  // Convert to array and calculate stats
  const rankingData = Object.entries(aggregation).map(([name, stats]) => {
    const rate = stats.target > 0 ? (stats.actual / stats.target) * 100 : 0;
    const gap = Math.max(0, stats.target - stats.actual);
    const surplus = Math.max(0, stats.actual - stats.target);
    return {
      name,
      target: stats.target,
      actual: stats.actual,
      rate,
      gap,
      surplus
    };
  });

  // Sort based on active sortMode
  rankingData.sort((a, b) => {
    if (sortMode === "actual") return b.actual - a.actual;
    if (sortMode === "rate") return b.rate - a.rate;
    if (sortMode === "gap") return b.gap - a.gap;
    return b.actual - a.actual;
  });

  // Maximum scale boundary across target & actual for proportional micro bar charts
  const maxScaleVal = rankingData.length > 0 
    ? Math.max(...rankingData.map((d) => Math.max(d.target, d.actual)), 1) 
    : 1;

  // Split into visible and hidden lists depending on expand state
  const visibleCount = 5;
  const displayedRankings = isExpanded ? rankingData : rankingData.slice(0, visibleCount);

  return (
    <div className={`p-3.5 border rounded-xl space-y-3.5 transition-colors duration-200 ${
      isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50/70 border-slate-150"
    }`}>
      {/* Title & Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-slate-500 font-bold text-[10px] uppercase tracking-wider">
            <Award className="w-3.5 h-3.5 mr-1.5 text-amber-500 shrink-0" />
            <span>各专业「计划 vs 实际」微型趋势图</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-bold flex items-center gap-0.5 font-mono">
            <BarChart3 className="w-2.5 h-2.5" />
            共 {rankingData.length} 专业
          </span>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between pt-0.5">
          <p className="text-[9px] text-slate-400 leading-tight">
            {viewMode === "daily" ? `日期: ${selectedDate}` : `${selectedDate.substring(0, 7)}月`} 各专业计划与实际完成度对比
          </p>
          <div className={`flex p-0.5 rounded border text-[9px] font-bold ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <button
              type="button"
              onClick={() => setSortMode("actual")}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                sortMode === "actual"
                  ? (isDarkMode ? "bg-slate-800 text-emerald-400 font-extrabold" : "bg-emerald-50 text-emerald-700 font-extrabold")
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
              title="按实际登记人数排序"
            >
              按人数
            </button>
            <button
              type="button"
              onClick={() => setSortMode("rate")}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                sortMode === "rate"
                  ? (isDarkMode ? "bg-slate-800 text-emerald-400 font-extrabold" : "bg-emerald-50 text-emerald-700 font-extrabold")
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
              title="按达成率排序"
            >
              按达成率
            </button>
            <button
              type="button"
              onClick={() => setSortMode("gap")}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                sortMode === "gap"
                  ? (isDarkMode ? "bg-slate-800 text-amber-400 font-extrabold" : "bg-amber-50 text-amber-700 font-extrabold")
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
              title="按招生缺口数排序"
            >
              按缺口
            </button>
          </div>
        </div>

        {/* Micro Legend */}
        <div className="flex items-center gap-3 text-[8px] font-bold text-slate-400 pt-0.5 border-t dark:border-slate-800/80 border-slate-200/80">
          <div className="flex items-center gap-1">
            <span className="w-2 h-1 rounded-xs bg-blue-500" />
            <span>🔷 计划 (Target)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-1 rounded-xs bg-emerald-500" />
            <span>🟢 实际 (Actual)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-0.5 h-2 bg-indigo-500" />
            <span>🎯 目标线</span>
          </div>
        </div>
      </div>

      {/* Rankings List */}
      {rankingData.length > 0 ? (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {displayedRankings.map((item, index) => {
              const targetBarWidth = (item.target / maxScaleVal) * 100;
              const actualBarWidth = (item.actual / maxScaleVal) * 100;
              const isMet = item.actual >= item.target && item.target > 0;
              const isSurplus = item.actual > item.target && item.target > 0;
              const isShort = item.actual < item.target && item.target > 0;
              
              // Custom rank badges
              let rankBg = isDarkMode ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-200 text-slate-600 border-slate-300";
              if (index === 0) {
                rankBg = "bg-amber-500 text-white font-extrabold border-amber-400";
              } else if (index === 1) {
                rankBg = "bg-slate-400 text-white font-extrabold border-slate-300";
              } else if (index === 2) {
                rankBg = "bg-amber-700 text-white font-extrabold border-amber-600";
              }

              // Color styles for actual completion bar
              let actualGradient = "from-emerald-500 to-teal-400";
              let actualText = isDarkMode ? "text-emerald-400" : "text-emerald-600";
              if (isShort) {
                if (item.rate >= 50) {
                  actualGradient = "from-amber-500 to-yellow-400";
                  actualText = isDarkMode ? "text-amber-400" : "text-amber-600";
                } else {
                  actualGradient = "from-rose-500 to-pink-500";
                  actualText = isDarkMode ? "text-rose-400" : "text-rose-600";
                }
              }

              return (
                <motion.div
                  key={`major-rank-${item.name}`}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="p-2 rounded-lg transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-900/50 group/bar-card"
                >
                  {/* Top Header: Major name, status tag, numerical stats */}
                  <div className="flex items-center justify-between text-[11px] font-sans">
                    <div className="flex items-center gap-1.5 min-w-0 max-w-[55%]">
                      <span className={`w-3.5 h-3.5 rounded-full text-[8px] flex items-center justify-center shadow-xs border shrink-0 ${rankBg}`}>
                        {index + 1}
                      </span>
                      <span className={`font-bold truncate ${isDarkMode ? "text-slate-100" : "text-slate-800"}`} title={item.name}>
                        {item.name}
                      </span>
                    </div>

                    {/* Status Badge + Ratio */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isSurplus && (
                        <span className="text-[8px] px-1 py-0.2 rounded font-bold font-mono bg-indigo-500/15 text-indigo-500 dark:text-indigo-400">
                          超额 +{item.surplus}人
                        </span>
                      )}
                      {isMet && !isSurplus && (
                        <span className="text-[8px] px-1 py-0.2 rounded font-bold font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 className="w-2 h-2" />
                          已达标
                        </span>
                      )}
                      {isShort && (
                        <span className="text-[8px] px-1 py-0.2 rounded font-bold font-mono bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          缺 {item.gap}人
                        </span>
                      )}
                      {item.target === 0 && (
                        <span className="text-[8px] px-1 py-0.2 rounded font-bold font-mono bg-slate-200 dark:bg-slate-800 text-slate-500">
                          无计划
                        </span>
                      )}

                      <span className="text-[9px] font-bold font-mono text-slate-400">
                        ({item.rate.toFixed(0)}%)
                      </span>
                    </div>
                  </div>

                  {/* Micro Plan vs Actual Dual Bar Chart Container */}
                  <div className="mt-1.5 space-y-1">
                    {/* Track 1: 计划 (Target) Bar */}
                    <div className="flex items-center gap-1.5 text-[8px]">
                      <span className="w-6 text-slate-400 font-bold shrink-0 text-right">计划</span>
                      <div className="relative flex-1 h-1.5 rounded-full bg-slate-200/70 dark:bg-slate-800 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${targetBarWidth}%` }}
                          transition={{ duration: 0.3 }}
                          className="h-full bg-blue-500/80 dark:bg-blue-600/80 rounded-full"
                        />
                      </div>
                      <span className="w-7 font-mono font-bold text-slate-500 dark:text-slate-400 text-right shrink-0">
                        {item.target}人
                      </span>
                    </div>

                    {/* Track 2: 实际 (Actual) Bar with Target Marker Line */}
                    <div className="flex items-center gap-1.5 text-[8px]">
                      <span className="w-6 text-slate-400 font-bold shrink-0 text-right">实际</span>
                      <div className="relative flex-1 h-2 rounded-full bg-slate-200/50 dark:bg-slate-850 overflow-hidden flex items-center">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${actualBarWidth}%` }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className={`h-full rounded-full bg-gradient-to-r ${actualGradient} shadow-xs`}
                        />
                        {/* Target Marker Line (计划目标线) */}
                        {item.target > 0 && targetBarWidth > 0 && targetBarWidth <= 100 && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-indigo-600 dark:bg-indigo-400 z-10 shadow-xs opacity-90"
                            style={{ left: `${targetBarWidth}%` }}
                            title={`计划目标线: ${item.target}人`}
                          />
                        )}
                      </div>
                      <span className={`w-7 font-mono font-extrabold ${actualText} text-right shrink-0`}>
                        {item.actual}人
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Expand/Collapse Button */}
          {rankingData.length > visibleCount && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`w-full py-1 text-center font-bold text-[9px] rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer border mt-1 ${
                isDarkMode 
                  ? "bg-slate-900 hover:bg-slate-855 border-slate-800 text-slate-400 hover:text-slate-200" 
                  : "bg-white hover:bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-700"
              }`}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  <span>收起专业列表</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  <span>展开查看全部 {rankingData.length} 个专业微型趋势</span>
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="h-28 flex flex-col items-center justify-center border border-dashed rounded-lg dark:border-slate-800 border-slate-200">
          <p className="text-[10px] text-slate-400 font-medium">当前时间段暂无专业招生数据</p>
          <p className="text-[9px] text-slate-500 mt-1">请在表格内添加专业或选择其它日期</p>
        </div>
      )}
    </div>
  );
}
