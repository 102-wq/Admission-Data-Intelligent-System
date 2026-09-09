/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { RowData, TableConfig, WeeklySnapshot } from "../types";
import {
  TrendingUp,
  Calendar,
  Sparkles,
  ChevronRight,
  LineChart as LucideLineChart,
  PieChart as LucidePieChart,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  CheckCircle2,
  Activity,
  Award,
  Flame,
  Zap,
  Archive,
  Bookmark,
  Plus,
  Trash2,
  Edit3,
  Eye,
  BarChart2,
  Clock,
  Layers,
  FileText,
  History,
  X,
  Download,
  RotateCcw,
  Check,
  Search,
  CheckSquare,
  MessageSquare
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  Sector,
  ComposedChart
} from "recharts";

const PIE_COLORS = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#f43f5e", // Rose
  "#3b82f6", // Blue
  "#a855f7", // Purple
];

const LOCAL_STORAGE_KEY = "enrollment_weekly_snapshots";

// Pre-filled sample snapshots for historical review if LocalStorage is empty
const DEFAULT_SAMPLE_SNAPSHOTS: WeeklySnapshot[] = [
  {
    id: "snap-sample-w23",
    title: "2026年第23周 (06/07 ~ 06/13) 高考刚需预热周",
    createdAt: "2026-06-13 18:00",
    startDate: "2026-06-07",
    endDate: "2026-06-13",
    totalActual: 385,
    totalTarget: 500,
    completionRate: 77.0,
    averageDaily: 55,
    peakDaily: 72,
    peakDate: "2026-06-12",
    note: "高考刚结束，全国线上招生咨询通道全面开启，各渠道咨询量平稳爬坡上升。",
    channelBreakdown: [
      { name: "线上宣讲", target: 120, actual: 95 },
      { name: "线下高招会", target: 110, actual: 80 },
      { name: "抖音信息流", target: 90, actual: 75 },
      { name: "微信公众号", target: 70, actual: 55 },
      { name: "百度搜索", target: 50, actual: 40 },
      { name: "老生带新生", target: 35, actual: 25 },
      { name: "高中直宣", target: 25, actual: 15 }
    ],
    majorBreakdown: [
      { name: "人工智能与软件工程", target: 150, actual: 125, rate: 83.3 },
      { name: "智能制造与自动化", target: 120, actual: 92, rate: 76.7 },
      { name: "数字经济与金融科技", target: 110, actual: 82, rate: 74.5 },
      { name: "新能源与汽车工程", target: 80, actual: 56, rate: 70.0 },
      { name: "创意设计与新媒体", target: 40, actual: 30, rate: 75.0 }
    ],
    dailyRecords: [
      { date: "2026-06-07", actual: 42, target: 70, rate: 60.0 },
      { date: "2026-06-08", actual: 48, target: 70, rate: 68.6 },
      { date: "2026-06-09", actual: 52, target: 70, rate: 74.3 },
      { date: "2026-06-10", actual: 55, target: 70, rate: 78.6 },
      { date: "2026-06-11", actual: 58, target: 75, rate: 77.3 },
      { date: "2026-06-12", actual: 72, target: 75, rate: 96.0 },
      { date: "2026-06-13", actual: 58, target: 70, rate: 82.9 }
    ]
  },
  {
    id: "snap-sample-w24",
    title: "2026年第24周 (06/14 ~ 06/20) 咨询意向冲刺周",
    createdAt: "2026-06-20 18:30",
    startDate: "2026-06-14",
    endDate: "2026-06-20",
    totalActual: 560,
    totalTarget: 580,
    completionRate: 96.6,
    averageDaily: 80,
    peakDaily: 105,
    peakDate: "2026-06-19",
    note: "招办咨询热线爆满，抖音信息流与线下高招会双轮驱动，完成率突破 96%。",
    channelBreakdown: [
      { name: "线上宣讲", target: 135, actual: 130 },
      { name: "线下高招会", target: 125, actual: 128 },
      { name: "抖音信息流", target: 110, actual: 122 },
      { name: "微信公众号", target: 80, actual: 72 },
      { name: "百度搜索", target: 60, actual: 52 },
      { name: "老生带新生", target: 40, actual: 35 },
      { name: "高中直宣", target: 30, actual: 21 }
    ],
    majorBreakdown: [
      { name: "人工智能与软件工程", target: 180, actual: 182, rate: 101.1 },
      { name: "智能制造与自动化", target: 140, actual: 135, rate: 96.4 },
      { name: "数字经济与金融科技", target: 125, actual: 118, rate: 94.4 },
      { name: "新能源与汽车工程", target: 85, actual: 80, rate: 94.1 },
      { name: "创意设计与新媒体", target: 50, actual: 45, rate: 90.0 }
    ],
    dailyRecords: [
      { date: "2026-06-14", actual: 68, target: 80, rate: 85.0 },
      { date: "2026-06-15", actual: 72, target: 80, rate: 90.0 },
      { date: "2026-06-16", actual: 78, target: 80, rate: 97.5 },
      { date: "2026-06-17", actual: 82, target: 80, rate: 102.5 },
      { date: "2026-06-18", actual: 88, target: 85, rate: 103.5 },
      { date: "2026-06-19", actual: 105, target: 90, rate: 116.7 },
      { date: "2026-06-20", actual: 67, target: 85, rate: 78.8 }
    ]
  },
  {
    id: "snap-sample-w25",
    title: "2026年第25周 (06/21 ~ 06/27) 高考出分志愿填报爆发周",
    createdAt: "2026-06-27 19:15",
    startDate: "2026-06-21",
    endDate: "2026-06-27",
    totalActual: 688,
    totalTarget: 640,
    completionRate: 107.5,
    averageDaily: 98,
    peakDaily: 124,
    peakDate: "2026-06-25",
    note: "各地高考出分投档，AI与软件工程、数字经济专业报名超额爆满，整体完成率107.5%。",
    channelBreakdown: [
      { name: "线上宣讲", target: 150, actual: 165 },
      { name: "线下高招会", target: 140, actual: 152 },
      { name: "抖音信息流", target: 120, actual: 145 },
      { name: "微信公众号", target: 90, actual: 92 },
      { name: "百度搜索", target: 70, actual: 64 },
      { name: "老生带新生", target: 40, actual: 42 },
      { name: "高中直宣", target: 30, actual: 28 }
    ],
    majorBreakdown: [
      { name: "人工智能与软件工程", target: 200, actual: 228, rate: 114.0 },
      { name: "智能制造与自动化", target: 150, actual: 160, rate: 106.7 },
      { name: "数字经济与金融科技", target: 140, actual: 148, rate: 105.7 },
      { name: "新能源与汽车工程", target: 95, actual: 98, rate: 103.2 },
      { name: "创意设计与新媒体", target: 55, actual: 54, rate: 98.2 }
    ],
    dailyRecords: [
      { date: "2026-06-21", actual: 82, target: 90, rate: 91.1 },
      { date: "2026-06-22", actual: 88, target: 90, rate: 97.8 },
      { date: "2026-06-23", actual: 95, target: 90, rate: 105.6 },
      { date: "2026-06-24", actual: 108, target: 90, rate: 120.0 },
      { date: "2026-06-25", actual: 124, target: 95, rate: 130.5 },
      { date: "2026-06-26", actual: 102, target: 95, rate: 107.4 },
      { date: "2026-06-27", actual: 89, target: 90, rate: 98.9 }
    ]
  }
];

