/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { RowData, TableConfig } from "../types";
import { 
  X, TrendingUp, TrendingDown, Target, Layers, Calendar, BarChart2, 
  CheckCircle2, AlertTriangle, Trophy, Zap, Activity, Filter, Maximize2, Sparkles,
  ArrowUpRight, ArrowDownRight, Users, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Copy, Check, Share2, Award, ChevronRight, BarChart3, LayoutDashboard,
  MessageSquare, StickyNote, Plus, Trash2, Edit3, Save, Tag, RefreshCw, Clock,
  Download, FileSpreadsheet, Printer, Link2, ExternalLink, ArrowLeftRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MajorComparisonView } from "./MajorComparisonView";
import { MiniSparkline } from "./MiniSparkline";
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  BarChart,
  Bar,
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

interface MajorDetailDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  majorName: string;
  rows: RowData[];
  onRowsChange?: (newRows: RowData[]) => void;
  config?: TableConfig;
  isDarkMode: boolean;
  selectedDate: string;
  onSelectMajor?: (majorName: string) => void;
  onToast?: (msg: string) => void;
}

const PRESET_NOTE_TAGS = [
  { label: "🎯 重点攻坚", color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" },
  { label: "⚡ 渠道突增", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  { label: "📣 宣讲反馈好", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  { label: "⚠️ 目标滞后", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
  { label: "📞 电话回访", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  { label: "📝 简章调整", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
];

const CHANNEL_COLOR_PALETTE = [
  "#3b82f6", // 线上推广 - Blue
  "#10b981", // 线下宣讲 - Emerald
  "#f59e0b", // 转介绍 - Amber
  "#8b5cf6", // 高中合作 - Purple
  "#ec4899", // 社媒引流 - Pink
  "#06b6d4", // 招生简章 - Cyan
  "#64748b", // 其它渠道 - Slate
  "#f97316"  // 补录/其它 - Orange
];

export const MajorDetailDashboardModal: React.FC<MajorDetailDashboardModalProps> = ({
  isOpen,
  onClose,
  majorName: initialMajorName,
  rows,
  onRowsChange,
  config,
  isDarkMode,
  selectedDate,
  onSelectMajor,
  onToast,
}) => {
  const [activeMajor, setActiveMajor] = useState<string>(initialMajorName || "");
  const [timeScope, setTimeScope] = useState<"current" | "month" | "all">("month");
  const [trendDateRange, setTrendDateRange] = useState<"7d" | "30d" | "all">("all");
  const [trendChartType, setTrendChartType] = useState<"target_actual" | "channel_multi" | "rate_trend">("target_actual");
  const [pieMetricType, setPieMetricType] = useState<"actual_share" | "completion_rate">("actual_share");
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);
  
  // Note creation and editing state
  const [newNoteText, setNewNoteText] = useState("");
  const [newNoteDate, setNewNoteDate] = useState(selectedDate || new Date().toISOString().substring(0, 10));
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [editingNoteRowId, setEditingNoteRowId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [copiedToast, setCopiedToast] = useState(false);

  // Share Modal & Deep Link State
  const [showShareModal, setShowShareModal] = useState(false);
  const [includeDateInShare, setIncludeDateInShare] = useState(true);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);

  // Major Comparison View State
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [compareMajor, setCompareMajor] = useState<string>("");

  // Synchronize initial major name when prop changes
  useEffect(() => {
    if (initialMajorName) {
      setActiveMajor(initialMajorName);
    }
  }, [initialMajorName]);

  // Synchronize newNoteDate when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setNewNoteDate(selectedDate);
    }
  }, [selectedDate]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Extract all distinct major names for dropdown switcher
  const allMajorNames = useMemo(() => {
    const set = new Set<string>();
    rows.forEach(r => {
      if (r.name && !r.isMergedGroup && !r.name.includes("同类专业合并组")) {
        set.add(r.name);
      }
    });
    return Array.from(set);
  }, [rows]);

  // Synchronize and select a valid comparison major
  useEffect(() => {
    if (allMajorNames.length > 0) {
      if (!compareMajor || compareMajor === activeMajor) {
        const defaultOther = allMajorNames.find(m => m !== activeMajor) || allMajorNames[0] || "";
        setCompareMajor(defaultOther);
      }
    }
  }, [allMajorNames, activeMajor, compareMajor]);

  const channelNames = useMemo(() => {
    return config?.channels || [
      "线上推广", "线下宣讲", "转介绍", "高中合作", "社媒引流", "招生简章", "其它渠道"
    ];
  }, [config]);

  const monthPrefix = selectedDate ? selectedDate.substring(0, 7) : new Date().toISOString().substring(0, 7);

  // Filtered rows specifically for the active major
  const currentMajorRows = useMemo(() => {
    return rows.filter(r => r.name === activeMajor && !r.isMergedGroup).sort((a, b) => a.date.localeCompare(b.date));
  }, [rows, activeMajor]);

  // Active single-day row
  const selectedDayRow = useMemo(() => {
    return currentMajorRows.find(r => r.date === selectedDate) || currentMajorRows[currentMajorRows.length - 1];
  }, [currentMajorRows, selectedDate]);

  // Filter rows based on time scope
  const scopedRows = useMemo(() => {
    if (timeScope === "current") {
      return selectedDayRow ? [selectedDayRow] : [];
    }
    if (timeScope === "month") {
      return currentMajorRows.filter(r => r.date.startsWith(monthPrefix));
    }
    return currentMajorRows;
  }, [timeScope, selectedDayRow, currentMajorRows, monthPrefix]);

  // Aggregated channel metrics across scopedRows
  const channelMetrics = useMemo(() => {
    const data = channelNames.map((cName, idx) => {
      let targetSum = 0;
      let actualSum = 0;

      scopedRows.forEach(row => {
        const ch = row.channels && row.channels[idx] ? row.channels[idx] : { target: 0, actual: 0 };
        targetSum += Number(ch.target) || 0;
        actualSum += Number(ch.actual) || 0;
      });

      const rate = targetSum > 0 ? (actualSum / targetSum) * 100 : (actualSum > 0 ? 100 : 0);
      const diff = actualSum - targetSum;

      return {
        name: cName,
        target: targetSum,
        actual: actualSum,
        rate: Number(rate.toFixed(1)),
        diff,
        color: CHANNEL_COLOR_PALETTE[idx % CHANNEL_COLOR_PALETTE.length]
      };
    });

    // Add Other/Complementary channel if present
    let otherTarget = 0;
    let otherActual = 0;
    scopedRows.forEach(row => {
      const o = typeof row.other === "number" ? row.other : (typeof row.other === "object" && row.other !== null && "actual" in row.other ? (row.other as { actual: number }).actual : 0);
      otherActual += o;
    });

    if (otherActual > 0 || otherTarget > 0) {
      const rate = otherTarget > 0 ? (otherActual / otherTarget) * 100 : 100;
      data.push({
        name: "其它/补录",
        target: otherTarget,
        actual: otherActual,
        rate: Number(rate.toFixed(1)),
        diff: otherActual - otherTarget,
        color: CHANNEL_COLOR_PALETTE[7]
      });
    }

    return data;
  }, [channelNames, scopedRows]);

  // Overall total statistics
  const totalTarget = useMemo(() => channelMetrics.reduce((acc, c) => acc + c.target, 0), [channelMetrics]);
  const totalActual = useMemo(() => channelMetrics.reduce((acc, c) => acc + c.actual, 0), [channelMetrics]);
  const overallRate = useMemo(() => totalTarget > 0 ? Number(((totalActual / totalTarget) * 100).toFixed(1)) : (totalActual > 0 ? 100 : 0), [totalTarget, totalActual]);
  const totalDiff = useMemo(() => totalActual - totalTarget, [totalActual, totalTarget]);

  // Top Channel & Lagging Channel
  const topChannel = useMemo(() => {
    if (channelMetrics.length === 0) return null;
    return [...channelMetrics].sort((a, b) => b.actual - a.actual)[0];
  }, [channelMetrics]);

  const laggingChannel = useMemo(() => {
    const channelsWithTarget = channelMetrics.filter(c => c.target > 0);
    if (channelsWithTarget.length === 0) return null;
    return [...channelsWithTarget].sort((a, b) => a.rate - b.rate)[0];
  }, [channelMetrics]);

  // Pie chart data preparation
  const pieData = useMemo(() => {
    if (pieMetricType === "actual_share") {
      return channelMetrics.filter(c => c.actual > 0).map(c => ({
        name: c.name,
        value: c.actual,
        target: c.target,
        rate: c.rate,
        color: c.color
      }));
    } else {
      // Completion Rate comparison
      return channelMetrics.map(c => ({
        name: c.name,
        value: Math.max(0, c.rate),
        actual: c.actual,
        target: c.target,
        rate: c.rate,
        color: c.color
      }));
    }
  }, [channelMetrics, pieMetricType]);

  // Active pie index computed from hovered channel
  const activePieIndex = useMemo(() => {
    if (!hoveredChannel) return -1;
    const idx = pieData.findIndex(p => p.name === hoveredChannel);
    return idx >= 0 ? idx : -1;
  }, [hoveredChannel, pieData]);

  // Custom active sector shape renderer for highlighted pie slice
  const renderActivePieShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g className="transition-all duration-200">
        {/* Subtle Outer Halo Ring */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={outerRadius + 3}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.8}
        />
        {/* Main Expanded Slice */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={Math.max(35, innerRadius - 2)}
          outerRadius={outerRadius + 5}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  // Full time series trend data array for charts
  const allTimeSeriesData = useMemo(() => {
    let cumulativeActual = 0;
    let cumulativeTarget = 0;

    return currentMajorRows.map((row) => {
      let dayTarget = 0;
      let dayActual = 0;
      const channelBreakdown: { [key: string]: number } = {};

      channelNames.forEach((cName, idx) => {
        const ch = row.channels && row.channels[idx] ? row.channels[idx] : { target: 0, actual: 0 };
        const t = Number(ch.target) || 0;
        const a = Number(ch.actual) || 0;
        dayTarget += t;
        dayActual += a;
        channelBreakdown[cName] = a;
      });

      const otherVal = typeof row.other === "number" ? row.other : (typeof row.other === "object" && row.other !== null && "actual" in row.other ? (row.other as { actual: number }).actual : 0);
      dayActual += otherVal;
      channelBreakdown["其它/补录"] = otherVal;

      cumulativeActual += dayActual;
      cumulativeTarget += dayTarget;

      const dayRate = dayTarget > 0 ? Number(((dayActual / dayTarget) * 100).toFixed(1)) : (dayActual > 0 ? 100 : 0);
      const cumRate = cumulativeTarget > 0 ? Number(((cumulativeActual / cumulativeTarget) * 100).toFixed(1)) : 0;
      const shortDate = row.date.length >= 10 ? row.date.substring(5) : row.date;

      return {
        date: row.date,
        shortDate,
        dayTarget,
        dayActual,
        cumulativeTarget,
        cumulativeActual,
        dayRate,
        cumRate,
        ...channelBreakdown
      };
    });
  }, [currentMajorRows, channelNames]);

  // Filtered time series data based on Date Range selection (7 days, 30 days, or all-time historical)
  const timeSeriesData = useMemo(() => {
    if (trendDateRange === "7d") {
      return allTimeSeriesData.slice(-7);
    }
    if (trendDateRange === "30d") {
      return allTimeSeriesData.slice(-30);
    }
    return allTimeSeriesData;
  }, [allTimeSeriesData, trendDateRange]);

  // Peak daily actual in timeSeriesData
  const peakDay = useMemo(() => {
    if (timeSeriesData.length === 0) return null;
    return [...timeSeriesData].sort((a, b) => b.dayActual - a.dayActual)[0];
  }, [timeSeriesData]);

  // Average daily enrollment
  const avgDaily = useMemo(() => {
    if (timeSeriesData.length === 0) return 0;
    const sum = timeSeriesData.reduce((acc, d) => acc + d.dayActual, 0);
    return Math.round((sum / timeSeriesData.length) * 10) / 10;
  }, [timeSeriesData]);

  // Collect all notes for this major
  const majorNotesList = useMemo(() => {
    const list: { rowId: string; date: string; note: string }[] = [];
    currentMajorRows.forEach(row => {
      if (row.note && row.note.trim() !== "") {
        list.push({
          rowId: row.id,
          date: row.date,
          note: row.note.trim()
        });
      }
    });
    // Sort descending by date
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [currentMajorRows]);

  // Last 7 days data and key enrollment performance insights for the selected major
  const last7DaysData = useMemo(() => {
    if (allTimeSeriesData.length === 0) return [];
    return allTimeSeriesData.slice(-7);
  }, [allTimeSeriesData]);

  const last7DaysSparklineValues = useMemo(() => {
    return last7DaysData.map(d => d.dayActual);
  }, [last7DaysData]);

  const last7DaysInsights = useMemo(() => {
    if (last7DaysData.length === 0) {
      return [
        {
          id: "no-data",
          type: "neutral" as const,
          title: "数据积累中",
          description: `当前专业「${activeMajor}」暂无足够的时间序列历史记录以生成近7天数据洞察。`
        }
      ];
    }

    const insights: {
      id: string;
      type: "positive" | "negative" | "neutral" | "warning";
      title: string;
      description: string;
      highlight?: string;
    }[] = [];

    const total7dActual = last7DaysData.reduce((acc, d) => acc + d.dayActual, 0);
    const total7dTarget = last7DaysData.reduce((acc, d) => acc + d.dayTarget, 0);
    const avg7dDaily = Math.round((total7dActual / last7DaysData.length) * 10) / 10;
    const rate7d = total7dTarget > 0 ? Math.round((total7dActual / total7dTarget) * 100) : 100;

    // 1. Total Volume & Rate Insight
    if (total7dTarget > 0) {
      if (rate7d >= 100) {
        insights.push({
          id: "vol-pace-positive",
          type: "positive",
          title: "近7日阶段进度超额达标",
          highlight: `${rate7d}%`,
          description: `近 7 天累计招收 ${total7dActual} 人（计划 ${total7dTarget} 人），阶段目标达成率达 ${rate7d}%，推进动能强劲。`
        });
      } else if (rate7d >= 75) {
        insights.push({
          id: "vol-pace-warning",
          type: "neutral",
          title: "近7日招生平稳推进",
          highlight: `${rate7d}%`,
          description: `近 7 天累计招收 ${total7dActual} 人（计划 ${total7dTarget} 人），完成度 ${rate7d}%，整体推进节奏相对稳健。`
        });
      } else {
        insights.push({
          id: "vol-pace-lagging",
          type: "warning",
          title: "近7日阶段达成率滞后",
          highlight: `${rate7d}%`,
          description: `近 7 天仅招收 ${total7dActual} 人，目标达成率为 ${rate7d}%，与周期预期指标存在 ${total7dTarget - total7dActual} 人缺口，需加强攻坚。`
        });
      }
    } else {
      insights.push({
        id: "vol-pace-notarget",
        type: "neutral",
        title: "近7日招收规模统计",
        highlight: `${total7dActual}人`,
        description: `近 7 天累计招收 ${total7dActual} 人，日均招收约 ${avg7dDaily} 人。`
      });
    }

    // 2. Trend Momentum (First half vs Second half)
    if (last7DaysData.length >= 4) {
      const mid = Math.floor(last7DaysData.length / 2);
      const earlySlice = last7DaysData.slice(0, mid);
      const recentSlice = last7DaysData.slice(mid);

      const earlyAvg = earlySlice.reduce((acc, d) => acc + d.dayActual, 0) / earlySlice.length;
      const recentAvg = recentSlice.reduce((acc, d) => acc + d.dayActual, 0) / recentSlice.length;
      const growthDiff = Math.round((recentAvg - earlyAvg) * 10) / 10;

      if (growthDiff > 0.5) {
        insights.push({
          id: "momentum-rising",
          type: "positive",
          title: "近7日走势呈上扬加速态势",
          highlight: `+${growthDiff}人/天`,
          description: `后半段日均招收（${Math.round(recentAvg * 10) / 10}人）相比前半段（${Math.round(earlyAvg * 10) / 10}人）日均净增 ${growthDiff} 人，招生热度持续爬坡升温。`
        });
      } else if (growthDiff < -0.5) {
        insights.push({
          id: "momentum-slowing",
          type: "negative",
          title: "近7日走势出现放缓迹象",
          highlight: `${growthDiff}人/天`,
          description: `后半段日均招收（${Math.round(recentAvg * 10) / 10}人）相比前半段有所回落，建议排查渠道投放转化率与意向学员跟进周期。`
        });
      } else {
        insights.push({
          id: "momentum-stable",
          type: "neutral",
          title: "近7日招收节奏保持均衡稳定",
          highlight: `均值 ${avg7dDaily}人`,
          description: `每日招收人数波动幅度较小，日均维持在 ${avg7dDaily} 人左右，生源输出节奏平稳。`
        });
      }
    }

    // 3. Peak Day & Channel Driving Force in the last 7 days
    const peak7d = [...last7DaysData].sort((a, b) => b.dayActual - a.dayActual)[0];
    if (peak7d && peak7d.dayActual > 0) {
      // Find which channel contributed most across the last 7 days
      const channel7dTotals: { [key: string]: number } = {};
      channelNames.forEach(cName => {
        channel7dTotals[cName] = last7DaysData.reduce((acc, d) => acc + (Number(d[cName]) || 0), 0);
      });
      const top7dChannelEntry = Object.entries(channel7dTotals).sort((a, b) => b[1] - a[1])[0];

      if (top7dChannelEntry && top7dChannelEntry[1] > 0) {
        const topRatio = total7dActual > 0 ? Math.round((top7dChannelEntry[1] / total7dActual) * 100) : 0;
        insights.push({
          id: "peak-top-channel",
          type: "positive",
          title: `主力生源由「${top7dChannelEntry[0]}」领跑驱动`,
          highlight: `${top7dChannelEntry[1]}人 (${topRatio}%)`,
          description: `近 7 天「${top7dChannelEntry[0]}」渠道贡献 ${top7dChannelEntry[1]} 人（占近7天招收总量的 ${topRatio}%）；峰值日为 ${peak7d.date}，单日招收 ${peak7d.dayActual} 人。`
        });
      } else {
        insights.push({
          id: "peak-record",
          type: "neutral",
          title: "近7日单日招收峰值记录",
          highlight: `${peak7d.dayActual}人`,
          description: `近 7 天峰值出现在 ${peak7d.date}，单日录得 ${peak7d.dayActual} 人入读/报名。`
        });
      }
    }

    // 4. Strategic actionable takeaway
    if (laggingChannel && laggingChannel.target > 0 && laggingChannel.rate < 60) {
      insights.push({
        id: "channel-optimization",
        type: "warning",
        title: `建议重点攻坚「${laggingChannel.name}」渠道`,
        highlight: `达成率 ${laggingChannel.rate}%`,
        description: `该专业「${laggingChannel.name}」渠道近期转化表现相对低迷（累计达成率 ${laggingChannel.rate}%），建议及时调整该渠道的宣推资源配置与人员触达策略。`
      });
    } else {
      insights.push({
        id: "strategy-consistency",
        type: "neutral",
        title: "渠道协同效能与策略建议",
        highlight: "全渠道协同",
        description: `建议保持现有优势渠道的转介跟进频次，并密切观察未来 3-5 天的生源转化漏斗与咨询响应时效。`
      });
    }

    return insights.slice(0, 4);
  }, [last7DaysData, activeMajor, channelNames, laggingChannel]);

  // Handle saving new note
  const handleSaveNewNote = () => {
    if (!newNoteText.trim()) return;

    const fullNoteContent = selectedTag ? `${selectedTag} ${newNoteText.trim()}` : newNoteText.trim();
    
    // Find target row for newNoteDate
    let targetRow = rows.find(r => r.name === activeMajor && r.date === newNoteDate && !r.isMergedGroup);
    let updatedRows: RowData[];

    if (targetRow) {
      // Append to or replace note
      const updatedNote = targetRow.note && targetRow.note.trim() !== "" 
        ? `${targetRow.note}\n${fullNoteContent}` 
        : fullNoteContent;
      
      updatedRows = rows.map(r => r.id === targetRow!.id ? { ...r, note: updatedNote } : r);
    } else {
      // If no row exists for this date, create one
      const newRow: RowData = {
        id: `row-${Date.now()}`,
        seq: rows.length + 1,
        name: activeMajor,
        date: newNoteDate,
        channels: channelNames.map(() => ({ target: 0, actual: 0 })),
        other: 0,
        note: fullNoteContent
      };
      updatedRows = [...rows, newRow];
    }

    if (onRowsChange) {
      onRowsChange(updatedRows);
    }
    try {
      localStorage.setItem("recruitment_rows_data", JSON.stringify(updatedRows));
    } catch (e) {
      console.error(e);
    }

    setNewNoteText("");
    setSelectedTag("");
    if (onToast) {
      onToast(`已成功为 ${activeMajor} 添加招生跟进备注`);
    }
  };

  // Handle updating existing note
  const handleUpdateNote = (rowId: string) => {
    if (!editingNoteText.trim()) {
      handleDeleteNote(rowId);
      return;
    }
    const updatedRows = rows.map(r => r.id === rowId ? { ...r, note: editingNoteText.trim() } : r);
    if (onRowsChange) {
      onRowsChange(updatedRows);
    }
    try {
      localStorage.setItem("recruitment_rows_data", JSON.stringify(updatedRows));
    } catch (e) {
      console.error(e);
    }
    setEditingNoteRowId(null);
    setEditingNoteText("");
    if (onToast) {
      onToast("备注已成功更新");
    }
  };

  // Handle deleting note
  const handleDeleteNote = (rowId: string) => {
    const updatedRows = rows.map(r => r.id === rowId ? { ...r, note: "" } : r);
    if (onRowsChange) {
      onRowsChange(updatedRows);
    }
    try {
      localStorage.setItem("recruitment_rows_data", JSON.stringify(updatedRows));
    } catch (e) {
      console.error(e);
    }
    setEditingNoteRowId(null);
    if (onToast) {
      onToast("备注已删除");
    }
  };

  // Export Detailed CSV Report for this major (Comprehensive Report)
  const handleExportDetailedReport = () => {
    const scopeLabel = timeScope === "current" ? `当日(${selectedDate})` : timeScope === "month" ? `${monthPrefix}月度累计` : "全部历史区间";
    const fileName = `${activeMajor}_招生详细统计报表_${timeScope === "current" ? selectedDate : timeScope === "month" ? monthPrefix : "全部区间"}.csv`;

    const lines: string[] = [];

    // Helper to safely format CSV cells
    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    // 1. Title & High Level Overview Header
    lines.push([escapeCsv(`【${activeMajor}】招生数据分析与详细统计报表`)].join(","));
    lines.push([
      escapeCsv("专业名称"),
      escapeCsv(activeMajor),
      escapeCsv("统计周期"),
      escapeCsv(scopeLabel),
      escapeCsv("基准日期"),
      escapeCsv(selectedDate),
      escapeCsv("报表导出时间"),
      escapeCsv(new Date().toLocaleString())
    ].join(","));
    lines.push([
      escapeCsv("招生计划总目标(人)"),
      escapeCsv(totalTarget),
      escapeCsv("实际招生完成(人)"),
      escapeCsv(totalActual),
      escapeCsv("综合达成率"),
      escapeCsv(`${overallRate}%`),
      escapeCsv("总差额(人)"),
      escapeCsv(totalActual - totalTarget > 0 ? `+${totalActual - totalTarget}` : totalActual - totalTarget)
    ].join(","));
    lines.push([
      escapeCsv("主力领跑渠道"),
      escapeCsv(topChannel ? `${topChannel.name} (完成${topChannel.actual}人 / 达成率${topChannel.rate}%)` : "无"),
      escapeCsv("待攻坚渠道"),
      escapeCsv(laggingChannel ? `${laggingChannel.name} (完成${laggingChannel.actual}人 / 达成率${laggingChannel.rate}%)` : "无"),
      escapeCsv("招生策略备注数"),
      escapeCsv(`${majorNotesList.length}条`)
    ].join(","));
    lines.push("");

    // 2. Channel Breakdown Table
    lines.push([escapeCsv("--- 渠道维度招生完成度明细统计 ---")].join(","));
    lines.push([
      escapeCsv("渠道名称"),
      escapeCsv("招生目标(人)"),
      escapeCsv("实际完成(人)"),
      escapeCsv("目标达成率(%)"),
      escapeCsv("占总实际比重(%)"),
      escapeCsv("与目标差额(人)"),
      escapeCsv("状态评估")
    ].join(","));

    channelMetrics.forEach(ch => {
      const actualPctOfTotal = totalActual > 0 ? ((ch.actual / totalActual) * 100).toFixed(1) : "0.0";
      const status = ch.rate >= 100 ? "超额达成" : ch.rate >= 70 ? "稳步推进" : "需重点关注";
      lines.push([
        escapeCsv(ch.name),
        escapeCsv(ch.target),
        escapeCsv(ch.actual),
        escapeCsv(`${ch.rate}%`),
        escapeCsv(`${actualPctOfTotal}%`),
        escapeCsv(ch.diff > 0 ? `+${ch.diff}` : ch.diff),
        escapeCsv(status)
      ].join(","));
    });
    lines.push("");

    // 3. Time Series Day-by-Day Progression Table
    lines.push([escapeCsv("--- 时间序列逐日招生走势明细 ---")].join(","));
    const timeHeaders = [
      escapeCsv("日期"),
      escapeCsv("当日计划目标(人)"),
      escapeCsv("当日实际招收(人)"),
      escapeCsv("当日达成率(%)"),
      escapeCsv("累计计划目标(人)"),
      escapeCsv("累计实际招收(人)"),
      escapeCsv("累计达成率(%)"),
      ...channelNames.map(cn => escapeCsv(`${cn}(人)`))
    ];
    lines.push(timeHeaders.join(","));

    allTimeSeriesData.forEach(item => {
      const dayRate = item.dayTarget > 0 ? ((item.dayActual / item.dayTarget) * 100).toFixed(1) : (item.dayActual > 0 ? "100.0" : "0.0");
      const rowVals = [
        escapeCsv(item.date),
        escapeCsv(item.dayTarget),
        escapeCsv(item.dayActual),
        escapeCsv(`${dayRate}%`),
        escapeCsv(item.cumulativeTarget),
        escapeCsv(item.cumulativeActual),
        escapeCsv(`${item.cumRate}%`),
        ...channelNames.map(cn => escapeCsv(item[cn] ?? 0))
      ];
      lines.push(rowVals.join(","));
    });
    lines.push("");

    // 4. Notes & Follow-up History Table
    lines.push([escapeCsv("--- 专业招生策略备注与历史跟进记录 ---")].join(","));
    lines.push([escapeCsv("序号"), escapeCsv("归属日期"), escapeCsv("策略建议 / 跟进内容")].join(","));
    if (majorNotesList.length === 0) {
      lines.push([escapeCsv("-"), escapeCsv("-"), escapeCsv("暂无备注记录")].join(","));
    } else {
      majorNotesList.forEach((n, idx) => {
        lines.push([
          escapeCsv(idx + 1),
          escapeCsv(n.date),
          escapeCsv(n.note)
        ].join(","));
      });
    }

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

    if (onToast) {
      onToast(`已成功导出「${activeMajor}」详细招生统计报表 CSV`);
    }
  };

  // Export Dedicated Daily Historical Metrics CSV for this major
  const handleExportDailyMetricsCsv = () => {
    const fileName = `${activeMajor}_历史逐日招生指标明细_${new Date().toISOString().substring(0, 10)}.csv`;

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const lines: string[] = [];
    
    // Header information
    lines.push([escapeCsv(`【${activeMajor}】历史逐日招生指标明细数据表`)].join(","));
    lines.push([
      escapeCsv("专业名称"),
      escapeCsv(activeMajor),
      escapeCsv("总记录天数"),
      escapeCsv(`${allTimeSeriesData.length}天`),
      escapeCsv("导出时间"),
      escapeCsv(new Date().toLocaleString())
    ].join(","));
    lines.push("");

    // Table Column Headers
    const headers = [
      escapeCsv("日期"),
      escapeCsv("专业名称"),
      escapeCsv("当日计划目标(人)"),
      escapeCsv("当日实际招收(人)"),
      escapeCsv("当日达成率(%)"),
      escapeCsv("当日差额(人)"),
      escapeCsv("累计计划目标(人)"),
      escapeCsv("累计实际招收(人)"),
      escapeCsv("累计达成率(%)"),
      escapeCsv("累计差额(人)"),
      ...channelNames.map(cn => escapeCsv(`渠道-${cn}(人)`)),
      escapeCsv("当日招生跟进备注")
    ];
    lines.push(headers.join(","));

    // Find notes map by date
    const notesByDate = new Map<string, string>();
    majorNotesList.forEach(n => {
      if (n.date) {
        const existing = notesByDate.get(n.date);
        notesByDate.set(n.date, existing ? `${existing} | ${n.note}` : n.note);
      }
    });

    // Populate daily rows from all historical time series data
    allTimeSeriesData.forEach(item => {
      const dayDiff = item.dayActual - item.dayTarget;
      const cumDiff = item.cumulativeActual - item.cumulativeTarget;
      const dayRate = item.dayTarget > 0 
        ? ((item.dayActual / item.dayTarget) * 100).toFixed(1) 
        : (item.dayActual > 0 ? "100.0" : "0.0");
      const dayNote = notesByDate.get(item.date) || "";

      const rowValues = [
        escapeCsv(item.date),
        escapeCsv(activeMajor),
        escapeCsv(item.dayTarget),
        escapeCsv(item.dayActual),
        escapeCsv(`${dayRate}%`),
        escapeCsv(dayDiff > 0 ? `+${dayDiff}` : dayDiff),
        escapeCsv(item.cumulativeTarget),
        escapeCsv(item.cumulativeActual),
        escapeCsv(`${item.cumRate}%`),
        escapeCsv(cumDiff > 0 ? `+${cumDiff}` : cumDiff),
        ...channelNames.map(cn => escapeCsv(item[cn] ?? 0)),
        escapeCsv(dayNote)
      ];
      lines.push(rowValues.join(","));
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

    if (onToast) {
      onToast(`已成功导出「${activeMajor}」逐日历史指标明细 CSV (${allTimeSeriesData.length}天数据)`);
    }
  };

  // Print or Save as PDF function
  const handlePrintOrPdf = () => {
    if (onToast) {
      onToast(`正在准备「${activeMajor}」报表打印与另存为 PDF...`);
    }
    
    // Give brief delay to dismiss any active dropdowns or hovers before printing
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.error("Window print failed:", err);
        if (onToast) onToast("无法直接调用打印机，请在浏览器菜单中选择打印或另存为 PDF");
      }
    }, 150);
  };

  // Generate deep-link URL for sharing with colleagues
  const deepLinkUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    try {
      const origin = window.location.origin || "";
      const pathname = window.location.pathname || "";
      const params = new URLSearchParams();
      params.set("major", activeMajor);
      if (includeDateInShare && selectedDate) {
        params.set("date", selectedDate);
      }
      return `${origin}${pathname}?${params.toString()}`;
    } catch {
      return `?major=${encodeURIComponent(activeMajor)}`;
    }
  }, [activeMajor, selectedDate, includeDateInShare]);

  // Copy share deep link to clipboard
  const handleCopyShareLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(deepLinkUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = deepLinkUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 2500);
      if (onToast) {
        onToast(`🎉 已成功复制「${activeMajor}」看板分享链接！`);
      }
    } catch (err) {
      console.error("Copy share link failed:", err);
      if (onToast) onToast("复制失败，请直接手动复制输入框中的链接");
    }
  };

  // Copy data summary text
  const handleCopySummary = () => {
    const summaryText = `【${activeMajor} 招生数据仪表盘简报】\n` +
      `📅 统计周期: ${timeScope === "current" ? selectedDate : timeScope === "month" ? `${monthPrefix}月度` : "全部历史"}\n` +
      `🎯 招生目标: ${totalTarget}人\n` +
      `👥 实际完成: ${totalActual}人\n` +
      `📊 整体达成率: ${overallRate}%\n` +
      `⭐ 领跑主力渠道: ${topChannel ? `${topChannel.name} (${topChannel.actual}人, 达成率${topChannel.rate}%)` : "无"}\n` +
      `⚠️ 待攻坚渠道: ${laggingChannel ? `${laggingChannel.name} (达成率${laggingChannel.rate}%)` : "无"}\n` +
      `📝 历史跟进记录条数: ${majorNotesList.length}条`;

    navigator.clipboard.writeText(summaryText);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
    if (onToast) onToast("专业数据简报已复制到剪贴板");
  };

  if (!isOpen || !activeMajor) return null;

  return (
    <div 
      id="major-detail-dashboard-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 overflow-hidden bg-black/75 backdrop-blur-md transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        id="major-detail-dashboard-modal-container"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={`major-detail-dashboard-modal w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden ${
          isDarkMode 
            ? "bg-slate-900 border-slate-750 text-slate-100 shadow-black/80" 
            : "bg-white border-slate-200 text-slate-900 shadow-2xl"
        }`}
      >
        {/* Modal Top Header Bar */}
        <div className={`px-5 py-3.5 border-b flex items-center justify-between gap-3 shrink-0 select-none ${
          isDarkMode ? "bg-slate-950/90 border-slate-800" : "bg-slate-50/90 border-slate-150"
        }`}>
          {/* Left Title & Major Selector */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white shadow-md shrink-0">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Major Selection Dropdown */}
                <div className="relative">
                  <select
                    id="major-dashboard-select"
                    value={activeMajor}
                    onChange={(e) => {
                      setActiveMajor(e.target.value);
                      if (onSelectMajor) onSelectMajor(e.target.value);
                    }}
                    className={`text-sm md:text-base font-black py-0.5 px-2.5 pr-8 rounded-lg border outline-none cursor-pointer appearance-none transition-all ${
                      isDarkMode 
                        ? "bg-slate-900 border-slate-700 text-indigo-300 focus:border-indigo-500" 
                        : "bg-white border-slate-300 text-indigo-900 focus:border-indigo-600 shadow-2xs"
                    }`}
                  >
                    {allMajorNames.map((m, mIdx) => (
                      <option key={`opt-maj-${m}-${mIdx}`} value={m}>{m}</option>
                    ))}
                  </select>
                  <ChevronRight className="w-3.5 h-3.5 rotate-90 absolute right-2.5 top-2 pointer-events-none text-slate-400" />
                </div>

                <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  overallRate >= 100 
                    ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30" 
                    : overallRate >= 70
                    ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                    : "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                }`}>
                  {overallRate >= 100 ? "🎉 达成标杆" : overallRate >= 70 ? "⚡ 稳步推进" : "⚠️ 需重点关注"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
                <span>专业专属全景数据看板</span>
                <span>•</span>
                <span>多渠道目标完成度对比、时间序列走势与招生跟进备注</span>
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Time Scope Toggle */}
            <div className={`hidden sm:flex items-center p-0.5 rounded-lg border text-xs font-bold ${
              isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-200/80 border-slate-300"
            }`}>
              <button
                type="button"
                onClick={() => setTimeScope("current")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  timeScope === "current"
                    ? isDarkMode ? "bg-indigo-600 text-white shadow-xs font-extrabold" : "bg-white text-indigo-900 shadow-xs font-extrabold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                当日 ({selectedDate.substring(5)})
              </button>
              <button
                type="button"
                onClick={() => setTimeScope("month")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  timeScope === "month"
                    ? isDarkMode ? "bg-indigo-600 text-white shadow-xs font-extrabold" : "bg-white text-indigo-900 shadow-xs font-extrabold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                本月累计
              </button>
              <button
                type="button"
                onClick={() => setTimeScope("all")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  timeScope === "all"
                    ? isDarkMode ? "bg-indigo-600 text-white shadow-xs font-extrabold" : "bg-white text-indigo-900 shadow-xs font-extrabold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                全部历史
              </button>
            </div>

            {/* Major Comparison Button */}
            <button
              type="button"
              id="major-dashboard-compare-btn"
              onClick={() => {
                const nextMode = !isComparisonMode;
                setIsComparisonMode(nextMode);
                if (nextMode && onToast) {
                  onToast(`已开启「${activeMajor}」与「${compareMajor}」横向对比模式`);
                }
              }}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 ${
                isComparisonMode
                  ? "bg-amber-500 text-white border-amber-600 shadow-amber-900/30 font-black"
                  : isDarkMode 
                  ? "bg-indigo-950/50 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/70 hover:border-indigo-400" 
                  : "bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-400 shadow-2xs"
              }`}
              title={isComparisonMode ? "退出横向对比模式，返回单专业看板" : `开启「${activeMajor}」与其它专业横向对比分析`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
              <span className="font-extrabold whitespace-nowrap">
                {isComparisonMode ? "退出对比" : "专业对比"}
              </span>
            </button>

            {/* Share Deep-Link Button */}
            <button
              type="button"
              id="major-dashboard-share-btn"
              onClick={() => setShowShareModal(true)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 ${
                isDarkMode 
                  ? "bg-violet-950/50 border-violet-500/40 text-violet-300 hover:bg-violet-900/70 hover:border-violet-400" 
                  : "bg-violet-50 border-violet-300 text-violet-700 hover:bg-violet-100 hover:border-violet-400 shadow-2xs"
              }`}
              title={`分享「${activeMajor}」专属看板深度链接 (Deep-Link)`}
            >
              <Share2 className="w-3.5 h-3.5 text-violet-500 shrink-0" />
              <span className="font-extrabold whitespace-nowrap">分享看板</span>
            </button>

            {/* Print / Save as PDF Button */}
            <button
              type="button"
              id="major-dashboard-print-pdf-btn"
              onClick={handlePrintOrPdf}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 ${
                isDarkMode 
                  ? "bg-sky-950/50 border-sky-500/40 text-sky-300 hover:bg-sky-900/70 hover:border-sky-400" 
                  : "bg-sky-50 border-sky-300 text-sky-700 hover:bg-sky-100 hover:border-sky-400 shadow-2xs"
              }`}
              title={`打印「${activeMajor}」招生分析报告或另存为 PDF 文件`}
            >
              <Printer className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span className="font-extrabold whitespace-nowrap">打印 / 另存PDF</span>
            </button>

            {/* Export Detailed Report Button */}
            <button
              type="button"
              id="major-dashboard-export-csv-btn"
              onClick={handleExportDetailedReport}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 ${
                isDarkMode 
                  ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/70 hover:border-emerald-400" 
                  : "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 shadow-2xs"
              }`}
              title={`导出「${activeMajor}」专属详细统计报表 CSV (含各渠道、时间序列走势与招生备注)`}
            >
              <Download className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="font-extrabold whitespace-nowrap">导出报表</span>
            </button>

            {/* Copy Summary Button */}
            <button
              type="button"
              onClick={handleCopySummary}
              className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                isDarkMode 
                  ? "bg-slate-900 border-slate-750 text-slate-300 hover:bg-slate-800" 
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs"
              }`}
              title="一键复制数据简报"
            >
              {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{copiedToast ? "已复制" : "复制简报"}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isDarkMode 
                  ? "border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white" 
                  : "border-slate-300 text-slate-500 hover:bg-slate-100 hover:text-slate-900 shadow-2xs"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Scrollable Body */}
        <div className="flex-1 overflow-y-auto thin-scrollbar p-4 md:p-6 space-y-6">
          
          {isComparisonMode ? (
            <MajorComparisonView
              isDarkMode={isDarkMode}
              primaryMajor={activeMajor}
              compareMajor={compareMajor}
              onSelectCompareMajor={setCompareMajor}
              onSwapMajors={() => {
                const temp = activeMajor;
                setActiveMajor(compareMajor);
                setCompareMajor(temp);
                if (onSelectMajor) onSelectMajor(compareMajor);
              }}
              onCloseComparison={() => setIsComparisonMode(false)}
              allMajorNames={allMajorNames}
              rows={rows}
              channelNames={channelNames}
              selectedDate={selectedDate}
              timeScope={timeScope}
              onTimeScopeChange={setTimeScope}
              onToast={onToast}
            />
          ) : (
            <>
              {/* Print-Only Executive Header Banner (Visible only during window.print) */}
              <div className="hidden print-show mb-4 pb-3 border-b-2 border-slate-800 text-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-black tracking-tight">【{activeMajor}】招生数据全景分析与详细报告</h1>
                    <p className="text-xs text-slate-600 mt-1">
                      统计周期: {timeScope === "current" ? `当日(${selectedDate})` : timeScope === "month" ? `${monthPrefix}月度累计` : "全部历史区间"}
                      {" | "}基准日期: {selectedDate}
                      {" | "}报表生成时间: {new Date().toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right text-xs font-mono font-bold">
                    <div>计划总目标: {totalTarget}人 | 实际完成: {totalActual}人</div>
                    <div className="text-indigo-600 text-sm font-black">综合达成率: {overallRate}%</div>
                  </div>
                </div>
              </div>

          {/* Top KPI Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 select-none">
            {/* 1. Target */}
            <div className={`p-3 rounded-xl border flex flex-col justify-between ${
              isDarkMode ? "bg-slate-950/70 border-slate-800" : "bg-slate-50/80 border-slate-200 shadow-3xs"
            }`}>
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Target className="w-3 h-3 text-indigo-500" />
                招生计划目标
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl md:text-2xl font-black font-mono tracking-tight">{totalTarget}</span>
                <span className="text-[10px] text-slate-400">人</span>
              </div>
            </div>

            {/* 2. Actual */}
            <div className={`p-3 rounded-xl border flex flex-col justify-between ${
              isDarkMode ? "bg-slate-950/70 border-slate-800" : "bg-slate-50/80 border-slate-200 shadow-3xs"
            }`}>
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Users className="w-3 h-3 text-emerald-500" />
                实际完成人数
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className={`text-xl md:text-2xl font-black font-mono tracking-tight ${
                  overallRate >= 100 ? "text-emerald-500" : "text-slate-800 dark:text-slate-100"
                }`}>
                  {totalActual}
                </span>
                <span className="text-[10px] text-slate-400">人</span>
              </div>
            </div>

            {/* 3. Completion Rate */}
            <div className={`p-3 rounded-xl border flex flex-col justify-between ${
              isDarkMode ? "bg-slate-950/70 border-slate-800" : "bg-slate-50/80 border-slate-200 shadow-3xs"
            }`}>
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Activity className="w-3 h-3 text-blue-500" />
                目标完成度
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className={`text-xl md:text-2xl font-black font-mono tracking-tight ${
                  overallRate >= 100 ? "text-emerald-500" : overallRate >= 70 ? "text-amber-500" : "text-rose-500"
                }`}>
                  {overallRate}%
                </span>
                <span className={`text-[10px] font-bold ${totalDiff >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {totalDiff >= 0 ? `+${totalDiff}` : totalDiff}人
                </span>
              </div>
            </div>

            {/* 4. Top Channel */}
            <div className={`p-3 rounded-xl border flex flex-col justify-between ${
              isDarkMode ? "bg-slate-950/70 border-slate-800" : "bg-slate-50/80 border-slate-200 shadow-3xs"
            }`}>
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-500" />
                最强主力渠道
              </span>
              <div className="mt-2 min-w-0">
                <div className="font-bold text-xs md:text-sm truncate text-amber-600 dark:text-amber-400">
                  {topChannel ? topChannel.name : "暂无"}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {topChannel ? `${topChannel.actual}人 (${topChannel.rate}%)` : "-"}
                </div>
              </div>
            </div>

            {/* 5. Lagging Channel */}
            <div className={`p-3 rounded-xl border flex flex-col justify-between ${
              isDarkMode ? "bg-slate-950/70 border-slate-800" : "bg-slate-50/80 border-slate-200 shadow-3xs"
            }`}>
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                待提速攻坚渠道
              </span>
              <div className="mt-2 min-w-0">
                <div className="font-bold text-xs md:text-sm truncate text-rose-600 dark:text-rose-400">
                  {laggingChannel ? laggingChannel.name : "全线达标"}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {laggingChannel ? `达成率: ${laggingChannel.rate}%` : "无滞后"}
                </div>
              </div>
            </div>

            {/* 6. Daily Average / Peak */}
            <div className={`p-3 rounded-xl border flex flex-col justify-between ${
              isDarkMode ? "bg-slate-950/70 border-slate-800" : "bg-slate-50/80 border-slate-200 shadow-3xs"
            }`}>
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-purple-500" />
                单日均值 / 单日峰值
              </span>
              <div className="mt-2 flex items-baseline justify-between font-mono">
                <span className="text-sm md:text-base font-black">{avgDaily}人</span>
                <span className="text-[10px] font-bold text-purple-500">
                  峰值:{peakDay?.dayActual || 0}
                </span>
              </div>
            </div>
          </div>

          {/* 7-Day Performance Sparkline & Key Enrollment Insights Strip */}
          <div 
            id="major-dashboard-7d-insights-section"
            className={`p-4 rounded-2xl border transition-all ${
              isDarkMode ? "bg-slate-950/70 border-slate-800" : "bg-white border-slate-200 shadow-3xs"
            }`}
          >
            {/* Top Sparkline Header & Mini Visualization */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs md:text-sm font-black tracking-tight text-slate-800 dark:text-slate-100">
                      近 7 天招生表现与核心洞察
                    </h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {last7DaysData.length > 0 ? `${last7DaysData[0]?.shortDate} ~ ${last7DaysData[last7DaysData.length - 1]?.shortDate}` : "近7日区间"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    基于最近 7 个统计周期的招收进度、推进势能与主力渠道多维数据提炼
                  </p>
                </div>
              </div>

              {/* Mini Sparkline Widget */}
              <div className="flex items-center space-x-3 self-start sm:self-auto bg-slate-50 dark:bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-medium">近7日招收走势</div>
                  <div className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                    共 {last7DaysData.reduce((acc, d) => acc + d.dayActual, 0)} 人
                  </div>
                </div>
                <div className="w-28 sm:w-32 h-7 flex items-center justify-center">
                  <MiniSparkline
                    data={last7DaysSparklineValues.length > 0 ? last7DaysSparklineValues : [0]}
                    dates={last7DaysData.map(d => d.shortDate)}
                    color="#10b981"
                    width={120}
                    height={28}
                    label="近7天招收"
                    unit="人"
                    isDarkMode={isDarkMode}
                  />
                </div>
              </div>
            </div>

            {/* Bulleted List of 3-4 Key Enrollment Performance Insights */}
            <div className="mt-3.5 space-y-2.5">
              <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>智能诊断与研判结论 ({last7DaysInsights.length} 条核心发现)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {last7DaysInsights.map((insight, idx) => {
                  const isPositive = insight.type === "positive";
                  const isNegative = insight.type === "negative";
                  const isWarning = insight.type === "warning";

                  const badgeBg = isPositive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : isNegative
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    : isWarning
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";

                  const dotColor = isPositive
                    ? "bg-emerald-500"
                    : isNegative
                    ? "bg-rose-500"
                    : isWarning
                    ? "bg-amber-500"
                    : "bg-indigo-500";

                  return (
                    <div
                      key={`major-7d-insight-${insight.id}-${idx}`}
                      id={`major-7d-insight-item-${idx}`}
                      className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all text-xs ${
                        isDarkMode
                          ? "bg-slate-900/60 border-slate-800/80 hover:border-slate-700"
                          : "bg-slate-50/60 border-slate-200/70 hover:bg-slate-50"
                      }`}
                    >
                      {/* Numbered bullet dot badge */}
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black font-mono border ${badgeBg}`}>
                        {idx + 1}
                      </span>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                            <span className="font-bold text-slate-800 dark:text-slate-100 truncate text-[11px] md:text-xs">
                              {insight.title}
                            </span>
                          </div>
                          {insight.highlight && (
                            <span className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded shrink-0 border ${badgeBg}`}>
                              {insight.highlight}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dynamic Cross-Chart Hover Highlighting Linkage Badge */}
          {hoveredChannel && (
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold shadow-2xs animate-fadeIn">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: channelMetrics.find(c => c.name === hoveredChannel)?.color || "#6366f1" }} />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: channelMetrics.find(c => c.name === hoveredChannel)?.color || "#6366f1" }} />
                </span>
                <span>跨图表联动聚焦：<strong className="text-indigo-900 dark:text-indigo-100 font-black">{hoveredChannel}</strong></span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  (已招收 {channelMetrics.find(c => c.name === hoveredChannel)?.actual || 0}人 / 目标 {channelMetrics.find(c => c.name === hoveredChannel)?.target || 0}人 / 达成率 {channelMetrics.find(c => c.name === hoveredChannel)?.rate || 0}%)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setHoveredChannel(null)}
                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 transition-colors cursor-pointer"
                title="取消当前渠道高亮锁定"
              >
                <X className="w-3.5 h-3.5" />
                <span>清除高亮</span>
              </button>
            </div>
          )}

          {/* Core Analytics Grid: Section 1 (Channel Donut/Pie Chart) & Section 2 (Time Series Trend Chart) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* SECTION 1: 不同渠道的招生目标完成度对比饼图 / 环形图 (5 Cols on LG) */}
            <div className={`lg:col-span-5 p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
              isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-white border-slate-200 shadow-3xs"
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                    <PieChartIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-black">不同渠道招生完成度对比</h3>
                    <p className="text-[10px] text-slate-400">悬停切片可联动高亮右侧对应渠道走势</p>
                  </div>
                </div>

                {/* Metric Type Switch */}
                <div className={`flex items-center p-0.5 rounded-lg border text-[10px] font-bold ${
                  isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"
                }`}>
                  <button
                    type="button"
                    onClick={() => setPieMetricType("actual_share")}
                    className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                      pieMetricType === "actual_share"
                        ? isDarkMode ? "bg-indigo-600 text-white font-black" : "bg-white text-indigo-900 shadow-2xs font-black"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    人数占比
                  </button>
                  <button
                    type="button"
                    onClick={() => setPieMetricType("completion_rate")}
                    className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                      pieMetricType === "completion_rate"
                        ? isDarkMode ? "bg-indigo-600 text-white font-black" : "bg-white text-indigo-900 shadow-2xs font-black"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    达成率对比
                  </button>
                </div>
              </div>

              {/* Donut Chart Canvas */}
              <div className="h-56 relative flex items-center justify-center">
                {pieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className={`p-2.5 rounded-xl text-xs font-sans shadow-xl border ${
                                  isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                                }`}>
                                  <div className="flex items-center gap-1.5 font-bold mb-1">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                                    <span>{d.name}</span>
                                    <span className="text-[10px] text-indigo-400 ml-auto font-normal">联动高亮中</span>
                                  </div>
                                  <div className="space-y-0.5 font-mono text-[11px]">
                                    <div className="flex justify-between gap-4">
                                      <span className="text-slate-400">实际招收:</span>
                                      <span className="font-bold">{d.actual ?? d.value}人</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <span className="text-slate-400">计划目标:</span>
                                      <span className="font-bold">{d.target}人</span>
                                    </div>
                                    <div className="flex justify-between gap-4 border-t pt-1 mt-1 dark:border-slate-800 border-slate-100">
                                      <span className="text-slate-400">达成率:</span>
                                      <span className={`font-black ${d.rate >= 100 ? "text-emerald-500" : "text-amber-500"}`}>{d.rate}%</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          {...({
                            activeIndex: activePieIndex !== -1 ? activePieIndex : undefined,
                            activeShape: renderActivePieShape
                          } as any)}
                          onMouseEnter={(_, index) => {
                            if (pieData[index]) {
                              setHoveredChannel(pieData[index].name);
                            }
                          }}
                          onMouseLeave={() => setHoveredChannel(null)}
                        >
                          {pieData.map((entry, index) => {
                            const isHovered = hoveredChannel === entry.name;
                            const isAnyHovered = hoveredChannel !== null;
                            return (
                              <Cell 
                                key={`cell-pie-${entry.name}-${index}`} 
                                fill={entry.color} 
                                fillOpacity={!isAnyHovered || isHovered ? 1 : 0.25}
                                stroke={isHovered ? (isDarkMode ? "#ffffff" : "#0f172a") : (isDarkMode ? "#0f172a" : "#ffffff")}
                                strokeWidth={isHovered ? 2.5 : 1.5}
                                className="transition-all duration-150 cursor-pointer"
                              />
                            );
                          })}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>

                    {/* Donut Hole Center Text */}
                    <div className="absolute pointer-events-none flex flex-col items-center justify-center text-center px-1">
                      {hoveredChannel ? (
                        <>
                          <span className="text-[10px] text-indigo-400 font-bold truncate max-w-[110px]">
                            {hoveredChannel}
                          </span>
                          <span className="text-lg font-black font-mono text-indigo-500">
                            {pieMetricType === "actual_share"
                              ? `${channelMetrics.find(c => c.name === hoveredChannel)?.actual || 0}人`
                              : `${channelMetrics.find(c => c.name === hoveredChannel)?.rate || 0}%`}
                          </span>
                          <span className="text-[9px] text-slate-400">联动聚焦</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">
                            {pieMetricType === "actual_share" ? "实际总招收" : "综合达成率"}
                          </span>
                          <span className="text-lg font-black font-mono text-indigo-500">
                            {pieMetricType === "actual_share" ? `${totalActual}人` : `${overallRate}%`}
                          </span>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-slate-400 text-xs flex flex-col items-center justify-center space-y-1">
                    <PieChartIcon className="w-8 h-8 opacity-30" />
                    <span>所选周期暂无渠道招生数据</span>
                  </div>
                )}
              </div>

              {/* Channel Breakdown Ranked Progress List */}
              <div className="space-y-1.5 max-h-44 overflow-y-auto thin-scrollbar pr-1 border-t pt-2 border-slate-200 dark:border-slate-800">
                {channelMetrics.map((ch, cIdx) => {
                  const actualPctOfTotal = totalActual > 0 ? Math.round((ch.actual / totalActual) * 100) : 0;
                  const isOver = ch.rate >= 100;
                  const isHovered = hoveredChannel === ch.name;
                  const isAnyHovered = hoveredChannel !== null;

                  return (
                    <div 
                      key={`ch-stat-row-${ch.name}-${cIdx}`}
                      onMouseEnter={() => setHoveredChannel(ch.name)}
                      onMouseLeave={() => setHoveredChannel(null)}
                      className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                        isHovered
                          ? (isDarkMode 
                              ? "bg-slate-800 border-indigo-500 ring-2 ring-indigo-500/50 shadow-md scale-[1.01]" 
                              : "bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-400/40 shadow-sm scale-[1.01]")
                          : isAnyHovered
                          ? (isDarkMode ? "bg-slate-900/30 border-slate-900 opacity-35" : "bg-slate-50/40 border-slate-100 opacity-35")
                          : (isDarkMode ? "bg-slate-900/50 border-slate-850 hover:bg-slate-850" : "bg-slate-50 border-slate-200/70 hover:bg-slate-100")
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <div className="flex items-center space-x-1.5">
                          <span 
                            className={`w-2 h-2 rounded-full shrink-0 transition-transform ${isHovered ? "scale-125 ring-2 ring-white/50" : ""}`} 
                            style={{ backgroundColor: ch.color }} 
                          />
                          <span className={`font-bold ${isHovered ? "text-indigo-600 dark:text-indigo-400 font-black" : ""}`}>{ch.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({actualPctOfTotal}%)</span>
                        </div>
                        <div className="flex items-center space-x-2 font-mono">
                          <span className="text-slate-400 font-medium">{ch.actual}/{ch.target}人</span>
                          <span className={`font-black text-[11px] ${isOver ? "text-emerald-500" : ch.rate >= 70 ? "text-amber-500" : "text-rose-500"}`}>
                            {ch.rate}%
                          </span>
                        </div>
                      </div>

                      {/* Mini Progress Bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, ch.rate)}%`,
                            backgroundColor: ch.color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: 时间序列趋势折线图 (7 Cols on LG) */}
            <div className={`lg:col-span-7 p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
              isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-white border-slate-200 shadow-3xs"
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <LineChartIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs md:text-sm font-black">招生时间序列走势分析</h3>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {trendDateRange === "7d" ? "近7天" : trendDateRange === "30d" ? "近30天" : "全量历史"} ({timeSeriesData.length}天)
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">切换时间范围与走势视角，悬停趋势线可联动高亮左侧饼图</p>
                  </div>
                </div>

                {/* Right side controls: Date Range Filter & Trend View Switcher */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Date Range Filter */}
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] text-slate-400 font-bold hidden sm:inline flex items-center gap-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      范围:
                    </span>
                    <div 
                      id="major-trend-date-range-filter"
                      className={`flex items-center p-0.5 rounded-lg border text-[10px] font-bold ${
                        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"
                      }`}
                    >
                      <button
                        type="button"
                        id="trend-range-7d-btn"
                        onClick={() => setTrendDateRange("7d")}
                        className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                          trendDateRange === "7d"
                            ? isDarkMode ? "bg-emerald-600 text-white font-black shadow-2xs" : "bg-white text-emerald-900 shadow-2xs font-black"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                        title="查看最近 7 天的招生走势数据"
                      >
                        近7天
                      </button>
                      <button
                        type="button"
                        id="trend-range-30d-btn"
                        onClick={() => setTrendDateRange("30d")}
                        className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                          trendDateRange === "30d"
                            ? isDarkMode ? "bg-emerald-600 text-white font-black shadow-2xs" : "bg-white text-emerald-900 shadow-2xs font-black"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                        title="查看最近 30 天的招生走势数据"
                      >
                        近30天
                      </button>
                      <button
                        type="button"
                        id="trend-range-all-btn"
                        onClick={() => setTrendDateRange("all")}
                        className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                          trendDateRange === "all"
                            ? isDarkMode ? "bg-emerald-600 text-white font-black shadow-2xs" : "bg-white text-emerald-900 shadow-2xs font-black"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                        title="查看全部历史区间的招生走势数据"
                      >
                        全部历史
                      </button>
                    </div>
                  </div>

                  {/* Trend View Switcher */}
                  <div className={`flex items-center p-0.5 rounded-lg border text-[10px] font-bold ${
                    isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"
                  }`}>
                    <button
                      type="button"
                      onClick={() => setTrendChartType("target_actual")}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        trendChartType === "target_actual"
                          ? isDarkMode ? "bg-emerald-600 text-white font-black" : "bg-white text-emerald-900 shadow-2xs font-black"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      计划vs实际
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrendChartType("channel_multi")}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        trendChartType === "channel_multi"
                          ? isDarkMode ? "bg-emerald-600 text-white font-black" : "bg-white text-emerald-900 shadow-2xs font-black"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      各渠道多线
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrendChartType("rate_trend")}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        trendChartType === "rate_trend"
                          ? isDarkMode ? "bg-emerald-600 text-white font-black" : "bg-white text-emerald-900 shadow-2xs font-black"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      达成率曲线
                    </button>
                  </div>

                  {/* Export Daily Trend CSV Button */}
                  <button
                    type="button"
                    id="major-trend-export-daily-csv-btn"
                    onClick={handleExportDailyMetricsCsv}
                    className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 ${
                      isDarkMode 
                        ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 hover:border-emerald-400" 
                        : "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400"
                    }`}
                    title={`导出「${activeMajor}」逐日历史走势指标数据为 CSV 文件`}
                  >
                    <Download className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="font-extrabold whitespace-nowrap">导出逐日CSV</span>
                  </button>
                </div>
              </div>

              {/* Trend Chart Canvas */}
              <div className="h-72 w-full pt-1">
                {timeSeriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {trendChartType === "target_actual" ? (
                      <ComposedChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} vertical={false} />
                        <XAxis 
                          dataKey="shortDate" 
                          stroke={isDarkMode ? "#64748b" : "#94a3b8"} 
                          fontSize={10} 
                          tickLine={false}
                        />
                        <YAxis 
                          stroke={isDarkMode ? "#64748b" : "#94a3b8"} 
                          fontSize={10} 
                          tickLine={false}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className={`p-2.5 rounded-xl text-xs font-sans shadow-xl border ${
                                  isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                                }`}>
                                  <div className="font-bold mb-1.5 flex items-center justify-between border-b pb-1 dark:border-slate-800 border-slate-100">
                                    <span>{d.date}</span>
                                    <span className={`font-mono ${d.dayRate >= 100 ? "text-emerald-500" : "text-amber-500"}`}>
                                      达成率: {d.dayRate}%
                                    </span>
                                  </div>
                                  <div className="space-y-1 font-mono text-[11px]">
                                    <div className="flex justify-between gap-4">
                                      <span className="text-emerald-500 font-bold">实际完成:</span>
                                      <span className="font-black">{d.dayActual}人</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <span className="text-indigo-500 font-bold">计划目标:</span>
                                      <span className="font-black">{d.dayTarget}人</span>
                                    </div>
                                    {hoveredChannel && d[hoveredChannel] !== undefined && (
                                      <div className="flex justify-between gap-4 border-t pt-1 dark:border-slate-800 border-slate-100 text-indigo-400 font-bold">
                                        <span>【{hoveredChannel}】:</span>
                                        <span>{d[hoveredChannel]}人</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between gap-4 border-t pt-1 dark:border-slate-800 border-slate-100 text-[10px] text-slate-400">
                                      <span>累计已招:</span>
                                      <span>{d.cumulativeActual}人 / {d.cumulativeTarget}人</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                        <Area 
                          type="monotone" 
                          dataKey="dayActual" 
                          name="当日实际完成" 
                          fill="url(#actualGrad)" 
                          stroke="#10b981" 
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: "#10b981" }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="dayTarget" 
                          name="当日计划目标" 
                          stroke="#6366f1" 
                          strokeWidth={2} 
                          strokeDasharray="4 4"
                          dot={{ r: 2.5, fill: "#6366f1" }}
                        />
                        {/* Overlay Highlight Line for Hovered Channel */}
                        {hoveredChannel && (
                          <Line 
                            type="monotone" 
                            dataKey={hoveredChannel} 
                            name={`【联动聚焦】${hoveredChannel}`} 
                            stroke={channelMetrics.find(c => c.name === hoveredChannel)?.color || "#f59e0b"} 
                            strokeWidth={3.5} 
                            dot={{ r: 4.5, fill: channelMetrics.find(c => c.name === hoveredChannel)?.color || "#f59e0b", stroke: isDarkMode ? "#0f172a" : "#ffffff", strokeWidth: 2 }}
                            activeDot={{ r: 6, strokeWidth: 2 }}
                            isAnimationActive={false}
                          />
                        )}
                      </ComposedChart>
                    ) : trendChartType === "channel_multi" ? (
                      <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} vertical={false} />
                        <XAxis dataKey="shortDate" stroke={isDarkMode ? "#64748b" : "#94a3b8"} fontSize={10} tickLine={false} />
                        <YAxis stroke={isDarkMode ? "#64748b" : "#94a3b8"} fontSize={10} tickLine={false} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className={`p-2.5 rounded-xl text-xs font-sans shadow-xl border min-w-[170px] ${
                                  isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                                }`}>
                                  <div className="font-bold mb-1.5 flex items-center justify-between border-b pb-1 dark:border-slate-800 border-slate-100">
                                    <span>{d.date}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">当日各渠道</span>
                                  </div>
                                  <div className="space-y-1 font-mono text-[11px]">
                                    {channelNames.map((cName, idx) => {
                                      const cColor = CHANNEL_COLOR_PALETTE[idx % CHANNEL_COLOR_PALETTE.length];
                                      const isHovered = hoveredChannel === cName;
                                      return (
                                        <div 
                                          key={`tt-ch-${cName}-${idx}`} 
                                          className={`flex items-center justify-between gap-3 px-1 py-0.5 rounded ${
                                            isHovered ? "bg-indigo-500/20 font-black text-indigo-400" : "text-slate-300"
                                          }`}
                                        >
                                          <span className="flex items-center gap-1.5 truncate">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cColor }} />
                                            <span>{cName}:</span>
                                          </span>
                                          <span className="font-bold">{d[cName] ?? 0}人</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: "10px", paddingTop: "6px" }} 
                          onMouseEnter={(e) => {
                            if (e && e.dataKey && typeof e.dataKey === "string") {
                              setHoveredChannel(e.dataKey);
                            }
                          }}
                          onMouseLeave={() => setHoveredChannel(null)}
                        />
                        {channelNames.map((cName, idx) => {
                          const color = CHANNEL_COLOR_PALETTE[idx % CHANNEL_COLOR_PALETTE.length];
                          const isHovered = hoveredChannel === cName;
                          const isAnyHovered = hoveredChannel !== null;

                          return (
                            <Line
                              key={`multi-line-${cName}-${idx}`}
                              type="monotone"
                              dataKey={cName}
                              name={cName}
                              stroke={color}
                              strokeWidth={isHovered ? 4.5 : isAnyHovered ? 1.2 : 2}
                              strokeOpacity={isHovered ? 1 : isAnyHovered ? 0.2 : 0.85}
                              strokeDasharray={!isHovered && isAnyHovered ? "3 3" : undefined}
                              dot={isHovered ? { r: 5, fill: color, stroke: isDarkMode ? "#0f172a" : "#fff", strokeWidth: 2 } : false}
                              activeDot={{ r: 6, fill: color, stroke: isDarkMode ? "#0f172a" : "#fff", strokeWidth: 2 }}
                              onMouseEnter={() => setHoveredChannel(cName)}
                              onMouseLeave={() => setHoveredChannel(null)}
                              className="cursor-pointer transition-all duration-150"
                            />
                          );
                        })}
                      </LineChart>
                    ) : (
                      <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} vertical={false} />
                        <XAxis dataKey="shortDate" stroke={isDarkMode ? "#64748b" : "#94a3b8"} fontSize={10} tickLine={false} />
                        <YAxis 
                          stroke={isDarkMode ? "#64748b" : "#94a3b8"} 
                          fontSize={10} 
                          tickLine={false}
                          unit="%"
                        />
                        <Tooltip />
                        <ReferenceLine y={100} stroke="#10b981" strokeDasharray="3 3" label={{ value: "100% 达标线", fill: "#10b981", fontSize: 10 }} />
                        <Line
                          type="monotone"
                          dataKey="dayRate"
                          name="单日达成率"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="cumRate"
                          name="累计达成率"
                          stroke="#f59e0b"
                          strokeWidth={2.5}
                          dot={{ r: 3.5 }}
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    暂无可展示的折线趋势数据
                  </div>
                )}
              </div>

              {/* Bottom Quick Statistical Footnote */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800 text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-500" />
                  <span>记录跨度: {timeSeriesData.length} 个记录日</span>
                </span>
                <span className="flex items-center gap-1">
                  <span>峰值日: <strong className="text-slate-700 dark:text-slate-200">{peakDay?.date || "无"}</strong> ({peakDay?.dayActual || 0}人)</span>
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: 该专业的招生备注与跟进记录列表 (Recruitment Notes Management) */}
          <div className={`p-4 rounded-2xl border space-y-4 ${
            isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-white border-slate-200 shadow-3xs"
          }`}>
            {/* Notes Section Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs md:text-sm font-black">{activeMajor} - 招生备注与跟进记录</h3>
                    <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      共 {majorNotesList.length} 条记录
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">记录该专业的重点攻坚策略、渠道反馈、突发异常排查与备忘</p>
                </div>
              </div>
            </div>

            {/* Quick Add Note Form */}
            <div className={`p-3 rounded-xl border space-y-2.5 ${
              isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <span className="font-bold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <Plus className="w-3.5 h-3.5 text-amber-500" />
                  <span>新增招生跟进备忘</span>
                </span>

                {/* Date selection for note */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] text-slate-400">归属日期:</span>
                  <input
                    type="date"
                    value={newNoteDate}
                    onChange={(e) => setNewNoteDate(e.target.value)}
                    className={`text-xs font-mono py-0.5 px-2 rounded border outline-none cursor-pointer ${
                      isDarkMode ? "bg-slate-950 border-slate-700 text-slate-200" : "bg-white border-slate-300 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              {/* Preset Tag Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 flex items-center gap-0.5 mr-1">
                  <Tag className="w-2.5 h-2.5" /> 快捷标签:
                </span>
                {PRESET_NOTE_TAGS.map((tag, tIdx) => {
                  const isSelected = selectedTag === tag.label;
                  return (
                    <button
                      key={`tag-chip-${tag.label}-${tIdx}`}
                      type="button"
                      onClick={() => setSelectedTag(isSelected ? "" : tag.label)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                        isSelected 
                          ? "bg-amber-500 text-white border-amber-600 shadow-2xs font-extrabold" 
                          : `${tag.color} hover:brightness-110`
                      }`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>

              {/* Textarea Input */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder={`在此输入 ${activeMajor} 的招生策略建议、生源反馈、渠道调整备忘...`}
                  rows={2}
                  className={`flex-1 p-2 text-xs rounded-lg border outline-none resize-none transition-all ${
                    isDarkMode 
                      ? "bg-slate-950 border-slate-750 text-slate-100 focus:border-amber-500 placeholder-slate-500" 
                      : "bg-white border-slate-300 text-slate-800 focus:border-amber-500 placeholder-slate-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleSaveNewNote}
                  disabled={!newNoteText.trim()}
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    newNoteText.trim()
                      ? "bg-amber-500 hover:bg-amber-600 text-white shadow-md font-extrabold"
                      : "bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>保存备注</span>
                </button>
              </div>
            </div>

            {/* Notes List Cards */}
            <div className="space-y-2 max-h-60 overflow-y-auto thin-scrollbar pr-1">
              {majorNotesList.length > 0 ? (
                majorNotesList.map((item, nIdx) => {
                  const isEditing = editingNoteRowId === item.rowId;

                  return (
                    <div
                      key={`major-note-card-${item.rowId}-${nIdx}`}
                      className={`p-3 rounded-xl border transition-all ${
                        isDarkMode 
                          ? "bg-slate-900/70 border-slate-800 hover:border-slate-700" 
                          : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="flex items-center gap-1 font-mono font-bold text-amber-600 dark:text-amber-400 text-[11px] bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                            <Calendar className="w-3 h-3" />
                            {item.date}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            记录于专业明细行 #{nIdx + 1}
                          </span>
                        </div>

                        {/* Note Item Actions */}
                        <div className="flex items-center space-x-1">
                          {!isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingNoteRowId(item.rowId);
                                  setEditingNoteText(item.note);
                                }}
                                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                                title="编辑备注"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteNote(item.rowId)}
                                className="p-1 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                                title="删除备注"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateNote(item.rowId)}
                                className="px-2 py-0.5 text-[10px] bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700"
                              >
                                保存
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingNoteRowId(null)}
                                className="px-2 py-0.5 text-[10px] bg-slate-500 text-white rounded font-bold hover:bg-slate-600"
                              >
                                取消
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Note Content */}
                      {isEditing ? (
                        <textarea
                          value={editingNoteText}
                          onChange={(e) => setEditingNoteText(e.target.value)}
                          rows={2}
                          className={`w-full p-2 text-xs rounded border outline-none resize-none ${
                            isDarkMode ? "bg-slate-950 border-slate-700 text-slate-100" : "bg-white border-slate-300 text-slate-800"
                          }`}
                        />
                      ) : (
                        <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-sans whitespace-pre-line pl-1 border-l-2 border-amber-500/40">
                          {item.note}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs space-y-1">
                  <StickyNote className="w-7 h-7 mx-auto opacity-30 text-amber-500" />
                  <p>该专业目前暂无招生备注与跟进记录</p>
                  <p className="text-[11px] text-slate-500">可在上方表单中快捷录入该专业的第一条策略备忘</p>
                </div>
              )}
            </div>
          </div>
          </>
          )}
        </div>

        {/* Modal Bottom Footer Bar */}
        <div className={`px-5 py-3 border-t flex items-center justify-between shrink-0 select-none text-xs gap-3 flex-wrap ${
          isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center space-x-3 text-slate-400 text-[11px] flex-wrap">
            <span>提示: 按 <kbd className="px-1 py-0.2 rounded border bg-black/10 dark:bg-white/10 font-mono font-bold">ESC</kbd> 键可随时退出</span>
            <span className="hidden sm:inline">•</span>
            <button
              type="button"
              id="major-dashboard-footer-export-daily-btn"
              onClick={handleExportDailyMetricsCsv}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              title="导出当前专业全部历史日期的逐日指标明细数据"
            >
              <Download className="w-3 h-3" />
              <span>下载逐日历史指标 (.CSV)</span>
            </button>
            <span className="hidden sm:inline">•</span>
            <button
              type="button"
              onClick={handleExportDetailedReport}
              className="text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>下载全周期汇总报表 (.CSV)</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              id="major-dashboard-footer-compare-btn"
              onClick={() => {
                const nextMode = !isComparisonMode;
                setIsComparisonMode(nextMode);
                if (nextMode && onToast) {
                  onToast(`已开启「${activeMajor}」与「${compareMajor}」横向对比模式`);
                }
              }}
              className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs ${
                isComparisonMode
                  ? "bg-amber-500 text-white border-amber-600 shadow-amber-900/30"
                  : isDarkMode 
                  ? "bg-indigo-950/40 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60" 
                  : "bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100 shadow-2xs"
              }`}
              title={isComparisonMode ? "退出横向对比模式" : "开启多专业横向对比分析"}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>{isComparisonMode ? "退出对比" : "专业横向对比"}</span>
            </button>
            <button
              type="button"
              id="major-dashboard-footer-share-btn"
              onClick={() => setShowShareModal(true)}
              className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs ${
                isDarkMode 
                  ? "bg-violet-950/40 border-violet-500/40 text-violet-300 hover:bg-violet-900/60" 
                  : "bg-violet-50 border-violet-300 text-violet-700 hover:bg-violet-100 shadow-2xs"
              }`}
              title={`分享「${activeMajor}」深度链接`}
            >
              <Share2 className="w-3.5 h-3.5 text-violet-500" />
              <span>分享看板</span>
            </button>
            <button
              type="button"
              onClick={handlePrintOrPdf}
              className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs ${
                isDarkMode 
                  ? "bg-sky-950/40 border-sky-500/40 text-sky-300 hover:bg-sky-900/60" 
                  : "bg-sky-50 border-sky-300 text-sky-700 hover:bg-sky-100 shadow-2xs"
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-sky-500" />
              <span>打印 / 另存PDF</span>
            </button>
            <button
              type="button"
              onClick={handleExportDetailedReport}
              className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs ${
                isDarkMode 
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60" 
                  : "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 shadow-2xs"
              }`}
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>导出报表</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all cursor-pointer shadow-sm text-xs"
            >
              完成并关闭
            </button>
          </div>
        </div>

        {/* Deep Link Share Prompt Popover / Dialog */}
        <AnimatePresence>
          {showShareModal && (
            <div 
              key="major-share-prompt-overlay"
              id="major-share-prompt-overlay"
              className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs transition-all"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowShareModal(false);
                }
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 10 }}
                transition={{ duration: 0.18 }}
                className={`w-full max-w-lg p-5 md:p-6 rounded-2xl border shadow-2xl space-y-4 relative ${
                  isDarkMode 
                    ? "bg-slate-900 border-violet-500/30 text-slate-100 shadow-black/80" 
                    : "bg-white border-violet-200 text-slate-900 shadow-2xl"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center border border-violet-500/20 shrink-0">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm md:text-base font-black tracking-tight flex items-center gap-1.5">
                        <span>分享「{activeMajor}」招生看板</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">专属深度链接 (Deep-Link URL)</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowShareModal(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  同事在浏览器中打开此链接将直接打开并展示<strong className="text-violet-600 dark:text-violet-400 font-bold">「{activeMajor}」</strong>的完整招生仪表盘、时间序列走势、渠道结构与策略备忘。
                </p>

                {/* Option to include selected date */}
                <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer select-none text-slate-600 dark:text-slate-300 p-2 rounded-lg bg-slate-500/5 border border-slate-500/10">
                  <input
                    type="checkbox"
                    checked={includeDateInShare}
                    onChange={(e) => setIncludeDateInShare(e.target.checked)}
                    className="rounded border-slate-400 text-violet-600 focus:ring-violet-500 cursor-pointer w-4 h-4"
                  />
                  <span>包含当前基准日期参数 (<span className="font-mono text-violet-500 font-bold">{selectedDate}</span>)</span>
                </label>

                {/* URL Input with Copy Button */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Link2 className="w-3.5 h-3.5 text-violet-400" />
                      直达深度链接:
                    </span>
                    <span className="text-[10px] text-violet-500 font-mono">点击输入框全选</span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      readOnly
                      value={deepLinkUrl}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className={`w-full pl-3 pr-24 py-2.5 text-xs font-mono rounded-xl border outline-none select-all ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-750 text-violet-300 focus:border-violet-500" 
                          : "bg-slate-50 border-slate-300 text-violet-900 focus:border-violet-500"
                      }`}
                    />
                    <button
                      type="button"
                      id="major-share-copy-link-btn"
                      onClick={handleCopyShareLink}
                      className={`absolute right-1 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                        shareLinkCopied
                          ? "bg-emerald-600 text-white shadow-emerald-900/30"
                          : "bg-violet-600 hover:bg-violet-700 text-white active:scale-95 shadow-violet-900/30"
                      }`}
                    >
                      {shareLinkCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>已复制!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>一键复制</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.open(deepLinkUrl, "_blank");
                      }
                    }}
                    className="text-slate-500 hover:text-violet-500 dark:text-slate-400 dark:hover:text-violet-300 flex items-center gap-1.5 font-bold transition-colors cursor-pointer py-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-violet-500" />
                    <span>在浏览器新标签页测试</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowShareModal(false)}
                      className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all cursor-pointer shadow-sm text-xs"
                    >
                      完成
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default MajorDetailDashboardModal;
