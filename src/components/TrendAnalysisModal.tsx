import React, { useState } from "react";
import { TableConfig } from "../types";
import { X, Printer, Copy, Check, TrendingUp, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TrendAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  content: string;
  date: string;
  config: TableConfig;
  isDarkMode: boolean;
  onToast: (msg: string) => void;
  onReanalyze: () => void;
}

function parseInlineMarkdown(text: string, prefix: string = "in"): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let currentIdx = 0;
  
  // Regex to match bold (**text**), inline code (`code`), or URLs
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|https?:\/\/[^\s]+)/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const matchIdx = match.index;
    
    // Add text before match
    if (matchIdx > currentIdx) {
      parts.push(<span key={`${prefix}-txt-${currentIdx}`}>{text.substring(currentIdx, matchIdx)}</span>);
    }
    
    const matchedStr = match[0];
    if (matchedStr.startsWith("**") && matchedStr.endsWith("**")) {
      parts.push(
        <strong key={`${prefix}-bold-${matchIdx}`} className="font-extrabold text-slate-900 dark:text-white">
          {matchedStr.slice(2, -2)}
        </strong>
      );
    } else if (matchedStr.startsWith("`") && matchedStr.endsWith("`")) {
      parts.push(
        <code key={`${prefix}-code-${matchIdx}`} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded text-xs font-mono">
          {matchedStr.slice(1, -1)}
        </code>
      );
    } else {
      parts.push(
        <a key={`${prefix}-link-${matchIdx}`} href={matchedStr} target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline">
          {matchedStr}
        </a>
      );
    }
    
    currentIdx = regex.lastIndex;
  }
  
  if (currentIdx < text.length) {
    parts.push(<span key={`${prefix}-txt-tail-${currentIdx}`}>{text.substring(currentIdx)}</span>);
  }
  
  return parts.length > 0 ? parts : [text];
}