interface DataInsightsProps {
  rows: RowData[];
  config: TableConfig;
  selectedDate: string;
  isDarkMode: boolean;
  onSelectMajor?: (majorName: string) => void;
}

export default function DataInsights({
  rows,
  config,
  selectedDate,
  isDarkMode,
  onSelectMajor
}: DataInsightsProps) {
  // Main Sub-Tab Mode: "live" (7日实时洞察) | "history" (历史周度回顾)
  const [activeTab, setActiveTab] = useState<"live" | "history">("live");

  // Metric Mode in Live Insights: "actual" | "target" | "both"
  const [metricMode, setMetricMode] = useState<"actual" | "target" | "both">("both");
  
  // Custom interactive state for hovered or selected point in the live chart
  const [activeDateIndex, setActiveDateIndex] = useState<number | null>(null);

  // Timeframe for the major ring chart: "day" | "month"
  const [pieTimeframe, setPieTimeframe] = useState<"day" | "month">("day");

  // Hover state for the major ring/donut chart sector
  const [hoveredPieIndex, setHoveredPieIndex] = useState<number | null>(null);

  // LocalStorage archived snapshots state
  const [snapshots, setSnapshots] = useState<WeeklySnapshot[]>([]);

  // Modal & Toast States
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [snapshotTitleInput, setSnapshotTitleInput] = useState("");
  const [snapshotNoteInput, setSnapshotNoteInput] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected Snapshot detail modal
  const [selectedSnapshotForDetail, setSelectedSnapshotForDetail] = useState<WeeklySnapshot | null>(null);

  // Edit Note State
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState("");

  // Search filter for historical snapshots
  const [historySearchQuery, setHistorySearchQuery] = useState("");

  // History Chart Metric Mode: "composed" | "rate" | "daily"
  const [historyChartMetric, setHistoryChartMetric] = useState<"composed" | "rate" | "daily">("composed");

  // Load snapshots from LocalStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSnapshots(parsed);
          return;
        }
      }
      // Initialize with sample presets if empty
      setSnapshots(DEFAULT_SAMPLE_SNAPSHOTS);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_SAMPLE_SNAPSHOTS));
    } catch (err) {
      console.error("Failed to read localStorage snapshots:", err);
      setSnapshots(DEFAULT_SAMPLE_SNAPSHOTS);
    }
  }, []);

  // Save helper to persist snapshots
  const saveSnapshotsToStorage = (updated: WeeklySnapshot[]) => {
    setSnapshots(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to write localStorage snapshots:", err);
    }
  };

  // Custom active shape for donut sector hover effect
  const renderActiveShape = (props: any) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill
    } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 3}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{
            filter: "drop-shadow(0px 6px 14px rgba(0, 0, 0, 0.28))",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={outerRadius + 11}
          outerRadius={outerRadius + 13}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.65}
        />
      </g>
    );
  };

  // 1. Extract all unique dates in chronological order (ascending)
  const allChronologicalDates = useMemo(() => {
    const dates = Array.from(new Set(rows.map((r) => r.date)));
    return dates.sort((a, b) => a.localeCompare(b));
  }, [rows]);

  // 2. Identify the 7-day window ending at selectedDate (or latest date if selectedDate is not present)
  const trendDaysData = useMemo(() => {
    if (allChronologicalDates.length === 0) return [];

    let targetIndex = allChronologicalDates.indexOf(selectedDate);
    if (targetIndex === -1) {
      targetIndex = allChronologicalDates.length - 1;
    }

    let startIndex = Math.max(0, targetIndex - 6);
    let endIndex = targetIndex;

    const windowLength = endIndex - startIndex + 1;
    if (windowLength < 7 && allChronologicalDates.length >= 7) {
      if (startIndex === 0) {
        endIndex = Math.min(6, allChronologicalDates.length - 1);
      } else {
        startIndex = Math.max(0, endIndex - 6);
      }
    }

    const windowDates = allChronologicalDates.slice(startIndex, endIndex + 1);

    return windowDates.map((date) => {
      const dayRows = rows.filter((r) => r.date === date);
      
      let target = 0;
      let actual = 0;
      let other = 0;

      dayRows.forEach((row) => {
        const rowTarget = row.channels.reduce((sum, ch) => sum + ch.target, 0);
        const rowActual = row.channels.reduce((sum, ch) => sum + ch.actual, 0);
        target += rowTarget;
        actual += rowActual;
        other += row.other;
      });

      const totalActual = actual + other;
      const rate = target > 0 ? (totalActual / target) * 100 : 0;

      const channelBreakdown = config.channels.map((chName, chIdx) => {
        let chTarget = 0;
        let chActual = 0;
        dayRows.forEach((row) => {
          if (chIdx < row.channels.length) {
            chTarget += row.channels[chIdx].target;
            chActual += row.channels[chIdx].actual;
          }
        });
        return { name: chName, target: chTarget, actual: chActual };
      });

      const majorMap: Record<string, { target: number; actual: number }> = {};
      dayRows.forEach((row) => {
        const rowTarget = row.channels.reduce((sum, ch) => sum + ch.target, 0);
        const rowActual = row.channels.reduce((sum, ch) => sum + ch.actual, 0) + row.other;
        if (!majorMap[row.name]) {
          majorMap[row.name] = { target: 0, actual: 0 };
        }
        majorMap[row.name].target += rowTarget;
        majorMap[row.name].actual += rowActual;
      });

      const majorBreakdown = Object.entries(majorMap).map(([name, stats]) => ({
        name,
        target: stats.target,
        actual: stats.actual,
        rate: stats.target > 0 ? (stats.actual / stats.target) * 100 : 0
      })).sort((a, b) => b.actual - a.actual);

      return {
        date,
        displayDate: date.substring(5).replace("-", "/"),
        target,
        actual: totalActual,
        other,
        rate,
        channelBreakdown,
        majorBreakdown,
        recordCount: dayRows.length
      };
    });
  }, [allChronologicalDates, rows, selectedDate, config.channels]);

  // Handle active details based on selected or hovered date
  const activeDayStats = useMemo(() => {
    if (trendDaysData.length === 0) return null;
    if (activeDateIndex !== null && trendDaysData[activeDateIndex]) {
      return trendDaysData[activeDateIndex];
    }
    const foundIdx = trendDaysData.findIndex((d) => d.date === selectedDate);
    if (foundIdx !== -1) {
      return trendDaysData[foundIdx];
    }
    return trendDaysData[trendDaysData.length - 1];
  }, [trendDaysData, activeDateIndex, selectedDate]);

  // Aggregate stats across the 7-day period
  const periodSummary = useMemo(() => {
    if (trendDaysData.length === 0) {
      return {
        totalActual: 0,
        totalTarget: 0,
        averageActual: 0,
        peakActualValue: 0,
        peakActualDate: "",
        overallRate: 0,
        trendDirection: "neutral" as "up" | "down" | "neutral",
        trendPct: 0
      };
    }

    let sumActual = 0;
    let sumTarget = 0;
    let peakActualValue = -1;
    let peakActualDate = "";

    trendDaysData.forEach((day) => {
      sumActual += day.actual;
      sumTarget += day.target;
      if (day.actual > peakActualValue) {
        peakActualValue = day.actual;
        peakActualDate = day.date;
      }
    });

    const averageActual = Math.round(sumActual / trendDaysData.length);
    const overallRate = sumTarget > 0 ? (sumActual / sumTarget) * 100 : 0;

    const mid = Math.floor(trendDaysData.length / 2);
    const firstHalf = trendDaysData.slice(0, mid);
    const secondHalf = trendDaysData.slice(mid);
    
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((s, d) => s + d.actual, 0) / firstHalf.length : 0;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((s, d) => s + d.actual, 0) / secondHalf.length : 0;

    let trendDirection: "up" | "down" | "neutral" = "neutral";
    let trendPct = 0;

    if (firstAvg > 0) {
      trendPct = ((secondAvg - firstAvg) / firstAvg) * 100;
      if (trendPct > 3) {
        trendDirection = "up";
      } else if (trendPct < -3) {
        trendDirection = "down";
      }
    }

    return {
      totalActual: sumActual,
      totalTarget: sumTarget,
      averageActual,
      peakActualValue,
      peakActualDate,
      overallRate,
      trendDirection,
      trendPct: Math.abs(trendPct)
    };
  }, [trendDaysData]);

  // Construct current weekly snapshot preview for archiving
  const currentSnapshotPreview = useMemo<WeeklySnapshot>(() => {
    const startDate = trendDaysData[0]?.date || selectedDate;
    const endDate = trendDaysData[trendDaysData.length - 1]?.date || selectedDate;
    const dateRangeLabel = `${startDate.substring(5).replace("-", "/")} ~ ${endDate.substring(5).replace("-", "/")}`;

    // Channel totals
    const channelSums: Record<string, { target: number; actual: number }> = {};
    config.channels.forEach((name) => {
      channelSums[name] = { target: 0, actual: 0 };
    });
    trendDaysData.forEach((day) => {
      day.channelBreakdown.forEach((ch) => {
        if (channelSums[ch.name]) {
          channelSums[ch.name].actual += ch.actual;
          channelSums[ch.name].target += ch.target;
        }
      });
    });
    const channelBreakdown = Object.entries(channelSums).map(([name, stats]) => ({
      name,
      target: stats.target,
      actual: stats.actual
    }));

    // Major totals
    const majorSums: Record<string, { target: number; actual: number }> = {};
    trendDaysData.forEach((day) => {
      day.majorBreakdown.forEach((maj) => {
        if (!majorSums[maj.name]) {
          majorSums[maj.name] = { target: 0, actual: 0 };
        }
        majorSums[maj.name].actual += maj.actual;
        majorSums[maj.name].target += maj.target;
      });
    });
    const majorBreakdown = Object.entries(majorSums)
      .map(([name, stats]) => ({
        name,
        target: stats.target,
        actual: stats.actual,
        rate: stats.target > 0 ? (stats.actual / stats.target) * 100 : 0
      }))
      .sort((a, b) => b.actual - a.actual);

    return {
      id: `snap-${Date.now()}`,
      title: `周度数据归档 (${dateRangeLabel})`,
      createdAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      startDate,
      endDate,
      totalActual: periodSummary.totalActual,
      totalTarget: periodSummary.totalTarget,
      completionRate: periodSummary.overallRate,
      averageDaily: periodSummary.averageActual,
      peakDaily: periodSummary.peakActualValue,
      peakDate: periodSummary.peakActualDate,
      channelBreakdown,
      majorBreakdown,
      dailyRecords: trendDaysData.map((d) => ({
        date: d.date,
        actual: d.actual,
        target: d.target,
        rate: d.rate
      })),
      note: ""
    };
  }, [trendDaysData, periodSummary, selectedDate, config.channels]);

  // Open modal to archive current week snapshot
  const handleOpenSaveModal = () => {
    setSnapshotTitleInput(currentSnapshotPreview.title);
    setSnapshotNoteInput("");
    setIsSaveModalOpen(true);
  };

  // Confirm Save Snapshot
  const handleConfirmSaveSnapshot = () => {
    if (!snapshotTitleInput.trim()) return;

    const newSnap: WeeklySnapshot = {
      ...currentSnapshotPreview,
      id: `snap-${Date.now()}`,
      title: snapshotTitleInput.trim(),
      note: snapshotNoteInput.trim(),
      createdAt: new Date().toLocaleString("zh-CN", { hour12: false })
    };

    const updated = [newSnap, ...snapshots];
    saveSnapshotsToStorage(updated);
    setIsSaveModalOpen(false);

    // Toast
    setToastMessage(`周度快照【${newSnap.title}】已成功归档并存入本地 LocalStorage！`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Delete Snapshot
  const handleDeleteSnapshot = (id: string, title: string) => {
    if (window.confirm(`确定要删除周度快照【${title}】吗？`)) {
      const updated = snapshots.filter((s) => s.id !== id);
      saveSnapshotsToStorage(updated);
      setToastMessage(`已移除快照【${title}】`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Save edited note
  const handleSaveEditedNote = (id: string) => {
    const updated = snapshots.map((s) => {
      if (s.id === id) {
        return { ...s, note: editingNoteValue.trim() };
      }
      return s;
    });
    saveSnapshotsToStorage(updated);
    setEditingNoteId(null);
    setEditingNoteValue("");
    setToastMessage("快照备注已更新");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Reset to default sample snapshots
  const handleResetToDefaultSnapshots = () => {
    if (window.confirm("重置将会恢复系统默认预置的周度数据快照，是否继续？")) {
      saveSnapshotsToStorage(DEFAULT_SAMPLE_SNAPSHOTS);
      setToastMessage("已恢复默认历史周度快照示例");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Export Snapshot as JSON file download
  const handleExportSnapshotJSON = (snap: WeeklySnapshot) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snap, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `snapshot_${snap.startDate}_${snap.endDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filtered historical snapshots by search query
  const filteredSnapshots = useMemo(() => {
    if (!historySearchQuery.trim()) return snapshots;
    const q = historySearchQuery.toLowerCase();
    return snapshots.filter((s) => 
      s.title.toLowerCase().includes(q) ||
      s.startDate.includes(q) ||
      s.endDate.includes(q) ||
      (s.note && s.note.toLowerCase().includes(q))
    );
  }, [snapshots, historySearchQuery]);

  // Dynamic smart analytical statements for live view
  const dynamicInsights = useMemo(() => {
    if (trendDaysData.length === 0) return [];
    
    const insights: string[] = [];
    
    const channelSums: Record<string, { target: number; actual: number }> = {};
    config.channels.forEach((name) => {
      channelSums[name] = { target: 0, actual: 0 };
    });

    trendDaysData.forEach((day) => {
      day.channelBreakdown.forEach((ch) => {
        if (channelSums[ch.name]) {
          channelSums[ch.name].actual += ch.actual;
          channelSums[ch.name].target += ch.target;
        }
      });
    });

    let topChannelName = "";
    let topChannelActual = -1;
    Object.entries(channelSums).forEach(([name, stats]) => {
      if (stats.actual > topChannelActual) {
        topChannelActual = stats.actual;
        topChannelName = name;
      }
    });

    if (topChannelName && topChannelActual > 0) {
      insights.push(
        `在过去7天内，<strong>${topChannelName}</strong> 渠道以累计 <strong>${topChannelActual}</strong> 人的招生数成为主要生源贡献渠道。`
      );
    }

    const majorSums: Record<string, number> = {};
    trendDaysData.forEach((day) => {
      day.majorBreakdown.forEach((maj) => {
        majorSums[maj.name] = (majorSums[maj.name] || 0) + maj.actual;
      });
    });

    let topMajorName = "";
    let topMajorActual = -1;
    Object.entries(majorSums).forEach(([name, actual]) => {
      if (actual > topMajorActual) {
        topMajorActual = actual;
        topMajorName = name;
      }
    });

    if (topMajorName && topMajorActual > 0) {
      insights.push(
        `大类专业方面，<strong>${topMajorName}</strong> 累计招收 <strong>${topMajorActual}</strong> 人，报考热度位列全校各专业首位。`
      );
    }

    if (periodSummary.trendDirection === "up") {
      insights.push(
        `招生走势分析显示，本周期后半段招生效率比前半段提升了 <strong>${periodSummary.trendPct.toFixed(1)}%</strong>，整体表现出较强的上升通道，招生推介策略成效明显。`
      );
    } else if (periodSummary.trendDirection === "down") {
      insights.push(
        `数据显示，本周期后半段招生登记环比收缩 <strong>${periodSummary.trendPct.toFixed(1)}%</strong>。建议重点关注各渠道顾问的跟进效率与最新宣讲排班，以防趋势进一步下滑。`
      );
    } else {
      insights.push(
        `当前周期内招生总量波动平稳，没有发生大起大落，平稳期正是优化劣势渠道转化漏斗、挖掘长尾客源的好时机。`
      );
    }

    return insights;
  }, [trendDaysData, config.channels, periodSummary]);

  // 6. Calculate major proportions for pie/donut chart
  const pieChartData = useMemo(() => {
    let targetRows: RowData[] = [];
    if (pieTimeframe === "day") {
      targetRows = rows.filter((r) => r.date === selectedDate);
    } else {
      const monthPrefix = selectedDate.substring(0, 7);
      targetRows = rows.filter((r) => r.date.startsWith(monthPrefix));
    }

    const majorTotals: Record<string, number> = {};
    targetRows.forEach((row) => {
      const rowActual = row.channels.reduce((sum, ch) => sum + ch.actual, 0) + row.other;
      majorTotals[row.name] = (majorTotals[row.name] || 0) + rowActual;
    });

    const dataArray = Object.entries(majorTotals).map(([name, value]) => ({
      name,
      value
    }));

    dataArray.sort((a, b) => b.value - a.value);

    const totalValue = dataArray.reduce((sum, item) => sum + item.value, 0);

    return {
      data: dataArray,
      total: totalValue,
      timeframeLabel: pieTimeframe === "day" ? "当日" : "当月"
    };
  }, [rows, selectedDate, pieTimeframe]);

  // Format date helper
  const formatDateZh = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return `${parts[1]}月${parts[2]}日`;
  };

  // Recharts multi-week evolution data sorted chronologically
  const multiWeekEvolutionData = useMemo(() => {
    const sorted = [...snapshots].sort((a, b) => a.startDate.localeCompare(b.startDate));
    return sorted.map((s, idx) => ({
      shortTitle: `W${idx + 23} (${s.startDate.substring(5)})`,
      fullTitle: s.title,
      totalActual: s.totalActual,
      totalTarget: s.totalTarget,
      completionRate: Number(s.completionRate.toFixed(1)),
      averageDaily: s.averageDaily,
      peakDaily: s.peakDaily
    }));
  }, [snapshots]);

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto space-y-6 relative">
      
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-emerald-600 px-4 py-3 rounded-xl shadow-2xl border border-emerald-500/30 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-5 duration-200">
          <CheckSquare className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Bar & View Switcher */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 lg:p-5 rounded-2xl border transition-all duration-200 ${
        isDarkMode 
          ? "bg-slate-900/80 border-slate-800 text-slate-100 shadow-xs" 
          : "bg-white border-slate-200 text-slate-800 shadow-xs"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="space-y-0.5">
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <LucideLineChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>招生数据洞察 &amp; 周度复盘大盘</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              实时数据监控与历史周度数据归档，多维复盘招生转化效率演变。
            </p>
          </div>

          {/* Sub Tab Switcher: 7日实时洞察 vs 历史周度回顾 */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("live")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "live"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>7日实时洞察</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "history"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>历史周度回顾</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === "history" ? "bg-white/20 text-white" : "bg-emerald-500/10 text-emerald-500"
              }`}>
                {snapshots.length}
              </span>
            </button>
          </div>
        </div>

        {/* Action Button: Archive Current Week Snapshot */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={handleOpenSaveModal}
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-md transition-all flex items-center gap-2 cursor-pointer"
            title="一键将当前系统显示的7日周数据归档并存储于 LocalStorage"
          >
            <Bookmark className="w-4 h-4 fill-white/20" />
            <span>一键归档周快照</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 7日实时洞察 (Live 7-Day Insights)                                 */}
      {/* ========================================================================= */}
      {activeTab === "live" && (
        <>
          {/* Controls Bar for Live View */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              当前聚焦日期: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatDateZh(selectedDate)}</strong> (涵盖滑动 7 天数据链)
            </div>

            <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setMetricMode("actual")}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  metricMode === "actual"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                实际完成数
              </button>
              <button
                onClick={() => setMetricMode("target")}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  metricMode === "target"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                计划目标数
              </button>
              <button
                onClick={() => setMetricMode("both")}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  metricMode === "both"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                双指标对比
              </button>
            </div>
          </div>

          {/* Main Grid: Left side Line Chart, Right side interactive details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Chart Panel (8 Columns) */}
            <div className={`lg:col-span-8 border rounded-2xl p-5 shadow-xs transition-colors duration-200 flex flex-col space-y-4 ${
              isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                    7天 enrollment 计划与实际完成趋势
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  周期: {trendDaysData[0]?.date || "暂无"} ~ {trendDaysData[trendDaysData.length - 1]?.date || "暂无"}
                </span>
              </div>

              {/* Recharts Container */}
              <div className="h-72 w-full pr-1">
                {trendDaysData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <Calendar className="w-8 h-8 text-slate-300 mb-2" />
                    <span>暂无足够时间段数据以生成趋势图</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trendDaysData}
                      margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
                      onMouseMove={(state) => {
                        if (state && typeof state.activeTooltipIndex === "number") {
                          setActiveDateIndex(state.activeTooltipIndex);
                        }
                      }}
                      onMouseLeave={() => {
                        setActiveDateIndex(null);
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDarkMode ? "#1e293b" : "#f1f5f9"}
                      />
                      <XAxis
                        dataKey="displayDate"
                        tick={{ fill: isDarkMode ? "#94a3b8" : "#64748b", fontSize: 10, fontWeight: 600 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fill: isDarkMode ? "#94a3b8" : "#64748b", fontSize: 10, fontFamily: "monospace" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className={`p-3 border rounded-xl shadow-lg text-xs font-sans ${
                                isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
                              }`}>
                                <div className="font-bold border-b pb-1.5 mb-1.5 border-slate-100 dark:border-slate-800 text-emerald-600 dark:text-emerald-400">
                                  📅 {data.date} (周趋势记录)
                                </div>
                                <div className="space-y-1">
                                  {(metricMode === "actual" || metricMode === "both") && (
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-slate-400">实际招生:</span>
                                      <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">{data.actual} 人</span>
                                    </div>
                                  )}
                                  {(metricMode === "target" || metricMode === "both") && (
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-slate-400">计划目标:</span>
                                      <span className="font-bold font-mono text-amber-600 dark:text-amber-500">{data.target} 人</span>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between gap-4 pt-1 border-t border-dashed border-slate-150 dark:border-slate-800/60 mt-1">
                                    <span className="text-slate-400">单日达成率:</span>
                                    <span className="font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{data.rate.toFixed(1)}%</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 11, fontWeight: 700 }}
                      />
                      {(metricMode === "actual" || metricMode === "both") && (
                        <Line
                          type="monotone"
                          name="实际招生人数 (Actual)"
                          dataKey="actual"
                          stroke="#6366f1"
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 1, fill: "#fff" }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                          animationDuration={450}
                        />
                      )}
                      {(metricMode === "target" || metricMode === "both") && (
                        <Line
                          type="monotone"
                          name="计划招生目标 (Target)"
                          dataKey="target"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={{ r: 3, strokeWidth: 1, fill: "#fff" }}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                          animationDuration={450}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Interactive instruction indicator */}
              <div className="flex items-center justify-between text-[10px] text-slate-400/80 pt-1 border-t border-slate-100 dark:border-slate-800/50">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                  <span>鼠标在折线上滑动，可实时穿透下钻右侧的单日专业与渠道贡献。</span>
                </span>
                <span className="font-mono">RECHARTS ENGINE V3.9</span>
              </div>
            </div>

            {/* Side Detail Drilling panel (4 Columns) */}
            <div className="lg:col-span-4 flex flex-col space-y-4">
              <div className={`border rounded-2xl p-5 shadow-xs transition-colors duration-200 flex flex-col flex-1 ${
                isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
              }`}>
                <div className="border-b pb-3 border-slate-100 dark:border-slate-800 flex items-center justify-between mb-4">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
                      {activeDateIndex !== null ? "📊 动态交互钻取中" : "📌 当前聚焦时点"}
                    </span>
                    <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeDayStats ? formatDateZh(activeDayStats.date) : "暂无日期"}</span>
                    </h4>
                  </div>
                  {activeDayStats && (
                    <div className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      达成率 {activeDayStats.rate.toFixed(0)}%
                    </div>
                  )}
                </div>

                {activeDayStats ? (
                  <div className="flex-1 flex flex-col space-y-4 min-h-0">
                    <div className="grid grid-cols-2 gap-3 shrink-0">
                      <div className={`p-3 rounded-xl border text-center ${
                        isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-150"
                      }`}>
                        <div className="text-[10px] text-slate-400 font-bold mb-0.5">实际招生</div>
                        <div className="text-base font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                          {activeDayStats.actual} <span className="text-[10px] font-sans font-normal text-slate-400">人</span>
                        </div>
                      </div>
                      <div className={`p-3 rounded-xl border text-center ${
                        isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-150"
                      }`}>
                        <div className="text-[10px] text-slate-400 font-bold mb-0.5">计划目标</div>
                        <div className="text-base font-extrabold font-mono text-amber-600 dark:text-amber-500">
                          {activeDayStats.target} <span className="text-[10px] font-sans font-normal text-slate-400">人</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-2">
                        <span>主要专业大类招生表现</span>
                        <span>实际/目标</span>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[220px] thin-scrollbar">
                        {activeDayStats.majorBreakdown.map((maj, majIdx) => (
                          <div
                            key={`maj-${maj.name}-${majIdx}`}
                            className={`p-2 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                              isDarkMode 
                                ? "bg-slate-950/45 border-slate-850 hover:border-slate-800" 
                                : "bg-slate-50/50 border-slate-150 hover:bg-slate-50"
                            }`}
                          >
                            <div className="font-bold text-slate-700 dark:text-slate-300 truncate pr-2">
                              {maj.name}
                            </div>
                            <div className="flex items-center gap-2 font-mono shrink-0">
                              <span className="font-extrabold text-slate-800 dark:text-slate-100">{maj.actual}人</span>
                              <span className="text-[10px] text-slate-400">/ {maj.target}</span>
                              <span className={`text-[10px] px-1 py-0.2 rounded font-sans font-bold ${
                                maj.rate >= 100 
                                  ? "bg-emerald-500/10 text-emerald-500" 
                                  : maj.rate >= 50
                                  ? "bg-indigo-500/10 text-indigo-400"
                                  : "bg-slate-400/10 text-slate-400"
                              }`}>
                                {maj.rate.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        ))}
                        {activeDayStats.majorBreakdown.length === 0 && (
                          <div className="text-center py-6 text-slate-400 text-xs font-medium">
                            当前日期没有录入任何专业数据
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-400 text-xs py-12">
                    请将鼠标移至左侧折线图查看数据细节
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Aggregate KPI Summary Cards across 7 Days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border transition-all duration-200 flex items-center gap-4 shadow-2xs ${
              isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="p-3 rounded-xl bg-indigo-600/10 text-indigo-500 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">7天累计招收</div>
                <div className="text-lg font-extrabold font-mono text-slate-800 dark:text-slate-100">
                  {periodSummary.totalActual} <span className="text-[10px] font-sans font-normal text-slate-400">人</span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  总目标 <strong>{periodSummary.totalTarget}人</strong>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border transition-all duration-200 flex items-center gap-4 shadow-2xs ${
              isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="p-3 rounded-xl bg-emerald-600/10 text-emerald-500 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">日均招生数量</div>
                <div className="text-lg font-extrabold font-mono text-slate-800 dark:text-slate-100">
                  {periodSummary.averageActual} <span className="text-[10px] font-sans font-normal text-slate-400">人/日</span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  峰值宣推效率有待进一步提高
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border transition-all duration-200 flex items-center gap-4 shadow-2xs ${
              isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">周期单日峰值</div>
                <div className="text-lg font-extrabold font-mono text-slate-800 dark:text-slate-100">
                  {periodSummary.peakActualValue} <span className="text-[10px] font-sans font-normal text-slate-400">人</span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans truncate max-w-[160px]">
                  发生于 <strong>{formatDateZh(periodSummary.peakActualDate)}</strong>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border transition-all duration-200 flex items-center gap-4 shadow-2xs ${
              isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="p-3 rounded-xl bg-teal-500/10 text-teal-500 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">7天累计达成率</div>
                <div className="text-lg font-extrabold font-mono text-slate-800 dark:text-slate-100">
                  {periodSummary.overallRate.toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-400 font-sans flex items-center gap-1">
                  {periodSummary.trendDirection === "up" ? (
                    <span className="text-emerald-500 flex items-center font-bold">
                      <ArrowUpRight className="w-3.5 h-3.5" /> 呈上升趋势 (+{periodSummary.trendPct.toFixed(0)}%)
                    </span>
                  ) : periodSummary.trendDirection === "down" ? (
                    <span className="text-rose-500 flex items-center font-bold">
                      <ArrowDownRight className="w-3.5 h-3.5" /> 呈收缩势态 (-{periodSummary.trendPct.toFixed(0)}%)
                    </span>
                  ) : (
                    <span className="text-slate-400 font-medium">基本持平</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic 2-Column Section for Major Proportion & Diagnostics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className={`lg:col-span-7 border rounded-2xl p-5 shadow-xs transition-colors duration-200 flex flex-col space-y-4 ${
              isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
            }`}>
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <LucidePieChart className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>各专业实际完成人数占比 ({pieChartData.timeframeLabel})</span>
                    <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400 hidden sm:inline">(点击可穿透筛选主表)</span>
                  </h3>
                </div>
                
                <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPieTimeframe("day")}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      pieTimeframe === "day"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    当日占比
                  </button>
                  <button
                    type="button"
                    onClick={() => setPieTimeframe("month")}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      pieTimeframe === "month"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    当月占比
                  </button>
                </div>
              </div>

              {pieChartData.total === 0 ? (
                <div className="flex-1 min-h-[220px] flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <LucidePieChart className="w-8 h-8 text-slate-300 mb-2 animate-pulse" />
                  <span>所选时间范围没有录入任何招生数据</span>
                </div>
              ) : (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-5 h-[220px] relative flex items-center justify-center cursor-pointer">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData.data}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                          cursor="pointer"
                          {...(hoveredPieIndex !== null ? ({ activeIndex: hoveredPieIndex } as any) : {})}
                          activeShape={renderActiveShape as any}
                          onMouseEnter={(_, index) => setHoveredPieIndex(index)}
                          onMouseLeave={() => setHoveredPieIndex(null)}
                          onClick={(entry) => {
                            if (entry && entry.name && onSelectMajor) {
                              onSelectMajor(String(entry.name));
                            }
                          }}
                        >
                          {pieChartData.data.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                              className="cursor-pointer transition-all duration-200"
                              opacity={hoveredPieIndex === null || hoveredPieIndex === index ? 1 : 0.45}
                              onClick={() => {
                                if (entry && entry.name && onSelectMajor) {
                                  onSelectMajor(String(entry.name));
                                }
                              }}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: any) => {
                            const val = Number(value) || 0;
                            const pct = pieChartData.total > 0 ? ((val / pieChartData.total) * 100).toFixed(1) : "0.0";
                            return [`${val} 人 (占比 ${pct}%)`, `${name}`];
                          }}
                          contentStyle={{
                            background: isDarkMode ? "#0f172a" : "#ffffff",
                            borderColor: isDarkMode ? "#334155" : "#e2e8f0",
                            color: isDarkMode ? "#f1f5f9" : "#0f172a",
                            borderRadius: "8px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.15)"
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-2 text-center transition-all duration-200">
                      {hoveredPieIndex !== null && pieChartData.data[hoveredPieIndex] ? (() => {
                        const activeItem = pieChartData.data[hoveredPieIndex];
                        const activePct = pieChartData.total > 0 ? ((activeItem.value / pieChartData.total) * 100).toFixed(1) : "0.0";
                        return (
                          <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-150">
                            <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-200 truncate max-w-[95px] leading-tight mb-0.5">
                              {activeItem.name}
                            </span>
                            <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                              {activeItem.value}<span className="text-[10px] font-normal text-slate-400 ml-0.5">人</span>
                            </span>
                            <span className="text-[9px] font-bold font-mono text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.2 rounded-full border border-indigo-200/80 dark:border-indigo-800/80 mt-0.5">
                              占比 {activePct}%
                            </span>
                          </div>
                        );
                      })() : (
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">实际招生总数</span>
                          <span className="text-base font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                            {pieChartData.total}
                          </span>
                          <span className="text-[9px] text-slate-400">人</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-7 space-y-1 max-h-[220px] overflow-y-auto pr-1 thin-scrollbar">
                    {pieChartData.data.map((item, index) => {
                      const percentage = pieChartData.total > 0 ? (item.value / pieChartData.total) * 100 : 0;
                      const color = PIE_COLORS[index % PIE_COLORS.length];
                      const isHovered = hoveredPieIndex === index;
                      return (
                        <div
                          key={`pie-item-${item.name}-${index}`}
                          onMouseEnter={() => setHoveredPieIndex(index)}
                          onMouseLeave={() => setHoveredPieIndex(null)}
                          onClick={() => onSelectMajor?.(item.name)}
                          title={`点击穿透在基础数据表(ExcelTable)中查看【${item.name}】`}
                          className={`space-y-1 p-1.5 rounded-lg cursor-pointer transition-all border ${
                            isHovered
                              ? "bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-700 shadow-xs translate-x-0.5 scale-[1.01]"
                              : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60"
                          } group`}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 transition-transform ${
                                  isHovered ? "scale-125 ring-2 ring-indigo-400" : "group-hover:scale-125"
                                }`}
                                style={{ backgroundColor: color }}
                              />
                              <span className={`font-bold truncate transition-colors ${
                                isHovered
                                  ? "text-indigo-600 dark:text-indigo-400 font-extrabold"
                                  : "text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                              }`}>
                                {item.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 font-mono text-[10px] shrink-0 font-extrabold text-slate-600 dark:text-slate-300">
                              <span>{item.value}人</span>
                              <span className={`px-1 py-0.2 rounded font-sans text-[9px] font-bold transition-colors ${
                                isHovered
                                  ? "bg-indigo-600 text-white dark:bg-indigo-500"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-emerald-500/10 group-hover:text-emerald-500"
                              }`}>
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="h-1 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: color
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="text-[9px] text-slate-400/70 border-t pt-1.5 border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                <span>数据周期说明: 当月占比涵盖该日期所属的整个自然月份</span>
                <span className="font-mono font-bold text-emerald-500 text-[10px]">主力生源多维透视</span>
              </div>
            </div>

            <div className={`lg:col-span-5 border rounded-2xl p-5 shadow-xs transition-colors duration-200 flex flex-col space-y-4 ${
              isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
            }`}>
              <div className="flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
                <div className="p-1 rounded bg-purple-500/10 text-purple-500 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                  智能趋势诊断报告 (Diagnostics)
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 max-h-[220px] pr-1 thin-scrollbar">
                {dynamicInsights.map((stmt, idx) => (
                  <div
                    key={`diag-insight-${idx}`}
                    className={`p-3 rounded-xl border flex items-start gap-2 transition-all text-xs leading-relaxed ${
                      isDarkMode 
                        ? "bg-slate-950/45 border-slate-850 hover:bg-slate-950" 
                        : "bg-slate-50/50 border-slate-150 hover:bg-slate-50"
                    }`}
                  >
                    <div className="p-0.5 rounded-full bg-emerald-500/10 text-emerald-500 mt-0.5 shrink-0">
                      <Zap className="w-3 h-3" />
                    </div>
                    <p
                      className="text-slate-600 dark:text-slate-300 font-medium"
                      dangerouslySetInnerHTML={{ __html: stmt }}
                    />
                  </div>
                ))}
                {dynamicInsights.length === 0 && (
                  <div className="text-center py-12 text-slate-400 text-xs font-medium">
                    由于数据样本不足，趋势诊断暂未生成。请确保系统中录入了至少 3 天以上的有效数据。
                  </div>
                )}
              </div>
              
              <div className="text-[9px] text-slate-400/70 border-t pt-1.5 border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                <span>实时多模数据智能推理服务</span>
                <span className="font-mono text-indigo-400">ACTIVE</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 历史周度回顾 (Historical Weekly Review)                            */}
      {/* ========================================================================= */}
      {activeTab === "history" && (
        <div className="space-y-6">
          
          {/* Historical Review Top Bar */}
          <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-indigo-500" />
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                  归档周度快照库 &amp; 跨周招生效率演变 (Weekly History Archive)
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                对比各归档周度的计划与实际达成趋势、渠道贡献迁移，纵向跟踪招生效能演变轨迹。
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="搜索快照标题/日期/备注..."
                  className={`pl-8 pr-3 py-1.5 rounded-xl border text-xs transition-all w-48 focus:w-60 ${
                    isDarkMode 
                      ? "bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-indigo-500" 
                      : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500"
                  }`}
                />
              </div>

              {/* Restore Preset button */}
              <button
                onClick={handleResetToDefaultSnapshots}
                className={`p-2 rounded-xl border text-xs transition-all flex items-center gap-1 cursor-pointer ${
                  isDarkMode ? "bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600"
                }`}
                title="重置恢复默认预置的周度快照数据"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">恢复示例</span>
              </button>
            </div>
          </div>

          {/* SECTION A: 多周招生效率演变复合图 (Multi-Week Evolution Chart) */}
          <div className={`p-5 rounded-2xl border shadow-xs space-y-4 ${
            isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-500" />
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                  多周招生效率演变对比图 (Weekly Efficiency Evolution)
                </h4>
              </div>

              <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
                <button
                  onClick={() => setHistoryChartMetric("composed")}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    historyChartMetric === "composed"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  人数与达成率
                </button>
                <button
                  onClick={() => setHistoryChartMetric("rate")}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    historyChartMetric === "rate"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  达成率趋势(%)
                </button>
                <button
                  onClick={() => setHistoryChartMetric("daily")}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    historyChartMetric === "daily"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  日均招生量
                </button>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              {multiWeekEvolutionData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  暂无归档周度快照，请点击顶部【一键归档周快照】按钮创建首个快照
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={multiWeekEvolutionData} margin={{ top: 15, right: 20, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                    <XAxis
                      dataKey="shortTitle"
                      tick={{ fill: isDarkMode ? "#94a3b8" : "#64748b", fontSize: 10, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fill: isDarkMode ? "#94a3b8" : "#64748b", fontSize: 10, fontFamily: "monospace" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    {historyChartMetric === "composed" && (
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 150]}
                        unit="%"
                        tick={{ fill: isDarkMode ? "#10b981" : "#059669", fontSize: 10, fontFamily: "monospace", fontWeight: 700 }}
                        axisLine={false}
                        tickLine={false}
                      />
                    )}
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className={`p-3 border rounded-xl shadow-xl text-xs ${
                              isDarkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                            }`}>
                              <div className="font-bold border-b pb-1 mb-1.5 text-indigo-500">
                                {data.fullTitle}
                              </div>
                              <div className="space-y-1 font-mono">
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">实际招生:</span>
                                  <span className="font-bold text-indigo-400">{data.totalActual} 人</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">计划目标:</span>
                                  <span className="font-bold text-amber-500">{data.totalTarget} 人</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">达成率:</span>
                                  <span className="font-extrabold text-emerald-500">{data.completionRate}%</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">日均招生:</span>
                                  <span className="font-bold text-teal-400">{data.averageDaily} 人/日</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />

                    {historyChartMetric === "composed" && (
                      <>
                        <Bar yAxisId="left" name="实际招生人数" dataKey="totalActual" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={28} />
                        <Bar yAxisId="left" name="计划目标人数" dataKey="totalTarget" fill="#f59e0b" opacity={0.35} radius={[6, 6, 0, 0]} barSize={28} />
                        <Line yAxisId="right" type="monotone" name="完成率 (%)" dataKey="completionRate" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
                      </>
                    )}

                    {historyChartMetric === "rate" && (
                      <Line yAxisId="left" type="monotone" name="周完成率 (%)" dataKey="completionRate" stroke="#10b981" strokeWidth={3.5} dot={{ r: 6, fill: "#10b981" }} />
                    )}

                    {historyChartMetric === "daily" && (
                      <Bar yAxisId="left" name="日均招生人数" dataKey="averageDaily" fill="#06b6d4" radius={[6, 6, 0, 0]} barSize={32} />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* SECTION B: 渠道效率跨周演变对比矩阵 (Channel Cross-Week Evolution Matrix) */}
          <div className={`p-5 rounded-2xl border shadow-xs space-y-4 ${
            isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                  渠道效率跨周演变矩阵 (Channel Cross-Week Matrix)
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                数据来源: LocalStorage 归档周快照
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                    isDarkMode ? "border-slate-800 bg-slate-950 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}>
                    <th className="p-2.5 rounded-l-lg">招生渠道</th>
                    {multiWeekEvolutionData.map((d, i) => (
                      <th key={`evol-hdr-${d.shortTitle}-${i}`} className="p-2.5 text-center font-mono">
                        {d.shortTitle}
                      </th>
                    ))}
                    <th className="p-2.5 text-right rounded-r-lg">演变趋势</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {config.channels.map((chName, chIdx) => {
                    // Extract channel actuals across snapshots
                    const values = snapshots.map((s) => {
                      const match = s.channelBreakdown.find((c) => c.name === chName);
                      return match ? match.actual : 0;
                    });

                    const firstVal = values[0] || 0;
                    const lastVal = values[values.length - 1] || 0;
                    const diff = lastVal - firstVal;
                    const pctChange = firstVal > 0 ? ((diff / firstVal) * 100).toFixed(1) : "0.0";

                    return (
                      <tr key={`insight-ch-${chName}-${chIdx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition-colors">
                        <td className="p-2.5 font-sans font-bold text-slate-700 dark:text-slate-200">
                          {chName}
                        </td>
                        {values.map((v, vIdx) => (
                          <td key={`evol-val-${chIdx}-${vIdx}`} className="p-2.5 text-center font-extrabold text-slate-800 dark:text-slate-100">
                            {v} <span className="text-[9px] font-normal text-slate-400">人</span>
                          </td>
                        ))}
                        <td className="p-2.5 text-right font-sans">
                          {diff > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <ArrowUpRight className="w-3 h-3" /> +{diff}人 (+{pctChange}%)
                            </span>
                          ) : diff < 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                              <ArrowDownRight className="w-3 h-3" /> {diff}人 ({pctChange}%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                              持平
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION C: 归档周度快照卡片矩阵 (Snapshot Archive Cards) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-500" />
                <span>已归档周度快照列表 ({filteredSnapshots.length})</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSnapshots.map((snap, sIdx) => {
                const isEditingThisNote = editingNoteId === snap.id;
                const topChannel = snap.channelBreakdown[0] || { name: "暂无", actual: 0 };
                const topMajor = snap.majorBreakdown[0] || { name: "暂无", actual: 0 };

                return (
                  <div
                    key={`snap-${snap.id}-${sIdx}`}
                    className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-md ${
                      isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100 hover:border-slate-700" : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                    }`}
                  >
                    {/* Card Header */}
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold font-mono bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shrink-0">
                          {snap.startDate.substring(5)} ~ {snap.endDate.substring(5)}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          归档: {snap.createdAt}
                        </span>
                      </div>

                      <h5 className="font-extrabold text-xs text-slate-900 dark:text-white leading-snug line-clamp-1">
                        {snap.title}
                      </h5>
                    </div>

                    {/* Metric Badges */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800 font-mono">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-sans">实际招生</span>
                        <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                          {snap.totalActual} <span className="text-[9px] font-sans text-slate-400">人</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-sans">完成率</span>
                        <span className={`text-sm font-extrabold ${
                          snap.completionRate >= 100 ? "text-emerald-500" : "text-amber-500"
                        }`}>
                          {snap.completionRate.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-sans">日均招生</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {snap.averageDaily} 人/日
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-sans">单日峰值</span>
                        <span className="text-xs font-bold text-teal-500">
                          {snap.peakDaily} 人
                        </span>
                      </div>
                    </div>

                    {/* Top Highlights Tag */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 gap-1 truncate font-sans">
                      <span className="truncate">
                        🏆 渠道: <strong className="text-slate-700 dark:text-slate-300">{topChannel.name}</strong> ({topChannel.actual}人)
                      </span>
                      <span className="truncate">
                        🔥 专业: <strong className="text-slate-700 dark:text-slate-300">{topMajor.name}</strong>
                      </span>
                    </div>

                    {/* Note Box */}
                    <div className="text-[11px] bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40 p-2 rounded-lg text-amber-900 dark:text-amber-200 flex flex-col space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1 text-[10px]">
                          <MessageSquare className="w-3 h-3 text-amber-500" />
                          <span>周备忘/备注:</span>
                        </span>
                        {!isEditingThisNote && (
                          <button
                            onClick={() => {
                              setEditingNoteId(snap.id);
                              setEditingNoteValue(snap.note || "");
                            }}
                            className="text-[9px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                            <span>修改</span>
                          </button>
                        )}
                      </div>

                      {isEditingThisNote ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <input
                            type="text"
                            value={editingNoteValue}
                            onChange={(e) => setEditingNoteValue(e.target.value)}
                            placeholder="输入周备忘或总结..."
                            className="flex-1 px-2 py-0.5 text-xs rounded border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                          />
                          <button
                            onClick={() => handleSaveEditedNote(snap.id)}
                            className="p-1 rounded bg-amber-600 text-white hover:bg-amber-500 cursor-pointer"
                            title="保存"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="p-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
                            title="取消"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 italic line-clamp-2">
                          {snap.note || "暂无备注（点击右上角“修改”可添加周度复盘备忘）"}
                        </p>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                      <button
                        onClick={() => setSelectedSnapshotForDetail(snap)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>完整细节</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleExportSnapshotJSON(snap)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          title="导出快照 JSON"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSnapshot(snap.id, snap.title)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title="删除此快照"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredSnapshots.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  没有找到匹配的周度数据快照
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: 周度数据快照归档弹窗 (SaveSnapshotModal)                          */}
      {/* ========================================================================= */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200 ${
            isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-sm">归档当前 7 日周数据快照</h3>
              </div>
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Preview Summary */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 space-y-2 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                📊 自动提取的数据大盘摘要 (Data Summary)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                <div>
                  <span className="text-[9px] text-slate-400 block">实际招生</span>
                  <span className="font-extrabold text-indigo-500">{currentSnapshotPreview.totalActual} 人</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block">计划目标</span>
                  <span className="font-bold text-amber-500">{currentSnapshotPreview.totalTarget} 人</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block">达成率</span>
                  <span className="font-extrabold text-emerald-500">{currentSnapshotPreview.completionRate.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block">日均招生</span>
                  <span className="font-bold text-teal-400">{currentSnapshotPreview.averageDaily} 人/日</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-sans pt-1 border-t border-slate-200 dark:border-slate-800">
                时间范围: <strong>{currentSnapshotPreview.startDate}</strong> ~ <strong>{currentSnapshotPreview.endDate}</strong>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>快照标题 (Snapshot Title) <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] font-normal text-slate-400">可自定义修改</span>
                </label>
                <input
                  type="text"
                  value={snapshotTitleInput}
                  onChange={(e) => setSnapshotTitleInput(e.target.value)}
                  placeholder="例如：2026年第26周高考冲刺归档"
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-hidden transition-all ${
                    isDarkMode 
                      ? "bg-slate-950 border-slate-800 text-slate-100 focus:border-emerald-500" 
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500"
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  归档周备忘 / 关键事件总结 (Note &amp; Remarks)
                </label>
                <textarea
                  value={snapshotNoteInput}
                  onChange={(e) => setSnapshotNoteInput(e.target.value)}
                  rows={3}
                  placeholder="可在此记录本周主要招生宣讲排班、线上直播推广策略或复盘体会..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden transition-all ${
                    isDarkMode 
                      ? "bg-slate-950 border-slate-800 text-slate-100 focus:border-emerald-500" 
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500"
                  }`}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmSaveSnapshot}
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Bookmark className="w-4 h-4 fill-white/20" />
                <span>确认存入 LocalStorage</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: 归档周度快照片详情下钻 (SnapshotDetailModal)                     */}
      {/* ========================================================================= */}
      {selectedSnapshotForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200 thin-scrollbar ${
            isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
          }`}>
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    {selectedSnapshotForDetail.startDate} ~ {selectedSnapshotForDetail.endDate}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    归档于 {selectedSnapshotForDetail.createdAt}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {selectedSnapshotForDetail.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSnapshotForDetail(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Key KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block">实际招生人数</span>
                <span className="text-lg font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                  {selectedSnapshotForDetail.totalActual} 人
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block">计划招生目标</span>
                <span className="text-lg font-extrabold font-mono text-amber-600 dark:text-amber-500">
                  {selectedSnapshotForDetail.totalTarget} 人
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block">周整体完成率</span>
                <span className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {selectedSnapshotForDetail.completionRate.toFixed(1)}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block">日均招生量</span>
                <span className="text-lg font-extrabold font-mono text-teal-600 dark:text-teal-400">
                  {selectedSnapshotForDetail.averageDaily} 人/日
                </span>
              </div>
            </div>

            {/* Daily Trend Chart in Snapshot */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>该周单日招生趋势走势</span>
              </h4>
              <div className="h-48 w-full bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-150 dark:border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedSnapshotForDetail.dailyRecords}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1e293b" : "#e2e8f0"} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} />
                    <Tooltip />
                    <Line type="monotone" name="实际招生" dataKey="actual" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" name="计划目标" dataKey="target" stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Channel & Major Breakdown Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Channel Breakdown */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>渠道表现分布</span>
                  <span className="text-[10px] text-slate-400 font-normal">实际 / 目标</span>
                </h5>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 thin-scrollbar">
                  {selectedSnapshotForDetail.channelBreakdown.map((ch, chIdx) => {
                    const chRate = ch.target > 0 ? (ch.actual / ch.target) * 100 : 0;
                    return (
                      <div key={`detail-ch-${ch.name}-${chIdx}`} className="space-y-1 text-xs">
                        <div className="flex justify-between font-bold">
                          <span>{ch.name}</span>
                          <span className="font-mono text-indigo-500">{ch.actual}人 <span className="text-[10px] font-normal text-slate-400">/ {ch.target}</span></span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${Math.min(100, chRate)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Major Breakdown */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>主要专业招生贡献</span>
                  <span className="text-[10px] text-slate-400 font-normal">实际 (达成率)</span>
                </h5>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 thin-scrollbar">
                  {selectedSnapshotForDetail.majorBreakdown.map((m, mIdx) => (
                    <div key={`detail-m-${m.name}-${mIdx}`} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 font-bold">
                      <span className="truncate pr-2">{m.name}</span>
                      <span className="font-mono text-emerald-500 shrink-0">
                        {m.actual}人 <span className="text-[10px] text-slate-400 font-normal">({m.rate.toFixed(0)}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Note Memo */}
            {selectedSnapshotForDetail.note && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <div className="font-bold">📝 周度归档总结 / 备忘:</div>
                <p className="leading-relaxed">{selectedSnapshotForDetail.note}</p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleExportSnapshotJSON(selectedSnapshotForDetail)}
                className="px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>导出快照 JSON</span>
              </button>

              <button
                onClick={() => setSelectedSnapshotForDetail(null)}
                className="px-5 py-1.5 rounded-xl text-xs font-extrabold bg-slate-800 text-white hover:bg-slate-700 cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
