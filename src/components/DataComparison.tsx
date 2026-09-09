/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { RowData, TableConfig } from "../types";
import { motion } from "motion/react";
import {
  TrendingUp,
  BarChart2,
  Users,
  Target,
  Award,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  ListFilter,
  ArrowUpDown,
  Compass,
  PieChart,
  Sparkles,
  Copy,
  Download,
  Calendar,
  Calculator,
  Briefcase
} from "lucide-react";

interface DataComparisonProps {
  rows: RowData[];
  config: TableConfig;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  isDarkMode?: boolean;
}

// Helper to calculate coordinates for polar angles
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

// Helper to generate SVG path for a donut segment
function getDonutPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
) {
  const diff = endAngle - startAngle;
  // If it's a full 360-degree circle, adjust slightly to prevent overlapping start/end points
  const safeEndAngle = diff >= 359.99 ? startAngle + 359.99 : endAngle;

  const startOut = polarToCartesian(cx, cy, outerRadius, startAngle);
  const endOut = polarToCartesian(cx, cy, outerRadius, safeEndAngle);
  const startIn = polarToCartesian(cx, cy, innerRadius, startAngle);
  const endIn = polarToCartesian(cx, cy, innerRadius, safeEndAngle);

  const largeArcFlag = diff <= 180 ? "0" : "1";

  return [
    `M ${startOut.x} ${startOut.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOut.x} ${endOut.y}`,
    `L ${endIn.x} ${endIn.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startIn.x} ${startIn.y}`,
    "Z"
  ].join(" ");
}

// Helper to round max values to neat steps
function getNiceMaxY(maxVal: number) {
  if (maxVal <= 0) return 10;
  if (maxVal <= 5) return 5;
  if (maxVal <= 10) return 10;
  if (maxVal <= 20) return 20;
  if (maxVal <= 40) return 40;
  if (maxVal <= 60) return 60;
  if (maxVal <= 100) return 100;
  if (maxVal <= 200) return 200;
  return Math.ceil(maxVal / 50) * 50;
}

const channelColors = [
  "#059669", // 咨询一部 (Emerald)
  "#4f46e5", // 咨询二部 (Indigo)
  "#7c3aed", // 网络运营 (Violet)
  "#d97706", // 品牌渠道 (Amber)
  "#e11d48", // 新媒体部 (Rose)
  "#0284c7", // 代理合作 (Sky)
  "#ea580c"  // 老生转介绍 (Orange)
];

const channelBgColors = [
  "bg-emerald-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-orange-500"
];

const channelTextColors = [
  "text-emerald-600",
  "text-indigo-600",
  "text-violet-600",
  "text-amber-600",
  "text-rose-600",
  "text-sky-600",
  "text-orange-600"
];

