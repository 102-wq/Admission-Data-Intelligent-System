import React, { useState } from "react";
import { RowData, TableConfig } from "../types";
import { X, Printer, ExternalLink, Copy, Check, TrendingUp, BarChart2, Info, FileSpreadsheet } from "lucide-react";
import { motion } from "motion/react";

interface MajorSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  rows: RowData[];
  config: TableConfig;
  isDarkMode: boolean;
  viewMode: "daily" | "monthly";
  onToast: (msg: string) => void;
}

interface GroupedMajor {
  name: string;
  channels: { target: number; actual: number }[];
  other: number;
  totalTarget: number;
  totalActual: number;
  completionRate: number;
}

export default function MajorSummaryModal({
  isOpen,
  onClose,
  date,
  rows,
  config,
  isDarkMode,
  viewMode,
  onToast
}: MajorSummaryModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // 1. Determine active date-range label and rows
  const activeMonth = date.substring(0, 7);
  const dateLabel = viewMode === "daily" ? date : `${activeMonth}月份 (累计汇总)`;
  
  const activeRows = viewMode === "daily"
    ? rows.filter((r) => r.date === date)
    : rows.filter((r) => r.date.startsWith(activeMonth));

  // 2. Perform aggregation
  const grouped: { [key: string]: GroupedMajor } = {};

  activeRows.forEach((row) => {
    // We clean or group by row name (major name)
    const majorName = row.name.trim();
    if (!majorName) return;

    if (!grouped[majorName]) {
      grouped[majorName] = {
        name: majorName,
        channels: Array.from({ length: config.channels.length }, () => ({ target: 0, actual: 0 })),
        other: 0,
        totalTarget: 0,
        totalActual: 0,
        completionRate: 0,
      };
    }

    const existing = grouped[majorName];
    existing.other += row.other;
    row.channels.forEach((ch, chIdx) => {
      if (chIdx < existing.channels.length) {
        existing.channels[chIdx].target += ch.target;
        existing.channels[chIdx].actual += ch.actual;
      }
    });
  });

  // Calculate totals and convert to array
  const aggregatedList = Object.values(grouped).map((major) => {
    let targetSum = 0;
    let actualSum = 0;
    
    major.channels.forEach((ch) => {
      targetSum += ch.target;
      actualSum += ch.actual;
    });

    const totalTarget = targetSum;
    const totalActual = actualSum + major.other;
    const completionRate = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

    return {
      ...major,
      totalTarget,
      totalActual,
      completionRate,
    };
  }).sort((a, b) => b.totalActual - a.totalActual); // Sort by actual completion descending

  // Calculate column totals
  const channelTotals = Array.from({ length: config.channels.length }, (_, chIdx) => {
    let targetSum = 0;
    let actualSum = 0;
    aggregatedList.forEach((m) => {
      const ch = m.channels[chIdx];
      if (ch) {
        targetSum += ch.target;
        actualSum += ch.actual;
      }
    });
    return { target: targetSum, actual: actualSum };
  });

  const grandOther = aggregatedList.reduce((sum, m) => sum + m.other, 0);
  const grandTarget = aggregatedList.reduce((sum, m) => sum + m.totalTarget, 0);
  const grandActual = aggregatedList.reduce((sum, m) => sum + m.totalActual, 0);
  const grandCompletionRate = grandTarget > 0 ? (grandActual / grandTarget) * 100 : 0;

  // 3. Open Summary Report in a New Window
  const handleOpenNewWindow = () => {
    const newWindow = window.open("", "_blank");
    if (!newWindow) {
      onToast("⚠️ 新窗口被浏览器拦截！请允许此网页的弹出窗口权限。");
      return;
    }

    const doc = newWindow.document;
    doc.open();

    // Prepare table headers HTML
    const channelHeadersHTML = config.channels.map(ch => `
      <th colspan="2" class="border border-gray-300 px-2 py-2 text-center bg-gray-100 text-xs font-bold text-gray-700">${ch}</th>
    `).join("");

    const channelSubheadersHTML = config.channels.map(() => `
      <th class="border border-gray-300 px-1 py-1 text-center bg-gray-50 text-[10px] font-bold text-gray-600 w-12">计划</th>
      <th class="border border-gray-300 px-1 py-1 text-center bg-gray-50 text-[10px] font-bold text-gray-600 w-12">实际</th>
    `).join("");

    // Prepare rows HTML
    const rowsHTML = aggregatedList.map((m, idx) => {
      const completionBg = m.completionRate >= 100 
        ? "bg-emerald-50 text-emerald-800 font-bold" 
        : m.completionRate >= 50 
          ? "bg-blue-50 text-blue-800" 
          : "bg-amber-50 text-amber-800";

      const channelCellsHTML = m.channels.map(ch => `
        <td class="border border-gray-300 px-1 py-1.5 text-center text-xs text-gray-500">${ch.target}</td>
        <td class="border border-gray-300 px-1 py-1.5 text-center text-xs font-semibold text-gray-800">${ch.actual}</td>
      `).join("");

      return `
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="border border-gray-300 px-2 py-1.5 text-center text-xs text-gray-500 font-mono">${idx + 1}</td>
          <td class="border border-gray-300 px-3 py-1.5 text-left text-xs font-bold text-gray-900">${m.name}</td>
          ${channelCellsHTML}
          <td class="border border-gray-300 px-1 py-1.5 text-center text-xs font-semibold text-gray-700">${m.other}</td>
          <td class="border border-gray-300 px-2 py-1.5 text-center text-xs font-bold text-gray-800 bg-gray-50">${m.totalTarget}</td>
          <td class="border border-gray-300 px-2 py-1.5 text-center text-xs font-extrabold text-emerald-700 bg-emerald-50/30">${m.totalActual}</td>
          <td class="border border-gray-300 px-2 py-1.5 text-center text-xs ${completionBg}">${m.completionRate.toFixed(1)}%</td>
        </tr>
      `;
    }).join("");

    // Prepare channel grand totals HTML
    const channelGrandTotalsHTML = channelTotals.map(ch => `
      <td class="border border-gray-300 px-1 py-2 text-center text-xs font-bold bg-gray-100 text-gray-800">${ch.target}</td>
      <td class="border border-gray-300 px-1 py-2 text-center text-xs font-black bg-gray-100 text-emerald-800">${ch.actual}</td>
    `).join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>专业招生渠道汇总统计表 - ${dateLabel}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
          }
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; padding: 0 !important; }
            .print-border { border: 1px solid #d1d5db !important; }
          }
        </style>
      </head>
      <body class="bg-slate-50 text-slate-800 p-6 min-h-screen">
        <div class="max-w-7xl mx-auto space-y-6">
          
          <!-- Header and Actions -->
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print-border">
            <div>
              <div class="flex items-center gap-2 mb-1.5">
                <span class="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase rounded-full tracking-wider">自动聚合</span>
                <span class="text-xs text-gray-400 font-mono">生成时间: ${new Date().toLocaleString()}</span>
              </div>
              <h1 class="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                🏫 ${config.title} - 按专业渠道汇总
              </h1>
              <p class="text-xs text-gray-500 mt-1">
                统计时间段: <strong class="text-emerald-700">${dateLabel}</strong> · 当前周期共登记活跃专业 <strong class="text-gray-900">${aggregatedList.length}</strong> 个
              </p>
            </div>
            
            <div class="flex flex-wrap gap-2 no-print">
              <button onclick="window.print()" class="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                打印报表 / 导出PDF
              </button>
              <button onclick="window.close()" class="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-all cursor-pointer">
                关闭窗口
              </button>
            </div>
          </div>

          <!-- Quick Metrics Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
            <div class="bg-white p-4 rounded-xl border border-gray-200">
              <p class="text-[10px] text-gray-400 font-bold uppercase">汇总专业总数</p>
              <p class="text-lg font-extrabold text-gray-900 mt-0.5">${aggregatedList.length} <span class="text-xs font-normal text-gray-400">个</span></p>
            </div>
            <div class="bg-white p-4 rounded-xl border border-gray-200">
              <p class="text-[10px] text-gray-400 font-bold uppercase">渠道计划总数</p>
              <p class="text-lg font-extrabold text-gray-900 mt-0.5">${grandTarget} <span class="text-xs font-normal text-gray-400">人</span></p>
            </div>
            <div class="bg-white p-4 rounded-xl border border-gray-200">
              <p class="text-[10px] text-gray-400 font-bold uppercase">实际录取总数</p>
              <p class="text-lg font-extrabold text-emerald-600 mt-0.5">${grandActual} <span class="text-xs font-normal text-gray-400">人</span></p>
            </div>
            <div class="bg-white p-4 rounded-xl border border-gray-200">
              <p class="text-[10px] text-gray-400 font-bold uppercase">总计划完成率</p>
              <p class="text-lg font-black text-blue-600 mt-0.5">${grandCompletionRate.toFixed(1)}%</p>
            </div>
          </div>

          <!-- Table Container -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden print-border">
            <div class="overflow-x-auto">
              <table class="w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th rowspan="2" class="border border-gray-300 px-2 py-3 bg-gray-100 text-center text-xs font-extrabold text-gray-700 w-10">#</th>
                    <th rowspan="2" class="border border-gray-300 px-3 py-3 bg-gray-100 text-left text-xs font-extrabold text-gray-700 min-w-[150px]">专业/招生基础名称</th>
                    ${channelHeadersHTML}
                    <th rowspan="2" class="border border-gray-300 px-2 py-3 bg-gray-100 text-center text-xs font-extrabold text-gray-700 w-14">其它实际</th>
                    <th rowspan="2" class="border border-gray-300 px-2 py-3 bg-gray-100 text-center text-xs font-extrabold text-gray-700 w-16">总计划</th>
                    <th rowspan="2" class="border border-gray-300 px-2 py-3 bg-gray-100 text-center text-xs font-extrabold text-gray-700 w-16">总实际</th>
                    <th rowspan="2" class="border border-gray-300 px-2 py-3 bg-gray-100 text-center text-xs font-extrabold text-gray-700 w-20">总完成率</th>
                  </tr>
                  <tr>
                    ${channelSubheadersHTML}
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  ${rowsHTML}
                  
                  <!-- Grand Totals Row -->
                  <tr class="bg-emerald-50/20 font-bold border-t-2 border-gray-300">
                    <td class="border border-gray-300 px-2 py-2 text-center text-xs text-gray-700">-</td>
                    <td class="border border-gray-300 px-3 py-2 text-left text-xs font-black text-gray-900 bg-gray-150">汇总合计 (GRAND TOTAL)</td>
                    ${channelGrandTotalsHTML}
                    <td class="border border-gray-300 px-1 py-2 text-center text-xs font-bold text-gray-800 bg-gray-100">${grandOther}</td>
                    <td class="border border-gray-300 px-2 py-2 text-center text-xs font-black text-gray-900 bg-gray-100">${grandTarget}</td>
                    <td class="border border-gray-300 px-2 py-2 text-center text-xs font-black text-emerald-800 bg-emerald-50">${grandActual}</td>
                    <td class="border border-gray-300 px-2 py-2 text-center text-xs font-black text-blue-700 bg-blue-50">${grandCompletionRate.toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="text-center text-[10px] text-gray-400 py-2 no-print flex items-center justify-center gap-1">
            <span>💡 本报表经过自动重算，已排重合并所有同名专业在所选日期范围内的招生记录。</span>
          </div>

        </div>
      </body>
      </html>
    `;

    doc.write(htmlContent);
    doc.close();
    onToast("🎉 报表对比表已在新窗口生成并打开！");
  };

  // 4. Copy Rich Table to clipboard
  const handleCopyRichTable = async () => {
    const tableEl = document.getElementById("major-summary-report-table");
    if (!tableEl) return;
    try {
      const html = tableEl.outerHTML;
      const blob = new Blob([html], { type: "text/html" });
      const textBlob = new Blob([tableEl.innerText], { type: "text/plain" });
      const data = [new ClipboardItem({
        "text/html": blob,
        "text/plain": textBlob,
      })];
      await navigator.clipboard.write(data);
      setCopied(true);
      onToast("📋 富文本表格复制成功！可直接粘贴至 Excel/Word 保持表格网格样式。");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("复制表格失败:", err);
      // Fallback simple copy
      try {
        await navigator.clipboard.writeText(tableEl.innerText);
        setCopied(true);
        onToast("📋 文本复制成功（不支持富文本格式）");
        setTimeout(() => setCopied(false), 2000);
      } catch (inner) {
        onToast("❌ 复制失败，请尝试手动截图或打印。");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className={`rounded-2xl shadow-2xl max-w-5xl w-full border overflow-hidden flex flex-col max-h-[90vh] ${
          isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
        }`}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
          isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"
        }`}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500">
              <BarChart2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                🏫 按专业汇总渠道统计表
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                统计区间: <strong className="text-emerald-500 dark:text-emerald-400 font-bold">{dateLabel}</strong> · 包含活跃专业 {aggregatedList.length} 个
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls Panel */}
        <div className={`px-5 py-3 border-b flex flex-wrap gap-2.5 items-center justify-between shrink-0 text-xs ${
          isDarkMode ? "bg-slate-900/60 border-slate-850" : "bg-slate-50/50 border-slate-150"
        }`}>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>自动排重同名专业，并将多天数据进行物理求和累计。</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleOpenNewWindow}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border font-bold transition-all text-xs cursor-pointer ${
                isDarkMode 
                  ? "bg-emerald-950/30 border-emerald-800/80 hover:bg-emerald-900/40 text-emerald-400" 
                  : "bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-800"
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
              <span>在新窗口展示 (全屏/高清晰)</span>
            </button>

            <button
              onClick={handleCopyRichTable}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border font-bold transition-all text-xs cursor-pointer ${
                copied
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : (isDarkMode 
                    ? "bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-300" 
                    : "bg-slate-100 border-slate-250 hover:bg-slate-200 text-slate-700")
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? "已复制！" : "复制为Excel格式"}</span>
            </button>
          </div>
        </div>

        {/* Content Body with comparison table */}
        <div className="p-5 overflow-y-auto flex-1">
          {aggregatedList.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-400">该统计区间下没有任何招生登记数据</p>
              <p className="text-xs text-slate-500">请先在数据明细中录入或在侧栏导入/模拟一些招生数据。</p>
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden shadow-xs dark:border-slate-800 border-slate-150">
              <div className="overflow-x-auto">
                <table id="major-summary-report-table" className="w-full border-collapse">
                  <thead>
                    <tr className={isDarkMode ? "bg-slate-950/75" : "bg-slate-50"}>
                      <th rowSpan={2} className={`border px-2 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-wider w-8 ${isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>#</th>
                      <th rowSpan={2} className={`border px-3 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-wider min-w-[140px] ${isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>专业/基础名称</th>
                      {config.channels.map((ch, cIdx) => (
                        <th key={`hdr-${ch}-${cIdx}`} colSpan={2} className={`border px-1.5 py-1.5 text-center text-[10px] font-extrabold uppercase tracking-wider ${isDarkMode ? "border-slate-800 text-slate-300" : "border-slate-200 text-slate-700"}`}>
                          {ch}
                        </th>
                      ))}
                      <th rowSpan={2} className={`border px-1.5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-wider w-14 ${isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>其它实际</th>
                      <th rowSpan={2} className={`border px-2 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-wider w-16 ${isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>总计划</th>
                      <th rowSpan={2} className={`border px-2 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-wider w-16 ${isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>总实际</th>
                      <th rowSpan={2} className={`border px-2 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-wider w-20 ${isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>总完成率</th>
                    </tr>
                    <tr className={isDarkMode ? "bg-slate-950/45" : "bg-slate-100/50"}>
                      {config.channels.map((_, i) => (
                        <React.Fragment key={`sub-${i}`}>
                          <th className={`border px-1 py-1 text-center text-[9px] font-bold ${isDarkMode ? "border-slate-800 text-slate-450" : "border-slate-200 text-slate-450"}`}>计划</th>
                          <th className={`border px-1 py-1 text-center text-[9px] font-bold ${isDarkMode ? "border-slate-800 text-slate-450" : "border-slate-200 text-slate-450"}`}>实际</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? "divide-slate-850" : "divide-slate-150"}`}>
                    {aggregatedList.map((m, idx) => {
                      const isComplete = m.completionRate >= 100;
                      return (
                        <tr key={`row-${m.name}-${idx}`} className={`transition-colors text-xs ${
                          isDarkMode ? "hover:bg-slate-850/50" : "hover:bg-slate-50/50"
                        }`}>
                          <td className="px-2 py-2 border text-center font-mono font-medium opacity-60 dark:border-slate-800 border-slate-150">{idx + 1}</td>
                          <td className="px-3 py-2 border font-bold text-left dark:border-slate-800 border-slate-150">{m.name}</td>
                          {m.channels.map((ch, chIdx) => (
                            <React.Fragment key={`cell-${m.name}-${chIdx}-${idx}`}>
                              <td className="px-1 py-2 border text-center font-medium opacity-65 dark:border-slate-800 border-slate-150">{ch.target}</td>
                              <td className={`px-1 py-2 border text-center font-extrabold dark:border-slate-800 border-slate-150 ${ch.actual > 0 ? "text-emerald-500" : "opacity-45"}`}>{ch.actual}</td>
                            </React.Fragment>
                          ))}
                          <td className={`px-1 py-2 border text-center font-bold dark:border-slate-800 border-slate-150 ${m.other > 0 ? "text-emerald-500" : "opacity-45"}`}>{m.other}</td>
                          <td className="px-2 py-2 border text-center font-extrabold bg-slate-500/5 dark:border-slate-800 border-slate-150">{m.totalTarget}</td>
                          <td className="px-2 py-2 border text-center font-black text-emerald-500 bg-emerald-500/5 dark:border-slate-800 border-slate-150">{m.totalActual}</td>
                          <td className={`px-2 py-2 border text-center font-black dark:border-slate-800 border-slate-150 ${
                            isComplete 
                              ? "text-emerald-500 bg-emerald-500/10" 
                              : m.completionRate >= 50
                                ? "text-blue-500 bg-blue-500/5"
                                : "text-amber-500 bg-amber-500/5"
                          }`}>
                            {m.completionRate.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                    
                    {/* Grand Totals Row */}
                    <tr className={`font-black text-xs border-t-2 ${
                      isDarkMode 
                        ? "bg-slate-950 border-slate-700 text-slate-100" 
                        : "bg-slate-50 border-slate-350 text-slate-900"
                    }`}>
                      <td className="px-2 py-3 border text-center">-</td>
                      <td className="px-3 py-3 border text-left bg-slate-500/10">汇总合计 (GRAND TOTAL)</td>
                      {channelTotals.map((ch, chIdx) => (
                        <React.Fragment key={`total-cell-${chIdx}`}>
                          <td className="px-1 py-3 border text-center opacity-80">{ch.target}</td>
                          <td className="px-1 py-3 border text-center text-emerald-500">{ch.actual}</td>
                        </React.Fragment>
                      ))}
                      <td className="px-1 py-3 border text-center text-emerald-500">{grandOther}</td>
                      <td className="px-2 py-3 border text-center bg-slate-500/10">{grandTarget}</td>
                      <td className="px-2 py-3 border text-center text-emerald-500 bg-emerald-500/10">{grandActual}</td>
                      <td className={`px-2 py-3 border text-center text-blue-500 bg-blue-500/10`}>
                        {grandCompletionRate.toFixed(1)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-5 py-3 border-t flex items-center justify-between shrink-0 ${
          isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-150"
        }`}>
          <div className="text-[10px] text-slate-500">
            统计逻辑: 专业指标 = ∑单日数据，完成率 = ∑实际完成 / ∑计划总数。
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              isDarkMode 
                ? "bg-slate-800 hover:bg-slate-700 text-slate-200" 
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            返回工作台
          </button>
        </div>
      </motion.div>
    </div>
  );
}
