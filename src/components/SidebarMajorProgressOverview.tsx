import React, { useState, useMemo } from "react";
import { 
  BarChart3, 
  MapPin, 
  TrendingUp, 
  TrendingDown,
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Clock, 
  ArrowUpDown, 
  ArrowDown,
  ArrowUp,
  ChevronDown, 
  ChevronUp,
  Target,
  Sparkles,
  ExternalLink,
  BarChart2,
  Activity,
  ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RowData, TableConfig } from "../types";
import MajorChannelDetailModal from "./MajorChannelDetailModal";
import { getMajorAlertStatus } from "../utils/majorAlert";

interface SidebarMajorProgressOverviewProps {
  rows: RowData[];
  selectedDate: string;
  viewMode: "daily" | "monthly";
  isDarkMode: boolean;
  onSelectMajor: (majorName: string) => void;
  config?: TableConfig;
  onOpenTrendModal?: (majorName: string) => void;
}

type SortOption = 
  | "rate_desc" 
  | "rate_asc" 
  | "actual_desc" 
  | "actual_asc" 
  | "target_desc" 
  | "target_asc" 
  | "name";
type StatusFilter = "all" | "completed" | "progress" | "lagging";

export const SidebarMajorProgressOverview: React.FC<SidebarMajorProgressOverviewProps> = ({
  rows,
  selectedDate,
  viewMode,
  isDarkMode,
  onSelectMajor,
  config,
  onOpenTrendModal,
}) => {
  const [sortOption, setSortOption] = useState<SortOption>("rate_desc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [detailModalMajor, setDetailModalMajor] = useState<string | null>(null);

  const yellowThreshold = Number(localStorage.getItem("major_overview_yellow_threshold")) || 30;
  const redThreshold = Number(localStorage.getItem("major_overview_red_threshold")) || 10;

  // Compute major progress metrics for current timeframe
  const majorsProgress = useMemo(() => {
    // Filter rows based on viewMode
    let filteredRows = rows;
    if (viewMode === "daily") {
      filteredRows = rows.filter((r) => r.date === selectedDate);
    } else {
      const monthPrefix = selectedDate.substring(0, 7);
      filteredRows = rows.filter((r) => r.date.startsWith(monthPrefix));
    }

    // Exclude merged summary group rows if needed, or group by major name
    const aggMap: { [name: string]: { target: number; actual: number } } = {};

    filteredRows.forEach((r) => {
      // Ignore group header summary rows if they are duplicate group rows
      if (r.isMergedGroup) return;

      const majorName = r.name;
      if (!majorName) return;

      if (!aggMap[majorName]) {
        aggMap[majorName] = { target: 0, actual: 0 };
      }

      const rowTarget = r.channels ? r.channels.reduce((sum, ch) => sum + (Number(ch.target) || 0), 0) : 0;
      const rowChannelActual = r.channels ? r.channels.reduce((sum, ch) => sum + (Number(ch.actual) || 0), 0) : 0;
      const oVal = r.other;
      const rowOtherActual = typeof oVal === "number" ? oVal : (typeof oVal === "object" && oVal !== null && "actual" in oVal ? (oVal as { actual: number }).actual : 0);
      const rowActual = rowChannelActual + (Number(rowOtherActual) || 0);

      aggMap[majorName].target += rowTarget;
      aggMap[majorName].actual += rowActual;
    });

    const list = Object.entries(aggMap).map(([name, data]) => {
      const rate = data.target > 0 ? (data.actual / data.target) * 100 : 0;
      return {
        name,
        target: data.target,
        actual: data.actual,
        rate,
        gap: Math.max(0, data.target - data.actual),
      };
    });

    return list;
  }, [rows, selectedDate, viewMode]);

  // Helper to compute recent 7-day historical trend for a given major
  const getMajor7DayTrend = (majorName: string) => {
    const allDates = Array.from(new Set(rows.map((r) => r.date))).sort();
    let endDateIndex = allDates.indexOf(selectedDate);
    if (endDateIndex === -1) endDateIndex = allDates.length - 1;
    const last7Dates = allDates.slice(Math.max(0, endDateIndex - 6), endDateIndex + 1);

    return last7Dates.map((d) => {
      const dayRows = rows.filter((r) => r.date === d && r.name === majorName && !r.isMergedGroup);
      let target = 0;
      let actual = 0;
      dayRows.forEach((r) => {
        if (r.channels) {
          r.channels.forEach((c) => {
            target += Number(c.target) || 0;
            actual += Number(c.actual) || 0;
          });
        }
        const oVal = r.other;
        const oActual = typeof oVal === "number" ? oVal : (typeof oVal === "object" && oVal !== null && "actual" in oVal ? (oVal as { actual: number }).actual : 0);
        actual += Number(oActual) || 0;
      });
      const shortDate = d.length >= 5 ? d.substring(5) : d;
      return { date: d, shortDate, target, actual };
    });
  };

  // Compute expected average progress percentage based on current date (时间进度基准)
  const { expectedTimeProgressRate, currentDay, totalDaysInMonth } = useMemo(() => {
    if (!selectedDate) return { expectedTimeProgressRate: 50, currentDay: 15, totalDaysInMonth: 30 };
    const parts = selectedDate.split("-");
    if (parts.length < 3) return { expectedTimeProgressRate: 50, currentDay: 15, totalDaysInMonth: 30 };
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return { expectedTimeProgressRate: 50, currentDay: 15, totalDaysInMonth: 30 };

    const totalDays = new Date(year, month, 0).getDate() || 30;
    const rate = Math.min(100, Math.max(1, (day / totalDays) * 100));
    return { expectedTimeProgressRate: rate, currentDay: day, totalDaysInMonth: totalDays };
  }, [selectedDate]);

  // Summary Counts
  const totalMajors = majorsProgress.length;
  const completedCount = majorsProgress.filter((m) => m.rate >= 100).length;
  const progressCount = majorsProgress.filter((m) => m.rate >= 50 && m.rate < 100).length;
  const laggingCount = majorsProgress.filter((m) => m.rate < 50).length;
  const aheadOfTimeCount = majorsProgress.filter((m) => m.rate >= expectedTimeProgressRate).length;
  const behindTimeCount = majorsProgress.filter((m) => m.rate < expectedTimeProgressRate).length;
  const avgRate = totalMajors > 0 
    ? majorsProgress.reduce((sum, m) => sum + m.rate, 0) / totalMajors 
    : 0;

  // Filtered & Sorted List
  const processedList = useMemo(() => {
    let result = [...majorsProgress];

    // Status filter
    if (statusFilter === "completed") {
      result = result.filter((m) => m.rate >= 100);
    } else if (statusFilter === "progress") {
      result = result.filter((m) => m.rate >= 50 && m.rate < 100);
    } else if (statusFilter === "lagging") {
      result = result.filter((m) => m.rate < 50);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case "rate_desc":
          return b.rate - a.rate;
        case "rate_asc":
          return a.rate - b.rate;
        case "actual_desc":
          return b.actual - a.actual;
        case "actual_asc":
          return a.actual - b.actual;
        case "target_desc":
          return b.target - a.target;
        case "target_asc":
          return a.target - b.target;
        case "name":
          return a.name.localeCompare(b.name, "zh-CN");
        default:
          return b.rate - a.rate;
      }
    });

    return result;
  }, [majorsProgress, statusFilter, sortOption]);

  const defaultVisibleCount = 6;
  const visibleList = showAll ? processedList : processedList.slice(0, defaultVisibleCount);

  // Derive active metric and direction for clean UI state
  const isRateSort = sortOption === "rate_desc" || sortOption === "rate_asc";
  const isActualSort = sortOption === "actual_desc" || sortOption === "actual_asc";
  const isTargetSort = sortOption === "target_desc" || sortOption === "target_asc";
  const isAscending = sortOption === "rate_asc" || sortOption === "actual_asc" || sortOption === "target_asc";

  const handleMetricToggle = (metric: "rate" | "actual") => {
    if (metric === "rate") {
      setSortOption(isAscending ? "rate_asc" : "rate_desc");
    } else {
      setSortOption(isAscending ? "actual_asc" : "actual_desc");
    }
  };

  const handleDirectionToggle = (dir: "desc" | "asc") => {
    if (isRateSort) {
      setSortOption(dir === "desc" ? "rate_desc" : "rate_asc");
    } else if (isActualSort) {
      setSortOption(dir === "desc" ? "actual_desc" : "actual_asc");
    } else if (isTargetSort) {
      setSortOption(dir === "desc" ? "target_desc" : "target_asc");
    } else {
      setSortOption(dir === "desc" ? "rate_desc" : "rate_asc");
    }
  };

  return (
    <div className={`rounded-xl border transition-all ${
      isDarkMode 
        ? "bg-slate-950/80 border-slate-800/80 shadow-md shadow-black/20" 
        : "bg-white border-slate-200/80 shadow-xs"
    }`}>
      {/* Header Bar */}
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="p-3 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between cursor-pointer select-none group"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:scale-105 transition-transform">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black tracking-tight text-slate-800 dark:text-slate-100">
                各专业进度概览
              </h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {totalMajors} 个专业
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              点击专业柱状图查看7天增长趋势与渠道拆解弹窗
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Collapsible Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-3 space-y-3"
          >
            {/* Quick Status Pill Filters */}
            <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`py-1 px-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs"
                    : isDarkMode
                    ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                全部 ({totalMajors})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("completed")}
                className={`py-1 px-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                  statusFilter === "completed"
                    ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-2xs"
                    : isDarkMode
                    ? "bg-slate-900 border-slate-800 text-emerald-400 hover:bg-emerald-950/30"
                    : "bg-emerald-50/60 border-emerald-200 text-emerald-700 hover:bg-emerald-100/60"
                }`}
              >
                达标 ({completedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("progress")}
                className={`py-1 px-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                  statusFilter === "progress"
                    ? "bg-amber-600 text-white border-amber-600 font-bold shadow-2xs"
                    : isDarkMode
                    ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-amber-950/30"
                    : "bg-amber-50/60 border-amber-200 text-amber-700 hover:bg-amber-100/60"
                }`}
              >
                推进 ({progressCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("lagging")}
                className={`py-1 px-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                  statusFilter === "lagging"
                    ? "bg-rose-600 text-white border-rose-600 font-bold shadow-2xs"
                    : isDarkMode
                    ? "bg-slate-900 border-slate-800 text-rose-400 hover:bg-rose-950/30"
                    : "bg-rose-50/60 border-rose-200 text-rose-700 hover:bg-rose-100/60"
                }`}
              >
                滞后 ({laggingCount})
              </button>
            </div>

            {/* Expected Time Progress Baseline Banner & Legend */}
            <div className={`p-2 rounded-lg border text-[10px] flex items-center justify-between gap-2 ${
              isDarkMode 
                ? "bg-amber-500/10 border-amber-500/20 text-amber-200" 
                : "bg-amber-50 border-amber-200 text-amber-900"
            }`}>
              <div className="flex items-center gap-1.5 font-medium min-w-0">
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">
                  时间进度基准: <strong className="font-bold text-amber-600 dark:text-amber-400 font-mono">{expectedTimeProgressRate.toFixed(1)}%</strong>
                  <span className="text-[9px] opacity-75 ml-1">({currentDay}/{totalDaysInMonth}天)</span>
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0 font-mono text-[9px]">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                  {aheadOfTimeCount} 超前
                </span>
                <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20">
                  {behindTimeCount} 落后
                </span>
              </div>
            </div>

            {/* Sort Controls & Direction Toggle Switcher */}
            <div className="space-y-2 pt-0.5">
              {/* Primary Dual-Control: Dimension (完成率 vs 总招生数) + Direction (降序 vs 升序) */}
              <div className={`p-2 rounded-lg border flex flex-col gap-2 text-[10px] ${
                isDarkMode ? "bg-slate-900/70 border-slate-800/80 text-slate-300" : "bg-slate-50 border-slate-200/80 text-slate-700"
              }`}>
                {/* Top Row: Metric & Direction Selectors */}
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  {/* Metric Switcher */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">
                      排序维度:
                    </span>
                    <div className={`flex items-center p-0.5 rounded-md border text-[10px] ${
                      isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
                    }`}>
                      <button
                        type="button"
                        onClick={() => handleMetricToggle("rate")}
                        className={`px-2 py-0.5 rounded flex items-center gap-1 font-bold transition-all cursor-pointer ${
                          isRateSort
                            ? "bg-indigo-600 text-white shadow-2xs font-extrabold"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                        title="按完成达成率(%)排序"
                      >
                        <Target className="w-3 h-3" />
                        <span>完成率 (%)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMetricToggle("actual")}
                        className={`px-2 py-0.5 rounded flex items-center gap-1 font-bold transition-all cursor-pointer ${
                          isActualSort
                            ? "bg-indigo-600 text-white shadow-2xs font-extrabold"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                        title="按总招生人数(实际完成)排序"
                      >
                        <Activity className="w-3 h-3" />
                        <span>总招生数 (人)</span>
                      </button>
                    </div>
                  </div>

                  {/* Direction Switcher */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">
                      方向:
                    </span>
                    <div className={`flex items-center p-0.5 rounded-md border text-[10px] ${
                      isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
                    }`}>
                      <button
                        type="button"
                        onClick={() => handleDirectionToggle("desc")}
                        className={`px-2 py-0.5 rounded flex items-center gap-1 font-bold transition-all cursor-pointer ${
                          !isAscending
                            ? "bg-emerald-600 text-white shadow-2xs font-extrabold"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                        title="从高到低 (降序排列)"
                      >
                        <ArrowDown className="w-3 h-3" />
                        <span>降序 ↓</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDirectionToggle("asc")}
                        className={`px-2 py-0.5 rounded flex items-center gap-1 font-bold transition-all cursor-pointer ${
                          isAscending
                            ? "bg-rose-600 text-white shadow-2xs font-extrabold"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                        title="从低到高 (升序排列，排查滞后与薄弱)"
                      >
                        <ArrowUp className="w-3 h-3" />
                        <span>升序 ↑</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Quick Presets & Dropdown */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                  {/* Preset Pills */}
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSortOption("rate_desc")}
                      className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold transition-all cursor-pointer border ${
                        sortOption === "rate_desc"
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40"
                          : isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      🎯 完成率 ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortOption("rate_asc")}
                      className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold transition-all cursor-pointer border ${
                        sortOption === "rate_asc"
                          ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40"
                          : isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      🎯 完成率 ↑ (查滞后)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortOption("actual_desc")}
                      className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold transition-all cursor-pointer border ${
                        sortOption === "actual_desc"
                          ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40"
                          : isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      👥 总招生数 ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortOption("actual_asc")}
                      className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold transition-all cursor-pointer border ${
                        sortOption === "actual_asc"
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40"
                          : isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      👥 总招生数 ↑ (查薄弱)
                    </button>
                  </div>

                  {/* Dropdown Menu */}
                  <div className="flex items-center gap-1 ml-auto">
                    <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as SortOption)}
                      className={`bg-transparent outline-none cursor-pointer font-bold text-[10px] ${
                        isDarkMode ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <option value="rate_desc" className={isDarkMode ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>完成率 (从高到低)</option>
                      <option value="rate_asc" className={isDarkMode ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>完成率 (从低到高·查滞后)</option>
                      <option value="actual_desc" className={isDarkMode ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>总招生数 (从高到低·看主力)</option>
                      <option value="actual_asc" className={isDarkMode ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>总招生数 (从低到高·查薄弱)</option>
                      <option value="target_desc" className={isDarkMode ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>计划目标 (从高到低)</option>
                      <option value="target_asc" className={isDarkMode ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>计划目标 (从低到高)</option>
                      <option value="name" className={isDarkMode ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>专业名称 (A-Z)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Status Notice Banner for Contextual Awareness */}
              {sortOption === "rate_asc" && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`px-2 py-1 rounded text-[9.5px] flex items-center justify-between font-mono ${
                    isDarkMode ? "bg-rose-950/40 border border-rose-900/50 text-rose-300" : "bg-rose-50 border border-rose-200 text-rose-700"
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                    <span>滞后排查视图：已将达成率最低的专业置顶展示</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSortOption("rate_desc")}
                    className="underline hover:text-rose-500 cursor-pointer font-sans"
                  >
                    恢复降序
                  </button>
                </motion.div>
              )}

              {sortOption === "actual_asc" && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`px-2 py-1 rounded text-[9.5px] flex items-center justify-between font-mono ${
                    isDarkMode ? "bg-amber-950/40 border border-amber-900/50 text-amber-300" : "bg-amber-50 border border-amber-200 text-amber-700"
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold">
                    <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>薄弱排查视图：已将总招生人数最少的专业置顶展示</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSortOption("actual_desc")}
                    className="underline hover:text-amber-500 cursor-pointer font-sans"
                  >
                    恢复降序
                  </button>
                </motion.div>
              )}

              {sortOption === "actual_desc" && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`px-2 py-1 rounded text-[9.5px] flex items-center justify-between font-mono ${
                    isDarkMode ? "bg-blue-950/40 border border-blue-900/50 text-blue-300" : "bg-blue-50 border border-blue-200 text-blue-700"
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold">
                    <Activity className="w-3 h-3 text-blue-500 shrink-0" />
                    <span>规模主力视图：已按总招生人数从多到少排序</span>
                  </div>
                  <span className="opacity-75">看主力专业</span>
                </motion.div>
              )}

              {/* Average rate summary */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
                <div className="flex items-center gap-1 font-mono">
                  <span>所有专业均值达成率:</span>
                  <span className={`font-bold ${avgRate >= expectedTimeProgressRate ? "text-emerald-500" : "text-amber-500"}`}>
                    {avgRate.toFixed(1)}%
                  </span>
                </div>
                <span className="text-[9px]">
                  共 {visibleList.length}/{processedList.length} 个专业
                </span>
              </div>
            </div>

            {/* Major Bar Items List */}
            {visibleList.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-lg">
                暂无符合条件的专业进度数据
              </div>
            ) : (
              <div className="space-y-2.5">
                {visibleList.map((item, idx) => {
                  const isCompleted = item.rate >= 100;
                  const isHighProgress = item.rate >= 70 && item.rate < 100;
                  const isMediumProgress = item.rate >= 50 && item.rate < 70;
                  
                  // Comparison with time baseline
                  const diffFromBaseline = item.rate - expectedTimeProgressRate;
                  const isAhead = diffFromBaseline >= 0;

                  // Bar Fill Gradient
                  let barGradient = "from-rose-500 to-amber-500";
                  let rateBadgeBg = isDarkMode ? "bg-rose-500/15 text-rose-400 border-rose-500/20" : "bg-rose-50 text-rose-700 border-rose-200";

                  if (isCompleted) {
                    barGradient = "from-emerald-500 to-teal-400";
                    rateBadgeBg = isDarkMode ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200";
                  } else if (isHighProgress) {
                    barGradient = "from-indigo-500 to-blue-400";
                    rateBadgeBg = isDarkMode ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/20" : "bg-indigo-50 text-indigo-700 border-indigo-200";
                  } else if (isMediumProgress) {
                    barGradient = "from-amber-500 to-yellow-400";
                    rateBadgeBg = isDarkMode ? "bg-amber-500/15 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-700 border-amber-200";
                  }

                  const fillWidth = Math.min(100, Math.max(2, item.rate));

                  // Calculate 24h volatility & critical threshold alert status
                  const alertStatus = getMajorAlertStatus(
                    item.name,
                    rows,
                    selectedDate,
                    item.rate,
                    expectedTimeProgressRate
                  );

                  return (
                    <div
                      key={`sidebar-major-bar-${item.name}-${idx}`}
                      onClick={() => setDetailModalMajor(item.name)}
                      className={`p-2 rounded-lg border transition-all cursor-pointer group/bar relative overflow-hidden ${
                        isDarkMode
                          ? "bg-slate-900/60 border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-850/80 hover:shadow-md hover:shadow-black/40"
                          : "bg-slate-50/70 border-slate-200/80 hover:border-emerald-500/50 hover:bg-white hover:shadow-xs"
                      }`}
                      title={`点击查看${item.name}7天增长趋势与渠道拆解弹窗`}
                    >
                      {/* Top Label & Actions */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0 pr-1">
                          <MapPin className="w-3 h-3 text-emerald-500 shrink-0 opacity-70 group-hover/bar:opacity-100 group-hover/bar:scale-110 transition-all" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailModalMajor(item.name);
                            }}
                            className={`text-xs font-bold truncate text-left transition-colors cursor-pointer flex items-center gap-1 hover:underline ${
                              isDarkMode ? "text-slate-200 hover:text-emerald-400" : "text-slate-800 hover:text-emerald-600"
                            }`}
                            title={`点击弹出【${item.name}】详细招生进度分析弹窗 (包含所有渠道详细对比数据与历史趋势图)`}
                          >
                            <span>{item.name}</span>
                            <BarChart2 className="w-3 h-3 text-emerald-500 opacity-60 hover:opacity-100 shrink-0 inline" />
                          </button>
                          {/* Top Red Triangle Marker if Alert Triggered */}
                          {alertStatus.hasAlert && (
                            <div className="flex items-center gap-0.5 px-1 py-0.2 rounded bg-rose-500/15 border border-rose-500/30 text-rose-500 font-bold text-[8.5px] shrink-0 animate-pulse" title={`预警: ${alertStatus.alertReason}`}>
                              <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-rose-500" />
                              <span>预警</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Total Actual Students count - Highlighted when sorting by actual */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMetricToggle("actual");
                            }}
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-all cursor-pointer border ${
                              isActualSort
                                ? isDarkMode
                                  ? "bg-blue-500/20 border-blue-500/40 text-blue-300 font-extrabold"
                                  : "bg-blue-50 border-blue-200 text-blue-800 font-extrabold shadow-2xs"
                                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                            }`}
                            title="点击按总招生数排序"
                          >
                            <span className={`font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{item.actual}</span>
                            <span> / {item.target} 人</span>
                          </button>

                          {/* Completion Rate Badge - Highlighted when sorting by rate */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMetricToggle("rate");
                            }}
                            className={`text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded border transition-all cursor-pointer ${rateBadgeBg} ${
                              isRateSort ? "ring-1 ring-emerald-500/50 ring-offset-1 ring-offset-slate-900 shadow-2xs" : ""
                            }`}
                            title="点击按完成率排序"
                          >
                            {item.rate.toFixed(1)}%
                          </button>
                        </div>
                      </div>

                      {/* 小型警告图标 (低于yellowThreshold% 黄色警告，低于redThreshold% 红色报警) */}
                      {item.rate < redThreshold ? (
                        <div className="flex items-center gap-1 mb-1 px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-500 font-bold text-[9px] w-fit animate-pulse" title={`达成率低于${redThreshold}% (当前${item.rate.toFixed(1)}%)：红色报警`}>
                          <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>低于{redThreshold}% 红色报警</span>
                        </div>
                      ) : item.rate < yellowThreshold ? (
                        <div className="flex items-center gap-1 mb-1 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-500 font-bold text-[9px] w-fit" title={`达成率低于${yellowThreshold}% (当前${item.rate.toFixed(1)}%)：黄色警告`}>
                          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>低于{yellowThreshold}% 黄色警告</span>
                        </div>
                      ) : null}

                      {/* Bar Track & Fill with Baseline Reference Line */}
                      <div className={`w-full h-2.5 rounded-full overflow-hidden relative ${
                        isDarkMode ? "bg-slate-800" : "bg-slate-200"
                      }`}>
                        {/* Fill bar */}
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${fillWidth}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={`h-full rounded-full bg-gradient-to-r ${barGradient} relative`}
                        />

                        {/* Baseline Reference Line (基准参考线 - 橙色高亮线) */}
                        {expectedTimeProgressRate > 0 && expectedTimeProgressRate < 100 && (
                          <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-20 shadow-[0_0_4px_rgba(245,158,11,0.9)]"
                            style={{ left: `${Math.min(100, expectedTimeProgressRate)}%` }}
                            title={`当前时间预期进度基准线 (${expectedTimeProgressRate.toFixed(1)}%)`}
                          >
                            <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                          </div>
                        )}

                        {/* 100% Target Reference Line if not reached */}
                        {!isCompleted && item.target > 0 && (
                          <div 
                            className="absolute top-0 bottom-0 right-0 w-0.5 bg-slate-400/50 z-10" 
                            title="100% 计划完成线" 
                          />
                        )}
                      </div>

                      {/* 柱状图正下方：红色三角形标志与波动/临界值自动提示 */}
                      {alertStatus.hasAlert && (
                        <div 
                          className="flex items-center gap-1.5 mt-1 px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-[9px] font-mono animate-pulse hover:animate-none transition-all"
                          title={`【24小时波动/临界值预警提示】\n${alertStatus.alertReason}`}
                        >
                          {/* 小红色三角形标志 (Pure CSS Red Triangle) */}
                          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[7px] border-b-rose-500 shrink-0 shadow-xs" />
                          <span className="truncate">【预警提示】{alertStatus.alertReason}</span>
                        </div>
                      )}

                      {/* 7-Day Historical Trend Mini Sparkline Chart */}
                      {(() => {
                        const trendData = getMajor7DayTrend(item.name);
                        if (!trendData || trendData.length < 2) return null;
                        const actuals = trendData.map((d) => d.actual);
                        const minActual = Math.min(...actuals);
                        const maxActual = Math.max(...actuals, minActual + 1);
                        const range = (maxActual - minActual) || 1;
                        const width = 80;
                        const height = 16;
                        const pad = 2;

                        const pts = trendData.map((d, i) => {
                          const x = pad + (i / (trendData.length - 1 || 1)) * (width - 2 * pad);
                          const y = height - pad - ((d.actual - minActual) / range) * (height - 2 * pad);
                          return { x, y, ...d };
                        });
                        const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
                        const firstVal = actuals[0] || 0;
                        const lastVal = actuals[actuals.length - 1] || 0;
                        const isUp = lastVal >= firstVal;

                        return (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailModalMajor(item.name);
                            }}
                            className="flex items-center justify-between text-[8px] mt-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-800/60 cursor-pointer group/trend"
                            title={`点击查看详细招生分析弹窗\n近7日招生趋势: ${trendData.map((d) => `${d.shortDate}: ${d.actual}人`).join(" → ")}`}
                          >
                            <div className="flex items-center gap-1 text-slate-400 group-hover/trend:text-emerald-500 transition-colors">
                              <Activity className={`w-2.5 h-2.5 ${isUp ? "text-emerald-500" : "text-rose-500"}`} />
                              <span>7日趋势:</span>
                              <span className={`font-mono font-bold ${isUp ? "text-emerald-500" : "text-rose-500"}`}>
                                {isUp ? `+${lastVal - firstVal}` : `${lastVal - firstVal}`}人
                              </span>
                            </div>

                            <div className="w-20 h-4 flex items-center justify-center">
                              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                                <path
                                  d={pathD}
                                  fill="none"
                                  stroke={isUp ? "#10b981" : "#f43f5e"}
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                {pts.map((p, pIdx) => (
                                  <circle
                                    key={`sidebar-spark-${item.name}-${pIdx}`}
                                    cx={p.x}
                                    cy={p.y}
                                    r={pIdx === pts.length - 1 ? "2" : "1"}
                                    fill={pIdx === pts.length - 1 ? (isUp ? "#10b981" : "#f43f5e") : "#94a3b8"}
                                  />
                                ))}
                              </svg>
                            </div>

                            <span className="text-[7.5px] font-mono text-slate-400 group-hover/trend:text-indigo-400 transition-colors flex items-center gap-0.5">
                              <span>详情</span>
                              <ArrowUpRight className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        );
                      })()}

                      {/* Footer Actions & Baseline deviation badge */}
                      <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 opacity-90 transition-opacity">
                        <div className="flex items-center gap-1.5">
                          <span>
                            {isCompleted ? "🎉 已超额完成目标" : `缺口: ${item.gap}人`}
                          </span>
                          <span className={`font-mono font-bold px-1 rounded text-[8.5px] ${
                            isAhead
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          }`}
                          title={`较时间基准线 (${expectedTimeProgressRate.toFixed(1)}%) 偏离`}>
                            {isAhead ? `超前 +${diffFromBaseline.toFixed(1)}%` : `落后 ${diffFromBaseline.toFixed(1)}%`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectMajor(item.name);
                            }}
                            className="flex items-center gap-0.5 text-slate-400 hover:text-emerald-500 transition-colors"
                            title="直接定位跳转到基础数据表对应行"
                          >
                            <span>跳转表格</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailModalMajor(item.name);
                            }}
                            className="flex items-center gap-0.5 text-indigo-500 font-bold hover:underline cursor-pointer"
                            title="点击弹出该专业全渠道详细对比数据和历史趋势弹窗"
                          >
                            <span>拆解弹窗</span>
                            <BarChart2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Show More / Show Less Toggle Button */}
            {processedList.length > defaultVisibleCount && (
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className={`w-full py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  isDarkMode
                    ? "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 shadow-2xs"
                }`}
              >
                <span>{showAll ? "收起列表" : `查看全部 (${processedList.length} 个专业)`}</span>
                {showAll ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Major Channel Detail & Past 7 Days Growth Trend Modal */}
      <MajorChannelDetailModal
        isOpen={!!detailModalMajor}
        onClose={() => setDetailModalMajor(null)}
        majorName={detailModalMajor || ""}
        rows={rows}
        config={config}
        isDarkMode={isDarkMode}
        selectedDate={selectedDate}
        onOpenTrendModal={onOpenTrendModal}
      />
    </div>
  );
};

export default SidebarMajorProgressOverview;
