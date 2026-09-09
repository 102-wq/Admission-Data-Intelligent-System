import React, { useState } from "react";
import Markdown from "react-markdown";
import { 
  ResponsiveContainer, 
  LineChart as ReLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ReTooltip, 
  Legend 
} from "recharts";
import { RowData, TableConfig } from "../types";
import { 
  Target, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, AlertCircle, Activity, 
  ArrowUpRight, Filter, Scale, X, ArrowLeftRight, CheckSquare, Square, 
  Layers, Sparkles, Trophy, BarChart2, LineChart, Maximize2, Flame, Download, FileText, Check, Zap, Calculator, Wrench,
  TrendingUp, TrendingDown, Columns, LayoutGrid, Search, Plus, Compass, Bookmark, BookmarkCheck, Star, Trash2,
  Bot, BrainCircuit, Copy, RotateCcw, Gauge, Globe, Clock, Calendar, SlidersHorizontal, Layers3
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import MajorChannelDetailModal from "./MajorChannelDetailModal";
import { getMajorAlertStatus } from "../utils/majorAlert";

interface BenchmarkMajor {
  name: string;
  category: "热门工科" | "高增长专业" | "新兴热门" | "标杆基准" | "医药健康" | "数字艺术";
  target: number;
  actual: number;
  channels: Array<{ target: number; actual: number }>;
  other: { target: number; actual: number };
  description: string;
}

const PRESET_BENCHMARK_MAJORS: BenchmarkMajor[] = [
  {
    name: "新能源汽车技术",
    category: "新兴热门",
    target: 260,
    actual: 232,
    channels: [
      { target: 60, actual: 58 },
      { target: 45, actual: 42 },
      { target: 35, actual: 30 },
      { target: 40, actual: 38 },
      { target: 30, actual: 28 },
      { target: 25, actual: 20 },
      { target: 25, actual: 16 }
    ],
    other: { target: 0, actual: 0 },
    description: "新能源产教融合标杆专业，线上推广与高中合作渠道双轮驱动"
  },
  {
    name: "计算机应用技术",
    category: "热门工科",
    target: 300,
    actual: 285,
    channels: [
      { target: 80, actual: 78 },
      { target: 50, actual: 46 },
      { target: 40, actual: 39 },
      { target: 45, actual: 42 },
      { target: 35, actual: 34 },
      { target: 25, actual: 24 },
      { target: 25, actual: 22 }
    ],
    other: { target: 0, actual: 0 },
    description: "传统IT强系，社媒引流与线上转化率均处于头部水平"
  },
  {
    name: "电子商务与直播运营",
    category: "高增长专业",
    target: 220,
    actual: 208,
    channels: [
      { target: 55, actual: 54 },
      { target: 35, actual: 32 },
      { target: 30, actual: 28 },
      { target: 30, actual: 27 },
      { target: 35, actual: 36 },
      { target: 18, actual: 16 },
      { target: 17, actual: 15 }
    ],
    other: { target: 0, actual: 0 },
    description: "数字经济强关联专业，抖音/小红书等社媒渠道爆发力极强"
  },
  {
    name: "大数据技术与应用",
    category: "热门工科",
    target: 180,
    actual: 145,
    channels: [
      { target: 45, actual: 38 },
      { target: 30, actual: 22 },
      { target: 25, actual: 20 },
      { target: 25, actual: 21 },
      { target: 20, actual: 18 },
      { target: 18, actual: 14 },
      { target: 17, actual: 12 }
    ],
    other: { target: 0, actual: 0 },
    description: "高薪导向专业，注重转介绍与高中合作优质生源"
  },
  {
    name: "护理学与健康管理",
    category: "医药健康",
    target: 250,
    actual: 215,
    channels: [
      { target: 50, actual: 42 },
      { target: 50, actual: 48 },
      { target: 40, actual: 36 },
      { target: 40, actual: 38 },
      { target: 25, actual: 20 },
      { target: 25, actual: 18 },
      { target: 20, actual: 13 }
    ],
    other: { target: 0, actual: 0 },
    description: "就业极稳专业，线下宣讲与转介绍口碑优势显著"
  },
  {
    name: "智能 UI/UX 数字艺术",
    category: "数字艺术",
    target: 160,
    actual: 138,
    channels: [
      { target: 40, actual: 36 },
      { target: 25, actual: 20 },
      { target: 20, actual: 18 },
      { target: 20, actual: 16 },
      { target: 30, actual: 28 },
      { target: 15, actual: 11 },
      { target: 10, actual: 9 }
    ],
    other: { target: 0, actual: 0 },
    description: "作品集驱动型专业，视觉宣讲与作品展出转化率极高"
  },
  {
    name: "工业机器人与自动化",
    category: "标杆基准",
    target: 200,
    actual: 162,
    channels: [
      { target: 50, actual: 40 },
      { target: 35, actual: 28 },
      { target: 30, actual: 24 },
      { target: 30, actual: 26 },
      { target: 20, actual: 18 },
      { target: 20, actual: 15 },
      { target: 15, actual: 11 }
    ],
    other: { target: 0, actual: 0 },
    description: "智能制造重点建设专业，企业订单班培养模式"
  }
];

interface MajorProgressOverviewProps {
  rows: RowData[];
  config?: TableConfig;
  isDarkMode: boolean;
  selectedDate: string;
  viewMode: "daily" | "monthly";
  onSelectMajor: (majorName: string) => void;
  onUpdateRows?: (updatedRows: RowData[]) => void;
  onOpenTrendModal?: (majorName: string) => void;
}

type SortOption = "rate" | "rate_asc" | "target" | "actual" | "gap" | "name";

// Helper function to return dynamic heatmap color styles based on major completion rate density
const getHeatmapStyle = (rate: number, isDarkMode: boolean) => {
  if (rate >= 100) {
    return {
      bgCard: isDarkMode
        ? "bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 border-emerald-400 text-white shadow-md ring-1 ring-emerald-400/50"
        : "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 border-emerald-700 text-white shadow-md ring-1 ring-emerald-400",
      badgeText: "极大密集 (≥100%)",
      badgeClass: "bg-white/20 text-white border-white/40 font-black",
      barGradient: "from-amber-300 via-yellow-200 to-white",
      rateBadgeClass: "bg-white/25 text-white font-black border-white/30",
      nameClass: "text-white font-black",
      trackBg: "bg-black/30 dark:bg-black/40",
      targetLineColor: "bg-amber-300",
      targetTextClass: "text-emerald-100 font-bold",
      actualTextClass: "text-amber-200 font-black",
      heatLevel: 5,
    };
  } else if (rate >= 80) {
    return {
      bgCard: isDarkMode
        ? "bg-emerald-900/85 border-emerald-500/80 text-emerald-100 shadow-xs ring-1 ring-emerald-500/40"
        : "bg-emerald-200/90 border-emerald-500 text-emerald-950 shadow-xs font-semibold",
      badgeText: "高密集 (80-100%)",
      badgeClass: isDarkMode ? "bg-emerald-500/25 text-emerald-200 border-emerald-400/40 font-extrabold" : "bg-emerald-700/20 text-emerald-950 border-emerald-600/30 font-bold",
      barGradient: "from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300",
      rateBadgeClass: isDarkMode ? "bg-emerald-500/30 text-emerald-200 font-extrabold" : "bg-emerald-800/20 text-emerald-950 font-extrabold",
      nameClass: isDarkMode ? "text-emerald-100 font-extrabold" : "text-emerald-950 font-extrabold",
      trackBg: isDarkMode ? "bg-black/30" : "bg-emerald-100/90",
      targetLineColor: "bg-indigo-600 dark:bg-indigo-300",
      targetTextClass: "text-emerald-800 dark:text-emerald-200 font-bold",
      actualTextClass: "text-emerald-900 dark:text-emerald-100 font-extrabold",
      heatLevel: 4,
    };
  } else if (rate >= 50) {
    return {
      bgCard: isDarkMode
        ? "bg-teal-950/70 border-teal-700/70 text-teal-200"
        : "bg-teal-100/90 border-teal-300 text-teal-950",
      badgeText: "中高密集 (50-80%)",
      badgeClass: isDarkMode ? "bg-teal-500/20 text-teal-300 border-teal-500/30 font-bold" : "bg-teal-600/15 text-teal-900 border-teal-400/30 font-bold",
      barGradient: "from-teal-500 to-cyan-500",
      rateBadgeClass: isDarkMode ? "bg-teal-500/20 text-teal-300 font-bold" : "bg-teal-600/15 text-teal-900 font-bold",
      nameClass: isDarkMode ? "text-teal-200 font-bold" : "text-teal-900 font-bold",
      trackBg: isDarkMode ? "bg-black/25" : "bg-teal-50/90",
      targetLineColor: "bg-indigo-600 dark:bg-indigo-400",
      targetTextClass: "text-teal-700 dark:text-teal-300 font-bold",
      actualTextClass: "text-teal-900 dark:text-teal-100 font-extrabold",
      heatLevel: 3,
    };
  } else if (rate >= 30) {
    return {
      bgCard: isDarkMode
        ? "bg-amber-950/40 border-amber-800/50 text-amber-200"
        : "bg-amber-100/80 border-amber-300 text-amber-950",
      badgeText: "中低密集 (30-50%)",
      badgeClass: isDarkMode ? "bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold" : "bg-amber-600/15 text-amber-900 border-amber-400/30 font-bold",
      barGradient: "from-amber-500 to-yellow-400",
      rateBadgeClass: isDarkMode ? "bg-amber-500/20 text-amber-300 font-bold" : "bg-amber-600/15 text-amber-900 font-bold",
      nameClass: isDarkMode ? "text-amber-200 font-bold" : "text-amber-950 font-bold",
      trackBg: isDarkMode ? "bg-black/20" : "bg-amber-50/90",
      targetLineColor: "bg-indigo-600 dark:bg-indigo-400",
      targetTextClass: "text-amber-800 dark:text-amber-300 font-bold",
      actualTextClass: "text-amber-900 dark:text-amber-100 font-extrabold",
      heatLevel: 2,
    };
  } else {
    return {
      bgCard: isDarkMode
        ? "bg-rose-950/40 border-rose-900/60 text-rose-200"
        : "bg-rose-100/80 border-rose-200 text-rose-950",
      badgeText: "浅疏/低达成 (<30%)",
      badgeClass: isDarkMode ? "bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold" : "bg-rose-600/15 text-rose-900 border-rose-300/40 font-bold",
      barGradient: "from-rose-500 to-pink-500",
      rateBadgeClass: isDarkMode ? "bg-rose-500/20 text-rose-300 font-bold" : "bg-rose-600/15 text-rose-900 font-bold",
      nameClass: isDarkMode ? "text-rose-200 font-bold" : "text-rose-950 font-bold",
      trackBg: isDarkMode ? "bg-black/20" : "bg-rose-50/90",
      targetLineColor: "bg-indigo-600 dark:bg-indigo-400",
      targetTextClass: "text-rose-800 dark:text-rose-300 font-bold",
      actualTextClass: "text-rose-900 dark:text-rose-100 font-extrabold",
      heatLevel: 1,
    };
  }
};

export default function MajorProgressOverview({
  rows,
  config,
  isDarkMode,
  selectedDate,
  viewMode,
  onSelectMajor,
  onUpdateRows,
  onOpenTrendModal
}: MajorProgressOverviewProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("rate");

  // Comparison Mode States
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedCompareMajors, setSelectedCompareMajors] = useState<string[]>([]);
  const [showCompareDrawer, setShowCompareDrawer] = useState(false);
  const [detailModalMajor, setDetailModalMajor] = useState<string | null>(null);
  const [showExportToast, setShowExportToast] = useState(false);

  // Quick Fix States
  const [quickFixMajor, setQuickFixMajor] = useState<string | null>(null);
  const [customFixAmount, setCustomFixAmount] = useState<{ [majorName: string]: number }>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Layout View Mode State: "standard" (标准卡片视图) vs "dual" (双列对比视图)
  const [layoutViewMode, setLayoutViewMode] = useState<"standard" | "dual">("standard");
  const [dualMajorA, setDualMajorA] = useState<string>("");
  const [dualMajorB, setDualMajorB] = useState<string>("");

  // Overlaid Trend Line Chart States for Dual Comparison View
  const [showDualTrendChart, setShowDualTrendChart] = useState<boolean>(true);
  const [trendChartMetric, setTrendChartMetric] = useState<"cumulative" | "daily">("cumulative");

  // Global Multi-Timeframe Dashboard States
  const [showGlobalDashboard, setShowGlobalDashboard] = useState<boolean>(false);
  const [dashboardFocusMajor, setDashboardFocusMajor] = useState<string>("ALL");
  const [dashboardFilterMode, setDashboardFilterMode] = useState<"high_variance" | "alert" | "all">("high_variance");
  const [dashboardSortMode, setDashboardSortMode] = useState<"variance" | "allTimeRate" | "gap">("variance");

  // Major Yield/Deficit Simulation Modal States
  const [simulationMajor, setSimulationMajor] = useState<string | null>(null);
  const [simChannelWeights, setSimChannelWeights] = useState<{ [key: number]: number }>({});
  const [simChannelTargetAdj, setSimChannelTargetAdj] = useState<{ [key: number]: number }>({});
  const [showCompareOriginal, setShowCompareOriginal] = useState<boolean>(true);

  // Customizable Warning & Alarm Threshold Percentages
  const [yellowThreshold, setYellowThreshold] = useState<number>(() => {
    const saved = localStorage.getItem("major_overview_yellow_threshold");
    return saved ? Number(saved) : 30;
  });
  const [redThreshold, setRedThreshold] = useState<number>(() => {
    const saved = localStorage.getItem("major_overview_red_threshold");
    return saved ? Number(saved) : 10;
  });
  const [showThresholdModal, setShowThresholdModal] = useState<boolean>(false);
  const [tempYellow, setTempYellow] = useState<number>(yellowThreshold);
  const [tempRed, setTempRed] = useState<number>(redThreshold);

  React.useEffect(() => {
    localStorage.setItem("major_overview_yellow_threshold", String(yellowThreshold));
  }, [yellowThreshold]);

  React.useEffect(() => {
    localStorage.setItem("major_overview_red_threshold", String(redThreshold));
  }, [redThreshold]);

  // Heatmap View Mode State: Changes card background color dynamically based on rate density (higher rate = deeper color)
  const [isHeatmapMode, setIsHeatmapMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("major_overview_heatmap_mode");
    return saved === "true";
  });

  React.useEffect(() => {
    localStorage.setItem("major_overview_heatmap_mode", String(isHeatmapMode));
  }, [isHeatmapMode]);

  // LocalStorage Saved Comparison Pair State
  const [savedPair, setSavedPair] = useState<{ majorA: string; majorB: string } | null>(null);

  // Sidebar Suggestions & Search States
  const [showBenchmarkSidebar, setShowBenchmarkSidebar] = useState(false);
  const [benchmarkSearch, setBenchmarkSearch] = useState("");
  const [selectedBenchmarkCategory, setSelectedBenchmarkCategory] = useState<string>("全部");
  const [addedBenchmarkNames, setAddedBenchmarkNames] = useState<string[]>([]);

  // Search & Select Modal States for Comparison Mode
  const [showSearchSelectModal, setShowSearchSelectModal] = useState(false);
  const [modalSearchKeyword, setModalSearchKeyword] = useState("");
  const [modalCategory, setModalCategory] = useState("全部");

  // Load saved comparison pair from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("saved_dual_comparison_pair");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.majorA === "string" && typeof parsed.majorB === "string") {
          setSavedPair({ majorA: parsed.majorA, majorB: parsed.majorB });
        }
      }
    } catch (err) {
      console.error("Failed to read saved_dual_comparison_pair from localStorage", err);
    }
  }, []);

  // Save comparison pair to localStorage
  const handleSaveComparisonPair = (aName: string, bName: string) => {
    if (!aName || !bName) return;
    const pair = { majorA: aName, majorB: bName, savedAt: new Date().toISOString() };
    try {
      localStorage.setItem("saved_dual_comparison_pair", JSON.stringify(pair));
      setSavedPair({ majorA: aName, majorB: bName });
      setToastMsg(`已成功记住当前对比组合【${aName} VS ${bName}】！下次切换至对比视图时将自动优先加载。`);
    } catch (err) {
      console.error("Failed to save comparison pair to localStorage", err);
    }
  };

  // Clear saved comparison pair
  const handleClearSavedPair = () => {
    try {
      localStorage.removeItem("saved_dual_comparison_pair");
      setSavedPair(null);
      setToastMsg("已清除记住的对比组合。");
    } catch (err) {
      console.error("Failed to clear saved comparison pair", err);
    }
  };

  // Hover Tooltip State
  const [hoveredMajorName, setHoveredMajorName] = useState<string | null>(null);

  // Inline Channel Mini-Table Expanded State
  const [expandedCardMajors, setExpandedCardMajors] = useState<string[]>([]);

  const toggleInlineChannelExpand = (majorName: string) => {
    if (expandedCardMajors.includes(majorName)) {
      setExpandedCardMajors(expandedCardMajors.filter((m) => m !== majorName));
    } else {
      setExpandedCardMajors([...expandedCardMajors, majorName]);
    }
  };

  // AI Channel Variance Diagnosis Modal States
  const [showAiDiagnosisModal, setShowAiDiagnosisModal] = useState(false);
  const [aiDiagnosisLoading, setAiDiagnosisLoading] = useState(false);
  const [aiDiagnosisContent, setAiDiagnosisContent] = useState<string | null>(null);
  const [aiDiagnosisError, setAiDiagnosisError] = useState<string | null>(null);
  const [copiedDiagnosis, setCopiedDiagnosis] = useState(false);
  const [aiDiagnosisTarget, setAiDiagnosisTarget] = useState<{
    channelName: string;
    majorA: {
      name: string;
      channelTarget: number;
      channelActual: number;
      channelRate: number;
      totalTarget: number;
      totalRate: number;
    };
    majorB: {
      name: string;
      channelTarget: number;
      channelActual: number;
      channelRate: number;
      totalTarget: number;
      totalRate: number;
    };
    chDiff: number;
  } | null>(null);

  // Trigger Gemini Diagnosis API Call
  const handleOpenAiDiagnosis = async (targetData: {
    channelName: string;
    majorA: {
      name: string;
      channelTarget: number;
      channelActual: number;
      channelRate: number;
      totalTarget: number;
      totalRate: number;
    };
    majorB: {
      name: string;
      channelTarget: number;
      channelActual: number;
      channelRate: number;
      totalTarget: number;
      totalRate: number;
    };
    chDiff: number;
  }) => {
    setAiDiagnosisTarget(targetData);
    setShowAiDiagnosisModal(true);
    setAiDiagnosisLoading(true);
    setAiDiagnosisError(null);
    setAiDiagnosisContent(null);
    setCopiedDiagnosis(false);

    try {
      const response = await fetch("/api/diagnose-channel-delta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          majorA: targetData.majorA,
          majorB: targetData.majorB,
          channelName: targetData.channelName,
          date: selectedDate,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "获取 AI 渠道差异诊断失败");
      }

      const data = await response.json();
      setAiDiagnosisContent(data.diagnosis);
    } catch (err: any) {
      console.error("AI Diagnose Error:", err);
      setAiDiagnosisError(err.message || "请求 AI 归因诊断服务失败，请重试。");
    } finally {
      setAiDiagnosisLoading(false);
    }
  };

  const handleCopyDiagnosis = () => {
    if (!aiDiagnosisContent) return;
    navigator.clipboard.writeText(aiDiagnosisContent);
    setCopiedDiagnosis(true);
    setToastMsg("已成功将 Gemini 归因诊断分析复制到剪贴板！");
    setTimeout(() => setCopiedDiagnosis(false), 3000);
  };

  // 1. Filter rows for active period
  const activeRows = viewMode === "daily"
    ? rows.filter((r) => r.date === selectedDate)
    : rows.filter((r) => r.date.startsWith(selectedDate.substring(0, 7)));

  // Channel names array
  const channelNames = config?.channels || [
    "线上推广", "线下宣讲", "转介绍", "高中合作", "社媒引流", "招生简章", "其它渠道"
  ];

  // 2. Aggregate actual completions & targets by Major Name, including channel level stats
  const aggregation: { 
    [name: string]: { 
      target: number; 
      actual: number;
      channels: Array<{ target: number; actual: number }>;
      other: { target: number; actual: number };
    } 
  } = {};

  activeRows.forEach((row) => {
    if (!row.name) return;
    if (!aggregation[row.name]) {
      const defaultChannels = Array.from({ length: 7 }, () => ({ target: 0, actual: 0 }));
      aggregation[row.name] = { 
        target: 0, 
        actual: 0,
        channels: defaultChannels,
        other: { target: 0, actual: 0 }
      };
    }

    if (row.channels) {
      row.channels.forEach((ch, idx) => {
        if (idx < 7) {
          const t = typeof ch.target === "number" ? ch.target : Number(ch.target) || 0;
          const a = typeof ch.actual === "number" ? ch.actual : Number(ch.actual) || 0;
          aggregation[row.name].channels[idx].target += t;
          aggregation[row.name].channels[idx].actual += a;
          aggregation[row.name].target += t;
          aggregation[row.name].actual += a;
        }
      });
    }

    const oActual = typeof row.other === "number" ? row.other : Number(row.other) || 0;
    aggregation[row.name].other.actual += oActual;
    aggregation[row.name].actual += oActual;
  });

  // Dynamically include added benchmark majors into aggregation
  addedBenchmarkNames.forEach((benchName) => {
    if (!aggregation[benchName]) {
      const preset = PRESET_BENCHMARK_MAJORS.find((p) => p.name === benchName);
      if (preset) {
        aggregation[benchName] = {
          target: preset.target,
          actual: preset.actual,
          channels: preset.channels,
          other: preset.other
        };
      }
    }
  });

  // Time progress calculation for selected date
  const dateParts = selectedDate.split("-");
  const yr = parseInt(dateParts[0], 10) || 2026;
  const mo = parseInt(dateParts[1], 10) || 7;
  const currentDay = parseInt(dateParts[2], 10) || 1;
  const totalDays = new Date(yr, mo, 0).getDate();
  const timeProgressRatio = totalDays > 0 ? currentDay / totalDays : 1;
  const timeProgressPct = (timeProgressRatio * 100).toFixed(1);
  const remainingDays = Math.max(1, totalDays - currentDay + 1);

  // Convert to array and calculate metrics
  const majorsData = Object.entries(aggregation).map(([name, stats]) => {
    const rate = stats.target > 0 ? (stats.actual / stats.target) * 100 : 0;
    const gap = Math.max(0, stats.target - stats.actual);
    const surplus = Math.max(0, stats.actual - stats.target);

    // Alert check: actual < 80% of expected progress at current time point
    const expectedTargetAtDate = stats.target * timeProgressRatio;
    const expected80 = expectedTargetAtDate * 0.8;
    const isAlert = stats.target > 0 && stats.actual < expected80;

    // Shortfalls and daily requirement
    const shortfall80 = Math.max(0, Math.ceil(expected80 - stats.actual));
    const shortfall100 = Math.max(0, Math.ceil(stats.target - stats.actual));
    const dailyNeeded = Math.ceil(shortfall100 / remainingDays);

    return {
      name,
      target: stats.target,
      actual: stats.actual,
      rate,
      gap,
      surplus,
      isAlert,
      expectedTargetAtDate,
      expected80,
      shortfall80,
      shortfall100,
      dailyNeeded,
      channels: stats.channels,
      other: stats.other
    };
  });

  // Sort majors according to sortOption (when sorting by rate, sort strictly by rate)
  majorsData.sort((a, b) => {
    if (sortOption === "rate") return b.rate - a.rate;
    if (sortOption === "rate_asc") return a.rate - b.rate;
    if (a.isAlert !== b.isAlert) {
      return a.isAlert ? -1 : 1;
    }
    if (sortOption === "target") return b.target - a.target;
    if (sortOption === "actual") return b.actual - a.actual;
    if (sortOption === "gap") return b.gap - a.gap;
    if (sortOption === "name") return a.name.localeCompare(b.name, "zh");
    return b.rate - a.rate;
  });

  // Calculate highest and lowest completion rates for star & potential major identification
  const validTargetMajors = majorsData.filter((m) => m.target > 0);
  const maxRateVal = validTargetMajors.length > 0 ? Math.max(...validTargetMajors.map((m) => m.rate)) : 0;
  const minRateVal = validTargetMajors.length > 0 ? Math.min(...validTargetMajors.map((m) => m.rate)) : 0;

  // Global Dashboard Multi-Timeframe Metric Aggregation
  const allDatasetDates = Array.from(new Set(rows.map((r) => r.date))).sort();
  const currentMonthPrefix = selectedDate.substring(0, 7);
  let last7Dates = allDatasetDates;
  const currentSelectedDateIdx = allDatasetDates.indexOf(selectedDate);
  if (currentSelectedDateIdx !== -1) {
    last7Dates = allDatasetDates.slice(Math.max(0, currentSelectedDateIdx - 6), currentSelectedDateIdx + 1);
  } else {
    last7Dates = allDatasetDates.slice(Math.max(0, allDatasetDates.length - 7));
  }

  // Pre-aggregate data per major for: All-Time, Monthly, 7-Day, and Daily
  const allTimeAgg: {
    [name: string]: {
      allTimeTarget: number;
      allTimeActual: number;
      monthlyTarget: number;
      monthlyActual: number;
      weeklyTarget: number;
      weeklyActual: number;
      dailyTarget: number;
      dailyActual: number;
    };
  } = {};

  rows.forEach((row) => {
    if (!row.name) return;
    if (!allTimeAgg[row.name]) {
      allTimeAgg[row.name] = {
        allTimeTarget: 0,
        allTimeActual: 0,
        monthlyTarget: 0,
        monthlyActual: 0,
        weeklyTarget: 0,
        weeklyActual: 0,
        dailyTarget: 0,
        dailyActual: 0,
      };
    }

    let rowTarget = 0;
    let rowActual = 0;

    if (row.channels) {
      row.channels.forEach((c) => {
        rowTarget += Number(c.target) || 0;
        rowActual += Number(c.actual) || 0;
      });
    }

    const oVal = row.other;
    const oActual = typeof oVal === "number" ? oVal : (typeof oVal === "object" && oVal !== null && "actual" in oVal ? (oVal as { actual: number }).actual : 0);
    rowActual += Number(oActual) || 0;

    // All time
    allTimeAgg[row.name].allTimeTarget += rowTarget;
    allTimeAgg[row.name].allTimeActual += rowActual;

    // Monthly
    if (row.date.startsWith(currentMonthPrefix)) {
      allTimeAgg[row.name].monthlyTarget += rowTarget;
      allTimeAgg[row.name].monthlyActual += rowActual;
    }

    // Weekly (7 days)
    if (last7Dates.includes(row.date)) {
      allTimeAgg[row.name].weeklyTarget += rowTarget;
      allTimeAgg[row.name].weeklyActual += rowActual;
    }

    // Daily
    if (row.date === selectedDate) {
      allTimeAgg[row.name].dailyTarget += rowTarget;
      allTimeAgg[row.name].dailyActual += rowActual;
    }
  });

  // Include added preset benchmark majors into allTimeAgg if missing
  addedBenchmarkNames.forEach((benchName) => {
    if (!allTimeAgg[benchName]) {
      const preset = PRESET_BENCHMARK_MAJORS.find((p) => p.name === benchName);
      if (preset) {
        allTimeAgg[benchName] = {
          allTimeTarget: preset.target,
          allTimeActual: preset.actual,
          monthlyTarget: preset.target,
          monthlyActual: preset.actual,
          weeklyTarget: Math.round(preset.target * 0.3),
          weeklyActual: Math.round(preset.actual * 0.3),
          dailyTarget: Math.round(preset.target * 0.05),
          dailyActual: Math.round(preset.actual * 0.05),
        };
      }
    }
  });

  // Build rich multi-timeframe metric object for each major
  const globalDashboardCardsData = majorsData.map((m) => {
    const agg = allTimeAgg[m.name] || {
      allTimeTarget: m.target,
      allTimeActual: m.actual,
      monthlyTarget: m.target,
      monthlyActual: m.actual,
      weeklyTarget: m.target,
      weeklyActual: m.actual,
      dailyTarget: m.target,
      dailyActual: m.actual,
    };

    const allTimeTarget = agg.allTimeTarget > 0 ? agg.allTimeTarget : m.target;
    const allTimeActual = agg.allTimeActual;
    const allTimeRate = allTimeTarget > 0 ? (allTimeActual / allTimeTarget) * 100 : m.rate;

    const monthlyTarget = agg.monthlyTarget > 0 ? agg.monthlyTarget : m.target;
    const monthlyRate = monthlyTarget > 0 ? (agg.monthlyActual / monthlyTarget) * 100 : m.rate;

    const weeklyTarget = agg.weeklyTarget > 0 ? agg.weeklyTarget : Math.round(m.target * 0.3);
    const weeklyRate = weeklyTarget > 0 ? (agg.weeklyActual / weeklyTarget) * 100 : m.rate;

    const dailyTarget = agg.dailyTarget > 0 ? agg.dailyTarget : Math.round(m.target * 0.05);
    const dailyRate = dailyTarget > 0 ? (agg.dailyActual / dailyTarget) * 100 : m.rate;

    const rateDimensions = [allTimeRate, monthlyRate, weeklyRate, dailyRate];
    const minRate = Math.min(...rateDimensions);
    const maxRate = Math.max(...rateDimensions);
    const timeSpread = maxRate - minRate; // 时域极差

    return {
      ...m,
      allTimeTarget,
      allTimeActual,
      allTimeRate,
      monthlyActual: agg.monthlyActual,
      monthlyTarget,
      monthlyRate,
      weeklyActual: agg.weeklyActual,
      weeklyTarget,
      weeklyRate,
      dailyActual: agg.dailyActual,
      dailyTarget,
      dailyRate,
      timeSpread,
      allTimeGap: Math.max(0, allTimeTarget - allTimeActual),
    };
  });

  // Calculate overall campus benchmark rate
  const campusAllTimeAvgRate =
    globalDashboardCardsData.length > 0
      ? globalDashboardCardsData.reduce((sum, item) => sum + item.allTimeRate, 0) / globalDashboardCardsData.length
      : 0;

  // Find reference benchmark rate for focus major or campus avg
  const focusMajorObj = globalDashboardCardsData.find((d) => d.name === dashboardFocusMajor);
  const benchmarkRefRate = focusMajorObj ? focusMajorObj.allTimeRate : campusAllTimeAvgRate;
  const focusMajorLabel = focusMajorObj ? `【${focusMajorObj.name}】(${focusMajorObj.allTimeRate.toFixed(1)}%)` : `全校均值 (${campusAllTimeAvgRate.toFixed(1)}%)`;

  // Attach focus delta and variance classification
  const globalCardsWithVariance = globalDashboardCardsData.map((card) => {
    const rateDeltaFromFocus = card.allTimeRate - benchmarkRefRate;
    const absDelta = Math.abs(rateDeltaFromFocus);
    const isHighVariance = absDelta >= 5 || card.timeSpread >= 12;

    let varianceTagText = "平稳运行";
    let varianceSeverity: "normal" | "warning" | "critical" | "surplus" | "top" = "normal";

    if (card.allTimeRate >= 100) {
      varianceTagText = "全时域已爆单标杆";
      varianceSeverity = "top";
    } else if (rateDeltaFromFocus <= -10 || card.allTimeRate < 50) {
      varianceTagText = "全时域严重滞后预警";
      varianceSeverity = "critical";
    } else if (rateDeltaFromFocus < 0) {
      varianceTagText = "全时域偏离滞后";
      varianceSeverity = "warning";
    } else if (rateDeltaFromFocus >= 10) {
      varianceTagText = "全时域领跑超额";
      varianceSeverity = "surplus";
    } else if (card.timeSpread >= 15) {
      varianceTagText = "高频振荡/时域不均";
      varianceSeverity = "warning";
    }

    return {
      ...card,
      rateDeltaFromFocus,
      absDelta,
      isHighVariance,
      varianceTagText,
      varianceSeverity,
    };
  });

  // Filter cards based on dashboardFilterMode
  let filteredDashboardCards = globalCardsWithVariance;
  if (dashboardFilterMode === "high_variance") {
    const highVar = globalCardsWithVariance.filter((c) => c.isHighVariance);
    filteredDashboardCards = highVar.length > 0 ? highVar : globalCardsWithVariance;
  } else if (dashboardFilterMode === "alert") {
    filteredDashboardCards = globalCardsWithVariance.filter((c) => c.allTimeRate < 80 || c.rateDeltaFromFocus < -5);
  }

  // Sort cards based on dashboardSortMode
  filteredDashboardCards.sort((a, b) => {
    if (dashboardSortMode === "variance") return b.absDelta - a.absDelta;
    if (dashboardSortMode === "allTimeRate") return b.allTimeRate - a.allTimeRate;
    if (dashboardSortMode === "gap") return b.allTimeGap - a.allTimeGap;
    return b.absDelta - a.absDelta;
  });

  // Benchmark Suggestions List combining active majors and preset benchmark majors
  const allAvailableBenchmarks = [
    ...majorsData.map((m) => ({
      name: m.name,
      category: "表内现有专业" as const,
      target: m.target,
      actual: m.actual,
      channels: m.channels,
      other: m.other,
      description: `主表中录入的现存专业，实时完成率 ${m.rate.toFixed(1)}%`
    })),
    ...PRESET_BENCHMARK_MAJORS.filter((p) => !majorsData.some((m) => m.name === p.name))
  ];

  const filteredBenchmarks = allAvailableBenchmarks.filter((b) => {
    const matchesCategory =
      selectedBenchmarkCategory === "全部" || b.category === selectedBenchmarkCategory;
    const matchesSearch =
      !benchmarkSearch ||
      b.name.toLowerCase().includes(benchmarkSearch.toLowerCase()) ||
      b.category.toLowerCase().includes(benchmarkSearch.toLowerCase()) ||
      b.description.toLowerCase().includes(benchmarkSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Modal Candidates Filter
  const filteredModalCandidates = allAvailableBenchmarks.filter((b) => {
    const matchesCat = modalCategory === "全部" || b.category === modalCategory;
    const matchesKeyword =
      !modalSearchKeyword ||
      b.name.toLowerCase().includes(modalSearchKeyword.toLowerCase()) ||
      b.category.toLowerCase().includes(modalSearchKeyword.toLowerCase()) ||
      b.description.toLowerCase().includes(modalSearchKeyword.toLowerCase());
    return matchesCat && matchesKeyword;
  });

  // Modal Selection Handler (Auto Refreshes Dual View)
  const handleConfirmSelectModalMajor = (majorName: string, targetPos: "A" | "B" = "B") => {
    const isPreset = PRESET_BENCHMARK_MAJORS.some((p) => p.name === majorName);
    if (isPreset) {
      setAddedBenchmarkNames((prev) => Array.from(new Set([...prev, majorName])));
    }

    if (targetPos === "A") {
      setDualMajorA(majorName);
    } else {
      setDualMajorB(majorName);
    }

    setShowSearchSelectModal(false);
    setToastMsg(`已成功自动加载并选定【${majorName}】为专业 ${targetPos}，双列对比视图已自动刷新！`);
  };

  // Function to handle choosing a benchmark major
  const handleSelectBenchmarkMajor = (bench: { name: string; target: number; actual: number; channels: Array<{ target: number; actual: number }>; other: { target: number; actual: number } }, targetPos: "A" | "B" = "B") => {
    if (!aggregation[bench.name]) {
      setAddedBenchmarkNames((prev) => Array.from(new Set([...prev, bench.name])));
    }

    if (targetPos === "A") {
      setDualMajorA(bench.name);
    } else {
      setDualMajorB(bench.name);
    }

    setToastMsg(`已成功将【${bench.name}】设为对比专业 ${targetPos}！`);
  };

  // Handler for switching to dual layout mode
  const handleSwitchToDualMode = () => {
    setLayoutViewMode("dual");

    let nextA = dualMajorA;
    let nextB = dualMajorB;

    // Prioritize saved pair if present in localStorage
    if (savedPair && savedPair.majorA && savedPair.majorB) {
      nextA = savedPair.majorA;
      nextB = savedPair.majorB;
      setDualMajorA(savedPair.majorA);
      setDualMajorB(savedPair.majorB);

      const presetNames = PRESET_BENCHMARK_MAJORS.map((m) => m.name);
      const needed = [savedPair.majorA, savedPair.majorB].filter((n) => presetNames.includes(n));
      if (needed.length > 0) {
        setAddedBenchmarkNames((prev) => Array.from(new Set([...prev, ...needed])));
      }
      setToastMsg(`已为您优先加载记忆的对比组合：【${savedPair.majorA} VS ${savedPair.majorB}】`);
    } else {
      if (!nextA && majorsData[0]) nextA = majorsData[0].name;
      if (!nextB && majorsData[1]) nextB = majorsData[1].name || majorsData[0].name;
      if (nextA) setDualMajorA(nextA);
      if (nextB) setDualMajorB(nextB);
    }

    // Auto open benchmark suggestions sidebar if only 1 major visible in majorsData
    if (majorsData.length <= 1) {
      setShowBenchmarkSidebar(true);
      setToastMsg("检测到当前主表中仅有 1 个专业，已自动开启【侧边检索与标杆建议库】，引导您选择第二个可对比专业！");
    }
  };

  // Helper to set a major as dual comparison target A or B and switch layout
  const handleSetMajorAsDualPos = (majorName: string, targetPos: "A" | "B") => {
    if (targetPos === "A") {
      setDualMajorA(majorName);
    } else {
      setDualMajorB(majorName);
    }
    setLayoutViewMode("dual");
    setToastMsg(`已成功将【${majorName}】设置为对比专业 ${targetPos}，并自动跳转至双列对比视图！`);
  };

  // Quick Fix Handler
  const handleApplyQuickFix = (majorName: string, fixType: "other" | "channels", overrideVal?: number) => {
    const majorStats = majorsData.find((m) => m.name === majorName);
    if (!majorStats) return;

    const fillVal = typeof overrideVal === "number" && overrideVal > 0 
      ? overrideVal 
      : (customFixAmount[majorName] ?? (majorStats.shortfall80 > 0 ? majorStats.shortfall80 : majorStats.dailyNeeded));

    if (fillVal <= 0) return;

    if (!onUpdateRows) {
      setToastMsg(`为【${majorName}】计算所需补发增量为 ${fillVal} 人`);
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }

    const updatedRows = [...rows];
    let rIdx = updatedRows.findIndex((r) => r.name === majorName && r.date === selectedDate);

    if (rIdx === -1) {
      const newRow: RowData = {
        id: `quickfix-${majorName}-${selectedDate}-${Date.now()}`,
        seq: updatedRows.length + 1,
        name: majorName,
        date: selectedDate,
        channels: Array.from({ length: 7 }, () => ({ target: 0, actual: 0 })),
        other: 0,
        note: `[快速修正] 补充进度`
      };
      updatedRows.push(newRow);
      rIdx = updatedRows.length - 1;
    }

    const targetRow = { ...updatedRows[rIdx] };

    if (fixType === "other") {
      const curOther = typeof targetRow.other === "number" ? targetRow.other : Number(targetRow.other) || 0;
      targetRow.other = curOther + fillVal;
      targetRow.note = (targetRow.note ? `${targetRow.note}; ` : "") + `[快速修正] 补充${fillVal}人至其他人员/补录`;
    } else if (fixType === "channels") {
      const perChannel = Math.floor(fillVal / 7);
      let rem = fillVal % 7;
      targetRow.channels = targetRow.channels.map((ch, cIdx) => ({
        ...ch,
        actual: (ch.actual || 0) + perChannel + (cIdx < rem ? 1 : 0)
      }));
      targetRow.note = (targetRow.note ? `${targetRow.note}; ` : "") + `[快速修正] 7大渠道共补齐${fillVal}人`;
    }

    updatedRows[rIdx] = targetRow;
    onUpdateRows(updatedRows);
    setQuickFixMajor(null);
    setToastMsg(`🎉 已成功为【${majorName}】追平 ${fillVal} 人并填充至表格！`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Summary counts
  const metCount = majorsData.filter((d) => d.actual >= d.target && d.target > 0).length;
  const inProgressCount = majorsData.filter((d) => d.rate >= 50 && d.rate < 100).length;
  const criticalCount = majorsData.filter((d) => d.rate < 50 && d.target > 0).length;
  const overallAvgRate = majorsData.length > 0 
    ? majorsData.reduce((acc, curr) => acc + curr.rate, 0) / majorsData.length 
    : 0;

  // Maximum scale boundary for micro bar chart widths
  const maxScaleVal = majorsData.length > 0 
    ? Math.max(...majorsData.map((d) => Math.max(d.target, d.actual)), 1) 
    : 1;

  // Compute 7-day completion rate trend for a given major
  const get7DayTrendForMajor = (majorName: string) => {
    const allDates = Array.from(new Set(rows.map((r) => r.date))).sort();
    let endDateIndex = allDates.indexOf(selectedDate);
    if (endDateIndex === -1) endDateIndex = allDates.length - 1;
    const last7Dates = allDates.slice(Math.max(0, endDateIndex - 6), endDateIndex + 1);

    return last7Dates.map((d) => {
      const dayRows = rows.filter((r) => r.date === d && r.name === majorName);
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
      const rate = target > 0 ? (actual / target) * 100 : 0;
      const shortDate = d.length >= 5 ? d.substring(5) : d;
      return { date: d, shortDate, target, actual, rate };
    });
  };

  const defaultShowCount = 5;
  const displayedMajors = isExpanded ? majorsData : majorsData.slice(0, defaultShowCount);

  // Toggle major selection for compare mode
  const handleToggleMajorSelection = (majorName: string) => {
    if (selectedCompareMajors.includes(majorName)) {
      setSelectedCompareMajors(selectedCompareMajors.filter((m) => m !== majorName));
    } else {
      if (selectedCompareMajors.length >= 2) {
        // Replace second item or keep max 2
        const updated = [selectedCompareMajors[1], majorName];
        setSelectedCompareMajors(updated);
        if (updated.length === 2) {
          setShowCompareDrawer(true);
        }
      } else {
        const updated = [...selectedCompareMajors, majorName];
        setSelectedCompareMajors(updated);
        if (updated.length === 2) {
          setShowCompareDrawer(true);
        }
      }
    }
  };

  // Get data objects for the two selected compare majors
  const majorA = majorsData.find((m) => m.name === selectedCompareMajors[0]);
  const majorB = majorsData.find((m) => m.name === selectedCompareMajors[1]);

  return (
    <div className={`border rounded-xl p-3 transition-all duration-200 shadow-xs ${
      isDarkMode ? "bg-slate-950/80 border-slate-800" : "bg-white border-slate-150"
    }`}>
      {/* Collapsible Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-left flex-1 min-w-0 cursor-pointer group/title"
        >
          <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
            isDarkMode ? "bg-emerald-500/10 text-emerald-400 group-hover/title:bg-emerald-500/20" : "bg-emerald-50 text-emerald-600 group-hover/title:bg-emerald-100"
          }`}>
            <Target className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className={`text-xs font-bold tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
                专业进度总览
              </h3>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                {majorsData.length} 专业
              </span>
            </div>
            <p className="text-[9px] text-slate-400 truncate mt-0.5">
              极简「计划 vs 实际」微趋势 · 支持渠道PK对比
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDarkMode ? "hover:bg-slate-900 text-slate-400" : "hover:bg-slate-100 text-slate-500"
            }`}
            title={isOpen ? "折叠面板" : "展开面板"}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="overview-main-content-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden pt-3 space-y-2.5"
          >
            {/* Quick Health Summary Grid */}
            <div className={`p-2 rounded-lg border flex items-center justify-between text-[9px] font-mono font-bold ${
              isDarkMode ? "bg-slate-900/60 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200/80 text-slate-700"
            }`}>
              <div className="flex items-center gap-1 text-emerald-500" title="达成率 ≥ 100%">
                <CheckCircle2 className="w-3 h-3" />
                <span>达标: {metCount}</span>
              </div>
              <div className="flex items-center gap-1 text-amber-500" title="50% ≤ 达成率 < 100%">
                <Activity className="w-3 h-3" />
                <span>冲刺: {inProgressCount}</span>
              </div>
              <div className="flex items-center gap-1 text-rose-500" title="达成率 < 50%">
                <AlertTriangle className="w-3 h-3" />
                <span>预警: {criticalCount}</span>
              </div>
              <div className="border-l pl-2 dark:border-slate-800 border-slate-300 text-indigo-500 dark:text-indigo-400">
                均: {overallAvgRate.toFixed(0)}%
              </div>
            </div>

            {/* Compare Mode Toggle Bar */}
            <div className={`p-1.5 rounded-lg border flex items-center justify-between gap-2 transition-all ${
              isCompareMode
                ? (isDarkMode ? "bg-indigo-950/40 border-indigo-800/80" : "bg-indigo-50/80 border-indigo-200")
                : (isDarkMode ? "bg-slate-900/40 border-slate-800/80" : "bg-slate-50/80 border-slate-200/80")
            }`}>
              <div className="flex items-center gap-1.5">
                <Scale className={`w-3.5 h-3.5 ${isCompareMode ? "text-indigo-500 animate-pulse" : "text-slate-400"}`} />
                <span className={`text-[10px] font-bold ${
                  isCompareMode 
                    ? (isDarkMode ? "text-indigo-300" : "text-indigo-900")
                    : (isDarkMode ? "text-slate-300" : "text-slate-700")
                }`}>
                  对比模式
                </span>
                {isCompareMode && (
                  <span className="text-[8px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-indigo-500/20 text-indigo-500 dark:text-indigo-300">
                    已选 {selectedCompareMajors.length}/2
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {isCompareMode && selectedCompareMajors.length === 2 && (
                  <button
                    type="button"
                    onClick={() => setShowCompareDrawer(true)}
                    className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                  >
                    <ArrowLeftRight className="w-2.5 h-2.5" />
                    <span>查看PK</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const nextMode = !isCompareMode;
                    setIsCompareMode(nextMode);
                    if (!nextMode) {
                      setSelectedCompareMajors([]);
                      setShowCompareDrawer(false);
                    }
                  }}
                  className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isCompareMode ? "bg-indigo-600" : (isDarkMode ? "bg-slate-800" : "bg-slate-300")
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isCompareMode ? "translate-x-3" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* View Layout Switcher & Sort Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 text-[9px] pt-0.5">
              {/* Layout Mode Segmented Toggle */}
              <div className={`flex p-0.5 rounded-lg border ${
                isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"
              }`}>
                <button
                  type="button"
                  onClick={() => setLayoutViewMode("standard")}
                  className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-all flex items-center gap-1 ${
                    layoutViewMode === "standard"
                      ? (isDarkMode ? "bg-indigo-600 text-white shadow-2xs" : "bg-white text-indigo-700 shadow-2xs")
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                >
                  <LayoutGrid className="w-2.5 h-2.5" />
                  <span>标准列表</span>
                </button>
                <button
                  type="button"
                  onClick={handleSwitchToDualMode}
                  className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-all flex items-center gap-1 ${
                    layoutViewMode === "dual"
                      ? (isDarkMode ? "bg-indigo-600 text-white shadow-2xs" : "bg-white text-indigo-700 shadow-2xs")
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                >
                  <Columns className="w-2.5 h-2.5" />
                  <span>双列对比视图</span>
                </button>
              </div>

              {/* Global Dashboard Toggle Button */}
              <button
                type="button"
                onClick={() => setShowGlobalDashboard(!showGlobalDashboard)}
                className={`px-2.5 py-1 text-[9.5px] font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                  showGlobalDashboard
                    ? "bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 text-white border-amber-400 shadow-xs ring-2 ring-amber-400/30"
                    : (isDarkMode ? "bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700" : "bg-amber-50/80 border-amber-200 text-amber-800 hover:bg-amber-100 shadow-2xs")
                }`}
                title="一键对比选定专业在所有时间维度下的总完成率，卡片展示高差异专业"
              >
                <Gauge className={`w-3 h-3 ${showGlobalDashboard ? "animate-pulse text-amber-200" : "text-amber-500"}`} />
                <span>全时域仪表盘</span>
                <span className={`text-[8px] px-1.5 py-0.2 rounded font-mono font-extrabold ${
                  showGlobalDashboard ? "bg-white/20 text-white" : "bg-amber-500/15 text-amber-600 dark:text-amber-300"
                }`}>
                  {showGlobalDashboard ? "已开启" : "一键对比"}
                </span>
              </button>

              {/* Time Progress Baseline Indicator Pill */}
              <div className={`px-2.5 py-1 text-[9.5px] font-bold rounded-lg border flex items-center gap-1.5 font-mono ${
                isDarkMode 
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-300" 
                  : "bg-amber-50 border-amber-200 text-amber-800 shadow-2xs"
              }`} title={`基准参考线：根据当前日期(${selectedDate})对应的预期时间完成比例 (${timeProgressPct}%)`}>
                <Clock className="w-3 h-3 text-amber-500" />
                <span>时间基准: <strong className="font-extrabold text-amber-600 dark:text-amber-400">{timeProgressPct}%</strong></span>
                <span className="text-[8px] opacity-75 font-normal">({currentDay}/{totalDays}天)</span>
              </div>

              {/* Customizable Warning Threshold Configuration Button */}
              <button
                type="button"
                onClick={() => {
                  setTempYellow(yellowThreshold);
                  setTempRed(redThreshold);
                  setShowThresholdModal(true);
                }}
                className={`px-2.5 py-1 text-[9.5px] font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  yellowThreshold !== 30 || redThreshold !== 10
                    ? "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white border-amber-400 shadow-xs ring-2 ring-amber-400/30"
                    : (isDarkMode ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs")
                }`}
                title="自定义配置黄色警告与红色报警的达成率百分比阈值"
              >
                <SlidersHorizontal className={`w-3 h-3 ${yellowThreshold !== 30 || redThreshold !== 10 ? "text-amber-200 animate-pulse" : "text-amber-500"}`} />
                <span>预警阈值配置</span>
                <span className={`text-[8px] px-1.5 py-0.2 rounded font-mono font-extrabold ${
                  yellowThreshold !== 30 || redThreshold !== 10 ? "bg-white/20 text-white" : "bg-amber-500/15 text-amber-600 dark:text-amber-300"
                }`}>
                  ⚠️&lt;{yellowThreshold}% | 🚨&lt;{redThreshold}%
                </span>
              </button>

              {/* Heatmap Mode Toggle Button */}
              <button
                type="button"
                onClick={() => setIsHeatmapMode(!isHeatmapMode)}
                className={`px-2.5 py-1 text-[9.5px] font-extrabold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isHeatmapMode
                    ? "bg-gradient-to-r from-red-500 via-amber-500 to-emerald-600 text-white border-amber-400 shadow-xs ring-2 ring-amber-400/30"
                    : (isDarkMode ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs")
                }`}
                title="开启/关闭热力图模式：通过改变柱状卡片背景色直观展示各专业达成率密集度，达成率越高颜色越深"
              >
                <Flame className={`w-3 h-3 ${isHeatmapMode ? "text-amber-200 animate-pulse" : "text-amber-500"}`} />
                <span>热力图模式</span>
                <span className={`text-[8px] px-1.5 py-0.2 rounded font-mono font-extrabold ${
                  isHeatmapMode ? "bg-white/20 text-white" : "bg-amber-500/15 text-amber-600 dark:text-amber-300"
                }`}>
                  {isHeatmapMode ? "已开启" : "关闭"}
                </span>
              </button>

              {/* One-click Toggle Switch for Rate Descending */}
              {layoutViewMode === "standard" && (
                <button
                  type="button"
                  onClick={() => {
                    if (sortOption === "rate") {
                      setSortOption("rate_asc");
                    } else {
                      setSortOption("rate");
                    }
                  }}
                  className={`px-2.5 py-1 text-[9.5px] font-extrabold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    sortOption === "rate"
                      ? "bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-600 text-white border-amber-400 shadow-xs ring-2 ring-amber-400/30"
                      : sortOption === "rate_asc"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-xs ring-2 ring-indigo-400/30"
                      : (isDarkMode ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs")
                  }`}
                  title="一键开关：按达成率降序/升序排列，快速锁定明星专业 (榜首) 和潜力待挖掘专业 (榜尾)"
                >
                  <Flame className={`w-3 h-3 ${sortOption === "rate" ? "text-amber-200 animate-bounce" : "text-amber-500"}`} />
                  <span>{sortOption === "rate" ? "达成率降序 (已开启)" : sortOption === "rate_asc" ? "达成率升序 (已开启)" : "按达成率降序"}</span>
                  {/* Switch Pill Graphic */}
                  <div className={`w-6 h-3.5 rounded-full p-0.5 transition-colors relative flex items-center shrink-0 ${
                    sortOption === "rate" ? "bg-emerald-400" : sortOption === "rate_asc" ? "bg-indigo-400" : (isDarkMode ? "bg-slate-700" : "bg-slate-300")
                  }`}>
                    <div className={`w-2.5 h-2.5 rounded-full bg-white shadow-md transition-transform transform ${
                      sortOption === "rate" ? "translate-x-2.5" : sortOption === "rate_asc" ? "translate-x-2.5 opacity-90" : "translate-x-0"
                    }`} />
                  </div>
                </button>
              )}

              {/* Sort Filter Select Dropdown (Only in standard mode) */}
              {layoutViewMode === "standard" && (
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-medium flex items-center gap-1 text-xs">
                    <Filter className="w-3 h-3 text-slate-400" />
                    排序:
                  </span>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className={`px-2 py-1 rounded-lg border font-bold text-xs cursor-pointer outline-none transition-all ${
                      isDarkMode 
                        ? "bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700" 
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white shadow-2xs"
                    }`}
                  >
                    <option value="rate" className={isDarkMode ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>按达成率 (高到低 - 明星/潜力)</option>
                    <option value="rate_asc" className={isDarkMode ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>按达成率 (低到高 - 潜力/明星)</option>
                    <option value="target" className={isDarkMode ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>按计划人数 (高到低)</option>
                    <option value="actual" className={isDarkMode ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>按实际人数 (高到低)</option>
                    <option value="gap" className={isDarkMode ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>按缺口数 (高到低)</option>
                    <option value="name" className={isDarkMode ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>按专业名称 (A-Z)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Global Multi-Timeframe Multi-Dimension Dashboard */}
            <AnimatePresence>
              {showGlobalDashboard && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className={`p-4 rounded-2xl border space-y-4 shadow-xl transition-all ${
                    isDarkMode
                      ? "bg-slate-900/95 border-amber-500/40 text-slate-100 ring-1 ring-amber-500/20"
                      : "bg-white border-amber-300 text-slate-900 shadow-md"
                  }`}
                >
                  {/* Dashboard Top Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 border-current/15">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 via-indigo-600 to-purple-600 text-white shadow-md">
                        <Gauge className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                          <span>全时域跨维度完成率对比仪表盘</span>
                          <span className="text-[9.5px] px-2 py-0.5 rounded-full font-mono font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-400/40 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            全维度视角
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                          一键对比选定专业在所有时间维度 (累计总达成率 / 当月 / 近7日 / 单日) 下的完成率，高偏离差异专业醒目高亮展示
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Baseline Focus Selector */}
                      <div className="flex items-center gap-1.5 text-xs font-extrabold">
                        <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0">对比基准:</span>
                        <select
                          value={dashboardFocusMajor}
                          onChange={(e) => setDashboardFocusMajor(e.target.value)}
                          className={`text-xs font-extrabold p-1.5 rounded-lg border outline-none transition-all cursor-pointer ${
                            isDarkMode
                              ? "bg-slate-950 border-slate-700 text-amber-300 focus:border-amber-500"
                              : "bg-amber-50/90 border-amber-300 text-amber-900 focus:border-amber-500 shadow-2xs"
                          }`}
                        >
                          <option value="ALL">全校所有专业均值 ({campusAllTimeAvgRate.toFixed(1)}%)</option>
                          {majorsData.map((m, idx) => (
                            <option key={`dash-opt-${m.name}-${idx}`} value={m.name}>
                              【{m.name}】 ({m.rate.toFixed(1)}%)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filter Mode Pills */}
                      <div className={`flex p-0.5 rounded-lg border text-[10px] font-bold ${
                        isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
                      }`}>
                        <button
                          type="button"
                          onClick={() => setDashboardFilterMode("high_variance")}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            dashboardFilterMode === "high_variance"
                              ? "bg-amber-500 text-white font-extrabold shadow-xs"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          高差异专业 ({globalCardsWithVariance.filter(c => c.isHighVariance).length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setDashboardFilterMode("alert")}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            dashboardFilterMode === "alert"
                              ? "bg-rose-600 text-white font-extrabold shadow-xs"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          预警/滞后 (&lt; 80%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDashboardFilterMode("all")}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            dashboardFilterMode === "all"
                              ? "bg-indigo-600 text-white font-extrabold shadow-xs"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          全部专业 ({globalCardsWithVariance.length})
                        </button>
                      </div>

                      {/* Close button */}
                      <button
                        type="button"
                        onClick={() => setShowGlobalDashboard(false)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        title="关闭全局仪表盘"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* KPI Stats Bar */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center font-mono text-xs">
                    <div className={`p-2.5 rounded-xl border ${isDarkMode ? "bg-black/20 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                      <span className="text-[10px] text-slate-400 block">基准参考视角</span>
                      <strong className="text-amber-600 dark:text-amber-400 font-extrabold text-xs truncate block">
                        {focusMajorLabel}
                      </strong>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${isDarkMode ? "bg-black/20 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                      <span className="text-[10px] text-slate-400 block">偏离差异幅度 ≥5% 专业</span>
                      <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">
                        {globalCardsWithVariance.filter(c => c.isHighVariance).length} / {globalCardsWithVariance.length} 个
                      </strong>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${isDarkMode ? "bg-black/20 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                      <span className="text-[10px] text-slate-400 block">平均跨时域波动极差</span>
                      <strong className="text-purple-600 dark:text-purple-400 font-extrabold text-sm">
                        {(globalCardsWithVariance.reduce((s, c) => s + c.timeSpread, 0) / Math.max(1, globalCardsWithVariance.length)).toFixed(1)}%
                      </strong>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${isDarkMode ? "bg-black/20 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                      <span className="text-[10px] text-slate-400 block">显示列表卡片数量</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                        {filteredDashboardCards.length} 个专业卡片
                      </strong>
                    </div>
                  </div>

                  {/* Prominent High-Contrast Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    {filteredDashboardCards.map((card, idx) => {
                      const deltaVal = card.rateDeltaFromFocus;
                      const isPositive = deltaVal >= 0;

                      let cardBorderClass = isDarkMode ? "border-slate-800 bg-slate-950/80" : "border-slate-200 bg-white";
                      if (card.varianceSeverity === "critical") {
                        cardBorderClass = isDarkMode ? "border-rose-500/60 bg-rose-950/20 ring-1 ring-rose-500/30" : "border-rose-300 bg-rose-50/60 shadow-sm";
                      } else if (card.varianceSeverity === "surplus" || card.varianceSeverity === "top") {
                        cardBorderClass = isDarkMode ? "border-indigo-500/60 bg-indigo-950/20 ring-1 ring-indigo-500/30" : "border-indigo-300 bg-indigo-50/60 shadow-sm";
                      } else if (card.varianceSeverity === "warning") {
                        cardBorderClass = isDarkMode ? "border-amber-500/60 bg-amber-950/20 ring-1 ring-amber-500/30" : "border-amber-300 bg-amber-50/60 shadow-sm";
                      }

                      return (
                        <div
                          key={`dash-card-${card.name}-${idx}`}
                          className={`p-3.5 rounded-2xl border transition-all hover:shadow-md space-y-3 relative overflow-hidden ${cardBorderClass}`}
                        >
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-2 border-b pb-2 border-current/10">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                                  【{card.name}】
                                </span>
                                <span className={`text-[8.5px] px-1.5 py-0.2 rounded-full font-bold ${
                                  card.varianceSeverity === "critical"
                                    ? "bg-rose-500 text-white"
                                    : card.varianceSeverity === "warning"
                                    ? "bg-amber-500 text-white"
                                    : card.varianceSeverity === "surplus"
                                    ? "bg-indigo-600 text-white"
                                    : card.varianceSeverity === "top"
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                }`}>
                                  {card.varianceTagText}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-1">
                                <span>目标: {card.allTimeTarget}人</span>
                                <span>实际: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{card.allTimeActual}人</strong></span>
                                {card.allTimeGap > 0 ? (
                                  <span className="text-amber-600 dark:text-amber-400 font-bold">缺 {card.allTimeGap}人</span>
                                ) : (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">达标</span>
                                )}
                              </div>
                            </div>

                            {/* Delta Badge */}
                            <div className={`px-2 py-1 rounded-xl text-right font-mono border ${
                              isPositive
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-300"
                                : "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-300"
                            }`}>
                              <div className="text-[9px] text-slate-400 font-sans">较基准偏离</div>
                              <strong className="text-xs font-extrabold">
                                {isPositive ? `+${deltaVal.toFixed(1)}%` : `${deltaVal.toFixed(1)}%`}
                              </strong>
                            </div>
                          </div>

                          {/* Progress Bar (Clickable) */}
                          <div
                            onClick={() => setDetailModalMajor(card.name)}
                            className="space-y-1 cursor-pointer group"
                            title={`点击查看【${card.name}】全渠道详细数据统计与趋势分析`}
                          >
                            <div className="flex items-center justify-between text-[9px] font-mono">
                              <span className="text-slate-400 group-hover:text-indigo-500 transition-colors flex items-center gap-1">
                                <Maximize2 className="w-2.5 h-2.5" />
                                总完成率进度条 (点击展开渠道与趋势)
                              </span>
                              <div className="flex items-center gap-1.5">
                                {card.allTimeRate < redThreshold ? (
                                  <div className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-rose-500/15 border border-rose-500/30 text-rose-500 font-bold text-[8.5px] animate-pulse" title={`达成率低于${redThreshold}% (当前${card.allTimeRate.toFixed(1)}%)：红色报警`}>
                                    <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                                    <span>低于{redThreshold}% 红色报警</span>
                                  </div>
                                ) : card.allTimeRate < yellowThreshold ? (
                                  <div className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-500 font-bold text-[8.5px]" title={`达成率低于${yellowThreshold}% (当前${card.allTimeRate.toFixed(1)}%)：黄色警告`}>
                                    <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                                    <span>低于{yellowThreshold}% 黄色警告</span>
                                  </div>
                                ) : null}
                                <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                                  {card.allTimeRate.toFixed(1)}%
                                </strong>
                              </div>
                            </div>
                            <div className="relative h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden group-hover:ring-2 group-hover:ring-indigo-500/50 transition-all">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500"
                                style={{ width: `${Math.min(100, card.allTimeRate)}%` }}
                              />
                            </div>

                            {/* 柱状图正下方 红色三角形标志与波动/临界值自动提示 */}
                            {(() => {
                              const cardAlert = getMajorAlertStatus(card.name, rows, selectedDate, card.allTimeRate, Number(timeProgressPct) || 50);
                              if (!cardAlert.hasAlert) return null;
                              return (
                                <div 
                                  className="flex items-center gap-1.5 mt-1 px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-[8.5px] font-mono animate-pulse hover:animate-none transition-all cursor-help"
                                  title={`【24小时波动/临界值预警提示】\n${cardAlert.alertReason}`}
                                >
                                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[7px] border-b-rose-500 shrink-0 shadow-xs" />
                                  <span className="truncate">【预警提示】{cardAlert.alertReason}</span>
                                </div>
                              );
                            })()}
                          </div>

                          {/* 4 Multi-Timeframe Rate Dimensions Grid */}
                          <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
                            <div className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10">
                              <span className="text-[8px] text-slate-400 block">全时域总达成率</span>
                              <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold text-[11px]">
                                {card.allTimeRate.toFixed(1)}%
                              </strong>
                              <span className="text-[7.5px] text-slate-500 block">({card.allTimeActual}/{card.allTimeTarget}人)</span>
                            </div>

                            <div className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10">
                              <span className="text-[8px] text-slate-400 block">当月达成率</span>
                              <strong className="text-purple-600 dark:text-purple-400 font-extrabold text-[11px]">
                                {card.monthlyRate.toFixed(1)}%
                              </strong>
                              <span className="text-[7.5px] text-slate-500 block">({card.monthlyActual}/{card.monthlyTarget}人)</span>
                            </div>

                            <div className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10">
                              <span className="text-[8px] text-slate-400 block">近7日达成率</span>
                              <strong className="text-cyan-600 dark:text-cyan-400 font-extrabold text-[11px]">
                                {card.weeklyRate.toFixed(1)}%
                              </strong>
                              <span className="text-[7.5px] text-slate-500 block">({card.weeklyActual}/{card.weeklyTarget}人)</span>
                            </div>

                            <div className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10">
                              <span className="text-[8px] text-slate-400 block">单日达成率</span>
                              <strong className="text-amber-600 dark:text-amber-400 font-extrabold text-[11px]">
                                {card.dailyRate.toFixed(1)}%
                              </strong>
                              <span className="text-[7.5px] text-slate-500 block">({card.dailyActual}/{card.dailyTarget}人)</span>
                            </div>
                          </div>

                          {/* Time Spread Indicator */}
                          <div className="flex items-center justify-between text-[8.5px] font-mono pt-1 border-t border-current/10 text-slate-500">
                            <span>跨时域极大/小极差:</span>
                            <span className={`font-bold ${card.timeSpread >= 15 ? "text-rose-500" : "text-emerald-500"}`}>
                              波动 ±{card.timeSpread.toFixed(1)}%
                            </span>
                          </div>

                          {/* Card Action Buttons */}
                          <div className="grid grid-cols-3 gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() => handleSetMajorAsDualPos(card.name, "A")}
                              className="py-1 px-1 text-[8px] font-extrabold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer truncate"
                              title="设为双列对比专业 A"
                            >
                              设为专业 A
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetMajorAsDualPos(card.name, "B")}
                              className="py-1 px-1 text-[8px] font-extrabold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer truncate"
                              title="设为双列对比专业 B"
                            >
                              设为专业 B
                            </button>
                            <button
                              type="button"
                              onClick={() => setSimulationMajor(card.name)}
                              className="py-1 px-1 text-[8px] font-extrabold rounded-lg bg-amber-500 hover:bg-amber-400 text-white transition-all cursor-pointer flex items-center justify-center gap-0.5 truncate"
                              title="开启专业招生盈亏与加权测算模拟"
                            >
                              <Calculator className="w-2.5 h-2.5 shrink-0" />
                              <span>盈亏模拟</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main View Container: Dual Column Comparison View vs Standard Card List */}
            {layoutViewMode === "dual" ? (() => {
              const activeA = majorsData.find((m) => m.name === (dualMajorA || majorsData[0]?.name)) || majorsData[0];
              const activeB = majorsData.find((m) => m.name === (dualMajorB || majorsData[1]?.name || majorsData[0]?.name)) || majorsData[1] || majorsData[0];

              if (!activeA || !activeB) {
                return (
                  <div className="p-4 text-center text-xs text-slate-400">
                    暂无足够专业数据进行双列对比
                  </div>
                );
              }

              const rateDiff = Number((activeA.rate - activeB.rate).toFixed(1));
              const actualDiff = activeA.actual - activeB.actual;

              // Trend data for A & B
              const trendA = get7DayTrendForMajor(activeA.name);
              const trendB = get7DayTrendForMajor(activeB.name);

              // Multi-date trend dataset for overlaid line chart
              const allDates = Array.from(new Set(rows.map((r) => r.date))).sort();
              if (allDates.length === 0) {
                allDates.push(selectedDate || "2026-07-15");
              }

              let runningCumA = 0;
              let runningCumB = 0;

              const overlayTrendData = allDates.map((dStr, dIdx) => {
                const getDaily = (mName: string, totalTarget: number, totalActual: number) => {
                  const dayRows = rows.filter((r) => r.date === dStr && r.name === mName);
                  if (dayRows.length > 0) {
                    let sum = 0;
                    dayRows.forEach((r) => {
                      if (r.channels) {
                        r.channels.forEach((c) => {
                          sum += Number(c.actual) || 0;
                        });
                      }
                      const oVal = r.other;
                      const oActual = typeof oVal === "number" ? oVal : (typeof oVal === "object" && oVal !== null && "actual" in oVal ? (oVal as { actual: number }).actual : 0);
                      sum += Number(oActual) || 0;
                    });
                    return sum;
                  }
                  const totalSteps = Math.max(1, allDates.length);
                  const baseDaily = totalActual > 0 ? totalActual / totalSteps : 0;
                  const seed = (mName.length * 7 + dIdx * 13) % 5;
                  const factor = 0.85 + seed * 0.08;
                  return Math.max(0, Math.round(baseDaily * factor));
                };

                const dailyA = getDaily(activeA.name, activeA.target, activeA.actual);
                const dailyB = getDaily(activeB.name, activeB.target, activeB.actual);

                runningCumA += dailyA;
                runningCumB += dailyB;

                const shortDate = dStr.length >= 5 ? dStr.substring(5) : dStr;
                const rateA = activeA.target > 0 ? Number(((runningCumA / activeA.target) * 100).toFixed(1)) : 0;
                const rateB = activeB.target > 0 ? Number(((runningCumB / activeB.target) * 100).toFixed(1)) : 0;

                return {
                  date: dStr,
                  shortDate,
                  dailyA,
                  dailyB,
                  cumA: runningCumA,
                  cumB: runningCumB,
                  valA: trendChartMetric === "cumulative" ? runningCumA : dailyA,
                  valB: trendChartMetric === "cumulative" ? runningCumB : dailyB,
                  rateA,
                  rateB,
                };
              });

              // Velocity A
              const speedsA = trendA.map((d) => d.actual);
              const halfA = Math.max(1, Math.floor(speedsA.length / 2));
              const avgA1 = speedsA.slice(0, halfA).reduce((a, b) => a + b, 0) / halfA;
              const avgA2 = speedsA.slice(speedsA.length - halfA).reduce((a, b) => a + b, 0) / halfA;
              const deltaA = Number((avgA2 - avgA1).toFixed(1));

              // Velocity B
              const speedsB = trendB.map((d) => d.actual);
              const halfB = Math.max(1, Math.floor(speedsB.length / 2));
              const avgB1 = speedsB.slice(0, halfB).reduce((a, b) => a + b, 0) / halfB;
              const avgB2 = speedsB.slice(speedsB.length - halfB).reduce((a, b) => a + b, 0) / halfB;
              const deltaB = Number((avgB2 - avgB1).toFixed(1));

              const actualDailyAvgA = Number((activeA.actual / Math.max(1, currentDay)).toFixed(1));
              const forecastDailyAvgA = Math.max(0.2, Number((actualDailyAvgA * (deltaA >= 0.8 ? 1.15 : deltaA <= -0.8 ? 0.85 : 1.0)).toFixed(1)));
              const forecastIncA7d = Math.round(forecastDailyAvgA * 7);
              const forecastTotalA7d = activeA.actual + forecastIncA7d;
              const forecastRateA7d = activeA.target > 0 ? Math.min(100, Number(((forecastTotalA7d / activeA.target) * 100).toFixed(1))) : 100;

              const actualDailyAvgB = Number((activeB.actual / Math.max(1, currentDay)).toFixed(1));
              const forecastDailyAvgB = Math.max(0.2, Number((actualDailyAvgB * (deltaB >= 0.8 ? 1.15 : deltaB <= -0.8 ? 0.85 : 1.0)).toFixed(1)));
              const forecastIncB7d = Math.round(forecastDailyAvgB * 7);
              const forecastTotalB7d = activeB.actual + forecastIncB7d;
              const forecastRateB7d = activeB.target > 0 ? Math.min(100, Number(((forecastTotalB7d / activeB.target) * 100).toFixed(1))) : 100;

              // Function to render each column card
              const renderColumnCard = (
                item: typeof activeA, 
                tag: "A" | "B", 
                deltaSpeed: number, 
                fInc: number, 
                fTotal: number, 
                fRate: number
              ) => {
                const isTagA = tag === "A";
                const borderAccent = isTagA 
                  ? (isDarkMode ? "border-indigo-500/80 bg-indigo-950/20" : "border-indigo-300 bg-indigo-50/40")
                  : (isDarkMode ? "border-purple-500/80 bg-purple-950/20" : "border-purple-300 bg-purple-50/40");
                
                const titleColor = isTagA ? "text-indigo-600 dark:text-indigo-400" : "text-purple-600 dark:text-purple-400";
                const badgeBg = isTagA ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-400/30" : "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-400/30";

                const isMet = item.actual >= item.target && item.target > 0;
                const isSurplus = item.actual > item.target && item.target > 0;

                return (
                  <div className={`p-3 rounded-xl border relative space-y-2.5 transition-all ${borderAccent}`}>
                    {/* Column Header */}
                    <div className="flex items-center justify-between border-b pb-2 border-current/15">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-extrabold border ${badgeBg}`}>
                          专业 {tag}
                        </span>
                        <span className={`font-extrabold text-xs truncate max-w-[140px] ${
                          isDarkMode ? "text-slate-100" : "text-slate-900"
                        }`}>
                          【{item.name}】
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-extrabold font-mono border ${
                          isSurplus 
                            ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-400/30"
                            : isMet 
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-400/30"
                            : item.rate >= 50
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-400/30"
                            : "bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-400/30"
                        }`}>
                          {item.rate.toFixed(1)}%
                        </span>

                        <button
                          type="button"
                          onClick={() => setDetailModalMajor(item.name)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          title="查看全渠道明细"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar with Baseline Reference Line */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[8.5px] text-slate-400 font-mono">
                        <div className="flex items-center gap-1">
                          <span>进度 (实际/目标)</span>
                          {(() => {
                            const dev = item.rate - Number(timeProgressPct);
                            const isAhead = dev >= 0;
                            return (
                              <span className={`px-1 py-0.2 rounded font-extrabold text-[8px] border ${
                                isAhead 
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                                  : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                              }`} title={`相比当前时间进度基准(${timeProgressPct}%)的偏差`}>
                                {isAhead ? `超前 +${dev.toFixed(1)}%` : `落后 ${dev.toFixed(1)}%`}
                              </span>
                            );
                          })()}
                        </div>
                        <strong className={titleColor}>{item.actual} / {item.target} 人 ({item.rate.toFixed(1)}%)</strong>
                      </div>

                      {/* 柱状图上方警告图标 (低于yellowThreshold% 黄色警告，低于redThreshold% 红色报警) */}
                      {item.rate < redThreshold ? (
                        <div className="flex items-center gap-1 mb-1 px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-500 font-bold text-[8.5px] w-fit animate-pulse" title={`达成率低于${redThreshold}% (当前${item.rate.toFixed(1)}%)：红色报警`}>
                          <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>低于{redThreshold}% 红色报警</span>
                        </div>
                      ) : item.rate < yellowThreshold ? (
                        <div className="flex items-center gap-1 mb-1 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-500 font-bold text-[8.5px] w-fit" title={`达成率低于${yellowThreshold}% (当前${item.rate.toFixed(1)}%)：黄色警告`}>
                          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>低于{yellowThreshold}% 黄色警告</span>
                        </div>
                      ) : null}

                      <div className="relative h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isTagA 
                              ? "bg-gradient-to-r from-indigo-600 to-cyan-400" 
                              : "bg-gradient-to-r from-purple-600 to-pink-400"
                          }`}
                          style={{ width: `${Math.min(100, item.rate)}%` }}
                        />
                        {/* Time Baseline Reference Line (基准参考线 - 橙色高亮线) */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-20 shadow-[0_0_4px_rgba(245,158,11,0.9)]"
                          style={{ left: `${Math.min(100, Number(timeProgressPct))}%` }}
                          title={`当前时间预期进度基准线: ${timeProgressPct}%`}
                        >
                          <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                        </div>
                      </div>

                      {/* 柱状图正下方 红色三角形标志与波动/临界值自动提示 */}
                      {(() => {
                        const colAlert = getMajorAlertStatus(item.name, rows, selectedDate, item.rate, Number(timeProgressPct) || 50);
                        if (!colAlert.hasAlert) return null;
                        return (
                          <div 
                            className="flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-[8.5px] font-mono animate-pulse transition-all cursor-help"
                            title={`【24小时波动/临界值预警提示】\n${colAlert.alertReason}`}
                          >
                            <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-rose-500 shrink-0 shadow-xs" />
                            <span className="truncate">【预警提示】{colAlert.alertReason}</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* 2x2 Key Metrics */}
                    <div className="grid grid-cols-2 gap-1.5 text-[8.5px] font-mono">
                      <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 flex flex-col justify-between">
                        <span className="text-[7.5px] text-slate-400">目标缺口数</span>
                        <strong className={`font-extrabold text-[10px] ${item.gap > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {item.gap > 0 ? `缺 ${item.gap} 人` : `超额 ${item.surplus} 人`}
                        </strong>
                      </div>

                      <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 flex flex-col justify-between">
                        <span className="text-[7.5px] text-slate-400">日均冲刺需求</span>
                        <strong className="font-extrabold text-[10px] text-indigo-600 dark:text-indigo-400">
                          {item.dailyNeeded} 人/天
                        </strong>
                      </div>

                      <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 flex flex-col justify-between">
                        <span className="text-[7.5px] text-slate-400">增长速率动量</span>
                        <strong className={`font-extrabold text-[9.5px] ${deltaSpeed >= 0.8 ? "text-emerald-600 dark:text-emerald-400" : deltaSpeed <= -0.8 ? "text-rose-600 dark:text-rose-400" : "text-slate-500"}`}>
                          {deltaSpeed >= 0.8 ? "🚀 正在加速" : deltaSpeed <= -0.8 ? "📉 减速放缓" : "⚖️ 稳定推进"}
                        </strong>
                      </div>

                      <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 flex flex-col justify-between">
                        <span className="text-[7.5px] text-slate-400">7天预测达成率</span>
                        <strong className={`font-extrabold text-[10px] ${fRate >= 100 ? "text-emerald-600 dark:text-emerald-400" : "text-purple-600 dark:text-purple-400"}`}>
                          🔮 {fRate.toFixed(1)}%
                        </strong>
                      </div>
                    </div>

                    {/* Top Channels Distribution */}
                    <div className="space-y-1 pt-1 border-t border-current/10">
                      <span className="text-[8px] font-bold text-slate-400 block">7大渠道贡献分布 (前3名)</span>
                      <div className="space-y-1">
                        {item.channels
                          .map((ch, idx) => ({ ...ch, name: channelNames[idx] }))
                          .sort((a, b) => b.actual - a.actual)
                          .slice(0, 3)
                          .map((ch, idx) => {
                            const cRate = ch.target > 0 ? (ch.actual / ch.target) * 100 : 0;
                            return (
                              <div key={`ch-m-${ch.name}-${idx}`} className="flex items-center justify-between text-[8px] font-mono">
                                <span className="text-slate-500 dark:text-slate-400 truncate w-16">{ch.name}</span>
                                <div className="flex-1 mx-1.5 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${isTagA ? "bg-indigo-500" : "bg-purple-500"}`}
                                    style={{ width: `${Math.min(100, cRate)}%` }}
                                  />
                                </div>
                                <span className="font-bold shrink-0">{ch.actual}人 ({cRate.toFixed(0)}%)</span>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Quick Action */}
                    <button
                      type="button"
                      onClick={() => onSelectMajor(item.name)}
                      className={`w-full py-1 text-[8.5px] font-extrabold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                        isTagA
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-2xs"
                          : "bg-purple-600 hover:bg-purple-500 text-white border-purple-500 shadow-2xs"
                      }`}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>选定【{item.name}】为图表看板主视角</span>
                    </button>
                  </div>
                );
              };

              return (
                <div className="space-y-3 pt-1">
                  {/* 1. Selector Bar */}
                  <div className={`p-2 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
                    isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-indigo-50/60 border-indigo-150"
                  }`}>
                    <div className="flex items-center gap-1.5 flex-1 min-w-[120px]">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">专业 A:</span>
                      <select
                        value={activeA.name}
                        onChange={(e) => setDualMajorA(e.target.value)}
                        className={`w-full text-xs font-extrabold p-1 rounded-lg border outline-none transition-all cursor-pointer ${
                          isDarkMode 
                            ? "bg-slate-950 border-slate-700 text-indigo-300 focus:border-indigo-500" 
                            : "bg-white border-indigo-200 text-indigo-900 focus:border-indigo-500 shadow-2xs"
                        }`}
                      >
                        {majorsData.map((m, idx) => (
                          <option key={`opt-a-${m.name}-${idx}`} value={m.name}>
                            【{m.name}】 ({m.rate.toFixed(1)}%)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Swap Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const temp = activeA.name;
                        setDualMajorA(activeB.name);
                        setDualMajorB(temp);
                      }}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                        isDarkMode 
                          ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-indigo-400" 
                          : "bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-600 shadow-2xs"
                      }`}
                      title="一键对调专业 A 与 专业 B"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1.5 flex-1 min-w-[120px]">
                      <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 shrink-0">专业 B:</span>
                      <select
                        value={activeB.name}
                        onChange={(e) => setDualMajorB(e.target.value)}
                        className={`w-full text-xs font-extrabold p-1 rounded-lg border outline-none transition-all cursor-pointer ${
                          isDarkMode 
                            ? "bg-slate-950 border-slate-700 text-purple-300 focus:border-purple-500" 
                            : "bg-white border-purple-200 text-purple-900 focus:border-purple-500 shadow-2xs"
                        }`}
                      >
                        {majorsData.map((m, idx) => (
                          <option key={`opt-b-${m.name}-${idx}`} value={m.name}>
                            【{m.name}】 ({m.rate.toFixed(1)}%)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selector Action Buttons: Remember Pair & Benchmark Sidebar Toggle */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {savedPair && ((savedPair.majorA === activeA.name && savedPair.majorB === activeB.name) || (savedPair.majorA === activeB.name && savedPair.majorB === activeA.name)) ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSaveComparisonPair(activeA.name, activeB.name)}
                            className="px-2.5 py-1 text-[9.5px] font-bold rounded-lg border bg-amber-500 text-white border-amber-400 shadow-xs flex items-center gap-1 cursor-pointer hover:bg-amber-600 transition-all"
                            title="当前对比组合已记住，点击重新保存"
                          >
                            <BookmarkCheck className="w-3 h-3" />
                            <span>已记住此组合</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleClearSavedPair}
                            className="p-1 text-[9.5px] rounded-lg border bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                            title="清除已记住的对比组合"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSaveComparisonPair(activeA.name, activeB.name)}
                          className={`px-2.5 py-1 text-[9.5px] font-bold rounded-lg border transition-all flex items-center gap-1 cursor-pointer hover:scale-102 ${
                            isDarkMode
                              ? "bg-amber-950/40 border-amber-600/50 text-amber-300 hover:bg-amber-900/60"
                              : "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 shadow-2xs"
                          }`}
                          title="将当前选中的两个专业名称存入localStorage，下次打开对比视图时自动优先展示"
                        >
                          <Bookmark className="w-3 h-3 text-amber-500" />
                          <span>记住此对比组合</span>
                        </button>
                      )}

                      {/* Chart Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setShowDualTrendChart(!showDualTrendChart)}
                        className={`px-2.5 py-1 text-[9.5px] font-bold rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                          showDualTrendChart
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-500 shadow-xs"
                            : (isDarkMode ? "bg-slate-800 border-slate-700 text-indigo-300 hover:bg-slate-700" : "bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-2xs")
                        }`}
                        title="点击开启或折叠两专业招生期间实际完成人数趋势叠加折线图"
                      >
                        <LineChart className="w-3 h-3" />
                        <span>趋势折线图对比</span>
                        <span className={`text-[8px] px-1.5 py-0.2 rounded font-mono font-extrabold ${
                          showDualTrendChart ? "bg-white/20 text-white" : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300"
                        }`}>
                          {showDualTrendChart ? "已开启" : "已关闭"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowBenchmarkSidebar(!showBenchmarkSidebar)}
                        className={`px-2.5 py-1 text-[9.5px] font-bold rounded-lg border transition-all flex items-center gap-1 cursor-pointer relative ${
                          showBenchmarkSidebar
                            ? (isDarkMode ? "bg-indigo-600 text-white border-indigo-500" : "bg-indigo-600 text-white border-indigo-500 shadow-2xs")
                            : (isDarkMode ? "bg-slate-800 border-slate-700 text-indigo-300 hover:bg-slate-700" : "bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-2xs")
                        }`}
                        title="检索全校与竞品标杆专业建议库"
                      >
                        <Compass className="w-3 h-3" />
                        <span>标杆建议库</span>
                        {majorsData.length <= 1 && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -right-0.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Benchmark Suggestions & Retrieval Sidebar Drawer */}
                  <AnimatePresence>
                    {showBenchmarkSidebar && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`p-3 rounded-xl border space-y-2.5 overflow-hidden transition-all ${
                          isDarkMode
                            ? "bg-slate-900/95 border-indigo-500/30 text-slate-200"
                            : "bg-white border-indigo-200 text-slate-800 shadow-sm"
                        }`}
                      >
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between border-b pb-1.5 border-current/15">
                          <div className="flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" />
                            <span className="font-extrabold text-xs">全校专业与标杆库检索建议</span>
                            <span className="text-[8.5px] px-1.5 py-0.2 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                              {filteredBenchmarks.length} 个备选专业
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowBenchmarkSidebar(false)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Guidance banner if single major in table */}
                        {majorsData.length <= 1 && (
                          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[9px] leading-relaxed flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <strong>对比引导提醒：</strong> 当前主表中仅有 1 个专业。为您提供全校 7 大热门标杆专业库，点击可快速将其设为【专业 B】进行多维对比。
                            </div>
                          </div>
                        )}

                        {/* Search Input & Category Filters */}
                        <div className="space-y-1.5">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                            <input
                              type="text"
                              value={benchmarkSearch}
                              onChange={(e) => setBenchmarkSearch(e.target.value)}
                              placeholder="搜索专业名称、分类或描述关键词..."
                              className={`w-full pl-8 pr-3 py-1 text-[10px] rounded-lg border outline-none transition-all ${
                                isDarkMode
                                  ? "bg-slate-950 border-slate-700 text-slate-200 focus:border-indigo-500"
                                  : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                              }`}
                            />
                          </div>

                          <div className="flex flex-wrap gap-1 text-[8px]">
                            {["全部", "表内现有专业", "新兴热门", "热门工科", "高增长专业", "医药健康", "数字艺术", "标杆基准"].map((cat, idx) => (
                              <button
                                key={`bench-cat-${cat}-${idx}`}
                                type="button"
                                onClick={() => setSelectedBenchmarkCategory(cat)}
                                className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-all ${
                                  selectedBenchmarkCategory === cat
                                    ? "bg-indigo-600 text-white shadow-2xs"
                                    : "bg-black/5 dark:bg-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Benchmark list */}
                        <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 text-[8.5px] font-mono scrollbar-thin">
                          {filteredBenchmarks.map((bench, idx) => {
                            const isCurrentA = activeA.name === bench.name;
                            const isCurrentB = activeB.name === bench.name;
                            const bRate = bench.target > 0 ? (bench.actual / bench.target) * 100 : 0;

                            return (
                              <div
                                key={`bench-item-${bench.name}-${idx}`}
                                className={`p-2 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                                  isCurrentA
                                    ? "border-indigo-500/80 bg-indigo-500/10"
                                    : isCurrentB
                                    ? "border-purple-500/80 bg-purple-500/10"
                                    : isDarkMode
                                    ? "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                                    : "border-slate-200 bg-slate-50/80 hover:border-slate-300"
                                }`}
                              >
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-[10.5px] truncate">【{bench.name}】</span>
                                    <span className="text-[7.5px] px-1 py-0.1 rounded bg-black/5 dark:bg-white/10 text-slate-400">
                                      {bench.category}
                                    </span>
                                  </div>
                                  <p className="text-[8px] text-slate-400 line-clamp-1 font-sans">{bench.description}</p>
                                  <div className="text-[8px] text-slate-400">
                                    目标: {bench.target}人 | 实际: <strong className="text-indigo-600 dark:text-indigo-400">{bench.actual}人</strong> ({bRate.toFixed(1)}%)
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectBenchmarkMajor(bench, "A")}
                                    disabled={isCurrentA}
                                    className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded cursor-pointer transition-all ${
                                      isCurrentA
                                        ? "bg-indigo-500 text-white opacity-70"
                                        : "bg-indigo-600 hover:bg-indigo-500 text-white"
                                    }`}
                                  >
                                    {isCurrentA ? "当前专业 A" : "+ 设为专业 A"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleSelectBenchmarkMajor(bench, "B")}
                                    disabled={isCurrentB}
                                    className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded cursor-pointer transition-all ${
                                      isCurrentB
                                        ? "bg-purple-500 text-white opacity-70"
                                        : "bg-purple-600 hover:bg-purple-500 text-white"
                                    }`}
                                  >
                                    {isCurrentB ? "当前专业 B" : "+ 设为专业 B"}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Overlaid Trend Line Chart Section */}
                  <AnimatePresence>
                    {showDualTrendChart && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`p-3.5 rounded-2xl border space-y-3 transition-all ${
                          isDarkMode
                            ? "bg-slate-900/95 border-indigo-500/30 text-slate-200"
                            : "bg-white border-indigo-200 text-slate-800 shadow-sm"
                        }`}
                      >
                        {/* Chart Header & Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 border-current/15">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-md shrink-0">
                              <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                                <span>招生期间实际完成人数趋势 (叠加折线图)</span>
                                <span className="text-[8.5px] px-2 py-0.3 rounded-full font-mono font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-amber-500" />
                                  双专业动态走势 PK
                                </span>
                              </div>
                              <p className="text-[9.5px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                                对比 <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">【{activeA.name}】</strong> 与 <strong className="text-purple-600 dark:text-purple-400 font-extrabold">【{activeB.name}】</strong> 在招生周期的报到走势与拉开幅度
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Metric Switcher: Cumulative vs Daily */}
                            <div className={`flex p-0.5 rounded-lg border text-[8.5px] font-bold ${
                              isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
                            }`}>
                              <button
                                type="button"
                                onClick={() => setTrendChartMetric("cumulative")}
                                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                                  trendChartMetric === "cumulative"
                                    ? "bg-indigo-600 text-white shadow-2xs font-extrabold"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                }`}
                              >
                                累计报到趋势
                              </button>
                              <button
                                type="button"
                                onClick={() => setTrendChartMetric("daily")}
                                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                                  trendChartMetric === "daily"
                                    ? "bg-indigo-600 text-white shadow-2xs font-extrabold"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                }`}
                              >
                                单日新增对比
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => setShowDualTrendChart(false)}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                              title="关闭折线图表"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Chart Canvas */}
                        <div className="w-full h-60 pt-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <ReLineChart data={overlayTrendData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} opacity={0.6} />
                              <XAxis
                                dataKey="shortDate"
                                tick={{ fontSize: 9.5, fill: isDarkMode ? "#94a3b8" : "#64748b" }}
                                axisLine={{ stroke: isDarkMode ? "#475569" : "#cbd5e1" }}
                              />
                              <YAxis
                                tick={{ fontSize: 9.5, fill: isDarkMode ? "#94a3b8" : "#64748b" }}
                                axisLine={{ stroke: isDarkMode ? "#475569" : "#cbd5e1" }}
                                unit="人"
                              />
                              <ReTooltip
                                content={({ active, payload }: any) => {
                                  if (!active || !payload || !payload.length) return null;
                                  const d = payload[0]?.payload;
                                  if (!d) return null;

                                  const vA = d.valA;
                                  const vB = d.valB;
                                  const diff = vA - vB;

                                  return (
                                    <div className={`p-3 rounded-xl border shadow-xl text-xs font-mono space-y-1.5 min-w-[180px] ${
                                      isDarkMode ? "bg-slate-900/95 border-slate-700 text-slate-100" : "bg-white/95 border-slate-200 text-slate-900"
                                    }`}>
                                      <div className="font-extrabold text-[11px] pb-1 border-b border-current/15 flex items-center justify-between gap-3">
                                        <span>📅 日期: {d.date}</span>
                                        <span className="text-[9.5px] text-indigo-500 font-bold">
                                          {trendChartMetric === "cumulative" ? "累计走势" : "单日新增"}
                                        </span>
                                      </div>

                                      <div className="space-y-1 pt-0.5">
                                        <div className="flex items-center justify-between gap-4 text-indigo-600 dark:text-indigo-400 font-extrabold">
                                          <div className="flex items-center gap-1.5 truncate">
                                            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                                            <span className="truncate">【{activeA.name}】</span>
                                          </div>
                                          <span className="shrink-0">{vA} 人 {trendChartMetric === "cumulative" && `(${d.rateA}%)`}</span>
                                        </div>

                                        <div className="flex items-center justify-between gap-4 text-purple-600 dark:text-purple-400 font-extrabold">
                                          <div className="flex items-center gap-1.5 truncate">
                                            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                                            <span className="truncate">【{activeB.name}】</span>
                                          </div>
                                          <span className="shrink-0">{vB} 人 {trendChartMetric === "cumulative" && `(${d.rateB}%)`}</span>
                                        </div>
                                      </div>

                                      {activeA.name !== activeB.name && (
                                        <div className="pt-1 border-t border-current/15 flex items-center justify-between text-[10px] font-bold">
                                          <span className="text-slate-400">两专业差值:</span>
                                          <span className={diff > 0 ? "text-indigo-600 dark:text-indigo-400" : diff < 0 ? "text-purple-600 dark:text-purple-400" : "text-slate-500"}>
                                            {diff > 0 ? `A 多出 +${diff}人` : diff < 0 ? `B 多出 +${Math.abs(diff)}人` : "完全持平"}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                }}
                              />
                              <Legend
                                wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }}
                                formatter={(value) => <span className={isDarkMode ? "text-slate-200 font-bold" : "text-slate-800 font-bold"}>{value}</span>}
                              />
                              <Line
                                type="monotone"
                                dataKey="valA"
                                name={`【${activeA.name}】(专业 A)`}
                                stroke="#6366f1"
                                strokeWidth={2.5}
                                dot={{ r: 3.5, fill: "#6366f1", strokeWidth: 1 }}
                                activeDot={{ r: 6, stroke: "#312e81", strokeWidth: 2 }}
                              />
                              <Line
                                type="monotone"
                                dataKey="valB"
                                name={`【${activeB.name}】(专业 B)`}
                                stroke="#a855f7"
                                strokeWidth={2.5}
                                dot={{ r: 3.5, fill: "#a855f7", strokeWidth: 1 }}
                                activeDot={{ r: 6, stroke: "#581c87", strokeWidth: 2 }}
                              />
                            </ReLineChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Summary Footer */}
                        <div className={`p-2 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-[9px] font-mono ${
                          isDarkMode ? "bg-black/30 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
                        }`}>
                          <div className="flex items-center gap-3 flex-wrap">
                            <div>
                              <span className="text-slate-400 mr-1">【{activeA.name}】当前完成:</span>
                              <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                                {activeA.actual} 人 ({activeA.rate.toFixed(1)}%)
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-400 mr-1">【{activeB.name}】当前完成:</span>
                              <strong className="text-purple-600 dark:text-purple-400 font-extrabold">
                                {activeB.actual} 人 ({activeB.rate.toFixed(1)}%)
                              </strong>
                            </div>
                          </div>

                          {activeA.name !== activeB.name && (
                            <div className="flex items-center gap-1.5 font-bold">
                              <span className="text-slate-400">走势优势对比:</span>
                              <span className={`px-1.5 py-0.2 rounded font-extrabold ${
                                actualDiff > 0 ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-300" : actualDiff < 0 ? "bg-purple-500/20 text-purple-600 dark:text-purple-300" : "bg-slate-200 text-slate-600"
                              }`}>
                                {actualDiff > 0 ? `【${activeA.name}】领先 +${actualDiff}人` : actualDiff < 0 ? `【${activeB.name}】领先 +${Math.abs(actualDiff)}人` : "完成人数相当"}
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Single Major Comparison Visual Guidance Banner */}
                  {activeA.name === activeB.name && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl border border-amber-400/80 bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-purple-500/15 text-slate-800 dark:text-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 shadow-sm animate-pulse">
                          <Compass className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                            <span>对比视图单一专业提醒</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 font-mono font-bold">
                              目前仅选中 1 个专业
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-600 dark:text-slate-300 font-sans mt-0.5">
                            当前两个对比栏位均选定了【<strong className="text-amber-700 dark:text-amber-300">{activeA.name}</strong>】。请添加第二个对比专业，开启跨专业 PK 与渠道胜负分析！
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setModalSearchKeyword("");
                          setShowSearchSelectModal(true);
                        }}
                        className="px-3.5 py-1.5 text-xs font-extrabold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-103 active:scale-97 transition-all"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>弹窗检索并添加第二个专业</span>
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}

                  {/* 2. Key Delta Analysis Banner */}
                  <div className={`p-2.5 rounded-xl border relative overflow-hidden ${
                    isDarkMode ? "bg-indigo-950/30 border-indigo-800/60" : "bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-emerald-50/90 border-indigo-200"
                  }`}>
                    <div className="flex items-center justify-between text-[10px] font-bold border-b pb-1.5 border-current/15">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                        <span className="text-slate-900 dark:text-slate-100 font-extrabold">竞品分析核心差异 (PK Delta)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCompareMajors([activeA.name, activeB.name]);
                          setShowCompareDrawer(true);
                        }}
                        className="px-2 py-0.5 rounded text-[8.5px] font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                      >
                        <span>生成全渠道对比报告</span>
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 mt-2 text-center font-mono text-[9px]">
                      <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5">
                        <span className="text-[8px] text-slate-400 block mb-0.5">达成率差值 (Rate Delta)</span>
                        <span className={`font-extrabold text-[10px] ${
                          rateDiff > 0 ? "text-indigo-600 dark:text-indigo-400" : rateDiff < 0 ? "text-purple-600 dark:text-purple-400" : "text-slate-500"
                        }`}>
                          {activeA.name === activeB.name ? "需选择第二个专业" : rateDiff > 0 ? `【${activeA.name}】领先 +${rateDiff}%` : rateDiff < 0 ? `【${activeB.name}】领先 +${Math.abs(rateDiff)}%` : "达成率完全平手"}
                        </span>
                      </div>

                      <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5">
                        <span className="text-[8px] text-slate-400 block mb-0.5">招收人数差值 (Count Delta)</span>
                        <span className={`font-extrabold text-[10px] ${
                          actualDiff > 0 ? "text-indigo-600 dark:text-indigo-400" : actualDiff < 0 ? "text-purple-600 dark:text-purple-400" : "text-slate-500"
                        }`}>
                          {activeA.name === activeB.name ? "需选择第二个专业" : actualDiff > 0 ? `【${activeA.name}】多出 +${actualDiff} 人` : actualDiff < 0 ? `【${activeB.name}】多出 +${Math.abs(actualDiff)} 人` : "完成人数相当"}
                        </span>
                      </div>

                      <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5">
                        <span className="text-[8px] text-slate-400 block mb-0.5">7天预测领先 (7d Forecast)</span>
                        <span className={`font-extrabold text-[10px] ${
                          forecastRateA7d > forecastRateB7d ? "text-indigo-600 dark:text-indigo-400" : forecastRateA7d < forecastRateB7d ? "text-purple-600 dark:text-purple-400" : "text-slate-500"
                        }`}>
                          {activeA.name === activeB.name ? "需选择第二个专业" : forecastRateA7d > forecastRateB7d ? `【${activeA.name}】快 ${(forecastRateA7d - forecastRateB7d).toFixed(1)}%` : forecastRateA7d < forecastRateB7d ? `【${activeB.name}】快 ${(forecastRateB7d - forecastRateA7d).toFixed(1)}%` : "趋势相近"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Side-by-Side Dual Column Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {renderColumnCard(activeA, "A", deltaA, forecastIncA7d, forecastTotalA7d, forecastRateA7d)}
                    {activeA.name === activeB.name ? (
                      <div className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center space-y-3 min-h-[380px] transition-all ${
                        isDarkMode
                          ? "border-purple-500/50 bg-purple-950/20 text-slate-200 hover:border-purple-400"
                          : "border-purple-300 bg-purple-50/50 text-slate-800 hover:border-purple-400 hover:bg-purple-50 shadow-2xs"
                      }`}>
                        <div className="w-14 h-14 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-300 flex items-center justify-center shadow-inner">
                          <Plus className="w-7 h-7 animate-pulse" />
                        </div>
                        <div className="space-y-1 max-w-xs">
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                            尚未添加第二个对比专业
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
                            点击下方按钮通过弹窗快速检索全校现存专业或标杆数据库，添加后视图将自动刷新。
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setModalSearchKeyword("");
                            setShowSearchSelectModal(true);
                          }}
                          className="px-4 py-2 text-xs font-extrabold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                        >
                          <Search className="w-4 h-4" />
                          <span>弹窗检索并选择专业 B</span>
                        </button>
                      </div>
                    ) : (
                      renderColumnCard(activeB, "B", deltaB, forecastIncB7d, forecastTotalB7d, forecastRateB7d)
                    )}
                  </div>

                  {/* 4. Head-to-Head Channel PK Breakdown & Heatmap Alert Table */}
                  <div className={`p-3 rounded-xl border text-[9px] space-y-2.5 ${
                    isDarkMode ? "bg-slate-900/80 border-slate-800 text-slate-300" : "bg-slate-50/95 border-slate-200/90 text-slate-800"
                  }`}>
                    {(() => {
                      const alertChannelCount = channelNames.filter((_, cIdx) => {
                        const chA = activeA.channels[cIdx] || { target: 0, actual: 0 };
                        const chB = activeB.channels[cIdx] || { target: 0, actual: 0 };
                        const rA = chA.target > 0 ? (chA.actual / chA.target) * 100 : 0;
                        const rB = chB.target > 0 ? (chB.actual / chB.target) * 100 : 0;
                        return Math.abs(rA - rB) >= 10;
                      }).length;

                      return (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-2 font-bold pb-2 border-b border-current/15">
                            <div className="flex items-center gap-2">
                              <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                              <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                                【{activeA.name}】 VS 【{activeB.name}】 7大渠道达成率极差热力分析
                              </span>
                              {alertChannelCount > 0 ? (
                                <span className="px-2 py-0.5 rounded-full text-[8.5px] font-mono font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1 shadow-2xs">
                                  <AlertTriangle className="w-3 h-3 text-rose-500 animate-bounce" />
                                  <span>{alertChannelCount} 个渠道极差 ≥10%</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[8.5px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  所有渠道差异均在 10% 以内 (均衡)
                                </span>
                              )}
                            </div>

                            {/* Heat Legend */}
                            <div className="flex items-center gap-2.5 text-[8.5px] font-mono">
                              <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded bg-emerald-500/25 border border-emerald-500/60 shrink-0" />
                                <span className="text-emerald-700 dark:text-emerald-300 font-bold">优势 (高于对手 ≥10%)</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded bg-rose-500/25 border border-rose-500/60 shrink-0" />
                                <span className="text-rose-700 dark:text-rose-300 font-bold">滞后 (落后对手 ≥10%)</span>
                              </span>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-[9px] font-mono border-collapse">
                              <thead>
                                <tr className={`border-b text-[8.5px] font-bold ${
                                  isDarkMode ? "border-slate-800 text-slate-400 bg-slate-950/60" : "border-slate-200 text-slate-500 bg-slate-100/70"
                                }`}>
                                  <th className="py-1.5 px-2 text-left font-extrabold w-28">招生渠道</th>
                                  <th className="py-1.5 px-2 text-center font-extrabold min-w-[120px]">
                                    【{activeA.name}】 (A)
                                  </th>
                                  <th className="py-1.5 px-2 text-center font-extrabold min-w-[100px]">完成率极差</th>
                                  <th className="py-1.5 px-2 text-center font-extrabold min-w-[120px]">
                                    【{activeB.name}】 (B)
                                  </th>
                                  <th className="py-1.5 px-2 text-right font-extrabold w-32">热力诊断标识</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-current/10">
                                {channelNames.map((chName, cIdx) => {
                                  const chA = activeA.channels[cIdx] || { target: 0, actual: 0 };
                                  const chB = activeB.channels[cIdx] || { target: 0, actual: 0 };
                                  const rA = chA.target > 0 ? (chA.actual / chA.target) * 100 : 0;
                                  const rB = chB.target > 0 ? (chB.actual / chB.target) * 100 : 0;
                                  const chDiff = Number((rA - rB).toFixed(1));
                                  const absDiff = Math.abs(chDiff);
                                  const isSignificant = absDiff >= 10;

                                  const targetData = {
                                    channelName: chName,
                                    majorA: {
                                      name: activeA.name,
                                      channelTarget: chA.target,
                                      channelActual: chA.actual,
                                      channelRate: rA,
                                      totalTarget: activeA.target,
                                      totalRate: activeA.rate
                                    },
                                    majorB: {
                                      name: activeB.name,
                                      channelTarget: chB.target,
                                      channelActual: chB.actual,
                                      channelRate: rB,
                                      totalTarget: activeB.target,
                                      totalRate: activeB.rate
                                    },
                                    chDiff
                                  };

                                  // Major A cell heat background
                                  let cellAStyle = isDarkMode
                                    ? "bg-black/20 border-slate-800 text-slate-300"
                                    : "bg-white border-slate-200 text-slate-800";
                                  if (isSignificant) {
                                    if (chDiff >= 10) {
                                      cellAStyle = isDarkMode
                                        ? "bg-emerald-950/60 border-emerald-500/70 text-emerald-300 font-extrabold shadow-2xs hover:border-emerald-400 cursor-pointer"
                                        : "bg-emerald-100/90 border-emerald-300 text-emerald-900 font-extrabold shadow-2xs hover:border-emerald-500 cursor-pointer";
                                    } else {
                                      cellAStyle = isDarkMode
                                        ? "bg-rose-950/60 border-rose-500/70 text-rose-300 font-extrabold shadow-2xs hover:border-rose-400 cursor-pointer"
                                        : "bg-rose-100/90 border-rose-300 text-rose-900 font-extrabold shadow-2xs hover:border-rose-500 cursor-pointer";
                                    }
                                  }

                                  // Major B cell heat background
                                  let cellBStyle = isDarkMode
                                    ? "bg-black/20 border-slate-800 text-slate-300"
                                    : "bg-white border-slate-200 text-slate-800";
                                  if (isSignificant) {
                                    if (chDiff <= -10) {
                                      cellBStyle = isDarkMode
                                        ? "bg-emerald-950/60 border-emerald-500/70 text-emerald-300 font-extrabold shadow-2xs hover:border-emerald-400 cursor-pointer"
                                        : "bg-emerald-100/90 border-emerald-300 text-emerald-900 font-extrabold shadow-2xs hover:border-emerald-500 cursor-pointer";
                                    } else {
                                      cellBStyle = isDarkMode
                                        ? "bg-rose-950/60 border-rose-500/70 text-rose-300 font-extrabold shadow-2xs hover:border-rose-400 cursor-pointer"
                                        : "bg-rose-100/90 border-rose-300 text-rose-900 font-extrabold shadow-2xs hover:border-rose-500 cursor-pointer";
                                    }
                                  }

                                  return (
                                    <tr key={`dual-ch-${chName}-${cIdx}`} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                      <td className="py-2 px-2 font-extrabold text-slate-900 dark:text-slate-100">
                                        <div className="flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                          <span className="truncate">{chName}</span>
                                        </div>
                                      </td>

                                      {/* Major A Cell with Heat Background */}
                                      <td className="py-1 px-1">
                                        <div 
                                          onClick={isSignificant ? () => handleOpenAiDiagnosis(targetData) : undefined}
                                          title={isSignificant ? "点击调取 Gemini 智能归因分析 (极差≥10%)" : undefined}
                                          className={`py-1.5 px-2 rounded-lg border text-center transition-all ${cellAStyle}`}
                                        >
                                          <div className="font-extrabold text-[10px] flex items-center justify-center gap-1">
                                            <span>{rA.toFixed(1)}%</span>
                                            {isSignificant && (
                                              <Sparkles className="w-2.5 h-2.5 text-amber-500 animate-pulse shrink-0" />
                                            )}
                                          </div>
                                          <div className="text-[7.5px] opacity-75 font-sans">({chA.actual} / {chA.target}人)</div>
                                        </div>
                                      </td>

                                      {/* Rate Delta & Visual PK Gauge */}
                                      <td className="py-1 px-2 text-center">
                                        <div className="flex flex-col items-center gap-0.5">
                                          <button
                                            type="button"
                                            onClick={isSignificant ? () => handleOpenAiDiagnosis(targetData) : undefined}
                                            disabled={!isSignificant}
                                            title={isSignificant ? "极差≥10%！点击调取 Gemini 智能归因分析" : undefined}
                                            className={`px-1.5 py-0.2 rounded font-bold text-[8px] transition-all ${
                                              isSignificant ? "cursor-pointer hover:scale-105 active:scale-95 shadow-2xs" : ""
                                            } ${
                                              chDiff > 0
                                                ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30"
                                                : chDiff < 0
                                                ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                                                : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                                            }`}
                                          >
                                            {chDiff > 0 ? `A领先 +${chDiff}%` : chDiff < 0 ? `B领先 +${Math.abs(chDiff)}%` : "平手 (0%)"}
                                          </button>
                                        </div>
                                      </td>

                                      {/* Major B Cell with Heat Background */}
                                      <td className="py-1 px-1">
                                        <div 
                                          onClick={isSignificant ? () => handleOpenAiDiagnosis(targetData) : undefined}
                                          title={isSignificant ? "点击调取 Gemini 智能归因分析 (极差≥10%)" : undefined}
                                          className={`py-1.5 px-2 rounded-lg border text-center transition-all ${cellBStyle}`}
                                        >
                                          <div className="font-extrabold text-[10px] flex items-center justify-center gap-1">
                                            <span>{rB.toFixed(1)}%</span>
                                            {isSignificant && (
                                              <Sparkles className="w-2.5 h-2.5 text-amber-500 animate-pulse shrink-0" />
                                            )}
                                          </div>
                                          <div className="text-[7.5px] opacity-75 font-sans">({chB.actual} / {chB.target}人)</div>
                                        </div>
                                      </td>

                                      {/* Heat Alert Status Conclusion */}
                                      <td className="py-1 px-2 text-right">
                                        {chDiff >= 10 ? (
                                          <button
                                            type="button"
                                            onClick={() => handleOpenAiDiagnosis(targetData)}
                                            title="极差≥10%！点击唤起 Gemini 智能摘要与归因分析"
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-extrabold bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-700 dark:text-emerald-300 border border-emerald-500/50 shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                                          >
                                            <span>🔥 A强优势</span>
                                            <span>(+{chDiff}%)</span>
                                            <Sparkles className="w-2.5 h-2.5 text-amber-500 animate-pulse group-hover:rotate-12 transition-transform shrink-0" />
                                          </button>
                                        ) : chDiff <= -10 ? (
                                          <button
                                            type="button"
                                            onClick={() => handleOpenAiDiagnosis(targetData)}
                                            title="极差≥10%！点击唤起 Gemini 智能摘要与归因分析"
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-extrabold bg-purple-500/20 hover:bg-purple-500/35 text-purple-700 dark:text-purple-300 border border-purple-500/50 shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                                          >
                                            <span>🔥 B强优势</span>
                                            <span>(+{Math.abs(chDiff)}%)</span>
                                            <Sparkles className="w-2.5 h-2.5 text-amber-500 animate-pulse group-hover:rotate-12 transition-transform shrink-0" />
                                          </button>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-500">
                                            <span>均衡</span>
                                            <span>(差{absDiff}%)</span>
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          <div className="text-[8px] text-slate-400 dark:text-slate-500 font-sans leading-relaxed pt-1 border-t border-current/10 flex items-center justify-between">
                            <span>💡 热力预警规则：当同渠道计划完成率极差绝对值超过 10% 时，系统自动在对应单元格标记淡绿（优势）或淡红（滞后）背景。</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              );
            })() : (
            /* Majors Micro Bar Progress List (Standard Mode) */
            <div className="space-y-1.5">
              {/* Heatmap Mode Density Legend Banner */}
              {isHeatmapMode && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-emerald-500/15 border border-emerald-500/30 text-[9.5px] font-bold mb-2 shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                    <span>
                      <strong className="text-emerald-700 dark:text-emerald-300 font-extrabold">热力图模式已激活</strong>：根据各专业达成率密集度渐变着色，
                      <strong className="text-emerald-600 dark:text-emerald-400">达成率越高背景与进度色越深</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap font-mono text-[8px]">
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-bold">
                      &lt;30% 浅疏
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold">
                      30-50% 中低
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-bold">
                      50-80% 中高
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 border border-emerald-500/40 font-extrabold">
                      80-100% 浓密集
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-700 text-white border border-emerald-400 font-black shadow-2xs">
                      ≥100% 顶峰极深
                    </span>
                  </div>
                </div>
              )}

              {/* Rate Descending Informational Banner */}
              {sortOption === "rate" && (
                <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 border border-amber-500/25 text-[9.5px] font-bold text-amber-800 dark:text-amber-200 mb-2 shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-bounce" />
                    <span>已开启<strong className="text-amber-600 dark:text-amber-300 font-extrabold mx-0.5">达成率降序排列</strong>：已定位顶部 <strong className="text-amber-600 dark:text-amber-300 font-extrabold">⭐ 明星专业 (榜首)</strong> 与底部 <strong className="text-indigo-600 dark:text-indigo-300 font-extrabold">💡 潜力待挖掘专业 (榜尾)</strong></span>
                  </div>
                  <div className="flex items-center gap-2 font-mono shrink-0 text-[8.5px]">
                    <span className="bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-extrabold">
                      ⭐ 明星最高: {maxRateVal.toFixed(1)}%
                    </span>
                    <span className="bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-extrabold">
                      💡 潜力最低: {minRateVal.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}

              {displayedMajors.map((item, idx) => {
                const targetBarWidth = (item.target / maxScaleVal) * 100;
                const actualBarWidth = (item.actual / maxScaleVal) * 100;
                const isMet = item.actual >= item.target && item.target > 0;
                const isSurplus = item.actual > item.target && item.target > 0;
                const isWarning = item.rate < 50 && item.target > 0;
                const isChecked = selectedCompareMajors.includes(item.name);
                const isInlineExpanded = expandedCardMajors.includes(item.name);
                const isStarMajor = item.target > 0 && item.rate === maxRateVal && maxRateVal > 0;
                const isPotentialMajor = item.target > 0 && item.rate === minRateVal && minRateVal < maxRateVal;

                // Heatmap dynamic style
                const heatStyle = isHeatmapMode ? getHeatmapStyle(item.rate, isDarkMode) : null;

                // Dynamic color styles
                let actualGradient = heatStyle ? heatStyle.barGradient : "from-emerald-500 to-teal-400";
                let rateBadgeStyle = isDarkMode ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-700";
                if (!isHeatmapMode) {
                  if (isWarning) {
                    actualGradient = "from-rose-500 to-pink-500";
                    rateBadgeStyle = isDarkMode ? "bg-rose-500/15 text-rose-400" : "bg-rose-50 text-rose-700";
                  } else if (!isMet) {
                    actualGradient = "from-amber-500 to-yellow-400";
                    rateBadgeStyle = isDarkMode ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-700";
                  }
                } else {
                  rateBadgeStyle = heatStyle ? heatStyle.rateBadgeClass : rateBadgeStyle;
                }

                // Micro status badge based on real-time completion rate
                let statusBadgeText = "正常进行";
                let statusBadgeStyle = "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-300/40 font-bold";

                if (isHeatmapMode && heatStyle) {
                  statusBadgeText = heatStyle.badgeText;
                  statusBadgeStyle = heatStyle.badgeClass;
                } else {
                  if (item.target === 0) {
                    statusBadgeText = "无目标";
                    statusBadgeStyle = "bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300/40";
                  } else if (isSurplus) {
                    statusBadgeText = "超额达成";
                    statusBadgeStyle = "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-400/40 font-extrabold";
                  } else if (isMet) {
                    statusBadgeText = "顺利达标";
                    statusBadgeStyle = "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-400/40 font-extrabold";
                  } else if (item.rate >= yellowThreshold) {
                    statusBadgeText = "正常推进";
                    statusBadgeStyle = "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-300/40 font-bold";
                  } else if (item.rate >= redThreshold) {
                    statusBadgeText = "黄色警告";
                    statusBadgeStyle = "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-400/40 font-extrabold";
                  } else {
                    statusBadgeText = "红色报警";
                    statusBadgeStyle = "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-400/40 font-extrabold animate-pulse";
                  }
                }

                return (
                  <motion.div
                    key={`major-overview-${item.name}-${idx}`}
                    whileHover={{ 
                      scale: 1.028, 
                      y: -3, 
                      transition: { type: "spring", stiffness: 420, damping: 22 } 
                    }}
                    whileTap={{ 
                      scale: 0.985,
                      transition: { type: "spring", stiffness: 500, damping: 25 }
                    }}
                    onClick={() => {
                      if (isCompareMode) {
                        handleToggleMajorSelection(item.name);
                      } else {
                        onSelectMajor(item.name);
                      }
                    }}
                    onMouseEnter={() => setHoveredMajorName(item.name)}
                    onMouseLeave={() => setHoveredMajorName(null)}
                    className={`p-2 rounded-lg border cursor-pointer group/major-card relative transition-all duration-200 ${
                      hoveredMajorName === item.name
                        ? "shadow-xl z-30 ring-2 ring-emerald-500/40"
                        : ""
                    } ${
                      isHeatmapMode && heatStyle
                        ? `${heatStyle.bgCard} ${isChecked ? "ring-2 ring-indigo-400" : ""}`
                        : isStarMajor
                        ? (isDarkMode
                            ? "bg-amber-950/20 border-amber-500/80 shadow-md shadow-amber-950/30 ring-1 ring-amber-400/50"
                            : "bg-amber-50/90 border-amber-400 shadow-2xs ring-1 ring-amber-300")
                        : isPotentialMajor
                        ? (isDarkMode
                            ? "bg-indigo-950/25 border-indigo-500/80 shadow-md ring-1 ring-indigo-400/40"
                            : "bg-indigo-50/80 border-indigo-300 shadow-2xs ring-1 ring-indigo-200")
                        : item.isAlert
                        ? (isDarkMode 
                            ? "bg-rose-950/20 border-rose-500/90 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/40" 
                            : "bg-rose-50/80 border-rose-400 shadow-2xs ring-1 ring-rose-300/60")
                        : isChecked
                        ? (isDarkMode 
                            ? "bg-indigo-950/60 border-indigo-500/80 shadow-md shadow-indigo-950/30 ring-1 ring-indigo-500/40" 
                            : "bg-indigo-50/90 border-indigo-400 shadow-2xs ring-1 ring-indigo-300")
                        : (isDarkMode
                            ? "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900 hover:border-emerald-500/50 hover:shadow-md hover:shadow-black/30"
                            : "bg-slate-50/70 border-slate-200/70 hover:bg-emerald-50/40 hover:border-emerald-300 hover:shadow-2xs")
                    }`}
                    title={isCompareMode ? `点击勾选【${item.name}】进行渠道对比` : `点击跳转并聚焦【${item.name}】数据行`}
                  >
                    {/* Header: Name, Status & Ratio % */}
                    <div className="flex items-center justify-between text-[11px] gap-1">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {isCompareMode && (
                          <div className={`shrink-0 transition-colors ${
                            isChecked ? "text-indigo-500" : "text-slate-400 group-hover/major-card:text-indigo-400"
                          }`}>
                            {isChecked ? (
                              <CheckSquare className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500/10" />
                            ) : (
                              <Square className="w-3.5 h-3.5" />
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailModalMajor(item.name);
                          }}
                          className={`font-extrabold truncate text-left transition-colors cursor-pointer flex items-center gap-1 hover:underline ${
                            isHeatmapMode && heatStyle
                              ? heatStyle.nameClass
                              : isChecked 
                              ? (isDarkMode ? "text-indigo-300 hover:text-indigo-200" : "text-indigo-950 hover:text-indigo-700")
                              : (isDarkMode ? "text-slate-200 hover:text-emerald-400" : "text-slate-800 hover:text-emerald-700")
                          }`}
                          title={`点击弹出【${item.name}】全渠道详细招生对比与历史走势分析弹窗`}
                        >
                          <span>{item.name}</span>
                          <BarChart2 className="w-3.5 h-3.5 opacity-60 hover:opacity-100 shrink-0 inline text-emerald-500" />
                        </button>

                        {/* Star Major Badge */}
                        {isStarMajor && (
                          <span className="text-[8px] px-1.5 py-0.2 rounded font-black bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300 text-slate-950 border border-amber-300 shadow-2xs shrink-0 flex items-center gap-0.5 animate-pulse" title={`达成率榜首明星专业 (当前达成率 ${item.rate.toFixed(1)}%)`}>
                            <Star className="w-2.5 h-2.5 fill-slate-950 text-slate-950 shrink-0" />
                            <span>⭐ 明星专业</span>
                          </span>
                        )}

                        {/* Potential Major Badge */}
                        {isPotentialMajor && (
                          <span className="text-[8px] px-1.5 py-0.2 rounded font-extrabold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-400/40 shrink-0 flex items-center gap-0.5" title={`达成率最低待挖掘专业 (当前达成率 ${item.rate.toFixed(1)}%)`}>
                            <Sparkles className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                            <span>💡 潜力待挖掘</span>
                          </span>
                        )}

                        {/* Alert Badge if isAlert */}
                        {item.isAlert && (
                          <span className="text-[8px] px-1.5 py-0.2 rounded font-extrabold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-400/40 shrink-0 animate-pulse flex items-center gap-0.5" title={`按时间进度 (${timeProgressPct}%) 尚未达到 80% 目标线 (${Math.ceil(item.expected80)}人)`}>
                            🚨 未达80%进度
                          </span>
                        )}

                        {/* Real-time Status Badge */}
                        <span className={`text-[8px] px-1.5 py-0.2 rounded border shrink-0 transition-all ${statusBadgeStyle}`} title={`基于实时达成率(${item.rate.toFixed(0)}%)自动标记`}>
                          {statusBadgeText}
                        </span>

                        {/* Quick Fix Button if isAlert */}
                        {item.isAlert && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickFixMajor(quickFixMajor === item.name ? null : item.name);
                            }}
                            className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
                            title="点击打开智能快速修正面板，算算每天需要招生多少人并一键追平"
                          >
                            <Zap className="w-2.5 h-2.5" />
                            <span>快速修正</span>
                          </button>
                        )}

                        {/* Inline Expand Channel Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleInlineChannelExpand(item.name);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-all flex items-center gap-0.5 cursor-pointer border ${
                            isInlineExpanded
                              ? (isDarkMode ? "bg-indigo-950 border-indigo-700 text-indigo-300" : "bg-indigo-100 border-indigo-300 text-indigo-800")
                              : (isDarkMode ? "bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300" : "bg-white hover:bg-slate-100 border-slate-200 text-slate-600")
                          }`}
                          title="点击展开/收起该专业的各渠道子数据表"
                        >
                          <span>渠道</span>
                          <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-200 ${isInlineExpanded ? "rotate-180" : ""}`} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailModalMajor(item.name);
                          }}
                          className={`p-1 rounded transition-colors cursor-pointer text-indigo-500 hover:bg-indigo-500/15 ${
                            isDarkMode ? "hover:text-indigo-300" : "hover:text-indigo-700"
                          }`}
                          title={`打开【${item.name}】全屏渠道折线与达成路径洞察`}
                        >
                          <LineChart className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSimulationMajor(item.name);
                          }}
                          className={`p-1 rounded transition-colors cursor-pointer text-amber-500 hover:bg-amber-500/15 ${
                            isDarkMode ? "hover:text-amber-300" : "hover:text-amber-700"
                          }`}
                          title={`开启【${item.name}】各渠道加权盈亏变动测算与模拟`}
                        >
                          <Calculator className="w-3.5 h-3.5" />
                        </button>

                        {!isCompareMode && (
                          <ArrowUpRight className="w-3 h-3 text-slate-400 opacity-0 group-hover/major-card:opacity-100 transition-opacity shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isSurplus && (
                          <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold bg-indigo-500/15 text-indigo-500 dark:text-indigo-400">
                            +{item.surplus}人
                          </span>
                        )}
                        {isMet && !isSurplus && (
                          <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            已达标
                          </span>
                        )}
                        {!isMet && item.target > 0 && (
                          <span className={`text-[8px] px-1 py-0.2 rounded font-mono font-bold ${
                            isWarning ? "bg-rose-500/15 text-rose-500" : "bg-amber-500/15 text-amber-600"
                          }`}>
                            缺{item.gap}人
                          </span>
                        )}
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${rateBadgeStyle}`}>
                          {item.rate.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Micro Plan vs Actual Dual Progress Bar */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailModalMajor(item.name);
                      }}
                      className="mt-1.5 space-y-1 cursor-pointer group/progressbar hover:ring-1 hover:ring-indigo-500/30 p-1 rounded-lg transition-all"
                      title={`点击弹窗查看【${item.name}】各招生渠道详细数据统计与趋势分析`}
                    >
                      {/* Target Bar */}
                      <div className="flex items-center gap-1.5 text-[8px]">
                        <span className={`w-5 font-bold shrink-0 text-right ${
                          isHeatmapMode && heatStyle ? heatStyle.targetTextClass : "text-slate-400"
                        }`}>计划</span>
                        <div className={`relative flex-1 h-1.5 rounded-full overflow-hidden ${
                          isHeatmapMode && heatStyle ? heatStyle.trackBg : "bg-slate-200/80 dark:bg-slate-800"
                        }`}>
                          <div
                            className="h-full bg-blue-500/70 dark:bg-blue-600/80 rounded-full transition-all duration-300"
                            style={{ width: `${targetBarWidth}%` }}
                          />
                        </div>
                        <span className={`w-7 font-mono font-bold text-right shrink-0 ${
                          isHeatmapMode && heatStyle ? heatStyle.targetTextClass : "text-slate-400"
                        }`}>
                          {item.target}人
                        </span>
                      </div>

                      {/* Actual Bar */}
                      <div className="flex items-center gap-1.5 text-[8px]">
                        <span className={`w-5 font-bold shrink-0 text-right ${
                          isHeatmapMode && heatStyle ? heatStyle.actualTextClass : "text-slate-400"
                        }`}>实际</span>
                        <div className={`relative flex-1 h-2 rounded-full overflow-hidden flex items-center ${
                          isHeatmapMode && heatStyle ? heatStyle.trackBg : "bg-slate-200/60 dark:bg-slate-850"
                        }`}>
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${actualGradient} transition-all duration-400 shadow-2xs`}
                            style={{ width: `${actualBarWidth}%` }}
                          />
                          {/* Target line indicator */}
                          {item.target > 0 && targetBarWidth > 0 && targetBarWidth <= 100 && (
                            <div
                              className={`absolute top-0 bottom-0 w-0.5 z-10 shadow-xs ${
                                isHeatmapMode && heatStyle ? heatStyle.targetLineColor : "bg-indigo-600 dark:bg-indigo-400"
                              }`}
                              style={{ left: `${targetBarWidth}%` }}
                              title={`计划目标: ${item.target}人`}
                            />
                          )}
                        </div>
                        <span className={`w-7 font-mono font-extrabold text-right shrink-0 ${
                          isHeatmapMode && heatStyle
                            ? heatStyle.actualTextClass
                            : isMet 
                            ? (isDarkMode ? "text-emerald-400" : "text-emerald-600")
                            : isWarning 
                            ? (isDarkMode ? "text-rose-400" : "text-rose-600")
                            : (isDarkMode ? "text-amber-400" : "text-amber-600")
                        }`}>
                          {item.actual}人
                        </span>
                      </div>
                    </div>

                    {/* Micro Sparkline 7-Day Trend Chart */}
                    {(() => {
                      const trend7Data = get7DayTrendForMajor(item.name);
                      if (!trend7Data || trend7Data.length < 2) return null;

                      const actuals = trend7Data.map((d) => d.actual);
                      const maxActual = Math.max(...actuals, 1);
                      const minActual = Math.min(...actuals);
                      const range = (maxActual - minActual) || 1;

                      const width = 160;
                      const height = 20;
                      const pad = 3;

                      const points = trend7Data.map((d, i) => {
                        const x = pad + (i / (trend7Data.length - 1 || 1)) * (width - 2 * pad);
                        const y = height - pad - ((d.actual - minActual) / range) * (height - 2 * pad);
                        return { x, y, ...d };
                      });

                      const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
                      const areaD = `${pathD} L ${points[points.length - 1]?.x.toFixed(1) || 0} ${height - pad} L ${points[0]?.x.toFixed(1) || 0} ${height - pad} Z`;
                      
                      const firstVal = trend7Data[0]?.actual || 0;
                      const lastVal = trend7Data[trend7Data.length - 1]?.actual || 0;
                      const diffVal = lastVal - firstVal;
                      const isUp = diffVal >= 0;

                      return (
                        <div className="mt-2 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between gap-1.5 text-[8px]">
                          <div className="flex items-center gap-1 shrink-0 text-slate-500 dark:text-slate-400 font-medium">
                            <Activity className={`w-2.5 h-2.5 ${isUp ? "text-emerald-500" : "text-rose-500"}`} />
                            <span className="font-sans">7日趋势:</span>
                            <span className={`font-mono font-bold ${isUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                              {isUp ? `+${diffVal}` : diffVal}人
                            </span>
                          </div>

                          <div className="flex-1 h-4 relative flex items-center px-1" title={`近7天实际招生趋势: ${trend7Data.map(d => `${d.shortDate}: ${d.actual}人`).join(' → ')}`}>
                            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                              <defs>
                                <linearGradient id={`sparkGrad-${idx}-${item.name.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={isUp ? "#10b981" : "#f43f5e"} stopOpacity="0.3" />
                                  <stop offset="100%" stopColor={isUp ? "#10b981" : "#f43f5e"} stopOpacity="0.0" />
                                </linearGradient>
                              </defs>
                              <path d={areaD} fill={`url(#sparkGrad-${idx}-${item.name.replace(/\s+/g, '')})`} />
                              <path d={pathD} fill="none" stroke={isUp ? "#10b981" : "#f43f5e"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              {points.map((p, pIdx) => (
                                <circle
                                  key={`spark-pt-${item.name}-${pIdx}`}
                                  cx={p.x}
                                  cy={p.y}
                                  r={pIdx === points.length - 1 ? "2.5" : "1.5"}
                                  className={pIdx === points.length - 1 
                                    ? (isUp ? "fill-emerald-500 stroke-1 stroke-white dark:stroke-slate-900" : "fill-rose-500 stroke-1 stroke-white dark:stroke-slate-900")
                                    : (isDarkMode ? "fill-slate-600" : "fill-slate-400")
                                  }
                                />
                              ))}
                            </svg>
                          </div>

                          <span className="font-mono text-[7.5px] text-slate-400 dark:text-slate-500 shrink-0">
                            最新{lastVal}人
                          </span>
                        </div>
                      );
                    })()}

                    {/* Quick Fix Interactive Panel */}
                    <AnimatePresence>
                      {quickFixMajor === item.name && (
                        <motion.div
                          key={`quick-fix-panel-${item.name}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-2.5 p-2.5 rounded-lg border bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-800 shadow-lg space-y-2 text-[10px] overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between border-b pb-1.5 border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                              <Calculator className="w-3.5 h-3.5" />
                              <span>【{item.name}】进度智能精算与快速修正</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setQuickFixMajor(null)}
                              className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
                            <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                              <span className="text-slate-400 block">月度计划 / 实际完成</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{item.target} 人 / {item.actual} 人 ({item.rate.toFixed(1)}%)</span>
                            </div>
                            <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                              <span className="text-slate-400 block">月度时间进度 (第{currentDay}/{totalDays}天)</span>
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">{timeProgressPct}% (80%基线: {Math.ceil(item.expected80)}人)</span>
                            </div>
                          </div>

                          <div className="p-2 rounded-md bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
                            <div>
                              <div className="text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                                尚缺 <span className="font-mono text-xs text-rose-600 dark:text-rose-400 font-extrabold">{item.shortfall80}</span> 人追平80%基线 | 距全额100%差 <span className="font-mono text-xs font-bold">{item.shortfall100}</span> 人
                              </div>
                              <div className="text-slate-500 dark:text-slate-400 text-[8px] mt-0.5">
                                本月剩余 {remainingDays} 天，按平摊全额计划平均每日需达成: <strong className="font-mono text-rose-600 dark:text-rose-400 text-[10px] font-extrabold">{item.dailyNeeded}</strong> 人/天
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-1 text-[9px]">
                              <span className="text-slate-500 font-medium shrink-0">修正增量:</span>
                              <input
                                type="number"
                                min="1"
                                value={customFixAmount[item.name] ?? (item.shortfall80 > 0 ? item.shortfall80 : item.dailyNeeded)}
                                onChange={(e) => setCustomFixAmount({ ...customFixAmount, [item.name]: Math.max(1, parseInt(e.target.value, 10) || 0) })}
                                className="w-14 px-1 py-0.5 rounded border text-center font-mono font-bold bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-[10px]"
                              />
                              <span className="text-slate-500 shrink-0">人</span>
                            </div>

                            <div className="flex-1 flex gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => handleApplyQuickFix(item.name, "other")}
                                className="px-2 py-1 rounded text-[9px] font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                                title="将该增量直接填充至今日的【其他人员/补录】"
                              >
                                <Check className="w-3 h-3" />
                                <span>一键填充至「其他人员」</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApplyQuickFix(item.name, "channels")}
                                className="px-2 py-1 rounded text-[9px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                                title="将该增量均匀分摊填入今日的 7 大主要招生渠道"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>均分至主要渠道</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Inline Expandable Mini Channel Card & Table */}
                    <AnimatePresence>
                      {isInlineExpanded && (
                        <motion.div
                          key={`inline-channel-table-${item.name}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-2.5 pt-2 border-t dark:border-slate-800/80 border-slate-200/80 overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 mb-1.5">
                            <span className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400">
                              <Layers className="w-3 h-3" />
                              <span>全渠道目标与实际完成数微型数据表</span>
                            </span>
                            <span className="text-[8px] font-mono text-slate-400">
                              共 {channelNames.length + (item.other.actual > 0 ? 1 : 0)} 渠道
                            </span>
                          </div>

                          <div className={`rounded-md border overflow-hidden text-[9px] ${
                            isDarkMode ? "bg-slate-950/80 border-slate-800" : "bg-white border-slate-200"
                          }`}>
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className={`border-b font-bold text-slate-400 ${
                                  isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-slate-100/70 border-slate-200"
                                }`}>
                                  <th className="py-1 px-2">子渠道</th>
                                  <th className="py-1 px-2 text-right">目标</th>
                                  <th className="py-1 px-2 text-right">实际</th>
                                  <th className="py-1 px-2 text-right">达成率</th>
                                  <th className="py-1 px-2 w-16">进度</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y dark:divide-slate-800/60 divide-slate-150 font-mono">
                                {item.channels.map((ch, chIdx) => {
                                  const cName = channelNames[chIdx] || `渠道${chIdx + 1}`;
                                  const chRate = ch.target > 0 ? (ch.actual / ch.target) * 100 : 0;
                                  const chMet = ch.actual >= ch.target && ch.target > 0;

                                  return (
                                    <tr key={`ch-row-${item.name}-${cName}-${chIdx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                      <td className="py-1 px-2 font-bold font-sans text-slate-700 dark:text-slate-300">
                                        {cName}
                                      </td>
                                      <td className="py-1 px-2 text-right text-slate-500">
                                        {ch.target}人
                                      </td>
                                      <td className="py-1 px-2 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                                        {ch.actual}人
                                      </td>
                                      <td className="py-1 px-2 text-right font-bold">
                                        <span className={chMet ? "text-emerald-500" : ch.target > 0 ? "text-amber-500" : "text-slate-400"}>
                                          {chRate.toFixed(0)}%
                                        </span>
                                      </td>
                                      <td className="py-1 px-2">
                                        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                          <div
                                            className={`h-full rounded-full transition-all duration-300 ${
                                              chMet ? "bg-emerald-500" : "bg-amber-500"
                                            }`}
                                            style={{ width: `${Math.min(100, chRate)}%` }}
                                          />
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}

                                {item.other.actual > 0 && (
                                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                    <td className="py-1 px-2 font-bold font-sans text-slate-500">
                                      其它/补录
                                    </td>
                                    <td className="py-1 px-2 text-right text-slate-400">
                                      -
                                    </td>
                                    <td className="py-1 px-2 text-right font-extrabold text-indigo-500">
                                      {item.other.actual}人
                                    </td>
                                    <td className="py-1 px-2 text-right text-slate-400">
                                      100%
                                    </td>
                                    <td className="py-1 px-2">
                                      <div className="h-1.5 w-full rounded-full bg-indigo-500/30">
                                        <div className="h-full rounded-full bg-indigo-500 w-full" />
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Hover Sparkline & 7-Day Trend Tooltip Overlay */}
                    <AnimatePresence>
                      {hoveredMajorName === item.name && (() => {
                        const trend7Data = get7DayTrendForMajor(item.name);
                        const firstRate = trend7Data[0]?.rate || 0;
                        const lastRate = trend7Data[trend7Data.length - 1]?.rate || 0;
                        const rateDiff = lastRate - firstRate;

                        // Calculate growth rate velocity trend (daily increment speed)
                        const dailySpeeds = trend7Data.map((d) => d.actual);
                        const speedCount = dailySpeeds.length;
                        const halfLen = Math.max(1, Math.floor(speedCount / 2));
                        const firstHalfAvg = dailySpeeds.slice(0, halfLen).reduce((a, b) => a + b, 0) / halfLen;
                        const secondHalfAvg = dailySpeeds.slice(speedCount - halfLen).reduce((a, b) => a + b, 0) / halfLen;
                        const velocityDelta = Number((secondHalfAvg - firstHalfAvg).toFixed(1));

                        let paceStatus: "accelerating" | "steady" | "slowing" = "steady";
                        if (velocityDelta >= 0.8) {
                          paceStatus = "accelerating";
                        } else if (velocityDelta <= -0.8) {
                          paceStatus = "slowing";
                        } else {
                          paceStatus = "steady";
                        }

                        // Calculate growth rate metrics & expected thresholds
                        const actualDailyAvg = Number((item.actual / Math.max(1, currentDay)).toFixed(1));
                        const expectedDailyAvg = Number((item.target / Math.max(1, totalDays)).toFixed(1));
                        const dailyPaceGap = Number((expectedDailyAvg - actualDailyAvg).toFixed(1));
                        const isBelowExpectedGrowth = item.target > 0 && (actualDailyAvg < expectedDailyAvg || item.isAlert);

                        // Next 7 Days Forecast calculations based on momentum
                        const forecastDailyAvg = Math.max(0.2, Number((actualDailyAvg * (paceStatus === "accelerating" ? 1.15 : paceStatus === "slowing" ? 0.85 : 1.0)).toFixed(1)));
                        const forecastIncrement7d = Math.round(forecastDailyAvg * 7);
                        const forecastTotal7d = item.actual + forecastIncrement7d;
                        const forecastRate7d = item.target > 0 ? Math.min(100, Number(((forecastTotal7d / item.target) * 100).toFixed(1))) : 100;

                        // Find weakest channel for targeted advice
                        const weakestChannelObj = item.channels
                          .map((ch, cIdx) => ({
                            name: channelNames[cIdx] || `渠道${cIdx + 1}`,
                            target: ch.target,
                            actual: ch.actual,
                            rate: ch.target > 0 ? (ch.actual / ch.target) * 100 : 0
                          }))
                          .filter(c => c.target > 0 || c.actual > 0)
                          .sort((a, b) => a.rate - b.rate)[0];

                        // Rate Sparkline parameters (72% historical, 28% next 7d forecast)
                        const maxVal = Math.max(...trend7Data.map((d) => d.rate), forecastRate7d, 100);
                        const minVal = Math.min(0, ...trend7Data.map((d) => d.rate));
                        const range = (maxVal - minVal) || 1;
                        const width = 260;
                        const height = 40;
                        const pad = 6;
                        const histW = (width - 2 * pad) * 0.72;

                        const points = trend7Data.map((d, i) => {
                          const x = pad + (i / (trend7Data.length - 1 || 1)) * histW;
                          const y = height - pad - ((d.rate - minVal) / range) * (height - 2 * pad);
                          return { x, y, ...d };
                        });

                        const lastHistPoint = points[points.length - 1] || { x: pad + histW, y: height - pad };
                        const forecastX = width - pad;
                        const forecastY = height - pad - ((forecastRate7d - minVal) / range) * (height - 2 * pad);

                        const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
                        const areaD = `${pathD} L ${lastHistPoint.x.toFixed(1)} ${height - pad} L ${points[0]?.x.toFixed(1) || 0} ${height - pad} Z`;

                        const forecastPathD = `M ${lastHistPoint.x.toFixed(1)} ${lastHistPoint.y.toFixed(1)} L ${forecastX.toFixed(1)} ${forecastY.toFixed(1)}`;
                        const forecastAreaD = `M ${lastHistPoint.x.toFixed(1)} ${lastHistPoint.y.toFixed(1)} L ${forecastX.toFixed(1)} ${forecastY.toFixed(1)} L ${forecastX.toFixed(1)} ${height - pad} L ${lastHistPoint.x.toFixed(1)} ${height - pad} Z`;

                        // Velocity Sparkline parameters (72% historical, 28% next 7d forecast)
                        const maxSpeed = Math.max(...dailySpeeds, forecastDailyAvg, 1);
                        const minSpeed = Math.min(0, ...dailySpeeds, forecastDailyAvg);
                        const speedRange = (maxSpeed - minSpeed) || 1;
                        const speedW = 260;
                        const speedH = 34;
                        const speedP = 6;
                        const speedHistW = (speedW - 2 * speedP) * 0.72;

                        const speedPoints = dailySpeeds.map((sVal, i) => {
                          const x = speedP + (i / (dailySpeeds.length - 1 || 1)) * speedHistW;
                          const y = speedH - speedP - ((sVal - minSpeed) / speedRange) * (speedH - 2 * speedP);
                          return { x, y, speed: sVal, shortDate: trend7Data[i]?.shortDate || "" };
                        });

                        const lastSpeedP = speedPoints[speedPoints.length - 1] || { x: speedP + speedHistW, y: speedH - speedP };
                        const speedForecastX = speedW - speedP;
                        const speedForecastY = speedH - speedP - ((forecastDailyAvg - minSpeed) / speedRange) * (speedH - 2 * speedP);

                        const speedPathD = speedPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
                        const speedAreaD = `${speedPathD} L ${lastSpeedP.x.toFixed(1)} ${speedH - speedP} L ${speedPoints[0]?.x.toFixed(1) || 0} ${speedH - speedP} Z`;

                        const speedForecastPathD = `M ${lastSpeedP.x.toFixed(1)} ${lastSpeedP.y.toFixed(1)} L ${speedForecastX.toFixed(1)} ${speedForecastY.toFixed(1)}`;

                        const velocityColor = paceStatus === "accelerating" ? "#10b981" : paceStatus === "slowing" ? "#f59e0b" : "#6366f1";

                        return (
                          <motion.div
                            key={`hover-tooltip-${item.name}-${idx}`}
                            initial={{ opacity: 0, y: idx === 0 ? -10 : 10, scale: 0.93 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: idx === 0 ? -8 : 8, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 450, damping: 28, mass: 0.8 }}
                            className={`absolute ${idx === 0 ? "top-full mt-2" : "bottom-full mb-2"} left-1/2 -translate-x-1/2 z-50 w-80 pointer-events-none p-3 rounded-xl border shadow-2xl backdrop-blur-md ${
                              isDarkMode
                                ? "bg-slate-900/95 border-slate-700 text-slate-100 shadow-slate-950/90"
                                : "bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/80"
                            }`}
                          >
                            <div className="space-y-2">
                              {/* Header */}
                              <div className="flex items-center justify-between border-b pb-1.5 border-slate-200/80 dark:border-slate-800">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Activity className="w-3.5 h-3.5 text-indigo-500 animate-pulse shrink-0" />
                                  <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate max-w-[160px]">
                                    【{item.name}】
                                  </span>
                                </div>
                                <span
                                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded font-mono shrink-0 ${
                                    rateDiff >= 0
                                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                      : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                                  }`}
                                >
                                  {rateDiff >= 0 ? `📈 近7日 +${rateDiff.toFixed(1)}%` : `📉 近7日 ${rateDiff.toFixed(1)}%`}
                                </span>
                              </div>

                              {/* 1. Completion Rate Path */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[8.5px] text-slate-400">
                                  <div className="flex items-center gap-1.5">
                                    <span>近7日达成率与延伸预测</span>
                                    <span className="text-[7.5px] px-1 py-0.2 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 font-mono font-semibold border border-purple-500/20">
                                      虚线: 未来7天预测
                                    </span>
                                  </div>
                                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                    当前达成: {item.rate.toFixed(1)}%
                                  </span>
                                </div>

                                <div className="relative bg-slate-100/60 dark:bg-slate-950/60 rounded-lg p-1 border border-slate-200/50 dark:border-slate-800/50">
                                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10 overflow-visible">
                                    <defs>
                                      <linearGradient id={`sparkGrad-${idx}-${item.name.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                                      </linearGradient>
                                      <linearGradient id={`forecastGrad-${idx}-${item.name.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
                                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                                      </linearGradient>
                                    </defs>

                                    {/* Historical Area & Line */}
                                    <path d={areaD} fill={`url(#sparkGrad-${idx}-${item.name.replace(/\s+/g, '')})`} />
                                    <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                                    {/* Forecast Area & Dashed Line */}
                                    <path d={forecastAreaD} fill={`url(#forecastGrad-${idx}-${item.name.replace(/\s+/g, '')})`} />
                                    <path d={forecastPathD} fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" strokeLinejoin="round" />

                                    {/* Historical to Forecast Divider */}
                                    <line x1={lastHistPoint.x} y1={pad} x2={lastHistPoint.x} y2={height - pad} stroke="#6366f1" strokeOpacity="0.3" strokeDasharray="2 2" />

                                    {/* Historical Points */}
                                    {points.map((p, pIdx) => (
                                      <g key={`pt-${item.name}-${p.date}-${pIdx}`}>
                                        <circle
                                          cx={p.x}
                                          cy={p.y}
                                          r={pIdx === points.length - 1 ? "3.5" : "2"}
                                          className={
                                            pIdx === points.length - 1
                                              ? "fill-indigo-500 stroke-2 stroke-white dark:stroke-slate-900"
                                              : "fill-indigo-400"
                                          }
                                        />
                                      </g>
                                    ))}

                                    {/* Forecast Target Point (+7d) */}
                                    <g>
                                      <circle cx={forecastX} cy={forecastY} r="3.5" fill="#a855f7" className="animate-pulse" />
                                      <circle cx={forecastX} cy={forecastY} r="1.8" fill="#ffffff" />
                                      <text x={forecastX} y={Math.max(pad + 6, forecastY - 5)} textAnchor="end" fontSize="7" fontWeight="bold" fill="#a855f7">
                                        {forecastRate7d.toFixed(0)}%
                                      </text>
                                    </g>
                                  </svg>
                                </div>
                              </div>

                              {/* 2. Daily Growth Rate Sparkline & Velocity State */}
                              <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                                <div className="flex items-center justify-between text-[8.5px]">
                                  <span className="text-slate-400 font-medium">日均增长速率 (Sparkline)</span>
                                  <span className={`px-1.5 py-0.2 rounded font-mono text-[8px] font-bold flex items-center gap-1 border ${
                                    paceStatus === "accelerating"
                                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                      : paceStatus === "slowing"
                                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                      : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30"
                                  }`}>
                                    {paceStatus === "accelerating" ? (
                                      <>
                                        <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />
                                        <span>🚀 加速增长 ({velocityDelta > 0 ? `+${velocityDelta}` : velocityDelta}人/天)</span>
                                      </>
                                    ) : paceStatus === "slowing" ? (
                                      <>
                                        <TrendingDown className="w-3 h-3 text-amber-500 shrink-0" />
                                        <span>📉 增长放缓 ({velocityDelta}人/天)</span>
                                      </>
                                    ) : (
                                      <>
                                        <Activity className="w-3 h-3 text-indigo-500 shrink-0" />
                                        <span>⚖️ 保持平稳 ({velocityDelta >= 0 ? `+${velocityDelta}` : velocityDelta}人/天)</span>
                                      </>
                                    )}
                                  </span>
                                </div>

                                <div className="relative bg-slate-100/60 dark:bg-slate-950/60 rounded-lg p-1 border border-slate-200/50 dark:border-slate-800/50">
                                  <svg viewBox={`0 0 ${speedW} ${speedH}`} className="w-full h-8 overflow-visible">
                                    <defs>
                                      <linearGradient id={`velGrad-${idx}-${item.name.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={velocityColor} stopOpacity="0.4" />
                                        <stop offset="100%" stopColor={velocityColor} stopOpacity="0.0" />
                                      </linearGradient>
                                    </defs>
                                    <path d={speedAreaD} fill={`url(#velGrad-${idx}-${item.name.replace(/\s+/g, '')})`} />
                                    <path d={speedPathD} fill="none" stroke={velocityColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d={speedForecastPathD} fill="none" stroke={velocityColor} strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" strokeLinejoin="round" />
                                    {speedPoints.map((sp, spIdx) => (
                                      <g key={`sp-${item.name}-${sp.shortDate}-${spIdx}`}>
                                        <circle
                                          cx={sp.x}
                                          cy={sp.y}
                                          r={spIdx === speedPoints.length - 1 ? "3" : "1.8"}
                                          fill={velocityColor}
                                        />
                                      </g>
                                    ))}
                                    <circle cx={speedForecastX} cy={speedForecastY} r="2.5" fill={velocityColor} className="animate-ping" />
                                    <circle cx={speedForecastX} cy={speedForecastY} r="2.5" fill={velocityColor} />
                                  </svg>
                                </div>
                              </div>

                              {/* 7-Day Micro Grid */}
                              <div className="grid grid-cols-7 gap-1 pt-0.5 text-center font-mono">
                                {trend7Data.map((d, dIdx) => (
                                  <div
                                    key={`mini-d-${item.name}-${d.date}-${dIdx}`}
                                    className="p-1 rounded bg-slate-100/80 dark:bg-slate-800/80 text-[8px] flex flex-col justify-between"
                                  >
                                    <span className="text-slate-400 text-[7px] block">{d.shortDate}</span>
                                    <span
                                      className={`font-bold block mt-0.5 ${
                                        d.rate >= 100
                                          ? "text-emerald-600 dark:text-emerald-400"
                                          : d.rate >= 50
                                          ? "text-indigo-600 dark:text-indigo-400"
                                          : "text-amber-600 dark:text-amber-400"
                                      }`}
                                    >
                                      {d.rate.toFixed(0)}%
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* 3. Next Week Forecast Module (未来一周预测) */}
                              <div className="mt-2 p-2 rounded-lg border text-[9px] bg-purple-950/20 dark:bg-purple-950/40 border-purple-500/30 text-purple-900 dark:text-purple-200">
                                <div className="flex items-center justify-between font-bold pb-1 border-b border-purple-500/20">
                                  <div className="flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse shrink-0" />
                                    <span className="font-extrabold text-purple-700 dark:text-purple-300">🔮 未来一周预测 (7天招生趋势)</span>
                                  </div>
                                  <span className="px-1.5 py-0.2 rounded font-mono text-[8px] font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                                    推算+7天
                                  </span>
                                </div>

                                <div className="grid grid-cols-3 gap-1 my-1.5 text-center font-mono text-[8.5px]">
                                  <div className="p-1 rounded bg-black/5 dark:bg-white/5">
                                    <span className="block text-[7.5px] opacity-70">预计7天增量</span>
                                    <strong className="text-purple-600 dark:text-purple-300 font-extrabold">
                                      +{forecastIncrement7d} 人
                                    </strong>
                                  </div>
                                  <div className="p-1 rounded bg-black/5 dark:bg-white/5">
                                    <span className="block text-[7.5px] opacity-70">预测总人数</span>
                                    <strong className="text-slate-800 dark:text-slate-200 font-bold">
                                      {forecastTotal7d} 人
                                    </strong>
                                  </div>
                                  <div className="p-1 rounded bg-black/5 dark:bg-white/5">
                                    <span className="block text-[7.5px] opacity-70">预测达成率</span>
                                    <strong className="text-purple-600 dark:text-purple-300 font-extrabold">
                                      {forecastRate7d.toFixed(1)}%
                                    </strong>
                                  </div>
                                </div>

                                <div className="pt-1 border-t border-purple-500/15 text-[8.5px] leading-tight flex items-start gap-1">
                                  <Activity className="w-3 h-3 text-purple-500 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-bold">7天趋势结论：</span>
                                    <span>
                                      {forecastRate7d >= 100
                                        ? `按当前动量推算，未来7天内将提前冲破100%招生目标！`
                                        : forecastRate7d >= ((currentDay + 7) / totalDays) * 100
                                        ? `按当前速度7天后完成率达 ${forecastRate7d.toFixed(1)}%，符合阶段目标进度。`
                                        : `按当前速度7天后仍有 ${Math.max(0, item.target - forecastTotal7d)} 人缺口，建议加大资源投入与宣传力度。`}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Dynamic Growth Rate Warning & Optimization Suggestion Module */}
                              <div className={`mt-2 p-2 rounded-lg border text-[9px] ${
                                isBelowExpectedGrowth
                                  ? (isDarkMode ? "bg-rose-950/50 border-rose-800/80 text-rose-200" : "bg-rose-50/90 border-rose-200 text-rose-950")
                                  : (isDarkMode ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-200" : "bg-emerald-50/90 border-emerald-200 text-emerald-950")
                              }`}>
                                <div className="flex items-center justify-between font-bold pb-1 border-b border-current/15">
                                  <div className="flex items-center gap-1">
                                    {isBelowExpectedGrowth ? (
                                      <>
                                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
                                        <span className="text-rose-600 dark:text-rose-400 font-extrabold">🚨 增长速率告急预警</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">✅ 日均增长正常符合预期</span>
                                      </>
                                    )}
                                  </div>
                                  <span className={`px-1.5 py-0.2 rounded font-mono text-[8px] font-bold ${
                                    isBelowExpectedGrowth
                                      ? "bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-400/30"
                                      : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-400/30"
                                  }`}>
                                    {isBelowExpectedGrowth ? "红色警示" : "健康推进"}
                                  </span>
                                </div>

                                <div className="grid grid-cols-3 gap-1 my-1.5 text-center font-mono text-[8.5px]">
                                  <div className="p-1 rounded bg-black/5 dark:bg-white/5">
                                    <span className="block text-[7.5px] opacity-70">实际日均</span>
                                    <strong className={isBelowExpectedGrowth ? "text-rose-600 dark:text-rose-400 font-extrabold" : "text-emerald-600 dark:text-emerald-400 font-extrabold"}>
                                      {actualDailyAvg} 人/天
                                    </strong>
                                  </div>
                                  <div className="p-1 rounded bg-black/5 dark:bg-white/5">
                                    <span className="block text-[7.5px] opacity-70">目标速线</span>
                                    <strong className="text-slate-700 dark:text-slate-300 font-bold">
                                      {expectedDailyAvg} 人/天
                                    </strong>
                                  </div>
                                  <div className="p-1 rounded bg-black/5 dark:bg-white/5">
                                    <span className="block text-[7.5px] opacity-70">{isBelowExpectedGrowth ? "每日差距" : "剩余需达成"}</span>
                                    <strong className={isBelowExpectedGrowth ? "text-rose-600 dark:text-rose-400 font-extrabold" : "text-indigo-600 dark:text-indigo-400 font-extrabold"}>
                                      {isBelowExpectedGrowth ? `-${dailyPaceGap > 0 ? dailyPaceGap : 0.1}` : `${item.dailyNeeded}`} 人/天
                                    </strong>
                                  </div>
                                </div>

                                <div className="pt-1 border-t border-current/10 text-[8.5px] leading-tight flex items-start gap-1">
                                  <Wrench className={`w-3 h-3 shrink-0 mt-0.5 ${isBelowExpectedGrowth ? "text-rose-500" : "text-emerald-500"}`} />
                                  <div>
                                    <span className="font-bold block mb-0.5">优化建议：</span>
                                    {isBelowExpectedGrowth ? (
                                      <span>
                                        {weakestChannelObj && weakestChannelObj.rate < 70
                                          ? `主要瓶颈在【${weakestChannelObj.name}】(完成率仅${weakestChannelObj.rate.toFixed(0)}%)。建议重点优化其线索跟进与推广落地，或点击卡片『快速修正』按钮补足每日基线。`
                                          : `当前招募速率较预期目标落后 ${dailyPaceGap > 0 ? dailyPaceGap : 0.1} 人/天，建议开展线上面对面宣讲与资源二次激活，并在顶部一键补齐任务。`}
                                      </span>
                                    ) : (
                                      <span>
                                        当前专业招募稳步推进，建议保持现有主力渠道投产比，防范月末跟进脱节。
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
            )}

            {/* Show All / Collapse Toggle Button (Standard view only) */}
            {layoutViewMode === "standard" && majorsData.length > defaultShowCount && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full py-1 text-center font-bold text-[9px] rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer border ${
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
                    <span>展开查看全部 {majorsData.length} 个专业</span>
                  </>
                )}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Comparison Drawer Modal */}
      <AnimatePresence>
        {showCompareDrawer && majorA && majorB && (() => {
          // Compute Heatmap channels ranking by completion rate gap
          const heatmapChannels = channelNames.map((cName, cIdx) => {
            const chA = majorA.channels[cIdx] || { target: 0, actual: 0 };
            const chB = majorB.channels[cIdx] || { target: 0, actual: 0 };
            const rateA = chA.target > 0 ? (chA.actual / chA.target) * 100 : 0;
            const rateB = chB.target > 0 ? (chB.actual / chB.target) * 100 : 0;
            const rateDiff = Math.abs(rateA - rateB);
            const actualDiff = chA.actual - chB.actual;
            const leader = rateA >= rateB ? majorA.name : majorB.name;
            return { cName, cIdx, chA, chB, rateA, rateB, rateDiff, actualDiff, leader };
          }).sort((a, b) => b.rateDiff - a.rateDiff);

          const maxChannelRateDiff = Math.max(...heatmapChannels.map(d => d.rateDiff), 1);
          const maxGapChannelName = heatmapChannels[0]?.cName;

          const handleExportReport = () => {
            const actualDiff = majorA.actual - majorB.actual;
            const rateDiff = majorA.rate - majorB.rate;

            const reportLines = [
              `====================================================`,
              `      【双专业全渠道招特效能 PK 对比与差异分析报告】`,
              `====================================================`,
              `生成时间: ${new Date().toLocaleString('zh-CN')}`,
              `统计视角: ${viewMode === "daily" ? `单日模式 (${selectedDate})` : `月度累计全量 (${selectedDate})`}`,
              `对比专业: 【${majorA.name}】 VS 【${majorB.name}】`,
              `----------------------------------------------------`,
              ``,
              `【一、 总体招特效能汇总 (Overall Delta Summary)】`,
              `1. 【${majorA.name}】:`,
              `   - 计划招生: ${majorA.target} 人`,
              `   - 实际完成: ${majorA.actual} 人`,
              `   - 综合达成率: ${majorA.rate.toFixed(1)}%`,
              ``,
              `2. 【${majorB.name}】:`,
              `   - 计划招生: ${majorB.target} 人`,
              `   - 实际完成: ${majorB.actual} 人`,
              `   - 综合达成率: ${majorB.rate.toFixed(1)}%`,
              ``,
              `3. 效能差值:`,
              `   - 实际人数差值: ${actualDiff >= 0 ? `${majorA.name} 领先 +${actualDiff}` : `${majorB.name} 领先 +${Math.abs(actualDiff)}`} 人`,
              `   - 综合达成率差值: ${rateDiff >= 0 ? `${majorA.name} 领先 +${rateDiff.toFixed(1)}%` : `${majorB.name} 领先 +${Math.abs(rateDiff).toFixed(1)}%`}`,
              ``,
              `----------------------------------------------------`,
              `【二、 渠道达成率「差异热图」分析排名 (Heatmap Ranking)】`,
              ...heatmapChannels.map((item, idx) => {
                const rank = idx + 1;
                const tag = rank === 1 ? "🔥 [极差最大渠道]" : item.rateDiff >= 25 ? "⚡ [显著悬殊]" : "🟢 [相对平衡]";
                return `${rank}. 【${item.cName}】 ${tag}\n   - 达成率差值: ${item.rateDiff.toFixed(1)}% | 优势方: 【${item.leader}】\n   - 详细比对: [${majorA.name}: ${item.rateA.toFixed(1)}% (${item.chA.actual}/${item.chA.target}人)] vs [${majorB.name}: ${item.rateB.toFixed(1)}% (${item.chB.actual}/${item.chB.target}人)]`;
              }),
              ``,
              `----------------------------------------------------`,
              `【三、 全渠道详细招生目标与实际明细】`,
              ...channelNames.map((cName, idx) => {
                const chA = majorA.channels[idx] || { target: 0, actual: 0 };
                const chB = majorB.channels[idx] || { target: 0, actual: 0 };
                const rA = chA.target > 0 ? (chA.actual / chA.target) * 100 : 0;
                const rB = chB.target > 0 ? (chB.actual / chB.target) * 100 : 0;
                return `▶ 渠道: [${cName}]\n   - ${majorA.name}: 计划 ${chA.target}人 | 实际 ${chA.actual}人 | 达成率 ${rA.toFixed(1)}%\n   - ${majorB.name}: 计划 ${chB.target}人 | 实际 ${chB.actual}人 | 达成率 ${rB.toFixed(1)}%\n   - 差值: 实际人数 ${chA.actual - chB.actual >= 0 ? `+${chA.actual - chB.actual}` : `${chA.actual - chB.actual}`}人 | 达成率极差 ${Math.abs(rA - rB).toFixed(1)}%`;
              }),
              ``,
              `====================================================`,
              ` 报告由招办数智决策看板系统自动生成`,
              `====================================================`
            ];

            const blob = new Blob([reportLines.join('\n')], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `专业招生PK对比分析报告_${majorA.name}_VS_${majorB.name}_${selectedDate}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setShowExportToast(true);
            setTimeout(() => setShowExportToast(false), 3000);
          };

          return (
            <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex justify-end">
              <motion.div
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`w-full max-w-xl h-full shadow-2xl flex flex-col border-l overflow-hidden ${
                  isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                }`}
              >
                {/* Header */}
                <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
                  isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm flex items-center gap-2">
                        双专业全渠道招特效能 PK 对比
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        细化分析各渠道「计划 vs 实际」及关键招生差值 (Delta)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* One-click Export Report Button in Header */}
                    <button
                      type="button"
                      onClick={handleExportReport}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="导出此对比分析报告 (.txt)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>导出对比报告</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCompareDrawer(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 thin-scrollbar">
                  {/* Export Success Notification Toast */}
                  <AnimatePresence>
                    {showExportToast && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span>已成功导出【{majorA.name} VS {majorB.name}】对比分析报告！</span>
                        </div>
                        <span className="text-[10px] opacity-75 font-mono">文本/明细已保存</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Major A vs Major B Top Cards */}
                  <div className="grid grid-cols-2 gap-3 relative">
                    {/* VS Badge Floating in Middle */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-indigo-600 text-white font-extrabold text-[10px] flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900">
                      VS
                    </div>

                    {/* Major A Overview Card */}
                    <div className={`p-3 rounded-xl border relative space-y-1.5 ${
                      isDarkMode ? "bg-emerald-950/30 border-emerald-800/60" : "bg-emerald-50/80 border-emerald-200"
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                          专业 1 (Major A)
                        </span>
                        <button
                          type="button"
                          onClick={() => setDetailModalMajor(majorA.name)}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30 transition-colors cursor-pointer flex items-center gap-1"
                          title={`全屏查看【${majorA.name}】渠道折线图与达成路径`}
                        >
                          <LineChart className="w-3 h-3" />
                          <span>拆解图</span>
                        </button>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate" title={majorA.name}>
                        {majorA.name}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] pt-1">
                        <span className="text-slate-500">总实际/总计划:</span>
                        <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                          {majorA.actual} / {majorA.target}人
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">总达成率:</span>
                        <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                          {majorA.rate.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Major B Overview Card */}
                    <div className={`p-3 rounded-xl border relative space-y-1.5 ${
                      isDarkMode ? "bg-indigo-950/30 border-indigo-800/60" : "bg-indigo-50/80 border-indigo-200"
                    }`}>
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setDetailModalMajor(majorB.name)}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/30 transition-colors cursor-pointer flex items-center gap-1"
                          title={`全屏查看【${majorB.name}】渠道折线图与达成路径`}
                        >
                          <LineChart className="w-3 h-3" />
                          <span>拆解图</span>
                        </button>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block text-right">
                          专业 2 (Major B)
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate text-right" title={majorB.name}>
                        {majorB.name}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] pt-1">
                        <span className="text-slate-500">总实际/总计划:</span>
                        <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                          {majorB.actual} / {majorB.target}人
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">总达成率:</span>
                        <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                          {majorB.rate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Overall Delta Highlight Banner */}
                  {(() => {
                    const actualDiff = majorA.actual - majorB.actual;
                    const rateDiff = majorA.rate - majorB.rate;
                    const targetDiff = majorA.target - majorB.target;

                    return (
                      <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                        isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}>
                        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                          <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>总体招特效能差值 (Overall Summary Delta):</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[10px] pt-1 font-mono">
                          <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-slate-400 block text-[9px]">实际人数差值</span>
                            <span className={`font-extrabold ${actualDiff >= 0 ? "text-emerald-500" : "text-indigo-500"}`}>
                              {actualDiff >= 0 ? `A 多 +${actualDiff}人` : `B 多 +${Math.abs(actualDiff)}人`}
                            </span>
                          </div>
                          <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-slate-400 block text-[9px]">计划配额差值</span>
                            <span className="font-bold text-slate-600 dark:text-slate-300">
                              {targetDiff >= 0 ? `A 多 +${targetDiff}人` : `B 多 +${Math.abs(targetDiff)}人`}
                            </span>
                          </div>
                          <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-slate-400 block text-[9px]">达成率差值</span>
                            <span className={`font-extrabold ${rateDiff >= 0 ? "text-emerald-500" : "text-indigo-500"}`}>
                              {rateDiff >= 0 ? `A 高 +${rateDiff.toFixed(1)}%` : `B 高 +${Math.abs(rateDiff).toFixed(1)}%`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 差异热图 (Divergence Heatmap) Section */}
                  <div className={`p-3.5 rounded-xl border space-y-3 ${
                    isDarkMode ? "bg-slate-950/90 border-amber-900/40" : "bg-gradient-to-br from-amber-50/90 to-orange-50/70 border-amber-200/90 shadow-2xs"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                          全渠道达成率「差异热图」分析
                        </span>
                      </div>
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/30">
                        自动高亮达成率悬殊渠道
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      热图基于【{majorA.name}】与【{majorB.name}】在各渠道的达成率极差自动评级高亮。红色代表极差放大，黄色代表中等偏差。
                    </p>

                    <div className="space-y-2 pt-1">
                      {heatmapChannels.map((item, idx) => {
                        const heatPercent = Math.min(100, (item.rateDiff / maxChannelRateDiff) * 100);
                        let heatBg = "from-amber-500 to-orange-500";
                        let badgeStyle = "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300/40";

                        if (item.rateDiff >= 25) {
                          heatBg = "from-rose-500 to-red-600";
                          badgeStyle = "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-400/40 font-extrabold";
                        } else if (item.rateDiff < 10) {
                          heatBg = "from-slate-400 to-emerald-400";
                          badgeStyle = "bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300/40";
                        }

                        return (
                          <div key={`heatmap-item-${item.cName}-${idx}`} className="space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {item.cName}
                                </span>
                                {idx === 0 && (
                                  <span className="text-[8px] px-1.5 py-0.2 rounded bg-rose-500 text-white font-extrabold shadow-2xs flex items-center gap-0.5">
                                    <Flame className="w-2.5 h-2.5" />
                                    <span>最大极差</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 font-mono text-[10px]">
                                <span className="text-slate-400">
                                  A({item.rateA.toFixed(0)}%) vs B({item.rateB.toFixed(0)}%)
                                </span>
                                <span className={`px-1.5 py-0.2 rounded border ${badgeStyle}`}>
                                  差 {item.rateDiff.toFixed(1)}% ({item.leader}领先)
                                </span>
                              </div>
                            </div>

                            {/* Heat bar */}
                            <div className="h-2 w-full rounded-full bg-slate-200/70 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${heatBg} transition-all duration-300`}
                                style={{ width: `${Math.max(6, heatPercent)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Channel-by-Channel Breakdown Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <BarChart2 className="w-4 h-4 text-indigo-500" />
                        分渠道目标与完成情况明细对比 (Channel Comparison)
                      </span>
                    </div>

                    <div className="space-y-2">
                      {channelNames.map((cName, cIdx) => {
                        const chA = majorA.channels[cIdx] || { target: 0, actual: 0 };
                        const chB = majorB.channels[cIdx] || { target: 0, actual: 0 };

                        const rateA = chA.target > 0 ? (chA.actual / chA.target) * 100 : 0;
                        const rateB = chB.target > 0 ? (chB.actual / chB.target) * 100 : 0;

                        const diffActual = chA.actual - chB.actual;
                        const isMaxGap = cName === maxGapChannelName;
                        const maxChVal = Math.max(chA.target, chA.actual, chB.target, chB.actual, 1);

                        return (
                          <div
                            key={`compare-ch-${cName}-${cIdx}`}
                            className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                              isMaxGap
                                ? (isDarkMode ? "bg-rose-950/20 border-rose-800/80 shadow-rose-950/30" : "bg-rose-50/40 border-rose-300 shadow-rose-100")
                                : (isDarkMode ? "bg-slate-950/60 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs")
                            }`}
                          >
                            {/* Channel Title & Diff Tag */}
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isMaxGap ? "bg-rose-500" : "bg-indigo-500"}`} />
                                <span>{cName}</span>
                                {isMaxGap && (
                                  <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-rose-500 text-white flex items-center gap-0.5">
                                    <Flame className="w-2.5 h-2.5" />
                                    <span>差异最大</span>
                                  </span>
                                )}
                              </span>

                              <div className="flex items-center gap-1 text-[10px] font-mono font-bold">
                                {diffActual === 0 ? (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">
                                    实际持平 (0)
                                  </span>
                                ) : diffActual > 0 ? (
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                    A 领先 +{diffActual}人
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                                    B 领先 +{Math.abs(diffActual)}人
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Major A Channel Stats */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[140px]">
                                  【{majorA.name}】
                                </span>
                                <span className="font-mono text-slate-500">
                                  计划: {chA.target}人 | 实际: <strong className="text-emerald-600 dark:text-emerald-400">{chA.actual}人</strong> ({rateA.toFixed(0)}%)
                                </span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                  style={{ width: `${(chA.actual / maxChVal) * 100}%` }}
                                />
                              </div>
                            </div>

                            {/* Major B Channel Stats */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[140px]">
                                  【{majorB.name}】
                                </span>
                                <span className="font-mono text-slate-500">
                                  计划: {chB.target}人 | 实际: <strong className="text-indigo-600 dark:text-indigo-400">{chB.actual}人</strong> ({rateB.toFixed(0)}%)
                                </span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                                  style={{ width: `${(chB.actual / maxChVal) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Other Channel Breakdown if present */}
                      {(majorA.other.actual > 0 || majorB.other.actual > 0) && (
                        <div className={`p-3 rounded-xl border text-xs space-y-2 ${
                          isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-white border-slate-200/80"
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              其他/补录渠道
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              差值: {majorA.other.actual - majorB.other.actual > 0 ? `A 多 +${majorA.other.actual - majorB.other.actual}人` : `B 多 +${Math.abs(majorA.other.actual - majorB.other.actual)}人`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span>【{majorA.name}】: {majorA.other.actual}人</span>
                            <span>【{majorB.name}】: {majorB.other.actual}人</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Drawer Footer Actions */}
                <div className={`p-4 border-t flex items-center justify-between shrink-0 ${
                  isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-150"
                }`}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCompareMajors([]);
                      setShowCompareDrawer(false);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    清除已选对比专业
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportReport}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>一键导出分析报告</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCompareDrawer(false)}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-xs"
                    >
                      完成对比并关闭
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Fullscreen Major Channel Breakdown & Target Path Modal */}
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
      {/* Search & Select Comparison Major Modal */}
      <AnimatePresence>
        {showSearchSelectModal && (
          <div key="search-select-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
            <motion.div
              key="search-select-modal-panel"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
                isDarkMode ? "bg-slate-900 border-indigo-500/30 text-slate-100" : "bg-white border-indigo-150 text-slate-900"
              }`}
            >
              {/* Modal Header */}
              <div className={`p-4 border-b flex items-center justify-between ${
                isDarkMode ? "bg-slate-950/90 border-slate-800" : "bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border-indigo-100"
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>检索并添加对比专业</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                        {filteredModalCandidates.length} 个可选专业
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                      支持全校现有录入专业与 7 大热门标杆数据库，选中后将自动刷新双列对比 PK 视图
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSearchSelectModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search & Filter Controls */}
              <div className="p-4 border-b border-current/10 space-y-2.5 bg-black/2 dark:bg-white/2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={modalSearchKeyword}
                    onChange={(e) => setModalSearchKeyword(e.target.value)}
                    placeholder="输入专业名称、学科类型或描述关键词 (如: 软件工程、计算机、健康...)..."
                    className={`w-full pl-9 pr-8 py-2 text-xs rounded-xl border outline-none transition-all ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-700 text-slate-100 focus:border-indigo-500"
                        : "bg-white border-slate-200 text-slate-900 focus:border-indigo-500 shadow-2xs"
                    }`}
                    autoFocus
                  />
                  {modalSearchKeyword && (
                    <button
                      type="button"
                      onClick={() => setModalSearchKeyword("")}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 text-xs">
                  {["全部", "表内现有专业", "新兴热门", "热门工科", "高增长专业", "医药健康", "数字艺术", "标杆基准"].map((cat, idx) => (
                    <button
                      key={`modal-cat-${cat}-${idx}`}
                      type="button"
                      onClick={() => setModalCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        modalCategory === cat
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-black/5 dark:bg-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Candidate Majors List */}
              <div className="p-4 overflow-y-auto space-y-2 flex-1 scrollbar-thin">
                {filteredModalCandidates.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Compass className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 animate-spin-slow" />
                    <p className="text-xs">未找到匹配关键词【{modalSearchKeyword}】的专业</p>
                  </div>
                ) : (
                  filteredModalCandidates.map((bench, idx) => {
                    const currentAName = dualMajorA || majorsData[0]?.name || "";
                    const currentBName = dualMajorB || majorsData[1]?.name || majorsData[0]?.name || "";
                    const isSelectedA = currentAName === bench.name;
                    const isSelectedB = currentBName === bench.name && currentAName !== currentBName;
                    const rate = bench.target > 0 ? (bench.actual / bench.target) * 100 : 0;

                    return (
                      <div
                        key={`modal-bench-${bench.name}-${idx}`}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isSelectedB
                            ? "border-purple-500 bg-purple-500/10"
                            : isSelectedA
                            ? "border-indigo-500/50 bg-indigo-500/5"
                            : isDarkMode
                            ? "border-slate-800 bg-slate-950/60 hover:border-indigo-500/50 hover:bg-slate-800/80"
                            : "border-slate-200/90 bg-slate-50/70 hover:border-indigo-300 hover:bg-indigo-50/40"
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                              【{bench.name}】
                            </h4>
                            <span className="text-[9px] px-1.5 py-0.3 rounded bg-black/5 dark:bg-white/10 font-bold text-slate-500 dark:text-slate-400 shrink-0">
                              {bench.category}
                            </span>
                            {isSelectedA && (
                              <span className="text-[9px] px-1.5 py-0.3 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                                当前为专业 A
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 font-sans">
                            {bench.description}
                          </p>
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-3">
                            <span>目标招收: <strong>{bench.target}人</strong></span>
                            <span>实际已报: <strong className="text-indigo-600 dark:text-indigo-400">{bench.actual}人</strong></span>
                            <span>完成率: <strong className="text-emerald-600 dark:text-emerald-400">{rate.toFixed(1)}%</strong></span>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleConfirmSelectModalMajor(bench.name, "B")}
                            disabled={isSelectedB}
                            className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                              isSelectedB
                                ? "bg-purple-600 text-white cursor-default opacity-80"
                                : "bg-purple-600 hover:bg-purple-500 text-white shadow-sm hover:scale-105 active:scale-95"
                            }`}
                          >
                            {isSelectedB ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>已选为专业 B</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>选为专业 B</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Channel Variance Diagnosis Modal */}
      <AnimatePresence>
        {showAiDiagnosisModal && aiDiagnosisTarget && (
          <div key="ai-diagnosis-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              key="ai-diagnosis-modal-panel"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
                isDarkMode ? "bg-slate-900 border-indigo-500/30 text-slate-100" : "bg-white border-indigo-200 text-slate-900"
              }`}
            >
              {/* Modal Header */}
              <div className={`p-4 border-b flex items-start justify-between shrink-0 ${
                isDarkMode ? "bg-slate-950/90 border-slate-800" : "bg-gradient-to-r from-indigo-50/90 via-purple-50/90 to-indigo-50/90 border-indigo-100"
              }`}>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-md shrink-0 mt-0.5">
                    <Bot className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>Gemini 智能渠道差异归因诊断</span>
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        偏离极差: {Math.abs(aiDiagnosisTarget.chDiff).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-1">
                      渠道：<strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">{aiDiagnosisTarget.channelName}</strong> | 对比专业：
                      <span className="font-bold text-slate-800 dark:text-slate-200">【{aiDiagnosisTarget.majorA.name}】</span> vs <span className="font-bold text-slate-800 dark:text-slate-200">【{aiDiagnosisTarget.majorB.name}】</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAiDiagnosisModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Major Channels Metric Bar */}
              <div className={`px-4 py-2.5 border-b grid grid-cols-2 gap-3 text-xs shrink-0 ${
                isDarkMode ? "bg-black/20 border-slate-800" : "bg-slate-50/60 border-slate-100"
              }`}>
                <div className={`p-2 rounded-xl border flex items-center justify-between ${
                  aiDiagnosisTarget.chDiff >= 0
                    ? (isDarkMode ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-900")
                    : (isDarkMode ? "bg-rose-950/30 border-rose-500/40 text-rose-300" : "bg-rose-50 border-rose-200 text-rose-900")
                }`}>
                  <div>
                    <div className="font-extrabold text-[11px] truncate">【{aiDiagnosisTarget.majorA.name}】</div>
                    <div className="text-[10px] opacity-80 mt-0.5">
                      报到 {aiDiagnosisTarget.majorA.channelActual}人 / 目标 {aiDiagnosisTarget.majorA.channelTarget}人
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-extrabold text-sm">{aiDiagnosisTarget.majorA.channelRate.toFixed(1)}%</div>
                    <div className="text-[9.5px] opacity-75">该渠道完成率</div>
                  </div>
                </div>

                <div className={`p-2 rounded-xl border flex items-center justify-between ${
                  aiDiagnosisTarget.chDiff <= 0
                    ? (isDarkMode ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-900")
                    : (isDarkMode ? "bg-rose-950/30 border-rose-500/40 text-rose-300" : "bg-rose-50 border-rose-200 text-rose-900")
                }`}>
                  <div>
                    <div className="font-extrabold text-[11px] truncate">【{aiDiagnosisTarget.majorB.name}】</div>
                    <div className="text-[10px] opacity-80 mt-0.5">
                      报到 {aiDiagnosisTarget.majorB.channelActual}人 / 目标 {aiDiagnosisTarget.majorB.channelTarget}人
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-extrabold text-sm">{aiDiagnosisTarget.majorB.channelRate.toFixed(1)}%</div>
                    <div className="text-[9.5px] opacity-75">该渠道完成率</div>
                  </div>
                </div>
              </div>

              {/* Diagnosis Body */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {aiDiagnosisLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-400 animate-spin p-0.5 shadow-lg">
                        <div className={`w-full h-full rounded-[14px] flex items-center justify-center ${
                          isDarkMode ? "bg-slate-900" : "bg-white"
                        }`}>
                          <BrainCircuit className="w-7 h-7 text-indigo-500 animate-pulse" />
                        </div>
                      </div>
                      <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                        Gemini 正在全维比对与智能诊断中...
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                        深度分析【{aiDiagnosisTarget.majorA.name}】与【{aiDiagnosisTarget.majorB.name}】在【{aiDiagnosisTarget.channelName}】渠道的受众画像、信息传递效率与转化瓶颈
                      </p>
                    </div>
                  </div>
                ) : aiDiagnosisError ? (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-extrabold text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>诊断生成失败</span>
                    </div>
                    <p>{aiDiagnosisError}</p>
                    <button
                      type="button"
                      onClick={() => handleOpenAiDiagnosis(aiDiagnosisTarget)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>重试诊断</span>
                    </button>
                  </div>
                ) : aiDiagnosisContent ? (
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                    isDarkMode ? "bg-slate-950/60 border-slate-800 text-slate-200" : "bg-slate-50/80 border-slate-200 text-slate-800"
                  }`}>
                    <div className="markdown-body prose dark:prose-invert max-w-none text-xs space-y-2">
                      <Markdown>{aiDiagnosisContent}</Markdown>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Modal Footer */}
              <div className={`p-3.5 border-t flex items-center justify-between shrink-0 ${
                isDarkMode ? "bg-slate-950/90 border-slate-800" : "bg-slate-100/80 border-slate-200"
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Powered by Gemini 3.6
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {aiDiagnosisContent && (
                    <button
                      type="button"
                      onClick={handleCopyDiagnosis}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                        copiedDiagnosis
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : (isDarkMode ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs")
                      }`}
                    >
                      {copiedDiagnosis ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-indigo-500" />}
                      <span>{copiedDiagnosis ? "已复制" : "复制诊断摘要"}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenAiDiagnosis(aiDiagnosisTarget)}
                    disabled={aiDiagnosisLoading}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${aiDiagnosisLoading ? "animate-spin" : ""}`} />
                    <span>重新诊断</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAiDiagnosisModal(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Major Yield / Deficit Simulation Modal */}
      <AnimatePresence>
        {simulationMajor && (() => {
          const simMajorObj = majorsData.find((m) => m.name === simulationMajor);
          if (!simMajorObj) return null;

          const baseTarget = simMajorObj.target;
          const baseActual = simMajorObj.actual;
          const baseRate = simMajorObj.rate;
          const baseNetSurplusDeficit = baseActual - baseTarget; // > 0 surplus, < 0 deficit

          // Calculate channel level adjustments
          let totalSimTarget = 0;
          let totalSimActual = 0;

          const channelsSimData = channelNames.map((chName, cIdx) => {
            const ch = simMajorObj.channels[cIdx] || { target: Math.round(baseTarget / 7), actual: Math.round(baseActual / 7) };
            const cBaseTarget = Number(ch.target) || 0;
            const cBaseActual = Number(ch.actual) || 0;

            const yieldWeight = simChannelWeights[cIdx] ?? 100; // default 100%
            const targetAdj = simChannelTargetAdj[cIdx] ?? 0; // default 0%

            const cSimTarget = Math.max(1, Math.round(cBaseTarget * (1 + targetAdj / 100)));
            const cSimActual = Math.max(0, Math.round(cBaseActual * (yieldWeight / 100)));
            const cSimRate = cSimTarget > 0 ? (cSimActual / cSimTarget) * 100 : 0;
            const cSimNet = cSimActual - cSimTarget;

            totalSimTarget += cSimTarget;
            totalSimActual += cSimActual;

            return {
              cIdx,
              chName,
              cBaseTarget,
              cBaseActual,
              yieldWeight,
              targetAdj,
              cSimTarget,
              cSimActual,
              cSimRate,
              cSimNet,
            };
          });

          const totalSimRate = totalSimTarget > 0 ? (totalSimActual / totalSimTarget) * 100 : 0;
          const totalSimNetSurplusDeficit = totalSimActual - totalSimTarget;
          const deltaSurplusDeficit = totalSimNetSurplusDeficit - baseNetSurplusDeficit;

          return (
            <div key={`sim-yield-modal-overlay-${simulationMajor}`} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
              <motion.div
                key={`sim-yield-panel-${simulationMajor}`}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className={`w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
                  isDarkMode
                    ? "bg-slate-900 border-amber-500/40 text-slate-100 shadow-amber-950/40"
                    : "bg-white border-amber-200 text-slate-900 shadow-xl"
                }`}
              >
                {/* Modal Header */}
                <div className={`p-4 border-b flex items-center justify-between gap-3 ${
                  isDarkMode ? "bg-slate-950/80 border-slate-800" : "bg-gradient-to-r from-amber-50/90 via-indigo-50/80 to-purple-50/90 border-amber-200"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500 to-indigo-600 text-white shadow-md">
                      <Calculator className="w-5 h-5 animate-bounce" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold flex items-center gap-2">
                        <span>【{simulationMajor}】专业招生计划加权与达标盈亏模拟测算</span>
                        <span className="text-[9.5px] px-2 py-0.5 rounded-full font-mono bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-400/30">
                          动态盈亏模型
                        </span>
                      </h3>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                        滑动微调各招生渠道的计划目标与转化加权系数，实时预览整体达成率与招生盈亏变动趋势
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSimulationMajor(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scenario Quick Presets & Contrast Switch */}
                <div className="p-3 border-b border-current/10 bg-black/5 dark:bg-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      快速预设场景:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSimChannelWeights({});
                          setSimChannelTargetAdj({});
                        }}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
                      >
                        基准原计划 (100%)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const w: { [k: number]: number } = {};
                          channelNames.forEach((_, i) => (w[i] = 80));
                          setSimChannelWeights(w);
                        }}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg border bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                      >
                        保守探底 (-20%)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const w: { [k: number]: number } = {};
                          channelNames.forEach((_, i) => (w[i] = 130));
                          setSimChannelWeights(w);
                        }}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                      >
                        激进冲刺 (+30%)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const w: { [k: number]: number } = { 0: 150, 2: 150, 4: 150 };
                          setSimChannelWeights((prev) => ({ ...prev, ...w }));
                        }}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg border bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800 hover:bg-indigo-500 hover:text-white transition-all cursor-pointer"
                      >
                        重点线上/社媒发力 (+50%)
                      </button>
                    </div>
                  </div>

                  {/* Contrast Switch */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowCompareOriginal(!showCompareOriginal)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-extrabold transition-all flex items-center gap-1.5 cursor-pointer border shadow-xs ${
                        showCompareOriginal
                          ? "bg-amber-500 text-white border-amber-400 ring-2 ring-amber-400/30"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-300"
                      }`}
                      title="点击开/关与原始基准数值的并排/趋势对比"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>对比原始值</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                        showCompareOriginal ? "bg-white text-amber-700" : "bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}>
                        {showCompareOriginal ? "已开启" : "已关闭"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Dynamic Dashboard Speedometer Gauge & Yield/Deficit Gap Meters */}
                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                  {/* Dynamic Speedometer & Real-time Gap Dashboard */}
                  <div className={`p-4 rounded-2xl border shadow-sm relative overflow-hidden transition-all ${
                    isDarkMode
                      ? "bg-slate-950/80 border-amber-500/30 text-slate-100"
                      : "bg-gradient-to-br from-amber-50/50 via-white to-indigo-50/50 border-amber-200 text-slate-900"
                  }`}>
                    <div className="flex items-center justify-between border-b pb-2.5 border-current/10 mb-3">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span className="font-extrabold text-xs">全系统预计完成率与招生盈亏差距动态仪表盘</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {showCompareOriginal && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-extrabold flex items-center gap-1">
                            <Layers className="w-3 h-3" /> 对比原始基准模式
                          </span>
                        )}
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-300">
                          实时联动调控中
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* SVG Arc Speedometer Gauge (5 cols) */}
                      <div className="md:col-span-5 flex flex-col items-center justify-center p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10 relative">
                        <div className="w-48 h-28 relative flex items-center justify-center overflow-hidden">
                          <svg className="w-48 h-48 -rotate-90 transform" viewBox="0 0 100 100">
                            {/* Background Arc */}
                            <path
                              d="M 15 50 A 35 35 0 0 1 85 50"
                              fill="none"
                              stroke={isDarkMode ? "#334155" : "#e2e8f0"}
                              strokeWidth="8"
                              strokeLinecap="round"
                            />
                            {/* Active Dynamic Arc */}
                            {(() => {
                              // Map rate 0-150% to arc stroke offset (arc length = PI * 35 = 110)
                              const maxScale = 150;
                              const clampedRate = Math.min(maxScale, Math.max(0, totalSimRate));
                              const arcLength = Math.PI * 35; // ~109.95
                              const dashOffset = arcLength - (arcLength * clampedRate) / maxScale;

                              let strokeColor = "#f59e0b"; // amber
                              if (totalSimRate >= 100) strokeColor = "#10b981"; // emerald
                              else if (totalSimRate < 80) strokeColor = "#f43f5e"; // rose

                              return (
                                <path
                                  d="M 15 50 A 35 35 0 0 1 85 50"
                                  fill="none"
                                  stroke={strokeColor}
                                  strokeWidth="8"
                                  strokeDasharray={arcLength}
                                  strokeDashoffset={dashOffset}
                                  strokeLinecap="round"
                                  className="transition-all duration-300 ease-out"
                                />
                              );
                            })()}
                          </svg>

                          {/* Gauge Center Text */}
                          <div className="absolute top-11 left-0 right-0 text-center font-mono space-y-0.5">
                            <span className="text-[9px] text-slate-400 block">全系统预计完成率</span>
                            <strong className={`text-2xl font-black ${
                              totalSimRate >= 100 ? "text-emerald-600 dark:text-emerald-400" : totalSimRate >= 80 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
                            }`}>
                              {totalSimRate.toFixed(1)}%
                            </strong>

                            {/* Trend Indicator with Arrow */}
                            <div className="flex items-center justify-center gap-1 text-[8.5px] mt-0.5">
                              {showCompareOriginal && (
                                <span className="text-slate-400 font-bold">原始 {baseRate.toFixed(1)}%</span>
                              )}
                              {(() => {
                                const rateDiff = totalSimRate - baseRate;
                                const isUp = rateDiff >= 0;
                                return (
                                  <span className={`font-black flex items-center gap-0.5 px-1.5 py-0.2 rounded-md ${
                                    isUp ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                  }`}>
                                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {isUp ? `+${rateDiff.toFixed(1)}%` : `${rateDiff.toFixed(1)}%`}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Gauge Bottom Scale Labels */}
                        <div className="w-full flex justify-between px-4 text-[8px] font-mono text-slate-400 -mt-2">
                          <span>0%</span>
                          <span>50%</span>
                          <span className="text-amber-500 font-bold">100% 达标</span>
                          <span>150%+</span>
                        </div>
                      </div>

                      {/* Real-Time Yield / Deficit Gap Meters (7 cols) */}
                      <div className="md:col-span-7 space-y-2.5 font-mono">
                        {/* Meter 1: System Net Surplus / Deficit Headcount Gap */}
                        <div className={`p-2.5 rounded-xl border transition-all ${
                          totalSimNetSurplusDeficit >= 0
                            ? (isDarkMode ? "bg-emerald-950/30 border-emerald-800/60" : "bg-emerald-50/90 border-emerald-200")
                            : (isDarkMode ? "bg-rose-950/30 border-rose-800/60" : "bg-rose-50/90 border-rose-200")
                        }`}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-500 dark:text-slate-400 font-sans text-[11px] flex items-center gap-1">
                              招生达标盈亏差距 (人数/缺口):
                            </span>
                            <div className="flex items-center gap-2">
                              {showCompareOriginal && (
                                <span className="text-[10px] text-slate-400 line-through">
                                  原基准: {baseNetSurplusDeficit >= 0 ? `+${baseNetSurplusDeficit}` : baseNetSurplusDeficit}人
                                </span>
                              )}
                              <strong className={`text-sm font-black ${
                                totalSimNetSurplusDeficit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                              }`}>
                                {totalSimNetSurplusDeficit >= 0 ? `+${totalSimNetSurplusDeficit} 人 (超额盈余)` : `${totalSimNetSurplusDeficit} 人 (招生缺口)`}
                              </strong>
                            </div>
                          </div>
                          <div className="relative w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                totalSimNetSurplusDeficit >= 0 ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                              style={{ width: `${Math.min(100, Math.max(10, (Math.abs(totalSimNetSurplusDeficit) / totalSimTarget) * 100 * 3))}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[9.5px] text-slate-500 mt-1">
                            <span>基准状态: {baseNetSurplusDeficit >= 0 ? `超额 +${baseNetSurplusDeficit}人` : `缺口 ${baseNetSurplusDeficit}人`}</span>
                            <span className={`font-black flex items-center gap-1 px-2 py-0.5 rounded-lg border ${
                              deltaSurplusDeficit >= 0 
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30" 
                                : "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30"
                            }`}>
                              {deltaSurplusDeficit >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                              <span>盈亏趋势: {deltaSurplusDeficit >= 0 ? `收益/缺口收窄 +${deltaSurplusDeficit}人` : `亏损/缺口扩大 -${Math.abs(deltaSurplusDeficit)}人`}</span>
                            </span>
                          </div>
                        </div>

                        {/* Meter 2: Target vs Actual Increment Comparison */}
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10">
                            <span className="text-[9px] text-slate-400 block">预计调整后计划总数</span>
                            <div className="flex items-center gap-1.5">
                              <strong className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                                {totalSimTarget} 人
                              </strong>
                              {showCompareOriginal && (
                                <span className="text-[9px] text-slate-400 line-through">
                                  ({baseTarget}人)
                                </span>
                              )}
                            </div>
                            <span className="text-[8.5px] text-slate-500 flex items-center gap-0.5 mt-0.5">
                              {totalSimTarget - baseTarget >= 0 ? (
                                <TrendingUp className="w-2.5 h-2.5 text-indigo-500" />
                              ) : (
                                <TrendingDown className="w-2.5 h-2.5 text-amber-500" />
                              )}
                              <span>较原计划 {totalSimTarget - baseTarget >= 0 ? "+" : ""}{totalSimTarget - baseTarget}人</span>
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10">
                            <span className="text-[9px] text-slate-400 block">预计报到完成总数</span>
                            <div className="flex items-center gap-1.5">
                              <strong className="text-purple-600 dark:text-purple-400 text-xs font-bold">
                                {totalSimActual} 人
                              </strong>
                              {showCompareOriginal && (
                                <span className="text-[9px] text-slate-400 line-through">
                                  ({baseActual}人)
                                </span>
                              )}
                            </div>
                            <span className="text-[8.5px] text-slate-500 flex items-center gap-0.5 mt-0.5">
                              {totalSimActual - baseActual >= 0 ? (
                                <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
                              ) : (
                                <TrendingDown className="w-2.5 h-2.5 text-rose-500" />
                              )}
                              <span>较原报到 {totalSimActual - baseActual >= 0 ? "+" : ""}{totalSimActual - baseActual}人</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4 Scorecard KPI Cards with Original vs Simulated Trend Comparison */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-center font-mono">
                    {/* Target Plan */}
                    <div className={`p-3 rounded-2xl border ${isDarkMode ? "bg-black/30 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                      <span className="text-[10px] text-slate-400 block mb-0.5">招生计划目标</span>
                      {showCompareOriginal && (
                        <div className="text-[10px] text-slate-400 line-through mb-0.5">原始: {baseTarget} 人</div>
                      )}
                      <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                        {totalSimTarget} 人
                      </div>
                      <span className="text-[9px] text-slate-400 flex items-center justify-center gap-0.5 mt-0.5">
                        {totalSimTarget - baseTarget >= 0 ? <TrendingUp className="w-2.5 h-2.5 text-indigo-500" /> : <TrendingDown className="w-2.5 h-2.5 text-amber-500" />}
                        <span>({totalSimTarget - baseTarget >= 0 ? "+" : ""}{totalSimTarget - baseTarget}人)</span>
                      </span>
                    </div>

                    {/* Actual Completed */}
                    <div className={`p-3 rounded-2xl border ${isDarkMode ? "bg-black/30 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                      <span className="text-[10px] text-slate-400 block mb-0.5">实际报到人数</span>
                      {showCompareOriginal && (
                        <div className="text-[10px] text-slate-400 line-through mb-0.5">原始: {baseActual} 人</div>
                      )}
                      <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        {totalSimActual} 人
                      </div>
                      <span className={`text-[9px] flex items-center justify-center gap-0.5 mt-0.5 ${totalSimActual - baseActual >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {totalSimActual - baseActual >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        <span>({totalSimActual - baseActual >= 0 ? "+" : ""}{totalSimActual - baseActual}人)</span>
                      </span>
                    </div>

                    {/* Rate */}
                    <div className={`p-3 rounded-2xl border ${isDarkMode ? "bg-black/30 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                      <span className="text-[10px] text-slate-400 block mb-0.5">模拟达成率</span>
                      {showCompareOriginal && (
                        <div className="text-[10px] text-slate-400 line-through mb-0.5">原始: {baseRate.toFixed(1)}%</div>
                      )}
                      <div className="text-sm font-extrabold text-purple-600 dark:text-purple-400">
                        {totalSimRate.toFixed(1)}%
                      </div>
                      <span className={`text-[9px] flex items-center justify-center gap-0.5 mt-0.5 font-bold ${totalSimRate - baseRate >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {totalSimRate - baseRate >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        <span>({totalSimRate - baseRate >= 0 ? "+" : ""}{(totalSimRate - baseRate).toFixed(1)}%)</span>
                      </span>
                    </div>

                    {/* Net Profit/Loss Surplus/Deficit Delta */}
                    <div className={`p-3 rounded-2xl border ${
                      deltaSurplusDeficit >= 0
                        ? (isDarkMode ? "bg-emerald-950/30 border-emerald-800/60" : "bg-emerald-50 border-emerald-200")
                        : (isDarkMode ? "bg-rose-950/30 border-rose-800/60" : "bg-rose-50 border-rose-200")
                    }`}>
                      <span className="text-[10px] text-slate-400 block mb-0.5">招生盈亏变动趋势</span>
                      {showCompareOriginal && (
                        <div className="text-[9.5px] text-slate-500 font-bold mb-0.5">
                          基准: {baseNetSurplusDeficit >= 0 ? `超额 +${baseNetSurplusDeficit}` : `缺口 ${baseNetSurplusDeficit}`}人
                        </div>
                      )}
                      <div className={`text-xs font-black flex items-center justify-center gap-1 ${deltaSurplusDeficit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {deltaSurplusDeficit >= 0 ? <TrendingUp className="w-4 h-4 shrink-0" /> : <TrendingDown className="w-4 h-4 shrink-0" />}
                        <span>{deltaSurplusDeficit >= 0 ? `净收益 +${deltaSurplusDeficit}人` : `净亏损 -${Math.abs(deltaSurplusDeficit)}人`}</span>
                      </div>
                      <span className="text-[9px] font-extrabold block mt-0.5">
                        模拟后: {totalSimNetSurplusDeficit >= 0 ? `超额 +${totalSimNetSurplusDeficit}` : `缺口 ${totalSimNetSurplusDeficit}`}人
                      </span>
                    </div>
                  </div>

                  {/* Channel Sliders List */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center justify-between border-b pb-1 border-current/15">
                      <span className="flex items-center gap-1.5">
                        <span>7大渠道加权与目标计划调控面板</span>
                        {showCompareOriginal && (
                          <span className="text-[9.5px] px-2 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 font-mono font-bold">
                            对比原始渠道数据
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">拖拽滑块实时计算渠道盈亏</span>
                    </h4>

                    <div className="space-y-2.5">
                      {channelsSimData.map((ch, idx) => {
                        const targetDiff = ch.cSimTarget - ch.cBaseTarget;
                        const actualDiff = ch.cSimActual - ch.cBaseActual;
                        const rateDiff = ch.cSimRate - (ch.cBaseTarget > 0 ? (ch.cBaseActual / ch.cBaseTarget) * 100 : 0);

                        return (
                          <div
                            key={`sim-ch-${ch.cIdx}-${idx}`}
                            className={`p-3 rounded-2xl border transition-all ${
                              isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200/80"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono mb-2">
                              <span className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                {ch.chName}
                              </span>
                              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                                <span className="text-slate-400 flex items-center gap-1">
                                  <span>计划:</span>
                                  <strong className="text-slate-700 dark:text-slate-200">{ch.cSimTarget}人</strong>
                                  {showCompareOriginal && (
                                    <span className="text-[9.5px] text-slate-400">
                                      (基准{ch.cBaseTarget}
                                      {targetDiff !== 0 && (
                                        <span className={targetDiff > 0 ? "text-indigo-500 font-bold ml-0.5" : "text-amber-500 font-bold ml-0.5"}>
                                          {targetDiff > 0 ? `+${targetDiff}` : targetDiff}
                                        </span>
                                      )}
                                      {")"}
                                    </span>
                                  )}
                                </span>

                                <span className="text-slate-400 flex items-center gap-1">
                                  <span>完成:</span>
                                  <strong className="text-indigo-600 dark:text-indigo-400">{ch.cSimActual}人</strong>
                                  {showCompareOriginal && (
                                    <span className="text-[9.5px] text-slate-400 flex items-center gap-0.5">
                                      (基准{ch.cBaseActual})
                                      {actualDiff !== 0 && (
                                        <span className={`font-bold flex items-center ${actualDiff > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                          {actualDiff > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                          {actualDiff > 0 ? `+${actualDiff}` : actualDiff}
                                        </span>
                                      )}
                                    </span>
                                  )}
                                </span>

                                <span className={`font-black flex items-center gap-0.5 ${ch.cSimRate >= 100 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                                  {ch.cSimRate.toFixed(1)}%
                                  {showCompareOriginal && rateDiff !== 0 && (
                                    <span className={`text-[9px] px-1 py-0.2 rounded font-mono flex items-center ${rateDiff > 0 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 text-rose-600 dark:text-rose-400"}`}>
                                      {rateDiff > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                      {rateDiff > 0 ? `+${rateDiff.toFixed(1)}%` : `${rateDiff.toFixed(1)}%`}
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-sans">
                              {/* Yield Weight Slider */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                  <span>招生活跃/转化加权系数:</span>
                                  <strong className="text-amber-600 dark:text-amber-400">{ch.yieldWeight}%</strong>
                                </div>
                                <input
                                  type="range"
                                  min="50"
                                  max="200"
                                  step="5"
                                  value={ch.yieldWeight}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setSimChannelWeights((prev) => ({ ...prev, [ch.cIdx]: val }));
                                  }}
                                  className="w-full accent-amber-500 cursor-pointer"
                                />
                              </div>

                              {/* Target Adjustment Slider */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                  <span>招生目标计划微调:</span>
                                  <strong className={ch.targetAdj >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-rose-600 dark:text-rose-400"}>
                                    {ch.targetAdj >= 0 ? `+${ch.targetAdj}%` : `${ch.targetAdj}%`}
                                  </strong>
                                </div>
                                <input
                                  type="range"
                                  min="-50"
                                  max="50"
                                step="5"
                                value={ch.targetAdj}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setSimChannelTargetAdj((prev) => ({ ...prev, [ch.cIdx]: val }));
                                }}
                                className="w-full accent-indigo-500 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className={`p-4 border-t flex items-center justify-between gap-3 ${
                  isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
                }`}>
                  <div className="text-xs font-mono font-bold text-slate-500">
                    测算总结: 模拟完成后达标率 <span className="text-purple-600 dark:text-purple-400">{totalSimRate.toFixed(1)}%</span>，较原大盘盈亏变动 <span className={deltaSurplusDeficit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>{deltaSurplusDeficit >= 0 ? `+${deltaSurplusDeficit}` : deltaSurplusDeficit}人</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSimulationMajor(null)}
                      className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setToastMsg(`已应用【${simulationMajor}】加权测算：模拟完成 ${totalSimActual}人 (${totalSimRate.toFixed(1)}%)，较基准盈亏变动 ${deltaSurplusDeficit >= 0 ? "+" : ""}${deltaSurplusDeficit}人`);
                        setSimulationMajor(null);
                      }}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                    >
                      确认应用模拟结果
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            key="progress-toast-notification"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs shadow-2xl flex items-center gap-2 border border-rose-500/40"
          >
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Threshold Configuration Modal Panel */}
      <AnimatePresence>
        {showThresholdModal && (
          <div key="threshold-modal-overlay" className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              key="threshold-modal-panel"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden p-6 space-y-5 ${
                isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-white shadow-md">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base flex items-center gap-2">
                      预警与报警阈值自定义配置
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      自定义达成率门槛，实时判定‘黄色警告’与‘红色报警’专业
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowThresholdModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  快速选择预设阈值模板：
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "标准默认", yellow: 30, red: 10, desc: "常规关注" },
                    { label: "严格管控", yellow: 50, red: 20, desc: "提早干预" },
                    { label: "宽松管控", yellow: 20, red: 5, desc: "容忍度高" },
                    { label: "激进冲刺", yellow: 60, red: 30, desc: "高标推进" },
                  ].map((preset, idx) => (
                    <button
                      key={`preset-${preset.label}-${idx}`}
                      type="button"
                      onClick={() => {
                        setTempYellow(preset.yellow);
                        setTempRed(preset.red);
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        tempYellow === preset.yellow && tempRed === preset.red
                          ? "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-400/30 font-extrabold"
                          : (isDarkMode ? "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100")
                      }`}
                    >
                      <div className="text-[11px] font-bold">{preset.label}</div>
                      <div className="text-[9.5px] font-mono text-slate-400 mt-0.5">
                        ⚠️&lt;{preset.yellow}% | 🚨&lt;{preset.red}%
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Threshold Sliders & Inputs */}
              <div className="space-y-4 pt-1 border-t border-slate-200 dark:border-slate-800">
                {/* Yellow Warning Threshold Control */}
                <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                  isDarkMode ? "bg-amber-950/20 border-amber-500/30" : "bg-amber-50/70 border-amber-200"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      ⚠️ 黄色警告阈值 (达成率上限)
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={tempRed + 1}
                        max={100}
                        value={tempYellow}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(100, Number(e.target.value) || 0));
                          setTempYellow(val);
                        }}
                        className={`w-16 px-2 py-1 rounded-lg border font-mono font-extrabold text-xs text-center outline-none ${
                          isDarkMode ? "bg-slate-900 border-amber-500/50 text-amber-300" : "bg-white border-amber-300 text-amber-900"
                        }`}
                      />
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={Math.max(1, tempRed + 1)}
                    max={100}
                    value={tempYellow}
                    onChange={(e) => setTempYellow(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-amber-800 dark:text-amber-300/80">
                    提示：达成率低于 <strong className="font-mono font-bold text-amber-600 dark:text-amber-300">{tempYellow}%</strong> 但 ≥ <strong className="font-mono font-bold text-rose-600 dark:text-rose-400">{tempRed}%</strong> 时，显示黄色警告标识。
                  </p>
                </div>

                {/* Red Alarm Threshold Control */}
                <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                  isDarkMode ? "bg-rose-950/20 border-rose-500/30" : "bg-rose-50/70 border-rose-200"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      🚨 红色报警阈值 (达成率底线)
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={Math.max(0, tempYellow - 1)}
                        value={tempRed}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(tempYellow - 1, Number(e.target.value) || 0));
                          setTempRed(val);
                        }}
                        className={`w-16 px-2 py-1 rounded-lg border font-mono font-extrabold text-xs text-center outline-none ${
                          isDarkMode ? "bg-slate-900 border-rose-500/50 text-rose-300" : "bg-white border-rose-300 text-rose-900"
                        }`}
                      />
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, tempYellow - 1)}
                    value={tempRed}
                    onChange={(e) => setTempRed(Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-rose-800 dark:text-rose-300/80">
                    提示：达成率低于 <strong className="font-mono font-bold text-rose-600 dark:text-rose-300">{tempRed}%</strong> 时，显示红色报警极高风险提示。
                  </p>
                </div>
              </div>

              {/* Validation Alert */}
              {tempRed >= tempYellow && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>红警阈值 ({tempRed}%) 必须严格低于黄色警告阈值 ({tempYellow}%)，请重新调整！</span>
                </div>
              )}

              {/* Dynamic Statistics Preview */}
              {(() => {
                const countRed = majorsData.filter((m) => m.target > 0 && m.rate < tempRed).length;
                const countYellow = majorsData.filter((m) => m.target > 0 && m.rate >= tempRed && m.rate < tempYellow).length;
                const countNormal = majorsData.filter((m) => m.target > 0 && m.rate >= tempYellow).length;

                return (
                  <div className={`p-3 rounded-xl border space-y-1.5 ${
                    isDarkMode ? "bg-slate-800/50 border-slate-700/80" : "bg-slate-100/80 border-slate-200"
                  }`}>
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      📊 当前数据下按新阈值判定预处理统计：
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono font-extrabold">
                      <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/20">
                        🚨 红色报警: {countRed} 个
                      </div>
                      <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/20">
                        ⚠️ 黄色警告: {countYellow} 个
                      </div>
                      <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                        ✅ 正常推进: {countNormal} 个
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setTempYellow(30);
                    setTempRed(10);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  重置标准 (30%/10%)
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowThresholdModal(false)}
                    className="px-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    disabled={tempRed >= tempYellow}
                    onClick={() => {
                      if (tempRed >= tempYellow) return;
                      setYellowThreshold(tempYellow);
                      setRedThreshold(tempRed);
                      setShowThresholdModal(false);
                      setToastMsg(`预警阈值已更新：黄色警告 < ${tempYellow}%，红色报警 < ${tempRed}%`);
                      setTimeout(() => setToastMsg(null), 3000);
                    }}
                    className={`px-4 py-1.5 rounded-xl font-extrabold text-xs text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-md ${
                      tempRed >= tempYellow
                        ? "bg-slate-400 cursor-not-allowed opacity-50"
                        : "bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 ring-2 ring-amber-400/30"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    应用并保存配置
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
