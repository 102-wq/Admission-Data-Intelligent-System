/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { RowData, TableConfig } from "../types";
import { Trash2, Plus, Calendar, Copy, PlusCircle, MessageSquare, StickyNote, AlertTriangle, ArrowUp, ArrowDown, ArrowUpDown, ChevronDown, ChevronRight, Search, TrendingUp, Filter, X, ChevronLeft, Save, RefreshCw, Bell, Zap, Scale, ShieldCheck, ShieldAlert, CheckCheck, CheckCircle2, FileCheck2, LayoutDashboard, BarChart3, PieChart } from "lucide-react";
import { MAJOR_METADATA } from "../data";
import { motion, AnimatePresence } from "motion/react";

interface EditingCell {
  rowIndex: number;      // index in original rows array
  colIndex: number;      // 0 = name, 1..14 = channel targets/actuals, 15 = other
  rIdx: number;          // index in current processedRows array
  majorName: string;
  channelName?: string;  // e.g. "抖音"
  isTarget?: boolean;    // true = target, false = actual
  value: string;         // active string value being edited
}

interface ExcelTableProps {
  rows: RowData[];
  config: TableConfig;
  onRowsChange: (newRows: RowData[]) => void;
  onConfigChange: (newConfig: TableConfig) => void;
  searchTerm: string;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  viewMode: "daily" | "monthly";
  setViewMode: (mode: "daily" | "monthly") => void;
  isDarkMode?: boolean;
  onlyShowWithNotes?: boolean;
  deviationThresholdPct?: number;
  onThresholdPctChange?: (pct: number) => void;
  onOpenDeviationModal?: () => void;
  onOpenMajorDashboard?: (majorName: string) => void;
}

