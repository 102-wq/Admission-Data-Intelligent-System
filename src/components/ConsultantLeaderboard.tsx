/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { RowData, TableConfig } from "../types";
import { 
  Award, 
  TrendingUp, 
  Users, 
  Flame, 
  Calculator, 
  Sparkles, 
  Zap, 
  ChevronRight, 
  Target, 
  BarChart2, 
  UserPlus, 
  DollarSign, 
  CheckCircle2, 
  Search, 
  RotateCcw,
  BadgeAlert,
  ArrowUpRight
} from "lucide-react";

interface ConsultantLeaderboardProps {
  rows: RowData[];
  config: TableConfig;
  selectedDate: string;
  isDarkMode: boolean;
}

interface TeamStats {
  name: string;
  actual: number;
  target: number;
  rate: number;
  score: number; // Simulated customer satisfaction score (e.g. 4.5 - 4.9)
  payout: number; // Projected performance rewards
}

// Predefined individual advisors for finer granularity simulation
interface AdvisorData {
  id: string;
  name: string;
  dept: string;
  actual: number;
  target: number;
  rate: number;
  satisfaction: number;
  phoneCalls: number;
  hotLeads: number;
}

const SEED_ADVISORS: AdvisorData[] = [
  { id: "adv-1", name: "张华 (老师)", dept: "咨询一部", actual: 42, target: 50, rate: 84.0, satisfaction: 4.9, phoneCalls: 840, hotLeads: 120 },
  { id: "adv-2", name: "李娜 (老师)", dept: "咨询一部", actual: 38, target: 45, rate: 84.4, satisfaction: 4.8, phoneCalls: 760, hotLeads: 98 },
  { id: "adv-3", name: "王军 (老师)", dept: "咨询二部", actual: 45, target: 55, rate: 81.8, satisfaction: 4.7, phoneCalls: 910, hotLeads: 140 },
  { id: "adv-4", name: "赵敏 (老师)", dept: "咨询二部", actual: 31, target: 40, rate: 77.5, satisfaction: 4.8, phoneCalls: 620, hotLeads: 85 },
  { id: "adv-5", name: "刘洋 (主管)", dept: "代理合作", actual: 58, target: 60, rate: 96.7, satisfaction: 4.9, phoneCalls: 450, hotLeads: 180 },
  { id: "adv-6", name: "陈静 (老师)", dept: "咨询一部", actual: 29, target: 35, rate: 82.9, satisfaction: 4.6, phoneCalls: 580, hotLeads: 70 },
  { id: "adv-7", name: "孙涛 (专员)", dept: "老生转介绍", actual: 24, target: 25, rate: 96.0, satisfaction: 4.9, phoneCalls: 310, hotLeads: 55 },
  { id: "adv-8", name: "周梅 (老师)", dept: "咨询二部", actual: 27, target: 40, rate: 67.5, satisfaction: 4.5, phoneCalls: 540, hotLeads: 68 }
];