export function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  
  let listItems: React.ReactNode[] = [];
  let orderedListItems: React.ReactNode[] = [];
  let currentTable: { headers: string[]; rows: string[][] } | null = null;
  
  const flushListsAndTables = (keyPrefix: string) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${keyPrefix}-${elements.length}`} className="list-disc pl-5 my-3 space-y-1.5 text-xs md:text-sm text-slate-700 dark:text-slate-300">
          {listItems}
        </ul>
      );
      listItems = [];
    }
    if (orderedListItems.length > 0) {
      elements.push(
        <ol key={`ol-${keyPrefix}-${elements.length}`} className="list-decimal pl-5 my-3 space-y-1.5 text-xs md:text-sm text-slate-700 dark:text-slate-300">
          {orderedListItems}
        </ol>
      );
      orderedListItems = [];
    }
    if (currentTable) {
      elements.push(
        <div key={`table-${keyPrefix}-${elements.length}`} className="overflow-x-auto my-4 border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-[11px] md:text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white font-bold">
              <tr>
                {currentTable.headers.map((h, idx) => (
                  <th key={`md-th-${idx}`} className="px-3.5 py-2 border-b border-slate-200 dark:border-slate-800">{parseInlineMarkdown(h, `th-${idx}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-850 bg-white dark:bg-transparent">
              {currentTable.rows.map((r, rIdx) => (
                <tr key={`md-tr-${rIdx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  {r.map((cell, cIdx) => (
                    <td key={`md-td-${rIdx}-${cIdx}`} className="px-3.5 py-1.5 border-b border-slate-150 dark:border-slate-850 font-medium">{parseInlineMarkdown(cell, `td-${rIdx}-${cIdx}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      currentTable = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Check if it's a table row
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (listItems.length > 0 || orderedListItems.length > 0) {
        flushListsAndTables(`${i}`);
      }
      
      const cells = trimmed
        .split("|")
        .slice(1, -1)
        .map(c => c.trim());
        
      const isSeparator = cells.every(c => c.startsWith("-") || c === "");
      
      if (isSeparator) {
        continue;
      }
      
      if (!currentTable) {
        currentTable = { headers: cells, rows: [] };
      } else {
        currentTable.rows.push(cells);
      }
      continue;
    }
    
    // If not a table row, flush table
    if (currentTable && !trimmed.startsWith("|")) {
      flushListsAndTables(`${i}`);
    }
    
    // Headings
    if (trimmed.startsWith("# ")) {
      flushListsAndTables(`${i}`);
      elements.push(
        <h1 key={`md-h1-${i}`} className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight mt-5 mb-2.5 pb-1.5 border-b border-slate-200 dark:border-slate-800">
          {parseInlineMarkdown(trimmed.slice(2), `h1-${i}`)}
        </h1>
      );
    } else if (trimmed.startsWith("## ")) {
      flushListsAndTables(`${i}`);
      elements.push(
        <h2 key={`md-h2-${i}`} className="text-[13px] md:text-[14px] font-black text-slate-900 dark:text-white tracking-tight mt-4 mb-2 flex items-center gap-1.5">
          {parseInlineMarkdown(trimmed.slice(3), `h2-${i}`)}
        </h2>
      );
    } else if (trimmed.startsWith("### ")) {
      flushListsAndTables(`${i}`);
      elements.push(
        <h3 key={`md-h3-${i}`} className="text-[11px] md:text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide mt-3.5 mb-1.5">
          {parseInlineMarkdown(trimmed.slice(4), `h3-${i}`)}
        </h3>
      );
    }
    // Horizontal Rule
    else if (trimmed === "---") {
      flushListsAndTables(`${i}`);
      elements.push(<hr key={`md-hr-${i}`} className="my-4 border-t border-slate-200 dark:border-slate-800" />);
    }
    // Bullet List
    else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (orderedListItems.length > 0) flushListsAndTables(`${i}`);
      listItems.push(
        <li key={`md-li-${i}`} className="leading-relaxed">
          {parseInlineMarkdown(trimmed.slice(2), `li-${i}`)}
        </li>
      );
    }
    // Numbered List
    else if (/^\d+\.\s/.test(trimmed)) {
      if (listItems.length > 0) flushListsAndTables(`${i}`);
      const contentStr = trimmed.replace(/^\d+\.\s/, "");
      orderedListItems.push(
        <li key={`md-ol-li-${i}`} className="leading-relaxed">
          {parseInlineMarkdown(contentStr, `ol-${i}`)}
        </li>
      );
    }
    // Blockquote
    else if (trimmed.startsWith("> ")) {
      flushListsAndTables(`${i}`);
      elements.push(
        <blockquote key={`md-quote-${i}`} className="border-l-4 border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 px-4 py-2 my-2.5 rounded-r-lg text-xs font-medium text-slate-700 dark:text-slate-300 italic">
          {parseInlineMarkdown(trimmed.slice(2), `quote-${i}`)}
        </blockquote>
      );
    }
    // Empty Line
    else if (trimmed === "") {
      flushListsAndTables(`${i}`);
    }
    // Standard Paragraph
    else {
      flushListsAndTables(`${i}`);
      elements.push(
        <p key={`md-p-${i}`} className="text-xs md:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed my-2 text-justify">
          {parseInlineMarkdown(trimmed, `p-${i}`)}
        </p>
      );
    }
  }
  
  // Final flush
  flushListsAndTables("end");
  
  return <div className="space-y-1">{elements}</div>;
}

function compileMarkdownToHTML(markdown: string): string {
  const lines = markdown.split("\n");
  let html = "";
  let inList = false;
  let inOrderedList = false;
  let inTable = false;

  const flushListsAndTables = () => {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
    if (inOrderedList) {
      html += "</ol>";
      inOrderedList = false;
    }
    if (inTable) {
      html += "</tbody></table>";
      inTable = false;
    }
  };

  const parseInline = (text: string): string => {
    let clean = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    clean = clean.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    clean = clean.replace(/`(.*?)`/g, "<code>$1</code>");
    return clean;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (inList || inOrderedList) flushListsAndTables();
      
      const cells = trimmed.split("|").slice(1, -1).map(c => c.trim());
      const isSeparator = cells.every(c => c.startsWith("-") || c === "");
      
      if (isSeparator) {
        continue;
      }
      
      if (!inTable) {
        inTable = true;
        html += "<table><thead><tr>";
        cells.forEach(h => {
          html += `<th>${parseInline(h)}</th>`;
        });
        html += "</tr></thead><tbody>";
      } else {
        html += "<tr>";
        cells.forEach(c => {
          html += `<td>${parseInline(c)}</td>`;
        });
        html += "</tr>";
      }
      continue;
    }

    if (inTable && !trimmed.startsWith("|")) {
      flushListsAndTables();
    }

    if (trimmed.startsWith("# ")) {
      flushListsAndTables();
      html += `<h1>${parseInline(trimmed.slice(2))}</h1>`;
    } else if (trimmed.startsWith("## ")) {
      flushListsAndTables();
      html += `<h2>${parseInline(trimmed.slice(3))}</h2>`;
    } else if (trimmed.startsWith("### ")) {
      flushListsAndTables();
      html += `<h3>${parseInline(trimmed.slice(4))}</h3>`;
    } else if (trimmed === "---") {
      flushListsAndTables();
      html += "<hr />";
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (inOrderedList) flushListsAndTables();
      if (!inList) {
        inList = true;
        html += "<ul>";
      }
      html += `<li>${parseInline(trimmed.slice(2))}</li>`;
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (inList) flushListsAndTables();
      if (!inOrderedList) {
        inOrderedList = true;
        html += "<ol>";
      }
      const contentStr = trimmed.replace(/^\d+\.\s/, "");
      html += `<li>${parseInline(contentStr)}</li>`;
    } else if (trimmed.startsWith("> ")) {
      flushListsAndTables();
      html += `<blockquote>${parseInline(trimmed.slice(2))}</blockquote>`;
    } else if (trimmed === "") {
      flushListsAndTables();
    } else {
      flushListsAndTables();
      html += `<p>${parseInline(trimmed)}</p>`;
    }
  }

  flushListsAndTables();
  return html;
}

