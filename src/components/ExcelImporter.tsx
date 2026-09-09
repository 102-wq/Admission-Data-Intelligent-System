/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { RowData, TableConfig } from "../types";
import { 
  Upload, 
  X, 
  Check, 
  FileSpreadsheet, 
  AlertCircle, 
  Info, 
  ArrowDownToLine,
  Camera,
  Sparkles,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  AlertTriangle,
  Trash2,
  Edit3,
  Filter
} from "lucide-react";
import { MAJOR_METADATA } from "../data";

// Chinese similarity helper (Jaccard on characters + Substring boost)
function getChineseSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  const set1 = new Set(s1.split(""));
  const set2 = new Set(s2.split(""));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  if (union.size === 0) return 0;
  const jaccard = intersection.size / union.size;

  // Substring boost
  if (s1.includes(s2) || s2.includes(s1)) {
    return Math.min(1.0, Math.max(jaccard, 0.7) + 0.15);
  }
  return jaccard;
}

function findBestMatch(name: string): { suggestedName: string | null; similarity: number } {
  let bestName: string | null = null;
  let bestScore = 0;

  const standardNames = Object.keys(MAJOR_METADATA);
  for (const stdName of standardNames) {
    if (name === stdName) {
      return { suggestedName: stdName, similarity: 1.0 };
    }
    const score = getChineseSimilarity(name, stdName);
    if (score > bestScore) {
      bestScore = score;
      bestName = stdName;
    }
  }

  return { suggestedName: bestName, similarity: bestScore };
}

interface ValidationRow {
  id: string;
  seq: number;
  name: string;
  originalName: string;
  channels: { target: number; actual: number }[];
  other: number;
  isValid: boolean;
  isSkipped: boolean;
  suggestedName: string | null;
  errorType: "none" | "spelling" | "mismatch";
}