export default function ExcelTable({
  rows,
  config,
  onRowsChange,
  onConfigChange,
  searchTerm,
  selectedDate,
  setSelectedDate,
  viewMode,
  setViewMode,
  isDarkMode = false,
  onlyShowWithNotes = false,
  deviationThresholdPct = 20,
  onThresholdPctChange,
  onOpenDeviationModal,
  onOpenMajorDashboard,
}: ExcelTableProps) {
  const [activeCell, setActiveCell] = useState<{ rIdx: number; colIndex: number } | null>(null);
  const [quickEditMode, setQuickEditMode] = useState<boolean>(true);
  const [activeCellValue, setActiveCellValue] = useState<string>("");
  const tableRef = useRef<HTMLTableElement>(null);
  const [openNoteRowId, setOpenNoteRowId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState("");

  const [selectedMergeMajors, setSelectedMergeMajors] = useState<string[]>([]);
  const [isMergedExpanded, setIsMergedExpanded] = useState<boolean>(false);
  const [quickFilter, setQuickFilter] = useState<"all" | "underperforming" | "overachieving" | "over_target_spike" | "significant_deviation" | "with_notes" | "imbalanced">("all");
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [selectedSparklineMajor, setSelectedSparklineMajor] = useState<string | null>(null);
  const [compareDate, setCompareDate] = useState<string | null>(null);

  // Over-target spike highlight state (highlight actual > target by > marginPct%)
  const [highlightOverTargetSpikes, setHighlightOverTargetSpikes] = useState<boolean>(true);
  const [overTargetMarginPct, setOverTargetMarginPct] = useState<number>(10);

  // Quick balance verification states for rows
  const [verifiedRowIds, setVerifiedRowIds] = useState<string[]>([]);
  const [activeVerifyAuditRowId, setActiveVerifyAuditRowId] = useState<string | null>(null);

  // Helper to determine whether a row exceeds the target by a significant margin (e.g. > 10%)
  const checkRowOverTargetSpike = (row: RowData, marginPct: number = overTargetMarginPct) => {
    const totalTarget = row.channels.reduce((sum, ch) => sum + ch.target, 0);
    const totalActual = row.channels.reduce((sum, ch) => sum + ch.actual, 0) + row.other;
    if (totalTarget > 0) {
      const excessPct = ((totalActual - totalTarget) / totalTarget) * 100;
      return {
        isSpike: excessPct >= marginPct,
        excessPct,
        diff: totalActual - totalTarget,
        totalTarget,
        totalActual,
      };
    } else if (totalActual > 0) {
      return {
        isSpike: true,
        excessPct: Infinity,
        diff: totalActual,
        totalTarget: 0,
        totalActual,
      };
    }
    return { isSpike: false, excessPct: 0, diff: 0, totalTarget: 0, totalActual: 0 };
  };

  const handleToggleVerifyRow = (rowId: string) => {
    setVerifiedRowIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
    );
  };

  const handleVerifyAllRows = () => {
    const validCurrentIds = currentRows.map((r) => r.id);
    if (validCurrentIds.length > 0 && verifiedRowIds.length >= validCurrentIds.length) {
      setVerifiedRowIds([]);
    } else {
      setVerifiedRowIds(validCurrentIds);
    }
  };

  const handleClearAllVerified = () => {
    setVerifiedRowIds([]);
  };

  // Helper to calculate or retrieve matching metrics on the compare date for comparison overlays
  const getCompareValue = (row: RowData, chIdx?: number, type: 'target' | 'actual' | 'other' | 'totalTarget' | 'totalActual' | 'diff' = 'target') => {
    if (!compareDate) return 0;

    const compareDayRows = rows.filter((r) => r.date === compareDate);

    if ((row as any).isMergedGroup) {
      const targetRows = compareDayRows.filter((r) => selectedMergeMajors.includes(r.name));
      if (type === 'other') {
        return targetRows.reduce((sum, r) => sum + r.other, 0);
      }
      if (type === 'target' && chIdx !== undefined) {
        let sum = 0;
        targetRows.forEach((tr) => {
          if (chIdx < tr.channels.length) sum += tr.channels[chIdx].target;
        });
        return sum;
      }
      if (type === 'actual' && chIdx !== undefined) {
        let sum = 0;
        targetRows.forEach((tr) => {
          if (chIdx < tr.channels.length) sum += tr.channels[chIdx].actual;
        });
        return sum;
      }
      if (type === 'totalTarget') {
        let sum = 0;
        targetRows.forEach((tr) => {
          sum += tr.channels.reduce((s, c) => s + c.target, 0);
        });
        return sum;
      }
      if (type === 'totalActual') {
        let sum = 0;
        targetRows.forEach((tr) => {
          sum += tr.channels.reduce((s, c) => s + c.actual, 0) + tr.other;
        });
        return sum;
      }
      if (type === 'diff') {
        const t = getCompareValue(row, undefined, 'totalTarget');
        const a = getCompareValue(row, undefined, 'totalActual');
        return a - t;
      }
      return 0;
    }

    const compareRow = compareDayRows.find((r) => r.name === row.name);
    if (!compareRow) return 0;

    if (type === 'other') {
      return compareRow.other;
    }
    if (type === 'target' && chIdx !== undefined) {
      return compareRow.channels[chIdx]?.target ?? 0;
    }
    if (type === 'actual' && chIdx !== undefined) {
      return compareRow.channels[chIdx]?.actual ?? 0;
    }
    if (type === 'totalTarget') {
      return compareRow.channels.reduce((sum, c) => sum + c.target, 0);
    }
    if (type === 'totalActual') {
      return compareRow.channels.reduce((sum, c) => sum + c.actual, 0) + compareRow.other;
    }
    if (type === 'diff') {
      const t = getCompareValue(row, undefined, 'totalTarget');
      const a = getCompareValue(row, undefined, 'totalActual');
      return a - t;
    }
    return 0;
  };

  // Determines background highlighting for significant differences between current and comparison date values
  const getComparisonHighlightClass = (primaryVal: number, compareVal: number) => {
    if (!compareDate) return "";
    const diffVal = primaryVal - compareVal;
    if (diffVal === 0) return "";

    const absDiff = Math.abs(diffVal);
    const maxVal = Math.max(primaryVal, compareVal);
    const relativeDiff = maxVal > 0 ? absDiff / maxVal : 0;

    // Trigger highlight when absolute difference is >= 2 AND relative difference is >= 20%
    const isLargeDiff = absDiff >= 2 || (absDiff >= 1 && relativeDiff >= 0.2);

    if (isLargeDiff) {
      if (diffVal > 0) {
        // Significantly higher (enrollment target or actual increased): soft teal/emerald styling
        return isDarkMode 
          ? "bg-teal-950/40 text-teal-350 ring-1 ring-teal-500/35 font-bold" 
          : "bg-teal-50 text-teal-800 ring-1 ring-teal-300/60 font-bold shadow-3xs";
      } else {
        // Significantly lower (enrollment target or actual decreased): soft rose/red styling
        return isDarkMode 
          ? "bg-rose-950/40 text-rose-350 ring-1 ring-rose-500/35 font-bold" 
          : "bg-rose-50 text-rose-800 ring-1 ring-rose-300/60 font-bold shadow-3xs";
      }
    }

    return "";
  };

  // Formula Calculations for each row (defined early so filters can use it)
  const getRowCalculations = (row: RowData) => {
    const totalTarget = row.channels.reduce((sum, ch) => sum + ch.target, 0);
    const totalActual = row.channels.reduce((sum, ch) => sum + ch.actual, 0) + row.other;
    const diff = totalActual - totalTarget;
    return { totalTarget, totalActual, diff };
  };

  const handleToggleMerge = (name: string) => {
    setSelectedMergeMajors((prev) => {
      if (prev.includes(name)) {
        return prev.filter((n) => n !== name);
      } else {
        return [...prev, name];
      }
    });
  };

  const handleClearMerge = () => {
    setSelectedMergeMajors([]);
    setIsMergedExpanded(false);
  };

  React.useEffect(() => {
    setSelectedMergeMajors([]);
    setIsMergedExpanded(false);
    setQuickFilter("all");
    setCompareDate(null);
    setVerifiedRowIds([]);
    setActiveVerifyAuditRowId(null);
  }, [selectedDate, viewMode]);

  const handleNoteSave = (rowIndex: number, noteVal: string) => {
    const updatedRows = [...rows];
    if (updatedRows[rowIndex]) {
      updatedRows[rowIndex].note = noteVal;
      onRowsChange(updatedRows);
    }
  };

  // Find the nearest date with any data to use as a template
  const findNearestDateRows = () => {
    const uniqueDates = Array.from(new Set(rows.map((r) => r.date))).sort();
    if (uniqueDates.length === 0) return [];
    // Find latest date with records
    const latestDate = uniqueDates[uniqueDates.length - 1];
    return rows.filter((r) => r.date === latestDate);
  };

  // Clone targets and names from previous day, setting actual values to 0
  const handleCopyFromPrevious = () => {
    const templateRows = findNearestDateRows();
    if (templateRows.length === 0) {
      handleCreateBlankTable();
      return;
    }
    const newRowsForSelectedDate = templateRows.map((r, idx) => ({
      ...r,
      id: `row-${selectedDate}-${idx + 1}`,
      date: selectedDate,
      // Retain targets, zero out actual completions and other
      channels: r.channels.map((ch) => ({ target: ch.target, actual: 0 })),
      other: 0,
      seq: idx + 1,
      note: ""
    }));
    onRowsChange([...rows, ...newRowsForSelectedDate]);
  };

  // Create an entirely blank table structure for the active date
  const handleCreateBlankTable = () => {
    const template = findNearestDateRows();
    const defaultNames = template.length > 0
      ? template.map((t) => t.name)
      : [
          "给排水专业",
          "发输电专业",
          "供配电专业",
          "环保专业",
          "暖通专业",
          "岩土专业",
          "电气基础",
          "环保基础",
          "岩土基础",
          "公共基础"
        ];

    const newRowsForSelectedDate = defaultNames.map((name, idx) => ({
      id: `row-${selectedDate}-${idx + 1}`,
      seq: idx + 1,
      name,
      date: selectedDate,
      channels: Array.from({ length: config.channels.length }, () => ({ target: 0, actual: 0 })),
      other: 0,
      note: ""
    }));
    onRowsChange([...rows, ...newRowsForSelectedDate]);
  };

  // Compute aggregated rows for the active month (e.g., "2026-06")
  const monthlyRows = React.useMemo(() => {
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
          other: 0,
          note: ""
        };
      }
      const existing = grouped[row.name];
      existing.other += row.other;
      if (row.note) {
        existing.note = existing.note ? `${existing.note}; ${row.note}` : row.note;
      }
      row.channels.forEach((ch, chIdx) => {
        if (chIdx < existing.channels.length) {
          existing.channels[chIdx].target += ch.target;
          existing.channels[chIdx].actual += ch.actual;
        }
      });
    });

    return Object.values(grouped);
  }, [rows, selectedDate]);

  // Choose the rows to view based on mode
  const currentRows = viewMode === "daily"
    ? rows.filter((r) => r.date === selectedDate)
    : monthlyRows;

  const activeSparklineMajor = selectedSparklineMajor || (currentRows.filter(r => !r.isMergedGroup && r.name && !r.name.includes("同类专业合并组"))[0]?.name || null);

  // Pre-calculate counts of each category based on current search terms
  const quickFilterCounts = React.useMemo(() => {
    let allCount = 0;
    let underperformingCount = 0;
    let overachievingCount = 0;
    let overTargetSpikeCount = 0;
    let significantDeviationCount = 0;
    let withNotesCount = 0;
    let imbalancedCount = 0;
    let verifiedCount = 0;
    let verifiedImbalancedCount = 0;

    currentRows.forEach((row) => {
      const cleanSearchTerm = searchTerm.trim().toLowerCase();
      let matchesSearch = true;
      if (cleanSearchTerm) {
        const nameMatches = row.name.toLowerCase().includes(cleanSearchTerm);
        const meta = MAJOR_METADATA[row.name];
        const descMatches = meta ? meta.description.toLowerCase().includes(cleanSearchTerm) : false;
        const kwMatches = meta ? meta.keywords.some(kw => kw.toLowerCase().includes(cleanSearchTerm)) : false;
        matchesSearch = nameMatches || descMatches || kwMatches;
      }
      const matchesNote = !onlyShowWithNotes || (row.note && row.note.trim().length > 0);
      
      if (matchesSearch && matchesNote) {
        allCount++;
        const { totalTarget, totalActual } = getRowCalculations(row);
        if (totalActual < totalTarget && totalTarget > 0) {
          underperformingCount++;
        }
        if (totalActual > totalTarget) {
          overachievingCount++;
        }
        if (totalActual !== totalTarget) {
          imbalancedCount++;
        }

        const isRowVer = verifiedRowIds.includes(row.id);
        if (isRowVer) {
          verifiedCount++;
          if (totalActual !== totalTarget) {
            verifiedImbalancedCount++;
          }
        }

        // Check over-target spike (actual exceeds target by >= overTargetMarginPct%, default 10%)
        const spikeInfo = checkRowOverTargetSpike(row, overTargetMarginPct);
        if (spikeInfo.isSpike) {
          overTargetSpikeCount++;
        }

        // Check significant deviation (>= deviationThresholdPct%)
        if (totalTarget > 0) {
          const devPct = Math.abs((totalActual - totalTarget) / totalTarget) * 100;
          if (devPct >= deviationThresholdPct) {
            significantDeviationCount++;
          }
        } else if (totalActual > 0) {
          significantDeviationCount++;
        }

        if (row.note && row.note.trim().length > 0) {
          withNotesCount++;
        }
      }
    });

    return {
      all: allCount,
      underperforming: underperformingCount,
      overachieving: overachievingCount,
      overTargetSpikes: overTargetSpikeCount,
      significantDeviation: significantDeviationCount,
      withNotes: withNotesCount,
      imbalanced: imbalancedCount,
      verified: verifiedCount,
      verifiedImbalanced: verifiedImbalancedCount,
    };
  }, [currentRows, searchTerm, onlyShowWithNotes, deviationThresholdPct, overTargetMarginPct, verifiedRowIds]);

  // Filter rows based on search term, note check, and quick filters
  const filteredRows = currentRows.filter((row) => {
    const cleanSearchTerm = searchTerm.trim().toLowerCase();
    let matchesSearch = true;
    if (cleanSearchTerm) {
      const nameMatches = row.name.toLowerCase().includes(cleanSearchTerm);
      const meta = MAJOR_METADATA[row.name];
      const descMatches = meta ? meta.description.toLowerCase().includes(cleanSearchTerm) : false;
      const kwMatches = meta ? meta.keywords.some(kw => kw.toLowerCase().includes(cleanSearchTerm)) : false;
      matchesSearch = nameMatches || descMatches || kwMatches;
    }
    const matchesNote = !onlyShowWithNotes || (row.note && row.note.trim().length > 0);
    
    if (!matchesSearch || !matchesNote) return false;

    // Apply quick filters
    if (quickFilter !== "all") {
      const { totalTarget, totalActual } = getRowCalculations(row);
      if (quickFilter === "underperforming") {
        return totalActual < totalTarget && totalTarget > 0;
      }
      if (quickFilter === "overachieving") {
        return totalActual > totalTarget;
      }
      if (quickFilter === "over_target_spike") {
        const spikeInfo = checkRowOverTargetSpike(row, overTargetMarginPct);
        return spikeInfo.isSpike;
      }
      if (quickFilter === "imbalanced") {
        return totalActual !== totalTarget;
      }
      if (quickFilter === "significant_deviation") {
        if (totalTarget > 0) {
          const devPct = Math.abs((totalActual - totalTarget) / totalTarget) * 100;
          return devPct >= deviationThresholdPct;
        } else {
          return totalActual > 0;
        }
      }
      if (quickFilter === "with_notes") {
        return !!(row.note && row.note.trim().length > 0);
      }
    }

    return true;
  });

  // Sort states
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc" | null;
  }>({ key: "", direction: null });

  // Reset sorting state if selected date or view mode changes
  React.useEffect(() => {
    setSortConfig({ key: "", direction: null });
  }, [selectedDate, viewMode]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") {
          return { key, direction: "desc" };
        } else if (prev.direction === "desc") {
          return { key: "", direction: null };
        }
      }
      return { key, direction: "asc" };
    });
  };

  const renderSortIcon = (key: string) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? (
        <ArrowUp className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0 font-bold stroke-[2.5]" />
      ) : (
        <ArrowDown className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0 font-bold stroke-[2.5]" />
      );
    }
    return (
      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover/sort:opacity-100 transition-opacity shrink-0" />
    );
  };

  const sortedRows = React.useMemo(() => {
    const cleanSearchTerm = searchTerm.trim().toLowerCase();

    // Helper to check if row matches via metadata description or keywords
    const getMatchPriority = (row: RowData) => {
      if (!cleanSearchTerm) return 0;
      const meta = MAJOR_METADATA[row.name];
      if (!meta) return 0;
      const descMatches = meta.description.toLowerCase().includes(cleanSearchTerm);
      const kwMatches = meta.keywords.some(kw => kw.toLowerCase().includes(cleanSearchTerm));
      // Prioritize rows that matched description/keywords
      if (descMatches || kwMatches) {
        return 1;
      }
      return 0;
    };

    let baseList = [...filteredRows];

    if (sortConfig.key && sortConfig.direction) {
      const { key, direction } = sortConfig;
      const isAsc = direction === "asc";

      baseList.sort((a, b) => {
        // If searching, keep pinned metadata matches at the top regardless of current column sort
        if (cleanSearchTerm) {
          const pA = getMatchPriority(a);
          const pB = getMatchPriority(b);
          if (pA !== pB) {
            return pB - pA;
          }
        }

        let valA: any = 0;
        let valB: any = 0;

        if (key === "id") {
          valA = a.seq;
          valB = b.seq;
        } else if (key === "name") {
          valA = a.name || "";
          valB = b.name || "";
        } else if (key === "other") {
          valA = a.other;
          valB = b.other;
        } else if (key === "total_target") {
          valA = a.channels.reduce((sum, ch) => sum + ch.target, 0);
          valB = b.channels.reduce((sum, ch) => sum + ch.target, 0);
        } else if (key === "total_actual") {
          valA = a.channels.reduce((sum, ch) => sum + ch.actual, 0) + a.other;
          valB = b.channels.reduce((sum, ch) => sum + ch.actual, 0) + b.other;
        } else if (key === "diff") {
          const targetA = a.channels.reduce((sum, ch) => sum + ch.target, 0);
          const actualA = a.channels.reduce((sum, ch) => sum + ch.actual, 0) + a.other;
          const targetB = b.channels.reduce((sum, ch) => sum + ch.target, 0);
          const actualB = b.channels.reduce((sum, ch) => sum + ch.actual, 0) + b.other;
          valA = actualA - targetA;
          valB = actualB - targetB;
        } else if (key.startsWith("channel_target_")) {
          const chIdx = parseInt(key.replace("channel_target_", ""), 10);
          valA = a.channels[chIdx]?.target || 0;
          valB = b.channels[chIdx]?.target || 0;
        } else if (key.startsWith("channel_actual_")) {
          const chIdx = parseInt(key.replace("channel_actual_", ""), 10);
          valA = a.channels[chIdx]?.actual || 0;
          valB = b.channels[chIdx]?.actual || 0;
        } else if (key === "note") {
          valA = a.note || "";
          valB = b.note || "";
        }

        if (typeof valA === "string") {
          return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
          return isAsc ? valA - valB : valB - valA;
        }
      });
    } else {
      // If no column sort is active, sort by match priority
      if (cleanSearchTerm) {
        baseList.sort((a, b) => {
          const pA = getMatchPriority(a);
          const pB = getMatchPriority(b);
          return pB - pA;
        });
      }
    }

    return baseList;
  }, [filteredRows, sortConfig, searchTerm]);

  const processedRows = React.useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase();
    const checkMetaMatch = (rowName: string) => {
      if (!cleanSearch) return false;
      const meta = MAJOR_METADATA[rowName];
      if (!meta) return false;
      const descMatches = meta.description.toLowerCase().includes(cleanSearch);
      const kwMatches = meta.keywords.some(kw => kw.toLowerCase().includes(cleanSearch));
      return descMatches || kwMatches;
    };

    if (selectedMergeMajors.length < 2) {
      return sortedRows.map(r => ({
        ...r,
        isMergedGroup: false,
        isMergedChild: false,
        isMetaMatched: checkMetaMatch(r.name)
      }));
    }

    const mergeTargetRows = sortedRows.filter((r) => selectedMergeMajors.includes(r.name));
    if (mergeTargetRows.length < 2) {
      return sortedRows.map(r => ({
        ...r,
        isMergedGroup: false,
        isMergedChild: false,
        isMetaMatched: checkMetaMatch(r.name)
      }));
    }

    // Prepare the aggregated row
    const firstRow = mergeTargetRows[0];
    const mergedRow: RowData & { isMergedGroup: boolean; isMergedChild: boolean; isMetaMatched: boolean } = {
      id: `merged-group-row`,
      seq: firstRow.seq,
      name: `🏫 [同类专业合并组] (${selectedMergeMajors.length}个专业)`,
      date: firstRow.date,
      channels: Array.from({ length: config.channels.length }, (_, chIdx) => {
        let targetSum = 0;
        let actualSum = 0;
        mergeTargetRows.forEach((r) => {
          if (chIdx < r.channels.length) {
            targetSum += r.channels[chIdx].target;
            actualSum += r.channels[chIdx].actual;
          }
        });
        return { target: targetSum, actual: actualSum };
      }),
      other: mergeTargetRows.reduce((sum, r) => sum + r.other, 0),
      note: mergeTargetRows
        .map((r) => r.note)
        .filter(Boolean)
        .join("; "),
      isMergedGroup: true,
      isMergedChild: false,
      isMetaMatched: false
    };

    const result: (RowData & { isMergedGroup: boolean; isMergedChild: boolean; isMetaMatched: boolean })[] = [];
    let mergedRowInserted = false;

    sortedRows.forEach((r) => {
      if (selectedMergeMajors.includes(r.name)) {
        if (!mergedRowInserted) {
          result.push(mergedRow);
          mergedRowInserted = true;
        }
        if (isMergedExpanded) {
          result.push({
            ...r,
            isMergedGroup: false,
            isMergedChild: true,
            isMetaMatched: checkMetaMatch(r.name)
          });
        }
      } else {
        result.push({
          ...r,
          isMergedGroup: false,
          isMergedChild: false,
          isMetaMatched: checkMetaMatch(r.name)
        });
      }
    });

    return result;
  }, [sortedRows, selectedMergeMajors, isMergedExpanded, searchTerm]);

  const saveActiveCellValue = (rIdxVal: number, colIdxVal: number, valueStr: string) => {
    const row = processedRows[rIdxVal];
    if (!row || row.isMergedGroup) return;
    const originalIndex = rows.findIndex((origRow) => origRow.id === row.id);
    if (originalIndex === -1) return;
    handleCellChange(originalIndex, colIdxVal, valueStr);
  };

  const selectCell = (rIdxVal: number, colIdxVal: number) => {
    // Save current active cell value first
    if (activeCell) {
      saveActiveCellValue(activeCell.rIdx, activeCell.colIndex, activeCellValue);
    }

    const nextRow = processedRows[rIdxVal];
    if (!nextRow) return;

    let initialValue = "";
    if (colIdxVal === 0) {
      initialValue = nextRow.name;
    } else if (colIdxVal >= 1 && colIdxVal <= 14) {
      const chIdx = Math.floor((colIdxVal - 1) / 2);
      const isTarget = (colIdxVal - 1) % 2 === 0;
      const ch = nextRow.channels[chIdx] || { target: 0, actual: 0 };
      const valNum = isTarget ? ch.target : ch.actual;
      initialValue = valNum === 0 ? "" : valNum.toString();
    } else if (colIdxVal === 15) {
      initialValue = nextRow.other === 0 ? "" : nextRow.other.toString();
    }

    setActiveCell({ rIdx: rIdxVal, colIndex: colIdxVal });
    setActiveCellValue(initialValue);
  };

  const updateActiveCellValueInState = (newValStr: string) => {
    setActiveCellValue(newValStr);
    // Auto-commit in real-time to state
    if (activeCell) {
      saveActiveCellValue(activeCell.rIdx, activeCell.colIndex, newValStr);
    }
  };

  const getActiveCellClass = (rIdxVal: number, colIdxVal: number) => {
    const isActive = activeCell && activeCell.rIdx === rIdxVal && activeCell.colIndex === colIdxVal;
    if (!isActive) return "";
    return "outline outline-2 outline-emerald-500 outline-offset-[-2px] z-30 relative ring-4 ring-emerald-500/15 bg-emerald-500/5 dark:bg-emerald-500/10";
  };

  useEffect(() => {
    if (!activeCell || !quickEditMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElem = document.activeElement;
      if (activeElem && (activeElem.tagName === "INPUT" || activeElem.tagName === "TEXTAREA" || activeElem.hasAttribute("contenteditable"))) {
        if (activeElem.id !== "quick-edit-keypad-input") {
          return;
        }
      }

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab", "Enter", "Escape"].includes(e.key)) {
        e.preventDefault();
      } else {
        if (/^[0-9]$/.test(e.key)) {
          updateActiveCellValueInState(activeCellValue + e.key);
          return;
        } else if (e.key === "Backspace") {
          updateActiveCellValueInState(activeCellValue.slice(0, -1));
          return;
        } else {
          return;
        }
      }

      let { rIdx: currentR, colIndex: currentCol } = activeCell;
      const maxRows = processedRows.length;
      const editableCols = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
      const currentColIdx = editableCols.indexOf(currentCol);

      let nextR = currentR;
      let nextColIdx = currentColIdx;

      if (e.key === "ArrowUp") {
        if (currentR > 0) nextR = currentR - 1;
      } else if (e.key === "ArrowDown") {
        if (currentR < maxRows - 1) nextR = currentR + 1;
      } else if (e.key === "ArrowLeft") {
        if (currentColIdx > 0) nextColIdx = currentColIdx - 1;
      } else if (e.key === "ArrowRight") {
        if (currentColIdx < editableCols.length - 1) nextColIdx = currentColIdx + 1;
      } else if (e.key === "Tab") {
        if (e.shiftKey) {
          if (currentColIdx > 0) {
            nextColIdx = currentColIdx - 1;
          } else if (currentR > 0) {
            nextR = currentR - 1;
            nextColIdx = editableCols.length - 1;
          }
        } else {
          if (currentColIdx < editableCols.length - 1) {
            nextColIdx = currentColIdx + 1;
          } else if (currentR < maxRows - 1) {
            nextR = currentR + 1;
            nextColIdx = 0;
          }
        }
      } else if (e.key === "Enter") {
        if (currentR < maxRows - 1) {
          nextR = currentR + 1;
        } else {
          saveActiveCellValue(currentR, currentCol, activeCellValue);
          setActiveCell(null);
          return;
        }
      } else if (e.key === "Escape") {
        setActiveCell(null);
        return;
      }

      let nextRow = processedRows[nextR];
      while (nextRow && nextRow.isMergedGroup) {
        if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
          nextR--;
        } else {
          nextR++;
        }
        nextRow = processedRows[nextR];
      }

      if (nextR >= 0 && nextR < maxRows && nextColIdx >= 0 && nextColIdx < editableCols.length) {
        selectCell(nextR, editableCols[nextColIdx]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeCell, activeCellValue, quickEditMode, processedRows]);

  const handleNavigateCell = (direction: "prev" | "next") => {
    if (!editingCell) return;

    // Save current cell value
    handleCellChange(editingCell.rowIndex, editingCell.colIndex, editingCell.value);

    const editableCols = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const currentColIdx = editableCols.indexOf(editingCell.colIndex);

    // Filter processedRows to find non-mergedGroup rows
    const editableRows = processedRows.filter(r => !r.isMergedGroup);
    
    // Find index of current editing row in editableRows
    const currentRowIndexInEditable = editableRows.findIndex(r => {
      const origIdx = rows.findIndex(orig => orig.id === r.id);
      return origIdx === editingCell.rowIndex;
    });

    if (currentRowIndexInEditable === -1) return;

    let nextColIdx = currentColIdx;
    let nextRowIndexInEditable = currentRowIndexInEditable;

    if (direction === "next") {
      if (currentColIdx < editableCols.length - 1) {
        nextColIdx = currentColIdx + 1;
      } else {
        if (currentRowIndexInEditable < editableRows.length - 1) {
          nextRowIndexInEditable = currentRowIndexInEditable + 1;
          nextColIdx = 0;
        } else {
          nextRowIndexInEditable = 0;
          nextColIdx = 0;
        }
      }
    } else {
      if (currentColIdx > 0) {
        nextColIdx = currentColIdx - 1;
      } else {
        if (currentRowIndexInEditable > 0) {
          nextRowIndexInEditable = currentRowIndexInEditable - 1;
          nextColIdx = editableCols.length - 1;
        } else {
          nextRowIndexInEditable = editableRows.length - 1;
          nextColIdx = editableCols.length - 1;
        }
      }
    }

    const nextRow = editableRows[nextRowIndexInEditable];
    const nextCol = editableCols[nextColIdx];
    
    const originalRowIndex = rows.findIndex(r => r.id === nextRow.id);
    if (originalRowIndex === -1) return;

    let nextValue = "";
    if (nextCol === 0) {
      nextValue = nextRow.name;
    } else if (nextCol >= 1 && nextCol <= 14) {
      const chIdx = Math.floor((nextCol - 1) / 2);
      const isTarget = (nextCol - 1) % 2 === 0;
      const ch = nextRow.channels[chIdx] || { target: 0, actual: 0 };
      const valNum = isTarget ? ch.target : ch.actual;
      nextValue = valNum === 0 ? "" : valNum.toString();
    } else if (nextCol === 15) {
      nextValue = nextRow.other === 0 ? "" : nextRow.other.toString();
    }

    let channelName = undefined;
    let isTarget = undefined;
    if (nextCol >= 1 && nextCol <= 14) {
      const chIdx = Math.floor((nextCol - 1) / 2);
      channelName = config.channels[chIdx];
      isTarget = (nextCol - 1) % 2 === 0;
    } else if (nextCol === 15) {
      channelName = "其他自主咨询";
    }

    setEditingCell({
      rowIndex: originalRowIndex,
      colIndex: nextCol,
      rIdx: nextRowIndexInEditable,
      majorName: nextRow.name,
      channelName,
      isTarget,
      value: nextValue
    });
  };

  // Helper to update a single cell value
  const handleCellChange = (rowIndex: number, colIndex: number, val: string) => {
    if (viewMode === "monthly") return; // Read-only aggregate mode

    const updatedRows = [...rows];
    const targetRow = updatedRows[rowIndex];

    if (!targetRow) return;

    if (colIndex === 0) {
      // Major Name
      targetRow.name = val;
    } else if (colIndex >= 1 && colIndex <= 14) {
      // Channel targets and actuals
      const chIdx = Math.floor((colIndex - 1) / 2);
      const isTarget = (colIndex - 1) % 2 === 0;
      const numVal = val === "" ? 0 : Math.max(0, parseInt(val, 10) || 0);

      if (isTarget) {
        targetRow.channels[chIdx].target = numVal;
      } else {
        targetRow.channels[chIdx].actual = numVal;
      }
    } else if (colIndex === 15) {
      // Other Personnel
      const numVal = val === "" ? 0 : Math.max(0, parseInt(val, 10) || 0);
      targetRow.other = numVal;
    }

    onRowsChange(updatedRows);
  };

  // Keyboard navigation for Excel feel
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    r: number,
    c: number
  ) => {
    let nextR = r;
    let nextC = c;

    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        nextR = Math.max(0, r - 1);
      } else {
        nextR = Math.min(sortedRows.length - 1, r + 1);
      }
      focusCell(nextR, nextC);
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        if (c > 0) {
          nextC = c - 1;
        } else if (r > 0) {
          nextR = r - 1;
          nextC = 15;
        }
      } else {
        if (c < 15) {
          nextC = c + 1;
        } else if (r < sortedRows.length - 1) {
          nextR = r + 1;
          nextC = 0;
        }
      }
      focusCell(nextR, nextC);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      nextR = Math.max(0, r - 1);
      focusCell(nextR, nextC);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      nextR = Math.min(sortedRows.length - 1, r + 1);
      focusCell(nextR, nextC);
    }
  };

  const focusCell = (r: number, c: number) => {
    setActiveCell({ rIdx: r, colIndex: c });
    setTimeout(() => {
      const input = document.getElementById(`cell-${r}-${c}`) as HTMLInputElement | null;
      if (input) {
        input.focus();
        input.select();
      }
    }, 10);
  };

  // Delete a row from database
  const handleDeleteRow = (indexInAllRows: number) => {
    if (viewMode === "monthly") return; // Disabled in monthly mode

    const deletedRow = rows[indexInAllRows];
    if (!deletedRow) return;

    const updated = rows.filter((_, idx) => idx !== indexInAllRows);
    
    // Resequence indices for rows of the deleted row's date
    const targetDate = deletedRow.date;
    let seqCounter = 1;
    const resequenced = updated.map((r) => {
      if (r.date === targetDate) {
        return { ...r, seq: seqCounter++ };
      }
      return r;
    });

    onRowsChange(resequenced);
  };

  // Add a new row to active day
  const handleAddRow = () => {
    if (viewMode === "monthly") return; // Disabled in monthly mode

    const dayRows = rows.filter((r) => r.date === selectedDate);
    const newRow: RowData = {
      id: `row-${Date.now()}`,
      seq: dayRows.length + 1,
      name: "新设专业基础",
      date: selectedDate,
      channels: Array.from({ length: config.channels.length }, () => ({ target: 0, actual: 0 })),
      other: 0,
      note: ""
    };
    onRowsChange([...rows, newRow]);
    setTimeout(() => {
      focusCell(dayRows.length, 0);
    }, 50);
  };

  // Rename channel helper
  const handleChannelRename = (chIdx: number, newName: string) => {
    const updatedChannels = [...config.channels];
    updatedChannels[chIdx] = newName || `渠道 ${chIdx + 1}`;
    onConfigChange({
      ...config,
      channels: updatedChannels
    });
  };



  // Dynamic Completed class for cells in a row
  const getChannelCellClass = (row: RowData, chIdx: number, isTarget: boolean) => {
    const ch = row.channels[chIdx];
    const isCompleted = ch.actual >= ch.target && ch.target > 0;

    // Check row-level deviation for the major
    const { totalTarget, totalActual } = getRowCalculations(row);
    const rowDeviationRate = totalTarget > 0 ? (totalActual - totalTarget) / totalTarget : (totalActual > 0 ? Infinity : 0);
    const isDeviatingMoreThan20 = Math.abs(rowDeviationRate) > 0.2;

    if (isCompleted) {
      return isDarkMode 
        ? "bg-emerald-950/80 text-emerald-300 font-bold border-r border-slate-800" 
        : "bg-emerald-150/90 text-emerald-800 font-bold";
    }

    if (isDeviatingMoreThan20 && !(row as any).isMergedGroup) {
      if (rowDeviationRate > 0.2) {
        return isDarkMode
          ? (isTarget ? "bg-teal-950/40 text-teal-300 border-r border-slate-800" : "bg-teal-900/35 text-teal-200 border-r border-slate-800")
          : (isTarget ? "bg-teal-50 text-teal-800" : "bg-teal-50/70 text-teal-700");
      } else {
        return isDarkMode
          ? (isTarget ? "bg-rose-950/40 text-rose-300 border-r border-slate-800" : "bg-rose-900/35 text-rose-200 border-r border-slate-800")
          : (isTarget ? "bg-rose-50 text-rose-800" : "bg-rose-50/70 text-rose-700");
      }
    }

    if (isTarget) {
      return isDarkMode 
        ? "bg-slate-900 text-slate-450 font-medium border-r border-slate-800" 
        : "bg-slate-50 text-slate-700 font-medium";
    }
    return isDarkMode 
      ? "bg-slate-950 text-slate-200 border-r border-slate-800" 
      : "bg-white text-slate-800";
  };

  // Bottom aggregates calculations
  const channelTotals = Array.from({ length: config.channels.length }, (_, chIdx) => {
    let targetSum = 0;
    let actualSum = 0;
    filteredRows.forEach((row) => {
      if (chIdx < row.channels.length) {
        targetSum += row.channels[chIdx].target;
        actualSum += row.channels[chIdx].actual;
      }
    });
    return { targetSum, actualSum, diff: actualSum - targetSum };
  });

  const otherTotal = filteredRows.reduce((sum, row) => sum + row.other, 0);

  const overallTargetTotal = channelTotals.reduce((sum, ch) => sum + ch.targetSum, 0);
  const overallActualTotal = channelTotals.reduce((sum, ch) => sum + ch.actualSum, 0) + otherTotal;
  const overallDiff = overallActualTotal - overallTargetTotal;
  // Empty State Render for daily logs
  if (viewMode === "daily" && currentRows.length === 0) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center p-8 font-sans text-center transition-colors duration-200 ${
        isDarkMode ? "bg-slate-950 text-slate-300" : "bg-slate-50 p-8 font-sans text-center"
      }`}>
        <div className={`p-4 rounded-full mb-4 shadow-xs ${
          isDarkMode ? "bg-slate-900 text-emerald-400" : "bg-emerald-50 text-emerald-600"
        }`}>
          <Calendar className="w-8 h-8 shrink-0" />
        </div>
        <h3 className={`text-sm font-extrabold mb-1 ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
          📅 日期 {selectedDate} 暂无招生数据登记
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
          该日招生记录目前是空白状态。为了方便您快速登记，可以直接克隆前一日的专业计划（完成数重置），或创建一个空白登记表。
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyFromPrevious}
            className="flex items-center gap-2 px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 font-bold rounded shadow-xs transition-all cursor-pointer text-xs"
          >
            <Copy className="w-4 h-4" />
            <span>克隆前一日专业与计划目标</span>
          </button>
          <button
            type="button"
            onClick={handleCreateBlankTable}
            className={`flex items-center gap-2 px-4 py-2 border font-bold rounded shadow-2xs transition-all cursor-pointer text-xs ${
              isDarkMode 
                ? "bg-slate-900 text-slate-200 border-slate-800 hover:bg-slate-800" 
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <PlusCircle className="w-4 h-4 text-slate-500" />
            <span>直接创建全新空白登记表</span>
          </button>
        </div>
      </div>
    );
  }

  // Get 7 unique registered dates in the system chronologically, ending at selectedDate
  const getSparklineData = (majorName: string) => {
    const uniqueDates = Array.from(new Set(rows.map((r) => r.date))).sort();
    const index = uniqueDates.indexOf(selectedDate);
    
    let last7Dates: string[] = [];
    if (index !== -1) {
      last7Dates = uniqueDates.slice(Math.max(0, index - 6), index + 1);
    } else {
      const beforeOrEqual = uniqueDates.filter(d => d <= selectedDate);
      last7Dates = beforeOrEqual.slice(Math.max(0, beforeOrEqual.length - 7));
    }

    return last7Dates.map((date) => {
      const dayRows = rows.filter((r) => r.date === date);
      const row = dayRows.find((r) => r.name === majorName);
      if (!row) {
        return { date, rate: 0, target: 0, actual: 0, exist: false };
      }
      const totalTarget = row.channels.reduce((sum, ch) => sum + ch.target, 0);
      const totalActual = row.channels.reduce((sum, ch) => sum + ch.actual, 0) + row.other;
      const rate = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
      return { date, rate, target: totalTarget, actual: totalActual, exist: true };
    });
  };

  return (
    <div className={`flex-1 flex flex-col overflow-hidden select-none transition-colors duration-200 ${
      isDarkMode ? "bg-slate-950 text-slate-100" : "bg-white"
    }`}>
      {/* Group Merge banner */}
      {selectedMergeMajors.length > 0 && (
        <div className={`px-4 py-2 border-b flex items-center justify-between text-xs transition-colors shrink-0 ${
          isDarkMode 
            ? "bg-indigo-950/20 border-slate-800 text-indigo-300" 
            : "bg-indigo-50 border-indigo-100 text-indigo-800"
        }`}>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-500 font-bold font-mono">
              {selectedMergeMajors.length}
            </span>
            <span>
              已选择 <strong>{selectedMergeMajors.length}</strong> 个专业进行同类聚合看板分析。
              {selectedMergeMajors.length >= 2 ? (
                <span className="ml-1 text-[11px] opacity-90">
                  自动将它们的计划与完成数聚合汇总显示。
                </span>
              ) : (
                <span className="ml-1 text-[11px] opacity-75">
                  （请再勾选至少一个专业以触发自动合并）
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {selectedMergeMajors.length >= 2 && (
              <button
                type="button"
                onClick={() => setIsMergedExpanded(!isMergedExpanded)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isDarkMode 
                    ? "bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-200 border border-indigo-800" 
                    : "bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-3xs"
                }`}
              >
                <span>{isMergedExpanded ? "隐藏被合并专业 (Collapse)" : "展开被合并专业 (Expand)"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleClearMerge}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                isDarkMode 
                  ? "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800" 
                  : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-3xs"
              }`}
            >
              取消合并 (Clear)
            </button>
          </div>
        </div>
      )}

      {/* Daily View Over-Target Spike Notification Banner (> 10%) */}
      {viewMode === "daily" && quickFilterCounts.overTargetSpikes > 0 && (
        <div className={`mx-4 mt-3 mb-1 p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs transition-all ${
          isDarkMode
            ? "bg-amber-950/30 border-amber-900/60 text-amber-200"
            : "bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-amber-200 text-amber-900"
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-amber-500 text-white shadow-xs shrink-0">
              <Zap className="w-4 h-4 animate-pulse fill-white" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-sm">
                  ⚡ 实际招生超计划突增预警通知
                </span>
                <span className="px-2 py-0.2 rounded-full font-extrabold font-mono text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {quickFilterCounts.overTargetSpikes} 个专业超出目标 ≥{overTargetMarginPct}%
                </span>
              </div>
              <p className="text-[11px] opacity-80 mt-0.5">
                当前日期 (<strong>{selectedDate}</strong>) 发现 {quickFilterCounts.overTargetSpikes} 个专业的实际报读人数超出计划指标超过 {overTargetMarginPct}%，请关注潜在录入多填、数据重复或渠道集中爆发情况。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setQuickFilter(quickFilter === "over_target_spike" ? "all" : "over_target_spike")}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer border ${
                quickFilter === "over_target_spike"
                  ? "bg-amber-600 text-white border-amber-700 shadow-xs"
                  : (isDarkMode ? "bg-slate-900 border-slate-800 text-amber-300 hover:bg-slate-800" : "bg-white border-amber-200 text-amber-800 hover:bg-amber-50 shadow-2xs")
              }`}
            >
              {quickFilter === "over_target_spike" ? "✓ 正在筛选突增专业" : "🔍 仅看超计划突增专业"}
            </button>
          </div>
        </div>
      )}

      {/* Daily View Deviation Notification Banner */}
      {viewMode === "daily" && quickFilterCounts.significantDeviation > 0 && (
        <div className={`mx-4 mt-3 mb-1 p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs transition-all ${
          isDarkMode
            ? "bg-rose-950/30 border-rose-900/60 text-rose-200"
            : "bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-rose-200 text-rose-900"
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-rose-500 text-white shadow-xs shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-sm">
                  🚨 每日招生计划偏离预警通知
                </span>
                <span className="px-2 py-0.2 rounded-full font-extrabold font-mono text-[10px] bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                  {quickFilterCounts.significantDeviation} 个专业偏离 ≥±{deviationThresholdPct}%
                </span>
              </div>
              <p className="text-[11px] opacity-80 mt-0.5">
                当前日期 (<strong>{selectedDate}</strong>) 有 {quickFilterCounts.significantDeviation} 个专业的实际报读偏离计划达 ±{deviationThresholdPct}% 以上，建议及时排查与跟进。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setQuickFilter("significant_deviation")}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer border ${
                quickFilter === "significant_deviation"
                  ? "bg-rose-600 text-white border-rose-700 shadow-xs"
                  : (isDarkMode ? "bg-slate-900 border-slate-800 text-rose-300 hover:bg-slate-800" : "bg-white border-rose-200 text-rose-800 hover:bg-rose-50 shadow-2xs")
              }`}
            >
              🔍 仅看偏离预警
            </button>

            {onOpenDeviationModal && (
              <button
                type="button"
                onClick={onOpenDeviationModal}
                className="px-3 py-1.5 rounded-lg font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer shadow-xs flex items-center gap-1"
              >
                <span>🔔 预警诊断中心</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Filter Bar */}
      <div className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 ${
        isDarkMode ? "bg-slate-900 border-slate-850" : "bg-slate-50 border-slate-200"
      }`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`font-extrabold flex items-center gap-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            <Filter className="w-3.5 h-3.5" />
            <span>快捷筛选核对:</span>
          </span>

          {/* Tab 1: All */}
          <button
            type="button"
            onClick={() => setQuickFilter("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all text-xs cursor-pointer ${
              quickFilter === "all"
                ? (isDarkMode ? "bg-slate-850 border-slate-700 text-slate-100" : "bg-white border-slate-300 text-slate-850 shadow-xs")
                : (isDarkMode ? "bg-slate-950 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900" : "bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100")
            }`}
          >
            <span>全部专业</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none ${
              quickFilter === "all"
                ? (isDarkMode ? "bg-slate-900 text-slate-300" : "bg-slate-200 text-slate-700")
                : (isDarkMode ? "bg-slate-900 text-slate-500" : "bg-slate-200/50 text-slate-500")
            }`}>
              {quickFilterCounts.all}
            </span>
          </button>

          {/* Tab 2: Over-Target Spikes (Actual exceeds target by > margin%) */}
          <button
            type="button"
            onClick={() => setQuickFilter("over_target_spike")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all text-xs cursor-pointer ${
              quickFilter === "over_target_spike"
                ? (isDarkMode ? "bg-amber-950/50 border-amber-800 text-amber-300 shadow-xs" : "bg-amber-50 border-amber-300 text-amber-900 shadow-xs")
                : (isDarkMode ? "bg-slate-950 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900" : "bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100")
            }`}
            title={`筛选实际招生超出计划指标达 >${overTargetMarginPct}% 的突增/超额专业`}
          >
            <Zap className={`w-3.5 h-3.5 ${quickFilter === "over_target_spike" ? "text-amber-500 fill-amber-500" : "text-slate-400"}`} />
            <span>⚡ 超额突增 (&gt;{overTargetMarginPct}%)</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none ${
              quickFilter === "over_target_spike"
                ? (isDarkMode ? "bg-amber-900/40 text-amber-300" : "bg-amber-200 text-amber-900 font-bold")
                : (isDarkMode ? "bg-slate-900 text-slate-500" : "bg-slate-200/50 text-slate-500")
            }`}>
              {quickFilterCounts.overTargetSpikes}
            </span>
          </button>

          {/* Tab 3: Significant Deviation (New flag for +/- 20%) */}
          <button
            type="button"
            onClick={() => setQuickFilter("significant_deviation")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all text-xs cursor-pointer ${
              quickFilter === "significant_deviation"
                ? (isDarkMode ? "bg-rose-950/50 border-rose-800 text-rose-300" : "bg-rose-50 border-rose-250 text-rose-800 shadow-xs")
                : (isDarkMode ? "bg-slate-950 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900" : "bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100")
            }`}
          >
            <Bell className={`w-3.5 h-3.5 ${quickFilter === "significant_deviation" ? "text-rose-500" : "text-slate-400"}`} />
            <span>±{deviationThresholdPct}%偏离预警</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none ${
              quickFilter === "significant_deviation"
                ? (isDarkMode ? "bg-rose-900/40 text-rose-300" : "bg-rose-100 text-rose-700")
                : (isDarkMode ? "bg-slate-900 text-slate-500" : "bg-slate-200/50 text-slate-500")
            }`}>
              {quickFilterCounts.significantDeviation}
            </span>
          </button>

          {/* Tab 3: Underperforming */}
          <button
            type="button"
            onClick={() => setQuickFilter("underperforming")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all text-xs cursor-pointer ${
              quickFilter === "underperforming"
                ? (isDarkMode ? "bg-amber-950/40 border-amber-800 text-amber-400" : "bg-amber-50 border-amber-250 text-amber-800 shadow-xs")
                : (isDarkMode ? "bg-slate-950 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900" : "bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100")
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${quickFilter === "underperforming" ? "text-amber-500" : "text-slate-400"}`} />
            <span>未达标专业</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none ${
              quickFilter === "underperforming"
                ? (isDarkMode ? "bg-amber-900/30 text-amber-400" : "bg-amber-100 text-amber-700")
                : (isDarkMode ? "bg-slate-900 text-slate-500" : "bg-slate-200/50 text-slate-500")
            }`}>
              {quickFilterCounts.underperforming}
            </span>
          </button>

          {/* Tab 4: Overachieving */}
          <button
            type="button"
            onClick={() => setQuickFilter("overachieving")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all text-xs cursor-pointer ${
              quickFilter === "overachieving"
                ? (isDarkMode ? "bg-emerald-950/40 border-emerald-800 text-emerald-400" : "bg-emerald-50 border-emerald-250 text-emerald-800 shadow-xs")
                : (isDarkMode ? "bg-slate-950 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900" : "bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100")
            }`}
          >
            <TrendingUp className={`w-3.5 h-3.5 ${quickFilter === "overachieving" ? "text-emerald-500" : "text-slate-400"}`} />
            <span>超额专业</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none ${
              quickFilter === "overachieving"
                ? (isDarkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-100 text-emerald-700")
                : (isDarkMode ? "bg-slate-900 text-slate-500" : "bg-slate-200/50 text-slate-500")
            }`}>
              {quickFilterCounts.overachieving}
            </span>
          </button>

          {/* Tab 5: Imbalanced Majors (Plan != Actual) */}
          <button
            type="button"
            onClick={() => setQuickFilter("imbalanced")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all text-xs cursor-pointer ${
              quickFilter === "imbalanced"
                ? (isDarkMode ? "bg-red-950/60 border-red-800 text-red-300 shadow-xs" : "bg-red-50 border-red-250 text-red-800 shadow-xs")
                : (isDarkMode ? "bg-slate-950 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900" : "bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100")
            }`}
            title="筛选所有渠道计划总和与实际完成总和不相等的专业"
          >
            <Scale className={`w-3.5 h-3.5 ${quickFilter === "imbalanced" ? "text-red-500" : "text-slate-400"}`} />
            <span>不平衡专业</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none ${
              quickFilter === "imbalanced"
                ? (isDarkMode ? "bg-red-900/40 text-red-300" : "bg-red-100 text-red-700")
                : (isDarkMode ? "bg-slate-900 text-slate-500" : "bg-slate-200/50 text-slate-500")
            }`}>
              {quickFilterCounts.imbalanced}
            </span>
          </button>

          {/* Tab 6: With Notes */}
          <button
            type="button"
            onClick={() => setQuickFilter("with_notes")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all text-xs cursor-pointer ${
              quickFilter === "with_notes"
                ? (isDarkMode ? "bg-blue-950/40 border-blue-800 text-blue-400" : "bg-blue-50 border-blue-250 text-blue-800 shadow-xs")
                : (isDarkMode ? "bg-slate-950 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900" : "bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100")
            }`}
          >
            <MessageSquare className={`w-3.5 h-3.5 ${quickFilter === "with_notes" ? "text-blue-500" : "text-slate-400"}`} />
            <span>待跟进备注专业</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none ${
              quickFilter === "with_notes"
                ? (isDarkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700")
                : (isDarkMode ? "bg-slate-900 text-slate-500" : "bg-slate-200/50 text-slate-500")
            }`}>
              {quickFilterCounts.withNotes}
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Quick Balance Verify All Button */}
          <button
            type="button"
            onClick={handleVerifyAllRows}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              verifiedRowIds.length > 0
                ? (quickFilterCounts.verifiedImbalanced > 0
                    ? "bg-red-600 hover:bg-red-700 text-white border-red-700 shadow-xs"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-xs")
                : (isDarkMode
                    ? "bg-slate-950 hover:bg-slate-850 text-indigo-300 border-slate-800 hover:border-indigo-500/40"
                    : "bg-white hover:bg-indigo-50/70 text-indigo-700 border-indigo-200 shadow-3xs")
            }`}
            title="一键快速核对表中每个专业的所有渠道计划总和与实际完成总和，并以红色底色标亮所有不平衡的专业行"
          >
            {verifiedRowIds.length > 0 ? (
              quickFilterCounts.verifiedImbalanced > 0 ? (
                <ShieldAlert className="w-3.5 h-3.5 shrink-0 animate-bounce" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              )
            ) : (
              <Scale className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
            )}
            <span>
              {verifiedRowIds.length === 0
                ? "一键全行核验平衡"
                : `已核验 ${verifiedRowIds.length} 行 (${quickFilterCounts.verifiedImbalanced}行不平衡已标红)`}
            </span>
          </button>

          {verifiedRowIds.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllVerified}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                isDarkMode ? "bg-slate-850 hover:bg-slate-800 text-slate-400" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
              title="清空所有行的核验标记"
            >
              清除核验
            </button>
          )}
          {quickFilter !== "all" && (
            <button
              type="button"
              onClick={() => setQuickFilter("all")}
              className={`text-[11px] font-bold hover:underline cursor-pointer mr-2 ${
                isDarkMode ? "text-slate-400 hover:text-slate-250" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              清除快捷筛选 ×
            </button>
          )}

          {/* Over-target Spike Highlight Switch & Margin Dropdown */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
            isDarkMode ? "border-slate-800 bg-slate-950/40" : "border-slate-200 bg-white shadow-2xs"
          }`}>
            <div className="flex items-center gap-1">
              <Zap className={`w-3.5 h-3.5 ${highlightOverTargetSpikes ? "text-amber-500 fill-amber-500" : "text-slate-400"}`} />
              <span className={`text-[11px] font-bold ${
                isDarkMode ? "text-slate-300" : "text-slate-700"
              }`}>
                突增高亮
              </span>
            </div>
            
            <select
              value={overTargetMarginPct}
              onChange={(e) => setOverTargetMarginPct(Number(e.target.value))}
              className={`text-[10px] font-mono font-bold py-0.5 px-1 rounded border outline-none cursor-pointer ${
                isDarkMode ? "bg-slate-900 border-slate-750 text-amber-400" : "bg-amber-50/70 border-amber-200 text-amber-900"
              }`}
              title="调整实际完成超出计划指标的预警百分比阈值"
            >
              <option value={5}>&gt;5%</option>
              <option value={10}>&gt;10% (推荐)</option>
              <option value={15}>&gt;15%</option>
              <option value={20}>&gt;20%</option>
              <option value={30}>&gt;30%</option>
            </select>

            <button
              type="button"
              onClick={() => setHighlightOverTargetSpikes(!highlightOverTargetSpikes)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                highlightOverTargetSpikes ? "bg-amber-500" : (isDarkMode ? "bg-slate-850" : "bg-slate-250")
              }`}
              title={highlightOverTargetSpikes ? "点击关闭实际超标突增行高亮" : "点击开启实际超标突增行高亮"}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  highlightOverTargetSpikes ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Quick Edit Toggle Switch */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
            isDarkMode ? "border-slate-800 bg-slate-950/40" : "border-slate-200 bg-white shadow-2xs"
          }`}>
            <span className={`text-[11px] font-bold ${
              isDarkMode ? "text-slate-400" : "text-slate-650"
            }`}>
              ⚡ 快捷录入 (Arrow Navigation)
            </span>
            <button
              type="button"
              onClick={() => {
                setQuickEditMode(!quickEditMode);
                if (!quickEditMode) {
                  // select first row first cell by default if nothing is active
                  if (!activeCell && processedRows.length > 0) {
                    selectCell(0, 0);
                  }
                } else {
                  setActiveCell(null);
                }
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                quickEditMode ? "bg-emerald-500" : (isDarkMode ? "bg-slate-850" : "bg-slate-250")
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  quickEditMode ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Date Comparison Selector Bar */}
      {viewMode === "daily" && (
        <div className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 transition-all ${
          isDarkMode ? "bg-slate-900/40 border-slate-850/65" : "bg-white border-slate-200/80"
        }`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1 rounded bg-indigo-500/10 text-indigo-500 shrink-0">
              <RefreshCw className="w-3.5 h-3.5" />
            </span>
            <span className={`font-extrabold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
              招生版本比对 (Compare Date):
            </span>
            <span className={`text-[11px] font-medium ${isDarkMode ? "text-slate-450" : "text-slate-500"}`}>
              主版本日期: <strong className="text-emerald-500 font-mono font-extrabold">{selectedDate}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className={`text-[11px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
              对比参考日期:
            </span>
            <div className="relative">
              <select
                value={compareDate || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setCompareDate(val ? val : null);
                }}
                className={`text-[11px] font-bold py-1 px-3 pr-8 rounded-lg border outline-none cursor-pointer transition-all appearance-none ${
                  isDarkMode 
                    ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500 hover:border-slate-750" 
                    : "bg-white border-slate-250 text-slate-750 focus:border-indigo-650 hover:border-slate-300 shadow-3xs"
                }`}
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${isDarkMode ? '%252394a3b8' : '%2523475569'}' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='m6 9 6 6 6-6'/%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  backgroundSize: '11px'
                }}
              >
                <option value="">-- 无（不开启对比）--</option>
                {Array.from(new Set(rows.map((r) => r.date)))
                  .sort()
                  .reverse() // show latest first
                  .filter((d) => d !== selectedDate)
                  .map((d, idx) => (
                    <option key={`opt-date-${d}-${idx}`} value={d}>
                      {d} ({rows.filter((r) => r.date === d).length}个专业数据)
                    </option>
                  ))}
              </select>
            </div>

            {compareDate && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCompareDate(null)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    isDarkMode 
                      ? "bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-250 border border-slate-850" 
                      : "bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 border border-slate-200 shadow-3xs"
                  }`}
                >
                  清除对比
                </button>
                <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold flex items-center gap-1 ${
                  isDarkMode ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-750 border border-indigo-100"
                }`}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                  </span>
                  对比模式已启用 (单元格内 "vs" 显示参考日期值)
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7-Day Sparkline Trend Chart Panel */}
      {(() => {
        const activeSparklineMajor = selectedSparklineMajor || (currentRows.filter(r => !r.isMergedGroup && r.name && !r.name.includes("同类专业合并组"))[0]?.name || null);
        if (!activeSparklineMajor) return null;

        const sparkData = getSparklineData(activeSparklineMajor);
        const hasData = sparkData.some(d => d.exist);
        
        // Find min and max for scaling the SVG path
        const rates = sparkData.map(d => d.rate);
        const maxRate = Math.max(...rates, 100); // at least scale up to 100% so standard is visual
        const minRate = Math.min(...rates, 0);
        const range = maxRate - minRate || 1;

        // Create SVG path points
        const svgWidth = 500;
        const svgHeight = 60;
        const paddingY = 12;
        
        const points = sparkData.map((d, idx) => {
          const x = (idx / (sparkData.length - 1)) * (svgWidth - 40) + 20;
          // Y is inverted in SVG, so 0% completion is at height - paddingY, maxRate is at paddingY
          const y = svgHeight - paddingY - ((d.rate - minRate) / range) * (svgHeight - 2 * paddingY);
          return { x, y, ...d };
        });

        const pathD = points.length > 0 
          ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")
          : "";

        const fillD = points.length > 0
          ? `${pathD} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`
          : "";

        const lastPoint = sparkData[sparkData.length - 1];

        return (
          <div className={`mx-4 mt-3 mb-2 p-3 border rounded-xl flex flex-col lg:flex-row items-stretch justify-between gap-4 transition-all duration-300 ${
            isDarkMode 
              ? "bg-slate-900/60 border-slate-850 text-slate-100" 
              : "bg-slate-50/70 border-slate-200 text-slate-800"
          }`}>
            {/* Left side info */}
            <div className="flex flex-col justify-between space-y-2 lg:min-w-[280px]">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 rounded bg-indigo-500/10 text-indigo-500 shrink-0">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </span>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDarkMode ? "text-slate-450" : "text-slate-500"}`}>
                    7日『目标完成率』波动曲线
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-extrabold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    选中专业:
                  </span>
                  <div className="relative">
                    <select
                      value={activeSparklineMajor}
                      onChange={(e) => setSelectedSparklineMajor(e.target.value)}
                      className={`text-[11px] font-extrabold py-0.5 px-2 pr-6 rounded border outline-none cursor-pointer transition-all appearance-none ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500" 
                          : "bg-white border-slate-250 text-slate-700 focus:border-indigo-650 shadow-3xs"
                      }`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${isDarkMode ? '%252394a3b8' : '%2523475569'}' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='m6 9 6 6 6-6'/%3e%3c/svg%3e")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 6px center',
                        backgroundSize: '10px'
                      }}
                    >
                      {currentRows.filter(r => !r.isMergedGroup && r.name && !r.name.includes("同类专业合并组")).map((r, idx) => (
                        <option key={`opt-major-${r.id}-${idx}`} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11px] select-none">
                <div>
                  <span className="text-slate-400 font-medium">最新完成率:</span>{" "}
                  <span className={`font-mono font-extrabold ${
                    (lastPoint?.rate ?? 0) >= 100 
                      ? "text-emerald-500" 
                      : (lastPoint?.rate ?? 0) >= 50 ? "text-amber-500" : "text-rose-500"
                  }`}>
                    {(lastPoint?.rate ?? 0).toFixed(1)}%
                  </span>
                </div>
                <div className="border-l h-2.5 border-slate-200 dark:border-slate-800"></div>
                <div>
                  <span className="text-slate-400 font-medium">计划:</span>{" "}
                  <span className="font-mono font-bold">{lastPoint?.target ?? 0}人</span>
                </div>
                <div className="border-l h-2.5 border-slate-200 dark:border-slate-800"></div>
                <div>
                  <span className="text-slate-400 font-medium">实际:</span>{" "}
                  <span className="font-mono font-bold">{lastPoint?.actual ?? 0}人</span>
                </div>
              </div>
            </div>

            {/* Sparkline Display */}
            <div className="flex-1 flex flex-col justify-end min-h-[64px] relative">
              {hasData ? (
                <>
                  {/* SVG Chart */}
                  <div className="w-full h-11 relative">
                    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid Line (100% line) */}
                      {maxRate >= 100 && (
                        (() => {
                          const y100 = svgHeight - paddingY - ((100 - minRate) / range) * (svgHeight - 2 * paddingY);
                          if (y100 >= paddingY && y100 <= svgHeight - paddingY) {
                            return (
                              <g>
                                <line 
                                  x1="10" 
                                  y1={y100} 
                                  x2={svgWidth - 10} 
                                  y2={y100} 
                                  stroke={isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)"} 
                                  strokeDasharray="3,3" 
                                />
                                <text 
                                  x={svgWidth - 12} 
                                  y={y100 - 3} 
                                  textAnchor="end" 
                                  className={`font-sans text-[9px] font-extrabold ${isDarkMode ? "fill-slate-500" : "fill-slate-400"}`}
                                >
                                  100% 达标线
                                </text>
                              </g>
                            );
                          }
                          return null;
                        })()
                      )}

                      {/* Area Fill */}
                      <path d={fillD} fill="url(#sparklineGrad)" />

                      {/* Line Path */}
                      <path 
                        d={pathD} 
                        fill="none" 
                        stroke="#4f46e5" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />

                      {/* Data dots with tooltip-trigger hover effect */}
                      {points.map((p, idx) => {
                        const isLast = idx === points.length - 1;
                        return (
                          <g key={`spark-dot-${p.date}-${idx}`} className="group/dot cursor-pointer">
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r={isLast ? "4" : "3"} 
                              className={`fill-white stroke-indigo-600 stroke-2 transition-all ${
                                isLast ? "animate-pulse" : "hover:r-4 hover:stroke-indigo-700"
                              }`} 
                            />
                            {/* Simple inline tooltip fallback */}
                            <title>
                              {`${p.date}\n目标数：${p.target}人\n完成数：${p.actual}人\n达成率：${p.rate.toFixed(1)}%`}
                            </title>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Date labels at bottom */}
                  <div className="flex justify-between items-center px-4 mt-1 text-[9px] font-mono font-bold text-slate-450 select-none">
                    {points.map((p, idx) => (
                      <span key={`spark-lbl-${p.date}-${idx}`} className={idx === points.length - 1 ? "text-indigo-500 font-extrabold" : ""}>
                        {p.date.slice(5)}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  暂无 7 天内的历史招生数据
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Scrollable Spreadsheet Grid */}
      <div className="lg:hidden px-4 py-2.5 bg-emerald-500/10 dark:bg-emerald-500/5 border-b border-emerald-500/25 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-between shrink-0 select-none">
        <span className="flex items-center gap-1.5">
          <span>👈👉 左右滑动表格，可编辑/核对所有 7 大渠道数据</span>
        </span>
        <span className="animate-pulse">滑动核对 ➔</span>
      </div>

      <div className={`flex-1 overflow-auto border-b ${isDarkMode ? "border-slate-850" : "border-slate-200"}`}>
        <table
          ref={tableRef}
          className="w-full border-collapse text-xs table-fixed min-w-[1300px]"
          id="spreadsheet-table"
        >
          {/* Header Rows */}
          <thead className={`sticky top-0 z-30 shadow-[0_1px_0_rgba(0,0,0,0.08)] ${
            isDarkMode ? "bg-slate-900" : "bg-slate-100"
          }`}>
            {/* Table Title Row (Pastel Green Theme, exact match to screenshot) */}
            <tr className={isDarkMode ? "bg-emerald-950/40 border-b border-slate-800" : "bg-[#e2f0d9] border-b border-slate-300"}>
              <th
                colSpan={22}
                className={`text-center font-bold py-2.5 text-sm tracking-wide ${isDarkMode ? "text-emerald-400" : "text-[#274e13]"}`}
              >
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => onConfigChange({ ...config, title: e.target.value })}
                  className={`bg-transparent border-0 outline-none text-center font-extrabold w-full focus:bg-white/50 rounded transition-all py-1 text-sm ${
                    isDarkMode ? "text-slate-100 focus:bg-slate-800/40" : "text-slate-900"
                  }`}
                  title="双击或点击此单元格可以直接修改招生表标题"
                />
              </th>
            </tr>

            {/* Merged Header 1 */}
            <tr className={`text-[11px] ${
              isDarkMode ? "bg-slate-900 text-slate-300 border-b border-slate-800" : "bg-slate-100 text-slate-700 border-b border-slate-200"
            }`}>
              <th
                rowSpan={2}
                className={`w-10 border-r border-b text-center font-bold sticky left-0 z-40 cursor-pointer select-none transition-all ${
                  sortConfig.key === "id"
                    ? (isDarkMode ? "bg-indigo-950/75 text-indigo-300 border-slate-800 font-extrabold shadow-inner" : "bg-indigo-100/90 text-indigo-950 border-slate-300 font-extrabold shadow-inner")
                    : (isDarkMode 
                        ? "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900" 
                        : "bg-slate-200 border-slate-200 text-slate-600 hover:bg-slate-300")
                }`}
                onClick={() => handleSort("id")}
                title="点击按ID排序"
              >
                <div className="flex items-center justify-center gap-0.5 group/sort">
                  <span>ID</span>
                  {renderSortIcon("id")}
                </div>
              </th>
              <th
                rowSpan={2}
                className={`w-52 min-w-[208px] max-w-[208px] border-r border-b text-center font-bold sticky left-10 z-40 cursor-pointer select-none transition-all ${
                  sortConfig.key === "name"
                    ? (isDarkMode ? "bg-indigo-950/75 text-indigo-300 border-slate-800 font-extrabold shadow-inner" : "bg-indigo-100/90 text-indigo-950 border-slate-300 font-extrabold shadow-inner")
                    : (isDarkMode 
                        ? "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900" 
                        : "bg-slate-200 border-slate-200 text-slate-600 hover:bg-slate-300")
                }`}
                onClick={() => handleSort("name")}
                title="点击按专业名称排序"
              >
                <div className="flex items-center justify-center gap-1 group/sort">
                  <span>专业/基础名称</span>
                  {renderSortIcon("name")}
                </div>
              </th>

              {/* 7 Channel groups */}
              {config.channels.map((chName, chIdx) => (
                <th
                  key={`ch-group-${chIdx}`}
                  colSpan={2}
                  className={`border-r border-b font-bold text-center px-1 py-1 ${
                    isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-slate-100"
                  }`}
                >
                  <input
                    type="text"
                    value={chName}
                    onChange={(e) => handleChannelRename(chIdx, e.target.value)}
                    className={`bg-transparent border-b border-transparent text-center font-bold focus:outline-none w-full text-[11px] py-0.5 rounded transition-all truncate ${
                      isDarkMode ? "text-slate-300 hover:border-slate-705 focus:border-emerald-500" : "text-slate-700 hover:border-slate-300 focus:border-emerald-600"
                    }`}
                    title="双击或点击此单元格可编辑更新渠道名"
                  />
                </th>
              ))}

              <th
                rowSpan={2}
                className={`w-20 border-r border-b font-bold text-center cursor-pointer select-none transition-all ${
                  sortConfig.key === "other"
                    ? (isDarkMode ? "bg-indigo-950/75 text-indigo-300 border-slate-800 font-extrabold shadow-inner" : "bg-indigo-100/90 text-indigo-950 border-slate-300 font-extrabold shadow-inner")
                    : (isDarkMode 
                        ? "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900" 
                        : "bg-slate-150 border-slate-200 text-slate-600 hover:bg-slate-250")
                }`}
                onClick={() => handleSort("other")}
                title="点击按其他人员排序"
              >
                <div className="flex items-center justify-center gap-1 group/sort">
                  <span>其他人员</span>
                  {renderSortIcon("other")}
                </div>
              </th>
              <th
                rowSpan={2}
                className={`w-20 border-r border-b font-bold text-center cursor-pointer select-none transition-all ${
                  sortConfig.key === "total_target"
                    ? (isDarkMode ? "bg-indigo-950/75 text-indigo-300 border-slate-800 font-extrabold shadow-inner" : "bg-indigo-100/90 text-indigo-950 border-slate-300 font-extrabold shadow-inner")
                    : (isDarkMode 
                        ? "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900" 
                        : "bg-slate-200 border-slate-200 text-slate-700 hover:bg-slate-250")
                }`}
                onClick={() => handleSort("total_target")}
                title="点击按目标计划数排序"
              >
                <div className="flex items-center justify-center gap-1 group/sort">
                  <span>目标计划数</span>
                  {renderSortIcon("total_target")}
                </div>
              </th>
              <th
                rowSpan={2}
                className={`w-20 border-r border-b font-bold text-center cursor-pointer select-none transition-all ${
                  sortConfig.key === "total_actual"
                    ? (isDarkMode ? "bg-indigo-950/75 text-indigo-300 border-slate-800 font-extrabold shadow-inner" : "bg-indigo-100/90 text-indigo-950 border-slate-300 font-extrabold shadow-inner")
                    : (isDarkMode 
                        ? "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900" 
                        : "bg-slate-200 border-slate-200 text-slate-700 hover:bg-slate-250")
                }`}
                onClick={() => handleSort("total_actual")}
                title="点击按实际完成数排序"
              >
                <div className="flex items-center justify-center gap-1 group/sort">
                  <span>实际完成数</span>
                  {renderSortIcon("total_actual")}
                </div>
              </th>
              <th
                rowSpan={2}
                className={`w-20 border-r border-b font-bold text-center cursor-pointer select-none transition-all ${
                  sortConfig.key === "diff"
                    ? (isDarkMode ? "bg-indigo-950/75 text-indigo-300 border-slate-800 font-extrabold shadow-inner" : "bg-indigo-100/90 text-indigo-950 border-slate-300 font-extrabold shadow-inner")
                    : (isDarkMode 
                        ? "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900" 
                        : "bg-slate-200 border-slate-200 text-slate-700 hover:bg-slate-250")
                }`}
                onClick={() => handleSort("diff")}
                title="点击按完成度偏差排序"
              >
                <div className="flex items-center justify-center gap-1 group/sort">
                  <span>与目标之差</span>
                  {renderSortIcon("diff")}
                </div>
              </th>
              <th
                rowSpan={2}
                className={`w-16 border-r border-b font-bold text-center cursor-pointer select-none transition-all ${
                  sortConfig.key === "note"
                    ? (isDarkMode ? "bg-indigo-950/75 text-indigo-300 border-slate-800 font-extrabold shadow-inner" : "bg-indigo-100/90 text-indigo-950 border-slate-300 font-extrabold shadow-inner")
                    : (isDarkMode 
                        ? "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900" 
                        : "bg-slate-200 border-slate-200 text-slate-650 hover:bg-slate-250")
                }`}
                onClick={() => handleSort("note")}
                title="点击按备注内容排序"
              >
                <div className="flex items-center justify-center gap-1 group/sort">
                  <span>备注</span>
                  {renderSortIcon("note")}
                </div>
              </th>
              <th
                rowSpan={2}
                className={`w-28 min-w-[104px] border-b font-bold text-center ${
                  isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-200 border-slate-200 text-slate-600"
                }`}
                title="快捷核验全渠道平衡与行操作"
              >
                <div className="flex items-center justify-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-indigo-500" />
                  <span>核验 / 操作</span>
                </div>
              </th>
            </tr>

            {/* Merged Header 2: Sub-columns */}
            <tr className={isDarkMode ? "bg-slate-905 text-slate-400 border-b border-slate-800" : "bg-slate-50 text-slate-600 border-b border-slate-200"}>
              {config.channels.map((_, chIdx) => (
                <React.Fragment key={`ch-sub-${chIdx}`}>
                  <th 
                    className={`border-r text-[10px] font-semibold text-center py-1 cursor-pointer select-none transition-all ${
                      sortConfig.key === `channel_target_${chIdx}`
                        ? (isDarkMode ? "bg-indigo-950/75 text-indigo-300 border-slate-800 font-bold shadow-inner" : "bg-indigo-100/90 text-indigo-950 border-slate-300 font-bold shadow-inner")
                        : (isDarkMode 
                            ? "border-slate-800 bg-slate-900 text-slate-500 hover:bg-slate-800" 
                            : "border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200")
                    }`}
                    onClick={() => handleSort(`channel_target_${chIdx}`)}
                    title="点击按该渠道计划目标排序"
                  >
                    <div className="flex items-center justify-center gap-0.5 group/sort">
                      <span>计划目标</span>
                      {renderSortIcon(`channel_target_${chIdx}`)}
                    </div>
                  </th>
                  <th 
                    className={`border-r text-[10px] font-semibold text-center py-1 cursor-pointer select-none transition-all ${
                      sortConfig.key === `channel_actual_${chIdx}`
                        ? (isDarkMode ? "bg-indigo-950/75 text-indigo-300 border-slate-800 font-bold shadow-inner" : "bg-indigo-100/90 text-indigo-950 border-slate-300 font-bold shadow-inner")
                        : (isDarkMode 
                            ? "border-slate-800 bg-slate-950 text-slate-500 hover:bg-slate-900" 
                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100")
                    }`}
                    onClick={() => handleSort(`channel_actual_${chIdx}`)}
                    title="点击按该渠道实际完成排序"
                  >
                    <div className="flex items-center justify-center gap-0.5 group/sort">
                      <span>实际完成</span>
                      {renderSortIcon(`channel_actual_${chIdx}`)}
                    </div>
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          {/* Body Rows */}
          <tbody className={`divide-y font-mono ${
            isDarkMode ? "divide-slate-850 text-slate-200" : "divide-slate-150 text-slate-800"
          }`}>
            {processedRows.map((row, rIdx) => {
              const { totalTarget, totalActual, diff } = getRowCalculations(row);
              const originalIndex = rows.findIndex((origRow) => origRow.id === row.id);

              const rowDeviationRate = totalTarget > 0 ? (totalActual - totalTarget) / totalTarget : (totalActual > 0 ? Infinity : 0);
              const isDeviatingMoreThan20 = Math.abs(rowDeviationRate) > 0.2;

              const isMergedGroup = !!row.isMergedGroup;
              const isMergedChild = !!row.isMergedChild;
              const isMetaMatched = !!(row as any).isMetaMatched;

              // Over-target spike calculation (> overTargetMarginPct%)
              const spikeInfo = checkRowOverTargetSpike(row, overTargetMarginPct);
              const isSpikeHighlighted = highlightOverTargetSpikes && spikeInfo.isSpike && !isMergedGroup;

              // Row Verification State
              const isVerified = verifiedRowIds.includes(row.id);
              const isImbalanced = isVerified && totalActual !== totalTarget;
              const isBalanced = isVerified && totalActual === totalTarget;

              const trClass = isMergedGroup
                ? (isDarkMode ? "bg-indigo-950/20 hover:bg-indigo-950/30 border-l-2 border-indigo-500 font-bold" : "bg-indigo-50/60 hover:bg-indigo-50/80 border-l-2 border-indigo-500 font-bold")
                : isImbalanced
                ? (isDarkMode 
                    ? "bg-red-950/80 hover:bg-red-900/85 border-l-4 border-red-500 shadow-inner ring-1 ring-red-500/40 text-red-100 font-semibold" 
                    : "bg-red-100/90 hover:bg-red-150 border-l-4 border-red-600 shadow-inner ring-1 ring-red-300 text-red-950 font-semibold")
                : isBalanced
                ? (isDarkMode 
                    ? "bg-emerald-950/30 hover:bg-emerald-950/40 border-l-4 border-emerald-500 shadow-inner" 
                    : "bg-emerald-50/70 hover:bg-emerald-100/70 border-l-4 border-emerald-500 shadow-inner")
                : isSpikeHighlighted
                ? (isDarkMode 
                    ? "bg-amber-950/40 hover:bg-amber-900/50 border-l-4 border-amber-500 shadow-inner ring-1 ring-amber-500/30 text-amber-100 font-semibold" 
                    : "bg-amber-50/90 hover:bg-amber-100/90 border-l-4 border-amber-500 shadow-inner ring-1 ring-amber-400/40 text-amber-950 font-semibold")
                : isMergedChild
                ? (isDarkMode ? "bg-slate-900/30 hover:bg-slate-900/50 text-slate-450" : "bg-slate-50/50 hover:bg-slate-50/80 text-slate-600")
                : isMetaMatched
                ? (isDarkMode ? "bg-amber-950/40 hover:bg-amber-900/40 border-l-4 border-amber-500 shadow-inner" : "bg-amber-50/90 hover:bg-amber-100/90 border-l-4 border-amber-500 shadow-inner")
                : (isDarkMode ? "hover:bg-slate-900/40" : "hover:bg-slate-50/80");

              return (
                <tr
                  key={`tbl-row-${row.id}-${rIdx}`}
                  id={`major-row-${row.id}`}
                  data-major-name={row.name}
                  className={`${trClass} transition-colors`}
                >
                  {/* Sequence Column (Sticky) */}
                  <td 
                    onClick={() => {
                      if (!isMergedGroup) {
                        onOpenMajorDashboard?.(row.name);
                      }
                    }}
                    title={!isMergedGroup ? `点击查看「${row.name}」专业数据仪表盘` : undefined}
                    className={`border-r text-center font-bold sticky left-0 z-20 shadow-[1px_0_0_rgba(0,0,0,0.05)] ${
                      !isMergedGroup ? "cursor-pointer hover:brightness-110 active:scale-95 transition-all" : ""
                    } ${
                    isImbalanced
                      ? (isDarkMode ? "border-red-900/80 bg-red-950 text-red-300 ring-1 ring-red-500/40" : "border-red-200 bg-red-200 text-red-900 ring-1 ring-red-300")
                      : isSpikeHighlighted
                      ? (isDarkMode ? "border-amber-900/80 bg-amber-950 text-amber-300 ring-1 ring-amber-500/40" : "border-amber-200 bg-amber-200 text-amber-900 ring-1 ring-amber-300")
                      : isDarkMode ? "border-slate-800 bg-slate-900 text-slate-400" : "border-slate-200 bg-slate-100 text-slate-500"
                  }`}>
                    {isMergedGroup ? "🏫" : row.seq}
                  </td>

                  {/* Name Column (Sticky) */}
                  <td className={`w-52 min-w-[208px] max-w-[208px] border-r sticky left-10 z-20 shadow-[1px_0_0_rgba(0,0,0,0.05)] px-1 ${
                    isImbalanced
                      ? (isDarkMode ? "border-red-900/80 bg-red-950/95 text-red-100 ring-1 ring-red-500/50" : "border-red-200 bg-red-100/95 text-red-950 ring-1 ring-red-300")
                      : isBalanced
                      ? (isDarkMode ? "border-emerald-900/60 bg-emerald-950/40 text-emerald-200" : "border-emerald-200 bg-emerald-50 text-emerald-900")
                      : isSpikeHighlighted
                      ? (isDarkMode ? "border-amber-900/80 bg-amber-950/90 text-amber-100 ring-1 ring-amber-500/40" : "border-amber-200 bg-amber-100/95 text-amber-950 ring-1 ring-amber-300")
                      : row.name === activeSparklineMajor && !isMergedGroup
                        ? (isDarkMode ? "border-indigo-900 bg-indigo-950/30 text-slate-100 ring-1 ring-indigo-500/30" : "border-indigo-100 bg-indigo-50/50 text-slate-900 ring-1 ring-indigo-500/20")
                        : isDeviatingMoreThan20 && !isMergedGroup
                          ? (rowDeviationRate > 0.2
                              ? (isDarkMode ? "border-slate-800 bg-teal-950/45 text-teal-200 font-bold" : "border-slate-200 bg-teal-50 text-teal-900 font-bold")
                              : (isDarkMode ? "border-slate-800 bg-rose-950/45 text-rose-200 font-bold" : "border-slate-200 bg-rose-50 text-rose-900 font-bold")
                            )
                          : (isDarkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white")
                  } ${getActiveCellClass(rIdx, 0)}`}>
                    <div className="relative flex items-center justify-center group/name-cell w-full">
                      {isMergedGroup ? (
                        <div className="flex items-center gap-1.5 w-full pl-1 py-1">
                          <button
                            type="button"
                            onClick={() => setIsMergedExpanded(!isMergedExpanded)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-850 transition-all text-indigo-500 hover:text-indigo-600 shrink-0 cursor-pointer"
                            title="展开/折叠被合并的专业明细"
                          >
                            {isMergedExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className="font-sans font-bold text-xs text-indigo-600 dark:text-indigo-400 text-left w-full truncate">
                            {row.name}
                          </span>
                        </div>
                      ) : (() => {
                        const rowDeviationRate = totalTarget > 0 ? (totalActual - totalTarget) / totalTarget : (totalActual > 0 ? Infinity : 0);
                        const rowHasDeviation = Math.abs(rowDeviationRate) > 0.5;
                        const prClass = (rowHasDeviation && isMetaMatched) ? "pr-14" : (rowHasDeviation || isMetaMatched) ? "pr-8" : "pr-2";

                        if (isMergedChild) {
                          return (
                            <div className="flex items-center gap-1.5 w-full pl-4 py-1">
                              <input
                                type="checkbox"
                                checked={selectedMergeMajors.includes(row.name)}
                                onChange={() => handleToggleMerge(row.name)}
                                className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer shrink-0"
                                title="取消勾选将此专业移出合并组"
                              />
                              <span className="text-slate-400 text-xs select-none shrink-0 font-sans">└─</span>
                              <div
                                onClick={() => {
                                  setSelectedSparklineMajor(row.name);
                                  if (viewMode !== "monthly") {
                                    if (quickEditMode) {
                                      selectCell(rIdx, 0);
                                    } else {
                                      setEditingCell({
                                        rowIndex: originalIndex,
                                        colIndex: 0,
                                        rIdx,
                                        majorName: row.name,
                                        value: row.name
                                      });
                                    }
                                  }
                                }}
                                className={`w-full bg-transparent border-0 outline-none rounded pl-1.5 ${prClass} py-2.5 lg:py-1 min-h-[38px] lg:min-h-0 font-sans font-medium text-xs text-left cursor-pointer transition-all ${
                                  isDarkMode ? "text-slate-300 hover:bg-slate-800/80" : "text-slate-650 hover:bg-emerald-50/40"
                                } ${viewMode === "monthly" ? "cursor-not-allowed hover:bg-transparent text-slate-500" : ""}`}
                              >
                                <span className="flex items-center gap-1.5">
                                  <span className={row.name === activeSparklineMajor ? "text-indigo-500 font-extrabold" : ""}>
                                    {activeCell && activeCell.rIdx === rIdx && activeCell.colIndex === 0 ? activeCellValue : row.name}
                                  </span>
                                  {row.name === activeSparklineMajor && (
                                    <span className="shrink-0 text-indigo-500 text-[10px] animate-bounce" title="当前正在查看其7日趋势">📈</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex items-center gap-1.5 w-full pl-1 py-1">
                              <input
                                type="checkbox"
                                checked={selectedMergeMajors.includes(row.name)}
                                onChange={() => handleToggleMerge(row.name)}
                                className="w-3.5 h-3.5 accent-indigo-650 rounded cursor-pointer shrink-0"
                                title="勾选此专业加入同类专业合并分析"
                              />
                              <div
                                onClick={() => {
                                  setSelectedSparklineMajor(row.name);
                                  if (viewMode !== "monthly") {
                                    if (quickEditMode) {
                                      selectCell(rIdx, 0);
                                    } else {
                                      setEditingCell({
                                        rowIndex: originalIndex,
                                        colIndex: 0,
                                        rIdx,
                                        majorName: row.name,
                                        value: row.name
                                      });
                                    }
                                  }
                                }}
                                className={`w-full bg-transparent border-0 outline-none rounded pl-1.5 ${prClass} py-2.5 lg:py-1 min-h-[38px] lg:min-h-0 font-sans font-semibold text-xs text-left cursor-pointer transition-all ${
                                  isDarkMode ? "text-slate-100 hover:bg-slate-800/80" : "text-slate-800 hover:bg-emerald-50/40"
                                } ${viewMode === "monthly" ? "cursor-not-allowed hover:bg-transparent text-slate-500" : ""}`}
                              >
                                <span className="flex items-center gap-1.5">
                                  <span className={row.name === activeSparklineMajor ? "text-indigo-500 font-extrabold" : ""}>
                                    {activeCell && activeCell.rIdx === rIdx && activeCell.colIndex === 0 ? activeCellValue : row.name}
                                  </span>
                                  {row.name === activeSparklineMajor && (
                                    <span className="shrink-0 text-indigo-500 text-[10px] animate-bounce" title="当前正在查看其7日趋势">📈</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          );
                        }
                      })()}

                      {/* Cell badges block (deviation + search metadata) */}
                      {!isMergedGroup && (
                        <div className="absolute right-1 top-1.5 flex items-center gap-1 z-30">
                          {/* 0.0 Professional Major Dashboard Trigger Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenMajorDashboard?.(row.name);
                            }}
                            className="relative flex items-center justify-center p-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 transition-all cursor-pointer shadow-2xs group/dashtooltip"
                            title={`点击打开「${row.name}」专业数据仪表盘`}
                          >
                            <LayoutDashboard className="w-2.5 h-2.5 shrink-0" />
                            <span className="hidden group-hover/dashtooltip:block absolute bottom-full mb-1 right-0 z-50 px-1.5 py-0.5 text-[9px] font-bold bg-slate-900 text-white rounded whitespace-nowrap shadow-md pointer-events-none">
                              数据仪表盘
                            </span>
                          </button>

                          {/* 0. Over-Target Spike Warning Badge (Actual > Target by > X%) */}
                          {isSpikeHighlighted && (
                            <div
                              className="relative flex items-center justify-center group/spiketooltip cursor-pointer"
                              onClick={() => setQuickFilter("over_target_spike")}
                            >
                              <span className="px-1.5 py-0.5 rounded-md font-mono font-black text-[9px] flex items-center gap-0.5 shadow-2xs border transition-all bg-amber-500 text-white border-amber-600 hover:bg-amber-600 animate-pulse">
                                <Zap className="w-2.5 h-2.5 shrink-0 fill-current" />
                                <span>{spikeInfo.excessPct === Infinity ? "无计划突增" : `+${spikeInfo.excessPct.toFixed(0)}%超额`}</span>
                              </span>

                              {/* Tooltip Content */}
                              <div className={`absolute bottom-full mb-1.5 right-0 hidden group-hover/spiketooltip:block z-50 p-2.5 rounded-xl text-[10px] leading-relaxed shadow-2xl border w-56 text-left transition-all duration-200 ${
                                isDarkMode 
                                  ? "bg-slate-900 border-slate-800 text-slate-200 shadow-black/90" 
                                  : "bg-white border-slate-200 text-slate-800 shadow-slate-200/90"
                              }`}>
                                <div className="font-black text-amber-500 dark:border-slate-800 border-slate-100 flex items-center justify-between mb-1.5 border-b pb-1">
                                  <div className="flex items-center gap-1">
                                    <Zap className="w-3.5 h-3.5 shrink-0 fill-amber-500" />
                                    <span>实际超计划突增预警 (&gt;{overTargetMarginPct}%)</span>
                                  </div>
                                  <span className="text-[9px] font-mono font-bold px-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    异常排查
                                  </span>
                                </div>
                                <div className="space-y-1 font-sans">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">计划目标:</span>
                                    <span className="font-semibold font-mono">{spikeInfo.totalTarget}人</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">实际完成:</span>
                                    <span className="font-bold font-mono text-emerald-500">{spikeInfo.totalActual}人</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">超额差值:</span>
                                    <span className="font-bold font-mono text-amber-500">+{spikeInfo.diff}人</span>
                                  </div>
                                  <div className="flex justify-between border-t pt-1 mt-1 dark:border-slate-800 border-slate-100">
                                    <span className="text-slate-400">超出计划比例:</span>
                                    <span className="font-black font-mono text-amber-500">
                                      {spikeInfo.excessPct === Infinity ? "无计划暴增" : `+${spikeInfo.excessPct.toFixed(1)}%`}
                                    </span>
                                  </div>
                                  <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9.5px] text-amber-700 dark:text-amber-300 mt-1.5 leading-snug">
                                    ⚠️ 实际招生数大幅超出计划指标，请确认是否存在<strong>录入多填/重复录入</strong>或<strong>渠道爆单</strong>。
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 1. Deviation Badge */}
                          {(() => {
                            const threshold = deviationThresholdPct || 20;
                            const deviationRate = totalTarget > 0 ? (totalActual - totalTarget) / totalTarget : (totalActual > 0 ? Infinity : 0);
                            const devPct = Math.abs(deviationRate) * 100;
                            const hasDeviation = devPct >= threshold || (totalTarget === 0 && totalActual > 0);
                            if (!hasDeviation) return null;

                            const isUnder = deviationRate < 0;
                            const badgeText = deviationRate === Infinity ? "无计划爆发" : `${deviationRate > 0 ? "+" : ""}${(deviationRate * 100).toFixed(1)}%`;

                            return (
                              <div
                                className="relative flex items-center justify-center group/tooltip cursor-pointer"
                                onClick={() => onOpenDeviationModal?.()}
                              >
                                <span className={`px-1.5 py-0.2 rounded-md font-mono font-extrabold text-[9px] flex items-center gap-0.5 shadow-2xs border transition-all ${
                                  isUnder
                                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500 hover:text-white"
                                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-600 hover:text-white"
                                }`}>
                                  {isUnder ? <AlertTriangle className="w-2.5 h-2.5 shrink-0" /> : <Zap className="w-2.5 h-2.5 shrink-0" />}
                                  <span>{badgeText}</span>
                                </span>

                                {/* Tooltip Content */}
                                <div className={`absolute bottom-full mb-1.5 right-0 hidden group-hover/tooltip:block z-50 p-2.5 rounded-xl text-[10px] leading-relaxed shadow-2xl border w-52 text-left transition-all duration-200 ${
                                  isDarkMode 
                                    ? "bg-slate-900 border-slate-800 text-slate-200 shadow-black/90" 
                                    : "bg-white border-slate-200 text-slate-800 shadow-slate-200/90"
                                }`}>
                                  <div className={`font-black flex items-center justify-between mb-1.5 border-b pb-1 ${
                                    isUnder ? "text-rose-500 dark:border-slate-800 border-slate-100" : "text-emerald-500 dark:border-slate-800 border-slate-100"
                                  }`}>
                                    <div className="flex items-center gap-1">
                                      <Bell className="w-3.5 h-3.5 shrink-0" />
                                      <span>偏离预警 (±{threshold}%)</span>
                                    </div>
                                    <span className="text-[9px] font-mono font-bold px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                      {selectedDate}
                                    </span>
                                  </div>
                                  <div className="space-y-1 font-sans">
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">计划目标:</span>
                                      <span className="font-semibold font-mono">{totalTarget}人</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">实际完成:</span>
                                      <span className="font-semibold font-mono">{totalActual}人</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">偏差数量:</span>
                                      <span className={`font-semibold font-mono ${diff >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                        {diff > 0 ? `+${diff}` : diff}人
                                      </span>
                                    </div>
                                    <div className="flex justify-between border-t pt-1 mt-1 dark:border-slate-800 border-slate-100">
                                      <span className="text-slate-400">偏离比例:</span>
                                      <span className={`font-black font-mono ${!isUnder ? "text-emerald-500" : "text-rose-500"}`}>
                                        {badgeText}
                                      </span>
                                    </div>
                                    <div className="pt-1 mt-1 border-t dark:border-slate-800 border-slate-100 text-[9px] text-amber-500 font-bold flex items-center justify-between">
                                      <span>💡 点击打开预警诊断中心</span>
                                      <ChevronRight className="w-3 h-3" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* 2. Metadata Search Match Badge */}
                          {isMetaMatched && (() => {
                            const meta = MAJOR_METADATA[row.name];
                            if (!meta) return null;
                            return (
                              <div className="relative flex items-center justify-center group/metatooltip">
                                <span className="flex items-center justify-center bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm hover:bg-amber-600 transition-colors cursor-pointer select-none">
                                  简析
                                </span>
                                {/* Tooltip Content */}
                                <div className={`absolute bottom-full mb-1.5 right-0 hidden group-hover/metatooltip:block z-50 p-2.5 rounded-lg text-xs leading-relaxed shadow-xl border w-64 text-left transition-all duration-200 ${
                                  isDarkMode 
                                    ? "bg-slate-900 border-slate-800 text-slate-200 shadow-black/85" 
                                    : "bg-white border-slate-200 text-slate-800 shadow-slate-200/85"
                                }`}>
                                  <div className="font-bold text-amber-500 flex items-center gap-1.5 mb-1.5 border-b pb-1.5 dark:border-slate-800 border-slate-100 font-sans">
                                    <Search className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    {row.name} - 专业基础简析
                                  </div>
                                  <div className="space-y-1.5 font-sans text-xs">
                                    <p className="text-slate-500 dark:text-slate-400 font-semibold">简单摘要：</p>
                                    <p className="text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 p-1.5 rounded text-[11px] leading-relaxed border dark:border-slate-850 border-slate-100 font-medium font-sans">
                                      {meta.summary}
                                    </p>
                                    <p className="text-slate-500 dark:text-slate-400 font-semibold">基础描述：</p>
                                    <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed font-sans">
                                      {meta.description}
                                    </p>
                                    <p className="text-slate-500 dark:text-slate-400 font-semibold">核心关键词：</p>
                                    <div className="flex flex-wrap gap-1">
                                      {meta.keywords.map((kw, kwIdx) => (
                                        <span key={`meta-kw-${kw}-${kwIdx}`} className="bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-[10px] px-1 py-0.2 rounded border border-amber-500/20 font-sans">
                                          {kw}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* 3. Balance Verification Status Badge */}
                          {isVerified && (
                            <div
                              className="relative flex items-center justify-center cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveVerifyAuditRowId(activeVerifyAuditRowId === row.id ? null : row.id);
                              }}
                            >
                              <span
                                className={`px-1.5 py-0.5 rounded font-mono font-extrabold text-[9px] flex items-center gap-0.5 shadow-2xs border transition-all ${
                                  isImbalanced
                                    ? "bg-red-600 text-white border-red-700 hover:bg-red-700 animate-pulse"
                                    : "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
                                }`}
                                title={
                                  isImbalanced
                                    ? `【渠道核算不平衡】计划总和: ${totalTarget}人 ≠ 实际完成: ${totalActual}人 (差额: ${diff > 0 ? '+' : ''}${diff}人)。点击查看渠道核算清单`
                                    : `【渠道核算平衡】计划总和与实际完成总和一致 (${totalTarget}人)。点击查看渠道核算清单`
                                }
                              >
                                {isImbalanced ? (
                                  <>
                                    <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                    <span>不平衡</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCheck className="w-2.5 h-2.5 shrink-0" />
                                    <span>平衡</span>
                                  </>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 7 Channels Columns */}
                  {config.channels.map((_, chIdx) => {
                    const ch = row.channels[chIdx] || { target: 0, actual: 0 };
                    const targetColIdx = 1 + chIdx * 2;
                    const actualColIdx = 2 + chIdx * 2;

                    const compTargetClass = compareDate ? getComparisonHighlightClass(ch.target, getCompareValue(row, chIdx, 'target')) : "";
                    const targetBgClass = compTargetClass || getChannelCellClass(row, chIdx, true);

                    const compActualClass = compareDate ? getComparisonHighlightClass(ch.actual, getCompareValue(row, chIdx, 'actual')) : "";
                    const actualBgClass = compActualClass || getChannelCellClass(row, chIdx, false);

                    if (isMergedGroup) {
                      return (
                        <React.Fragment key={`cell-ch-merged-${row.id}-${chIdx}`}>
                          {/* Target cell (Merged Group) */}
                          <td className={`border-r text-center px-1 py-1.5 transition-all font-extrabold text-xs text-indigo-650 dark:text-indigo-400 ${
                            isDarkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-indigo-50/20"
                          }`}>
                            <div className="flex flex-col items-center justify-center">
                              <span>{ch.target === 0 ? "-" : ch.target}</span>
                              {compareDate && (
                                <span className="text-[9px] font-sans font-medium text-slate-500/80 scale-90 mt-0.5" title={`${compareDate} 目标`}>
                                  vs {getCompareValue(row, chIdx, 'target')}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Actual cell (Merged Group) */}
                          <td className={`border-r text-center px-1 py-1.5 transition-all font-extrabold text-xs text-indigo-500 dark:text-indigo-300 ${
                            isDarkMode ? "border-slate-800 bg-slate-950/60" : "border-slate-200 bg-indigo-50/10"
                          }`}>
                            <div className="flex flex-col items-center justify-center">
                              <span>{ch.actual === 0 ? "-" : ch.actual}</span>
                              {compareDate && (
                                <span className="text-[9px] font-sans font-medium text-slate-500/80 scale-90 mt-0.5" title={`${compareDate} 实际`}>
                                  vs {getCompareValue(row, chIdx, 'actual')}
                                </span>
                              )}
                            </div>
                          </td>
                        </React.Fragment>
                      );
                    }

                    return (
                      <React.Fragment key={`cell-ch-${row.id}-${chIdx}`}>
                        {/* Target cell */}
                        <td className={`border-r text-center p-0.5 transition-all cursor-pointer ${
                          isDarkMode ? "border-slate-800 border-r" : "border-slate-200"
                        } ${targetBgClass} ${getActiveCellClass(rIdx, targetColIdx)}`}
                          onClick={() => {
                            if (viewMode !== "monthly") {
                              if (quickEditMode) {
                                selectCell(rIdx, targetColIdx);
                              } else {
                                setEditingCell({
                                  rowIndex: originalIndex,
                                  colIndex: targetColIdx,
                                  rIdx,
                                  majorName: row.name,
                                  channelName: config.channels[chIdx],
                                  isTarget: true,
                                  value: ch.target === 0 ? "" : ch.target.toString()
                                });
                              }
                            }
                          }}
                        >
                          <div className={`w-full min-h-[38px] lg:min-h-0 py-1.5 lg:py-1 px-1 flex flex-col items-center justify-center font-bold text-xs select-none transition-all ${
                            isDarkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-800 hover:bg-emerald-50/50"
                          } ${viewMode === "monthly" ? "cursor-not-allowed text-slate-400 font-medium hover:bg-transparent" : ""}`}>
                            <span>
                              {activeCell && activeCell.rIdx === rIdx && activeCell.colIndex === targetColIdx
                                ? (activeCellValue === "" ? "-" : activeCellValue)
                                : (ch.target === 0 ? "-" : ch.target)}
                            </span>
                            {compareDate && (
                              <span className="text-[9px] font-sans font-medium text-slate-400/80 scale-90 mt-0.5" title={`${compareDate} 目标`}>
                                vs {getCompareValue(row, chIdx, 'target')}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actual cell */}
                        <td className={`border-r text-center p-0.5 transition-all cursor-pointer ${
                          isDarkMode ? "border-slate-800 border-r" : "border-slate-200"
                        } ${actualBgClass} ${getActiveCellClass(rIdx, actualColIdx)}`}
                          onClick={() => {
                            if (viewMode !== "monthly") {
                              if (quickEditMode) {
                                selectCell(rIdx, actualColIdx);
                              } else {
                                setEditingCell({
                                  rowIndex: originalIndex,
                                  colIndex: actualColIdx,
                                  rIdx,
                                  majorName: row.name,
                                  channelName: config.channels[chIdx],
                                  isTarget: false,
                                  value: ch.actual === 0 ? "" : ch.actual.toString()
                                });
                              }
                            }
                          }}
                        >
                          <div className={`w-full min-h-[38px] lg:min-h-0 py-1.5 lg:py-1 px-1 flex flex-col items-center justify-center font-bold text-xs select-none transition-all ${
                            isDarkMode ? "text-slate-205 hover:bg-slate-800" : "text-slate-800 hover:bg-emerald-50/50"
                          } ${viewMode === "monthly" ? "cursor-not-allowed text-slate-605 font-semibold hover:bg-transparent" : ""}`}>
                            <span>
                              {activeCell && activeCell.rIdx === rIdx && activeCell.colIndex === actualColIdx
                                ? (activeCellValue === "" ? "-" : activeCellValue)
                                : (ch.actual === 0 ? "-" : ch.actual)}
                            </span>
                            {compareDate && (
                              <span className="text-[9px] font-sans font-medium text-slate-400/80 scale-90 mt-0.5" title={`${compareDate} 实际`}>
                                vs {getCompareValue(row, chIdx, 'actual')}
                              </span>
                            )}
                          </div>
                        </td>
                      </React.Fragment>
                    );
                  })}

                  {/* Other Personnel */}
                  {(() => {
                    const compOtherClass = compareDate ? getComparisonHighlightClass(row.other, getCompareValue(row, undefined, 'other')) : "";
                    const otherBgClass = compOtherClass || (isDeviatingMoreThan20
                      ? (rowDeviationRate > 0.2
                          ? (isDarkMode ? "border-slate-800 bg-teal-900/35 text-teal-205" : "border-slate-200 bg-teal-50/70 text-teal-800")
                          : (isDarkMode ? "border-slate-800 bg-rose-900/35 text-rose-205" : "border-slate-200 bg-rose-50/70 text-rose-800")
                        )
                      : (isDarkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"));

                    if (isMergedGroup) {
                      return (
                        <td className={`border-r text-center px-1 py-1.5 font-extrabold text-xs text-indigo-650 dark:text-indigo-400 ${
                          isDarkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-indigo-50/20"
                        }`}>
                          <div className="flex flex-col items-center justify-center">
                            <span>{row.other === 0 ? "-" : row.other}</span>
                            {compareDate && (
                              <span className="text-[9px] font-sans font-medium text-slate-500/85 scale-90 mt-0.5" title={`${compareDate} 其他`}>
                                vs {getCompareValue(row, undefined, 'other')}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td className={`border-r text-center p-0.5 cursor-pointer ${otherBgClass} ${getActiveCellClass(rIdx, 15)}`}
                        onClick={() => {
                          if (viewMode !== "monthly") {
                            if (quickEditMode) {
                              selectCell(rIdx, 15);
                            } else {
                              setEditingCell({
                                rowIndex: originalIndex,
                                colIndex: 15,
                                rIdx,
                                majorName: row.name,
                                channelName: "其他自主咨询",
                                value: row.other === 0 ? "" : row.other.toString()
                              });
                            }
                          }
                        }}
                      >
                        <div className={`w-full min-h-[38px] lg:min-h-0 py-1.5 lg:py-1 px-1 flex flex-col items-center justify-center font-semibold text-xs select-none transition-all ${
                          isDarkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-emerald-50/50"
                        } ${viewMode === "monthly" ? "cursor-not-allowed text-slate-500 hover:bg-transparent" : ""}`}>
                          <span>
                            {activeCell && activeCell.rIdx === rIdx && activeCell.colIndex === 15
                              ? (activeCellValue === "" ? "-" : activeCellValue)
                              : (row.other === 0 ? "-" : row.other)}
                          </span>
                          {compareDate && (
                            <span className="text-[9px] font-sans font-medium text-slate-400/80 scale-90 mt-0.5" title={`${compareDate} 其他`}>
                              vs {getCompareValue(row, undefined, 'other')}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })()}

                  {/* Formula Cell: Total Target */}
                  {(() => {
                    const compTotalTargetClass = compareDate ? getComparisonHighlightClass(totalTarget, getCompareValue(row, undefined, 'totalTarget')) : "";
                    const totalTargetBgClass = compTotalTargetClass || (isDeviatingMoreThan20 && !isMergedGroup
                      ? (rowDeviationRate > 0.2
                          ? (isDarkMode ? "border-slate-800 bg-teal-950/40 text-teal-400" : "border-slate-200 bg-teal-50 text-teal-700")
                          : (isDarkMode ? "border-slate-800 bg-rose-950/40 text-rose-400" : "border-slate-200 bg-rose-50 text-rose-700")
                        )
                      : (isDarkMode ? "border-slate-800 bg-slate-900/60 text-slate-450" : "border-slate-200 bg-slate-50 text-slate-600"));

                    return (
                      <td className={`border-r text-center font-bold ${totalTargetBgClass}`}>
                        <div className="flex flex-col items-center justify-center py-0.5">
                          <span>{totalTarget}</span>
                          {compareDate && (
                            <span className="text-[9px] font-sans font-medium text-slate-400/85 scale-90 mt-0.5" title={`${compareDate} 总计划`}>
                              vs {getCompareValue(row, undefined, 'totalTarget')}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })()}

                  {/* Formula Cell: Total Actual */}
                  {(() => {
                    const compTotalActualClass = compareDate ? getComparisonHighlightClass(totalActual, getCompareValue(row, undefined, 'totalActual')) : "";
                    const totalActualBgClass = compTotalActualClass || (
                      isSpikeHighlighted
                        ? (isDarkMode ? "border-amber-800 bg-amber-950/70 text-amber-300 font-black ring-1 ring-amber-500/40" : "border-amber-300 bg-amber-100 text-amber-950 font-black ring-1 ring-amber-400")
                        : isDeviatingMoreThan20 && !isMergedGroup
                        ? (rowDeviationRate > 0.2
                            ? (isDarkMode ? "border-slate-800 bg-teal-900/40 text-teal-300 font-extrabold" : "border-slate-200 bg-teal-100/60 text-teal-850 font-extrabold")
                            : (isDarkMode ? "border-slate-800 bg-rose-900/40 text-rose-300 font-extrabold" : "border-slate-200 bg-rose-100/60 text-rose-850 font-extrabold")
                          )
                        : (isDarkMode ? "border-slate-800 bg-slate-900/60 text-emerald-450" : "border-slate-200 bg-slate-50 text-emerald-800")
                    );

                    return (
                      <td className={`border-r text-center font-bold ${totalActualBgClass}`}>
                        <div className="flex flex-col items-center justify-center py-0.5">
                          <div className="flex items-center gap-1">
                            <span>{totalActual}</span>
                            {isSpikeHighlighted && (
                              <span title={`超出目标 ${spikeInfo.excessPct.toFixed(0)}%`}>
                                <Zap className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                              </span>
                            )}
                          </div>
                          {compareDate && (
                            <span className="text-[9px] font-sans font-medium text-slate-450/90 scale-90 mt-0.5" title={`${compareDate} 总实际`}>
                              vs {getCompareValue(row, undefined, 'totalActual')}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })()}

                  {/* Formula Cell: Diff */}
                  {(() => {
                    const compDiffClass = compareDate ? getComparisonHighlightClass(diff, getCompareValue(row, undefined, 'diff')) : "";
                    const diffBgClass = compDiffClass || (
                      isSpikeHighlighted
                        ? (isDarkMode ? "bg-amber-950/80 text-amber-300 font-black ring-1 ring-amber-500/40" : "bg-amber-100/90 text-amber-950 font-black ring-1 ring-amber-400")
                        : isDeviatingMoreThan20 && !isMergedGroup
                        ? (rowDeviationRate > 0.2
                            ? (isDarkMode ? "bg-teal-950/50 text-teal-400 font-extrabold" : "bg-teal-100/80 text-teal-800 font-extrabold")
                            : (isDarkMode ? "bg-rose-950/50 text-rose-400 font-extrabold" : "bg-rose-100/80 text-rose-800 font-extrabold")
                          )
                        : (diff < 0
                            ? (isDarkMode ? "bg-red-950/20 text-red-400" : "bg-red-50 text-red-600")
                            : diff > 0
                            ? (isDarkMode ? "bg-emerald-950/25 text-emerald-400" : "bg-emerald-50 text-emerald-600")
                            : (isDarkMode ? "bg-slate-900 text-slate-500" : "bg-slate-50 text-slate-400")
                          )
                    );

                    const compDiffVal = getCompareValue(row, undefined, 'diff');

                    return (
                      <td className={`border-r text-center font-bold transition-colors ${
                        isDarkMode ? "border-slate-800" : "border-slate-200"
                      } ${diffBgClass}`}>
                        <div className="flex flex-col items-center justify-center py-0.5">
                          <span>{diff > 0 ? `+${diff}` : diff}</span>
                          {compareDate && (
                            <span className="text-[9px] font-sans font-medium text-slate-450/90 scale-90 mt-0.5" title={`${compareDate} 净差值`}>
                              vs {compDiffVal > 0 ? `+${compDiffVal}` : compDiffVal}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })()}

                  {/* Note Column with Popover */}
                  <td className={`border-r text-center p-0.5 relative ${
                    isDarkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"
                  }`}>
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => {
                          if (openNoteRowId === row.id) {
                            setOpenNoteRowId(null);
                          } else {
                            setOpenNoteRowId(row.id);
                            setTempNote(row.note || "");
                          }
                        }}
                        className={`p-2 lg:p-1 rounded transition-all relative flex items-center justify-center ${
                          row.note
                            ? "text-amber-500 hover:text-amber-600 bg-amber-500/10 hover:bg-amber-500/20"
                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                        title={row.note ? `备注: ${row.note}` : "添加备注"}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {row.note && (
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                        )}
                      </button>

                      {/* Popover */}
                      {openNoteRowId === row.id && (
                        <div className={`absolute right-0 bottom-full mb-2 w-64 p-3 rounded-xl shadow-xl border z-50 text-left transition-all ${
                          isDarkMode
                            ? "bg-slate-900 border-slate-800 text-slate-100 shadow-black/50"
                            : "bg-white border-slate-200 text-slate-800 shadow-slate-200"
                        }`}>
                          {viewMode === "monthly" || isMergedGroup ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between border-b pb-1.5 dark:border-slate-800 border-slate-100 font-sans">
                                <span className="font-extrabold text-[11px] text-indigo-500 flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3 text-indigo-550" />
                                  {isMergedGroup ? "合并专业备注汇总" : "月度备注汇总"} ({row.name})
                                </span>
                              </div>
                              <div className="text-[10px] space-y-1.5 max-h-36 overflow-y-auto leading-relaxed text-slate-500 dark:text-slate-400 font-sans">
                                {row.note ? (
                                  row.note.split("; ").map((singleNote, idx) => (
                                    <div key={`note-${row.id}-${idx}`} className="p-1 rounded bg-slate-50 dark:bg-slate-950 border dark:border-slate-850 border-slate-100 flex gap-1.5">
                                      <span className="text-slate-400 font-bold shrink-0">•</span>
                                      <span>{singleNote}</span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="italic text-center text-slate-400 py-2">该合并组/专业暂无任何备注记录</p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => setOpenNoteRowId(null)}
                                className="w-full text-center px-2 py-1 text-[10px] border rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-sans"
                              >
                                关闭
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between border-b pb-1.5 dark:border-slate-800 border-slate-100">
                                <span className="font-extrabold text-[11px] text-amber-550 flex items-center gap-1 font-sans">
                                  <StickyNote className="w-3 h-3 text-amber-500" />
                                  编辑行备注 ({row.name})
                                </span>
                              </div>
                              <textarea
                                value={tempNote}
                                onChange={(e) => setTempNote(e.target.value)}
                                placeholder="输入针对该行招生波动、渠道波峰/波谷的注释，如：'端午节假期导致线上咨询激增'"
                                className={`w-full h-20 text-[11px] p-2 border rounded-lg focus:ring-1 focus:ring-amber-500 resize-none focus:outline-none leading-relaxed font-sans ${
                                  isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                                }`}
                                autoFocus
                              />
                              <div className="flex justify-end gap-1.5 font-sans">
                                <button
                                  type="button"
                                  onClick={() => setOpenNoteRowId(null)}
                                  className="px-2 py-1 text-[10px] border rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                  取消
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleNoteSave(originalIndex, tempNote);
                                    setOpenNoteRowId(null);
                                  }}
                                  className="px-2.5 py-1 text-[10px] bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-md shadow-xs transition-colors"
                                >
                                  保存
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Action Column */}
                  <td className="text-center p-0.5">
                    <div className="flex items-center justify-center gap-1">
                      {/* Quick Verification Switch Button */}
                      {!isMergedGroup && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleVerifyRow(row.id);
                          }}
                          className={`px-1.5 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-0.5 cursor-pointer shadow-3xs ${
                            isVerified
                              ? (isImbalanced
                                  ? "bg-red-600 hover:bg-red-700 text-white border border-red-700 ring-1 ring-red-400 animate-pulse"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700")
                              : (isDarkMode
                                  ? "bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                                  : "bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-250")
                          }`}
                          title={
                            isVerified
                              ? (isImbalanced
                                  ? `【已核验-不平衡】所有渠道计划总和(${totalTarget}人) ≠ 实际完成总和(${totalActual}人)，差额: ${diff > 0 ? '+' : ''}${diff}人。点击取消核验`
                                  : `【已核验-平衡】所有渠道计划总和(${totalTarget}人) = 实际完成总和(${totalActual}人)。点击取消核验`)
                              : `点击快捷核对「${row.name}」所有渠道计划总和与实际完成总和`
                          }
                        >
                          {isVerified ? (
                            isImbalanced ? (
                              <ShieldAlert className="w-3 h-3 text-white shrink-0" />
                            ) : (
                              <ShieldCheck className="w-3 h-3 text-white shrink-0" />
                            )
                          ) : (
                            <Scale className="w-3 h-3 text-indigo-500 shrink-0" />
                          )}
                          <span className="hidden sm:inline">
                            {isVerified ? (isImbalanced ? "不平衡" : "平衡") : "核验"}
                          </span>
                        </button>
                      )}

                      {viewMode === "daily" && !isMergedGroup && (
                        <button
                          onClick={() => handleDeleteRow(originalIndex)}
                          className={`p-1.5 rounded transition-colors ${
                            isDarkMode ? "hover:bg-red-950/40 text-slate-500 hover:text-red-400" : "hover:bg-red-50 text-slate-400 hover:text-red-500"
                          }`}
                          title="删除此行专业"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Quick row append indicator */}
            {viewMode === "daily" && (
              <tr>
                <td className={`border-r text-center font-bold sticky left-0 z-20 ${
                  isDarkMode ? "border-slate-800 bg-slate-900/60 text-slate-600" : "border-slate-200 bg-slate-150 text-slate-400"
                }`}>*</td>
                <td
                  colSpan={21}
                  onClick={handleAddRow}
                  className={`border-r p-2 italic cursor-pointer transition-colors font-sans text-left pl-4 font-medium ${
                    isDarkMode 
                      ? "border-slate-800 bg-slate-900/40 text-slate-500 hover:text-slate-300 hover:bg-slate-900" 
                      : "border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  + 点击此处快速插入一行新招生专业数据 (可使用 Tab / Enter 在行格间流畅切换)...
                </td>
              </tr>
            )}

            {/* Empty Search State */}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={22} className={`py-12 text-center font-sans ${
                  isDarkMode ? "bg-slate-950 text-slate-500" : "bg-slate-50 text-slate-400"
                }`}>
                  没有找到匹配的专业名称。您可以尝试更换关键词或清除筛选。
                </td>
              </tr>
            )}
          </tbody>

          {/* Footer Aggregate Rows */}
          <tfoot className={`sticky bottom-0 z-35 border-t shadow-[0_-1px_0_rgba(0,0,0,0.08)] ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-300"
          }`}>
            {/* Aggregate Row 1: 合计 (Total) */}
            <tr className={`font-bold border-b ${
              isDarkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-slate-100 border-slate-200 text-slate-800"
            }`}>
              <td
                colSpan={2}
                className={`border-r px-3 py-1.5 text-center font-bold sticky left-0 z-20 shadow-[1px_0_0_rgba(0,0,0,0.05)] font-sans ${
                  isDarkMode ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-slate-200 border-slate-200 text-slate-700"
                }`}
              >
                合计 (Total)
              </td>

              {/* Channel Totals */}
              {channelTotals.map((ch, chIdx) => (
                <React.Fragment key={`total-ch-${chIdx}`}>
                  <td className={`border-r text-center py-1 ${
                    isDarkMode ? "border-slate-800 bg-slate-900 text-slate-400" : "border-slate-200 bg-slate-100 text-slate-600"
                  }`}>
                    {ch.targetSum}
                  </td>
                  <td className={`border-r text-center py-1 ${
                    isDarkMode ? "border-slate-800 bg-slate-950 text-slate-200" : "border-slate-200 bg-white text-slate-800"
                  }`}>
                    {ch.actualSum}
                  </td>
                </React.Fragment>
              ))}

              {/* Other Personnel Total */}
              <td className={`border-r text-center py-1 ${
                isDarkMode ? "border-slate-800 bg-slate-900 text-slate-300" : "border-slate-200 bg-slate-100 text-slate-700"
              }`}>
                {otherTotal}
              </td>

              {/* Overall Target Total */}
              <td className={`border-r text-center py-1 ${
                isDarkMode ? "border-slate-800 bg-slate-900 text-slate-300" : "border-slate-200 bg-slate-150 text-slate-800"
              }`}>
                {overallTargetTotal}
              </td>

              {/* Overall Actual Total */}
              <td className={`border-r text-center py-1 font-extrabold ${
                isDarkMode ? "border-slate-800 bg-slate-900 text-emerald-400" : "border-slate-200 bg-slate-150 text-emerald-800"
              }`}>
                {overallActualTotal}
              </td>

              {/* Overall Diff */}
              <td
                className={`border-r text-center py-1 ${
                  isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-slate-150"
                } ${
                  overallDiff < 0 
                    ? (isDarkMode ? "text-red-400 font-extrabold" : "text-red-700 font-extrabold") 
                    : (isDarkMode ? "text-emerald-400 font-extrabold" : "text-emerald-700 font-extrabold")
                }`}
              >
                {overallDiff > 0 ? `+${overallDiff}` : overallDiff}
              </td>

              {/* Note Column Empty Cell */}
              <td className={`border-r ${
                isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-slate-100"
              }`}></td>

              <td className={isDarkMode ? "bg-slate-950 border-l border-slate-800" : "bg-slate-200 border-l border-slate-200"}></td>
            </tr>

            {/* Aggregate Row 2: 与目标之差 (Diff Total) */}
            <tr className={`font-bold border-b ${
              isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-700"
            }`}>
              <td
                colSpan={2}
                className={`border-r px-3 py-1.5 text-center font-bold sticky left-0 z-20 shadow-[1px_0_0_rgba(0,0,0,0.05)] font-sans ${
                  isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"
                }`}
              >
                与目标之差
              </td>

              {/* Channel Diffs */}
              {channelTotals.map((ch, chIdx) => (
                <td
                  key={`diff-ch-${chIdx}`}
                  colSpan={2}
                  className={`border-r text-center py-1 ${
                    isDarkMode ? "border-slate-800" : "border-slate-200"
                  } ${
                    ch.diff < 0 
                      ? (isDarkMode ? "text-red-400 bg-red-950/20" : "text-red-600 bg-red-50/40") 
                      : (isDarkMode ? "text-emerald-400 bg-emerald-950/20" : "text-emerald-600 bg-emerald-50/40")
                  }`}
                >
                  {ch.diff > 0 ? `+${ch.diff}` : ch.diff}
                </td>
              ))}

              <td className={`border-r ${isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-slate-50"}`}></td>
              <td className={`border-r ${isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-slate-50"}`}></td>
              <td className={`border-r ${isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-slate-50"}`}></td>

              {/* Overall Diff Repeat */}
              <td
                className={`border-r text-center py-1 font-extrabold ${
                  isDarkMode ? "border-slate-800" : "border-slate-200"
                } ${
                  overallDiff < 0 
                    ? (isDarkMode ? "text-red-400 bg-red-950/20" : "text-red-700 bg-red-50/40") 
                    : (isDarkMode ? "text-emerald-400 bg-emerald-950/20" : "text-emerald-700 bg-emerald-50/40")
                }`}
              >
                {overallDiff > 0 ? `+${overallDiff}` : overallDiff}
              </td>

              {/* Note Column Empty Cell */}
              <td className={`border-r ${
                isDarkMode ? "border-slate-800 bg-slate-905" : "border-slate-200 bg-slate-50"
              }`}></td>

              <td className={isDarkMode ? "bg-slate-950" : "bg-slate-100"}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Grid Status Info footer overlay */}
      <div className={`flex flex-row items-center justify-between px-4 py-1.5 border-t text-[11px] font-medium transition-colors duration-200 ${
        isDarkMode ? "bg-slate-900 border-slate-850 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
      }`}>
        <div className="flex items-center space-x-4">
          <span className="flex items-center text-emerald-505 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
            实时双向绑定就绪 (Formula Sync Active)
          </span>
          <span className={isDarkMode ? "text-slate-700" : "text-slate-300"}>|</span>
          <span>筛选专业数: <strong className={isDarkMode ? "text-slate-300 font-bold" : "text-slate-700 font-bold"}>{filteredRows.length}</strong> / 总行数: {rows.length}</span>
        </div>
        <div className="flex items-center space-x-3 text-slate-450">
          <span>Excel 兼容格模式</span>
          <span>按 Shift+Tab 或 Enter 智能导航</span>
        </div>
      </div>

      {/* Floating Popup Editor Modal */}
      <AnimatePresence>
        {editingCell && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                // Save current and close
                handleCellChange(editingCell.rowIndex, editingCell.colIndex, editingCell.value);
                setEditingCell(null);
              }}
              className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className={`relative w-full max-w-md p-6 rounded-2xl shadow-2xl border ${
                isDarkMode 
                  ? "bg-slate-900 border-slate-800 text-slate-100 shadow-black/80" 
                  : "bg-white border-slate-200 text-slate-850 shadow-slate-200/60"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b dark:border-slate-850 border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest">
                    {editingCell.channelName ? `${editingCell.channelName} · ` : ""}
                    {editingCell.colIndex === 0 ? "编辑专业名称" : editingCell.isTarget ? "指标设定" : "实际数登记"}
                  </span>
                  <h3 className="text-sm font-bold truncate max-w-[260px] dark:text-slate-300">
                    {editingCell.majorName}
                  </h3>
                </div>
                
                {/* Navigation controls & Close */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleNavigateCell("prev")}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      isDarkMode 
                        ? "border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200" 
                        : "border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800"
                    }`}
                    title="上一个单元格 (Shift+Tab)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigateCell("next")}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      isDarkMode 
                        ? "border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200" 
                        : "border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800"
                    }`}
                    title="下一个单元格 (Tab / Enter)"
                  >
                    <span className="transform rotate-180 block">
                      <ChevronLeft className="w-4 h-4" />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleCellChange(editingCell.rowIndex, editingCell.colIndex, editingCell.value);
                      setEditingCell(null);
                    }}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ml-1 ${
                      isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200" : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main edit area */}
              <div className="space-y-4">
                <div className="relative">
                  <input
                    id="floating-editor-input"
                    type="text"
                    autoFocus
                    value={editingCell.value}
                    inputMode={editingCell.colIndex === 0 ? "text" : "numeric"}
                    pattern={editingCell.colIndex === 0 ? undefined : "[0-9]*"}
                    onChange={(e) => {
                      setEditingCell({
                        ...editingCell,
                        value: e.target.value
                      });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCellChange(editingCell.rowIndex, editingCell.colIndex, editingCell.value);
                        setEditingCell(null);
                      } else if (e.key === "Tab") {
                        e.preventDefault();
                        handleNavigateCell(e.shiftKey ? "prev" : "next");
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        setEditingCell(null);
                      }
                    }}
                    placeholder={editingCell.colIndex === 0 ? "请输入专业名称" : "请输入数值"}
                    className={`w-full px-4 py-3 rounded-xl border text-base font-bold text-center outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      isDarkMode 
                        ? "bg-slate-950 border-slate-800 text-slate-100 focus:border-emerald-500" 
                        : "bg-slate-50 border-slate-200 text-slate-850 focus:border-emerald-500 focus:bg-white"
                    }`}
                  />
                </div>

                {/* Tactile adjustment buttons for numbers */}
                {editingCell.colIndex !== 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "-10", value: -10 },
                      { label: "-5", value: -5 },
                      { label: "-1", value: -1 },
                      { label: "+1", value: 1 },
                      { label: "+5", value: 5 },
                      { label: "+10", value: 10 },
                    ].map((btn, bIdx) => (
                      <button
                        key={`btn-${btn.label}-${bIdx}`}
                        type="button"
                        onClick={() => {
                          const currentNum = parseInt(editingCell.value, 10) || 0;
                          const nextNum = Math.max(0, currentNum + btn.value);
                          setEditingCell({
                            ...editingCell,
                            value: nextNum === 0 ? "" : nextNum.toString()
                          });
                        }}
                        className={`py-2 px-1 text-xs font-bold rounded-lg border active:scale-95 transition-all cursor-pointer ${
                          isDarkMode 
                            ? "border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-300" 
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-650"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                    
                    {/* Zero out and Clear */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCell({
                          ...editingCell,
                          value: ""
                        });
                      }}
                      className={`col-span-2 py-2 px-1 text-xs font-bold rounded-lg border active:scale-95 transition-all cursor-pointer ${
                        isDarkMode 
                          ? "border-slate-800 bg-slate-850/40 hover:bg-slate-800 text-rose-400" 
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-rose-600"
                      }`}
                    >
                      清空 ⌫
                    </button>
                  </div>
                )}

                {/* Save and Close row */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleCellChange(editingCell.rowIndex, editingCell.colIndex, editingCell.value);
                      setEditingCell(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all text-white flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    确认保存 (Enter)
                  </button>
                </div>
              </div>

              {/* Tip info */}
              <div className="mt-4 pt-3 border-t border-dashed dark:border-slate-850 border-slate-150 text-[11px] text-slate-400 flex items-center justify-between">
                <span>💡 提示: 支持键盘快捷操作</span>
                <span className="font-mono">Tab/Enter: 下一格 | Esc: 取消</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Numeric Keypad & Editor for Quick Edit Mode */}
      <AnimatePresence>
        {quickEditMode && activeCell && (() => {
          const row = processedRows[activeCell.rIdx];
          if (!row) return null;
          
          const isNumeric = activeCell.colIndex > 0;
          let cellLabel = "";
          if (activeCell.colIndex === 0) {
            cellLabel = "专业名称";
          } else if (activeCell.colIndex === 15) {
            cellLabel = "其他人员";
          } else {
            const chIdx = Math.floor((activeCell.colIndex - 1) / 2);
            const isTarget = (activeCell.colIndex - 1) % 2 === 0;
            const channelName = config.channels[chIdx];
            cellLabel = `${channelName} · ${isTarget ? "目标数" : "实际数"}`;
          }

          return (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`fixed bottom-6 right-6 z-[1001] w-80 rounded-2xl border shadow-2xl p-4 transition-all ${
                isDarkMode 
                  ? "bg-slate-900/95 border-slate-800 text-slate-100 shadow-black/90 backdrop-blur-md" 
                  : "bg-white/95 border-slate-200 text-slate-800 shadow-slate-350/50 backdrop-blur-md"
              }`}
            >
              {/* Keypad Header */}
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-850">
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider">
                      快捷编辑 · {cellLabel}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold truncate max-w-[180px] dark:text-slate-300">
                    {row.name}
                  </h4>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[9px] text-slate-400 font-medium px-1.5 py-0.5 rounded bg-slate-500/10" title="可直接使用电脑方向键和数字键">
                    💡 提示
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      saveActiveCellValue(activeCell.rIdx, activeCell.colIndex, activeCellValue);
                      setActiveCell(null);
                    }}
                    className={`p-1 rounded-lg transition-colors cursor-pointer ${
                      isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-slate-205" : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Value Field Display */}
              <div className="relative mb-3">
                <input
                  id="quick-edit-keypad-input"
                  type="text"
                  value={activeCellValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (isNumeric) {
                      const cleaned = val.replace(/[^0-9]/g, "");
                      updateActiveCellValueInState(cleaned);
                    } else {
                      updateActiveCellValueInState(val);
                    }
                  }}
                  placeholder={isNumeric ? "0" : "输入专业名称"}
                  className={`w-full px-3 py-2 rounded-xl border text-center font-mono font-extrabold text-lg outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                    isDarkMode 
                      ? "bg-slate-950 border-slate-800 text-slate-100" 
                      : "bg-slate-50 border-slate-200 text-slate-850"
                  }`}
                />
              </div>

              {/* Touch Keyboard Area */}
              {isNumeric ? (
                /* Numeric Tactile Keypad */
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-1.5">
                    {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num, nIdx) => (
                      <button
                        key={`num-${num}-${nIdx}`}
                        type="button"
                        onClick={() => {
                          updateActiveCellValueInState(activeCellValue + num.toString());
                        }}
                        className={`py-3 text-base font-extrabold rounded-xl border active:scale-95 transition-all cursor-pointer ${
                          isDarkMode 
                            ? "border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-200 active:bg-slate-750" 
                            : "border-slate-150 bg-slate-50 hover:bg-slate-100 text-slate-700 active:bg-slate-200"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                    
                    {/* Clear Button */}
                    <button
                      type="button"
                      onClick={() => updateActiveCellValueInState("")}
                      className={`py-3 text-sm font-bold rounded-xl border active:scale-95 transition-all cursor-pointer ${
                        isDarkMode 
                          ? "border-slate-800 bg-rose-950/20 text-rose-400 hover:bg-rose-950/40" 
                          : "border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-600"
                      }`}
                    >
                      清空
                    </button>

                    {/* Zero */}
                    <button
                      type="button"
                      onClick={() => {
                        updateActiveCellValueInState(activeCellValue + "0");
                      }}
                      className={`py-3 text-base font-extrabold rounded-xl border active:scale-95 transition-all cursor-pointer ${
                        isDarkMode 
                          ? "border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-200" 
                          : "border-slate-150 bg-slate-50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      0
                    </button>

                    {/* Backspace Button */}
                    <button
                      type="button"
                      onClick={() => {
                        updateActiveCellValueInState(activeCellValue.slice(0, -1));
                      }}
                      className={`py-3 text-base font-bold rounded-xl border active:scale-95 transition-all cursor-pointer ${
                        isDarkMode 
                          ? "border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-300" 
                          : "border-slate-150 bg-slate-50 hover:bg-slate-100 text-slate-650"
                      }`}
                    >
                      ⌫
                    </button>
                  </div>

                  {/* Increment/Decrement Shortcuts */}
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: "-10", val: -10 },
                      { label: "-1", val: -1 },
                      { label: "+1", val: 1 },
                      { label: "+10", val: 10 }
                    ].map((step, sIdx) => (
                      <button
                        key={`step-${step.label}-${sIdx}`}
                        type="button"
                        onClick={() => {
                          const currentNum = parseInt(activeCellValue, 10) || 0;
                          const nextNum = Math.max(0, currentNum + step.val);
                          updateActiveCellValueInState(nextNum === 0 ? "" : nextNum.toString());
                        }}
                        className={`py-1.5 text-xs font-bold rounded-lg border active:scale-95 transition-all cursor-pointer ${
                          isDarkMode 
                            ? "border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-300" 
                            : "border-slate-150 bg-slate-50 hover:bg-slate-100 text-slate-650"
                        }`}
                      >
                        {step.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Text Editor Action for Name Column */
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-405">
                    您正在编辑专业名称。请使用系统键盘输入，或点击下方确认保存。
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      saveActiveCellValue(activeCell.rIdx, activeCell.colIndex, activeCellValue);
                    }}
                    className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>确认修改名称</span>
                  </button>
                </div>
              )}

              {/* Navigation Pad */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] text-slate-400 font-bold">表格导航:</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const e = new KeyboardEvent("keydown", { key: "ArrowUp" });
                      window.dispatchEvent(e);
                    }}
                    className={`p-1.5 text-xs rounded-lg border transition-all cursor-pointer ${
                      isDarkMode ? "border-slate-800 bg-slate-850 text-slate-300 hover:bg-slate-800" : "border-slate-200 bg-white text-slate-650 hover:bg-slate-50 shadow-3xs"
                    }`}
                    title="上一个单元格 (ArrowUp)"
                  >
                    ⬆️
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const e = new KeyboardEvent("keydown", { key: "ArrowDown" });
                      window.dispatchEvent(e);
                    }}
                    className={`p-1.5 text-xs rounded-lg border transition-all cursor-pointer ${
                      isDarkMode ? "border-slate-800 bg-slate-850 text-slate-300 hover:bg-slate-800" : "border-slate-200 bg-white text-slate-650 hover:bg-slate-50 shadow-3xs"
                    }`}
                    title="下一个单元格 (ArrowDown)"
                  >
                    ⬇️
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const e = new KeyboardEvent("keydown", { key: "ArrowLeft" });
                      window.dispatchEvent(e);
                    }}
                    className={`p-1.5 text-xs rounded-lg border transition-all cursor-pointer ${
                      isDarkMode ? "border-slate-800 bg-slate-850 text-slate-300 hover:bg-slate-800" : "border-slate-200 bg-white text-slate-650 hover:bg-slate-50 shadow-3xs"
                    }`}
                    title="左一个单元格 (ArrowLeft)"
                  >
                    ⬅️
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const e = new KeyboardEvent("keydown", { key: "ArrowRight" });
                      window.dispatchEvent(e);
                    }}
                    className={`p-1.5 text-xs rounded-lg border transition-all cursor-pointer ${
                      isDarkMode ? "border-slate-800 bg-slate-850 text-slate-300 hover:bg-slate-800" : "border-slate-200 bg-white text-slate-650 hover:bg-slate-50 shadow-3xs"
                    }`}
                    title="右一个单元格 (ArrowRight)"
                  >
                    ➡️
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    saveActiveCellValue(activeCell.rIdx, activeCell.colIndex, activeCellValue);
                    setActiveCell(null);
                  }}
                  className="px-3 py-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg cursor-pointer transition-all shrink-0"
                >
                  保存并关闭
                </button>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Verification Audit Breakdown Modal / Overlay */}
      {activeVerifyAuditRowId && (() => {
        const auditRow = currentRows.find((r) => r.id === activeVerifyAuditRowId);
        if (!auditRow) return null;

        const { totalTarget, totalActual, diff } = getRowCalculations(auditRow);
        const isImbalanced = totalActual !== totalTarget;
        const completionRate = totalTarget > 0 ? (totalActual / totalTarget) * 100 : (totalActual > 0 ? 100 : 0);

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all ${
              isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
            }`}>
              {/* Header */}
              <div className={`px-5 py-4 border-b flex items-center justify-between ${
                isImbalanced
                  ? (isDarkMode ? "bg-red-950/40 border-red-900/60" : "bg-red-50 border-red-200")
                  : (isDarkMode ? "bg-emerald-950/40 border-emerald-900/60" : "bg-emerald-50 border-emerald-200")
              }`}>
                <div className="flex items-center gap-2">
                  {isImbalanced ? (
                    <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                  )}
                  <div>
                    <h3 className="font-extrabold text-sm flex items-center gap-2">
                      <span>专业全渠道计划与完成核验</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                        isImbalanced
                          ? "bg-red-600 text-white shadow-xs"
                          : "bg-emerald-600 text-white shadow-xs"
                      }`}>
                        {isImbalanced ? "⚠️ 计划与实际不平衡" : "✔️ 计划与实际平衡"}
                      </span>
                    </h3>
                    <p className={`text-xs font-medium mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                      专业：<strong className="text-indigo-500">{auditRow.name}</strong> ｜ 日期：{selectedDate}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveVerifyAuditRowId(null)}
                  className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 text-xs font-sans">
                {/* Result Card */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isImbalanced
                    ? (isDarkMode ? "bg-red-950/20 border-red-900/40 text-red-200" : "bg-red-50/70 border-red-200 text-red-900")
                    : (isDarkMode ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-200" : "bg-emerald-50/70 border-emerald-200 text-emerald-900")
                }`}>
                  <div>
                    <p className="text-[11px] opacity-80">核对结论与差额状态</p>
                    <p className="text-base font-black font-mono mt-0.5">
                      {isImbalanced
                        ? `差额: ${diff > 0 ? `+${diff}` : diff} 人 (${diff > 0 ? "超出计划" : "未达计划"})`
                        : "计划目标与实际完成完全吻合 (0 差额)"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] opacity-80">当前达成率</p>
                    <p className="text-base font-black font-mono mt-0.5">
                      {completionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Mathematical Equation Breakdown */}
                <div className="space-y-3">
                  {/* Target Sum */}
                  <div className={`p-3 rounded-xl border ${
                    isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-500 dark:text-slate-400">
                        ① 计划总和 (Σ Channels Target):
                      </span>
                      <span className="font-mono font-extrabold text-sm text-indigo-500">
                        {totalTarget} 人
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-mono">
                      {config.channels.map((chName, idx) => (
                        <div key={`target-detail-${idx}`} className={`p-1.5 rounded border ${
                          isDarkMode ? "bg-slate-900 border-slate-855 text-slate-300" : "bg-white border-slate-150 text-slate-700"
                        }`}>
                          <div className="text-[10px] text-slate-400 truncate">{chName}</div>
                          <div className="font-bold">{auditRow.channels[idx]?.target || 0} 人</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actual Sum */}
                  <div className={`p-3 rounded-xl border ${
                    isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-500 dark:text-slate-400">
                        ② 实际完成总和 (Σ Channels Actual + Other):
                      </span>
                      <span className="font-mono font-extrabold text-sm text-emerald-500">
                        {totalActual} 人
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-mono">
                      {config.channels.map((chName, idx) => (
                        <div key={`actual-detail-${idx}`} className={`p-1.5 rounded border ${
                          isDarkMode ? "bg-slate-900 border-slate-855 text-slate-300" : "bg-white border-slate-150 text-slate-700"
                        }`}>
                          <div className="text-[10px] text-slate-400 truncate">{chName}</div>
                          <div className="font-bold">{auditRow.channels[idx]?.actual || 0} 人</div>
                        </div>
                      ))}
                      <div className={`p-1.5 rounded border ${
                        isDarkMode ? "bg-slate-900 border-slate-855 text-slate-300" : "bg-white border-slate-150 text-slate-700"
                      }`}>
                        <div className="text-[10px] text-slate-400 truncate">其他自主渠道</div>
                        <div className="font-bold">{auditRow.other || 0} 人</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className={`px-5 py-3 border-t flex items-center justify-between gap-2 ${
                isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    handleToggleVerifyRow(auditRow.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    verifiedRowIds.includes(auditRow.id)
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                  }`}
                >
                  {verifiedRowIds.includes(auditRow.id) ? "取消该行核验标红" : "核验并标红提示"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVerifyAuditRowId(null)}
                  className="px-4 py-1.5 rounded-xl font-bold text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