export default function ConsultantLeaderboard({ rows, config, selectedDate, isDarkMode }: ConsultantLeaderboardProps) {
  const activeMonth = selectedDate.substring(0, 7);
  const [leaderboardType, setLeaderboardType] = useState<"department" | "advisor">("department");
  const [advisors, setAdvisors] = useState<AdvisorData[]>(() => {
    try {
      const saved = localStorage.getItem("recruitment_advisors_list");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Unable to access localStorage:", e);
    }
    return SEED_ADVISORS;
  });
  const [searchQuery, setSearchQuery] = useState("");
  
  // New Advisor Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdvName, setNewAdvName] = useState("");
  const [newAdvDept, setNewAdvDept] = useState("咨询一部");
  const [newAdvActual, setNewAdvActual] = useState(15);
  const [newAdvTarget, setNewAdvTarget] = useState(20);
  const [newAdvSatisfaction, setNewAdvSatisfaction] = useState(4.8);
  const [newAdvCalls, setNewAdvCalls] = useState(300);
  const [newAdvLeads, setNewAdvLeads] = useState(50);
  
  // PK Arena States
  const [pkAdv1, setPkAdv1] = useState<string>("adv-1");
  const [pkAdv2, setPkAdv2] = useState<string>("adv-3");

  // Commission Calculator States
  const [calcDept, setCalcDept] = useState("咨询一部");
  const [calcBaseSalary, setCalcBaseSalary] = useState(4500);
  const [calcActualSales, setCalcActualSales] = useState(35);
  const [calcTier, setCalcTier] = useState<"standard" | "high" | "executive">("standard");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("recruitment_advisors_list");
      if (!saved) {
        localStorage.setItem("recruitment_advisors_list", JSON.stringify(SEED_ADVISORS));
      }
    } catch (e) {
      console.warn("Unable to write default advisors to localStorage:", e);
    }
  }, []);

  const saveAdvisors = (newAdvisors: AdvisorData[]) => {
    setAdvisors(newAdvisors);
    try {
      localStorage.setItem("recruitment_advisors_list", JSON.stringify(newAdvisors));
    } catch (e) {
      console.warn("Unable to write advisors to localStorage:", e);
    }
  };

  const handleAddAdvisor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdvName.trim()) return;
    const newAdv: AdvisorData = {
      id: `adv-${Date.now()}`,
      name: newAdvName.trim(),
      dept: newAdvDept,
      actual: Number(newAdvActual) || 0,
      target: Number(newAdvTarget) || 1,
      rate: Number(newAdvTarget) > 0 ? (Number(newAdvActual) / Number(newAdvTarget)) * 100 : 0,
      satisfaction: Number(newAdvSatisfaction) || 5.0,
      phoneCalls: Number(newAdvCalls) || 0,
      hotLeads: Number(newAdvLeads) || 0
    };
    const updated = [...advisors, newAdv];
    saveAdvisors(updated);
    
    // Reset Form
    setNewAdvName("");
    setNewAdvActual(15);
    setNewAdvTarget(20);
    setNewAdvSatisfaction(4.8);
    setNewAdvCalls(300);
    setNewAdvLeads(50);
    setShowAddForm(false);
  };

  const handleDeleteAdvisor = (id: string) => {
    if (window.confirm("确定要删除这位顾问老师吗？")) {
      const updated = advisors.filter(a => a.id !== id);
      saveAdvisors(updated);
    }
  };

  // 1. Calculate Real Department Stats from Live rows!
  const getDepartmentStats = (): TeamStats[] => {
    // Filter rows belonging to the active month to make it dynamic
    const activeMonthRows = rows.filter(r => r.date.startsWith(activeMonth));
    const targetRows = activeMonthRows.length > 0 ? activeMonthRows : rows; // Fallback to all if empty

    return config.channels.map((channelName, idx) => {
      let actualSum = 0;
      let targetSum = 0;

      targetRows.forEach((row) => {
        if (row.channels && row.channels[idx]) {
          actualSum += row.channels[idx].actual || 0;
          targetSum += row.channels[idx].target || 0;
        }
      });

      const rate = targetSum > 0 ? (actualSum / targetSum) * 100 : 0;
      
      // Seed a deterministic score based on the channel index to keep it consistent yet realistic
      const score = 4.5 + ((idx * 7) % 5) * 0.1; 
      const payout = actualSum * 300 + (rate >= 100 ? 2000 : 0); // 300 RMB per signup + bonus

      return {
        name: channelName,
        actual: actualSum,
        target: targetSum,
        rate,
        score,
        payout
      };
    }).sort((a, b) => b.actual - a.actual); // Sorted by actual registrations
  };

  const deptStats = getDepartmentStats();
  
  // Podium top 3 departments
  const goldDept = deptStats[0];
  const silverDept = deptStats[1];
  const bronzeDept = deptStats[2];

  // Filter advisors based on search query
  const filteredAdvisors = advisors.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.dept.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => b.actual - a.actual);

  // Commission Calculations
  const getCommissionCalculation = () => {
    const ratePerStudent = calcTier === "standard" ? 250 : calcTier === "high" ? 350 : 500;
    const baseCommission = calcActualSales * ratePerStudent;
    
    // Progress bonuses
    let bonus = 0;
    if (calcActualSales >= 40) {
      bonus = 3000;
    } else if (calcActualSales >= 30) {
      bonus = 1500;
    } else if (calcActualSales >= 20) {
      bonus = 500;
    }

    const totalSalary = calcBaseSalary + baseCommission + bonus;
    return {
      baseCommission,
      bonus,
      totalSalary,
      ratePerStudent
    };
  };

  const commResults = getCommissionCalculation();

  // Arena Comparison
  const advisor1 = advisors.find(a => a.id === pkAdv1) || advisors[0] || SEED_ADVISORS[0];
  const advisor2 = advisors.find(a => a.id === pkAdv2) || advisors[1] || advisors[0] || SEED_ADVISORS[1];

  return (
    <div className={`flex-1 flex flex-col p-6 overflow-y-auto space-y-6 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      
      {/* Header Panel */}
      <div className={`p-5 border rounded-xl shadow-xs transition-colors duration-200 ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                招生顾问与团队业绩PK榜 (Sales Leaderboard & Advisor Arena)
              </h3>
              <span className="px-1.5 py-0.5 bg-rose-500/15 text-rose-500 rounded text-[9px] font-bold uppercase tracking-wider">
                LIVE COMPETITION
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              追踪各部门及个人招生进展。通过动态排行榜、顾问竞技PK擂台和提成级联计算器，多维激发团队攻坚热情，助力全额到账目标精准突破。
            </p>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border dark:border-slate-800 shrink-0">
            <button
              onClick={() => setLeaderboardType("department")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                leaderboardType === "department"
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🏢 部门PK榜
            </button>
            <button
              onClick={() => setLeaderboardType("advisor")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                leaderboardType === "advisor"
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              👤 个人PK榜
            </button>
          </div>
        </div>
      </div>

      {/* Podium Panel for Top 3 (Only when department is active) */}
      {leaderboardType === "department" && deptStats.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto w-full pt-4">
          
          {/* Silver - 2nd Place */}
          <div className="flex flex-col items-center space-y-2">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">SILVER MEDAL</span>
              <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300">{silverDept.name}</span>
            </div>
            <div className={`w-full h-32 rounded-t-xl border-x border-t relative flex flex-col items-center justify-between p-4 transition-all ${
              isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="absolute -top-3 w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center border-2 border-white shadow-sm">
                2
              </div>
              <div className="flex-1 flex flex-col items-center justify-center space-y-1">
                <span className="text-2xl font-black font-mono text-slate-500">{silverDept.actual}</span>
                <span className="text-[10px] text-slate-400">已招学员</span>
              </div>
              <div className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                完成率: {silverDept.rate.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Gold - 1st Place */}
          <div className="flex flex-col items-center space-y-2 transform md:-translate-y-4">
            <div className="text-center">
              <span className="text-[10px] text-amber-500 font-bold block uppercase flex items-center justify-center gap-0.5">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-bounce" /> 
                CHAMPION GOLD
              </span>
              <span className="font-black text-sm text-amber-600 dark:text-amber-400">{goldDept.name}</span>
            </div>
            <div className="w-full h-40 rounded-t-2xl border-x border-t relative flex flex-col items-center justify-between p-4 bg-gradient-to-b from-amber-500/10 to-transparent border-amber-500/40 shadow-lg">
              <div className="absolute -top-4 w-8 h-8 rounded-full bg-amber-500 text-white font-black text-sm flex items-center justify-center border-2 border-white shadow-md">
                👑
              </div>
              <div className="flex-1 flex flex-col items-center justify-center space-y-1">
                <span className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400">{goldDept.actual}</span>
                <span className="text-[10px] text-slate-400">已招学员</span>
              </div>
              <div className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                完成率: {goldDept.rate.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Bronze - 3rd Place */}
          <div className="flex flex-col items-center space-y-2">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">BRONZE MEDAL</span>
              <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300">{bronzeDept.name}</span>
            </div>
            <div className={`w-full h-24 rounded-t-xl border-x border-t relative flex flex-col items-center justify-between p-4 transition-all ${
              isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="absolute -top-3 w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center border-2 border-white shadow-sm">
                3
              </div>
              <div className="flex-1 flex flex-col items-center justify-center space-y-1">
                <span className="text-xl font-black font-mono text-amber-800 dark:text-amber-500">{bronzeDept.actual}</span>
                <span className="text-[10px] text-slate-400">已招学员</span>
              </div>
              <div className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                完成率: {bronzeDept.rate.toFixed(1)}%
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Main Grid: PK Leaderboard Table + Arena PK Arena */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left: Performance Table (7 columns) */}
        <div className={`xl:col-span-7 p-5 border rounded-xl shadow-xs space-y-4 transition-colors duration-200 ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-500" />
              {leaderboardType === "department" ? "团队/部门招生业绩追踪榜" : "个人招生之星排行榜"}
            </h4>

            {leaderboardType === "advisor" && (
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border flex items-center gap-1 cursor-pointer transition-all ${
                    showAddForm
                      ? "bg-rose-500 text-white border-rose-500 hover:bg-rose-600"
                      : (isDarkMode ? "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50")
                  }`}
                >
                  <span>{showAddForm ? "✕ 关闭表单" : "➕ 新增招生顾问"}</span>
                </button>

                <div className="relative w-full sm:w-40">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="搜索姓名/部门..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full text-[10px] pl-8 pr-2.5 py-1 border rounded-lg outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Add Advisor Form */}
          {leaderboardType === "advisor" && showAddForm && (
            <form onSubmit={handleAddAdvisor} className={`p-4 border rounded-xl text-xs space-y-3 transition-all ${
              isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="font-extrabold text-[11px] text-slate-700 dark:text-slate-300">
                录入新顾问本月模拟指标
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold">顾问姓名</label>
                  <input
                    type="text"
                    required
                    placeholder="如：孙老师"
                    value={newAdvName}
                    onChange={(e) => setNewAdvName(e.target.value)}
                    className={`w-full px-2 py-1 border rounded text-[10px] outline-none ${
                      isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-300"
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold">所属部门</label>
                  <select
                    value={newAdvDept}
                    onChange={(e) => setNewAdvDept(e.target.value)}
                    className={`w-full px-2 py-1 border rounded text-[10px] outline-none font-bold ${
                      isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-300"
                    }`}
                  >
                    {config.channels && config.channels.map((ch, idx) => (
                      <option key={`ch-opt-${ch}-${idx}`} value={ch}>{ch}</option>
                    ))}
                    {!config.channels?.includes("咨询一部") && <option key="dept-fallback-1" value="咨询一部">咨询一部</option>}
                    {!config.channels?.includes("咨询二部") && <option key="dept-fallback-2" value="咨询二部">咨询二部</option>}
                    {!config.channels?.includes("代理合作") && <option key="dept-fallback-3" value="代理合作">代理合作</option>}
                    {!config.channels?.includes("老生转介绍") && <option key="dept-fallback-4" value="老生转介绍">老生转介绍</option>}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold">实际招生人数</label>
                  <input
                    type="number"
                    min="0"
                    value={newAdvActual}
                    onChange={(e) => setNewAdvActual(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`w-full px-2 py-1 border rounded text-[10px] outline-none font-mono ${
                      isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-300"
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold">指标招生任务</label>
                  <input
                    type="number"
                    min="1"
                    value={newAdvTarget}
                    onChange={(e) => setNewAdvTarget(Math.max(1, parseInt(e.target.value) || 1))}
                    className={`w-full px-2 py-1 border rounded text-[10px] outline-none font-mono ${
                      isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-300"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold">意向回访量 (次)</label>
                  <input
                    type="number"
                    min="0"
                    value={newAdvCalls}
                    onChange={(e) => setNewAdvCalls(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`w-full px-2 py-1 border rounded text-[10px] outline-none font-mono ${
                      isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-300"
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold">热点名单数 (人)</label>
                  <input
                    type="number"
                    min="0"
                    value={newAdvLeads}
                    onChange={(e) => setNewAdvLeads(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`w-full px-2 py-1 border rounded text-[10px] outline-none font-mono ${
                      isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-300"
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold">满意度 (1.0-5.0)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={newAdvSatisfaction}
                    onChange={(e) => setNewAdvSatisfaction(Math.min(5, Math.max(1, parseFloat(e.target.value) || 4.8)))}
                    className={`w-full px-2 py-1 border rounded text-[10px] outline-none font-mono ${
                      isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-300"
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                >
                  保存顾问数据
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
            {leaderboardType === "department" ? (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className={`border-b font-bold ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"}`}>
                    <th className="px-4 py-2.5 w-12 text-center">排名</th>
                    <th className="px-4 py-2.5">招生部门</th>
                    <th className="px-4 py-2.5 text-center">达成 (人)</th>
                    <th className="px-4 py-2.5 text-center">目标 (人)</th>
                    <th className="px-4 py-2.5 text-center">目标达成率</th>
                    <th className="px-4 py-2.5 text-center">服务质检</th>
                    <th className="px-4 py-2.5 text-center">预计奖金</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150/40 dark:divide-slate-850">
                  {deptStats.map((dept, idx) => (
                    <tr key={`dept-${dept.name}-${idx}`} className={`transition-colors hover:bg-slate-50/50 ${isDarkMode ? "hover:bg-slate-900/40" : ""}`}>
                      <td className="px-4 py-2.5 text-center font-mono font-bold">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                      </td>
                      <td className="px-4 py-2.5 font-extrabold text-slate-800 dark:text-slate-100">{dept.name}</td>
                      <td className="px-4 py-2.5 text-center font-mono font-bold text-slate-900 dark:text-white">{dept.actual}</td>
                      <td className="px-4 py-2.5 text-center font-mono text-slate-400">{dept.target}</td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{dept.rate.toFixed(1)}%</span>
                          <div className="w-12 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden hidden sm:block">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, dept.rate)}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono text-[11px]">⭐️ {dept.score.toFixed(1)}</td>
                      <td className="px-4 py-2.5 text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        ￥{dept.payout.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className={`border-b font-bold ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"}`}>
                    <th className="px-4 py-2.5 w-12 text-center">排名</th>
                    <th className="px-4 py-2.5">姓名</th>
                    <th className="px-4 py-2.5">所属部门</th>
                    <th className="px-4 py-2.5 text-center">邀约量</th>
                    <th className="px-4 py-2.5 text-center">实际签约 (人)</th>
                    <th className="px-4 py-2.5 text-center">目标 (人)</th>
                    <th className="px-4 py-2.5 text-center">达成率</th>
                    <th className="px-4 py-2.5 text-center">好评度</th>
                    <th className="px-4 py-2.5 text-center w-12">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150/40 dark:divide-slate-850">
                  {filteredAdvisors.map((adv, idx) => (
                    <tr key={`adv-tr-${adv.id}-${idx}`} className={`transition-colors hover:bg-slate-50/50 ${isDarkMode ? "hover:bg-slate-900/40" : ""}`}>
                      <td className="px-4 py-2.5 text-center font-mono font-bold">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-100">{adv.name}</td>
                      <td className="px-4 py-2.5 text-slate-500">{adv.dept}</td>
                      <td className="px-4 py-2.5 text-center font-mono text-slate-500">{adv.phoneCalls}</td>
                      <td className="px-4 py-2.5 text-center font-mono font-bold text-slate-900 dark:text-white">{adv.actual}</td>
                      <td className="px-4 py-2.5 text-center font-mono text-slate-400">{adv.target}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{adv.rate.toFixed(1)}%</span>
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono text-[11px]">⭐️ {adv.satisfaction.toFixed(1)}</td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteAdvisor(adv.id)}
                          className="text-rose-500 hover:text-rose-700 font-bold text-xs p-1 cursor-pointer transition-colors"
                          title="删除顾问"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAdvisors.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-6 text-slate-400 text-xs">
                        未检索到符合条件的顾问老师
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Advisor Arena PK & Commission Calculator (5 columns) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          
          {/* PK Arena擂台 */}
          <div className={`p-5 border rounded-xl shadow-xs space-y-4 transition-colors duration-200 ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <h4 className="font-extrabold text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              顾问/团队两两竞速PK台 (Performance PK Arena)
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold uppercase">PK 方 A (红方)</label>
                <select
                  value={pkAdv1}
                  onChange={(e) => setPkAdv1(e.target.value)}
                  className={`w-full px-2 py-1.5 border rounded-lg text-xs font-bold outline-none ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  {advisors.map((a, aIdx) => (
                    <option key={`adv-a-${a.id}-${aIdx}`} value={a.id}>{a.name} ({a.dept})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold uppercase">PK 方 B (蓝方)</label>
                <select
                  value={pkAdv2}
                  onChange={(e) => setPkAdv2(e.target.value)}
                  className={`w-full px-2 py-1.5 border rounded-lg text-xs font-bold outline-none ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  {advisors.map((a, aIdx) => (
                    <option key={`adv-b-${a.id}-${aIdx}`} value={a.id}>{a.name} ({a.dept})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Details Card */}
            <div className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-950/40 space-y-3.5 text-xs">
              
              {/* Advisor Names Title */}
              <div className="flex items-center justify-between text-center font-bold pb-2 border-b border-dashed dark:border-slate-800">
                <span className="text-rose-500 font-extrabold">{advisor1.name}</span>
                <span className="text-[10px] bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full">VS</span>
                <span className="text-blue-500 font-extrabold">{advisor2.name}</span>
              </div>

              {/* Stat 1: Actual Signups */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold font-mono">
                  <span className="text-rose-500">{advisor1.actual}人</span>
                  <span className="text-slate-400 font-normal">实际签约数</span>
                  <span className="text-blue-500">{advisor2.actual}人</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                  <div className="bg-rose-500 h-full" style={{ width: `${(advisor1.actual / (advisor1.actual + advisor2.actual || 1)) * 100}%` }}></div>
                  <div className="bg-blue-500 h-full flex-1"></div>
                </div>
              </div>

              {/* Stat 2: Completion Rate */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold font-mono">
                  <span className="text-rose-500">{advisor1.rate.toFixed(1)}%</span>
                  <span className="text-slate-400 font-normal">指标完成率</span>
                  <span className="text-blue-500">{advisor2.rate.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                  <div className="bg-rose-500 h-full" style={{ width: `${(advisor1.rate / (advisor1.rate + advisor2.rate || 1)) * 100}%` }}></div>
                  <div className="bg-blue-500 h-full flex-1"></div>
                </div>
              </div>

              {/* Stat 3: Hot Leads & Call Activity */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold font-mono">
                  <span className="text-rose-500">{advisor1.phoneCalls}次</span>
                  <span className="text-slate-400 font-normal">意向回访量</span>
                  <span className="text-blue-500">{advisor2.phoneCalls}次</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                  <div className="bg-rose-500 h-full" style={{ width: `${(advisor1.phoneCalls / (advisor1.phoneCalls + advisor2.phoneCalls || 1)) * 100}%` }}></div>
                  <div className="bg-blue-500 h-full flex-1"></div>
                </div>
              </div>

              {/* Dynamic PK Verdict */}
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded text-[10px] text-center font-bold">
                🔥 当前赛段：
                {advisor1.actual > advisor2.actual ? (
                  <span>【{advisor1.name}】暂时在签约数量上保持领先！继续加油！</span>
                ) : advisor1.actual < advisor2.actual ? (
                  <span>【{advisor2.name}】处于领跑势头，冲击销冠！</span>
                ) : (
                  <span>双方比分焦灼，难分伯仲！一鼓作气突破！</span>
                )}
              </div>

            </div>
          </div>

          {/* Performance Rewards Calculator 提成奖金计算器 */}
          <div className={`p-5 border rounded-xl shadow-xs space-y-4 transition-colors duration-200 ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <h4 className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Calculator className="w-4 h-4" />
              个人业绩与提成联动测算 (Rewards Calculator)
            </h4>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold">基本底薪 (元)</label>
                  <input
                    type="number"
                    value={calcBaseSalary}
                    onChange={(e) => setCalcBaseSalary(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`w-full px-2 py-1 border rounded text-xs font-bold outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-300"
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold">本月到账人数 (人)</label>
                  <input
                    type="number"
                    value={calcActualSales}
                    onChange={(e) => setCalcActualSales(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`w-full px-2 py-1 border rounded text-xs font-bold outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-300"
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold">提成梯度档次 (Tier Level)</label>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setCalcTier("standard")}
                    className={`py-1 rounded text-[10px] border font-bold ${
                      calcTier === "standard"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-950 dark:text-slate-400 border-transparent hover:bg-slate-200"
                    }`}
                  >
                    标准档 (250/人)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcTier("high")}
                    className={`py-1 rounded text-[10px] border font-bold ${
                      calcTier === "high"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-950 dark:text-slate-400 border-transparent hover:bg-slate-200"
                    }`}
                  >
                    重点档 (350/人)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcTier("executive")}
                    className={`py-1 rounded text-[10px] border font-bold ${
                      calcTier === "executive"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-950 dark:text-slate-400 border-transparent hover:bg-slate-200"
                    }`}
                  >
                    总监档 (500/人)
                  </button>
                </div>
              </div>

              {/* Calc Results Panel */}
              <div className={`p-4 rounded-xl border space-y-2 ${
                isDarkMode ? "bg-slate-950 border-emerald-950/60" : "bg-emerald-50/40 border-emerald-100"
              }`}>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold">基本工资</span>
                    <span className="text-xs font-bold font-mono">￥{calcBaseSalary}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold">签约提成</span>
                    <span className="text-xs font-bold font-mono text-emerald-600">￥{commResults.baseCommission}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold">段位激励金</span>
                    <span className="text-xs font-bold font-mono text-indigo-600">￥{commResults.bonus}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-dashed border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400">预计应发薪资 (Total):</span>
                  <span className="font-mono font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                    ￥{commResults.totalSalary.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="text-[9px] text-slate-400 flex items-center gap-1 leading-normal">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>激励政策：签约满20人/30人/40人，分别额外触发 500 / 1500 / 3000 元高额爆单奖金！</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