interface ExcelImporterProps {
  onImport: (importedRows: RowData[], mode: "overwrite" | "append") => void;
  config: TableConfig;
  selectedDate: string;
  isDarkMode?: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export default function ExcelImporter({
  onImport,
  config,
  selectedDate,
  isDarkMode = false,
  onClose,
  onToast
}: ExcelImporterProps) {
  // Tabs: "excel" or "ocr"
  const [activeTab, setActiveTab] = useState<"excel" | "ocr">("excel");
  
  // Excel state
  const [isDragging, setIsDragging] = useState(false);
  const [parsedRows, setParsedRows] = useState<Partial<RowData>[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [importMode, setImportMode] = useState<"overwrite" | "append">("append");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation state
  const [validationRows, setValidationRows] = useState<ValidationRow[]>([]);
  const [onlyShowErrors, setOnlyShowErrors] = useState<boolean>(false);

  const initValidationRows = (rows: Partial<RowData>[]) => {
    const validated = rows.map((row, idx) => {
      const name = row.name || "";
      const isExact = Object.keys(MAJOR_METADATA).includes(name);
      
      let errorType: "none" | "spelling" | "mismatch" = "none";
      let suggestedName: string | null = null;
      
      if (!isExact) {
        const { suggestedName: suggested, similarity } = findBestMatch(name);
        if (suggested && similarity >= 0.25) {
          errorType = "spelling";
          suggestedName = suggested;
        } else {
          errorType = "mismatch";
        }
      }

      return {
        id: row.id || `row-${Date.now()}-${idx}`,
        seq: row.seq || idx + 1,
        name,
        originalName: name,
        channels: row.channels || Array.from({ length: config.channels.length }, () => ({ target: 0, actual: 0 })),
        other: row.other || 0,
        isValid: isExact,
        isSkipped: false,
        suggestedName,
        errorType
      };
    });
    setValidationRows(validated);
  };

  const handleAutoFixAll = () => {
    setValidationRows(prev => prev.map(row => {
      if (row.errorType === "spelling" && row.suggestedName) {
        return {
          ...row,
          name: row.suggestedName,
          isValid: true,
          errorType: "none",
          suggestedName: null
        };
      }
      return row;
    }));
    onToast("✨ 已自动将所有可疑拼写的专业修正为标准名称！");
  };

  const handleAdoptSuggestion = (rowId: string) => {
    setValidationRows(prev => prev.map(row => {
      if (row.id === rowId && row.suggestedName) {
        return {
          ...row,
          name: row.suggestedName,
          isValid: true,
          errorType: "none",
          suggestedName: null
        };
      }
      return row;
    }));
    onToast("✅ 已采纳建议名称");
  };

  const handleUpdateRowName = (rowId: string, newName: string) => {
    const isExact = Object.keys(MAJOR_METADATA).includes(newName);
    
    setValidationRows(prev => prev.map(row => {
      if (row.id === rowId) {
        let errorType: "none" | "spelling" | "mismatch" = "none";
        let suggestedName: string | null = null;
        
        if (!isExact) {
          const { suggestedName: suggested, similarity } = findBestMatch(newName);
          if (suggested && similarity >= 0.25) {
            errorType = "spelling";
            suggestedName = suggested;
          } else {
            errorType = "mismatch";
          }
        }
        
        return {
          ...row,
          name: newName,
          isValid: isExact,
          errorType,
          suggestedName
        };
      }
      return row;
    }));
  };

  const handleToggleSkipRow = (rowId: string) => {
    setValidationRows(prev => prev.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          isSkipped: !row.isSkipped
        };
      }
      return row;
    }));
  };

  // OCR state
  const [selectedImage, setSelectedImage] = useState<{
    base64: string;
    mimeType: string;
    previewUrl: string;
    name: string;
  } | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrLoadingStep, setOcrLoadingStep] = useState(0);
  const [extractedDate, setExtractedDate] = useState<string>("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Interval for fancy OCR step transitions
  const stepTimerRef = useRef<any>(null);

  const startOcrStepSimulator = () => {
    setOcrLoadingStep(0);
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    stepTimerRef.current = setInterval(() => {
      setOcrLoadingStep((prev) => {
        if (prev < 2) return prev + 1;
        return prev;
      });
    }, 2200);
  };

  const stopOcrStepSimulator = () => {
    if (stepTimerRef.current) {
      clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
  };

  const processFile = (file: File) => {
    if (!file) return;
    const name = file.name;
    const extension = name.split(".").pop()?.toLowerCase();
    if (extension !== "xlsx" && extension !== "xls" && extension !== "csv") {
      onToast("❌ 仅支持导入 .xlsx, .xls 或 .csv 格式的文件！");
      return;
    }

    setFileName(name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let workbook: XLSX.WorkBook;
        if (extension === "csv") {
          const text = new TextDecoder().decode(data as ArrayBuffer);
          workbook = XLSX.read(text, { type: "string" });
        } else {
          const bytes = new Uint8Array(data as ArrayBuffer);
          workbook = XLSX.read(bytes, { type: "array" });
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // Convert sheet to JSON array of arrays (header: 1) for manual robust parsing
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (rawRows.length < 2) {
          onToast("❌ 表格数据不完整，未检测到有效行！");
          return;
        }

        // Parse logic
        // We'll search for the header row.
        // Usually, a header row has "专业/基础名称" or "专业" or similar.
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(10, rawRows.length); i++) {
          const row = rawRows[i];
          if (row && row.some(cell => typeof cell === "string" && (cell.includes("专业") || cell.includes("基础名称")))) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          // Fallback: assume row 1 is header
          headerRowIndex = rawRows[0] && rawRows[0].length > 0 ? 0 : 1;
        }

        // Read headers
        const headers = (rawRows[headerRowIndex] || []).map(h => String(h || "").trim());
        const subHeaders = (rawRows[headerRowIndex + 1] || []).map(h => String(h || "").trim());

        // Find columns indices
        const nameColIndex = headers.findIndex(h => h.includes("专业") || h.includes("名称") || h === "科类");
        const otherColIndex = headers.findIndex(h => h.includes("其他人员") || h.includes("其他"));

        // Match 7 channel columns
        // Map channel indices
        const channelMappings: { channelIdx: number; targetCol: number; actualCol: number }[] = [];

        config.channels.forEach((channelName, chIdx) => {
          // Find the column index for channelName in headers
          let targetCol = -1;
          let actualCol = -1;

          // 1. Exact match from exported multi-row headers
          // Header Row 1 has the channel name, Header Row 2 has "计划目标" and "实际完成"
          for (let c = 0; c < headers.length; c++) {
            if (headers[c] === channelName) {
              targetCol = c;
              actualCol = c + 1;
              break;
            }
          }

          // 2. Loose fallback (single-line headers containing channel name)
          if (targetCol === -1) {
            headers.forEach((h, colIdx) => {
              if (h.includes(channelName)) {
                if (h.includes("计划") || h.includes("目标")) {
                  targetCol = colIdx;
                } else if (h.includes("实际") || h.includes("完成") || h.includes("实招")) {
                  actualCol = colIdx;
                }
              }
            });
          }

          // 3. Fallback sequential assignment (if standard format downloaded)
          if (targetCol === -1 && nameColIndex !== -1) {
            // Assume 7 channels are sequential after the name column
            const startCol = nameColIndex + 1 + chIdx * 2;
            if (startCol < headers.length) {
              targetCol = startCol;
              actualCol = startCol + 1;
            }
          }

          if (targetCol !== -1) {
            channelMappings.push({ channelIdx: chIdx, targetCol, actualCol });
          }
        });

        // Parse data starting after header rows
        const startDataIndex = Math.max(headerRowIndex + 1, subHeaders.some(s => s.includes("目标") || s.includes("实际")) ? headerRowIndex + 2 : headerRowIndex + 1);

        const tempRows: Partial<RowData>[] = [];
        let seq = 1;

        for (let r = startDataIndex; r < rawRows.length; r++) {
          const rowData = rawRows[r];
          if (!rowData || rowData.length === 0) continue;

          // Extract name
          const nameVal = nameColIndex !== -1 ? String(rowData[nameColIndex] || "").trim() : "";
          if (!nameVal || nameVal.includes("合计") || nameVal.includes("与目标之差") || nameVal.includes("完成比例")) {
            // Skip total/aggregate footer rows
            continue;
          }

          // Parse other
          let otherVal = 0;
          if (otherColIndex !== -1 && otherColIndex < rowData.length) {
            otherVal = Math.max(0, parseInt(rowData[otherColIndex]) || 0);
          }

          // Parse channels
          const channels = Array.from({ length: config.channels.length }, () => ({ target: 0, actual: 0 }));
          channelMappings.forEach(({ channelIdx, targetCol, actualCol }) => {
            if (targetCol < rowData.length) {
              channels[channelIdx].target = Math.max(0, parseInt(rowData[targetCol]) || 0);
            }
            if (actualCol < rowData.length) {
              channels[channelIdx].actual = Math.max(0, parseInt(rowData[actualCol]) || 0);
            }
          });

          tempRows.push({
            id: `imported-${Date.now()}-${seq}-${Math.random().toString(36).substring(2, 9)}`,
            seq: seq++,
            name: nameVal,
            date: selectedDate,
            channels,
            other: otherVal
          });
        }

        if (tempRows.length === 0) {
          onToast("⚠️ 未能解析到有效数据行，请核实表格字段格式！");
        } else {
          setParsedRows(tempRows);
          initValidationRows(tempRows);
          onToast(`✅ 成功解析了 ${tempRows.length} 条专业数据！`);
        }
      } catch (err) {
        console.error(err);
        onToast("❌ 表格解析失败，请检查文件格式是否标准！");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (activeTab === "excel") {
        processFile(file);
      } else {
        processImageFile(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleTriggerSelect = () => {
    fileInputRef.current?.click();
  };

  // OCR functions
  const processImageFile = React.useCallback((file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onToast("❌ 请选择有效的图片文件！");
      return;
    }

    setOcrError(null);
    setParsedRows([]);
    
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      const base64 = resultStr.split(",")[1];
      setSelectedImage({
        base64,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file),
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  }, [onToast]);

  // Global clipboard paste listener for Windows (and other OS) screenshots (Ctrl+V)
  React.useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Don't intercept if user is typing in standard text inputs
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === "input" || targetTag === "textarea") {
        // If they are pasting an image inside an input/textarea, still process it
        const items = e.clipboardData?.items;
        let hasImage = false;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
              hasImage = true;
              break;
            }
          }
        }
        if (!hasImage) return; // Allow text pasting to propagate normally
      }

      if (!e.clipboardData) return;
      
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            // Automatically focus the OCR tab if they paste an image
            setActiveTab("ocr");
            
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
            const renamedFile = new File([file], `剪贴板截图_${timeStr}.png`, { type: file.type });
            processImageFile(renamedFile);
            onToast("📋 检测到剪贴板中的截图，已自动导入 AI 识图！");
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => {
      window.removeEventListener("paste", handleGlobalPaste);
    };
  }, [processImageFile, onToast]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleTriggerImageSelect = () => {
    imageInputRef.current?.click();
  };

  const startOcrAnalysis = async () => {
    if (!selectedImage) return;

    setIsOcrLoading(true);
    setOcrError(null);
    startOcrStepSimulator();

    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: selectedImage.base64,
          mimeType: selectedImage.mimeType
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `服务器请求失败 (HTTP ${response.status})`);
      }

      const data = await response.json();
      
      if (!data || !Array.isArray(data.rows)) {
        throw new Error("AI 无法识别有效的招生表格数据，请确保上传了包含专业、目标的统计图表。");
      }

      // Check if Date extracted
      if (data.extractedDate) {
        setExtractedDate(data.extractedDate);
      } else {
        setExtractedDate(selectedDate);
      }

      // Format to RowData partial rows
      const formatted = data.rows.map((r: any, idx: number) => {
        const channels = Array.from({ length: config.channels.length }, (_, i) => ({
          target: r.channelTargets?.[i] !== undefined ? Math.max(0, parseInt(r.channelTargets[i]) || 0) : 0,
          actual: r.channelActuals?.[i] !== undefined ? Math.max(0, parseInt(r.channelActuals[i]) || 0) : 0
        }));

        return {
          id: `ocr-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 9)}`,
          seq: idx + 1,
          name: r.name || "未命名专业",
          date: data.extractedDate || selectedDate,
          channels,
          other: r.other !== undefined ? Math.max(0, parseInt(r.other) || 0) : 0
        };
      });

      if (formatted.length === 0) {
        throw new Error("未能识别出任何有效的专业数据行。");
      }

      setParsedRows(formatted);
      initValidationRows(formatted);
      onToast(`✨ AI 识图成功！精准提取到 ${formatted.length} 条专业数据！`);
    } catch (err: any) {
      console.error(err);
      setOcrError(err.message || "图像分析失败，请检查网络连接或尝试使用更清晰的表格截图。");
      onToast("❌ AI 智能识图失败！");
    } finally {
      setIsOcrLoading(false);
      stopOcrStepSimulator();
    }
  };

  const executeImport = () => {
    // Filter out skipped rows
    const activeValidationRows = validationRows.filter(vr => !vr.isSkipped);
    if (activeValidationRows.length === 0) {
      onToast("⚠️ 没有可导入的有效数据行（或全部行已被跳过）！");
      return;
    }
    
    // Assign correct final date to each row
    const targetDateToUse = extractedDate || selectedDate;
    const finalRows = activeValidationRows.map((vr) => ({
      id: vr.id,
      seq: vr.seq,
      name: vr.name,
      date: targetDateToUse,
      channels: vr.channels,
      other: vr.other
    })) as RowData[];

    onImport(finalRows, importMode);
    onToast(`🎉 成功导入 ${finalRows.length} 条招生记录至日期 ${targetDateToUse}！`);
    onClose();
  };

  const renderValidationPanel = () => {
    const totalCount = validationRows.length;
    const exactCount = validationRows.filter(r => r.isValid && !r.isSkipped).length;
    const spellingCount = validationRows.filter(r => r.errorType === "spelling" && !r.isSkipped).length;
    const mismatchCount = validationRows.filter(r => r.errorType === "mismatch" && !r.isSkipped).length;
    const skippedCount = validationRows.filter(r => r.isSkipped).length;
    
    const displayRows = onlyShowErrors 
      ? validationRows.filter(r => !r.isValid || r.isSkipped)
      : validationRows;

    return (
      <div className={`p-3.5 border rounded-xl space-y-3.5 ${
        isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50/50 border-slate-150"
      }`}>
        
        {/* Pre-check Header / Status Summary */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-500">
              <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>🛡️ 导入前智能校验预检查</span>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyShowErrors}
                  onChange={(e) => setOnlyShowErrors(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 w-3 h-3"
                />
                <span>仅看异常/跳过 ({spellingCount + mismatchCount + skippedCount})</span>
              </label>

              {spellingCount > 0 && (
                <button
                  type="button"
                  onClick={handleAutoFixAll}
                  className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold rounded-lg flex items-center gap-1 transition-all"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>自动纠正拼写 ({spellingCount})</span>
                </button>
              )}
            </div>
          </div>

          {/* Color Distribution Bar */}
          <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
            {totalCount > 0 && (
              <>
                <div 
                  className="bg-emerald-500 h-full transition-all duration-300" 
                  style={{ width: `${(exactCount / totalCount) * 100}%` }}
                  title={`完美匹配: ${exactCount}`}
                />
                <div 
                  className="bg-amber-500 h-full transition-all duration-300" 
                  style={{ width: `${(spellingCount / totalCount) * 100}%` }}
                  title={`拼写警告: ${spellingCount}`}
                />
                <div 
                  className="bg-red-500 h-full transition-all duration-300" 
                  style={{ width: `${(mismatchCount / totalCount) * 100}%` }}
                  title={`格式错误: ${mismatchCount}`}
                />
                <div 
                  className="bg-slate-400 h-full transition-all duration-300" 
                  style={{ width: `${(skippedCount / totalCount) * 100}%` }}
                  title={`已跳过: ${skippedCount}`}
                />
              </>
            )}
          </div>

          {/* Quantitative Badges */}
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] font-bold text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>解析总量: <strong className="text-slate-600 dark:text-slate-200">{totalCount}</strong></span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>完美匹配: <strong className="text-emerald-500">{exactCount}</strong></span>
            </span>
            {spellingCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>拼写警告: <strong className="text-amber-500">{spellingCount}</strong></span>
              </span>
            )}
            {mismatchCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>未配对格式: <strong className="text-red-500">{mismatchCount}</strong></span>
              </span>
            )}
            {skippedCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>已跳过: <strong className="text-slate-400">{skippedCount}</strong></span>
              </span>
            )}
          </div>
        </div>

        {/* Validation Interactive Table */}
        <div className={`border rounded-xl overflow-hidden ${
          isDarkMode ? "border-slate-800 bg-slate-900/40" : "border-slate-150 bg-white"
        }`}>
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-150/40 dark:divide-slate-800/60">
            {/* Table Header */}
            <div className={`grid grid-cols-12 font-extrabold px-3 py-2 text-[10px] sticky top-0 z-10 ${
              isDarkMode ? "bg-slate-850 text-slate-300" : "bg-slate-100 text-slate-600"
            }`}>
              <span className="col-span-1">序号</span>
              <span className="col-span-3 text-left">导入原始值</span>
              <span className="col-span-4 text-left">拟匹配标准专业</span>
              <span className="col-span-3 text-center">状态诊断 / 纠错</span>
              <span className="col-span-1 text-right">操作</span>
            </div>

            {/* Table Body */}
            {displayRows.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-[11px] font-bold">
                {onlyShowErrors ? "👏 所有解析数据校验正常，无需额外修正！" : "📭 暂无待校验的行"}
              </div>
            ) : (
              displayRows.map((row, idx) => {
                const rowTargetSum = row.channels.reduce((sum, c) => sum + c.target, 0);
                const rowActualSum = row.channels.reduce((sum, c) => sum + c.actual, 0);

                // Row style classes based on validation state
                let rowBgClass = "";
                let borderLeftClass = "border-l-2 border-l-transparent";
                
                if (row.isSkipped) {
                  rowBgClass = "opacity-50 line-through bg-slate-100/20 dark:bg-slate-900/10";
                  borderLeftClass = "border-l-2 border-l-slate-400";
                } else if (row.isValid) {
                  borderLeftClass = "border-l-2 border-l-emerald-500";
                } else if (row.errorType === "spelling") {
                  rowBgClass = "bg-amber-500/5 dark:bg-amber-500/3";
                  borderLeftClass = "border-l-2 border-l-amber-500";
                } else if (row.errorType === "mismatch") {
                  rowBgClass = "bg-red-500/5 dark:bg-red-500/3";
                  borderLeftClass = "border-l-2 border-l-red-500";
                }

                return (
                  <div 
                    key={`import-row-${row.id}-${idx}`} 
                    className={`grid grid-cols-12 items-center px-3 py-2 text-[11px] font-medium transition-all ${rowBgClass} ${borderLeftClass}`}
                  >
                    {/* Index */}
                    <span className="col-span-1 font-mono text-slate-400 text-xs">
                      #{row.seq}
                    </span>

                    {/* Original Value */}
                    <div className="col-span-3 pr-2 flex flex-col justify-center min-w-0">
                      <span className="font-bold truncate text-slate-700 dark:text-slate-200" title={row.originalName}>
                        {row.originalName || <span className="italic text-slate-400">(空值)</span>}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        计划:{rowTargetSum} | 实招:{rowActualSum}
                      </span>
                    </div>

                    {/* Target Selector */}
                    <div className="col-span-4 pr-3 flex flex-col gap-1">
                      <div className="flex gap-1.5 items-center w-full">
                        <select
                          disabled={row.isSkipped}
                          value={Object.keys(MAJOR_METADATA).includes(row.name) ? row.name : "__custom__"}
                          onChange={(e) => {
                            if (e.target.value !== "__custom__") {
                              handleUpdateRowName(row.id, e.target.value);
                            }
                          }}
                          className="flex-1 text-[11px] font-bold bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-md px-1 py-0.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-55 cursor-pointer"
                        >
                          {!Object.keys(MAJOR_METADATA).includes(row.name) && (
                            <option key={`custom-name-${row.id}`} value="__custom__">自定义: {row.name || "(未填)"}</option>
                          )}
                          <option key={`custom-manual-${row.id}`} value="__custom__">✏️ 手动输入自定义...</option>
                          {Object.keys(MAJOR_METADATA).map((std, sIdx) => (
                            <option key={`std-opt-${std}-${sIdx}`} value={std}>{std}</option>
                          ))}
                        </select>
                        
                        {(!Object.keys(MAJOR_METADATA).includes(row.name) || row.name === "") && !row.isSkipped && (
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => handleUpdateRowName(row.id, e.target.value)}
                            placeholder="输入专业"
                            className="w-24 text-[10px] bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-md px-1 py-0.5 font-bold text-slate-800 dark:text-white focus:outline-none"
                          />
                        )}
                      </div>
                    </div>

                    {/* Status diagnostic & fast actions */}
                    <div className="col-span-3 text-center pr-2">
                      {row.isSkipped ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400">
                          已跳过导入
                        </span>
                      ) : row.isValid ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500">
                          <Check className="w-3 h-3" />
                          <span>完美匹配</span>
                        </span>
                      ) : row.errorType === "spelling" ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500">
                            拼写似有误
                          </span>
                          {row.suggestedName && (
                            <button
                              type="button"
                              onClick={() => handleAdoptSuggestion(row.id)}
                              className="px-1 py-0.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[8px] rounded transition-colors cursor-pointer"
                              title={`更正为 ${row.suggestedName}`}
                            >
                              采纳建议
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-500">
                          无法配对
                        </span>
                      )}
                    </div>

                    {/* Action buttons (Skip/Include) */}
                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleSkipRow(row.id)}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          row.isSkipped
                            ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                            : "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                        }`}
                        title={row.isSkipped ? "包含导入" : "排除此行"}
                      >
                        {row.isSkipped ? "包含" : "跳过"}
                      </button>
                    </div>

                  </div>
                );
              })
            )}

          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className={`rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] border transition-all duration-300 ${
        isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
      }`}>
        
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDarkMode ? "border-slate-800 bg-slate-950/40" : "border-slate-100 bg-slate-50"
        }`}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">批量导入招生数据</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">支持本地表格导入或 AI 智能 OCR 识图一键登记</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className={`flex border-b px-4 gap-4 text-xs font-bold ${
          isDarkMode ? "border-slate-850 bg-slate-900/60" : "border-slate-100 bg-slate-50/50"
        }`}>
          <button
            type="button"
            onClick={() => {
              setActiveTab("excel");
              setParsedRows([]);
            }}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "excel"
                ? "border-emerald-500 text-emerald-500"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>📄 本地 Excel/CSV 导入</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("ocr");
              setParsedRows([]);
            }}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "ocr"
                ? "border-emerald-500 text-emerald-500"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span className="flex items-center gap-1">
              <span>📸 AI 识图/OCR 快速导入</span>
              <span className="px-1 py-0.5 text-[8px] font-black bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 rounded">智能</span>
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: EXCEL IMPORT */}
          {activeTab === "excel" && (
            <>
              {parsedRows.length === 0 ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleTriggerSelect}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                    isDragging 
                      ? "border-emerald-500 bg-emerald-500/5 scale-[0.99]" 
                      : (isDarkMode ? "border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850/30" : "border-slate-200 hover:border-emerald-500/50 hover:bg-slate-50/50")
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                  />
                  <div className={`p-3 rounded-full ${isDarkMode ? "bg-slate-850 text-slate-300" : "bg-emerald-50 text-emerald-600"}`}>
                    <Upload className="w-8 h-8 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold">拖拽本地 Excel 或 CSV 表格至此处，或点击浏览选择文件</p>
                    <p className="text-[10px] text-slate-400">支持批量修改与重新录入。最推荐套用系统「导出的 Excel 模版」编辑后再导入</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className={`p-3 border rounded-xl flex items-center justify-between ${
                    isDarkMode ? "bg-slate-900 border-slate-800" : "bg-emerald-50/30 border-emerald-100"
                  }`}>
                    <div className="flex items-center space-x-2 text-xs font-bold text-emerald-500">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>成功解析文件：{fileName}</span>
                    </div>
                    <button
                      onClick={() => {
                        setParsedRows([]);
                        setValidationRows([]);
                        setFileName("");
                      }}
                      className="text-[10px] text-slate-400 hover:text-red-500 font-bold transition-colors cursor-pointer"
                    >
                      重新上传
                    </button>
                  </div>

                  {renderValidationPanel()}
                </div>
              )}
            </>
          )}

          {/* TAB 2: AI OCR IMPORT */}
          {activeTab === "ocr" && (
            <>
              {parsedRows.length === 0 ? (
                <div className="space-y-4">
                  {!selectedImage ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={handleTriggerImageSelect}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                        isDragging 
                          ? "border-emerald-500 bg-emerald-500/5 scale-[0.99]" 
                          : (isDarkMode ? "border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850/30" : "border-slate-200 hover:border-emerald-500/50 hover:bg-slate-50/50")
                      }`}
                    >
                      <input
                        type="file"
                        ref={imageInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className={`p-3 rounded-full ${isDarkMode ? "bg-slate-850 text-slate-300" : "bg-indigo-50 text-indigo-600"}`}>
                        <Camera className="w-8 h-8 animate-pulse" />
                      </div>
                      <div className="space-y-2 px-4">
                        <p className="text-xs font-bold leading-normal">
                          拖拽招生表格截图到此处，点击上传，或直接按{" "}
                          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                            Ctrl + V
                          </kbd>{" "}
                          粘贴
                        </p>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          Windows 系统下，您可以使用 <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-mono">Win + Shift + S</kbd> 快捷键截图，然后在此窗口直接按 <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-mono font-bold">Ctrl+V</kbd>，AI 将自动读取并识别数据！
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Image Preview Block */}
                      <div className="md:col-span-5 flex flex-col space-y-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">图片预览:</span>
                        <div className={`border rounded-xl p-2 flex items-center justify-center aspect-video md:aspect-square relative overflow-hidden ${
                          isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-150"
                        }`}>
                          <img 
                            src={selectedImage.previewUrl} 
                            alt="Recruitment report preview" 
                            className="max-h-full max-w-full object-contain rounded-lg"
                          />
                          {isOcrLoading && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3">
                              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                              <div className="text-center space-y-1 px-3">
                                <p className="text-xs font-bold text-emerald-400">AI 正在精准识图中...</p>
                                <p className="text-[9px] text-slate-300 animate-pulse">
                                  {ocrLoadingStep === 0 && "🔍 正在扫描图像及各单元格分布..."}
                                  {ocrLoadingStep === 1 && "📊 正在提取专业分类、计划与招生数..."}
                                  {ocrLoadingStep === 2 && `🤖 校验并对齐${config.channels.length}大核心招生渠道...`}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span className="truncate max-w-[150px]">{selectedImage.name}</span>
                          <button
                            type="button"
                            disabled={isOcrLoading}
                            onClick={() => setSelectedImage(null)}
                            className="text-red-500 hover:text-red-400 font-bold transition-colors cursor-pointer"
                          >
                            移除重选
                          </button>
                        </div>
                      </div>

                      {/* OCR Settings Panel */}
                      <div className="md:col-span-7 flex flex-col justify-center space-y-4">
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold flex items-center gap-1">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                            <span>招生大盘图片导入</span>
                          </h4>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            点击下方按钮，由 Gemini 3.5 AI 引擎为您进行多维文字识别与表格解构。识别成功后，可生成数据大盘供您微调。
                          </p>
                        </div>

                        {ocrError && (
                          (() => {
                            const is403Error = ocrError.includes("403") || ocrError.toLowerCase().includes("denied access") || ocrError.includes("PERMISSION_DENIED");
                            if (is403Error) {
                              return (
                                <div className={`p-4 border rounded-xl text-xs leading-relaxed flex flex-col space-y-2.5 ${
                                  isDarkMode ? "bg-amber-950/20 border-amber-900/40 text-amber-200" : "bg-amber-50 border-amber-100 text-amber-800"
                                }`}>
                                  <div className="flex items-start space-x-2">
                                    <AlertCircle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="font-bold text-[13px] block mb-1">⚠️ 账号权限受限或 API Key 异常 (403)</span>
                                      <p className="text-[11px]">
                                        您的项目被拒绝访问 Gemini API (Permission Denied)。这通常是由于以下原因导致的：
                                      </p>
                                      <ul className="list-disc pl-4 mt-1 space-y-1 text-[10px] opacity-90">
                                        <li>未在 AI Studio 中配置可用的 <b>GEMINI_API_KEY</b></li>
                                        <li>配置的密钥格式不正确，或已被 Google Cloud 停用/回收</li>
                                        <li>当前的 Google Cloud 项目由于地区限制、企业账户管理限制或账单原因无法使用免费额度</li>
                                      </ul>
                                    </div>
                                  </div>
                                  <div className="border-t border-dashed border-amber-500/20 pt-2 flex flex-col gap-1.5 text-[10.5px]">
                                    <p className="font-bold">🛠️ 解决建议：</p>
                                    <p>
                                      1. 请在页面右上角，点击 <b>"Settings" (设置)</b> 菜单，确认您的 <code>GEMINI_API_KEY</code> 已经正确填写且未过期，并且首尾不包含多余空格。
                                    </p>
                                    <p>
                                      2. 您可以前往官方的 <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold text-indigo-600 dark:text-indigo-400 hover:opacity-80">Google AI Studio 官网</a> 申请一枚全新的免费 API Key，并更新至设置中。
                                    </p>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div className={`p-3 border rounded-lg text-[10px] leading-relaxed flex items-start space-x-2 ${
                                isDarkMode ? "bg-red-950/20 border-red-900/40 text-red-300" : "bg-red-50 border-red-100 text-red-800"
                              }`}>
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold">识别遇到阻碍：</span>
                                  <p>{ocrError}</p>
                                </div>
                              </div>
                            );
                          })()
                        )}

                        <button
                          type="button"
                          onClick={startOcrAnalysis}
                          disabled={isOcrLoading}
                          className="w-full py-2.5 px-4 bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-650 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10 active:scale-[0.98] transition-all"
                        >
                          {isOcrLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>AI 解析计算中...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-yellow-300" />
                              <span>立即开始 AI 智能 OCR 识别</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className={`p-3 border rounded-xl flex items-center justify-between ${
                    isDarkMode ? "bg-slate-900 border-slate-800" : "bg-emerald-50/30 border-emerald-100"
                  }`}>
                    <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400">
                      <Sparkles className="w-4 h-4 shrink-0 text-yellow-400" />
                      <span>✨ AI 识图数据解析成功！</span>
                    </div>
                    <button
                      onClick={() => {
                        setParsedRows([]);
                        setValidationRows([]);
                        setExtractedDate("");
                      }}
                      className="text-[10px] text-slate-400 hover:text-red-500 font-bold transition-colors cursor-pointer"
                    >
                      重新上传
                    </button>
                  </div>

                  {/* Extracted Date alert & override */}
                  {extractedDate && (
                    <div className={`p-2.5 border rounded-lg text-[10px] flex items-center justify-between ${
                      isDarkMode ? "bg-slate-900 border-slate-800" : "bg-amber-50 border-amber-100"
                    }`}>
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                        <Info className="w-4 h-4" />
                        <span>AI 识别到的报表所属日期为: {extractedDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setExtractedDate(selectedDate);
                            onToast("已将数据录入日期重设为当前聚焦日期");
                          }}
                          className={`px-2 py-1 border rounded text-[9px] font-bold ${
                            isDarkMode ? "hover:bg-slate-850 border-slate-700" : "hover:bg-white border-slate-200 bg-white"
                          }`}
                        >
                          强制使用当前聚焦日 ({selectedDate})
                        </button>
                      </div>
                    </div>
                  )}

                  {renderValidationPanel()}
                </div>
              )}
            </>
          )}

          {/* Import configs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                选择数据录入范围
              </label>
              <div className={`p-2.5 border rounded-lg text-xs leading-relaxed font-bold ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-150"}`}>
                📅 目标录入日期：<span className="text-emerald-500 font-black">{extractedDate || selectedDate}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                导入冲突处理策略 (Merge Strategy)
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setImportMode("append")}
                  className={`flex-1 py-2 text-center text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    importMode === "append"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                      : (isDarkMode ? "border-slate-800 text-slate-400 hover:text-slate-200" : "border-slate-250 text-slate-500 hover:text-slate-800")
                  }`}
                >
                  ➕ 追加混合合并
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode("overwrite")}
                  className={`flex-1 py-2 text-center text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    importMode === "overwrite"
                      ? "border-red-500 bg-red-500/10 text-red-500"
                      : (isDarkMode ? "border-slate-800 text-slate-400 hover:text-slate-200" : "border-slate-250 text-slate-500 hover:text-slate-800")
                  }`}
                >
                  ⚠️ 覆盖替换当日
                </button>
              </div>
            </div>
          </div>

          <div className="bg-blue-950/20 border border-blue-900/30 p-3 rounded-lg flex items-start space-x-2 text-[10px] leading-relaxed text-slate-400">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-slate-300">💡 智能对齐技术：</span>
              <p>系统内置了对齐引擎。如果是您从系统导出的 Excel 文件，修改完并导入，系统会自动对齐全部招生渠道！如果表头不一致，会启动智能位置对齐，帮您无缝同步。</p>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className={`p-4 border-t flex space-x-3 ${
          isDarkMode ? "border-slate-800 bg-slate-950/40" : "border-slate-100 bg-slate-50"
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isDarkMode ? "border-slate-800 hover:bg-slate-800 text-slate-300" : "border-slate-200 hover:bg-slate-100 text-slate-600"
            }`}
          >
            取消
          </button>
          <button
            type="button"
            onClick={executeImport}
            disabled={parsedRows.length === 0}
            className={`flex-1 py-2 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1 transition-all shadow-md ${
              parsedRows.length === 0
                ? "bg-slate-600 cursor-not-allowed opacity-50 shadow-none"
                : "bg-emerald-600 hover:bg-emerald-500 cursor-pointer active:scale-[0.98]"
            }`}
          >
            <span>开始导入招生记录</span>
          </button>
        </div>

      </div>
    </div>
  );
}

