/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { DEFAULT_CONFIG, DEFAULT_ROWS, generateDefaultRowsWithHistory, MAJOR_METADATA } from "./data";
import { RowData, TableConfig } from "./types";
import ExcelTable from "./components/ExcelTable";
import ChannelConfigModal from "./components/ChannelConfigModal";
import DataComparison from "./components/DataComparison";
import ConversionFunnel from "./components/ConversionFunnel";
import TaskKanban from "./components/TaskKanban";
import StudentGeography from "./components/StudentGeography";
import FAQKnowledgeBase from "./components/FAQKnowledgeBase";
import PosterGenerator from "./components/PosterGenerator";
import ExcelImporter from "./components/ExcelImporter";
import ConsultantLeaderboard from "./components/ConsultantLeaderboard";
import ChannelROI from "./components/ChannelROI";
import DataInsights from "./components/DataInsights";
import MajorTrendChart from "./components/MajorTrendChart";
import MajorRankingChart from "./components/MajorRankingChart";
import MajorPopularityChart from "./components/MajorPopularityChart";
import MajorProgressOverview from "./components/MajorProgressOverview";
import SidebarMajorProgressOverview from "./components/SidebarMajorProgressOverview";
import SidebarStudentGeographyHeatmap from "./components/SidebarStudentGeographyHeatmap";
import EnrollmentSummaryModal from "./components/EnrollmentSummaryModal";
import MajorSummaryModal from "./components/MajorSummaryModal";
import TrendAnalysisModal from "./components/TrendAnalysisModal";
import StudentSourceForceGraphModal from "./components/StudentSourceForceGraphModal";
import DeviationNotificationModal from "./components/DeviationNotificationModal";
import MajorDetailDashboardModal from "./components/MajorDetailDashboardModal";
import { MiniSparkline } from "./components/MiniSparkline";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";
import { 
  TrendingUp, 
  Target, 
  Users, 
  Award, 
  HelpCircle,
  FileSpreadsheet,
  ChevronRight,
  Sparkles,
  Search,
  RotateCcw,
  Trash2,
  Info,
  Download,
  Settings,
  Database,
  Save,
  Grid,
  CheckCircle,
  Play,
  X,
  AlertTriangle,
  RefreshCw,
  BarChart2,
  Calendar,
  Sun,
  Moon,
  Map,
  MessageSquare,
  Megaphone,
  Percent,
  Trello,
  Upload,
  Copy,
  Plus,
  ChevronDown,
  Menu,
  GripVertical,
  LineChart,
  Network,
  Bell
} from "lucide-react";