export default function DataComparison({ rows, config, selectedDate, setSelectedDate, isDarkMode = false }: DataComparisonProps) {
  const [activeSubTab, setActiveSubTab] = useState<"channel" | "major" | "timeframe" | "forecast" | "insights">("timeframe");
  
  const subtabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = subtabsRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);
  const [selectedMajorIds, setSelectedMajorIds] = useState<string[]>(
    Array.from(new Set(rows.map((r) => r.name))).slice(0, 3) // Default select first 3 unique major names
  );
  const [sortBy, setSortBy] = useState<"rate" | "actual" | "target">("rate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Forecast Simulation States
  const [forecastDeadline, setForecastDeadline] = useState<string>("2026-07-05");
  const [paceMultiplier, setPaceMultiplier] = useState<number>(1.0);
  const [focusChannelIdx, setFocusChannelIdx] = useState<number>(-1);
  const [showBriefingModal, setShowBriefingModal] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Channel ROI & Cost States
  const [tuitionFee, setTuitionFee] = useState<number>(9800);
  const [channelCosts, setChannelCosts] = useState<number[]>([15000, 12000, 45000, 20000, 28000, 32000, 5000]);

  // Timeframe Comparison specific states
  const [timeframeMode, setTimeframeMode] = useState<"sameDay" | "weekly" | "monthly" | "yearly">("sameDay");
  const [timeframeDate, setTimeframeDate] = useState<string>("2026-06-28");
  const [timeframeMajorFilter, setTimeframeMajorFilter] = useState<string>("all");

  // Visual View Mode Toggles
  const [channelViewMode, setChannelViewMode] = useState<"column" | "donut" | "bar">("column");
  const [majorViewMode, setMajorViewMode] = useState<"column" | "bar">("column");
  const [showBenchmarkLines, setShowBenchmarkLines] = useState<boolean>(true);
  
  // Interactive Hover indices
  const [hoveredChannelIdx, setHoveredChannelIdx] = useState<number>(-1);
  const [hoveredMajorIdx, setHoveredMajorIdx] = useState<number>(-1);

  // Calculate aggregates
  const channelData = config.channels.map((chName, chIdx) => {
    let targetSum = 0;
    let actualSum = 0;
    rows.forEach((row) => {
      targetSum += row.channels[chIdx]?.target || 0;
      actualSum += row.channels[chIdx]?.actual || 0;
    });
    const rate = targetSum > 0 ? (actualSum / targetSum) * 100 : 0;
    return {
      index: chIdx,
      name: chName,
      target: targetSum,
      actual: actualSum,
      rate
    };
  });

  // Calculate other personnel total
  const otherTotal = rows.reduce((sum, r) => sum + r.other, 0);

  // Overall calculations
  const overallTarget = channelData.reduce((sum, ch) => sum + ch.target, 0);
  const overallActual = channelData.reduce((sum, ch) => sum + ch.actual, 0) + otherTotal;
  const overallRate = overallTarget > 0 ? (overallActual / overallTarget) * 100 : 0;

  // Toggle major selection for PK comparison
  const handleToggleMajor = (id: string) => {
    if (selectedMajorIds.includes(id)) {
      if (selectedMajorIds.length > 1) {
        setSelectedMajorIds(selectedMajorIds.filter((mid) => mid !== id));
      }
    } else {
      if (selectedMajorIds.length < 5) {
        setSelectedMajorIds([...selectedMajorIds, id]);
      }
    }
  };

  // Channel Sorting
  const sortedChannelData = [...channelData].sort((a, b) => {
    let valA = a.rate;
    let valB = b.rate;
    if (sortBy === "actual") {
      valA = a.actual;
      valB = b.actual;
    } else if (sortBy === "target") {
      valA = a.target;
      valB = b.target;
    }

    return sortOrder === "desc" ? valB - valA : valA - valB;
  });

  const toggleSort = (type: "rate" | "actual" | "target") => {
    if (sortBy === type) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(type);
      setSortOrder("desc");
    }
  };

  // Majors calculations for ranking & selection (aggregated across all rows by major name)
  const majorStats = useMemo(() => {
    const map: Record<string, {
      id: string;
      name: string;
      target: number;
      actual: number;
      other: number;
      channels: { target: number; actual: number }[];
    }> = {};

    rows.forEach((row) => {
      if (!map[row.name]) {
        map[row.name] = {
          id: row.name,
          name: row.name,
          target: 0,
          actual: 0,
          other: 0,
          channels: row.channels.map(() => ({ target: 0, actual: 0 }))
        };
      }

      row.channels.forEach((ch, chIdx) => {
        if (!map[row.name].channels[chIdx]) {
          map[row.name].channels[chIdx] = { target: 0, actual: 0 };
        }
        map[row.name].channels[chIdx].target += ch.target || 0;
        map[row.name].channels[chIdx].actual += ch.actual || 0;
        map[row.name].target += ch.target || 0;
        map[row.name].actual += ch.actual || 0;
      });

      map[row.name].other += row.other || 0;
      map[row.name].actual += row.other || 0;
    });

    return Object.values(map).map((m) => ({
      ...m,
      rate: m.target > 0 ? (m.actual / m.target) * 100 : 0
    }));
  }, [rows]);

  // Rankings
  const topMajors = [...majorStats]
    .filter((m) => m.target > 0)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3);

  const bottomMajors = [...majorStats]
    .filter((m) => m.target > 0)
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 3);

  // Donut slices angle calculation
  const totalActualChannels = channelData.reduce((sum, ch) => sum + ch.actual, 0);
  let accumulatedAngle = 0;
  const donutSlices = channelData.map((ch, idx) => {
    const value = ch.actual;
    const percentage = totalActualChannels > 0 ? (value / totalActualChannels) * 100 : 0;
    const angle = totalActualChannels > 0 ? (value / totalActualChannels) * 360 : 0;
    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + angle;
    accumulatedAngle += angle;

    return {
      index: idx,
      name: ch.name,
      value,
      percentage,
      startAngle,
      endAngle,
      color: channelColors[idx % 7]
    };
  });

  // --- TIMEFRAME COMPARISON CALCULATIONS ---
  
  // Helper to find dates of a week given a pivot date
  const getWeekDates = (pivotDateStr: string) => {
    const pivot = new Date(pivotDateStr);
    if (isNaN(pivot.getTime())) {
      return {
        thisWeek: ["2026-06-22", "2026-06-23", "2026-06-24", "2026-06-25", "2026-06-26", "2026-06-27", "2026-06-28"],
        lastWeek: ["2026-06-15", "2026-06-16", "2026-06-17", "2026-06-18", "2026-06-19", "2026-06-20", "2026-06-21"]
      };
    }
    const day = pivot.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    
    const monday = new Date(pivot);
    monday.setDate(pivot.getDate() + diffToMonday);
    
    const thisWeek: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      thisWeek.push(`${yyyy}-${mm}-${dd}`);
    }
    
    const lastWeek: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() - 7 + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      lastWeek.push(`${yyyy}-${mm}-${dd}`);
    }
    
    return { thisWeek, lastWeek };
  };

  const { thisWeek: thisWeekDates, lastWeek: lastWeekDates } = getWeekDates(timeframeDate);

  // Mode 1: Same Day Department Comparison
  const sameDayRows = rows.filter(r => r.date === timeframeDate);
  const sameDayMajorData = sameDayRows.map(row => {
    const target = row.channels.reduce((sum, ch) => sum + ch.target, 0);
    const actual = row.channels.reduce((sum, ch) => sum + ch.actual, 0) + row.other;
    const rate = target > 0 ? (actual / target) * 100 : 0;
    return { id: row.id, name: row.name, target, actual, rate, other: row.other };
  }).sort((a, b) => b.actual - a.actual);

  const sameDayTotalActual = sameDayMajorData.reduce((sum, m) => sum + m.actual, 0);

  // Mode 2: Weekly Comparison (This Week vs Last Week)
  const thisWeekRows = rows.filter(r => thisWeekDates.includes(r.date));
  const lastWeekRows = rows.filter(r => lastWeekDates.includes(r.date));

  const allMajorNames = Array.from(new Set(rows.map(r => r.name)));

  const weeklyMajorData = allMajorNames.map(majorName => {
    const twMajorRows = thisWeekRows.filter(r => r.name === majorName);
    const twTarget = twMajorRows.reduce((sum, r) => sum + r.channels.reduce((s, c) => s + c.target, 0), 0);
    const twActual = twMajorRows.reduce((sum, r) => sum + r.channels.reduce((s, c) => s + c.actual, 0) + r.other, 0);
    
    const lwMajorRows = lastWeekRows.filter(r => r.name === majorName);
    const lwTarget = lwMajorRows.reduce((sum, r) => sum + r.channels.reduce((s, c) => s + c.target, 0), 0);
    const lwActual = lwMajorRows.reduce((sum, r) => sum + r.channels.reduce((s, c) => s + c.actual, 0) + r.other, 0);

    const diff = twActual - lwActual;
    const growth = lwActual > 0 ? (diff / lwActual) * 100 : 0;

    return {
      name: majorName,
      thisWeekTarget: twTarget,
      thisWeekActual: twActual,
      lastWeekTarget: lwTarget,
      lastWeekActual: lwActual,
      diff,
      growth
    };
  }).sort((a, b) => b.thisWeekActual - a.thisWeekActual);

  const weeklySummary = {
    thisWeekActual: weeklyMajorData.reduce((sum, m) => sum + m.thisWeekActual, 0),
    lastWeekActual: weeklyMajorData.reduce((sum, m) => sum + m.lastWeekActual, 0),
  };

  // Mode 3: Monthly Comparison (June 2026 vs May 2026)
  const juneRows = rows.filter(r => r.date.startsWith("2026-06"));
  const mayRows = rows.filter(r => r.date.startsWith("2026-05"));

  const monthlyMajorData = allMajorNames.map(majorName => {
    const jRows = juneRows.filter(r => r.name === majorName);
    const mRows = mayRows.filter(r => r.name === majorName);

    const juneTarget = jRows.reduce((sum, r) => sum + r.channels.reduce((s, c) => s + c.target, 0), 0);
    const juneActual = jRows.reduce((sum, r) => sum + r.channels.reduce((s, c) => s + c.actual, 0) + r.other, 0);

    const mayTarget = mRows.reduce((sum, r) => sum + r.channels.reduce((s, c) => s + c.target, 0), 0);
    const mayActual = mRows.reduce((sum, r) => sum + r.channels.reduce((s, c) => s + c.actual, 0) + r.other, 0);

    const diff = juneActual - mayActual;
    const growth = mayActual > 0 ? (diff / mayActual) * 100 : 0;

    return {
      name: majorName,
      juneTarget,
      juneActual,
      mayTarget,
      mayActual,
      diff,
      growth
    };
  }).sort((a, b) => b.juneActual - a.juneActual);

  const monthlySummary = {
    juneActual: monthlyMajorData.reduce((sum, m) => sum + m.juneActual, 0),
    mayActual: monthlyMajorData.reduce((sum, m) => sum + m.mayActual, 0),
  };

  // Mode 4: Yearly Comparison (June 2026 vs June 2025)
  const y2026Rows = rows.filter(r => r.date.startsWith("2026-06"));
  const y2025Rows = rows.filter(r => r.date.startsWith("2025-06"));

  const yearlyMajorData = allMajorNames.map(majorName => {
    const rows26 = y2026Rows.filter(r => r.name === majorName);
    const rows25 = y2025Rows.filter(r => r.name === majorName);

    const y26Target = rows26.reduce((sum, r) => sum + r.channels.reduce((s, c) => s + c.target, 0), 0);
    const y26Actual = rows26.reduce((sum, r) => sum + r.channels.reduce((s, c) => s + c.actual, 0) + r.other, 0);

    const y25Target = rows25.reduce((sum, r) => sum + r.channels.reduce((s, c) => s + c.target, 0), 0);
    const y25Actual = rows25.reduce((sum, r) => sum + r.channels.reduce((s, c) => s + c.actual, 0) + r.other, 0);

    const diff = y26Actual - y25Actual;
    const growth = y25Actual > 0 ? (diff / y25Actual) * 100 : 0;

    return {
      name: majorName,
      y26Target,
      y26Actual,
      y25Target,
      y25Actual,
      diff,
      growth
    };
  }).sort((a, b) => b.y26Actual - a.y26Actual);

  const yearlySummary = {
    y26Actual: yearlyMajorData.reduce((sum, m) => sum + m.y26Actual, 0),
    y25Actual: yearlyMajorData.reduce((sum, m) => sum + m.y25Actual, 0),
  };

  const elapsedDays = Array.from(new Set(rows.map(r => r.date).filter(Boolean))).length || 28;
  const dailyRunRate = overallActual / elapsedDays;

  const generateExecutiveBriefingText = () => {
    const elapsed = elapsedDays;
    const rateVal = overallRate;
    const sortedChs = [...channelData].sort((a,b)=>b.actual - a.actual);
    
    return `===========================================================
        2026年6月招生运营高层数据分析简报
===========================================================
系统截止日期/数据基准点: 2026年06月28日 (当前周期)

一、 宏观招生目标达成率 (Macro KPI Achievement)
-----------------------------------------------------------
  * 招生总设定目标 (Target): ${overallTarget} 人
  * 当前累计到账实际 (Actual): ${overallActual} 人
  * 总体目标达成进度 (Rate): ${rateVal.toFixed(1)}%
  * 目前绝对到账差额 (Gap): ${overallActual >= overallTarget ? "已提前超额达成！" : `${overallTarget - overallActual} 人 (尚需努力)`}
  * 平均每日录取运行速率 (Daily Run Rate): ${(overallActual / elapsed).toFixed(1)} 人/天

二、 核心渠道招生贡献排行 (Top Performance Channels)
-----------------------------------------------------------
${sortedChs.map((c, idx) => `  ${idx + 1}. [${config.channels[c.index]}] 到账: ${c.actual}人 | 目标: ${c.target}人 | 完成率: ${c.rate.toFixed(1)}%`).join('\n')}
  * 无渠道或非标准到账人数: ${otherTotal} 人

三、 专业招生大类金榜 (Top Performing Majors)
-----------------------------------------------------------
${topMajors.map((m, idx) => `  ${idx + 1}. [${m.name}] 达成率: ${m.rate.toFixed(1)}% (实际: ${m.actual}人 / 目标: ${m.target}人)`).join('\n')}

四、 需紧急督导预警专业 (Bottom Performing Majors)
-----------------------------------------------------------
${bottomMajors.map((m, idx) => `  ${idx + 1}. [${m.name}] 达成率: ${m.rate.toFixed(1)}% (实际: ${m.actual}人 / 目标: ${m.target}人)`).join('\n')}

五、 战略发展决策组建议 (Strategic Executive Action Plan)
-----------------------------------------------------------
  1. 【渠道二次爆破】排名前列的 [${config.channels[sortedChs[0]?.index] || '主力渠道'}] 到账占比最高，说明此通路转化效率优异。建议在最后冲刺阶段追加20%推广资源，扩大战果。
  2. 【大类招生引流】主力专业 [${topMajors[0]?.name || '热门专业'}] 市场认知度高，进度已达 ${topMajors[0]?.rate.toFixed(1)}%。可由该专业骨干招生老师开展专题宣讲，反哺带动其他关联专业。
  3. 【预警救市干预】专业 [${bottomMajors[0]?.name || '薄弱专业'}] 招生进度落后（达成率仅 ${bottomMajors[0]?.rate.toFixed(1)}%），需要立刻进行咨询回访攻坚，调拨线上专业咨询团队进行“一对一”帮扶招生。

-----------------------------------------------------------
（本简报由招生多维看板BI决策数据引擎自动分析生成，符合印刷高管汇报标准。可直接复制并分发）
===========================================================`;
  };

  const handleCopyBriefing = () => {
    const text = generateExecutiveBriefingText();
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(err => {
      console.error("Failed to copy briefing:", err);
    });
  };

  const handleDownloadBriefing = () => {
    const text = generateExecutiveBriefingText();
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `2026年6月招生运营高管简报-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className={`flex-1 flex flex-col overflow-hidden select-none transition-colors duration-200 ${
      isDarkMode ? "bg-slate-950 text-slate-100 theme-dark-override dark" : "bg-slate-50 text-slate-800"
    }`}>
      {/* Tab Switcher & Title Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center justify-between w-full xl:w-auto">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
              维度对比分析工作台 (Recruitment Comparison Dashboard)
            </span>
          </div>
          {/* Executive Briefing Button on mobile */}
          <button
            onClick={() => setShowBriefingModal(true)}
            className="xl:hidden flex items-center gap-1 bg-emerald-600 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-md shadow-xs cursor-pointer hover:bg-emerald-700 transition-all"
          >
            <Sparkles className="w-3 h-3 animate-pulse" />
            <span>生成简报</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Executive Briefing Button on desktop */}
          <button
            onClick={() => setShowBriefingModal(true)}
            className="hidden xl:flex items-center gap-1.5 bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm cursor-pointer hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>一键生成招生分析简报</span>
          </button>

          {/* Horizontal Nav Tabs */}
          <div 
            ref={subtabsRef}
            className="flex overflow-x-auto thin-scrollbar whitespace-nowrap bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs max-w-full shrink-0"
          >
            <button
              onClick={() => setActiveSubTab("channel")}
              className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeSubTab === "channel"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>渠道绩效对比</span>
            </button>
            <button
              onClick={() => setActiveSubTab("major")}
              className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeSubTab === "major"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>专业招生PK</span>
            </button>
            <button
              onClick={() => setActiveSubTab("timeframe")}
              className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeSubTab === "timeframe"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>多维周期对比</span>
            </button>
            <button
              onClick={() => setActiveSubTab("forecast")}
              className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeSubTab === "forecast"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>智能预测模拟</span>
            </button>
            <button
              onClick={() => setActiveSubTab("insights")}
              className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeSubTab === "insights"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>诊断与达成率</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Panel Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* SUBTAB 1: CHANNEL RECRUITMENT COMPARISON */}
        {activeSubTab === "channel" && (
          <div className="space-y-6">
            
            {/* Overview KPIs Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">整体招生进度对比</p>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
                    {overallActual} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">/ 计划 {overallTarget} 人</span>
                  </p>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">
                    完成率: {overallRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0">
                  <PieChart className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">渠道总分流 (7个主流渠道)</p>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
                    {overallActual - otherTotal} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">人已分配渠道</span>
                  </p>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-1.5 py-0.5 rounded">
                    占总完成数: {overallActual > 0 ? (((overallActual - otherTotal) / overallActual) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-600 dark:text-amber-400 shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">其他无渠道人员数</p>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
                    {otherTotal} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">人</span>
                  </p>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded">
                    由线下或直招等构成
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Interactive Horizontal Bar Comparison Chart with visual toggles */}
            <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs relative">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5 gap-4">
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">
                    各渠道「计划目标」与「实际完成」数据对比
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    对比各渠道计划数与真实录取人数，支持分组柱状图、占比饼图、数据进度条
                  </p>
                </div>

                {/* Switcher & Sort controls */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* View Toggle */}
                  <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                    <button
                      onClick={() => setChannelViewMode("column")}
                      className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                        channelViewMode === "column"
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs font-extrabold"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                      }`}
                    >
                      <BarChart2 className="w-3 h-3 text-emerald-500" />
                      <span>柱形对比图</span>
                    </button>
                    <button
                      onClick={() => setChannelViewMode("donut")}
                      className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                        channelViewMode === "donut"
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs font-extrabold"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                      }`}
                    >
                      <PieChart className="w-3 h-3 text-indigo-500" />
                      <span>占比饼状图</span>
                    </button>
                    <button
                      onClick={() => setChannelViewMode("bar")}
                      className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                        channelViewMode === "bar"
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs font-extrabold"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                      }`}
                    >
                      <Compass className="w-3 h-3 text-amber-500" />
                      <span>数据进度条</span>
                    </button>
                  </div>

                  {/* Bar sort control (Only visible when channelViewMode is 'bar') */}
                  {channelViewMode === "bar" && (
                    <div className="flex items-center space-x-1.5 text-[11px] border-l border-slate-200 dark:border-slate-800 pl-3">
                      <span className="text-slate-400 dark:text-slate-500 font-bold">排序:</span>
                      <button
                        onClick={() => toggleSort("rate")}
                        className={`px-2 py-0.5 rounded border text-[10px] transition-all flex items-center gap-0.5 cursor-pointer ${
                          sortBy === "rate"
                            ? "bg-slate-800 dark:bg-emerald-600 text-white border-slate-800 dark:border-emerald-600 font-bold"
                            : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        完成率 <ArrowUpDown className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => toggleSort("actual")}
                        className={`px-2 py-0.5 rounded border text-[10px] transition-all flex items-center gap-0.5 cursor-pointer ${
                          sortBy === "actual"
                            ? "bg-slate-800 dark:bg-emerald-600 text-white border-slate-800 dark:border-emerald-600 font-bold"
                            : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        人数 <ArrowUpDown className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* VIEW 1: DYNAMIC GROUPED COLUMN CHART (柱状图) */}
              {channelViewMode === "column" && (
                <div className="relative pt-2 pb-4">
                  {/* Legend */}
                  <div className="flex items-center space-x-4 justify-end text-[10px] mb-4 font-bold">
                    <div className="flex items-center space-x-1">
                      <span className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-700"></span>
                      <span className="text-slate-500 dark:text-slate-400">招生目标 (Target)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="w-3 h-3 rounded bg-emerald-500"></span>
                      <span className="text-slate-500 dark:text-slate-400">实际完成 (Actual)</span>
                    </div>
                  </div>

                  {/* SVG Chart Frame */}
                  <div className="relative w-full overflow-hidden">
                    <svg viewBox="0 0 600 290" className="w-full h-auto min-h-[220px]">
                      {/* Grid Lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, gridIdx) => {
                        const maxVal = Math.max(...channelData.map(ch => Math.max(ch.target, ch.actual)), 1);
                        const maxNiceY = getNiceMaxY(maxVal);
                        const lineValue = Math.round(maxNiceY * ratio);
                        const yPos = 240 - ratio * 200;

                        return (
                          <g key={`grid-${gridIdx}`}>
                            <line
                              x1="45"
                              y1={yPos}
                              x2="580"
                              y2={yPos}
                              stroke={isDarkMode ? "#1e293b" : "#f1f5f9"}
                              strokeWidth="1.5"
                            />
                            <text
                              x="35"
                              y={yPos + 4}
                              textAnchor="end"
                              className="text-[9px] font-mono fill-slate-400 font-bold"
                            >
                              {lineValue}
                            </text>
                          </g>
                        );
                      })}

                      {/* Render Bars and Labels */}
                      {channelData.map((ch, i) => {
                        const maxVal = Math.max(...channelData.map(c => Math.max(c.target, c.actual)), 1);
                        const maxNiceY = getNiceMaxY(maxVal);

                        const plotHeight = 200;
                        const chartBottom = 240;
                        const colWidth = 535 / 7;
                        
                        const targetHeight = (ch.target / maxNiceY) * plotHeight;
                        const actualHeight = (ch.actual / maxNiceY) * plotHeight;

                        const barGap = 3;
                        const barWidth = 14;
                        const tBarX = 45 + i * colWidth + (colWidth - barWidth * 2 - barGap) / 2;
                        const aBarX = tBarX + barWidth + barGap;

                        const tBarY = chartBottom - targetHeight;
                        const aBarY = chartBottom - actualHeight;

                        const isHovered = hoveredChannelIdx === i;
                        const isAnyHovered = hoveredChannelIdx !== -1;

                        return (
                          <g key={`col-grp-${i}`}>
                            {/* Hover Guide Line */}
                            {isHovered && (
                              <line
                                x1={tBarX + barWidth + barGap / 2}
                                y1="35"
                                x2={tBarX + barWidth + barGap / 2}
                                y2="240"
                                stroke={isDarkMode ? "#475569" : "#cbd5e1"}
                                strokeDasharray="3 3"
                                strokeWidth="1"
                              />
                            )}

                            {/* Target Column Bar */}
                            <motion.rect
                              initial={{ height: 0, y: chartBottom }}
                              animate={{ height: targetHeight, y: tBarY }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              x={tBarX}
                              width={barWidth}
                              rx="2"
                              fill={isDarkMode ? (isHovered ? "#64748b" : "#334155") : (isHovered ? "#94a3b8" : "#cbd5e1")}
                              opacity={isAnyHovered && !isHovered ? 0.45 : 1}
                              className="transition-all duration-200 cursor-pointer"
                            />

                            {/* Actual Column Bar */}
                            <motion.rect
                              initial={{ height: 0, y: chartBottom }}
                              animate={{ height: actualHeight, y: aBarY }}
                              transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
                              x={aBarX}
                              width={barWidth}
                              rx="2"
                              fill={channelColors[i % 7]}
                              opacity={isAnyHovered && !isHovered ? 0.45 : 1}
                              className="transition-all duration-200 cursor-pointer"
                            />

                            {/* Axis Labels */}
                            <text
                              x={tBarX + barWidth + barGap / 2}
                              y="255"
                              textAnchor="middle"
                              className={`text-[9px] font-extrabold transition-colors ${
                                isHovered ? (isDarkMode ? "fill-emerald-400" : "fill-emerald-700") : (isDarkMode ? "fill-slate-400" : "fill-slate-500")
                              }`}
                            >
                              {ch.name}
                            </text>

                            {/* Active Hover Sensitive Area */}
                            <rect
                              x={45 + i * colWidth}
                              y="30"
                              width={colWidth}
                              height="215"
                              fill="transparent"
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredChannelIdx(i)}
                              onMouseLeave={() => setHoveredChannelIdx(-1)}
                            />
                          </g>
                        );
                      })}

                      {/* Bottom axis baseline line */}
                      <line x1="45" y1="240" x2="580" y2="240" stroke={isDarkMode ? "#334155" : "#cbd5e1"} strokeWidth="1.5" />
                    </svg>

                    {/* Group Column Hover Floating Tooltip */}
                    {hoveredChannelIdx !== -1 && (
                      <div
                        className="absolute bg-slate-900/95 text-white text-[11px] p-2.5 rounded-xl shadow-xl border border-slate-700/80 pointer-events-none z-40 transition-all duration-150"
                        style={{
                          left: `${45 + hoveredChannelIdx * (535 / 7) + (535 / 7) / 2 - 80}px`,
                          top: "10px"
                        }}
                      >
                        <div className="flex items-center space-x-1.5 mb-1">
                          <span className={`w-2.5 h-2.5 rounded-full ${channelBgColors[hoveredChannelIdx]}`}></span>
                          <span className="font-extrabold text-xs text-white">{channelData[hoveredChannelIdx].name}</span>
                        </div>
                        <div className="space-y-0.5 font-mono text-slate-300">
                          <div className="flex justify-between gap-5">
                            <span>计划目标:</span>
                            <span className="font-bold text-white">{channelData[hoveredChannelIdx].target} 人</span>
                          </div>
                          <div className="flex justify-between gap-5">
                            <span>实际到账:</span>
                            <span className="font-bold text-emerald-400">{channelData[hoveredChannelIdx].actual} 人</span>
                          </div>
                          <div className="border-t border-slate-700/80 my-1 pt-1 flex justify-between gap-5 text-[10px]">
                            <span>达成比率:</span>
                            <span className="font-bold text-amber-400">{channelData[hoveredChannelIdx].rate.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chart Prompt Footnote */}
                  <div className="mt-2 text-center text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                    💡 提示: 鼠标悬浮在柱形上方，可查看各渠道计划与实际到账的精确数据对比及达成率。
                  </div>
                </div>
              )}

              {/* VIEW 2: DYNAMIC DONUT CHART (占比饼状图) */}
              {channelViewMode === "donut" && (
                <div className="py-2">
                  {totalActualChannels === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500">
                      <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                      <p className="text-xs font-bold">暂无招生完成人数，无法绘制占比饼状图</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">请先到「数据明细登记」表格录入到账数据</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      
                      {/* Left side: Donut Chart Svg */}
                      <div className="md:col-span-5 flex justify-center relative">
                        <div className="relative w-[220px] h-[220px]">
                          <svg viewBox="0 0 240 240" className="w-full h-full">
                            {/* Render donut slices */}
                            {donutSlices.map((slice, idx) => {
                              if (slice.value === 0) return null;

                              const isHovered = hoveredChannelIdx === slice.index;
                              const innerR = 58;
                              const outerR = isHovered ? 96 : 88;

                              const pathD = getDonutPath(120, 120, innerR, outerR, slice.startAngle, slice.endAngle);

                              return (
                                <g key={`donut-seg-${slice.index}-${idx}`}>
                                  <path
                                    d={pathD}
                                    fill={slice.color}
                                    className="cursor-pointer transition-all duration-200"
                                    opacity={hoveredChannelIdx !== -1 && hoveredChannelIdx !== slice.index ? 0.45 : 1}
                                    onMouseEnter={() => setHoveredChannelIdx(slice.index)}
                                    onMouseLeave={() => setHoveredChannelIdx(-1)}
                                  />
                                </g>
                              );
                            })}

                            {/* Central Hover Panel text */}
                            {hoveredChannelIdx === -1 ? (
                              <g>
                                <circle cx="120" cy="120" r="54" fill={isDarkMode ? "#0f172a" : "white"} className="shadow-xs" />
                                <text x="120" y="105" textAnchor="middle" className="text-[10px] font-bold fill-slate-400 dark:fill-slate-500 uppercase tracking-wider">
                                  渠道总招生
                                </text>
                                <text x="120" y="132" textAnchor="middle" className="text-2xl font-black fill-slate-800 dark:fill-slate-100 font-mono">
                                  {totalActualChannels}
                                </text>
                                <text x="120" y="150" textAnchor="middle" className="text-[9px] font-bold fill-emerald-600 dark:fill-emerald-400">
                                  主流渠道占比
                                </text>
                              </g>
                            ) : (
                              <g>
                                <circle cx="120" cy="120" r="54" fill={isDarkMode ? "#0f172a" : "white"} className="shadow-xs" />
                                <text
                                  x="120"
                                  y="102"
                                  textAnchor="middle"
                                  className={`text-[11px] font-black ${channelTextColors[hoveredChannelIdx]}`}
                                >
                                  {channelData[hoveredChannelIdx].name}
                                </text>
                                <text x="120" y="128" textAnchor="middle" className="text-xl font-black fill-slate-800 dark:fill-slate-100 font-mono">
                                  {channelData[hoveredChannelIdx].actual}人
                                </text>
                                <text x="120" y="148" textAnchor="middle" className="text-[10px] font-bold fill-slate-500 dark:fill-slate-400 font-mono">
                                  占比 {((channelData[hoveredChannelIdx].actual / totalActualChannels) * 100).toFixed(1)}%
                                </text>
                              </g>
                            )}
                          </svg>
                        </div>
                      </div>

                      {/* Right side: Interactive detailed table list */}
                      <div className="md:col-span-7 space-y-2">
                        <h4 className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2.5">
                          渠道招生贡献比例排名榜 (Donut Breakdown)
                        </h4>

                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                          {[...donutSlices]
                            .sort((a, b) => b.value - a.value)
                            .map((slice, idx) => {
                              const isHovered = hoveredChannelIdx === slice.index;
                              return (
                                <div
                                  key={`donut-legend-${slice.index}-${idx}`}
                                  className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                                    isHovered
                                      ? "bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 shadow-3xs"
                                      : "border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-850/50"
                                  }`}
                                  onMouseEnter={() => setHoveredChannelIdx(slice.index)}
                                  onMouseLeave={() => setHoveredChannelIdx(-1)}
                                >
                                  <div className="flex items-center space-x-2">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full"
                                      style={{ backgroundColor: slice.color }}
                                    ></span>
                                    <span className="font-extrabold text-xs text-slate-700 dark:text-slate-200">{slice.name}</span>
                                  </div>

                                  <div className="flex items-center space-x-4 text-xs font-mono">
                                    <span className="text-slate-500 dark:text-slate-400 font-semibold">
                                      完成: <strong className="text-slate-800 dark:text-slate-100">{slice.value}</strong>人
                                    </span>
                                    <span className="text-slate-200 dark:text-slate-700">|</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                                      {slice.percentage.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )}

              {/* VIEW 3: DYNAMIC HORIZONTAL PROGRESS BAR (数据进度条 - original view) */}
              {channelViewMode === "bar" && (
                <div className="space-y-6">
                  {/* Legend */}
                  <div className="flex items-center space-x-4 justify-end text-[10px] mb-2 font-bold">
                    <div className="flex items-center space-x-1">
                      <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700"></span>
                      <span className="text-slate-500 dark:text-slate-400">招生目标 (Target)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="w-3 h-3 rounded bg-emerald-500"></span>
                      <span className="text-slate-500 dark:text-slate-400">实际完成 (Actual)</span>
                    </div>
                  </div>

                  {/* Bar List */}
                  <div className="space-y-6">
                    {sortedChannelData.map((ch, idx) => {
                      const maxVal = Math.max(
                        ...channelData.map((c) => Math.max(c.target, c.actual)),
                        1
                      );
                      const targetWidth = (ch.target / maxVal) * 100;
                      const actualWidth = (ch.actual / maxVal) * 100;

                      return (
                        <div key={`ch-comp-${ch.index}-${idx}`} className="group space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 text-[10px]">
                                {ch.index + 1}
                              </span>
                              <span className="font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                {ch.name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 text-[11px] font-mono">
                              <span className="text-slate-400 dark:text-slate-500">
                                目标: <strong className="text-slate-700 dark:text-slate-200 font-bold">{ch.target}</strong>
                              </span>
                              <span className="text-slate-300 dark:text-slate-700">|</span>
                              <span className="text-slate-600 dark:text-slate-300">
                                完成: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{ch.actual}</strong>
                              </span>
                              <span className="text-slate-300 dark:text-slate-700">|</span>
                              <span
                                className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                  ch.rate >= 100
                                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                                    : ch.rate >= 50
                                    ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"
                                    : "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400"
                                }`}
                              >
                                达成 {ch.rate.toFixed(1)}%
                              </span>
                            </div>
                          </div>

                          {/* Stacked Visual Bar Tracks */}
                          <div className="space-y-1">
                            {/* Target Bar Track */}
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden relative">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${targetWidth}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="bg-slate-300/80 dark:bg-slate-700/80 h-full rounded-full"
                              />
                            </div>
                            {/* Actual Bar Track */}
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden relative">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${actualWidth}%` }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                                className="bg-emerald-500 h-full rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Chart diagnostics footer */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex flex-row items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1 text-slate-500">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                  提示: 此对比表仅计算已分配渠道招生数据，不包含「其他人员」的 {otherTotal} 人。
                </span>
                <span>更新时间: 2026年6月28日实时计算</span>
              </div>

            </div>

            {/* ROI and CPA Cost-Efficiency Assessment Workbench */}
            <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-5 text-slate-800 dark:text-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5">
                    <Calculator className="w-4.5 h-4.5 text-emerald-600" />
                    招生推广成本效益与投入产出比 (ROI) 测算面板
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    实时输入或微调各渠道推广费用，测算各招生渠道获客单价 (CAC/CPA) 和综合投资回报率 (ROI)
                  </p>
                </div>

                {/* Tuition Fee Global slider adjustment */}
                <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 self-start">
                  <span className="text-[10px] font-bold text-slate-500">学费客单价:</span>
                  <input
                    type="range"
                    min="3000"
                    max="20000"
                    step="500"
                    value={tuitionFee}
                    onChange={(e) => setTuitionFee(parseInt(e.target.value, 10))}
                    className="w-20 sm:w-32 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <span className="text-xs font-black text-emerald-600 font-mono">
                    ¥{tuitionFee.toLocaleString()} <span className="text-[9px] font-normal text-slate-400">元/人</span>
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-150 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-150 dark:border-slate-800">
                      <th className="py-3 px-4 font-bold">招生推广渠道</th>
                      <th className="py-3 px-3 text-center font-bold">实际到账 (人)</th>
                      <th className="py-3 px-3 text-center font-bold">估计推广投入 (元)</th>
                      <th className="py-3 px-3 text-center font-bold">实际获客单价 (CAC/CPA)</th>
                      <th className="py-3 px-3 text-center font-bold">预计学费营收 (元)</th>
                      <th className="py-3 px-3 text-center font-bold">净招生运营贡献 (元)</th>
                      <th className="py-3 px-3 text-center font-bold">投资产出倍数 (ROI)</th>
                      <th className="py-3 px-4 text-center font-bold">效能综合评级</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-slate-700 dark:text-slate-300">
                    {channelData.map((ch, idx) => {
                      const cost = channelCosts[idx] !== undefined ? channelCosts[idx] : 0;
                      const cpa = ch.actual > 0 ? cost / ch.actual : 0;
                      const revenue = ch.actual * tuitionFee;
                      const netReturn = revenue - cost;
                      const roi = cost > 0 ? revenue / cost : 0;

                      let rating = "亏损运营";
                      let ratingStyle = "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-150 dark:border-rose-900";
                      if (roi >= 4.0) {
                        rating = "极佳回报 (High)";
                        ratingStyle = "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-150 dark:border-emerald-900";
                      } else if (roi >= 2.0) {
                        rating = "健康运营 (Optimal)";
                        ratingStyle = "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-150 dark:border-blue-900";
                      } else if (roi >= 1.0) {
                        rating = "保本保量 (Break-even)";
                        ratingStyle = "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-150 dark:border-amber-900";
                      }

                      return (
                        <tr key={`roi-row-${idx}`} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/40 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-100 font-sans flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: channelColors[idx % 7] }}></span>
                            <span>{ch.name}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-black text-slate-800 dark:text-slate-100">{ch.actual} 人</td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <span className="text-slate-400 dark:text-slate-500 text-[10px]">¥</span>
                              <input
                                type="number"
                                value={cost === 0 ? "" : cost}
                                placeholder="0"
                                onChange={(e) => {
                                  const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                  const updatedCosts = [...channelCosts];
                                  updatedCosts[idx] = val;
                                  setChannelCosts(updatedCosts);
                                }}
                                className="w-20 text-center font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 rounded px-1.5 py-1 text-xs outline-none transition-all"
                              />
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-500 dark:text-slate-400 font-bold">
                            {ch.actual > 0 ? (
                              <span className={cpa > 4000 ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-300"}>
                                ¥{Math.round(cpa).toLocaleString()} /人
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 italic text-[10px]">无法测算</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-emerald-700 dark:text-emerald-400">
                            ¥{revenue.toLocaleString()}
                          </td>
                          <td className={`py-2.5 px-3 text-center font-bold ${netReturn >= 0 ? "text-slate-800 dark:text-slate-100" : "text-rose-600 dark:text-rose-400"}`}>
                            ¥{netReturn.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {cost > 0 ? (
                              <span className={`font-black ${roi >= 3 ? "text-emerald-600 dark:text-emerald-400" : roi >= 1.5 ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}>
                                {roi.toFixed(2)}x
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black ${ratingStyle}`}>
                              {rating}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Summary Aggregation Row */}
                    {(() => {
                      const totalActual = channelData.reduce((sum, ch) => sum + ch.actual, 0);
                      const totalCost = channelCosts.reduce((sum, cost) => sum + cost, 0);
                      const avgCpa = totalActual > 0 ? totalCost / totalActual : 0;
                      const totalRevenue = totalActual * tuitionFee;
                      const totalNetReturn = totalRevenue - totalCost;
                      const overallRoi = totalCost > 0 ? totalRevenue / totalCost : 0;

                      return (
                        <tr className="bg-emerald-50/30 dark:bg-emerald-950/30 border-t border-slate-200 dark:border-slate-800 font-black">
                          <td className="py-3 px-4 font-extrabold text-emerald-800 dark:text-emerald-300 font-sans">合计 / 综合测算</td>
                          <td className="py-3 px-3 text-center text-emerald-900 dark:text-emerald-200">{totalActual} 人</td>
                          <td className="py-3 px-3 text-center text-emerald-900 dark:text-emerald-200 font-bold">¥{totalCost.toLocaleString()}</td>
                          <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-300 font-bold">¥{Math.round(avgCpa).toLocaleString()} /人</td>
                          <td className="py-3 px-3 text-center text-emerald-700 dark:text-emerald-400 font-bold">¥{totalRevenue.toLocaleString()}</td>
                          <td className={`py-3 px-3 text-center font-bold ${totalNetReturn >= 0 ? "text-slate-800 dark:text-slate-100" : "text-rose-600 dark:text-rose-400"}`}>
                            ¥{totalNetReturn.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center text-emerald-700 dark:text-emerald-400 font-extrabold text-sm font-mono">{overallRoi.toFixed(2)}x</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black ${
                              overallRoi >= 2.5 
                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800" 
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                            }`}>
                              整体: {overallRoi >= 2.5 ? "卓越 (Superior)" : "稳健 (Healthy)"}
                            </span>
                          </td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Dynamic cost analytics report */}
              {(() => {
                const items = channelData.map((ch, idx) => {
                  const cost = channelCosts[idx] !== undefined ? channelCosts[idx] : 0;
                  const roi = cost > 0 ? (ch.actual * tuitionFee) / cost : 0;
                  return { ch, cost, roi, actual: ch.actual };
                });

                const activeItems = items.filter(it => it.actual > 0 && it.cost > 0);
                const sortedByRoi = [...activeItems].sort((a,b) => b.roi - a.roi);
                const bestRoi = sortedByRoi[0];
                const worstRoi = sortedByRoi[sortedByRoi.length - 1];

                return (
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">
                        ⚡ 运营资源智能调拨诊断
                      </span>
                      <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                        {bestRoi && worstRoi ? (
                          <p>
                            分析指出，当前最具有性价比的推广招生渠道是 <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{bestRoi.ch.name}</strong>（ROI高达 <strong>{bestRoi.roi.toFixed(1)}x</strong> 倍，平均获客成本仅为 <strong>¥{Math.round(bestRoi.cost/bestRoi.actual).toLocaleString()}</strong> 元/人）。
                            建议调低或优化回报倍数较低的 <strong className="text-slate-700 dark:text-slate-200 font-bold">{worstRoi.ch.name}</strong>（ROI 仅 <strong>{worstRoi.roi.toFixed(1)}x</strong> 倍），将多出的 <strong>15% - 20%</strong> 推广预算倾斜投放在高效渠道上以获得最大招生效益。
                          </p>
                        ) : (
                          <p>
                            请在上方输入各渠道的「估计推广投入」费用。系统将结合实时招生到账人数及当前学费，为您精准测算并生成极具商业智慧的资源倾斜和预算调拨决策方案。
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>
        )}

        {/* SUBTAB 2: INTERACTIVE MAJOR HEAD-TO-HEAD PK */}
        {activeSubTab === "major" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Interactive Major Selector List (4 cols) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-4 lg:col-span-4 space-y-3 text-slate-800 dark:text-slate-100">
              <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1">
                  <ListFilter className="w-4 h-4 text-emerald-600" />
                  选择对比专业 ({selectedMajorIds.length} / 5)
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  在下方勾选您想要进行PK横向对比的专业（最少1个，最多5个）
                </p>
              </div>

              <div className="max-h-[420px] overflow-y-auto space-y-1.5 pr-1">
                {majorStats.map((major, idx) => {
                  const isChecked = selectedMajorIds.includes(major.id);
                  return (
                    <div
                      key={`chk-${major.id}-${idx}`}
                      onClick={() => handleToggleMajor(major.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/80 dark:border-emerald-500/50 shadow-2xs"
                          : "border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850"
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Click handler on parent div
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 shrink-0 pointer-events-none"
                        />
                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{major.name}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 text-right shrink-0">
                        实际: <strong className="text-slate-800 dark:text-slate-100 font-bold">{major.actual}</strong> / {major.target}人
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                勾选不同的专业名称，右侧的数据指标PK图表、各渠道分流对比将进行毫秒级实时重绘。
              </div>
            </div>

            {/* Right: Comparative Graphs Area (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Card 1: Target vs Actual comparison with view mode toggling */}
              <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5 gap-3">
                  <div>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5">
                      <span>对比专业：计划目标 vs 实际完成人数PK</span>
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[9px] font-bold">
                        基准分析
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      横向横向PK，提供 80% 警戒冲刺线与 100% 达标基准辅助线
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Benchmark Lines Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setShowBenchmarkLines(!showBenchmarkLines)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                        showBenchmarkLines
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700/60 shadow-2xs"
                          : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                      }`}
                      title="在图表中显示或隐藏 80% 与 100% 目标达成基准辅助线"
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>{showBenchmarkLines ? "辅助线: 已开启" : "辅助线: 已关闭"}</span>
                    </button>

                    {/* View switcher */}
                    <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                      <button
                        onClick={() => setMajorViewMode("column")}
                        className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer ${
                          majorViewMode === "column"
                            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs font-extrabold"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        }`}
                      >
                        <BarChart2 className="w-3 h-3 text-emerald-500" />
                        <span>柱形图PK</span>
                      </button>
                      <button
                        onClick={() => setMajorViewMode("bar")}
                        className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer ${
                          majorViewMode === "bar"
                            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs font-extrabold"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        }`}
                      >
                        <Compass className="w-3 h-3 text-amber-500" />
                        <span>水平对比</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* VIEW 1: MAJOR COLUMN CHART (分组柱状图) */}
                {majorViewMode === "column" && (
                  <div className="relative pt-2 pb-2">
                    {/* Legend with Benchmark reference indicators */}
                    <div className="flex flex-wrap items-center space-x-3 sm:space-x-4 justify-end text-[10px] mb-4 font-bold gap-y-1">
                      <div className="flex items-center space-x-1">
                        <span className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-700"></span>
                        <span className="text-slate-500 dark:text-slate-400">招生计划 (Target)</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="w-3 h-3 rounded bg-emerald-500"></span>
                        <span className="text-slate-500 dark:text-slate-400">实际完成 (Actual)</span>
                      </div>
                      {showBenchmarkLines && (
                        <>
                          <div className="flex items-center space-x-1 pl-1 border-l border-slate-200 dark:border-slate-700">
                            <span className="w-3.5 h-0.5 border-b-2 border-dashed border-emerald-500 inline-block"></span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">100% 达标基准</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="w-3.5 h-0.5 border-b-2 border-dashed border-amber-500 inline-block"></span>
                            <span className="text-amber-600 dark:text-amber-400 font-extrabold">80% 冲刺基准</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Svg frame */}
                    <div className="relative w-full overflow-hidden">
                      {selectedMajorIds.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                          请在左侧勾选专业进行横向对比
                        </div>
                      ) : (
                        <svg viewBox="0 0 600 285" className="w-full h-auto min-h-[230px]">
                          {/* Grid Lines */}
                          {[0, 0.25, 0.5, 0.75, 1].map((ratio, gridIdx) => {
                            const activeMajors = majorStats.filter((m) => selectedMajorIds.includes(m.id));
                            const maxVal = Math.max(...activeMajors.map(ms => Math.max(ms.target, ms.actual)), 1);
                            const maxNiceY = getNiceMaxY(maxVal);
                            const lineValue = Math.round(maxNiceY * ratio);
                            const yPos = 230 - ratio * 190;

                            return (
                              <g key={`major-grid-${gridIdx}`}>
                                <line
                                  x1="45"
                                  y1={yPos}
                                  x2="580"
                                  y2={yPos}
                                  stroke={isDarkMode ? "#1e293b" : "#f1f5f9"}
                                  strokeWidth="1.5"
                                />
                                <text
                                  x="35"
                                  y={yPos + 4}
                                  textAnchor="end"
                                  className="text-[9px] font-mono fill-slate-400 font-bold"
                                >
                                  {lineValue}
                                </text>
                              </g>
                            );
                          })}

                          {/* Draw Bars and Reference Lines for selected majors */}
                          {majorStats
                            .filter((m) => selectedMajorIds.includes(m.id))
                            .map((m, i, arr) => {
                              const activeMajors = majorStats.filter((ms) => selectedMajorIds.includes(ms.id));
                              const maxVal = Math.max(...activeMajors.map(ms => Math.max(ms.target, ms.actual)), 1);
                              const maxNiceY = getNiceMaxY(maxVal);

                              const plotHeight = 190;
                              const chartBottom = 230;
                              const numGroups = arr.length;
                              const colWidth = 535 / numGroups;
                              
                              const targetHeight = (m.target / maxNiceY) * plotHeight;
                              const actualHeight = (m.actual / maxNiceY) * plotHeight;
                              const target80Height = ((m.target * 0.8) / maxNiceY) * plotHeight;

                              const barGap = 4;
                              const barWidth = Math.min(22, (colWidth * 0.4) / 2);
                              const tBarX = 45 + i * colWidth + (colWidth - barWidth * 2 - barGap) / 2;
                              const aBarX = tBarX + barWidth + barGap;

                              const tBarY = chartBottom - targetHeight;
                              const aBarY = chartBottom - actualHeight;
                              const ref80Y = chartBottom - target80Height;

                              const isHovered = hoveredMajorIdx === i;
                              const isAnyHovered = hoveredMajorIdx !== -1;

                              const groupSpanLeft = tBarX - 4;
                              const groupSpanRight = aBarX + barWidth + 4;

                              return (
                                <g key={`major-col-grp-${m.id}-${i}`}>
                                  {/* Guide line */}
                                  {isHovered && (
                                    <line
                                      x1={tBarX + barWidth + barGap / 2}
                                      y1="35"
                                      x2={tBarX + barWidth + barGap / 2}
                                      y2="230"
                                      stroke={isDarkMode ? "#475569" : "#cbd5e1"}
                                      strokeDasharray="3 3"
                                      strokeWidth="1"
                                    />
                                  )}

                                  {/* Target bar */}
                                  <motion.rect
                                    initial={{ height: 0, y: chartBottom }}
                                    animate={{ height: targetHeight, y: tBarY }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    x={tBarX}
                                    width={barWidth}
                                    rx="2.5"
                                    fill={isDarkMode ? (isHovered ? "#64748b" : "#334155") : (isHovered ? "#94a3b8" : "#cbd5e1")}
                                    opacity={isAnyHovered && !isHovered ? 0.45 : 1}
                                    className="transition-all duration-150 cursor-pointer"
                                  />

                                  {/* Actual bar */}
                                  <motion.rect
                                    initial={{ height: 0, y: chartBottom }}
                                    animate={{ height: actualHeight, y: aBarY }}
                                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
                                    x={aBarX}
                                    width={barWidth}
                                    rx="2.5"
                                    fill={m.actual >= m.target ? "#059669" : m.actual >= m.target * 0.8 ? "#10b981" : "#0d9488"}
                                    opacity={isAnyHovered && !isHovered ? 0.45 : 1}
                                    className="transition-all duration-150 cursor-pointer"
                                  />

                                  {/* 80% & 100% Benchmark Reference Lines */}
                                  {showBenchmarkLines && (
                                    <g className="transition-opacity duration-200">
                                      {/* 80% Benchmark line across major group */}
                                      <line
                                        x1={groupSpanLeft}
                                        y1={ref80Y}
                                        x2={groupSpanRight}
                                        y2={ref80Y}
                                        stroke="#f59e0b"
                                        strokeWidth={isHovered ? "2" : "1.5"}
                                        strokeDasharray="3 2"
                                      />
                                      {/* 80% small tag */}
                                      <circle
                                        cx={groupSpanLeft}
                                        cy={ref80Y}
                                        r="2"
                                        fill="#f59e0b"
                                      />
                                      <text
                                        x={groupSpanLeft - 2}
                                        y={ref80Y + 3}
                                        textAnchor="end"
                                        className={`text-[7.5px] font-mono font-black ${
                                          isHovered ? "fill-amber-500 opacity-100" : "fill-amber-500/70 opacity-80"
                                        }`}
                                      >
                                        80%
                                      </text>

                                      {/* 100% Benchmark line across major group */}
                                      <line
                                        x1={groupSpanLeft}
                                        y1={tBarY}
                                        x2={groupSpanRight}
                                        y2={tBarY}
                                        stroke="#10b981"
                                        strokeWidth={isHovered ? "2" : "1.5"}
                                        strokeDasharray="4 2"
                                      />
                                      {/* 100% small tag */}
                                      <circle
                                        cx={groupSpanRight}
                                        cy={tBarY}
                                        r="2"
                                        fill="#10b981"
                                      />
                                      <text
                                        x={groupSpanRight + 2}
                                        y={tBarY + 3}
                                        textAnchor="start"
                                        className={`text-[7.5px] font-mono font-black ${
                                          isHovered ? "fill-emerald-500 opacity-100" : "fill-emerald-500/70 opacity-80"
                                        }`}
                                      >
                                        100%
                                      </text>
                                    </g>
                                  )}

                                  {/* Major Label & Rate Indicator */}
                                  <text
                                    x={tBarX + barWidth + barGap / 2}
                                    y="248"
                                    textAnchor="middle"
                                    className={`text-[10px] font-extrabold transition-colors ${
                                      isHovered ? (isDarkMode ? "fill-emerald-400" : "fill-emerald-700") : (isDarkMode ? "fill-slate-400" : "fill-slate-600")
                                    }`}
                                  >
                                    {m.name.length > 5 ? `${m.name.slice(0, 5)}...` : m.name}
                                  </text>

                                  {/* Status badge underneath label */}
                                  <text
                                    x={tBarX + barWidth + barGap / 2}
                                    y="262"
                                    textAnchor="middle"
                                    className={`text-[8.5px] font-bold font-mono ${
                                      m.rate >= 100
                                        ? "fill-emerald-500"
                                        : m.rate >= 80
                                        ? "fill-amber-500"
                                        : "fill-slate-400"
                                    }`}
                                  >
                                    {m.rate.toFixed(0)}%
                                    {m.rate >= 100 ? " ★" : m.rate >= 80 ? " ▲" : ""}
                                  </text>

                                  {/* Hover trigger */}
                                  <rect
                                    x={45 + i * colWidth}
                                    y="30"
                                    width={colWidth}
                                    height="205"
                                    fill="transparent"
                                    className="cursor-pointer"
                                    onMouseEnter={() => setHoveredMajorIdx(i)}
                                    onMouseLeave={() => setHoveredMajorIdx(-1)}
                                  />
                                </g>
                              );
                            })}

                          {/* Bottom baseline */}
                          <line x1="45" y1="230" x2="580" y2="230" stroke={isDarkMode ? "#334155" : "#cbd5e1"} strokeWidth="1.5" />
                        </svg>
                      )}

                      {/* Tooltip Overlay with 80% and 100% benchmark details */}
                      {hoveredMajorIdx !== -1 && (
                        (() => {
                          const activeMajors = majorStats.filter((m) => selectedMajorIds.includes(m.id));
                          const major = activeMajors[hoveredMajorIdx];
                          if (!major) return null;

                          const numGroups = activeMajors.length;
                          const colWidth = 535 / numGroups;
                          const target80 = Math.round(major.target * 0.8);
                          const is100Reached = major.actual >= major.target;
                          const is80Reached = major.actual >= target80;

                          return (
                            <div
                              className="absolute bg-slate-900/95 text-white text-[11px] p-3 rounded-xl shadow-xl border border-slate-700 pointer-events-none z-40 transition-all duration-150 animate-none min-w-[190px]"
                              style={{
                                left: `${Math.max(10, Math.min(420, 45 + hoveredMajorIdx * colWidth + colWidth / 2 - 95))}px`,
                                top: "10px"
                              }}
                            >
                              <div className="flex items-center justify-between space-x-1.5 mb-2 pb-1.5 border-b border-slate-800">
                                <div className="flex items-center space-x-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                  <span className="font-extrabold text-xs text-white">{major.name}</span>
                                </div>
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                  is100Reached
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : is80Reached
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                    : "bg-slate-800 text-slate-400 border border-slate-700"
                                }`}>
                                  {is100Reached ? "100%已达标" : is80Reached ? "已达80%冲刺" : "进度推进中"}
                                </span>
                              </div>

                              <div className="space-y-1 font-mono text-slate-300">
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">计划目标 (100%):</span>
                                  <span className="font-bold text-white">{major.target} 人</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-amber-400/90 font-medium">阶段基准 (80%):</span>
                                  <span className="font-bold text-amber-300">{target80} 人</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-emerald-400 font-medium">实际到账人数:</span>
                                  <span className="font-bold text-emerald-400">{major.actual} 人</span>
                                </div>

                                <div className="border-t border-slate-800 my-1 pt-1.5 space-y-1 text-[10px]">
                                  <div className="flex justify-between gap-4">
                                    <span className="text-slate-400">达成进度率:</span>
                                    <span className="font-extrabold text-amber-400">{major.rate.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex justify-between gap-4 text-[9px]">
                                    <span className="text-slate-400">距100%目标:</span>
                                    <span className={is100Reached ? "text-emerald-400 font-bold" : "text-slate-300"}>
                                      {is100Reached ? `已超额 ${major.actual - major.target} 人` : `还需 ${major.target - major.actual} 人`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  </div>
                )}

                {/* VIEW 2: MAJOR BAR CHART (水平进度条 + 80%/100%基准刻度线) */}
                {majorViewMode === "bar" && (
                  <div className="space-y-6">
                    {majorStats
                      .filter((m) => selectedMajorIds.includes(m.id))
                      .map((m, idx) => {
                        const maxVal = Math.max(
                          ...majorStats.map((ms) => Math.max(ms.target, ms.actual)),
                          1
                        );
                        const tWidth = (m.target / maxVal) * 100;
                        const aWidth = (m.actual / maxVal) * 100;
                        const t80Width = (m.target * 0.8 / maxVal) * 100;
                        const is100Reached = m.actual >= m.target;
                        const is80Reached = m.actual >= m.target * 0.8;

                        return (
                          <div key={`pk-major-${m.id}-${idx}`} className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                {m.name}
                                <span className={`ml-1.5 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                  is100Reached
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                    : is80Reached
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                }`}>
                                  {is100Reached ? "100%已达标" : is80Reached ? "80%冲刺中" : "推进中"}
                                </span>
                              </span>
                              <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                                计划: <strong className="text-slate-700 dark:text-slate-200 font-bold">{m.target}</strong>人 | 
                                实际完成: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{m.actual}</strong>人 
                                <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400">({m.rate.toFixed(1)}%)</span>
                              </span>
                            </div>

                            <div className="grid grid-cols-12 gap-3 items-center">
                              {/* Target Bar & Actual Bar with Benchmark marks */}
                              <div className="col-span-12 space-y-1.5 relative">
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden relative">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${tWidth}%` }}
                                    transition={{ duration: 0.5 }}
                                    className="bg-slate-300 dark:bg-slate-700 h-full rounded-full"
                                  />
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-850 h-3 rounded-full overflow-hidden relative">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${aWidth}%` }}
                                    transition={{ duration: 0.7 }}
                                    className={`h-full rounded-full ${
                                      is100Reached ? "bg-emerald-500" : is80Reached ? "bg-emerald-600" : "bg-teal-600"
                                    }`}
                                  />
                                </div>

                                {/* 80% and 100% benchmark vertical tick markers */}
                                {showBenchmarkLines && (
                                  <div className="relative w-full h-4 text-[8px] font-mono font-bold">
                                    {/* 80% mark */}
                                    <div
                                      className="absolute -top-3.5 flex flex-col items-center pointer-events-none"
                                      style={{ left: `${t80Width}%`, transform: "translateX(-50%)" }}
                                    >
                                      <div className="w-0.5 h-4 bg-amber-500/80"></div>
                                      <span className="text-amber-600 dark:text-amber-400 font-extrabold mt-0.5">80%</span>
                                    </div>

                                    {/* 100% mark */}
                                    <div
                                      className="absolute -top-3.5 flex flex-col items-center pointer-events-none"
                                      style={{ left: `${tWidth}%`, transform: "translateX(-50%)" }}
                                    >
                                      <div className="w-0.5 h-4 bg-emerald-500/90"></div>
                                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold mt-0.5">100%</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Card 2: Channels breakdown comparison for selected majors */}
              <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs pb-4 border-b border-slate-100 dark:border-slate-850 mb-5">
                  对比专业：各招聘招生渠道实际录得人数对比 (Channel Breakdown PK)
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs text-left min-w-[500px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-150 dark:border-slate-800">
                        <th className="py-2 px-3 font-bold">对比专业名称</th>
                        {config.channels.map((name, i) => (
                          <th key={`th-break-${name}-${i}`} className="py-2 px-1 text-center font-bold truncate max-w-[80px]">
                            {name}
                          </th>
                        ))}
                        <th className="py-2 px-2 text-center font-bold">其他</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-slate-700 dark:text-slate-300">
                      {majorStats
                        .filter((m) => selectedMajorIds.includes(m.id))
                        .map((m, idx) => (
                          <tr key={`row-break-${m.id}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                            <td className="py-2.5 px-3 font-extrabold text-slate-800 dark:text-slate-100 font-sans">
                              {m.name}
                            </td>
                            {m.channels.map((ch, i) => (
                              <td key={`cell-break-${m.id}-${i}`} className="py-2.5 px-1 text-center font-semibold">
                                <span className={ch.actual > 0 ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-slate-300 dark:text-slate-700"}>
                                  {ch.actual}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal block">
                                  目:{ch.target}
                                </span>
                              </td>
                            ))}
                            <td className="py-2.5 px-2 text-center text-slate-500 dark:text-slate-400 font-bold">
                              {m.other}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-4 font-medium italic">
                  * 列表中展现“实际/目标”双向值，帮助精细化查看哪个专业在哪个渠道招生完成效率最高。
                </p>
              </div>

            </div>

          </div>
        )}

        {/* SUBTAB 3: TIMEFRAME COMPARISON (多维周期对比) */}
        {activeSubTab === "timeframe" && (
          <div className="space-y-6">
            
            {/* Mode Selector & Header */}
            <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">
                    多维招生周期对比工作台 (Multi-Dimensional Period PK)
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    系统内置多层级时间窗口（同日不同专业、同专业跨周、跨月及跨年 YoY），自动按需切片计算
                  </p>
                </div>

                {/* Sub Mode Buttons */}
                <div className="flex flex-wrap bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                  <button
                    onClick={() => setTimeframeMode("sameDay")}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      timeframeMode === "sameDay" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-3xs font-extrabold" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    同一天不同专业
                  </button>
                  <button
                    onClick={() => setTimeframeMode("weekly")}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      timeframeMode === "weekly" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-3xs font-extrabold" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    本周 vs 上周
                  </button>
                  <button
                    onClick={() => setTimeframeMode("monthly")}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      timeframeMode === "monthly" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-3xs font-extrabold" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    本月 vs 上月
                  </button>
                  <button
                    onClick={() => setTimeframeMode("yearly")}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      timeframeMode === "yearly" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-3xs font-extrabold" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    今年 vs 去年
                  </button>
                </div>
              </div>

              {/* Dynamic Filter Row based on sub-mode */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 font-bold">对照基准点:</span>
                  {timeframeMode === "sameDay" ? (
                    <select
                      value={timeframeDate}
                      onChange={(e) => setTimeframeDate(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold px-2 py-1 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded outline-none transition-all"
                    >
                      <option value="2026-06-28">2026年06月28日 (默认)</option>
                      <option value="2026-06-27">2026年06月27日</option>
                      <option value="2026-06-26">2026年06月26日</option>
                      <option value="2026-06-25">2026年06月25日</option>
                      <option value="2026-06-20">2026年06月20日 (历史)</option>
                    </select>
                  ) : timeframeMode === "weekly" ? (
                    <span className="font-extrabold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded border border-transparent dark:border-slate-850">
                      本周 [06-22 至 06-28] vs 上周 [06-15 至 06-21]
                    </span>
                  ) : timeframeMode === "monthly" ? (
                    <span className="font-extrabold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded border border-transparent dark:border-slate-850">
                      本月 [2026-06 招生期] vs 上月 [2026-05 历史全月]
                    </span>
                  ) : (
                    <span className="font-extrabold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded border border-transparent dark:border-slate-850">
                      今年同期 [2026-06 累计] vs 去年同期 [2025-06 全月对照]
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  数据计算引擎: DYNAMIC CHRONO-AGGREGATION
                </div>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {timeframeMode === "sameDay" && (
                <>
                  <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">今日总到账人数</p>
                    <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{sameDayTotalActual}人</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">该日登记的所有专业和无渠道的总和</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">最高招生专业</p>
                    <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 mt-1 truncate">
                      {sameDayMajorData[0]?.name || "暂无数据"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">今日录取 {sameDayMajorData[0]?.actual || 0} 人</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">今日计划设定专业</p>
                    <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
                      {sameDayMajorData.filter(m => m.target > 0).length} 个
                    </p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">有设定具体日招生目标的专业数量</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">今日均单专业产出</p>
                    <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
                      {sameDayMajorData.length > 0 ? (sameDayTotalActual / sameDayMajorData.length).toFixed(1) : 0} 人
                    </p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">单专业平均招生到账人数</p>
                  </div>
                </>
              )}

              {timeframeMode === "weekly" && (
                <>
                  <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">本周累计到账</p>
                    <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{weeklySummary.thisWeekActual}人</p>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">周环比增长对照基准</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">上周累计到账</p>
                    <p className="text-xl font-extrabold text-slate-500 dark:text-slate-400 mt-1">{weeklySummary.lastWeekActual}人</p>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">上个自然周一至周日全额</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">到账净值变化 (PK)</p>
                    <p className={`text-xl font-extrabold mt-1 ${weeklySummary.thisWeekActual - weeklySummary.lastWeekActual >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                      {weeklySummary.thisWeekActual - weeklySummary.lastWeekActual >= 0 ? "+" : ""}
                      {weeklySummary.thisWeekActual - weeklySummary.lastWeekActual} 人
                    </p>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">两周期差值</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">周环比增速 (Growth)</p>
                    <p className={`text-xl font-extrabold mt-1 ${
                      weeklySummary.lastWeekActual > 0 
                        ? (weeklySummary.thisWeekActual >= weeklySummary.lastWeekActual ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400")
                        : "text-slate-500 dark:text-slate-400"
                    }`}>
                      {weeklySummary.lastWeekActual > 0 
                        ? `${(((weeklySummary.thisWeekActual - weeklySummary.lastWeekActual) / weeklySummary.lastWeekActual) * 100).toFixed(1)}%`
                        : "分母为零"}
                    </p>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">本周 vs 上周相对比率</span>
                  </div>
                </>
              )}

              {timeframeMode === "monthly" && (
                <>
                  <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">本月累计到账</p>
                    <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{monthlySummary.juneActual}人</p>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">06-01 至 06-28 累计数</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">上月累计到账</p>
                    <p className="text-xl font-extrabold text-slate-500 dark:text-slate-400 mt-1">{monthlySummary.mayActual}人</p>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">05-01 至 05-31 完整历史月</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">到账净值变化 (PK)</p>
                    <p className={`text-xl font-extrabold mt-1 ${monthlySummary.juneActual - monthlySummary.mayActual >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                      {monthlySummary.juneActual - monthlySummary.mayActual >= 0 ? "+" : ""}
                      {monthlySummary.juneActual - monthlySummary.mayActual} 人
                    </p>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">招生主力军扩充趋势</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">月环比增速 (Growth)</p>
                    <p className={`text-xl font-extrabold mt-1 ${
                      monthlySummary.mayActual > 0 
                        ? (monthlySummary.juneActual >= monthlySummary.mayActual ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400")
                        : "text-slate-500 dark:text-slate-400"
                    }`}>
                      {monthlySummary.mayActual > 0 
                        ? `${(((monthlySummary.juneActual - monthlySummary.mayActual) / monthlySummary.mayActual) * 100).toFixed(1)}%`
                        : "分母为零"}
                    </p>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">月度招生战力成长值</span>
                  </div>
                </>
              )}

              {timeframeMode === "yearly" && (
                <>
                  <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">今年同期累计到账</p>
                    <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{yearlySummary.y26Actual}人</p>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">2026年06月累计数</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">去年同期累计到账</p>
                    <p className="text-xl font-extrabold text-slate-500 dark:text-slate-400 mt-1">{yearlySummary.y25Actual}人</p>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">2025年06月全月历史基准</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">YoY 净增录取人数</p>
                    <p className={`text-xl font-extrabold mt-1 ${yearlySummary.y26Actual - yearlySummary.y25Actual >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                      {yearlySummary.y26Actual - yearlySummary.y25Actual >= 0 ? "+" : ""}
                      {yearlySummary.y26Actual - yearlySummary.y25Actual} 人
                    </p>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">年度宏观规模增量</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">YoY 同期增速 (YoY %)</p>
                    <p className={`text-xl font-extrabold mt-1 ${
                      yearlySummary.y25Actual > 0 
                        ? (yearlySummary.y26Actual >= yearlySummary.y25Actual ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400")
                        : "text-slate-500 dark:text-slate-400"
                    }`}>
                      {yearlySummary.y25Actual > 0 
                        ? `${(((yearlySummary.y26Actual - yearlySummary.y25Actual) / yearlySummary.y25Actual) * 100).toFixed(1)}%`
                        : "分母为零"}
                    </p>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">YoY 招生发展质量系数</span>
                  </div>
                </>
              )}
            </div>

            {/* Visual Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Box 1: Interactive Grouped Column Bar Chart (柱形图对比) */}
              <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs lg:col-span-8 space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">
                    {timeframeMode === "sameDay" ? "今日各专业：计划招生 vs 实际完成到账直观柱状图" :
                     timeframeMode === "weekly" ? "本周 vs 上周：各大专业招生完成人数对照柱状图" :
                     timeframeMode === "monthly" ? "本月 vs 上月：各大专业招生到账进度对比柱状图" :
                     "今年 vs 去年同期：各大专业YoY年度规模到账PK柱状图"}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    展示排名前 7 个大类专业在所选时间维度下的横向PK分布，反映核心专业群的绝对招生走势。
                  </p>
                </div>

                {/* Svg Chart Bar Frame */}
                <div className="relative w-full pt-2">
                  {/* Legend labels */}
                  <div className="flex items-center space-x-4 justify-end text-[10px] mb-4 font-bold">
                    <div className="flex items-center space-x-1">
                      <span className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-750"></span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {timeframeMode === "sameDay" ? "招生目标 (Target)" :
                         timeframeMode === "weekly" ? "上周完成 (Last Week)" :
                         timeframeMode === "monthly" ? "上月完成 (Last Month)" :
                         "去年完成 (Last Year)"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="w-3 h-3 rounded bg-emerald-500"></span>
                      <span className="text-slate-500">
                        {timeframeMode === "sameDay" ? "实际完成 (Actual)" :
                         timeframeMode === "weekly" ? "本周完成 (This Week)" :
                         timeframeMode === "monthly" ? "本月完成 (This Month)" :
                         "今年完成 (This Year)"}
                      </span>
                    </div>
                  </div>

                  <div className="relative w-full overflow-hidden">
                    <svg viewBox="0 0 600 280" className="w-full h-auto min-h-[220px]">
                      {/* Grid Lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, gridIdx) => {
                        let maxVal = 10;
                        if (timeframeMode === "sameDay" && sameDayMajorData.length > 0) {
                          maxVal = Math.max(...sameDayMajorData.map(m => Math.max(m.target, m.actual)), 1);
                        } else if (timeframeMode === "weekly" && weeklyMajorData.length > 0) {
                          maxVal = Math.max(...weeklyMajorData.map(m => Math.max(m.thisWeekActual, m.lastWeekActual)), 1);
                        } else if (timeframeMode === "monthly" && monthlyMajorData.length > 0) {
                          maxVal = Math.max(...monthlyMajorData.map(m => Math.max(m.juneActual, m.mayActual)), 1);
                        } else if (timeframeMode === "yearly" && yearlyMajorData.length > 0) {
                          maxVal = Math.max(...yearlyMajorData.map(m => Math.max(m.y26Actual, m.y25Actual)), 1);
                        }
                        const maxNiceY = getNiceMaxY(maxVal);
                        const lineValue = Math.round(maxNiceY * ratio);
                        const yPos = 230 - ratio * 190;

                        return (
                          <g key={`tf-grid-${gridIdx}`}>
                            <line x1="45" y1={yPos} x2="580" y2={yPos} stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} strokeWidth="1.5" />
                            <text x="35" y={yPos + 4} textAnchor="end" className="text-[9px] font-mono fill-slate-400 font-bold">
                              {lineValue}
                            </text>
                          </g>
                        );
                      })}

                      {/* Bars Rendering (Up to Top 7 majors) */}
                      {(() => {
                        let displayData: { name: string; valPrev: number; valCurr: number }[] = [];
                        
                        if (timeframeMode === "sameDay") {
                          displayData = sameDayMajorData.slice(0, 7).map(m => ({ name: m.name, valPrev: m.target, valCurr: m.actual }));
                        } else if (timeframeMode === "weekly") {
                          displayData = weeklyMajorData.slice(0, 7).map(m => ({ name: m.name, valPrev: m.lastWeekActual, valCurr: m.thisWeekActual }));
                        } else if (timeframeMode === "monthly") {
                          displayData = monthlyMajorData.slice(0, 7).map(m => ({ name: m.name, valPrev: m.mayActual, valCurr: m.juneActual }));
                        } else {
                          displayData = yearlyMajorData.slice(0, 7).map(m => ({ name: m.name, valPrev: m.y25Actual, valCurr: m.y26Actual }));
                        }

                        if (displayData.length === 0) {
                          return (
                            <text x="300" y="130" textAnchor="middle" className="text-xs fill-slate-400 font-sans">
                              所选时间范围暂无招生到账数据
                            </text>
                          );
                        }

                        let maxVal = Math.max(...displayData.map(d => Math.max(d.valPrev, d.valCurr)), 1);
                        const maxNiceY = getNiceMaxY(maxVal);
                        const plotHeight = 190;
                        const chartBottom = 230;
                        const colWidth = 535 / Math.max(1, displayData.length);
                        const barWidth = 14;
                        const barGap = 3;

                        return displayData.map((d, idx) => {
                          const prevHeight = (d.valPrev / maxNiceY) * plotHeight;
                          const currHeight = (d.valCurr / maxNiceY) * plotHeight;

                          const pBarX = 45 + idx * colWidth + (colWidth - barWidth * 2 - barGap) / 2;
                          const cBarX = pBarX + barWidth + barGap;

                          const pBarY = chartBottom - prevHeight;
                          const cBarY = chartBottom - currHeight;

                          const isHovered = hoveredMajorIdx === idx;
                          const isAnyHovered = hoveredMajorIdx !== -1;

                          return (
                            <g key={`tf-bar-grp-${idx}`}>
                              {/* Left Bar (Target / Previous) */}
                              <motion.rect
                                initial={{ height: 0, y: chartBottom }}
                                animate={{ height: prevHeight, y: pBarY }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                x={pBarX}
                                width={barWidth}
                                rx="2"
                                fill={isDarkMode ? (isHovered ? "#64748b" : "#334155") : (isHovered ? "#94a3b8" : "#cbd5e1")}
                                opacity={isAnyHovered && !isHovered ? 0.45 : 1}
                                className="cursor-pointer transition-all duration-200"
                              />

                              {/* Right Bar (Actual / Current) */}
                              <motion.rect
                                initial={{ height: 0, y: chartBottom }}
                                animate={{ height: currHeight, y: cBarY }}
                                transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
                                x={cBarX}
                                width={barWidth}
                                rx="2"
                                fill={channelColors[idx % 7]}
                                opacity={isAnyHovered && !isHovered ? 0.45 : 1}
                                className="cursor-pointer transition-all duration-200"
                              />

                              {/* Axis Major Label */}
                              <text
                                x={pBarX + barWidth + barGap / 2}
                                y="248"
                                textAnchor="middle"
                                className={`text-[9px] font-extrabold transition-colors ${isHovered ? (isDarkMode ? "fill-emerald-400" : "fill-slate-800") : (isDarkMode ? "fill-slate-400" : "fill-slate-500")}`}
                              >
                                {d.name.length > 5 ? `${d.name.substring(0, 4)}...` : d.name}
                              </text>

                              {/* Invisible Trigger rect */}
                              <rect
                                x={45 + idx * colWidth}
                                y="30"
                                width={colWidth}
                                height="205"
                                fill="transparent"
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredMajorIdx(idx)}
                                onMouseLeave={() => setHoveredMajorIdx(-1)}
                              />
                            </g>
                          );
                        });
                      })()}

                      {/* Bottom axis baseline line */}
                      <line x1="45" y1="230" x2="580" y2="230" stroke={isDarkMode ? "#334155" : "#cbd5e1"} strokeWidth="1.5" />
                    </svg>

                    {/* Hover tooltip for timeframe chart */}
                    {hoveredMajorIdx !== -1 && (() => {
                      let d: { name: string; valPrev: number; valCurr: number } = { name: "", valPrev: 0, valCurr: 0 };
                      if (timeframeMode === "sameDay" && sameDayMajorData[hoveredMajorIdx]) {
                        d = { name: sameDayMajorData[hoveredMajorIdx].name, valPrev: sameDayMajorData[hoveredMajorIdx].target, valCurr: sameDayMajorData[hoveredMajorIdx].actual };
                      } else if (timeframeMode === "weekly" && weeklyMajorData[hoveredMajorIdx]) {
                        d = { name: weeklyMajorData[hoveredMajorIdx].name, valPrev: weeklyMajorData[hoveredMajorIdx].lastWeekActual, valCurr: weeklyMajorData[hoveredMajorIdx].thisWeekActual };
                      } else if (timeframeMode === "monthly" && monthlyMajorData[hoveredMajorIdx]) {
                        d = { name: monthlyMajorData[hoveredMajorIdx].name, valPrev: monthlyMajorData[hoveredMajorIdx].mayActual, valCurr: monthlyMajorData[hoveredMajorIdx].juneActual };
                      } else if (timeframeMode === "yearly" && yearlyMajorData[hoveredMajorIdx]) {
                        d = { name: yearlyMajorData[hoveredMajorIdx].name, valPrev: yearlyMajorData[hoveredMajorIdx].y25Actual, valCurr: yearlyMajorData[hoveredMajorIdx].y26Actual };
                      }

                      const valLength = timeframeMode === "sameDay" ? sameDayMajorData.length :
                                      timeframeMode === "weekly" ? weeklyMajorData.length :
                                      timeframeMode === "monthly" ? monthlyMajorData.length : yearlyMajorData.length;

                      const colWidth = 535 / Math.max(1, Math.min(7, valLength));

                      return (
                        <div
                          className="absolute bg-slate-900/95 text-white text-[11px] p-2.5 rounded-xl shadow-xl border border-slate-700 pointer-events-none z-40 transition-all duration-150"
                          style={{
                            left: `${45 + hoveredMajorIdx * colWidth + colWidth / 2 - 80}px`,
                            top: "10px"
                          }}
                        >
                          <p className="font-extrabold text-xs text-white mb-1">{d.name}</p>
                          <div className="space-y-0.5 font-mono text-slate-300">
                            <div className="flex justify-between gap-5">
                              <span>
                                {timeframeMode === "sameDay" ? "目标计划:" :
                                 timeframeMode === "weekly" ? "上周完成:" :
                                 timeframeMode === "monthly" ? "上月完成:" : "去年同期:"}
                              </span>
                              <span className="font-bold text-white">{d.valPrev} 人</span>
                            </div>
                            <div className="flex justify-between gap-5">
                              <span>
                                {timeframeMode === "sameDay" ? "今日实际:" :
                                 timeframeMode === "weekly" ? "本周完成:" :
                                 timeframeMode === "monthly" ? "本月累计:" : "今年累计:"}
                              </span>
                              <span className="font-bold text-emerald-400">{d.valCurr} 人</span>
                            </div>
                            <div className="border-t border-slate-700/80 my-1 pt-1 flex justify-between gap-5 text-[10px]">
                              <span>增减变化:</span>
                              <span className={`font-bold ${d.valCurr - d.valPrev >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {d.valCurr - d.valPrev >= 0 ? `+${d.valCurr - d.valPrev}` : d.valCurr - d.valPrev} 人
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Box 2: Timeframe Contribution Donut Chart (占比饼状图对比) */}
              <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs lg:col-span-4 flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">
                    该时段招生贡献占比图 (Donut Share)
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    展示各专业在本期所占的比例份额
                  </p>
                </div>

                {/* Donut Calculation inside timeframe sub-mode */}
                {(() => {
                  let totalVal = 0;
                  let chartSlices: { name: string; value: number }[] = [];

                  if (timeframeMode === "sameDay") {
                    chartSlices = sameDayMajorData.map(m => ({ name: m.name, value: m.actual }));
                  } else if (timeframeMode === "weekly") {
                    chartSlices = weeklyMajorData.map(m => ({ name: m.name, value: m.thisWeekActual }));
                  } else if (timeframeMode === "monthly") {
                    chartSlices = monthlyMajorData.map(m => ({ name: m.name, value: m.juneActual }));
                  } else {
                    chartSlices = yearlyMajorData.map(m => ({ name: m.name, value: m.y26Actual }));
                  }

                  // Take top 4 and sum other
                  const sortedSlices = [...chartSlices].sort((a,b) => b.value - a.value);
                  const top4 = sortedSlices.slice(0, 4);
                  const otherSum = sortedSlices.slice(4).reduce((sum, s) => sum + s.value, 0);
                  
                  const finalSlices = [...top4];
                  if (otherSum > 0) {
                    finalSlices.push({ name: "其他专业", value: otherSum });
                  }

                  totalVal = finalSlices.reduce((sum, s) => sum + s.value, 0);

                  let accAngle = 0;
                  const slicesWithAngle = finalSlices.map((s, sIdx) => {
                    const percentage = totalVal > 0 ? (s.value / totalVal) * 100 : 0;
                    const angle = totalVal > 0 ? (s.value / totalVal) * 360 : 0;
                    const startAngle = accAngle;
                    const endAngle = accAngle + angle;
                    accAngle += angle;
                    return { ...s, percentage, startAngle, endAngle, color: channelColors[sIdx % 7] };
                  });

                  if (totalVal === 0) {
                    return (
                      <div className="py-12 text-center text-slate-400 text-[11px] border border-dashed border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 font-sans my-4">
                        当前时段暂无到账记录，无法绘制占比图
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col items-center space-y-4 my-2">
                      <div className="relative w-40 h-40">
                        <svg viewBox="0 0 200 200" className="w-full h-full">
                          {slicesWithAngle.map((s, idx) => {
                            const pathD = getDonutPath(100, 100, 52, 78, s.startAngle, s.endAngle);
                            return (
                              <path
                                key={`tf-donut-${idx}`}
                                d={pathD}
                                fill={s.color}
                                className="hover:scale-[1.03] origin-center transition-transform cursor-pointer"
                              >
                                <title>{`${s.name}: ${s.value}人 (${s.percentage.toFixed(1)}%)`}</title>
                              </path>
                            );
                          })}
                          
                          {/* Center circle */}
                          <circle cx="100" cy="100" r="48" fill={isDarkMode ? "#0f172a" : "white"} />
                          <text x="100" y="94" textAnchor="middle" className="text-[9px] font-bold fill-slate-400 dark:fill-slate-500">
                            本期总到账
                          </text>
                          <text x="100" y="116" textAnchor="middle" className="text-xl font-black fill-slate-800 dark:fill-slate-100 font-mono">
                            {totalVal}
                          </text>
                        </svg>
                      </div>

                      {/* Small Legend below */}
                      <div className="w-full space-y-1 text-[10px] max-h-[100px] overflow-y-auto pr-1">
                        {slicesWithAngle.map((s, idx) => (
                          <div key={`legend-${idx}`} className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-bold">
                            <div className="flex items-center space-x-1.5 truncate">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }}></span>
                              <span className="truncate">{s.name}</span>
                            </div>
                            <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold shrink-0">
                              {s.value}人 ({s.percentage.toFixed(1)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight border-t border-slate-100 dark:border-slate-800 pt-3 text-center">
                  💡 提示: 比例图已合并尾部小微招生专业至「其他专业」中以保证高信息密度。
                </div>
              </div>

            </div>

            {/* High Density Analytical Details Table List */}
            <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
              <div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">
                  各大招生专业：时间周期绩效横向对比明细数据表 (Detailed Statistics)
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  全量展示各细分专业在该时段下的目标达成或环比增速表现，并以色块直观反馈盈亏。
                </p>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-extrabold border-b border-slate-200 dark:border-slate-800 text-[11px] font-sans">
                      <th className="py-2.5 px-4 text-center">排序</th>
                      <th className="py-2.5 px-3">招生专业</th>
                      <th className="py-2.5 px-3 text-center">
                        {timeframeMode === "sameDay" ? "今日招生目标 (Target)" :
                         timeframeMode === "weekly" ? "上周录取实际" :
                         timeframeMode === "monthly" ? "上月录取实际" : "去年同期实际"}
                      </th>
                      <th className="py-2.5 px-3 text-center">
                        {timeframeMode === "sameDay" ? "今日招生完成 (Actual)" :
                         timeframeMode === "weekly" ? "本周录取实际" :
                         timeframeMode === "monthly" ? "本月录取实际" : "今年同期实际"}
                      </th>
                      <th className="py-2.5 px-3 text-center">增减差额</th>
                      <th className="py-2.5 px-4 text-center">达成率 / 增幅变动</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-slate-700 dark:text-slate-300">
                    {(() => {
                      let renderData: { name: string; prev: number; curr: number; diff: number; rateOrGrowth: number }[] = [];
                      
                      if (timeframeMode === "sameDay") {
                        renderData = sameDayMajorData.map(m => ({
                          name: m.name,
                          prev: m.target,
                          curr: m.actual,
                          diff: m.actual - m.target,
                          rateOrGrowth: m.rate
                        }));
                      } else if (timeframeMode === "weekly") {
                        renderData = weeklyMajorData.map(m => ({
                          name: m.name,
                          prev: m.lastWeekActual,
                          curr: m.thisWeekActual,
                          diff: m.diff,
                          rateOrGrowth: m.growth
                        }));
                      } else if (timeframeMode === "monthly") {
                        renderData = monthlyMajorData.map(m => ({
                          name: m.name,
                          prev: m.mayActual,
                          curr: m.juneActual,
                          diff: m.diff,
                          rateOrGrowth: m.growth
                        }));
                      } else {
                        renderData = yearlyMajorData.map(m => ({
                          name: m.name,
                          prev: m.y25Actual,
                          curr: m.y26Actual,
                          diff: m.diff,
                          rateOrGrowth: m.growth
                        }));
                      }

                      if (renderData.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                              暂无招生记录
                            </td>
                          </tr>
                        );
                      }

                      return renderData.map((d, rIdx) => {
                        const isPositive = d.diff >= 0;
                        return (
                          <tr key={`tf-tr-${rIdx}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/60 transition-colors font-medium">
                            <td className="py-2 px-4 text-center font-bold text-slate-400 dark:text-slate-500">{rIdx + 1}</td>
                            <td className="py-2 px-3 font-sans font-bold text-slate-800 dark:text-slate-100">{d.name}</td>
                            <td className="py-2 px-3 text-center text-slate-500 dark:text-slate-400">{d.prev} 人</td>
                            <td className="py-2 px-3 text-center font-bold text-slate-800 dark:text-slate-100">{d.curr} 人</td>
                            <td className={`py-2 px-3 text-center font-bold ${isPositive ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/30" : "text-rose-500 dark:text-rose-400 bg-rose-50/20 dark:bg-rose-950/30"}`}>
                              {isPositive ? `+${d.diff}` : d.diff}
                            </td>
                            <td className="py-2 px-4 text-center">
                              {timeframeMode === "sameDay" ? (
                                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${d.rateOrGrowth >= 100 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" : d.rateOrGrowth >= 50 ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"}`}>
                                  达成 {d.rateOrGrowth.toFixed(1)}%
                                </span>
                              ) : (
                                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${d.prev === 0 ? "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20" : d.rateOrGrowth >= 0 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"}`}>
                                  {d.prev === 0 ? "无上期基准" : `增幅 ${d.rateOrGrowth >= 0 ? "+" : ""}${d.rateOrGrowth.toFixed(1)}%`}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* SUBTAB 4: RECRUITMENT INSIGHTS & DIAGNOSTICS */}
        {activeSubTab === "insights" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Box 1: Rankings and Leaderboards */}
            <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
              <div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1">
                  <Award className="w-4.5 h-4.5 text-amber-500 animate-none" />
                  专业目标达成率金榜 & 警报榜
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  全自动监控各大招考大类、专业完成进度
                </p>
              </div>

              {/* Gold list */}
              <div className="space-y-2.5">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold tracking-wider uppercase block bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded w-max">
                  🏆 进度前三甲 (Top 3 Performance)
                </span>
                
                {topMajors.map((m, i) => (
                  <div key={`top-${m.name}-${i}`} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs border border-slate-100 dark:border-slate-850">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-extrabold text-[10px] flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{m.name}</span>
                    </div>
                    <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                      <span>{m.rate.toFixed(1)}%</span>
                      <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">({m.actual} / {m.target}人)</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Red list */}
              <div className="space-y-2.5 pt-2">
                <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold tracking-wider uppercase block bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded w-max">
                  🚨 需重点督导 (Need Assistance Bottom 3)
                </span>

                {bottomMajors.map((m, i) => (
                  <div key={`bottom-${m.name}-${i}`} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs border border-slate-100 dark:border-slate-850">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/20 font-extrabold text-[10px] flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{m.name}</span>
                    </div>
                    <div className="font-mono font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                      <span>{m.rate.toFixed(1)}%</span>
                      <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">({m.actual} / {m.target}人)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Box 2: Automated AI Diagnosis Report */}
            <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 animate-none" />
                    2026年6月招生运营诊断报告 (Diagnostic Report)
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    基于当前实时录入的计划数与渠道完成数做宏观指标计算
                  </p>
                </div>

                <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                    <p>
                      整体招生目标为 <strong>{overallTarget}</strong> 人，目前累计到账 <strong>{overallActual}</strong> 人，
                      整体招生进度达成率为 <strong>{overallRate.toFixed(1)}%</strong>。
                      {overallRate >= 100 
                        ? " 表格目标总体已圆满达成！" 
                        : ` 距离本月全额目标仍存在 ${overallTarget - overallActual} 人的缺口，需集中资源冲刺。`}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                    <p>
                      渠道贡献度：通过前 7 个核心招生渠道招收 <strong>{overallActual - otherTotal}</strong> 人，贡献比高达{" "}
                      <strong>
                        {overallActual > 0 ? (((overallActual - otherTotal) / overallActual) * 100).toFixed(1) : 0}%
                      </strong>
                      。渠道是招生最中坚的力量，建议加大在主力推广渠道的预算。
                    </p>
                  </div>

                  {channelData.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                      <p>
                        单渠道最强：<strong>{config.channels[channelData.sort((a,b)=>b.actual-a.actual)[0]?.index]}</strong> 目前已累积完成{" "}
                        <strong>{channelData.sort((a,b)=>b.actual-a.actual)[0]?.actual}</strong> 人，而完成进度比最优秀的则是{" "}
                        <strong>{config.channels[channelData.sort((a,b)=>b.rate-a.rate)[0]?.index]}</strong>（完成率{" "}
                        <strong>{channelData.sort((a,b)=>b.rate-a.rate)[0]?.rate.toFixed(1)}%</strong>）。
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Diagnostic seal watermark/stamp */}
              <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-1 text-[10px] text-slate-400 dark:text-slate-500">
                  <HelpCircle className="w-3.5 h-3.5 animate-none" />
                  <span>数据采用 standard 加权运算模式</span>
                </div>
                <div className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 text-[9px] uppercase tracking-wider font-extrabold rounded">
                  实时分析就绪
                </div>
              </div>
            </div>

          </div>
        )}

        {/* SUBTAB 5: SMART RECRUITMENT FORECAST & SIMULATOR */}
        {activeSubTab === "forecast" && (() => {
          const daysLeft = Math.max(1, Math.round((new Date(forecastDeadline).getTime() - new Date("2026-06-28").getTime()) / (1000 * 60 * 60 * 24)));
          const channelRateBoost = focusChannelIdx !== -1 ? 0.15 : 0;
          const adjustedDailyRunRate = dailyRunRate * paceMultiplier * (1 + channelRateBoost);
          const projectedAdditional = Math.round(adjustedDailyRunRate * daysLeft);
          const projectedTotal = overallActual + projectedAdditional;
          const projectedRate = overallTarget > 0 ? (projectedTotal / overallTarget) * 100 : 0;
          const projectedGap = Math.max(0, overallTarget - projectedTotal);

          // Best channel info
          const sortedChs = [...channelData].sort((a, b) => b.rate - a.rate);
          const maxCh = sortedChs[0];

          // Determine confidence rating and styling
          let confidenceLevel = "极高信心 (Highly Confident)";
          let confidenceColor = "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900";
          let confidenceDot = "bg-emerald-500";
          let adviceText = `按照当前 ${paceMultiplier}x 宣发冲刺系数与截止日期，系统预测最终到账数将达 ${projectedTotal} 人，大幅超出招生总目标！建议平稳收尾，优化运营成本。`;

          if (projectedRate >= 95 && projectedRate < 105) {
            confidenceLevel = "稳健区间 (On Track)";
            confidenceColor = "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900";
            confidenceDot = "bg-amber-500";
            adviceText = `系统研判将刚好“踩线”达成目标（预计达成率 ${projectedRate.toFixed(1)}%）。建议对完成度极佳的 [${maxCh?.name || '核心'}] 渠道进行持续跟投，确保没有任何尾部生源流失。`;
          } else if (projectedRate < 95) {
            confidenceLevel = "重度风险缺口 (At Risk)";
            confidenceColor = "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900";
            confidenceDot = "bg-rose-500";
            adviceText = `警报！若不调整，到期预计到账仅为 ${projectedTotal} 人，依然存在 ${projectedGap} 人的目标缺口（预计达成率 ${projectedRate.toFixed(1)}%）。建议将冲刺系数上调至 1.5x 以上，并将定向爆破资源拨至 [${maxCh?.name || '主力'}] 渠道。`;
          }

          // Generate coordinates for SVG Forecast Line chart
          // Historical data (simulate daily cumulative actuals from 0 to overallActual)
          const histCount = 7;
          const histPoints: { x: number; y: number; val: number }[] = [];
          for (let i = 0; i < histCount; i++) {
            const pct = i / (histCount - 1);
            // Non-linear increase to represent standard enrollment curve
            const curvePct = Math.pow(pct, 1.2);
            const val = Math.round(overallActual * curvePct);
            const px = 45 + pct * 230; // Left half of chart is history (45 to 275)
            histPoints.push({ x: px, y: val, val });
          }

          // Projected data points (from today at x=275, y=overallActual to deadline at x=460)
          // Baseline (1.0x, no boost)
          const baseProjectedAdditional = Math.round(dailyRunRate * daysLeft);
          const baseProjectedTotal = overallActual + baseProjectedAdditional;

          const maxValForChart = Math.max(overallTarget, projectedTotal, baseProjectedTotal, 100) * 1.15;
          const mapY = (val: number) => 170 - (val / maxValForChart) * 140;

          const pTodayX = 275;
          const pTodayY = mapY(overallActual);
          const pDeadlineX = 460;
          const pDeadlineYConfigured = mapY(projectedTotal);
          const pDeadlineYBaseline = mapY(baseProjectedTotal);
          const pTargetY = mapY(overallTarget);

          // Historical path
          const histPathD = histPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${mapY(p.val)}`).join(' ');

          return (
            <div className="space-y-6">
              
              {/* Top Banner introducing the workspace */}
              <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-2">
                <div className="flex items-center space-x-2 text-emerald-600">
                  <Calculator className="w-5 h-5 animate-none" />
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">
                    智能招生预测模拟与情景推演工作台 (AI Target Prognosis Workbench)
                  </h3>
                </div>
                <p className="text-[10px] text-slate-400">
                  结合过往录入周期的数据沉淀，科学进行时序趋势推演。您可以通过调节下方控制面板的冲刺速率、投放倾斜与截止时间，实时进行招生走势模拟。
                </p>
              </div>

              {/* Aggregated Simulation KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">当前累计已到账 (Actual)</p>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 font-mono">{overallActual}人</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>当前总完成度</span>
                    <span className="font-bold text-slate-600 dark:text-slate-300">{overallRate.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">每日 average 招生增速 (DRR)</p>
                  <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">{(overallActual / elapsedDays).toFixed(1)} 人/天</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">基于近 {elapsedDays} 个自然日到账样本均值</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {forecastDeadline} 预测到账
                  </p>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 font-mono">
                    {projectedTotal} 人
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>届时预计达成率</span>
                    <span className={`font-black ${projectedRate >= 100 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
                      {projectedRate.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">冲刺到期缺口 (Gap)</p>
                  <p className={`text-xl font-extrabold mt-1 font-mono ${projectedGap === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
                    {projectedGap === 0 ? "指标全面超额" : `${projectedGap} 人`}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    {projectedGap === 0 ? "🟢 无需追加推广投入" : "🔴 需通过调节参数来消除缺口"}
                  </p>
                </div>
              </div>

              {/* Main Content: Left Controls, Right Output */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left control panel */}
                <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs lg:col-span-5 space-y-6">
                  <div>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">模拟情景配置 (Simulation Config)</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">可点击并微调以下运营参数，右侧决策模型将实时随动更新。</p>
                  </div>

                  <div className="space-y-4">
                    {/* Control 1: Deadline */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>招生截止结算截止日期:</span>
                      </label>
                      <select
                        value={forecastDeadline}
                        onChange={(e) => setForecastDeadline(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 transition-all cursor-pointer"
                      >
                        <option value="2026-06-30">2026年06月30日 (月底冲刺 · 剩 2 天)</option>
                        <option value="2026-07-05">2026年07月05日 (下周结案 · 剩 7 天)</option>
                        <option value="2026-07-15">2026年07月15日 (中期节点 · 剩 17 天)</option>
                        <option value="2026-07-31">2026年07月31日 (跨月大考 · 剩 33 天)</option>
                      </select>
                      <p className="text-[9px] text-slate-400">设定时间距离今日有 <strong>{daysLeft}</strong> 天的冲刺爆发时间窗口。</p>
                    </div>

                    {/* Control 2: Pace multiplier slider */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        <label className="flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                          <span>宣发与推广冲刺强度:</span>
                        </label>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 text-xs font-black">{paceMultiplier.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.5"
                        step="0.1"
                        value={paceMultiplier}
                        onChange={(e) => setPaceMultiplier(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 font-bold font-mono">
                        <span>0.5x (常规维持)</span>
                        <span>1.0x (基准增速)</span>
                        <span>2.5x (全员会战)</span>
                      </div>
                    </div>

                    {/* Control 3: Focus Channel selection */}
                    <div className="space-y-1.5 pt-2">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span>核心转化通路倾斜加成:</span>
                      </label>
                      <select
                        value={focusChannelIdx}
                        onChange={(e) => setFocusChannelIdx(parseInt(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 transition-all cursor-pointer"
                      >
                        <option value="-1">不作特殊渠道倾斜 (默认)</option>
                        {config.channels.map((ch, idx) => (
                          <option key={`opt-ch-${idx}`} value={idx}>
                            {ch} (+15% 专属引流加权)
                          </option>
                        ))}
                      </select>
                      <p className="text-[9px] text-slate-400">倾斜投放后，由于垂直转化率极速爬升，模型会将日均增速额外放大。</p>
                    </div>

                    {/* Dynamic Scenario Preset Buttons */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <span className="text-[10px] font-extrabold text-slate-400 block">快捷情景预设:</span>
                      <div className="grid grid-cols-3 gap-2 text-[10px] font-bold">
                        <button
                          onClick={() => { setPaceMultiplier(0.7); setFocusChannelIdx(-1); }}
                          className="py-1.5 border border-slate-200 dark:border-slate-800 hover:border-slate-300 rounded text-slate-600 dark:text-slate-300 text-center cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-950/40"
                        >
                          常规微调 (0.7x)
                        </button>
                        <button
                          onClick={() => { setPaceMultiplier(1.2); setFocusChannelIdx(0); }}
                          className="py-1.5 border border-emerald-200 dark:border-emerald-900 hover:border-emerald-300 rounded text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 text-center cursor-pointer transition-all hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40"
                        >
                          温和扩张 (1.2x)
                        </button>
                        <button
                          onClick={() => { setPaceMultiplier(2.0); setFocusChannelIdx(sortedChs[0]?.index ?? 0); }}
                          className="py-1.5 border border-violet-200 dark:border-violet-900 hover:border-violet-300 rounded text-violet-700 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-950/20 text-center cursor-pointer transition-all hover:bg-violet-100/50 dark:hover:bg-violet-950/40"
                        >
                          全力会战 (2.0x)
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right chart and diagnostic results panel */}
                <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs lg:col-span-7 flex flex-col justify-between space-y-6">
                  
                  {/* Visual Chart */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">招生运行趋势模拟走势图 (Trajectory Chart)</h4>
                      <span className="text-[9px] text-slate-400 font-mono">X轴: 时间周期 | Y轴: 累计到账(人)</span>
                    </div>

                    <div className="relative w-full border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50/30 dark:bg-slate-950/20">
                      <svg viewBox="0 0 500 200" className="w-full h-auto min-h-[160px]">
                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                          const y = 170 - ratio * 150;
                          const val = Math.round(maxValForChart * ratio);
                          return (
                            <g key={`forecast-grid-${idx}`}>
                              <line x1="40" y1={y} x2="470" y2={y} stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} strokeWidth="1.5" />
                              <text x="35" y={y + 4} textAnchor="end" className="text-[8px] font-mono font-bold fill-slate-400">
                                {val}
                              </text>
                            </g>
                          );
                        })}

                        {/* Reference Target line */}
                        <line x1="40" y1={pTargetY} x2="470" y2={pTargetY} stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3 3" />
                        <text x="465" y={pTargetY - 4} textAnchor="end" className="text-[8px] font-bold fill-rose-500">
                          原定目标线 ({overallTarget}人)
                        </text>

                        {/* Historical Line (Solid Emerald) */}
                        <path
                          d={histPathD}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />

                        {/* Baseline Projection Line (Dotted Gray) */}
                        <line
                          x1={pTodayX}
                          y1={pTodayY}
                          x2={pDeadlineX}
                          y2={pDeadlineYBaseline}
                          stroke="#94a3b8"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                        />

                        {/* Boosted / Selected Scenario Projection Line (Dashed Emerald/Violet) */}
                        <line
                          x1={pTodayX}
                          y1={pTodayY}
                          x2={pDeadlineX}
                          y2={pDeadlineYConfigured}
                          stroke={paceMultiplier >= 1.5 ? "#8b5cf6" : "#10b981"}
                          strokeWidth="3"
                          strokeDasharray="5 3"
                        />

                        {/* Vertical line splitting Today vs Forecast */}
                        <line x1={pTodayX} y1="15" x2={pTodayX} y2="175" stroke={isDarkMode ? "#334155" : "#cbd5e1"} strokeWidth="1.5" strokeDasharray="2 2" />
                        <text x={pTodayX} y="12" textAnchor="middle" className="text-[8px] font-bold fill-slate-400">
                          今日节点
                        </text>

                        {/* End deadline node point */}
                        <circle cx={pDeadlineX} cy={pDeadlineYConfigured} r="5" fill={paceMultiplier >= 1.5 ? "#8b5cf6" : "#10b981"} />
                        <text x={pDeadlineX} y={pDeadlineYConfigured - 8} textAnchor="middle" className="text-[9px] font-black fill-slate-800 dark:fill-slate-100 font-mono">
                          {projectedTotal}人
                        </text>

                        {/* Historical node labels */}
                        <circle cx="45" cy={mapY(0)} r="3" fill="#10b981" />
                        <circle cx={pTodayX} cy={pTodayY} r="4" fill="#10b981" />

                        {/* X-Axis labels */}
                        <text x="45" y="185" textAnchor="middle" className="text-[8px] font-bold fill-slate-400">
                          06-01
                        </text>
                        <text x={pTodayX} y="185" textAnchor="middle" className="text-[8px] font-bold fill-slate-400">
                          06-28 (今天)
                        </text>
                        <text x={pDeadlineX} y="185" textAnchor="middle" className="text-[8px] font-bold fill-slate-400">
                          {forecastDeadline.slice(5)} (目标期)
                        </text>

                        {/* Bottom baseline axis */}
                        <line x1="40" y1="170" x2="470" y2="170" stroke={isDarkMode ? "#334155" : "#cbd5e1"} strokeWidth="1.5" />
                      </svg>

                      {/* Legend detail box inside chart wrapper */}
                      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[9px] font-bold mt-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-1.5 rounded bg-emerald-500 inline-block"></span>
                          <span className="text-slate-500 dark:text-slate-400">历史真实累计到账</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-0.5 border-t border-dashed border-slate-400 inline-block"></span>
                          <span className="text-slate-500 dark:text-slate-400">基准无干预走势 (1.0x)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-0.5 border-t border-dashed border-violet-500 inline-block"></span>
                          <span className="text-slate-500 dark:text-slate-400">模拟推演走势 ({paceMultiplier}x)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scenario Diagnostics Box */}
                  <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">
                        💡 决策推演结果 (Prognosis Summary)
                      </span>
                      <div className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full border flex items-center gap-1 ${confidenceColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${confidenceDot}`}></span>
                        <span>{confidenceLevel}</span>
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed font-sans space-y-2">
                      <p>{adviceText}</p>
                      
                      <div className="text-[10px] text-slate-400 leading-normal border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>运营策略：建议追加资源至 <strong>{config.channels[maxCh?.index || 0]}</strong> 渠道，当前它的达成率达 <strong>{maxCh?.rate.toFixed(1)}%</strong>，是效率最高的引流点。</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          );
        })()}

      </div>

      {/* HIGH FIDELITY EXECUTIVE BRIEFING OVERLAY MODAL */}
      {showBriefingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4.5 h-4.5 text-emerald-400 animate-pulse" />
                <h3 className="font-extrabold text-sm text-white">
                  2026年6月招生运营高管数据简报 (High-Fidelity BI Report)
                </h3>
              </div>
              <button
                onClick={() => setShowBriefingModal(false)}
                className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer p-1 rounded-lg transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                本简报已经过招生智能BI决策引擎计算，整合了渠道、专业及时间序列趋势要素。您可以一键复制或下载此文本，直接粘贴至您的周报、月报公文，或者微信工作群汇报中。
              </p>

              {/* Text Area container */}
              <div className="relative">
                <pre className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-mono text-[11px] leading-relaxed p-4 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto whitespace-pre-wrap max-h-[42vh] select-text">
                  {generateExecutiveBriefingText()}
                </pre>

                {copySuccess && (
                  <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>已成功复制到剪贴板！</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>符合标准行政汇报排版，可直接粘贴汇报</span>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleCopyBriefing}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 active:scale-95 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-all"
                >
                  <Copy className="w-4 h-4" />
                  <span>一键复制</span>
                </button>
                <button
                  onClick={handleDownloadBriefing}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>下载 .txt 简报</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
