/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { RowData, TableConfig } from "../types";
import { 
  Filter, 
  Users, 
  Percent, 
  HelpCircle, 
  BarChart2, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  TrendingUp, 
  AlertCircle,
  Copy,
  RotateCcw,
  Sparkles,
  DollarSign,
  ArrowUpRight,
  ChevronRight
} from "lucide-react";

interface ConversionFunnelProps {
  rows: RowData[];
  config: TableConfig;
  selectedDate: string;
  isDarkMode: boolean;
}

interface FunnelData {
  id: string;
  majorName: string;
  inquiry: number;      // 咨询数
  intent: number;       // 意向数
  register: number;     // 报名数
  paid: number;         // 缴费到账数
}

export default function ConversionFunnel({ rows, config, selectedDate, isDarkMode }: ConversionFunnelProps) {
  const activeMonth = selectedDate.substring(0, 7);
  const [funnelList, setFunnelList] = useState<FunnelData[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // What-If Simulation State
  const [inquiryBoost, setInquiryBoost] = useState<number>(0); // e.g. 0.1 for +10%
  const [paidBoost, setPaidBoost] = useState<number>(0);       // e.g. 0.05 for +5%
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [tuitionFee, setTuitionFee] = useState<number>(9800);

  const [editForm, setEditForm] = useState<Omit<FunnelData, "id">>({
    majorName: "",
    inquiry: 0,
    intent: 0,
    register: 0,
    paid: 0,
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [newForm, setNewForm] = useState<Omit<FunnelData, "id">>({
    majorName: "",
    inquiry: 100,
    intent: 50,
    register: 20,
    paid: 10,
  });

  // Unique list of majors based on rows
  const allMajors = Array.from(new Set(rows.map((r) => r.name)));

  // Generate realistic seed data proportional to actual results
  const generateSeedData = (): FunnelData[] => {
    return allMajors.map((name, idx) => {
      const base = 80 + Math.floor(Math.random() * 120);
      const inquiry = base * 4;
      const intent = Math.floor(inquiry * (0.4 + Math.random() * 0.15));
      const register = Math.floor(intent * (0.35 + Math.random() * 0.15));
      const paid = Math.floor(register * (0.6 + Math.random() * 0.2));
      return {
        id: `funnel-${idx}`,
        majorName: name,
        inquiry,
        intent,
        register,
        paid
      };
    });
  };

  // Initial Seed Data for the Funnel based on rows
  useEffect(() => {
    const saved = localStorage.getItem("recruitment_funnel_data");
    if (saved) {
      try {
        setFunnelList(JSON.parse(saved));
      } catch (e) {
        const initial = generateSeedData();
        setFunnelList(initial);
        localStorage.setItem("recruitment_funnel_data", JSON.stringify(initial));
      }
    } else {
      const initialSeed = generateSeedData();
      setFunnelList(initialSeed);
      localStorage.setItem("recruitment_funnel_data", JSON.stringify(initialSeed));
    }
  }, [rows]);

  const saveToStorage = (newList: FunnelData[]) => {
    setFunnelList(newList);
    localStorage.setItem("recruitment_funnel_data", JSON.stringify(newList));
  };

  const handleStartEdit = (item: FunnelData) => {
    setEditingId(item.id);
    setEditForm({
      majorName: item.majorName,
      inquiry: item.inquiry,
      intent: item.intent,
      register: item.register,
      paid: item.paid,
    });
  };

  const handleSaveEdit = (id: string) => {
    const updated = funnelList.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          inquiry: Math.max(0, Number(editForm.inquiry) || 0),
          intent: Math.max(0, Number(editForm.intent) || 0),
          register: Math.max(0, Number(editForm.register) || 0),
          paid: Math.max(0, Number(editForm.paid) || 0),
        };
      }
      return item;
    });
    saveToStorage(updated);
    setEditingId(null);
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.majorName) return;

    // Check if major already exists
    const exists = funnelList.some(item => item.majorName === newForm.majorName);
    if (exists) {
      alert(`当前列表中已存在「${newForm.majorName}」的漏斗记录，请直接在列表中编辑该专业。`);
      return;
    }

    const newItem: FunnelData = {
      id: `funnel-${Date.now()}`,
      majorName: newForm.majorName,
      inquiry: Math.max(0, Number(newForm.inquiry) || 0),
      intent: Math.max(0, Number(newForm.intent) || 0),
      register: Math.max(0, Number(newForm.register) || 0),
      paid: Math.max(0, Number(newForm.paid) || 0),
    };

    const updated = [newItem, ...funnelList];
    saveToStorage(updated);
    setShowAddForm(false);
    setNewForm({
      majorName: "",
      inquiry: 100,
      intent: 50,
      register: 20,
      paid: 10,
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("确定要删除此专业的漏斗记录吗？")) {
      const updated = funnelList.filter((item) => item.id !== id);
      saveToStorage(updated);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm("确定要重新生成并覆盖漏斗初始种子数据吗？")) {
      const defaults = generateSeedData();
      saveToStorage(defaults);
      setSelectedMajor("all");
      setInquiryBoost(0);
      setPaidBoost(0);
    }
  };

  // Compute aggregated values
  const filteredFunnel = selectedMajor === "all" 
    ? funnelList 
    : funnelList.filter(f => f.majorName === selectedMajor);

  const aggInquiry = filteredFunnel.reduce((sum, f) => sum + f.inquiry, 0);
  const aggIntent = filteredFunnel.reduce((sum, f) => sum + f.intent, 0);
  const aggRegister = filteredFunnel.reduce((sum, f) => sum + f.register, 0);
  const aggPaid = filteredFunnel.reduce((sum, f) => sum + f.paid, 0);

  // Conversion rates
  const inquiryToIntent = aggInquiry > 0 ? (aggIntent / aggInquiry) * 100 : 0;
  const intentToRegister = aggIntent > 0 ? (aggRegister / aggIntent) * 100 : 0;
  const registerToPaid = aggRegister > 0 ? (aggPaid / aggRegister) * 100 : 0;
  const overallRate = aggInquiry > 0 ? (aggPaid / aggInquiry) * 100 : 0;
  const inquiryToRegister = aggInquiry > 0 ? (aggRegister / aggInquiry) * 100 : 0;

  const isLowInquiryToIntent = aggInquiry > 0 && inquiryToIntent < 25;
  const isLowIntentToRegister = aggIntent > 0 && intentToRegister < 15;
  const isLowRegisterToPaid = aggRegister > 0 && registerToPaid < 60;
  const isLowInquiryToRegister = aggInquiry > 0 && inquiryToRegister < 10;
  const isLowOverall = aggInquiry > 0 && overallRate < 5;

  // Find biggest drop off stage
  const rates = [
    { label: "咨询 ➔ 意向", rate: inquiryToIntent, stage: "意向跟约", hint: "多配合顾问响应时效性" },
    { label: "意向 ➔ 报名", rate: intentToRegister, stage: "定金预锁", hint: "建议优化主推班型或价格方案" },
    { label: "报名 ➔ 缴费", rate: registerToPaid, stage: "到账尾款", hint: "建议设立限时尾款催收策略" },
  ];
  const sortedDropOff = [...rates].sort((a, b) => a.rate - b.rate);
  const biggestLeak = aggInquiry > 0 ? sortedDropOff[0] : null;

  // Average overall conversion rate across all majors
  const totalGlobalInquiry = funnelList.reduce((sum, f) => sum + f.inquiry, 0);
  const totalGlobalPaid = funnelList.reduce((sum, f) => sum + f.paid, 0);
  const averageOverallRate = totalGlobalInquiry > 0 ? (totalGlobalPaid / totalGlobalInquiry) * 100 : 0;

  // What-If Simulator Calculations
  const baseInquiry = aggInquiry;
  const simulatedInquiry = Math.round(baseInquiry * (1 + inquiryBoost));
  
  // Calculate simulated stage outputs preserving rates
  const simIntent = Math.round(simulatedInquiry * (inquiryToIntent / 100));
  const simRegister = Math.round(simIntent * (intentToRegister / 100));
  
  // Register-to-Paid has boost applied
  const basePaidRate = registerToPaid / 100;
  const simPaidRate = Math.min(1.0, Math.max(0, basePaidRate + paidBoost));
  const simulatedPaid = Math.round(simRegister * simPaidRate);
  
  const additionalPaid = Math.max(0, simulatedPaid - aggPaid);
  
  // Tuition assumption is based on tuitionFee state
  const estimatedCurrentRevenue = aggPaid * tuitionFee;
  const estimatedSimulatedRevenue = simulatedPaid * tuitionFee;
  const incrementalRevenue = additionalPaid * tuitionFee;

  // Copy report to clipboard
  const handleCopyReport = () => {
    if (funnelList.length === 0) return;
    
    const formattedDate = selectedDate || "2026-06";
    const reportText = `📊 【招生流失漏斗深度诊断报告 - ${formattedDate}】
--------------------------------------------
🎯 专业维度: ${selectedMajor === "all" ? "所有专业合并汇总" : selectedMajor}
📈 漏斗核心数据规模:
  - 咨询登记学员: ${aggInquiry}人
  - 达成意向跟进: ${aggIntent}人
  - 预锁报名登记: ${aggRegister}人
  - 最终缴费到账: ${aggPaid}人
--------------------------------------------
⚡ 全生命链条转化效率:
  - 咨询 ➜ 意向率: ${inquiryToIntent.toFixed(1)}% (行业基准: 35%-50%)
  - 意向 ➜ 报名率: ${intentToRegister.toFixed(1)}% (行业基准: 20%-35%)
  - 报名 ➜ 缴费率: ${registerToPaid.toFixed(1)}% (行业基准: 75%-90%)
  - 全过程总转化率: ${overallRate.toFixed(2)}%

🚨 核心流失瓶颈诊断:
  - 当前最急需优化的主要漏水环节是: 【${biggestLeak?.stage || "未知"}】 (转化率: ${biggestLeak?.rate.toFixed(1)}%)
  - 改进建议: ${biggestLeak?.hint}

💰 预估现时学费产出总量 (按￥${tuitionFee.toLocaleString()}/人计): ￥${estimatedCurrentRevenue.toLocaleString()} 元

*由招生管家系统智能诊断生成。
--------------------------------------------`;

    navigator.clipboard.writeText(reportText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <div className={`flex-1 flex flex-col p-6 overflow-y-auto space-y-6 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      
      {/* Header Panel */}
      <div className={`p-5 border rounded-xl shadow-xs transition-colors duration-200 ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                招生转化漏斗深度分析 (Recruitment Funnel Diagnostics)
              </h3>
              <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-500 rounded text-[9px] font-bold">
                FORECAST ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              追踪从「学员咨询 ➜ 意向建立 ➜ 预约报名 ➜ 缴费到账」的精细化转化链条，提供 What-If 模拟预测沙盘，原地内容校准和报告导出功能。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-bold">筛选学科专业:</span>
              <select
                value={selectedMajor}
                onChange={(e) => setSelectedMajor(e.target.value)}
                className={`text-xs font-bold px-3 py-1.5 border rounded-lg outline-none transition-all ${
                  isDarkMode 
                    ? "bg-slate-950 border-slate-800 text-slate-100 focus:border-emerald-500" 
                    : "bg-white text-slate-800 border-slate-200 focus:border-emerald-500"
                }`}
              >
                <option value="all">📊 所有专业合并汇总</option>
                {allMajors.map((name, idx) => (
                  <option key={`opt-funnel-${name}-${idx}`} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleResetToDefault}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
              }`}
              title="重新计算并恢复漏斗出厂设定"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置默认</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Funnel Visualizer + Diagnostics + What-If SandBox */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Side: Funnel Visual Layout (7 columns) */}
        <div className={`xl:col-span-7 p-6 border rounded-xl shadow-xs flex flex-col justify-between transition-colors duration-200 ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div>
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-emerald-500" />
                漏斗流向与转化率可视化
              </h4>
              {selectedMajor !== "all" && (
                <span className="text-[10px] bg-indigo-500/10 text-indigo-500 font-bold px-2 py-0.5 rounded">
                  当前专业: {selectedMajor}
                </span>
              )}
            </div>

            {/* 3D simulated glassmorphism stages using Tailwind CSS */}
            <div className="space-y-4 max-w-lg mx-auto py-4">
              
              {/* Stage 1: Inquiry */}
              <div className="flex items-center">
                <div className="w-24 text-right pr-4 text-xs font-bold text-slate-400">
                  咨询登记
                </div>
                <div className="flex-1">
                  <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-3.5 text-center relative overflow-hidden shadow-3xs hover:scale-[1.01] transition-all">
                    <div className="absolute inset-y-0 left-0 bg-blue-500/10 w-full"></div>
                    <div className="relative z-10 flex items-center justify-between px-4">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center font-mono text-[10px] font-bold">1</span>
                        <span className="text-xs font-extrabold text-blue-700 dark:text-blue-400">初始咨询登记线索</span>
                      </div>
                      <span className="font-mono text-sm font-extrabold text-blue-800 dark:text-blue-200">{aggInquiry} 人</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rate 1 */}
              <div className="flex justify-center -my-2.5">
                <div className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold flex items-center space-x-1 border shadow-xs z-10 ${
                  isLowInquiryToIntent 
                    ? "bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 animate-pulse"
                    : isDarkMode ? "bg-slate-950 border-slate-800 text-blue-400" : "bg-blue-50 border-blue-100 text-blue-700"
                }`}>
                  {isLowInquiryToIntent && <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />}
                  <span>意向达成率:</span>
                  <span className="text-xs font-extrabold">{inquiryToIntent.toFixed(1)}%</span>
                  {isLowInquiryToIntent && <span className="text-[9px] font-bold text-rose-500">(异常偏低)</span>}
                </div>
              </div>

              {/* Stage 2: Intent */}
              <div className="flex items-center">
                <div className="w-24 text-right pr-4 text-xs font-bold text-slate-400">
                  意向邀约
                </div>
                <div className="flex-1 px-6">
                  <div className={`bg-gradient-to-r ${
                    isLowInquiryToIntent
                      ? "from-rose-500/15 to-rose-600/5 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.15)] animate-pulse"
                      : "from-indigo-500/10 to-indigo-600/5 border-indigo-500/20"
                  } border rounded-xl p-3.5 text-center relative overflow-hidden shadow-3xs hover:scale-[1.01] transition-all group/stage2`}>
                    <div className={`absolute inset-y-0 left-0 ${
                      isLowInquiryToIntent ? "bg-rose-500/10" : "bg-indigo-500/10"
                    } w-full`}></div>
                    <div className="relative z-10 flex items-center justify-between px-4">
                      <div className="flex items-center space-x-2">
                        <span className={`w-5 h-5 rounded-full ${
                          isLowInquiryToIntent 
                            ? "bg-rose-500/20 text-rose-600" 
                            : "bg-indigo-500/20 text-indigo-600"
                        } flex items-center justify-center font-mono text-[10px] font-bold`}>2</span>
                        <span className={`text-xs font-extrabold ${
                          isLowInquiryToIntent
                            ? "text-rose-700 dark:text-rose-400"
                            : "text-indigo-700 dark:text-indigo-400"
                        }`}>有效意向客户跟进</span>
                        {isLowInquiryToIntent && (
                          <span className="flex items-center justify-center relative cursor-help">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                            {/* Hover tooltip */}
                            <div className={`absolute bottom-full mb-1.5 left-0 hidden group-hover/stage2:block z-50 p-2.5 rounded-lg text-[10px] leading-relaxed shadow-xl border w-56 text-left whitespace-normal ${
                              isDarkMode 
                                ? "bg-slate-950 border-rose-950 text-slate-200" 
                                : "bg-white border-rose-100 text-slate-800"
                            }`}>
                              <div className="font-bold text-rose-500 flex items-center gap-1 mb-1">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                转化率警告 (异常偏低)
                              </div>
                              <p>
                                ● <strong>咨询 ➜ 意向率</strong> 仅为 <strong className="text-rose-500">{inquiryToIntent.toFixed(1)}%</strong>，低于预设安全阈值 <strong>25.0%</strong>！
                              </p>
                              <p className="mt-1 text-slate-400 text-[9px] border-t pt-1 dark:border-slate-800 border-slate-100">
                                建议：检查线索呼叫时效（黄金2小时内回拨）、前段渠道话术吻合度。
                              </p>
                            </div>
                          </span>
                        )}
                      </div>
                      <span className={`font-mono text-sm font-extrabold ${
                        isLowInquiryToIntent
                          ? "text-rose-800 dark:text-rose-200"
                          : "text-indigo-800 dark:text-indigo-200"
                      }`}>{aggIntent} 人</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rate 2 */}
              <div className="flex justify-center -my-2.5">
                <div className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold flex items-center space-x-1 border shadow-xs z-10 ${
                  isLowIntentToRegister
                    ? "bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 animate-pulse"
                    : isDarkMode ? "bg-slate-950 border-slate-800 text-indigo-400" : "bg-indigo-50 border-indigo-100 text-indigo-700"
                }`}>
                  {isLowIntentToRegister && <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />}
                  <span>定金预约率:</span>
                  <span className="text-xs font-extrabold">{intentToRegister.toFixed(1)}%</span>
                  {isLowIntentToRegister && <span className="text-[9px] font-bold text-rose-500">(异常偏低)</span>}
                </div>
              </div>

              {/* Stage 3: Register */}
              <div className="flex items-center">
                <div className="w-24 text-right pr-4 text-xs font-bold text-slate-400">
                  定金报名
                </div>
                <div className="flex-1 px-12">
                  <div className={`bg-gradient-to-r ${
                    isLowInquiryToRegister || isLowIntentToRegister
                      ? "from-rose-500/15 to-rose-600/5 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.15)] animate-pulse"
                      : "from-purple-500/10 to-purple-600/5 border-purple-500/20"
                  } border rounded-xl p-3.5 text-center relative overflow-hidden shadow-3xs hover:scale-[1.01] transition-all group/stage3`}>
                    <div className={`absolute inset-y-0 left-0 ${
                      isLowInquiryToRegister || isLowIntentToRegister ? "bg-rose-500/10" : "bg-purple-500/10"
                    } w-full`}></div>
                    <div className="relative z-10 flex items-center justify-between px-4">
                      <div className="flex items-center space-x-2">
                        <span className={`w-5 h-5 rounded-full ${
                          isLowInquiryToRegister || isLowIntentToRegister 
                            ? "bg-rose-500/20 text-rose-600" 
                            : "bg-purple-500/20 text-purple-600"
                        } flex items-center justify-center font-mono text-[10px] font-bold`}>3</span>
                        <span className={`text-xs font-extrabold ${
                          isLowInquiryToRegister || isLowIntentToRegister
                            ? "text-rose-700 dark:text-rose-400"
                            : "text-purple-700 dark:text-purple-400"
                        }`}>预收定金锁定学员</span>
                        {(isLowInquiryToRegister || isLowIntentToRegister) && (
                          <span className="flex items-center justify-center relative cursor-help">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                            {/* Hover tooltip */}
                            <div className={`absolute bottom-full mb-1.5 left-0 hidden group-hover/stage3:block z-50 p-2.5 rounded-lg text-[10px] leading-relaxed shadow-xl border w-56 text-left whitespace-normal ${
                              isDarkMode 
                                ? "bg-slate-950 border-rose-950 text-slate-200" 
                                : "bg-white border-rose-100 text-slate-800"
                            }`}>
                              <div className="font-bold text-rose-500 flex items-center gap-1 mb-1">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                转化率警告 (异常偏低)
                              </div>
                              {isLowInquiryToRegister && (
                                <p className="mb-1">
                                  ● <strong>咨询 ➜ 报名率</strong> 仅为 <strong className="text-rose-500">{inquiryToRegister.toFixed(1)}%</strong>，低于安全警戒阈值 <strong>10.0%</strong>！
                                </p>
                              )}
                              {isLowIntentToRegister && (
                                <p>
                                  ● <strong>意向 ➜ 报名率</strong> 仅为 <strong className="text-rose-500">{intentToRegister.toFixed(1)}%</strong>，低于预设阈值 <strong>15.0%</strong>！
                                </p>
                              )}
                              <p className="mt-1 text-slate-400 text-[9px] border-t pt-1 dark:border-slate-800 border-slate-100">
                                建议：检查专业课程吸引力、优惠锁定策略或销售跟进效率。
                              </p>
                            </div>
                          </span>
                        )}
                      </div>
                      <span className={`font-mono text-sm font-extrabold ${
                        isLowInquiryToRegister || isLowIntentToRegister
                          ? "text-rose-800 dark:text-rose-200"
                          : "text-purple-800 dark:text-purple-200"
                      }`}>{aggRegister} 人</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rate 3 */}
              <div className="flex justify-center -my-2.5">
                <div className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold flex items-center space-x-1 border shadow-xs z-10 ${
                  isLowRegisterToPaid
                    ? "bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 animate-pulse"
                    : isDarkMode ? "bg-slate-950 border-slate-800 text-purple-400" : "bg-purple-50 border-purple-100 text-purple-700"
                }`}>
                  {isLowRegisterToPaid && <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />}
                  <span>尾款回款率:</span>
                  <span className="text-xs font-extrabold">{registerToPaid.toFixed(1)}%</span>
                  {isLowRegisterToPaid && <span className="text-[9px] font-bold text-rose-500">(异常偏低)</span>}
                </div>
              </div>

              {/* Stage 4: Paid */}
              <div className="flex items-center">
                <div className="w-24 text-right pr-4 text-xs font-bold text-slate-400">
                  全额到账
                </div>
                <div className="flex-1 px-18">
                  <div className={`bg-gradient-to-r ${
                    isLowRegisterToPaid
                      ? "from-rose-500/15 to-rose-600/5 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.15)] animate-pulse"
                      : "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20"
                  } border rounded-xl p-3.5 text-center relative overflow-hidden shadow-3xs hover:scale-[1.01] transition-all group/stage4`}>
                    <div className={`absolute inset-y-0 left-0 ${
                      isLowRegisterToPaid ? "bg-rose-500/10" : "bg-emerald-500/10"
                    } w-full`}></div>
                    <div className="relative z-10 flex items-center justify-between px-4">
                      <div className="flex items-center space-x-2">
                        <span className={`w-5 h-5 rounded-full ${
                          isLowRegisterToPaid 
                            ? "bg-rose-500/20 text-rose-600" 
                            : "bg-emerald-500/20 text-emerald-600"
                        } flex items-center justify-center font-mono text-[10px] font-bold`}>4</span>
                        <span className={`text-xs font-extrabold ${
                          isLowRegisterToPaid
                            ? "text-rose-700 dark:text-rose-400"
                            : "text-emerald-700 dark:text-emerald-400"
                        }`}>尾款到账缴费学员</span>
                        {isLowRegisterToPaid && (
                          <span className="flex items-center justify-center relative cursor-help">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                            {/* Hover tooltip */}
                            <div className={`absolute bottom-full mb-1.5 left-0 hidden group-hover/stage4:block z-50 p-2.5 rounded-lg text-[10px] leading-relaxed shadow-xl border w-56 text-left whitespace-normal ${
                              isDarkMode 
                                ? "bg-slate-950 border-rose-950 text-slate-200" 
                                : "bg-white border-rose-100 text-slate-800"
                            }`}>
                              <div className="font-bold text-rose-500 flex items-center gap-1 mb-1">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                转化率警告 (异常偏低)
                              </div>
                              <p>
                                ● <strong>报名 ➜ 缴费率</strong> 仅为 <strong className="text-rose-500">{registerToPaid.toFixed(1)}%</strong>，低于安全警戒阈值 <strong>60.0%</strong>！
                              </p>
                              <p className="mt-1 text-slate-400 text-[9px] border-t pt-1 dark:border-slate-800 border-slate-100">
                                建议：检查班级开课通知速度、建立限时退费政策宣贯或尾款追收方案。
                              </p>
                            </div>
                          </span>
                        )}
                      </div>
                      <span className={`font-mono text-sm font-extrabold ${
                        isLowRegisterToPaid
                          ? "text-rose-800 dark:text-rose-200"
                          : "text-emerald-800 dark:text-emerald-200"
                      }`}>{aggPaid} 人</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom overview stat row */}
          <div className="mt-6 pt-4 border-t border-slate-150/40 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isDarkMode ? "bg-emerald-950/50 text-emerald-400" : "bg-emerald-50 text-emerald-700"
              }`}>
                全链条总转化率
              </span>
              <span className="font-mono font-extrabold text-lg text-emerald-600 dark:text-emerald-400">
                {overallRate.toFixed(2)}%
              </span>
              <span className="text-[10px] text-slate-400">
                (平均基准: {averageOverallRate.toFixed(1)}%)
              </span>
            </div>

            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>总转化率 = 缴费到账学员数 / 初始咨询登记学员数。</span>
            </div>
          </div>
        </div>

        {/* Right Side: Diagnostics & What-If SandBox (5 columns) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          
          {/* Diagnostic Widget */}
          <div className={`p-5 border rounded-xl shadow-xs space-y-4 transition-colors duration-200 ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <AlertCircle className="w-4.5 h-4.5 text-amber-500" />
                招生流失漏斗诊断 (Diagnostic)
              </h4>
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-500 hover:text-emerald-600 transition-colors"
                title="将深度诊断报告和建议复制到剪贴板"
              >
                <Copy className="w-3 h-3" />
                <span>{copySuccess ? "已复制!" : "复制诊断"}</span>
              </button>
            </div>

            {aggInquiry === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                暂无数据，请在下方数据列表中录入/编辑专业漏斗。
              </div>
            ) : (
              <div className="space-y-3.5 text-xs">
                {/* Abnormally Low Conversion Alerts */}
                {(isLowInquiryToIntent || isLowIntentToRegister || isLowRegisterToPaid || isLowInquiryToRegister || isLowOverall) && (
                  <div className={`p-3.5 border rounded-xl space-y-2.5 ${
                    isDarkMode ? "bg-rose-950/20 border-rose-900/40 text-rose-200" : "bg-rose-50/70 border-rose-150 text-rose-900"
                  }`}>
                    <div className="font-bold flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                      <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                      <span>异常流失与转化率警报 (Alerts)</span>
                    </div>
                    <div className="text-[11px] space-y-1.5 leading-relaxed">
                      {isLowInquiryToRegister && (
                        <div className="flex items-start gap-1">
                          <span className="text-rose-500 font-bold shrink-0">🚨 咨询 ➔ 报名:</span>
                          <span>总转化率 <strong className="font-mono text-rose-600 dark:text-rose-400">{inquiryToRegister.toFixed(1)}%</strong> 远低于安全水位 (10.0%)！从初始广告咨询到定金锁定流失异常严重，急需检查各专业课程吸引力或前段跟进质量！</span>
                        </div>
                      )}
                      {isLowInquiryToIntent && (
                        <div className="flex items-start gap-1">
                          <span className="text-rose-500 font-bold shrink-0">⚠️ 咨询 ➔ 意向:</span>
                          <span>转化率 <strong className="font-mono text-rose-600 dark:text-rose-400">{inquiryToIntent.toFixed(1)}%</strong> 偏低 (阈值 25.0%)。表明呼叫时效慢或线索不匹配。</span>
                        </div>
                      )}
                      {isLowIntentToRegister && (
                        <div className="flex items-start gap-1">
                          <span className="text-rose-500 font-bold shrink-0">⚠️ 意向 ➔ 报名:</span>
                          <span>转化率 <strong className="font-mono text-rose-600 dark:text-rose-400">{intentToRegister.toFixed(1)}%</strong> 偏低 (阈值 15.0%)。意向客户不愿交定金锁位。</span>
                        </div>
                      )}
                      {isLowRegisterToPaid && (
                        <div className="flex items-start gap-1">
                          <span className="text-rose-500 font-bold shrink-0">⚠️ 报名 ➔ 缴费:</span>
                          <span>转化率 <strong className="font-mono text-rose-600 dark:text-rose-400">{registerToPaid.toFixed(1)}%</strong> 偏低 (阈值 60.0%)。定金锁定后全款到账率低下。</span>
                        </div>
                      )}
                      {isLowOverall && (
                        <div className="flex items-start gap-1">
                          <span className="text-rose-500 font-bold shrink-0">⚠️ 全过程总转化:</span>
                          <span>最终到账率仅 <strong className="font-mono text-rose-600 dark:text-rose-400">{overallRate.toFixed(2)}%</strong> (警戒线 5.0%)。</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Biggest dropoff diagnosis */}
                {biggestLeak && (
                  <div className={`p-3.5 border rounded-xl ${
                    isDarkMode ? "bg-rose-950/25 border-rose-900/50 text-rose-300" : "bg-rose-50 border-rose-150 text-rose-800"
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                      <span>最大流失环节：【{biggestLeak.stage}】</span>
                    </div>
                    <p className="mt-1.5 leading-relaxed opacity-90 text-[11px]">
                      当前 <strong>{biggestLeak.label}</strong> 转换率最低，仅为 <strong>{biggestLeak.rate.toFixed(1)}%</strong>。
                      这是制约招生进度的最大瓶颈，{biggestLeak.hint}。
                    </p>
                  </div>
                )}

                {/* Advice list */}
                <div className="space-y-2 text-slate-500 leading-normal text-[11px]">
                  <div className="flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <span>到账转化分析：报名到缴费的尾款到账比为 <strong>{registerToPaid.toFixed(1)}%</strong>。如低于80%，应加紧尾款催缴，推出限时礼包锁班。</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <span>意向邀约效率：咨询至意向转换率为 <strong>{inquiryToIntent.toFixed(1)}%</strong>。若低于35%，说明前段搜索引擎广告引入的质量偏杂，或销售老师回拨未在2小时黄金期内进行。</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive What-If Simulation 沙盘预测 */}
          <div className={`p-5 border rounded-xl shadow-xs space-y-4 transition-colors duration-200 ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-4.5 h-4.5" />
                招生增量模拟沙盘 (What-If Planning)
              </h4>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500">
                学费基准 ￥${(tuitionFee / 1000).toFixed(1)}K
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              调整驱动参数与客单学费，模拟投放扩张或流程优化后的营收成效：
            </p>

            <div className="space-y-4 text-xs">
              {/* Slider 1: Inquiry boost */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 font-bold">1. 前端咨询线索放量 (广告投放扩张)</span>
                  <span className="font-bold font-mono text-emerald-600">+{Math.round(inquiryBoost * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={inquiryBoost}
                  onChange={(e) => setInquiryBoost(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>保持现状 ({aggInquiry}人)</span>
                  <span>线索翻倍 (+{aggInquiry}人)</span>
                </div>
              </div>

              {/* Slider 2: Paid rate boost */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 font-bold">2. 尾款催缴锁定优化 (谈单效率提升)</span>
                  <span className="font-bold font-mono text-indigo-600">+{Math.round(paidBoost * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.25"
                  step="0.01"
                  value={paidBoost}
                  onChange={(e) => setPaidBoost(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>基准 ({registerToPaid.toFixed(0)}%)</span>
                  <span>上限 +25%</span>
                </div>
              </div>

              {/* Slider 3: Tuition Fee */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 font-bold">3. 平均学费客单价微调 (班型定价策略)</span>
                  <span className="font-bold font-mono text-amber-600">￥{tuitionFee.toLocaleString()} / 人</span>
                </div>
                <input
                  type="range"
                  min="3000"
                  max="30000"
                  step="500"
                  value={tuitionFee}
                  onChange={(e) => setTuitionFee(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>普及轻量班 (￥3,000)</span>
                  <span>高端封闭特训 (￥30,000)</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">💡 快速运营场景模拟预设</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setInquiryBoost(0.25);
                      setPaidBoost(0);
                    }}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all cursor-pointer border ${
                      Math.abs(inquiryBoost - 0.25) < 0.01 && paidBoost === 0
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-500"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    🚀 投放放量 (+25%)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInquiryBoost(0);
                      setPaidBoost(0.1);
                    }}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all cursor-pointer border ${
                      inquiryBoost === 0 && Math.abs(paidBoost - 0.1) < 0.01
                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-500"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    ⚡ 谈单优化 (+10%)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInquiryBoost(0.4);
                      setPaidBoost(0.15);
                    }}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all cursor-pointer border ${
                      Math.abs(inquiryBoost - 0.4) < 0.01 && Math.abs(paidBoost - 0.15) < 0.01
                        ? "bg-purple-500/10 border-purple-500 text-purple-500"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    🔥 投放+谈单双突破
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInquiryBoost(0);
                      setPaidBoost(0);
                      setTuitionFee(9800);
                    }}
                    className="px-2.5 py-1 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent cursor-pointer"
                  >
                    🔄 重置
                  </button>
                </div>
              </div>

              {/* Simulation Output Dashboard */}
              <div className={`p-4 rounded-xl border space-y-2.5 ${
                isDarkMode ? "bg-slate-950 border-indigo-950/60" : "bg-indigo-50/40 border-indigo-100"
              }`}>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">模拟最终到账数</span>
                    <span className="text-base font-extrabold font-mono text-slate-800 dark:text-slate-200">
                      {simulatedPaid} 人
                    </span>
                    <span className="text-[9px] text-emerald-500 block font-bold">净增 +{additionalPaid} 人到账</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">净增招生学费规模</span>
                    <span className="text-base font-extrabold font-mono text-emerald-600">
                      ￥{incrementalRevenue.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400 block">总计 ￥{estimatedSimulatedRevenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Database Listing & Editing Table (Bottom block) */}
      <div className={`p-5 border rounded-xl shadow-xs space-y-4 transition-colors duration-200 ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
              各招生专业漏斗录入管理中心 (Data Entry Desk)
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">可以直接在此录入或修改意向人数。删除或新增不会影响真实省市招生大盘。</p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-all cursor-pointer shadow-sm shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>录入新专业漏斗记录</span>
          </button>
        </div>

        {/* Add Record Form */}
        {showAddForm && (
          <form onSubmit={handleAddNew} className={`p-4 border rounded-xl space-y-3 ${isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"} animate-fade-in`}>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">专业名称</label>
                <select
                  value={newForm.majorName}
                  onChange={(e) => setNewForm({ ...newForm, majorName: e.target.value })}
                  className={`w-full px-2.5 py-1.5 border rounded-md text-xs outline-none ${
                    isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200"
                  }`}
                  required
                >
                  <option value="">-- 选择专业 --</option>
                  {allMajors.map((name, idx) => (
                    <option key={`opt-add-funnel-${name}-${idx}`} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">咨询登记数 (人)</label>
                <input
                  type="number"
                  min="0"
                  value={newForm.inquiry}
                  onChange={(e) => setNewForm({ ...newForm, inquiry: parseInt(e.target.value) || 0 })}
                  className={`w-full px-2.5 py-1.5 border rounded-md text-xs outline-none ${
                    isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">意向学员数 (人)</label>
                <input
                  type="number"
                  min="0"
                  value={newForm.intent}
                  onChange={(e) => setNewForm({ ...newForm, intent: parseInt(e.target.value) || 0 })}
                  className={`w-full px-2.5 py-1.5 border rounded-md text-xs outline-none ${
                    isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">定金预约数 (人)</label>
                <input
                  type="number"
                  min="0"
                  value={newForm.register}
                  onChange={(e) => setNewForm({ ...newForm, register: parseInt(e.target.value) || 0 })}
                  className={`w-full px-2.5 py-1.5 border rounded-md text-xs outline-none ${
                    isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">最终到账数 (人)</label>
                <input
                  type="number"
                  min="0"
                  value={newForm.paid}
                  onChange={(e) => setNewForm({ ...newForm, paid: parseInt(e.target.value) || 0 })}
                  className={`w-full px-2.5 py-1.5 border rounded-md text-xs outline-none ${
                    isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200"
                  }`}
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-200/50 rounded-lg cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-xs"
              >
                确认录入
              </button>
            </div>
          </form>
        )}

        {/* Database Grid Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className={`border-b font-bold ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"}`}>
                <th className="px-4 py-3 w-12 text-center">序号</th>
                <th className="px-4 py-3">专业/方向</th>
                <th className="px-4 py-3 text-center">咨询线索 (1)</th>
                <th className="px-4 py-3 text-center">意向跟进 (2)</th>
                <th className="px-4 py-3 text-center">定金锁位 (3)</th>
                <th className="px-4 py-3 text-center">尾款到账 (4)</th>
                <th className="px-4 py-3 text-center">综合转化 (4/1)</th>
                <th className="px-4 py-3 text-center">均值偏差</th>
                <th className="px-4 py-3 text-center w-32">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150/40 dark:divide-slate-850">
              {funnelList.map((item, idx) => {
                const isEditing = editingId === item.id;
                const totalConv = item.inquiry > 0 ? (item.paid / item.inquiry) * 100 : 0;
                const deviance = totalConv - averageOverallRate;

                return (
                  <tr key={`funnel-row-${item.id}-${idx}`} className={`transition-colors hover:bg-slate-50/50 ${isDarkMode ? "hover:bg-slate-900/40" : ""}`}>
                    <td className="px-4 py-3 font-mono font-bold text-slate-400 text-center">{idx + 1}</td>
                    <td className="px-4 py-3 font-extrabold text-slate-800 dark:text-slate-100">{item.majorName}</td>
                    
                    {/* Inquiry */}
                    <td className="px-4 py-3 text-center font-mono">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editForm.inquiry}
                          onChange={(e) => setEditForm({ ...editForm, inquiry: parseInt(e.target.value) || 0 })}
                          className={`w-20 text-center px-1.5 py-1 border rounded text-xs font-bold outline-none ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-300"}`}
                        />
                      ) : (
                        <span className="font-bold">{item.inquiry}</span>
                      )}
                    </td>

                    {/* Intent */}
                    <td className="px-4 py-3 text-center font-mono">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editForm.intent}
                          onChange={(e) => setEditForm({ ...editForm, intent: parseInt(e.target.value) || 0 })}
                          className={`w-20 text-center px-1.5 py-1 border rounded text-xs font-bold outline-none ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-300"}`}
                        />
                      ) : (
                        <span>{item.intent}</span>
                      )}
                    </td>

                    {/* Register */}
                    <td className="px-4 py-3 text-center font-mono">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editForm.register}
                          onChange={(e) => setEditForm({ ...editForm, register: parseInt(e.target.value) || 0 })}
                          className={`w-20 text-center px-1.5 py-1 border rounded text-xs font-bold outline-none ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-300"}`}
                        />
                      ) : (
                        <span>{item.register}</span>
                      )}
                    </td>

                    {/* Paid */}
                    <td className="px-4 py-3 text-center font-mono">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editForm.paid}
                          onChange={(e) => setEditForm({ ...editForm, paid: parseInt(e.target.value) || 0 })}
                          className={`w-20 text-center px-1.5 py-1 border rounded text-xs font-bold outline-none ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-300"}`}
                        />
                      ) : (
                        <span className="font-bold text-slate-800 dark:text-slate-100">{item.paid}</span>
                      )}
                    </td>

                    {/* Conversion Rate */}
                    <td className="px-4 py-3 text-center font-mono">
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {totalConv.toFixed(1)}%
                      </span>
                    </td>

                    {/* Benchmark Deviance */}
                    <td className="px-4 py-3 text-center font-mono text-[10px] font-bold">
                      {deviance >= 0 ? (
                        <span className="text-emerald-600">
                          ▲ +{deviance.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-rose-500">
                          ▼ {deviance.toFixed(1)}%
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(item.id)}
                            className="px-2 py-1 text-[10px] bg-emerald-600 text-white rounded font-bold hover:bg-emerald-500 cursor-pointer"
                          >
                            保存
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 text-[10px] bg-slate-300 text-slate-700 rounded font-medium hover:bg-slate-400 cursor-pointer"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="p-1 text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer"
                            title="修改本行数值"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                            title="删除此专业漏斗"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