export default function App() {
  const [config, setConfig] = useState<TableConfig>(DEFAULT_CONFIG);
  const [rows, setRows] = useState<RowData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyShowWithNotes, setOnlyShowWithNotes] = useState(false);
  const [activeTab, setActiveTab] = useState<"table" | "comparison" | "funnel" | "kanban" | "geography" | "faq" | "poster" | "leaderboard" | "roi" | "insights">("table");
  const [showSimModal, setShowSimModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showMajorSummaryModal, setShowMajorSummaryModal] = useState(false);
  const [showForceGraphModal, setShowForceGraphModal] = useState(false);
  const [showTrendModal, setShowTrendModal] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendContent, setTrendContent] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [simRate, setSimRate] = useState<"typical" | "high" | "low">("typical");
  const [showToast, setShowToast] = useState<string | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tabsContainerRef.current;
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
  
  // New Date Manager and Cloning States
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneTargetDate, setCloneTargetDate] = useState("2026-06-29");
  const [cloneStrategy, setCloneStrategy] = useState<"targets" | "full">("targets");
  const [showDateListDropdown, setShowDateListDropdown] = useState(false);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("recruitment_theme");
    return saved === "dark";
  });

  useEffect(() => {
    localStorage.setItem("recruitment_theme", isDarkMode ? "dark" : "light");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Temporal States
  const [selectedDate, setSelectedDate] = useState("2026-06-28");
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");

  // Deviation Notification States
  const [deviationThresholdPct, setDeviationThresholdPct] = useState<number>(20);
  const [showDeviationModal, setShowDeviationModal] = useState<boolean>(false);

  // Professional Major Detail Dashboard Modal States
  const [showMajorDashboardModal, setShowMajorDashboardModal] = useState<boolean>(false);
  const [selectedDashboardMajor, setSelectedDashboardMajor] = useState<string>("软件工程");

  const handleOpenMajorDashboard = (majorName: string) => {
    setSelectedDashboardMajor(majorName);
    setShowMajorDashboardModal(true);
  };

  // Support deep-link URL loading (e.g. ?major=软件工程 or #major=软件工程)
  useEffect(() => {
    try {
      const parseAndOpenDeepLink = () => {
        const searchParams = new URLSearchParams(window.location.search);
        const hashClean = window.location.hash.replace(/^#\/?/, "");
        const hashParams = new URLSearchParams(hashClean);

        const majorParam = searchParams.get("major") || hashParams.get("major");
        const dateParam = searchParams.get("date") || hashParams.get("date");

        if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
          setSelectedDate(dateParam);
        }

        if (majorParam) {
          const decoded = decodeURIComponent(majorParam);
          setSelectedDashboardMajor(decoded);
          setShowMajorDashboardModal(true);
        }
      };

      parseAndOpenDeepLink();

      window.addEventListener("hashchange", parseAndOpenDeepLink);
      window.addEventListener("popstate", parseAndOpenDeepLink);
      return () => {
        window.removeEventListener("hashchange", parseAndOpenDeepLink);
        window.removeEventListener("popstate", parseAndOpenDeepLink);
      };
    } catch (e) {
      console.warn("Failed to parse URL search params", e);
    }
  }, []);

  const dailyDeviatedCount = React.useMemo(() => {
    const dayRows = rows.filter((r) => r.date === selectedDate && !r.isMergedGroup);
    let count = 0;
    dayRows.forEach((row) => {
      const totalTarget = row.channels.reduce((sum, ch) => sum + ch.target, 0);
      const totalActual = row.channels.reduce((sum, ch) => sum + ch.actual, 0) + row.other;
      if (totalTarget > 0) {
        const devPct = Math.abs((totalActual - totalTarget) / totalTarget) * 100;
        if (devPct >= deviationThresholdPct) count++;
      } else if (totalActual > 0) {
        count++;
      }
    });
    return count;
  }, [rows, selectedDate, deviationThresholdPct]);

  // KPI card drag & drop order state and handlers
  const [kpiOrder, setKpiOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem("kpi_card_order");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const expectedKeys = ["target", "actual", "ratio", "topMajor", "topChannel"];
        if (
          Array.isArray(parsed) && 
          parsed.length === expectedKeys.length && 
          new Set(parsed).size === expectedKeys.length && 
          parsed.every((key: any) => expectedKeys.includes(key))
        ) {
          return parsed;
        }
      } catch (e) {
        // Fallback
      }
    }
    return ["target", "actual", "ratio", "topMajor", "topChannel"];
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const draggedIndexRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem("kpi_card_order", JSON.stringify(kpiOrder));
  }, [kpiOrder]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    draggedIndexRef.current = index;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (index: number) => {
    const currentDragged = draggedIndexRef.current;
    if (currentDragged === null || currentDragged === index) return;
    
    setKpiOrder((prevOrder) => {
      const newOrder = [...prevOrder];
      const expectedKeys = ["target", "actual", "ratio", "topMajor", "topChannel"];
      
      // Safety checks: ensure the old state is valid, has 5 elements, and no duplicates or undefined
      if (
        newOrder.length !== 5 ||
        new Set(newOrder).size !== 5 ||
        !newOrder.every(k => expectedKeys.includes(k))
      ) {
        return prevOrder;
      }

      const draggedItem = newOrder[currentDragged];
      if (!draggedItem) return prevOrder;
      
      newOrder.splice(currentDragged, 1);
      newOrder.splice(index, 0, draggedItem);

      // Safety checks on the new order
      if (
        newOrder.length !== 5 ||
        new Set(newOrder).size !== 5 ||
        !newOrder.every(k => expectedKeys.includes(k))
      ) {
        return prevOrder;
      }

      return newOrder;
    });
    
    draggedIndexRef.current = index;
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    draggedIndexRef.current = null;
    setDraggedIndex(null);
  };

  const handleResetKpiOrder = () => {
    const defaultOrder = ["target", "actual", "ratio", "topMajor", "topChannel"];
    setKpiOrder(defaultOrder);
    triggerToast("🔄 已恢复指标卡片默认顺序！");
  };

  // Data Audit/Check States
  const [isAuditActive, setIsAuditActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  // Local Storage Backup & Recovery States
  const [backupTime, setBackupTime] = useState<string | null>(() => {
    return localStorage.getItem("recruitment_table_backup_time");
  });

  const handleCreateBackup = () => {
    try {
      if (rows.length === 0) {
        triggerToast("⚠️ 当前没有任何数据，无需进行备份！");
        return;
      }
      const serialized = JSON.stringify(rows);
      localStorage.setItem("recruitment_table_backup_rows", serialized);
      const nowStr = new Date().toLocaleString("zh-CN", { hour12: false });
      localStorage.setItem("recruitment_table_backup_time", nowStr);
      setBackupTime(nowStr);
      triggerToast("💾 当前招生数据全量备份成功！");
    } catch (e) {
      triggerToast("❌ 备份失败，可能超出浏览器存储限制！");
    }
  };

  const handleRestoreBackup = () => {
    const savedBackup = localStorage.getItem("recruitment_table_backup_rows");
    if (!savedBackup) {
      triggerToast("⚠️ 未找到任何有效的本地备份数据！");
      return;
    }
    if (window.confirm(`确定要从本地备份（备份时间：${backupTime}）中恢复所有数据吗？这将会覆盖当前未备份的修改。`)) {
      try {
        const parsed = JSON.parse(savedBackup);
        if (Array.isArray(parsed)) {
          handleRowsChange(parsed);
          triggerToast("🔄 本地备份恢复成功，数据已成功同步！");
        } else {
          triggerToast("❌ 备份数据格式有误，恢复失败！");
        }
      } catch (e) {
        triggerToast("❌ 恢复失败，备份解析出错！");
      }
    }
  };

  const handleClearBackup = () => {
    if (window.confirm("确定要永久删除此本地缓存备份吗？")) {
      localStorage.removeItem("recruitment_table_backup_rows");
      localStorage.removeItem("recruitment_table_backup_time");
      setBackupTime(null);
      triggerToast("🗑️ 本地备份已成功清除！");
    }
  };

  const handleTriggerAudit = () => {
    if (isAuditActive) {
      setIsAuditActive(false);
    } else {
      setIsScanning(true);
      setTimeout(() => {
        setIsScanning(false);
        setIsAuditActive(true);
        triggerToast("🔍 数据体检完成，已生成诊断报告！");
      }, 500);
    }
  };

  const handleSaveAuditNote = (rowId: string, noteVal: string) => {
    const updatedRows = rows.map((r) => {
      if (r.id === rowId) {
        return { ...r, note: noteVal };
      }
      return r;
    });
    handleRowsChange(updatedRows);
    triggerToast("📝 异常原因备注已同步更新！");
  };

  // Trigger custom toast notification
  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => {
      setShowToast(null);
    }, 4000);
  };

  // Jump directly to table row for a selected major
  const handleSelectMajor = (majorName: string) => {
    setSearchTerm(majorName);
    setActiveTab("table");
    triggerToast(`📍 已跳转基础数据表并定位专业：${majorName}`);
    setTimeout(() => {
      const el = document.querySelector(`[data-major-name="${majorName}"]`) || document.getElementById(`major-row-${majorName}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
  };

  // Get all unique dates in the system sorted descending with completion details
  const getRegisteredDates = () => {
    const datesMap: { [key: string]: { count: number; completed: number; target: number } } = {};
    rows.forEach((r) => {
      if (!datesMap[r.date]) {
        datesMap[r.date] = { count: 0, completed: 0, target: 0 };
      }
      datesMap[r.date].count += 1;
      const targetSum = r.channels.reduce((sum, ch) => sum + ch.target, 0);
      const actualSum = r.channels.reduce((sum, ch) => sum + ch.actual, 0) + r.other;
      datesMap[r.date].completed += actualSum;
      datesMap[r.date].target += targetSum;
    });
    
    return Object.entries(datesMap)
      .map(([date, stats]) => ({
        date,
        count: stats.count,
        completionRate: stats.target > 0 ? (stats.completed / stats.target) * 100 : 0,
        completed: stats.completed
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  };

  // Clone an entire day's records to a target date
  const handleCloneDay = (sourceDate: string, targetDate: string, strategy: "targets" | "full") => {
    if (!targetDate) {
      triggerToast("❌ 请选择有效的目标日期！");
      return;
    }
    if (sourceDate === targetDate) {
      triggerToast("❌ 目标日期不能与源日期相同！");
      return;
    }

    const sourceRows = rows.filter((r) => r.date === sourceDate);
    if (sourceRows.length === 0) {
      triggerToast("⚠️ 当前源日期没有任何招生数据，无法复制！");
      return;
    }

    // Check if target date already has data
    const targetHasData = rows.some((r) => r.date === targetDate);
    
    const performClone = () => {
      // Filter out existing targetRows
      const filtered = rows.filter((r) => r.date !== targetDate);
      
      const clonedRows = sourceRows.map((r, idx) => ({
        ...r,
        id: `row-${targetDate}-${Date.now()}-${idx}`,
        date: targetDate,
        channels: r.channels.map((ch) => ({
          target: ch.target,
          actual: strategy === "full" ? ch.actual : 0
        })),
        other: strategy === "full" ? r.other : 0,
        seq: idx + 1
      }));

      const newRows = [...filtered, ...clonedRows];
      handleRowsChange(newRows);
      setSelectedDate(targetDate);
      setShowCloneModal(false);
      triggerToast(`🎉 成功将 ${sourceDate} 的专业计划克隆到 ${targetDate}！`);
    };

    if (targetHasData) {
      if (window.confirm(`⚠️ 目标日期 ${targetDate} 已存在招生登记。克隆操作将覆盖该日期的所有数据。是否确定继续覆盖？`)) {
        performClone();
      }
    } else {
      performClone();
    }
  };

  // Delete an entire day's records
  const handleDeleteCurrentDay = () => {
    const dayRows = rows.filter((r) => r.date === selectedDate);
    if (dayRows.length === 0) {
      triggerToast("⚠️ 当前日期本来就没有登记任何数据！");
      return;
    }

    if (window.confirm(`🚨 危险操作：您确定要彻底删除 【${selectedDate}】 的全天招生明细吗？此删除操作将清除该日的全部专业和计划。`)) {
      const remainingRows = rows.filter((r) => r.date !== selectedDate);
      handleRowsChange(remainingRows);
      
      // Fallback to latest existing date or default
      const uniqueDates = Array.from(new Set(remainingRows.map(r => r.date))).sort();
      if (uniqueDates.length > 0) {
        setSelectedDate(uniqueDates[uniqueDates.length - 1]);
      } else {
        setSelectedDate("2026-06-28");
      }
      triggerToast(`🗑️ 已成功彻底删除 ${selectedDate} 的全部招生数据！`);
    }
  };

  // Initialize data on mount from localStorage or defaults with full history
  useEffect(() => {
    const savedConfig = localStorage.getItem("recruitment_table_config");
    const savedRows = localStorage.getItem("recruitment_table_rows");

    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        setConfig(DEFAULT_CONFIG);
      }
    } else {
      setConfig(DEFAULT_CONFIG);
    }

    if (savedRows) {
      try {
        const parsed = JSON.parse(savedRows);
        // Migrate legacy rows that don't have dates
        const migrated = parsed.map((r: any) => ({
          ...r,
          date: r.date || "2026-06-28"
        }));
        setRows(migrated);
      } catch (e) {
        setRows(generateDefaultRowsWithHistory());
      }
    } else {
      setRows(generateDefaultRowsWithHistory());
    }
  }, []);

  // Save changes to localStorage
  const handleRowsChange = (newRows: RowData[]) => {
    setRows(newRows);
    localStorage.setItem("recruitment_table_rows", JSON.stringify(newRows));
  };

  const handleImportData = (importedRows: RowData[], mode: "overwrite" | "append") => {
    if (importedRows.length === 0) return;

    // Use the actual date from the imported data. Since all imported rows share the same date:
    const targetDate = importedRows[0].date || selectedDate;

    if (mode === "overwrite") {
      // Filter out existing rows for targetDate
      const keptRows = rows.filter((r) => r.date !== targetDate);
      // Append the imported rows
      const updatedRows = [...keptRows, ...importedRows];
      handleRowsChange(updatedRows);
    } else {
      // Append mode: merge/replace by name if name matches, or append if new
      const keptRows = rows.filter((r) => r.date !== targetDate);
      const activeDayRows = rows.filter((r) => r.date === targetDate);
      
      const mergedDayRows = [...activeDayRows];
      importedRows.forEach((impRow) => {
        const existingIdx = mergedDayRows.findIndex((r) => r.name === impRow.name);
        if (existingIdx !== -1) {
          // Replace matching row, preserve existing ID and set correct target date
          mergedDayRows[existingIdx] = {
            ...impRow,
            date: targetDate,
            id: mergedDayRows[existingIdx].id
          };
        } else {
          mergedDayRows.push({
            ...impRow,
            date: targetDate
          });
        }
      });
      
      // Resequence seq indices
      mergedDayRows.forEach((r, idx) => {
        r.seq = idx + 1;
      });
      
      const updatedRows = [...keptRows, ...mergedDayRows];
      handleRowsChange(updatedRows);
    }

    // Auto-navigate to the imported date so the user can immediately see the results
    if (targetDate !== selectedDate) {
      setSelectedDate(targetDate);
    }
  };

  const handleConfigChange = (newConfig: TableConfig) => {
    setConfig(newConfig);
    localStorage.setItem("recruitment_table_config", JSON.stringify(newConfig));
  };

  // Reset all to defaults with history
  const handleReset = () => {
    if (window.confirm("确定要恢复表格至默认的招生初始状态及历史对比数据吗？（当前编辑的所有修改将会被覆盖）")) {
      const defaultWithHistory = generateDefaultRowsWithHistory();
      setRows(defaultWithHistory);
      setConfig(DEFAULT_CONFIG);
      localStorage.setItem("recruitment_table_rows", JSON.stringify(defaultWithHistory));
      localStorage.setItem("recruitment_table_config", JSON.stringify(DEFAULT_CONFIG));
      triggerToast("已恢复至包含多维历史周期的完整招生测试数据。");
    }
  };
  const handleExportCSV = () => {
    // Compute current rows based on viewMode and search filters
    const activeMonth = selectedDate.substring(0, 7);
    const monthRows = rows.filter((r) => r.date.startsWith(activeMonth));
    const grouped: { [key: string]: RowData } = {};
    
    monthRows.forEach((row) => {
      if (!grouped[row.name]) {
        grouped[row.name] = {
          id: `grouped-${row.name}`,
          seq: Object.keys(grouped).length + 1,
          name: row.name,
          date: activeMonth,
          channels: Array.from({ length: config.channels.length }, () => ({ target: 0, actual: 0 })),
          other: 0
        };
      }
      const existing = grouped[row.name];
      existing.other += row.other;
      row.channels.forEach((ch, chIdx) => {
        if (chIdx < existing.channels.length) {
          existing.channels[chIdx].target += ch.target;
          existing.channels[chIdx].actual += ch.actual;
        }
      });
    });
    
    const monthlyRows = Object.values(grouped);

    const currentRows = viewMode === "daily"
      ? rows.filter((r) => r.date === selectedDate)
      : monthlyRows;

    const exportRows = currentRows.filter((row) =>
      row.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (exportRows.length === 0) {
      triggerToast("当前筛选条件下无招生数据可供导出！");
      return;
    }

    const headers = ["序号", "专业/基础名称"];
    
    config.channels.forEach(ch => {
      headers.push(`${ch}-计划目标`, `${ch}-实际完成`);
    });
    
    headers.push("其他人员", "总目标计划", "总实际完成", "与目标之差");

    const lines = [headers.join(",")];

    exportRows.forEach((row, index) => {
      const totalTarget = row.channels.reduce((sum, ch) => sum + ch.target, 0);
      const totalActual = row.channels.reduce((sum, ch) => sum + ch.actual, 0) + row.other;
      const diff = totalActual - totalTarget;

      const cells = [
        (index + 1).toString(),
        `"${row.name.replace(/"/g, '""')}"`
      ];

      row.channels.forEach(ch => {
        cells.push(ch.target.toString(), ch.actual.toString());
      });

      cells.push(row.other.toString(), totalTarget.toString(), totalActual.toString(), diff.toString());
      lines.push(cells.join(","));
    });

    // Add footer aggregate sums
    const channelTotals = Array.from({ length: config.channels.length }, (_, chIdx) => {
      let targetSum = 0;
      let actualSum = 0;
      exportRows.forEach(row => {
        targetSum += row.channels[chIdx].target;
        actualSum += row.channels[chIdx].actual;
      });
      return { targetSum, actualSum, diff: actualSum - targetSum };
    });

    const otherTotal = exportRows.reduce((sum, r) => sum + r.other, 0);
    const overallTargetTotal = channelTotals.reduce((sum, ch) => sum + ch.targetSum, 0);
    const overallActualTotal = channelTotals.reduce((sum, ch) => sum + ch.actualSum, 0) + otherTotal;
    const overallDiff = overallActualTotal - overallTargetTotal;
    const overallRatio = overallTargetTotal > 0 ? (overallActualTotal / overallTargetTotal) * 100 : 0;

    // Aggregate Row 1: 合计
    const sumRow = ["合计", "-"];
    channelTotals.forEach(ch => {
      sumRow.push(ch.targetSum.toString(), ch.actualSum.toString());
    });
    sumRow.push(otherTotal.toString(), overallTargetTotal.toString(), overallActualTotal.toString(), overallDiff.toString());
    lines.push(sumRow.join(","));

    // Aggregate Row 2: 差值
    const diffRow = ["与目标之差", "-"];
    channelTotals.forEach(ch => {
      diffRow.push(ch.diff.toString(), ch.diff.toString());
    });
    diffRow.push("-", "-", "-", overallDiff.toString());
    lines.push(diffRow.join(","));

    // Ratio
    const ratioText = `${viewMode === "daily" ? `当日` : `${activeMonth}月`}招生目标人数完成比例`;
    const ratioRow = [ratioText, `${overallRatio.toFixed(2)}%`];
    lines.push(ratioRow.join(","));

    const csvContent = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const exportFileName = `${config.title || "招生数据表"}_${
      viewMode === "daily" ? selectedDate : `${activeMonth}月汇总`
    }.csv`;
    
    link.setAttribute("download", exportFileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast("CSV文件已成功导出！已为您注入 Microsoft Excel 兼容的 BOM 字符集。");
  };

  // High-Fidelity Excel (.xlsx) Export
  // Native format fully compatible with Microsoft Office Excel, WPS Office, and Google Sheets
  const handleExportExcel = () => {
    // Compute current rows based on viewMode and search filters
    const activeMonth = selectedDate.substring(0, 7);
    const monthRows = rows.filter((r) => r.date.startsWith(activeMonth));
    const grouped: { [key: string]: RowData } = {};
    
    monthRows.forEach((row) => {
      if (!grouped[row.name]) {
        grouped[row.name] = {
          id: `grouped-${row.name}`,
          seq: Object.keys(grouped).length + 1,
          name: row.name,
          date: activeMonth,
          channels: Array.from({ length: config.channels.length }, () => ({ target: 0, actual: 0 })),
          other: 0
        };
      }
      const existing = grouped[row.name];
      existing.other += row.other;
      row.channels.forEach((ch, chIdx) => {
        if (chIdx < existing.channels.length) {
          existing.channels[chIdx].target += ch.target;
          existing.channels[chIdx].actual += ch.actual;
        }
      });
    });
    
    const monthlyRows = Object.values(grouped);

    const currentRows = viewMode === "daily"
      ? rows.filter((r) => r.date === selectedDate)
      : monthlyRows;

    const exportRows = currentRows.filter((row) =>
      row.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (exportRows.length === 0) {
      triggerToast("当前筛选条件下无招生数据可供导出！");
      return;
    }

    // Create a new blank workbook
    const wb = XLSX.utils.book_new();

    // Prepare grid data (Array of Arrays)
    const aoa: any[][] = [];

    // Row 0: Table Title Row
    const titleText = `${config.title || "招生数据登记表"} - ${
      viewMode === "daily" ? `日期 ${selectedDate}` : `${activeMonth}月汇总表`
    }`;
    aoa.push([titleText]);

    // Row 1: Merged Header Row 1
    const headerRow1 = ["ID", "专业/基础名称"];
    config.channels.forEach((ch) => {
      headerRow1.push(ch, ""); // Space for actual column since channel name spans 2 columns
    });
    headerRow1.push("其他人员", "总目标计划", "总实际完成", "与目标之差");
    aoa.push(headerRow1);

    // Row 2: Merged Header Row 2
    const headerRow2 = ["", ""];
    config.channels.forEach(() => {
      headerRow2.push("计划目标", "实际完成");
    });
    headerRow2.push("", "", "", "");
    aoa.push(headerRow2);

    // Row 3 to 3+N-1: Data Rows
    exportRows.forEach((row, index) => {
      const totalTarget = row.channels.reduce((sum, ch) => sum + ch.target, 0);
      const totalActual = row.channels.reduce((sum, ch) => sum + ch.actual, 0) + row.other;
      const diff = totalActual - totalTarget;

      const dataRow: any[] = [
        index + 1, // Reset sequence index nicely for export
        row.name
      ];
      row.channels.forEach((ch) => {
        dataRow.push(ch.target, ch.actual);
      });
      dataRow.push(row.other, totalTarget, totalActual, diff);
      aoa.push(dataRow);
    });

    const N = exportRows.length;

    // Aggregate calculations for footer
    const channelTotals = Array.from({ length: config.channels.length }, (_, chIdx) => {
      let targetSum = 0;
      let actualSum = 0;
      exportRows.forEach(row => {
        targetSum += row.channels[chIdx].target;
        actualSum += row.channels[chIdx].actual;
      });
      return { targetSum, actualSum, diff: actualSum - targetSum };
    });

    const otherTotal = exportRows.reduce((sum, r) => sum + r.other, 0);
    const overallTargetTotal = channelTotals.reduce((sum, ch) => sum + ch.targetSum, 0);
    const overallActualTotal = channelTotals.reduce((sum, ch) => sum + ch.actualSum, 0) + otherTotal;
    const overallDiff = overallActualTotal - overallTargetTotal;
    const overallRatio = overallTargetTotal > 0 ? (overallActualTotal / overallTargetTotal) * 100 : 0;

    // Row 3+N: 合计 (Total) Row
    const sumRow: any[] = ["合计 (Total)", ""];
    channelTotals.forEach((ch) => {
      sumRow.push(ch.targetSum, ch.actualSum);
    });
    sumRow.push(otherTotal, overallTargetTotal, overallActualTotal, overallDiff);
    aoa.push(sumRow);

    // Row 3+N+1: 与目标之差 (Diff) Row
    const diffRow: any[] = ["与目标之差", ""];
    channelTotals.forEach((ch) => {
      diffRow.push(ch.diff, ""); // Spans 2 columns
    });
    diffRow.push("", "", "", overallDiff);
    aoa.push(diffRow);

    // Row 3+N+2: 目标人数完成比例 (Completion Ratio) Row
    const ratioText = `${viewMode === "daily" ? `当日` : `${activeMonth}月`}招生目标人数完成比例`;
    const ratioRow: any[] = [ratioText, `${overallRatio.toFixed(2)}%`];
    aoa.push(ratioRow);

    // Convert to sheet
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Setup cell mergers
    const numChannels = config.channels.length;
    const lastColIndex = 1 + numChannels * 2 + 3; // 1 (ID) + 1 (Name) + numChannels * 2 + 4 metrics - 1 for 0-index

    const merges = [
      // Title Row: Row 0, Columns 0 to lastColIndex
      { s: { r: 0, c: 0 }, e: { r: 0, c: lastColIndex } },

      // Header 1 & 2 column merges for ID and Name:
      // ID: Row 1 to 2, Column 0 (A2:A3)
      { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } },
      // Name: Row 1 to 2, Column 1 (B2:B3)
      { s: { r: 1, c: 1 }, e: { r: 2, c: 1 } },

      // Channel name merges on Row 1:
      ...Array.from({ length: numChannels }, (_, chIdx) => {
        const c = 2 + chIdx * 2;
        return { s: { r: 1, c }, e: { r: 1, c: c + 1 } };
      }),

      // Trailing metrics mergers:
      // Other: Row 1 to 2, Column (2 + numChannels * 2)
      { s: { r: 1, c: 2 + numChannels * 2 }, e: { r: 2, c: 2 + numChannels * 2 } },
      // Target Total: Row 1 to 2, Column (3 + numChannels * 2)
      { s: { r: 1, c: 3 + numChannels * 2 }, e: { r: 2, c: 3 + numChannels * 2 } },
      // Actual Total: Row 1 to 2, Column (4 + numChannels * 2)
      { s: { r: 1, c: 4 + numChannels * 2 }, e: { r: 2, c: 4 + numChannels * 2 } },
      // Diff: Row 1 to 2, Column (5 + numChannels * 2)
      { s: { r: 1, c: 5 + numChannels * 2 }, e: { r: 2, c: 5 + numChannels * 2 } },

      // Footer Row 1: 合计 (Total) columns A & B merged
      { s: { r: 3 + N, c: 0 }, e: { r: 3 + N, c: 1 } },

      // Footer Row 2: 与目标之差 column A & B merged, plus channel merges
      { s: { r: 3 + N + 1, c: 0 }, e: { r: 3 + N + 1, c: 1 } },
      ...Array.from({ length: numChannels }, (_, chIdx) => {
        const c = 2 + chIdx * 2;
        return { s: { r: 3 + N + 1, c }, e: { r: 3 + N + 1, c: c + 1 } };
      }),

      // Footer Row 3: Ratio Row merged across columns B to lastColIndex
      { s: { r: 3 + N + 2, c: 1 }, e: { r: 3 + N + 2, c: lastColIndex } }
    ];

    ws["!merges"] = merges;

    // Define column widths for a clean presentation
    ws["!cols"] = [
      { wch: 6 },   // ID (A)
      { wch: 25 },  // Name (B)
      ...Array.from({ length: numChannels * 2 }, () => ({ wch: 10 })), // channels x 2 columns
      { wch: 10 },  // Other
      { wch: 12 },  // Target Total
      { wch: 12 },  // Actual Total
      { wch: 12 }   // Diff
    ];

    // Append sheet and write out file
    XLSX.utils.book_append_sheet(wb, ws, "招生数据");
    
    // Download trigger
    const exportFileName = `${config.title || "招生数据表"}_${
      viewMode === "daily" ? selectedDate : `${activeMonth}月汇总`
    }.xlsx`;
    
    XLSX.writeFile(wb, exportFileName);
    
    triggerToast("Excel表格已成功导出！全面支持 Microsoft Office, WPS 与 Google Sheets。");
  };

  // Clear simulated actuals
  const handleClearActuals = () => {
    if (window.confirm("确定要清空所有「实际完成」和「其他人员」的招生数吗？（此操作保留专业名称和目标计划）")) {
      const cleared = rows.map((row) => ({
        ...row,
        channels: row.channels.map((ch) => ({ ...ch, actual: 0 })),
        other: 0
      }));
      handleRowsChange(cleared);
      triggerToast("实际招生完成数据已全部归零。");
    }
  };

  // Wipe spreadsheet clean
  const handleClearAll = () => {
    if (window.confirm("确定要完全清空表格数据吗？（清除所有专业行，需要您重新添加）")) {
      handleRowsChange([]);
      triggerToast("表格已完全清空，点击列表下方的添加按钮即可开始创建。");
    }
  };

  // Simulation actuals generator
  const handleSimulateData = () => {
    let minRate = 0.3;
    let maxRate = 0.6;
    if (simRate === "high") {
      minRate = 0.6;
      maxRate = 0.95;
    } else if (simRate === "low") {
      minRate = 0.1;
      maxRate = 0.4;
    }

    const simulatedRows = rows.map((row) => {
      const updatedChannels = row.channels.map((ch) => {
        if (ch.target === 0) {
          return { ...ch, actual: 0 };
        }
        const p = minRate + Math.random() * (maxRate - minRate);
        const actual = Math.round(ch.target * p);
        return { ...ch, actual };
      });

      const totalTarget = row.channels.reduce((sum, ch) => sum + ch.target, 0);
      const other = Math.round(totalTarget * (minRate + Math.random() * (maxRate - minRate)) * 0.15);

      return {
        ...row,
        channels: updatedChannels,
        other
      };
    });

    handleRowsChange(simulatedRows);
    setShowSimModal(false);
    triggerToast(`招生数据模拟成功！已按 [${simRate === "high" ? "优秀水平 60-95%" : simRate === "low" ? "较低水平 10-40%" : "正常水平 30-60%"}] 完成率填充。`);
  };

  // Call Gemini API to analyze monthly enrollment trends
  const handleAnalyzeTrends = async () => {
    const activeMonth = selectedDate.substring(0, 7);
    const monthlyRows = rows.filter(r => r.date.startsWith(activeMonth));
    if (monthlyRows.length === 0) {
      alert(`⚠️ 本月 (${activeMonth}) 暂无招生数据登记，无法进行趋势分析！`);
      return;
    }

    setTrendLoading(true);
    setShowTrendModal(true);
    setTrendContent("");

    try {
      const response = await fetch("/api/analyze-trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: monthlyRows, config }),
      });

      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setTrendContent(data.analysis);
    } catch (err: any) {
      console.error("Failed to analyze trends:", err);
      setTrendContent(`### ❌ 趋势研判生成失败\n\n数据分析加载失败，原因：${err.message || "未知错误"}。请点击上方重新分析或稍后重试。`);
    } finally {
      setTrendLoading(false);
    }
  };

  // Filter active rows for side dashboard and Excel grid based on current date / month
  const activeKPIRows = viewMode === "daily"
    ? rows.filter((r) => r.date === selectedDate)
    : rows.filter((r) => r.date.startsWith(selectedDate.substring(0, 7)));

  // Dashboard Aggregates Calculations (Dynamic)
  const totalTarget = activeKPIRows.reduce((sum, row) => {
    return sum + row.channels.reduce((chSum, ch) => chSum + ch.target, 0);
  }, 0);

  const totalActual = activeKPIRows.reduce((sum, row) => {
    return sum + row.channels.reduce((chSum, ch) => chSum + ch.actual, 0) + row.other;
  }, 0);

  const completionRatio = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

  // Compute previous period actual for growth comparison (Day-on-Day or Month-on-Month)
  const prevDateStr = (() => {
    const d = new Date(selectedDate);
    if (isNaN(d.getTime())) return "";
    d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  const prevMonthStr = (() => {
    if (!selectedDate || selectedDate.length < 7) return "";
    const year = parseInt(selectedDate.substring(0, 4));
    const month = parseInt(selectedDate.substring(5, 7));
    if (isNaN(year) || isNaN(month)) return "";
    const d = new Date(year, month - 2, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  })();

  const prevPeriodActual = (() => {
    if (viewMode === "daily") {
      const prevKPIRows = rows.filter((r) => r.date === prevDateStr);
      return prevKPIRows.reduce((sum, row) => {
        return sum + row.channels.reduce((chSum, ch) => chSum + ch.actual, 0) + row.other;
      }, 0);
    } else {
      const prevKPIRows = rows.filter((r) => r.date.startsWith(prevMonthStr));
      return prevKPIRows.reduce((sum, row) => {
        return sum + row.channels.reduce((chSum, ch) => chSum + ch.actual, 0) + row.other;
      }, 0);
    }
  })();

  const growthRate = (() => {
    if (prevPeriodActual === 0) {
      return totalActual > 0 ? 100 : 0;
    }
    return ((totalActual - prevPeriodActual) / prevPeriodActual) * 100;
  })();

  const formattedGrowthRate = (() => {
    if (prevPeriodActual === 0) {
      if (totalActual === 0) return "0.00%";
      return `+${((totalActual / 1) * 100).toFixed(0)}%`;
    }
    const rate = ((totalActual - prevPeriodActual) / prevPeriodActual) * 100;
    return `${rate >= 0 ? "+" : ""}${rate.toFixed(2)}%`;
  })();

  // Compute data check / health check on selectedDate rows
  const dayRowsForAudit = rows.filter((r) => r.date === selectedDate);
  const auditIssues = dayRowsForAudit.map((row) => {
    const target = row.channels.reduce((sum, ch) => sum + ch.target, 0);
    const actual = row.channels.reduce((sum, ch) => sum + ch.actual, 0) + row.other;
    const diff = actual - target;
    const noteMissing = diff !== 0 && (!row.note || !row.note.trim());
    return {
      id: row.id,
      name: row.name,
      target,
      actual,
      diff,
      noteMissing,
      note: row.note || ""
    };
  }).filter(item => item.diff !== 0);

  const mismatchCount = auditIssues.length;
  const missingNoteCount = auditIssues.filter(item => item.noteMissing).length;

  // Find Top Performing Major (by total actual completed)
  let topMajorName = "-";
  let topMajorCount = 0;
  activeKPIRows.forEach((row) => {
    const rowActual = row.channels.reduce((sum, ch) => sum + ch.actual, 0) + row.other;
    if (rowActual > topMajorCount) {
      topMajorCount = rowActual;
      topMajorName = row.name;
    }
  });

  // Find Top Channel (by total actual completed)
  let topChannelName = "-";
  let topChannelCount = 0;
  const channelTotals = Array.from({ length: config.channels.length }, () => 0);
  activeKPIRows.forEach((row) => {
    row.channels.forEach((ch, chIdx) => {
      if (chIdx < channelTotals.length) {
        channelTotals[chIdx] += ch.actual;
      }
    });
  });

  channelTotals.forEach((val, chIdx) => {
    if (val > topChannelCount) {
      topChannelCount = val;
      topChannelName = config.channels[chIdx] || `渠道 ${chIdx + 1}`;
    }
  });

  // Compute Trend Timeline Data for KPI Cards Sparklines based on viewMode & selectedDate
  const kpiTimelineSeries = React.useMemo(() => {
    let timelineDates: string[] = [];

    if (viewMode === "daily") {
      const sortedDates = Array.from(new Set(rows.map((r) => r.date))).sort();
      const selIdx = sortedDates.indexOf(selectedDate);
      if (selIdx !== -1) {
        const start = Math.max(0, selIdx - 6);
        timelineDates = sortedDates.slice(start, selIdx + 1);
      } else {
        timelineDates = sortedDates.slice(-7);
      }
    } else {
      const activeMonthStr = selectedDate.substring(0, 7);
      timelineDates = Array.from(new Set(rows.filter((r) => r.date.startsWith(activeMonthStr)).map((r) => r.date))).sort();
    }

    const shortDates = timelineDates.map((d) => d.substring(5));

    const targetTrend: number[] = [];
    const actualTrend: number[] = [];
    const ratioTrend: number[] = [];
    const topMajorTrend: number[] = [];
    const topChannelTrend: number[] = [];
    const growthTrend: number[] = [];

    timelineDates.forEach((dStr) => {
      const dayRows = rows.filter((r) => r.date === dStr);
      
      const dayTarget = dayRows.reduce((sum, r) => {
        return sum + r.channels.reduce((chSum, ch) => chSum + ch.target, 0);
      }, 0);

      const dayActual = dayRows.reduce((sum, r) => {
        return sum + r.channels.reduce((chSum, ch) => chSum + ch.actual, 0) + r.other;
      }, 0);

      const dayRatio = dayTarget > 0 ? (dayActual / dayTarget) * 100 : 0;

      let dayMaxMajor = 0;
      dayRows.forEach((r) => {
        const rowActual = r.channels.reduce((chSum, ch) => chSum + ch.actual, 0) + r.other;
        if (rowActual > dayMaxMajor) dayMaxMajor = rowActual;
      });

      const dayChannelTotals = Array.from({ length: config.channels.length }, () => 0);
      dayRows.forEach((r) => {
        r.channels.forEach((ch, cIdx) => {
          if (cIdx < dayChannelTotals.length) {
            dayChannelTotals[cIdx] += ch.actual;
          }
        });
      });
      const dayMaxChannel = Math.max(0, ...dayChannelTotals);

      targetTrend.push(dayTarget);
      actualTrend.push(dayActual);
      ratioTrend.push(Number(dayRatio.toFixed(1)));
      topMajorTrend.push(dayMaxMajor);
      topChannelTrend.push(dayMaxChannel);
      growthTrend.push(dayActual);
    });

    return {
      shortDates,
      targetTrend,
      actualTrend,
      ratioTrend,
      topMajorTrend,
      topChannelTrend,
      growthTrend,
    };
  }, [rows, selectedDate, viewMode, config.channels]);

  return (
    <div className={`h-screen w-full flex flex-col overflow-hidden font-sans antialiased text-xs transition-colors duration-200 ${
      isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-800"
    }`}>
      
      {/* Toast Alert Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 text-xs px-4 py-2.5 rounded shadow-xl flex items-center gap-2 z-50 font-medium ${
              isDarkMode ? "bg-slate-900 text-white border border-slate-800" : "bg-slate-900 text-white"
            }`}
          >
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{showToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Section */}
      <header className={`h-12 flex items-center justify-between px-3 md:px-4 z-20 shrink-0 transition-colors duration-200 ${
        isDarkMode ? "bg-slate-900 border-b border-slate-850" : "bg-white border-b border-slate-200"
      }`}>
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Mobile Sidebar Toggle Hamburger */}
          <button
            type="button"
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className={`p-1.5 rounded-lg lg:hidden transition-colors cursor-pointer ${
              isDarkMode ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-600"
            }`}
            title="菜单/切换配置侧栏"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="bg-emerald-600 p-1.5 rounded text-white flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </div>
          <div className="truncate">
            <h1 className={`text-xs sm:text-sm font-extrabold tracking-tight flex items-center transition-colors duration-200 truncate ${
              isDarkMode ? "text-slate-100" : "text-slate-900"
            }`}>
              <span className="truncate">招生数据智能分析</span>
              <span className="hidden sm:inline ml-1 font-extrabold">系统</span>
              <span className={`ml-1.5 px-1 py-0.5 text-[8px] md:text-[10px] font-bold rounded border transition-colors duration-200 shrink-0 ${
                isDarkMode 
                  ? "bg-emerald-950/40 text-emerald-400 border-emerald-900" 
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}>
                v2.6
              </span>
            </h1>
          </div>
        </div>

        {/* Global Header actions */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 md:space-x-2 relative">
          {/* Deviation Notification Bell Button */}
          <button
            onClick={() => setShowDeviationModal(true)}
            className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] md:text-xs font-bold transition-all cursor-pointer border shrink-0 ${
              dailyDeviatedCount > 0
                ? (isDarkMode 
                    ? "bg-rose-950/50 border-rose-800 text-rose-300 hover:bg-rose-900/60" 
                    : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 shadow-2xs")
                : (isDarkMode 
                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white" 
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100")
            }`}
            title="招生计划偏离预警通知中心 (Daily Variance Alert)"
          >
            <Bell className={`w-3.5 h-3.5 ${dailyDeviatedCount > 0 ? "text-rose-500 animate-bounce" : ""}`} />
            <span className="hidden sm:inline">偏离预警</span>
            {dailyDeviatedCount > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded-full bg-rose-500 text-white font-mono shadow-xs">
                {dailyDeviatedCount}
              </span>
            )}
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded text-[10px] md:text-xs font-semibold transition-all cursor-pointer border shrink-0 ${
              isDarkMode 
                ? "bg-slate-800 border-slate-700 text-amber-400 hover:text-amber-300 hover:bg-slate-750" 
                : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100"
            }`}
            title={isDarkMode ? "切换至明亮模式" : "切换至护眼深色模式"}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">{isDarkMode ? "明亮" : "深色"}</span>
          </button>

          {/* Desktop Actions Row (Hidden on mobile/tablet) */}
          <div className="hidden lg:flex items-center space-x-1.5 md:space-x-2">
            <button
              onClick={handleReset}
              className={`flex items-center gap-1 px-2 py-1.5 rounded text-[10px] md:text-xs font-semibold transition-all cursor-pointer border shrink-0 ${
                isDarkMode 
                  ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-750" 
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-100 border-slate-200"
              }`}
              title="恢复到2026年6月招生初始状态数据"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">重置</span>
            </button>
            
            <button
              onClick={() => setShowImportModal(true)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded text-[10px] md:text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                isDarkMode 
                  ? "bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/35 border-emerald-800" 
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200"
              }`}
              title="一键智能识图或导入 Excel/CSV 表格"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">导入</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] md:text-xs font-bold shadow-sm bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white cursor-pointer transition-all active:scale-95 shrink-0"
              title="导出为 Excel 表格 (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">导出 Excel</span>
            </button>

            <button
              onClick={handleExportCSV}
              className={`flex items-center gap-1 px-2 py-1.5 rounded text-[10px] md:text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                isDarkMode 
                  ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-750" 
                  : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-200"
              }`}
              title="导出为 CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">导出 CSV</span>
            </button>
          </div>

          {/* Mobile/Tablet Actions Toggle (Visible on mobile/tablet) */}
          <div className="lg:hidden relative">
            <button
              onClick={() => setShowActionsDropdown(!showActionsDropdown)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded text-[10px] font-bold transition-all border cursor-pointer shrink-0 ${
                isDarkMode 
                  ? "bg-emerald-950/40 border-emerald-800 text-emerald-400 hover:bg-emerald-900/30" 
                  : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
              }`}
              title="数据分析与导入导出工具"
            >
              <Settings className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>数据工具</span>
              <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-200 ${showActionsDropdown ? "rotate-180" : ""}`} />
            </button>

            {/* Absolute Dropdown Actions Menu */}
            <AnimatePresence>
              {showActionsDropdown && (
                <div key="actions-dropdown-wrapper">
                  <div key="actions-backdrop" className="fixed inset-0 z-40" onClick={() => setShowActionsDropdown(false)} />
                  <motion.div
                    key="actions-dropdown-menu"
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    className={`absolute right-0 mt-1.5 w-40 rounded-xl shadow-xl border p-1 z-50 flex flex-col gap-0.5 ${
                      isDarkMode 
                        ? "bg-slate-900 border-slate-800 text-slate-100" 
                        : "bg-white border-slate-150 text-slate-800"
                    }`}
                  >
                    <button
                      onClick={() => {
                        setShowActionsDropdown(false);
                        handleReset();
                      }}
                      className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[11px] font-bold text-left transition-all ${
                        isDarkMode ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-50 text-slate-750"
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      <span>重置初始数据</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowActionsDropdown(false);
                        setShowImportModal(true);
                      }}
                      className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[11px] font-bold text-left transition-all ${
                        isDarkMode ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-50 text-slate-750"
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-500" />
                      <span>智能识图导入</span>
                    </button>

                    <div className={`h-px my-1 ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`} />

                    <button
                      onClick={() => {
                        setShowActionsDropdown(false);
                        handleExportExcel();
                      }}
                      className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[11px] font-bold text-left transition-all ${
                        isDarkMode ? "hover:bg-slate-800 text-emerald-400" : "hover:bg-slate-50 text-emerald-700"
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                      <span>导出 Excel 表格</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowActionsDropdown(false);
                        handleExportCSV();
                      }}
                      className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[11px] font-bold text-left transition-all ${
                        isDarkMode ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-50 text-slate-750"
                      }`}
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-500" />
                      <span>导出 CSV 数据</span>
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Panel Workspace (Split into Sidebar and Spreadsheet) */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Sidebar Backdrop overlay on mobile */}
        <AnimatePresence>
          {showMobileSidebar && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 lg:hidden"
              onClick={() => setShowMobileSidebar(false)}
            />
          )}
        </AnimatePresence>

        {/* Left Sidebar Panel */}
        <aside className={`fixed lg:static inset-y-0 left-0 w-80 max-w-[85vw] h-full flex flex-col justify-between overflow-hidden shrink-0 z-40 transition-all duration-300 lg:translate-x-0 ${
          showMobileSidebar ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        } ${
          isDarkMode 
            ? "bg-slate-900 border-r border-slate-850 shadow-none text-slate-100" 
            : "bg-white border-r border-slate-200 text-slate-800 shadow-[2px_0_8px_rgba(0,0,0,0.02)]"
        }`}>
          
          {/* Mobile Sidebar Close Button Row */}
          <div className="lg:hidden flex items-center justify-between px-4 pt-4 pb-2 border-b dark:border-slate-800 border-slate-100 shrink-0">
            <span className="text-xs font-extrabold tracking-wider text-emerald-600 dark:text-emerald-400">系统导航菜单</span>
            <button
              onClick={() => setShowMobileSidebar(false)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isDarkMode 
                  ? "bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-300" 
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-5 flex-1 overflow-y-auto">
            {/* Group 1: Configs */}
            <div className="space-y-3">
              <div className={`flex items-center uppercase tracking-wider font-bold text-[10px] pb-1.5 border-b ${
                isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-400"
              }`}>
                <Settings className="w-3.5 h-3.5 mr-1" />
                表格基础配置 (Table Properties)
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                  数据表全局标题 (Double-click to edit)
                </label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => handleConfigChange({ ...config, title: e.target.value })}
                  className={`w-full font-bold px-2 py-1.5 border rounded outline-none transition-all text-xs ${
                    isDarkMode 
                      ? "bg-slate-950 border-slate-800 hover:bg-slate-850 text-white focus:border-emerald-500" 
                      : "bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 border-slate-200 focus:border-emerald-500"
                  }`}
                  placeholder="请输入表格标题"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(true)}
                  className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 border rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isDarkMode 
                      ? "bg-emerald-950/20 border-emerald-900/60 text-emerald-400 hover:bg-emerald-950/40 hover:border-emerald-700" 
                      : "bg-emerald-50 border-emerald-150 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  <Settings className="w-3.5 h-3.5 text-emerald-500 animate-spin-slow" />
                  <span>配置招生渠道 (新增/删除/重命名)</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                  拼音/汉字检索专业基础
                </label>
                <div className="relative">
                  <Search className={`absolute left-2.5 top-2 w-3.5 h-3.5 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full font-medium pl-8 pr-2.5 py-1.5 border rounded outline-none transition-all text-xs ${
                      isDarkMode 
                        ? "bg-slate-950 border-slate-800 hover:bg-slate-850 text-white focus:border-emerald-500" 
                        : "bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 border-slate-200 focus:border-emerald-500"
                    }`}
                    placeholder="搜索：给排水 / 电气 / 岩土 / 道路..."
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {searchTerm.trim() !== "" && (() => {
                    const cleanSearchTerm = searchTerm.trim().toLowerCase();
                    const matchedMajors = Object.entries(MAJOR_METADATA)
                      .filter(([name, meta]) => {
                        return (
                          name.toLowerCase().includes(cleanSearchTerm) ||
                          meta.description.toLowerCase().includes(cleanSearchTerm) ||
                          meta.summary.toLowerCase().includes(cleanSearchTerm) ||
                          meta.keywords.some(kw => kw.toLowerCase().includes(cleanSearchTerm))
                        );
                      })
                      .map(([name, meta]) => ({ name, ...meta }));

                    if (matchedMajors.length === 0) return null;

                    return (
                      <div className={`absolute left-0 right-0 top-full mt-1.5 rounded-xl border shadow-2xl z-50 max-h-64 overflow-y-auto transition-all ${
                        isDarkMode 
                          ? "bg-slate-900 border-slate-800 text-slate-200 shadow-black/90" 
                          : "bg-white border-slate-200 text-slate-800 shadow-slate-200/90"
                      }`}>
                        <div className="p-2 border-b text-[10px] uppercase tracking-wide font-bold flex items-center justify-between dark:border-slate-800 border-slate-100 text-slate-400 select-none">
                          <span>专业基础简析匹配 ({matchedMajors.length})</span>
                          <span className="text-[9px] lowercase font-normal">点击快速过滤并定位</span>
                        </div>
                        <div className="divide-y dark:divide-slate-800 divide-slate-100">
                          {matchedMajors.map((major, mIdx) => (
                            <button
                              key={`matched-major-${major.name}-${mIdx}`}
                              type="button"
                              onClick={() => setSearchTerm(major.name)}
                              className="w-full text-left p-2.5 transition-colors flex flex-col gap-1 cursor-pointer focus:outline-none focus:bg-amber-500/5 dark:hover:bg-slate-850 hover:bg-slate-50"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-semibold text-xs text-amber-500 dark:text-amber-400">
                                  {major.name}
                                </span>
                                <div className="flex gap-1">
                                  {major.keywords.slice(0, 2).map((kw, idx) => (
                                    <span key={`kw-${mIdx}-${idx}`} className="bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 text-[9px] px-1 py-0.2 rounded border border-amber-500/20">
                                      {kw}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <p className="text-[11px] leading-normal text-slate-500 dark:text-slate-400 line-clamp-2">
                                {major.summary}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Only Show with Notes Switch */}
                <div className={`mt-2 p-2 rounded-lg border transition-all flex items-center justify-between ${
                  isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-150"
                }`}>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    仅检索带备注的专业行
                  </span>
                  <button
                    type="button"
                    onClick={() => setOnlyShowWithNotes(!onlyShowWithNotes)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      onlyShowWithNotes ? "bg-amber-500" : (isDarkMode ? "bg-slate-800" : "bg-slate-200")
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        onlyShowWithNotes ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Temporal Selection Group */}
            <div className={`space-y-3 p-3 border rounded transition-colors duration-200 ${
              isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50/70 border-slate-150"
            }`}>
              <div className={`flex items-center uppercase tracking-wider font-bold text-[10px] pb-1.5 border-b ${
                isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-400"
              }`}>
                <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                时间维度设置 (Temporal Scope)
              </div>

              <div className={`flex p-0.5 border rounded text-[10px] font-bold transition-colors duration-200 ${
                isDarkMode ? "bg-slate-905 border-slate-800" : "bg-slate-100 border-slate-250"
              }`}>
                <button
                  type="button"
                  onClick={() => setViewMode("daily")}
                  className={`flex-1 py-1 text-center rounded transition-all cursor-pointer ${
                    viewMode === "daily"
                      ? (isDarkMode ? "bg-slate-800 text-emerald-400 shadow-2xs font-extrabold" : "bg-white text-emerald-700 shadow-2xs font-extrabold")
                      : (isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800")
                  }`}
                >
                  📅 每日登记
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("monthly")}
                  className={`flex-1 py-1 text-center rounded transition-all cursor-pointer ${
                    viewMode === "monthly"
                      ? (isDarkMode ? "bg-slate-800 text-emerald-400 shadow-2xs font-extrabold" : "bg-white text-emerald-700 shadow-2xs font-extrabold")
                      : (isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800")
                  }`}
                >
                  📊 月度累计
                </button>
              </div>

              {viewMode === "daily" ? (
                <div className="space-y-2">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                    选择/创建招生明细日期:
                  </label>
                  
                  <div className="flex gap-1.5">
                    <input
                      type="date"
                      value={selectedDate}
                      min="2025-01-01"
                      max="2026-12-31"
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedDate(e.target.value);
                        }
                      }}
                      className={`flex-1 font-bold px-2 py-1.5 border rounded outline-none transition-all text-xs ${
                        isDarkMode 
                          ? "bg-slate-900 border-slate-800 text-white focus:border-emerald-500" 
                          : "bg-slate-50 text-slate-800 border-slate-200 focus:border-emerald-500"
                      }`}
                    />
                    
                    {/* Toggle dropdown of registered days */}
                    <button
                      type="button"
                      onClick={() => setShowDateListDropdown(!showDateListDropdown)}
                      className={`px-2 py-1.5 border rounded font-semibold transition-all cursor-pointer text-xs flex items-center justify-center ${
                        isDarkMode 
                          ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" 
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                      title="查看所有已登记的日期数据列表"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showDateListDropdown ? "rotate-180" : ""}`} />
                    </button>
                  </div>

                  {/* Registered dates list inline card */}
                  {showDateListDropdown && (
                    <div className={`border rounded p-2 max-h-48 overflow-y-auto space-y-1 ${
                      isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
                    }`}>
                      <div className="text-[9px] font-bold text-slate-400 pb-1 border-b border-dashed border-slate-150 dark:border-slate-800 mb-1">
                        🗓️ 系统已登记的招生日期:
                      </div>
                      {getRegisteredDates().map(({ date, count, completionRate, completed }, idx) => (
                        <button
                          key={`reg-date-${date}-${idx}`}
                          type="button"
                          onClick={() => {
                            setSelectedDate(date);
                            setShowDateListDropdown(false);
                            setShowMobileSidebar(false);
                          }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] flex items-center justify-between transition-all ${
                            selectedDate === date
                              ? "bg-emerald-600/10 text-emerald-500 font-bold"
                              : (isDarkMode ? "hover:bg-slate-900 text-slate-300" : "hover:bg-slate-50 text-slate-600")
                          }`}
                        >
                          <span>{date} ({count}条专业)</span>
                          <span className="font-mono text-[9px] opacity-85">已完成 {completed}人 ({completionRate.toFixed(0)}%)</span>
                        </button>
                      ))}
                      {getRegisteredDates().length === 0 && (
                        <div className="text-center text-[10px] py-2 text-slate-400">
                          暂无任何登记日期
                        </div>
                      )}
                    </div>
                  )}

                  {/* Date preset quick actions */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate("2026-06-28");
                        setShowMobileSidebar(false);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[9px] border transition-all ${
                        selectedDate === "2026-06-28"
                          ? "bg-emerald-600 text-white border-emerald-600 font-bold"
                          : (isDarkMode ? "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100")
                      }`}
                    >
                      今天 (06-28)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate("2026-06-27");
                        setShowMobileSidebar(false);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[9px] border transition-all ${
                        selectedDate === "2026-06-27"
                          ? "bg-emerald-600 text-white border-emerald-600 font-bold"
                          : (isDarkMode ? "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100")
                      }`}
                    >
                      昨天 (06-27)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate("2026-06-21");
                        setShowMobileSidebar(false);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[9px] border transition-all ${
                        selectedDate === "2026-06-21"
                          ? "bg-emerald-600 text-white border-emerald-600 font-bold"
                          : (isDarkMode ? "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100")
                      }`}
                    >
                      上周日 (06-21)
                    </button>
                  </div>

                  {/* Day copy and clear quick operations */}
                  <div className="pt-1.5 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const tomorrow = new Date(selectedDate);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        const tomStr = tomorrow.toISOString().substring(0, 10);
                        setCloneTargetDate(tomStr);
                        setShowCloneModal(true);
                      }}
                      className={`flex-1 py-1.5 border rounded font-semibold transition-all cursor-pointer text-[10px] flex items-center justify-center gap-1 ${
                        isDarkMode 
                          ? "bg-slate-900 hover:bg-slate-800 border-slate-800 text-emerald-400" 
                          : "bg-emerald-50 hover:bg-emerald-100 border-emerald-150 text-emerald-800"
                      }`}
                      title="复制本页招生计划、专业等配置到其他指定日期"
                    >
                      <Copy className="w-3 h-3" />
                      <span>复制/克隆当前天</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteCurrentDay}
                      className={`py-1.5 px-2 border rounded font-semibold transition-all cursor-pointer text-[10px] flex items-center justify-center gap-1 ${
                        isDarkMode 
                          ? "bg-slate-900 hover:bg-red-950/40 border-slate-800 hover:border-red-900 text-red-400" 
                          : "bg-red-50 hover:bg-red-100 border-red-150 text-red-700"
                      }`}
                      title="删除该日期下的全部专业报名数据"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>删除全天</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                    切换汇总月份:
                  </label>
                  <select
                    value={selectedDate.substring(0, 7)}
                    onChange={(e) => {
                      const newMonth = e.target.value;
                      setSelectedDate(`${newMonth}-01`);
                    }}
                    className={`w-full font-bold px-2 py-1.5 border rounded outline-none transition-all text-xs ${
                      isDarkMode 
                        ? "bg-slate-900 border-slate-800 text-white focus:border-emerald-500" 
                        : "bg-slate-50 text-slate-800 border-slate-200 focus:border-emerald-500"
                    }`}
                  >
                    <option value="2026-06">2026年06月 (招生期)</option>
                    <option value="2026-05">2026年05月 (上个月)</option>
                    <option value="2025-06">2025年06月 (去年同期)</option>
                  </select>
                  <p className="text-[9px] leading-tight text-slate-400">
                    💡 在「月度累计」下，表格汇总该月所有日期的值，为只读。
                  </p>
                </div>
              )}
            </div>

            {/* Group 2: Dynamic KPIs Dashboard */}
            <div className="space-y-3">
              <div className={`flex items-center justify-between uppercase tracking-wider font-bold text-[10px] pb-1.5 border-b ${
                isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-400"
              }`}>
                <div className="flex items-center">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  动态运营指标 (KPI Metrics Dashboard)
                </div>
                {JSON.stringify(kpiOrder) !== JSON.stringify(["target", "actual", "ratio", "topMajor", "topChannel"]) && (
                  <button
                    onClick={handleResetKpiOrder}
                    className="flex items-center gap-0.5 text-[9px] text-emerald-500 hover:text-emerald-450 transition-colors font-bold cursor-pointer"
                    title="重置为默认排序"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>重置顺序</span>
                  </button>
                )}
              </div>

              <p className="text-[9px] text-slate-400 -mt-1 leading-tight">
                💡 可通过卡片右侧的 <GripVertical className="w-2.5 h-2.5 inline" /> 图标，按住并上下拖拽自定义指标卡片的展示顺序。
              </p>

              <div className="space-y-2">
                {kpiOrder.map((key, index) => {
                  let cardContent = null;
                  let sparklineNode = null;
                  
                  if (key === "target") {
                    cardContent = (
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                          <Target className="w-3.5 h-3.5 text-blue-500" /> 
                          <span>招生总目标</span>
                        </div>
                        <div className={`text-base font-extrabold tracking-tight mt-1 font-mono ${
                          isDarkMode ? "text-slate-100" : "text-slate-800"
                        }`}>
                          {totalTarget} <span className="text-[10px] text-slate-400 font-normal">人</span>
                        </div>
                      </div>
                    );
                    sparklineNode = (
                      <MiniSparkline
                        data={kpiTimelineSeries.targetTrend}
                        dates={kpiTimelineSeries.shortDates}
                        color="#3b82f6"
                        label="招生总目标趋势"
                        unit="人"
                        isDarkMode={isDarkMode}
                      />
                    );
                  } else if (key === "actual") {
                    cardContent = (
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-emerald-500" /> 
                          <span>累计已完成</span>
                        </div>
                        <div className={`text-base font-extrabold tracking-tight mt-1 font-mono ${
                          isDarkMode ? "text-slate-100" : "text-slate-800"
                        }`}>
                          {totalActual} <span className="text-[10px] text-slate-400 font-normal">人</span>
                        </div>
                      </div>
                    );
                    sparklineNode = (
                      <MiniSparkline
                        data={kpiTimelineSeries.actualTrend}
                        dates={kpiTimelineSeries.shortDates}
                        color="#10b981"
                        label="累计已完成趋势"
                        unit="人"
                        isDarkMode={isDarkMode}
                      />
                    );
                  } else if (key === "ratio") {
                    cardContent = (
                      <div className="space-y-1.5 flex-1 min-w-0 mr-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                          <span>{viewMode === "daily" ? `${selectedDate} 达成率` : `${selectedDate.substring(0, 7)} 累计达成率`}</span>
                          <span className={`font-mono ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>{completionRatio.toFixed(2)}%</span>
                        </div>
                        <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`}>
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, completionRatio)}%` }}
                            className="bg-emerald-500 h-full rounded-full"
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium truncate">
                          {completionRatio >= 100 
                            ? "🎉 已圆满达成该时段招生计划" 
                            : `差额目标还需努力: ${Math.max(0, totalTarget - totalActual)} 人`}
                        </div>
                      </div>
                    );
                    sparklineNode = (
                      <MiniSparkline
                        data={kpiTimelineSeries.ratioTrend}
                        dates={kpiTimelineSeries.shortDates}
                        color="#f59e0b"
                        label="达成率变化"
                        unit="%"
                        isDarkMode={isDarkMode}
                      />
                    );
                  } else if (key === "topMajor") {
                    cardContent = (
                      <div className="flex-1 min-w-0 mr-1">
                        <div className="flex items-center text-slate-500 font-medium text-[10px]">
                          <Award className="w-3.5 h-3.5 text-amber-500 mr-1 shrink-0" />
                          <span className="font-semibold uppercase tracking-wider">强势创收专业</span>
                        </div>
                        <div className={`font-extrabold text-xs mt-1 truncate ${isDarkMode ? "text-slate-200" : "text-slate-800"}`} title={topMajorName}>
                          {topMajorName} ({topMajorCount}人)
                        </div>
                      </div>
                    );
                    sparklineNode = (
                      <MiniSparkline
                        data={kpiTimelineSeries.topMajorTrend}
                        dates={kpiTimelineSeries.shortDates}
                        color="#a855f7"
                        label="单科最高招生趋势"
                        unit="人"
                        isDarkMode={isDarkMode}
                      />
                    );
                  } else if (key === "topChannel") {
                    cardContent = (
                      <div className="flex-1 min-w-0 mr-1">
                        <div className="flex items-center text-slate-500 font-medium text-[10px]">
                          <Award className="w-3.5 h-3.5 text-blue-500 mr-1 shrink-0" />
                          <span className="font-semibold uppercase tracking-wider">卓越招生渠道</span>
                        </div>
                        <div className={`font-extrabold text-xs mt-1 truncate ${isDarkMode ? "text-slate-200" : "text-slate-800"}`} title={topChannelName}>
                          {topChannelName} ({topChannelCount}人)
                        </div>
                      </div>
                    );
                    sparklineNode = (
                      <MiniSparkline
                        data={kpiTimelineSeries.topChannelTrend}
                        dates={kpiTimelineSeries.shortDates}
                        color="#06b6d4"
                        label="单渠道最高招生趋势"
                        unit="人"
                        isDarkMode={isDarkMode}
                      />
                    );
                  }

                  return (
                    <div
                      key={`kpi-card-${key}-${index}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDragEnter={() => handleDragEnter(index)}
                      onDragEnd={handleDragEnd}
                      className={`p-2.5 border rounded-lg flex items-center justify-between transition-all duration-150 relative group/kpi-card ${
                        draggedIndex === index 
                          ? "opacity-30 border-dashed border-emerald-500 dark:border-emerald-400 scale-[0.98]" 
                          : isDarkMode 
                          ? "bg-slate-950 border-slate-800 hover:border-slate-700 hover:shadow-md hover:shadow-black/20" 
                          : "bg-white border-slate-150 hover:border-slate-250 hover:shadow-sm hover:shadow-slate-100/50"
                      }`}
                    >
                      {cardContent}
                      {sparklineNode}
                      
                      <div 
                        className="p-1.5 rounded cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors opacity-50 group-hover/kpi-card:opacity-100 shrink-0 ml-1"
                        title="按住并上下拖动以排序指标卡片"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Growth Rate Indicator Card (环比增长率) */}
              <div className={`p-3 border rounded-lg transition-all duration-300 ${
                isDarkMode 
                  ? "bg-slate-950 border-slate-800" 
                  : "bg-white border-slate-150 shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className={`p-1.5 rounded-md shrink-0 ${
                      isDarkMode 
                        ? "bg-slate-900 text-slate-300" 
                        : "bg-slate-50 text-slate-600"
                    }`}>
                      <Percent className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-xs font-bold leading-tight ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                        {viewMode === "daily" ? "日环比增长率" : "月环比增长率"}
                      </h4>
                      <p className="text-[9px] text-slate-400 mt-0.5 truncate">
                        {viewMode === "daily" 
                          ? `对比前一日 (${prevDateStr || "无数据"})` 
                          : `对比前一月 (${prevMonthStr || "无数据"})`}
                      </p>
                    </div>
                  </div>

                  <MiniSparkline
                    data={kpiTimelineSeries.growthTrend}
                    dates={kpiTimelineSeries.shortDates}
                    color={growthRate >= 0 ? "#10b981" : "#f43f5e"}
                    label="招生量波动趋势"
                    unit="人"
                    isDarkMode={isDarkMode}
                  />

                  <div className="text-right shrink-0">
                    <div className={`flex items-center justify-end gap-1 font-bold font-mono ${
                      growthRate > 0 
                        ? (isDarkMode ? "text-emerald-400" : "text-emerald-600")
                        : growthRate < 0
                        ? (isDarkMode ? "text-rose-400" : "text-rose-600")
                        : (isDarkMode ? "text-slate-400" : "text-slate-500")
                    }`}>
                      {growthRate > 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                      ) : growthRate < 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 shrink-0 rotate-180" />
                      ) : (
                        <span className="text-xs shrink-0">─</span>
                      )}
                      <span className="text-sm tracking-tight">{formattedGrowthRate}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium mt-0.5">
                      {viewMode === "daily" ? "昨日" : "上月"}: <span className={`font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{prevPeriodActual}人</span> 
                      {" → "}
                      {viewMode === "daily" ? "今日" : "本月"}: <span className={`font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{totalActual}人</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Major Progress Overview Sub-component (专业进度概览 - 柱状图) */}
              <SidebarMajorProgressOverview
                rows={rows}
                config={config}
                selectedDate={selectedDate}
                viewMode={viewMode}
                isDarkMode={isDarkMode}
                onSelectMajor={handleSelectMajor}
                onOpenTrendModal={(mName) => {
                  handleAnalyzeTrends();
                }}
              />

              {/* Sidebar Student Geography Heatmap Sub-component (全国生源分布热力图与省份下钻) */}
              <SidebarStudentGeographyHeatmap
                rows={rows}
                isDarkMode={isDarkMode}
                onNavigateToTab={(tabId) => setActiveTab(tabId as any)}
                onSelectMajor={handleSelectMajor}
              />

              {/* Major Progress Overview Collapsible Panel (专业进度总览) */}
              <MajorProgressOverview
                rows={rows}
                config={config}
                isDarkMode={isDarkMode}
                selectedDate={selectedDate}
                viewMode={viewMode}
                onSelectMajor={handleSelectMajor}
                onUpdateRows={(newRows) => setRows(newRows)}
                onOpenTrendModal={(mName) => {
                  handleAnalyzeTrends();
                }}
              />

              <MajorTrendChart 
                rows={rows} 
                isDarkMode={isDarkMode} 
                selectedDate={selectedDate} 
                viewMode={viewMode} 
              />

              {/* Major Enrollment Ranking Horizontal Bar Chart */}
              <MajorRankingChart
                rows={rows}
                isDarkMode={isDarkMode}
                selectedDate={selectedDate}
                viewMode={viewMode}
              />

              {/* Major Enrollment Popularity Donut Chart */}
              <MajorPopularityChart
                rows={rows}
                isDarkMode={isDarkMode}
                selectedDate={selectedDate}
                viewMode={viewMode}
              />

              {/* Data Audit (数据检查) Widget */}
              <div className={`p-3 border rounded-xl space-y-3 transition-all duration-300 ${
                isDarkMode 
                  ? "bg-slate-950/70 border-slate-800 shadow-lg shadow-black/20" 
                  : "bg-slate-50 border-slate-150 shadow-sm shadow-slate-200/50"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-indigo-500" />
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${
                      isDarkMode ? "text-slate-300" : "text-slate-700"
                    }`}>
                      数据智能体检 (Data Audit)
                    </span>
                  </div>
                  {isAuditActive && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold font-mono uppercase tracking-wider ${
                      mismatchCount === 0 
                        ? "bg-emerald-500/15 text-emerald-400" 
                        : "bg-rose-500/15 text-rose-400"
                    }`}>
                      {mismatchCount === 0 ? "健康 (Healthy)" : `有异常 (${mismatchCount})`}
                    </span>
                  )}
                </div>

                <p className="text-[10px] leading-relaxed text-slate-400">
                  一键对当前日期 <span className="font-mono font-bold text-slate-300">{selectedDate}</span> 的计划与实际配平度、异常备注完整性进行体检。
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={handleTriggerAudit}
                    disabled={isScanning}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs cursor-pointer active:scale-[0.98] transition-all border ${
                      isScanning
                        ? "bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed"
                        : isAuditActive
                        ? isDarkMode
                          ? "bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300"
                          : "bg-white hover:bg-slate-100 border-slate-200 text-slate-600 shadow-sm"
                        : isDarkMode
                        ? "bg-indigo-950/45 hover:bg-indigo-900/40 border-indigo-800/60 text-indigo-400"
                        : "bg-indigo-50 hover:bg-indigo-100/80 border-indigo-200 text-indigo-700"
                    }`}
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                        <span>扫描核对中...</span>
                      </>
                    ) : isAuditActive ? (
                      <>
                        <X className="w-3.5 h-3.5 text-rose-500" />
                        <span>关闭诊断报告</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5 text-indigo-500" />
                        <span>立即扫描当日数据</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-slate-200 dark:border-slate-800 my-2" />

                {/* Local Storage Backup Sub-Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Save className="w-3 h-3 text-emerald-500" />
                    <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                      灾备与快速恢复 (Local Disaster Backup)
                    </span>
                  </div>

                  <p className="text-[9px] text-slate-400 leading-relaxed">
                    将全量日期数据序列化并存入浏览器缓存。当发生意外清除、误操作、或切换设备时，可一键复原。
                  </p>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleCreateBackup}
                      className={`flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all active:scale-95 ${
                        isDarkMode
                          ? "bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/60 text-emerald-400"
                          : "bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-700"
                      }`}
                    >
                      <Save className="w-3.5 h-3.5 text-emerald-500" />
                      <span>本地全量备份</span>
                    </button>

                    {backupTime && (
                      <button
                        type="button"
                        onClick={handleRestoreBackup}
                        className={`flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all active:scale-95 ${
                          isDarkMode
                            ? "bg-indigo-950/45 hover:bg-indigo-900/40 border border-indigo-800/60 text-indigo-400"
                            : "bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-700"
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                        <span>一键全量恢复</span>
                      </button>
                    )}
                  </div>

                  {backupTime && (
                    <div className={`p-1.5 rounded-lg border flex items-center justify-between gap-2 text-[9px] ${
                      isDarkMode 
                        ? "bg-slate-900/55 border-slate-800 text-slate-400" 
                        : "bg-slate-100/70 border-slate-200 text-slate-500"
                    }`}>
                      <div className="flex items-center gap-1 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span className="truncate">检测到备份: {backupTime}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearBackup}
                        title="清除此备份"
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 p-1 rounded transition-colors shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Audit Results Panel */}
                <AnimatePresence>
                  {isAuditActive && !isScanning && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden space-y-2.5 pt-1.5"
                    >
                      {auditIssues.length === 0 ? (
                        <div className={`p-2.5 rounded-lg border text-[10px] leading-relaxed flex gap-2 items-start ${
                          isDarkMode 
                            ? "bg-emerald-950/30 border-emerald-900/60 text-emerald-400" 
                            : "bg-emerald-50 border-emerald-200 text-emerald-800"
                        }`}>
                          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                          <div>
                            <span className="font-bold block mb-0.5">✨ 数据体检正常</span>
                            未发现任何专业存在计划与实际不匹配或备注缺失的情况。所有专业数据均完美平衡！
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className={`text-[10px] font-bold p-1 rounded ${
                            isDarkMode ? "text-slate-300" : "text-slate-600"
                          }`}>
                            ⚠️ 发现 <span className="text-rose-500 font-mono font-extrabold">{mismatchCount}</span> 个异常行，其中 <span className="text-amber-500 font-mono font-extrabold">{missingNoteCount}</span> 个备注遗漏：
                          </div>

                          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                            {auditIssues.map((item, auditIdx) => {
                              const currentVal = noteInputs[item.id] !== undefined ? noteInputs[item.id] : item.note;
                              const isUnsaved = currentVal !== item.note;

                              return (
                                <div 
                                  key={`audit-issue-${item.id}-${auditIdx}`} 
                                  className={`p-2.5 rounded-lg border space-y-2 text-[10px] transition-all ${
                                    isDarkMode 
                                      ? "bg-slate-900 border-slate-800 hover:border-slate-700" 
                                      : "bg-white border-slate-150 hover:border-slate-300 shadow-sm"
                                  }`}
                                >
                                  {/* Major Name and Badges */}
                                  <div className="flex items-start justify-between gap-1.5">
                                    <span className={`font-bold leading-tight ${
                                      isDarkMode ? "text-slate-200" : "text-slate-800"
                                    }`}>
                                      {item.name}
                                    </span>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                      <span className="bg-rose-500/10 text-rose-500 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                                        不配平 (Diff: {item.diff > 0 ? `+${item.diff}` : item.diff})
                                      </span>
                                      {item.noteMissing && (
                                        <span className="bg-amber-500/10 text-amber-500 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono flex items-center gap-0.5">
                                          <AlertTriangle className="w-2 h-2 shrink-0" />
                                          备注缺失
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Target and Actual details */}
                                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-medium pb-1.5 border-b dark:border-slate-850 border-slate-100">
                                    <span>指标数: <strong className="font-mono text-slate-300">{item.target}</strong>人</span>
                                    <span>实际数: <strong className="font-mono text-slate-300">{item.actual}</strong>人</span>
                                    <span className={item.diff > 0 ? "text-emerald-500" : "text-rose-500"}>
                                      偏差: <strong className="font-mono">{item.diff > 0 ? `+${item.diff}` : item.diff}</strong>人
                                    </span>
                                  </div>

                                  {/* Quick Note Input */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold">
                                      <span>异常备注说明 (Note):</span>
                                      {isUnsaved && (
                                        <span className="text-amber-500 text-[8px] animate-pulse">待保存...</span>
                                      )}
                                    </div>
                                    <div className="flex gap-1.5">
                                      <input
                                        type="text"
                                        placeholder="📝 补充原因，如：抖音渠道延迟进件..."
                                        value={currentVal}
                                        onChange={(e) => setNoteInputs({
                                          ...noteInputs,
                                          [item.id]: e.target.value
                                        })}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleSaveAuditNote(item.id, currentVal);
                                          }
                                        }}
                                        className={`flex-1 px-2 py-1 rounded text-[10px] outline-none border transition-all ${
                                          isDarkMode 
                                            ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500" 
                                            : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white"
                                        }`}
                                      />
                                      <button
                                        onClick={() => handleSaveAuditNote(item.id, currentVal)}
                                        disabled={!isUnsaved}
                                        className={`px-2 py-1 rounded font-bold text-[9px] cursor-pointer transition-all active:scale-95 ${
                                          isUnsaved
                                            ? "bg-indigo-500 text-white hover:bg-indigo-600"
                                            : isDarkMode
                                            ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        }`}
                                      >
                                        保存
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Group 3: Data operations */}
            <div className="space-y-3">
              <div className={`flex items-center uppercase tracking-wider font-bold text-[10px] pb-1.5 border-b ${
                isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-400"
              }`}>
                <Database className="w-3.5 h-3.5 mr-1" />
                招生智能工具箱 (Data Operations)
              </div>

              <button
                onClick={() => setShowSimModal(true)}
                className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded font-bold transition-all cursor-pointer text-xs border ${
                  isDarkMode 
                    ? "text-emerald-400 bg-emerald-950/45 hover:bg-emerald-900/35 border-emerald-800/80" 
                    : "text-emerald-800 bg-emerald-50 hover:bg-emerald-100/90 active:bg-emerald-200 border border-emerald-200/60"
                }`}
                title="通过多层完成率预测生成高拟真模拟招生数"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>智能填充模拟预测数据</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleClearActuals}
                  className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded font-semibold transition-all cursor-pointer text-[11px] border ${
                    isDarkMode 
                      ? "bg-slate-850 border-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-800" 
                      : "text-slate-600 hover:text-amber-800 hover:bg-amber-50/60 border-slate-200"
                  }`}
                  title="仅重置清空各专业的实际招生数列"
                >
                  <Info className="w-3 h-3 text-amber-500 mr-0.5" />
                  <span>清空实际招生</span>
                </button>

                <button
                  onClick={handleClearAll}
                  className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded font-semibold transition-all cursor-pointer text-[11px] border ${
                    isDarkMode 
                      ? "bg-slate-850 border-slate-800 text-slate-300 hover:text-red-400 hover:bg-slate-800" 
                      : "text-slate-600 hover:text-red-700 hover:bg-red-50/60 border-slate-200"
                  }`}
                  title="清空表格内所有已有专业名称"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500 mr-0.5" />
                  <span>全部彻底清空</span>
                </button>
              </div>

              {/* AI Recruitment Summary Generator Button */}
              <button
                onClick={() => setShowSummaryModal(true)}
                className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded font-bold transition-all cursor-pointer text-xs border ${
                  isDarkMode 
                    ? "text-indigo-400 bg-indigo-950/45 hover:bg-indigo-900/35 border-indigo-850" 
                    : "text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100/90 active:bg-indigo-200 border border-indigo-200/60"
                }`}
                title="AI 基于当前选中时间段各专业指标和备注一键生成招生日报文案并复制"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
                <span>生成{viewMode === "daily" ? "今日" : "本月"}招生综述</span>
              </button>

              {/* AI Recruitment Monthly Trend Analysis PDF Preview Button */}
              <button
                onClick={handleAnalyzeTrends}
                className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded font-bold transition-all cursor-pointer text-xs border ${
                  isDarkMode 
                    ? "text-sky-400 bg-sky-950/45 hover:bg-sky-900/35 border-sky-850" 
                    : "text-sky-800 bg-sky-50/80 hover:bg-sky-100/90 active:bg-sky-200 border border-sky-200/60"
                }`}
                title="调用 Gemini API 自动分析本月所有日期的招生时序与效能趋势，生成精美 A4 格式 PDF 总结预览"
              >
                <TrendingUp className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                <span>AI 招生趋势分析 (PDF预览)</span>
              </button>

              {/* Generate Major Summary Report Button */}
              <button
                onClick={() => setShowMajorSummaryModal(true)}
                className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded font-bold transition-all cursor-pointer text-xs border ${
                  isDarkMode 
                    ? "text-emerald-400 bg-emerald-950/45 hover:bg-emerald-900/35 border-emerald-800/80" 
                    : "text-emerald-800 bg-emerald-50 hover:bg-emerald-100/90 active:bg-emerald-200 border border-emerald-200/60"
                }`}
                title="根据当前筛选的日期范围，聚合所有专业在各渠道的计划与实际完成数，展示简洁对比表"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>生成按专业汇总统计表</span>
              </button>

              {/* D3 Force Directed Graph Student Source Button */}
              <button
                onClick={() => {
                  setShowForceGraphModal(true);
                  setShowMobileSidebar(false);
                }}
                className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded font-bold transition-all cursor-pointer text-xs border ${
                  isDarkMode 
                    ? "text-purple-400 bg-purple-950/45 hover:bg-purple-900/35 border-purple-800/80" 
                    : "text-purple-800 bg-purple-50 hover:bg-purple-100/90 active:bg-purple-200 border border-purple-200/60"
                }`}
                title="使用 D3 生成全屏力导向图，以不同颜色代表各专业，展示招生渠道与生源专业之间的映射关联关系"
              >
                <Network className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
                <span>各专业生源构成详情</span>
              </button>
            </div>

          </div>

          {/* Sidebar Footer Keyboard Guide */}
          <div className={`p-3 border-t text-[11px] space-y-2 transition-colors duration-200 ${
            isDarkMode ? "bg-slate-900/65 border-slate-850 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
          }`}>
            <div className={`font-bold flex items-center gap-1 text-[10px] uppercase tracking-wide ${
              isDarkMode ? "text-slate-300" : "text-slate-700"
            }`}>
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              极速键盘流说明
            </div>
            <ul className="space-y-1 text-[10px] pl-1">
              <li className="flex items-start">
                <span className="text-emerald-500 mr-1">•</span>
                <span><kbd className={`px-1 py-0.5 border shadow-2xs font-mono font-bold ${
                  isDarkMode ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-700"
                }`}>Enter</kbd> 自动向下切换</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-1">•</span>
                <span><kbd className={`px-1 py-0.5 border shadow-2xs font-mono font-bold ${
                  isDarkMode ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-700"
                }`}>Tab</kbd> 自动向右切换</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-1">•</span>
                <span>双击渠道名，支持<strong>直接重命名</strong></span>
              </li>
            </ul>
          </div>
        </aside>

        {/* Right Spreadsheet Table Container */}
        <section className={`flex-1 flex flex-col overflow-hidden transition-colors duration-200 ${
          isDarkMode ? "bg-slate-950" : "bg-slate-50/50"
        }`}>
          {/* View Selection Tabs */}
          <div className={`h-12 border-b flex items-center justify-between px-3 md:px-4 shrink-0 transition-colors duration-200 backdrop-blur-sm ${
            isDarkMode ? "border-slate-800/80 bg-slate-900/90" : "border-slate-200/90 bg-white/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
          }`}>
            {/* Tabs List */}
            <div 
              ref={tabsContainerRef}
              className="flex items-center space-x-1.5 overflow-x-auto thin-scrollbar scroll-smooth py-1 flex-1 max-w-full"
            >
              {[
                { id: "table", label: "招生数据明细", shortLabel: "明细", icon: Grid, color: "text-emerald-500", badge: "核心" },
                { id: "comparison", label: "维度对比分析", shortLabel: "对比", icon: BarChart2, color: "text-indigo-500" },
                { id: "funnel", label: "转化漏斗分析", shortLabel: "漏斗", icon: Percent, color: "text-blue-500" },
                { id: "kanban", label: "排班与任务看板", shortLabel: "看板", icon: Trello, color: "text-amber-500" },
                { id: "geography", label: "生源地域分布", shortLabel: "地域", icon: Map, color: "text-teal-500" },
                { id: "faq", label: "咨询话术与FAQ", shortLabel: "话术", icon: MessageSquare, color: "text-purple-500" },
                { id: "poster", label: "简章海报生成", shortLabel: "海报", icon: Megaphone, color: "text-rose-500" },
                { id: "leaderboard", label: "顾问业绩PK榜", shortLabel: "先锋榜", icon: Award, color: "text-amber-600" },
                { id: "roi", label: "推广渠道ROI", shortLabel: "ROI", icon: TrendingUp, color: "text-emerald-600" },
                { id: "insights", label: "招生数据洞察", shortLabel: "洞察", icon: LineChart, color: "text-violet-500" },
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={`tab-btn-${tab.id}`}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 border select-none ${
                      isActive
                        ? isDarkMode
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm"
                          : "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs"
                        : isDarkMode
                        ? "bg-slate-800/40 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800 hover:border-slate-700/60"
                        : "bg-slate-100/60 border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-200/80"
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 ${isActive ? "text-emerald-500" : tab.color} shrink-0`} />
                    <span className="whitespace-nowrap">{tab.label}</span>
                    {tab.badge && (
                      <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-black shrink-0 ${
                        isActive
                          ? isDarkMode ? "bg-emerald-500/30 text-emerald-300" : "bg-emerald-200/70 text-emerald-900"
                          : isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-200 text-slate-600"
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-500 rounded-full"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className={`hidden lg:flex items-center gap-2 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors duration-200 shrink-0 ml-2 ${
              isDarkMode 
                ? "bg-slate-950/80 border-slate-800 text-slate-400" 
                : "bg-slate-100/80 border-slate-200 text-slate-500"
            }`}>
              <Calendar className="w-3 h-3 text-emerald-500" />
              <span>数据源: {viewMode === "daily" ? `2026年招生库 (${selectedDate})` : `2026年招生库 (${selectedDate.substring(0, 7)} 月度累计)`}</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              {activeTab === "table" && (
                <ExcelTable
                  rows={rows}
                  config={config}
                  onRowsChange={handleRowsChange}
                  onConfigChange={handleConfigChange}
                  searchTerm={searchTerm}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  isDarkMode={isDarkMode}
                  onlyShowWithNotes={onlyShowWithNotes}
                  deviationThresholdPct={deviationThresholdPct}
                  onThresholdPctChange={setDeviationThresholdPct}
                  onOpenDeviationModal={() => setShowDeviationModal(true)}
                  onOpenMajorDashboard={handleOpenMajorDashboard}
                />
              )}

              {activeTab === "comparison" && (
                <DataComparison
                  rows={rows}
                  config={config}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  isDarkMode={isDarkMode}
                />
              )}

              {activeTab === "funnel" && (
                <ConversionFunnel
                  rows={rows}
                  config={config}
                  selectedDate={selectedDate}
                  isDarkMode={isDarkMode}
                />
              )}

              {activeTab === "kanban" && (
                <TaskKanban
                  isDarkMode={isDarkMode}
                />
              )}

              {activeTab === "geography" && (
                <StudentGeography
                  rows={rows}
                  isDarkMode={isDarkMode}
                />
              )}

              {activeTab === "faq" && (
                <FAQKnowledgeBase
                  isDarkMode={isDarkMode}
                  onToastTrigger={triggerToast}
                />
              )}

              {activeTab === "poster" && (
                <PosterGenerator
                  rows={rows}
                  isDarkMode={isDarkMode}
                  onToastTrigger={triggerToast}
                />
              )}

              {activeTab === "leaderboard" && (
                <ConsultantLeaderboard
                  rows={rows}
                  config={config}
                  selectedDate={selectedDate}
                  isDarkMode={isDarkMode}
                />
              )}

              {activeTab === "roi" && (
                <ChannelROI
                  rows={rows}
                  config={config}
                  selectedDate={selectedDate}
                  isDarkMode={isDarkMode}
                />
              )}

              {activeTab === "insights" && (
                <DataInsights
                  rows={rows}
                  config={config}
                  selectedDate={selectedDate}
                  isDarkMode={isDarkMode}
                  onSelectMajor={handleSelectMajor}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </section>

      </main>

      {/* Sleek Bottom Dark Footer Bar */}
      <footer className="h-8 bg-slate-800 text-slate-400 px-4 flex items-center justify-between text-[10px] uppercase tracking-widest font-semibold shrink-0">
        <div className="flex items-center space-x-4">
          <span className="flex items-center text-emerald-400 text-[9px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
            CONNECTED TO LOCAL-SECURE DATABASE
          </span>
          <span className="text-slate-600">|</span>
          <span>SESSION STATUS: PERSISTENT</span>
        </div>
        <div className="flex items-center space-x-3 text-[9px]">
          <span>BUILT WITH VITE &amp; TAILWIND</span>
          <span>LOCALE: ZH-CN</span>
          <span>SYS TIME: UTC+8</span>
        </div>
      </footer>

      {/* Simulation Modal Dialog Overlay */}
      <AnimatePresence>
        {showSimModal && (
          <div key="sim-modal-overlay" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              key="sim-modal-panel"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={`rounded shadow-2xl max-w-sm w-full border overflow-hidden transition-colors ${
                isDarkMode ? "bg-slate-900 border-slate-850 text-slate-100" : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              <div className={`px-5 py-4 border-b flex items-center justify-between ${
                isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-100"
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded ${
                    isDarkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                  }`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-xs ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>招生数据仿真模拟测算</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">根据现有的各个专业计划目标进行拟真填充</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSimModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    选择预期目标达成水平 (Range Level)
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSimRate("low")}
                      className={`p-2.5 border rounded flex flex-col items-center justify-center gap-0.5 text-center transition-all cursor-pointer ${
                        simRate === "low"
                          ? (isDarkMode 
                              ? "border-amber-500 bg-amber-500/10 text-amber-400 font-bold" 
                              : "border-amber-500 bg-amber-50 text-amber-800 font-bold")
                          : (isDarkMode 
                              ? "border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-400 hover:text-slate-300" 
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500")
                      }`}
                    >
                      <span className="text-[11px]">偏低水平</span>
                      <span className="text-[9px] opacity-80 font-normal">10% - 40%</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSimRate("typical")}
                      className={`p-2.5 border rounded flex flex-col items-center justify-center gap-0.5 text-center transition-all cursor-pointer ${
                        simRate === "typical"
                          ? (isDarkMode 
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold" 
                              : "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold")
                          : (isDarkMode 
                              ? "border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-400 hover:text-slate-300" 
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500")
                      }`}
                    >
                      <span className="text-[11px]">正常水平</span>
                      <span className="text-[9px] opacity-80 font-normal">30% - 60%</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSimRate("high")}
                      className={`p-2.5 border rounded flex flex-col items-center justify-center gap-0.5 text-center transition-all cursor-pointer ${
                        simRate === "high"
                          ? (isDarkMode 
                              ? "border-indigo-500 bg-indigo-500/10 text-indigo-400 font-bold" 
                              : "border-indigo-500 bg-indigo-50 text-indigo-800 font-bold")
                          : (isDarkMode 
                              ? "border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-400 hover:text-slate-300" 
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500")
                      }`}
                    >
                      <span className="text-[11px]">卓越水平</span>
                      <span className="text-[9px] opacity-80 font-normal">60% - 95%</span>
                    </button>
                  </div>
                </div>

                <div className={`p-3 border rounded text-[10px] space-y-1 ${
                  isDarkMode 
                    ? "bg-slate-950/60 border-slate-850 text-slate-400" 
                    : "bg-slate-50 border-slate-100 text-slate-500"
                }`}>
                  <p className={`font-bold flex items-center gap-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    <Info className="w-3.5 h-3.5 text-slate-400" /> 仿真规则说明:
                  </p>
                  <p>1. 系统根据各专业的招生计划配额 (目标计划) 测算；</p>
                  <p>2. 根据选中完成率随机分配每个渠道的实际招生记录；</p>
                  <p>3. 自动匹配计算出「其他人员」及各项汇总公式，重塑全新报表。</p>
                </div>
              </div>

              <div className={`flex items-center justify-end gap-2 px-5 py-3 border-t ${
                isDarkMode ? "border-slate-850 bg-slate-950" : "border-slate-150 bg-slate-50"
              }`}>
                <button
                  type="button"
                  onClick={() => setShowSimModal(false)}
                  className={`px-3 py-1.5 rounded font-semibold cursor-pointer ${
                    isDarkMode ? "text-slate-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSimulateData}
                  className="flex items-center gap-1 px-3.5 py-1.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded font-bold shadow-sm cursor-pointer transition-colors"
                >
                  <Play className="w-3 h-3 text-emerald-200 fill-emerald-200" />
                  <span>立即启动预测模拟</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clone Modal Dialog Overlay */}
      <AnimatePresence>
        {showCloneModal && (
          <div key="clone-modal-overlay" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              key="clone-modal-panel"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={`rounded shadow-2xl max-w-sm w-full border overflow-hidden ${
                isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              <div className={`px-5 py-4 border-b flex items-center justify-between ${
                isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"
              }`}>
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-emerald-50 dark:bg-emerald-950/40 rounded text-emerald-600 dark:text-emerald-400">
                    <Copy className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs">快速复制/克隆招生数据</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">将 【{selectedDate}】 的专业列表与数据复制到新日期</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCloneModal(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    目标日期 (Target Date)
                  </label>
                  <input
                    type="date"
                    value={cloneTargetDate}
                    onChange={(e) => setCloneTargetDate(e.target.value)}
                    className={`w-full font-bold px-2 py-1.5 border rounded outline-none transition-all text-xs ${
                      isDarkMode 
                        ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" 
                        : "bg-slate-50 text-slate-800 border-slate-200 focus:border-emerald-500"
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    克隆数据策略 (Cloning Strategy)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCloneStrategy("targets")}
                      className={`p-2.5 border rounded flex flex-col items-center justify-center gap-0.5 text-center transition-all cursor-pointer ${
                        cloneStrategy === "targets"
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                          : (isDarkMode ? "border-slate-800 hover:bg-slate-850 text-slate-400" : "border-slate-200 hover:bg-slate-50 text-slate-500")
                      }`}
                    >
                      <span className="text-[11px] font-bold">仅复制专业与计划</span>
                      <span className="text-[9px] opacity-80 font-normal">实际报名数设为0</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCloneStrategy("full")}
                      className={`p-2.5 border rounded flex flex-col items-center justify-center gap-0.5 text-center transition-all cursor-pointer ${
                        cloneStrategy === "full"
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold"
                          : (isDarkMode ? "border-slate-800 hover:bg-slate-850 text-slate-400" : "border-slate-200 hover:bg-slate-50 text-slate-500")
                      }`}
                    >
                      <span className="text-[11px] font-bold">100% 完整复制</span>
                      <span className="text-[9px] opacity-80 font-normal">包含实际招生人数</span>
                    </button>
                  </div>
                </div>

                <div className={`p-3 rounded text-[10px] space-y-1 ${
                  isDarkMode ? "bg-slate-950 text-slate-400" : "bg-slate-50 text-slate-500"
                }`}>
                  <p className="font-bold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                    <Info className="w-3.5 h-3.5 text-slate-400" /> 特别提醒:
                  </p>
                  <p>1. 如果目标日期已经存在专业数据，克隆会将之完全覆盖。</p>
                  <p>2. 克隆成功后，系统会自动为您切换聚焦到该目标日期以进行编辑。</p>
                </div>
              </div>

              <div className={`flex items-center justify-end gap-2 px-5 py-3 border-t ${
                isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"
              }`}>
                <button
                  type="button"
                  onClick={() => setShowCloneModal(false)}
                  className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded font-semibold cursor-pointer text-xs"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => handleCloneDay(selectedDate, cloneTargetDate, cloneStrategy)}
                  className="flex items-center gap-1 px-3.5 py-1.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded font-bold shadow-sm cursor-pointer text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>开始克隆并编辑</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Modal Dialog Overlay */}
      <AnimatePresence>
        {showImportModal && (
          <ExcelImporter
            key="excel-importer-modal"
            onImport={handleImportData}
            config={config}
            selectedDate={selectedDate}
            isDarkMode={isDarkMode}
            onClose={() => setShowImportModal(false)}
            onToast={triggerToast}
          />
        )}
      </AnimatePresence>

        {/* AI Enrollment Summary Report Modal */}
        <EnrollmentSummaryModal
          isOpen={showSummaryModal}
          onClose={() => setShowSummaryModal(false)}
          date={selectedDate}
          rows={rows}
          isDarkMode={isDarkMode}
          viewMode={viewMode}
        />

        {/* Aggregate Major Summary Report Modal */}
        <MajorSummaryModal
          isOpen={showMajorSummaryModal}
          onClose={() => setShowMajorSummaryModal(false)}
          date={selectedDate}
          rows={rows}
          config={config}
          isDarkMode={isDarkMode}
          viewMode={viewMode}
          onToast={triggerToast}
        />

        {/* Dynamic Channel Configuration Modal */}
        <ChannelConfigModal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          config={config}
          onConfigChange={handleConfigChange}
          rows={rows}
          onRowsChange={handleRowsChange}
          isDarkMode={isDarkMode}
          onToast={triggerToast}
        />

        {/* Monthly Trend Analysis and Decision PDF Modal */}
        <TrendAnalysisModal
          isOpen={showTrendModal}
          onClose={() => setShowTrendModal(false)}
          loading={trendLoading}
          content={trendContent}
          date={selectedDate}
          config={config}
          isDarkMode={isDarkMode}
          onToast={triggerToast}
          onReanalyze={handleAnalyzeTrends}
        />

        {/* D3 Force Directed Graph Student Source Modal */}
        <StudentSourceForceGraphModal
          isOpen={showForceGraphModal}
          onClose={() => setShowForceGraphModal(false)}
          rows={rows}
          config={config}
          selectedDate={selectedDate}
          isDarkMode={isDarkMode}
        />

        {/* Enrollment Target/Actual Deviation Notification Modal */}
        <DeviationNotificationModal
          isOpen={showDeviationModal}
          onClose={() => setShowDeviationModal(false)}
          rows={rows}
          selectedDate={selectedDate}
          config={config}
          isDarkMode={isDarkMode}
          thresholdPct={deviationThresholdPct}
          onThresholdPctChange={setDeviationThresholdPct}
          onSelectMajorForFocus={(majorName) => {
            setActiveTab("table");
            setSearchTerm(majorName);
          }}
        />

        {/* Professional Major Level Data Dashboard Modal (专业级别数据仪表盘模态框) */}
        <MajorDetailDashboardModal
          isOpen={showMajorDashboardModal}
          onClose={() => setShowMajorDashboardModal(false)}
          majorName={selectedDashboardMajor}
          rows={rows}
          onRowsChange={handleRowsChange}
          config={config}
          isDarkMode={isDarkMode}
          selectedDate={selectedDate}
          onSelectMajor={(name) => setSelectedDashboardMajor(name)}
          onToast={triggerToast}
        />
    </div>
  );
}