export default function TrendAnalysisModal({
  isOpen,
  onClose,
  loading,
  content,
  date,
  config,
  isDarkMode,
  onToast,
  onReanalyze
}: TrendAnalysisModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const activeMonth = date.substring(0, 7);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    onToast("📋 Markdown 格式报告已成功复制到剪贴板！");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      onToast("⚠️ 弹出窗口被拦截，请允许弹出窗口权限以生成 PDF 报告！");
      return;
    }

    const htmlContent = compileMarkdownToHTML(content);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>学校月度招生趋势深度研判及优化建议报告</title>
        <meta charset="utf-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
          
          @media print {
            body {
              background: white;
              color: #1e293b;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: A4;
              margin: 2cm 2.2cm;
            }
            h1, h2, h3, table {
              page-break-inside: avoid;
            }
          }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 24px;
            background: #ffffff;
            font-size: 13px;
          }

          /* Header Styling */
          .report-header {
            border-bottom: 2px solid #059669;
            padding-bottom: 18px;
            margin-bottom: 28px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .report-title {
            margin: 0;
            font-size: 22px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -0.025em;
          }
          .report-meta {
            font-size: 10px;
            color: #64748b;
            text-align: right;
            font-family: monospace;
          }

          /* Markdown elements styling */
          h1 {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
            margin-top: 28px;
            margin-bottom: 14px;
          }
          h2 {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 22px;
            margin-bottom: 10px;
          }
          h3 {
            font-size: 12px;
            font-weight: 700;
            color: #334155;
            margin-top: 18px;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          p {
            margin-top: 0;
            margin-bottom: 12px;
            text-align: justify;
          }
          strong {
            font-weight: 700;
            color: #0f172a;
          }
          ul, ol {
            margin-top: 0;
            margin-bottom: 15px;
            padding-left: 20px;
          }
          li {
            margin-bottom: 5px;
          }
          blockquote {
            border-left: 4px solid #10b981;
            background: #f0fdf4;
            padding: 12px 16px;
            margin: 16px 0;
            font-style: italic;
            border-radius: 0 4px 4px 0;
            font-size: 12.5px;
            color: #334155;
          }
          hr {
            border: none;
            border-top: 1px solid #e2e8f0;
            margin: 22px 0;
          }
          code {
            font-family: monospace;
            background: #f1f5f9;
            padding: 2px 5px;
            border-radius: 4px;
            font-size: 11.5px;
            color: #0f172a;
          }

          /* Tables */
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 11.5px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 8px 12px;
            text-align: left;
          }
          th {
            background-color: #f8fafc;
            font-weight: 700;
            color: #0f172a;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }

          /* Print controls */
          .print-toolbar {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 20px;
            margin-bottom: 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .btn-print {
            background: #10b981;
            color: white;
            border: none;
            padding: 8px 16px;
            font-weight: bold;
            font-size: 12px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn-print:hover {
            background: #059669;
          }
        </style>
      </head>
      <body>
        <div class="print-toolbar no-print">
          <span style="font-size: 12px; font-weight: bold; color: #475569;">📄 报告打印/另存为PDF预览</span>
          <div>
            <button onclick="window.print()" class="btn-print">立即打印 / 保存 PDF</button>
            <button onclick="window.close()" style="margin-left: 8px; border: 1px solid #cbd5e1; background: white; padding: 7px 14px; font-size: 12px; border-radius: 6px; cursor: pointer; font-weight: bold; color: #475569;">关闭</button>
          </div>
        </div>

        <div class="report-header">
          <div>
            <h1 class="report-title">🏫 ${config.title || "招生工作报表"}</h1>
            <div style="font-size: 11.5px; color: #059669; font-weight: bold; margin-top: 5px;">
              📊 月度招生时序波动、渠道效能与专业热度研判报告 (${activeMonth}月份)
            </div>
          </div>
          <div class="report-meta">
            <div>生成时间: ${new Date().toLocaleString()}</div>
            <div>分析周期: 截至当期最新记录</div>
          </div>
        </div>

        <div class="report-body">
          ${htmlContent}
        </div>
        
        <div style="margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 15px; font-size: 10px; color: #94a3b8; text-align: center;">
          本报告由 Google Gemini 3.5 高级时序数据洞察引擎自动分析生成，数据源自本月招生数据库明细。
        </div>

        <script>
          setTimeout(() => {
            window.print();
          }, 300);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`max-w-4xl w-full h-[85vh] flex flex-col rounded-2xl shadow-2xl border ${
          isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"
        }`}
      >
        {/* Modal Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center ${
          isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-150"
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${isDarkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
              <TrendingUp className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                招生趋势智能研判与决策报告
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  {activeMonth}月度 PDF 总结
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">调用 Gemini API 时序智能分析模块生成的 A4 高拟真决策预览</p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950/60 custom-scrollbar">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center py-20 text-center space-y-4"
              >
                <div className="relative flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                  <Sparkles className="w-4 h-4 text-emerald-400 absolute animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">正在调遣 Gemini 3.5 高级研判数据引擎...</p>
                  <p className="text-[10px] text-slate-400 max-w-sm">
                    正在梳理本月所有历史日期的专业报到计划、各渠道实际产出、异常备注明细并完成多项时序关联分析。这通常需要 3-5 秒，请稍候。
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto space-y-6"
              >
                {/* Print Notice bar */}
                <div className={`p-3 border rounded-xl flex items-center justify-between text-[11px] font-bold ${
                  isDarkMode ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-600 shadow-3xs"
                }`}>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-bounce" />
                    <span>报告已生成。您可以立即导出为标准的 A4 印刷格式 PDF 总结。</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={onReanalyze}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      重新研判
                    </button>
                  </div>
                </div>

                {/* Simulated A4 Document Paper Container */}
                <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-8 md:p-12 shadow-xl border border-slate-200 dark:border-slate-800 rounded-xl max-w-4xl mx-auto leading-relaxed text-xs">
                  {/* Elegant Header inside Paper */}
                  <div className="border-b-2 border-emerald-600 dark:border-emerald-500 pb-4 mb-6 flex justify-between items-end">
                    <div>
                      <h1 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight m-0">
                        🏫 {config.title || "招生工作报表"}
                      </h1>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-extrabold mt-1">
                        📊 月度时序波动、渠道效能与专业热度深度研判报告 ({activeMonth}月份)
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 text-right font-mono">
                      <div>生成日期: {new Date().toLocaleDateString()}</div>
                      <div>数据层级: 决策分析级</div>
                    </div>
                  </div>

                  {/* Render parsed Markdown */}
                  <MarkdownRenderer content={content} />

                  {/* Paper Footer */}
                  <div className="mt-10 pt-4 border-t border-dashed border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-400">
                    本报告基于月度真实 Admissions Pipeline 招生明细时序演进生成 · 仅限内部传阅
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Footer Controls */}
        <div className={`px-6 py-3.5 border-t flex justify-between items-center ${
          isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-150"
        }`}>
          <div className="text-[10px] text-slate-400 font-mono">
            {!loading && `字数: ${content.length} | A4 排版格式`}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
                isDarkMode ? "bg-slate-850 hover:bg-slate-800 text-slate-300" : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200"
              }`}
            >
              关闭
            </button>
            
            {!loading && (
              <>
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className={`px-3.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                    isDarkMode ? "bg-slate-850 hover:bg-slate-800 text-emerald-400" : "bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "已复制" : "复制 Markdown"}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintPDF}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>导出标准 PDF 总结 / 打印</span>
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
