/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { RowData, TableConfig } from "../types";
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Coins, 
  HelpCircle, 
  Sparkles, 
  ChevronRight, 
  PieChart, 
  RotateCcw, 
  CheckCircle2, 
  TrendingDown,
  ArrowUpRight,
  Sliders,
  AlertCircle
} from "lucide-react";

interface ChannelROIProps {
  rows: RowData[];
  config: TableConfig;
  selectedDate: string;
  isDarkMode: boolean;
}

interface ChannelFinanceData {
  name: string;
  spend: number;      // Actual marketing spend (RMB)
  leads: number;      // Generated inquiry leads
  conversions: number; // Final signups (from spreadsheet actual!)
  revenue: number;    // Calculated tuition revenue (conversions * 9800)
  roi: number;        // Revenue / Spend
  cpa: number;        // Cost Per Acquisition (Spend / conversions)
}

// Fixed Tuition Fee base
const TUITION_FEE = 9800;

// Seed data for initial channel ad spend
const SEED_CHANNEL_SPEND: Record<string, number> = {
  "咨询一部": 12000,
  "咨询二部": 15000,
  "网络运营": 45000,
  "品牌渠道": 25000,
  "新媒体部": 18000,
  "代理合作": 35000,
  "老生转介绍": 5000
};

export default function ChannelROI({ rows, config, selectedDate, isDarkMode }: ChannelROIProps) {
  const activeMonth = selectedDate.substring(0, 7);
  const [channelSpends, setChannelSpends] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("recruitment_channel_spends");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Unable to access localStorage:", e);
    }
    return SEED_CHANNEL_SPEND;
  });
  
  // What-If reallocation simulator ad spend
  const [simSpends, setSimSpends] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("recruitment_channel_spends");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Unable to access localStorage:", e);
    }
    return SEED_CHANNEL_SPEND;
  });

  const [selectedSimChannel, setSelectedSimChannel] = useState<string>(() => {
    return config.channels.includes("网络运营") ? "网络运营" : (config.channels[0] || "网络运营");
  });
  const [simShiftAmount, setSimShiftAmount] = useState<number>(0); // RMB shift amount
  const [reallocatedToChannel, setReallocatedToChannel] = useState<string>(() => {
    return config.channels.includes("老生转介绍") ? "老生转介绍" : (config.channels[1] || config.channels[0] || "老生转介绍");
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("recruitment_channel_spends");
      if (!saved) {
        localStorage.setItem("recruitment_channel_spends", JSON.stringify(SEED_CHANNEL_SPEND));
      }
    } catch (e) {
      console.warn("Unable to write default channel spends to localStorage:", e);
    }
  }, []);

  // Update selection if config.channels changes and excludes current selection
  useEffect(() => {
    if (config.channels && config.channels.length > 0) {
      if (!config.channels.includes(selectedSimChannel)) {
        setSelectedSimChannel(config.channels[0]);
        setSimShiftAmount(0);
      }
      if (!config.channels.includes(reallocatedToChannel)) {
        setReallocatedToChannel(config.channels[1] || config.channels[0]);
        setSimShiftAmount(0);
      }
    }
  }, [config.channels, selectedSimChannel, reallocatedToChannel]);

  const saveSpends = (newSpends: Record<string, number>) => {
    setChannelSpends(newSpends);
    setSimSpends(newSpends);
    try {
      localStorage.setItem("recruitment_channel_spends", JSON.stringify(newSpends));
    } catch (e) {
      console.warn("Unable to write channel spends to localStorage:", e);
    }
  };

  const handleSpendChange = (channelName: string, val: number) => {
    const updated = {
      ...channelSpends,
      [channelName]: Math.max(1, val)
    };
    saveSpends(updated);
  };

  const handleResetSpends = () => {
    if (window.confirm("确定要恢复默认渠道投放成本设置吗？")) {
      saveSpends(SEED_CHANNEL_SPEND);
      setSimShiftAmount(0);
    }
  };

  // 1. Calculate Real Signup counts per channel from dynamic spreadsheet row data!
  const calculateFinancials = (spendsMap: Record<string, number>): ChannelFinanceData[] => {
    // Filter rows belonging to the active month
    const activeMonthRows = rows.filter(r => r.date.startsWith(activeMonth));
    const targetRows = activeMonthRows.length > 0 ? activeMonthRows : rows; // Fallback to all if empty

    return config.channels.map((channelName, idx) => {
      let conversionCount = 0;

      targetRows.forEach((row) => {
        if (row.channels && row.channels[idx]) {
          conversionCount += row.channels[idx].actual || 0;
        }
      });

      // Simple heuristic for leads generated proportionally
      const leadsMultiplier = channelName === "网络运营" ? 8 : channelName === "新媒体部" ? 6 : 4;
      const leads = conversionCount * leadsMultiplier + (idx * 15 % 20);

      const spend = spendsMap[channelName] || 5000;
      const revenue = conversionCount * TUITION_FEE;
      const roi = spend > 0 ? revenue / spend : 0;
      const cpa = conversionCount > 0 ? spend / conversionCount : spend;

      return {
        name: channelName,
        spend,
        leads,
        conversions: conversionCount,
        revenue,
        roi,
        cpa
      };
    });
  };

  const currentFinancials = calculateFinancials(channelSpends);

  // Totals for current state
  const totalSpend = currentFinancials.reduce((sum, f) => sum + f.spend, 0);
  const totalConversions = currentFinancials.reduce((sum, f) => sum + f.conversions, 0);
  const totalRevenue = totalConversions * TUITION_FEE;
  const overallROI = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const averageCPA = totalConversions > 0 ? totalSpend / totalConversions : 0;

  // What-If Reallocation logic
  // Shift budget from "selectedSimChannel" to "reallocatedToChannel" by "simShiftAmount"
  const getSimulatedFinancials = (): {
    simList: ChannelFinanceData[];
    simTotalSpend: number;
    simTotalConversions: number;
    simTotalRevenue: number;
    simOverallROI: number;
    simAverageCPA: number;
  } => {
    const adjustedSpends = { ...channelSpends };
    const sourceCurrentSpend = adjustedSpends[selectedSimChannel] || 0;
    const shift = Math.min(simShiftAmount, sourceCurrentSpend - 100); // Keep at least 100 in source
    
    adjustedSpends[selectedSimChannel] = sourceCurrentSpend - shift;
    adjustedSpends[reallocatedToChannel] = (adjustedSpends[reallocatedToChannel] || 0) + shift;

    // Recalculate based on adjusted budget assuming CPA efficiency stays constant!
    const simList = currentFinancials.map((current) => {
      const spend = adjustedSpends[current.name];
      // Simulated conversions = Spend / current CPA (preserving efficiency!)
      // If conversions was 0, preserve cpa
      const cpa = current.cpa;
      const conversions = cpa > 0 ? Math.round(spend / cpa) : 0;
      const revenue = conversions * TUITION_FEE;
      const roi = spend > 0 ? revenue / spend : 0;

      return {
        ...current,
        spend,
        conversions,
        revenue,
        roi,
        cpa
      };
    });

    const simTotalSpend = simList.reduce((sum, f) => sum + f.spend, 0);
    const simTotalConversions = simList.reduce((sum, f) => sum + f.conversions, 0);
    const simTotalRevenue = simTotalConversions * TUITION_FEE;
    const simOverallROI = simTotalSpend > 0 ? simTotalRevenue / simTotalSpend : 0;
    const simAverageCPA = simTotalConversions > 0 ? simTotalSpend / simTotalConversions : 0;

    return {
      simList,
      simTotalSpend,
      simTotalConversions,
      simTotalRevenue,
      simOverallROI,
      simAverageCPA
    };
  };

  const {
    simList,
    simTotalConversions,
    simTotalRevenue,
    simOverallROI,
    simAverageCPA
  } = getSimulatedFinancials();

  const netConversionsDiff = simTotalConversions - totalConversions;
  const netRevenueDiff = simTotalRevenue - totalRevenue;

  // Find most cost-effective channel (lowest CPA and conversions > 0)
  const efficientChannels = [...currentFinancials]
    .filter(f => f.conversions > 0)
    .sort((a, b) => a.cpa - b.cpa);
  const starsChannel = efficientChannels[0];

  return (
    <div className={`flex-1 flex flex-col p-6 overflow-y-auto space-y-6 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      
      {/* Header Panel */}
      <div className={`p-5 border rounded-xl shadow-xs transition-colors duration-200 ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
              <Coins className="w-5 h-5 text-emerald-500" />
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                推广渠道投放与ROI费效监控 (Channel Advertising Spend & ROI Monitor)
              </h3>
              <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-500 rounded text-[9px] font-bold uppercase tracking-wider">
                FINANCIAL HEALTH
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              追踪各获客渠道广告预算投放、单客获客成本(CPA)和学费到账回报率(ROI)。联动底层数据表，提供实时 What-If 预算再分配策略沙盘，重构最高性价比投放比例。
            </p>
          </div>

          <button
            onClick={handleResetSpends}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
            }`}
            title="恢复各渠道广告预算到初始设置"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重置默认预算</span>
          </button>
        </div>
      </div>

      {/* Global Financial Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className={`p-4 border rounded-xl flex items-center space-x-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-600 dark:text-indigo-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">累计广告投入</span>
            <span className="text-lg font-extrabold font-mono text-slate-800 dark:text-slate-100">￥{totalSpend.toLocaleString()}</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">本周期各渠道累计投放</span>
          </div>
        </div>

        <div className={`p-4 border rounded-xl flex items-center space-x-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">预计学费到账收入</span>
            <span className="text-lg font-extrabold font-mono text-emerald-600">￥{totalRevenue.toLocaleString()}</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">到账人数: {totalConversions} 人</span>
          </div>
        </div>

        <div className={`p-4 border rounded-xl flex items-center space-x-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-lg text-rose-600 dark:text-rose-400">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">综合投放ROI回报比</span>
            <span className="text-lg font-extrabold font-mono text-rose-600 dark:text-rose-400">{overallROI.toFixed(2)}x</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">投放费效比指标</span>
          </div>
        </div>

        <div className={`p-4 border rounded-xl flex items-center space-x-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg text-amber-600 dark:text-amber-400">
            <Coins className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">均客获客成本 (CPA)</span>
            <span className="text-lg font-extrabold font-mono text-slate-800 dark:text-slate-100">￥{Math.round(averageCPA).toLocaleString()}</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">单客成交对应媒介成本</span>
          </div>
        </div>

      </div>

      {/* Main Grid: ROI Column Chart Visualizer & What-If Sandbox */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Side: Visual ROI Bar Chart & Analysis Table (7 columns) */}
        <div className={`xl:col-span-7 p-5 border rounded-xl shadow-xs flex flex-col justify-between transition-colors duration-200 ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div>
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-6">
              <PieChart className="w-4.5 h-4.5 text-indigo-500" />
              各渠道 ROI 投产成效与 CPA 排名对比
            </h4>

            {/* Custom Responsive pure CSS Bar chart */}
            <div className="space-y-4 max-w-xl mx-auto py-3">
              {currentFinancials.map((item, idx) => {
                // Determine percentage of max ROI to scale bars
                const maxROI = Math.max(...currentFinancials.map(f => f.roi), 1);
                const roiPercent = Math.min(100, Math.max(8, (item.roi / maxROI) * 100));
                
                // Color mapping for channels
                const barColorClass = item.roi > 3 
                  ? "bg-emerald-500" 
                  : item.roi > 1.5 
                    ? "bg-indigo-500" 
                    : "bg-rose-500";

                return (
                  <div key={`roi-item-${item.name}-${idx}`} className="flex items-center text-xs">
                    <div className="w-24 text-right pr-3 font-bold text-slate-500 dark:text-slate-400">
                      {item.name}
                    </div>
                    <div className="flex-1 flex items-center space-x-3">
                      <div className="flex-1 h-6 rounded-md bg-slate-100 dark:bg-slate-950 overflow-hidden relative border dark:border-slate-850">
                        <div 
                          className={`h-full ${barColorClass} transition-all duration-500 rounded-r-md flex items-center justify-end pr-2`} 
                          style={{ width: `${roiPercent}%` }}
                        >
                          {roiPercent > 20 && (
                            <span className="text-[10px] font-mono font-bold text-white">
                              {item.roi.toFixed(1)}x
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-24 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        CPA: ￥{item.conversions > 0 ? Math.round(item.cpa).toLocaleString() : "0"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Efficiency Verdict Info Box */}
          {starsChannel && (
            <div className={`mt-6 p-4 border rounded-xl flex items-start gap-3 text-xs ${
              isDarkMode ? "bg-emerald-950/20 border-emerald-900/50 text-emerald-300" : "bg-emerald-50 border-emerald-100 text-emerald-800"
            }`}>
              <Sparkles className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-extrabold text-xs">获客性价比之星：【{starsChannel.name}】</p>
                <p className="mt-1 opacity-90 leading-relaxed text-[11px]">
                  该渠道每成交1名学员仅需广告成本 <strong>￥{Math.round(starsChannel.cpa).toLocaleString()}</strong>，
                  回报比高达 <strong>{starsChannel.roi.toFixed(1)}x</strong>。
                  建议营销主管加大此渠道的预算倾斜度，以极速缩减多维招生成本。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: What-If Ad budget allocation simulator (5 columns) */}
        <div className={`xl:col-span-5 p-5 border rounded-xl shadow-xs space-y-4 transition-colors duration-200 ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Sliders className="w-4.5 h-4.5" />
              投放预算转移与增效模拟 (What-If Sandbox)
            </h4>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500">
              CPA STATIC
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            通过减少高CPA渠道预算并注资到高转化、低成本渠道，测算预计招生的增量成效：
          </p>

          {/* Quick optimization presets */}
          <div className="space-y-1.5 p-3 rounded-lg bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850">
            <span className="text-[10px] text-slate-400 font-bold block">💡 快速优化预设方案 (Quick Presets)：</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const sorted = [...currentFinancials].sort((a,b) => a.cpa - b.cpa);
                  const best = sorted[0];
                  const worst = sorted[sorted.length - 1];
                  if (best && worst && best.name !== worst.name) {
                    setSelectedSimChannel(worst.name);
                    setReallocatedToChannel(best.name);
                    const sourceSpend = channelSpends[worst.name] || 0;
                    setSimShiftAmount(Math.max(0, Math.floor((sourceSpend * 0.5) / 1000) * 1000));
                  }
                }}
                className={`py-1 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                  isDarkMode 
                    ? "bg-indigo-950/40 border-indigo-900/40 text-indigo-400 hover:bg-indigo-900" 
                    : "bg-indigo-50 border-indigo-150 text-indigo-700 hover:bg-indigo-100"
                }`}
                title="自动将最高获客成本渠道的 50% 预算，转移到获客最便宜的黄金渠道"
              >
                ⚡ 费效最优化 (50%转优)
              </button>

              <button
                type="button"
                onClick={() => {
                  const sorted = [...currentFinancials].sort((a,b) => b.roi - a.roi);
                  const bestRoi = sorted[0];
                  const worstRoi = sorted[sorted.length - 1];
                  if (bestRoi && worstRoi && bestRoi.name !== worstRoi.name) {
                    setSelectedSimChannel(worstRoi.name);
                    setReallocatedToChannel(bestRoi.name);
                    const sourceSpend = channelSpends[worstRoi.name] || 0;
                    setSimShiftAmount(Math.max(0, Math.floor((sourceSpend * 0.8) / 1000) * 1000));
                  }
                }}
                className={`py-1 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                  isDarkMode 
                    ? "bg-emerald-950/40 border-emerald-900/60 text-emerald-400 hover:bg-emerald-900" 
                    : "bg-emerald-50 border-emerald-150 text-emerald-700 hover:bg-emerald-100"
                }`}
                title="自动将 ROI 最差渠道的 80% 预算，重仓注入到回报率最高的明星渠道"
              >
                📈 回报最大化 (80%转优)
              </button>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Source channel select */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold">1. 调减预算渠道</label>
                <select
                  value={selectedSimChannel}
                  onChange={(e) => {
                    setSelectedSimChannel(e.target.value);
                    setSimShiftAmount(0); // Reset shift slider
                  }}
                  className={`w-full px-2 py-1.5 border rounded-lg text-xs font-bold outline-none ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  {config.channels.map((name, idx) => (
                    <option key={`ch-src-${name}-${idx}`} value={name}>{name} (CPA: ￥{Math.round(currentFinancials.find(f => f.name === name)?.cpa || 0)})</option>
                  ))}
                </select>
              </div>

              {/* Target channel select */}
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold">2. 注入增效渠道</label>
                <select
                  value={reallocatedToChannel}
                  onChange={(e) => {
                    setReallocatedToChannel(e.target.value);
                    setSimShiftAmount(0); // Reset shift slider
                  }}
                  className={`w-full px-2 py-1.5 border rounded-lg text-xs font-bold outline-none ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  {config.channels.map((name, idx) => (
                    <option key={`ch-dst-${name}-${idx}`} value={name}>{name} (CPA: ￥{Math.round(currentFinancials.find(f => f.name === name)?.cpa || 0)})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reallocation Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400 font-bold">3. 转移广告预算金额</span>
                <span className="font-bold font-mono text-indigo-600">￥{simShiftAmount.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(0, (channelSpends[selectedSimChannel] || 0) - 1000)}
                step="1000"
                value={simShiftAmount}
                onChange={(e) => setSimShiftAmount(parseInt(e.target.value) || 0)}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>0 元 (不转移)</span>
                <span>最高限额 (保留￥1,000)</span>
              </div>
            </div>

            {/* Simulation Dashboard Output */}
            <div className={`p-4 rounded-xl border space-y-2.5 ${
              isDarkMode ? "bg-slate-950 border-indigo-950/60" : "bg-indigo-50/40 border-indigo-100"
            }`}>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">模拟总成交人数</span>
                  <span className="text-sm font-extrabold font-mono text-slate-800 dark:text-slate-200">
                    {simTotalConversions} 人
                  </span>
                  {netConversionsDiff >= 0 ? (
                    <span className="text-[9px] text-emerald-500 block">预算优化净增：+{netConversionsDiff} 人</span>
                  ) : (
                    <span className="text-[9px] text-rose-500 block">净变动：{netConversionsDiff} 人</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">模拟总学费收入</span>
                  <span className="text-sm font-extrabold font-mono text-slate-800 dark:text-slate-200">
                    ￥{simTotalRevenue.toLocaleString()}
                  </span>
                  {netRevenueDiff >= 0 ? (
                    <span className="text-[9px] text-emerald-500 block">预计增收：+￥{netRevenueDiff.toLocaleString()}</span>
                  ) : (
                    <span className="text-[9px] text-rose-500 block">变动：-￥{Math.abs(netRevenueDiff).toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Alert/Warning */}
            <div className="text-[9px] text-slate-400 flex items-center gap-1 leading-normal">
              <AlertCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>注意：沙盘模拟是在各渠道 CPA 保持恒定下的边际收益测算。实际大规模爆单时，可能存在边际递减效应。</span>
            </div>
          </div>
        </div>

      </div>

      {/* Dynamic Spend Inputs Table (Bottom block) */}
      <div className={`p-5 border rounded-xl shadow-xs space-y-4 transition-colors duration-200 ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div>
          <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
            渠道广告成本投放原始记账表 (Campaign Cost Ledger)
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">直接在下方输入各渠道真实的当期获客成本支出。更改后，上方对应的 CPA 和 ROI 将实时重算，保持全套账目合一。</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className={`border-b font-bold ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"}`}>
                <th className="px-4 py-3 w-12 text-center">序号</th>
                <th className="px-4 py-3">招生渠道 / 部门</th>
                <th className="px-4 py-3 text-center">实际广告投放 (RMB)</th>
                <th className="px-4 py-3 text-center">成交人数 (人)</th>
                <th className="px-4 py-3 text-center">获客成本 (CPA/人)</th>
                <th className="px-4 py-3 text-center">学费产出总量 (元)</th>
                <th className="px-4 py-3 text-center">渠道回报比 (ROI)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150/40 dark:divide-slate-850">
              {currentFinancials.map((item, idx) => (
                <tr key={`financial-${item.name}-${idx}`} className={`transition-colors hover:bg-slate-50/50 ${isDarkMode ? "hover:bg-slate-900/40" : ""}`}>
                  <td className="px-4 py-3 font-mono font-bold text-slate-400 text-center">{idx + 1}</td>
                  <td className="px-4 py-3 font-extrabold text-slate-800 dark:text-slate-100">{item.name}</td>
                  
                  {/* Spend Input */}
                  <td className="px-4 py-3 text-center font-mono">
                    <div className="flex items-center justify-center space-x-1">
                      <span className="text-slate-400 text-[11px]">￥</span>
                      <input
                        type="number"
                        min="1"
                        value={item.spend}
                        onChange={(e) => handleSpendChange(item.name, parseInt(e.target.value) || 0)}
                        className={`w-28 text-center px-2 py-1 border rounded text-xs font-bold outline-none ${
                          isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-300 text-slate-800"
                        }`}
                      />
                    </div>
                  </td>

                  {/* Conversions */}
                  <td className="px-4 py-3 text-center font-mono font-bold">
                    {item.conversions}
                  </td>

                  {/* CPA */}
                  <td className="px-4 py-3 text-center font-mono font-bold">
                    ￥{item.conversions > 0 ? Math.round(item.cpa).toLocaleString() : "0"}
                  </td>

                  {/* Revenue */}
                  <td className="px-4 py-3 text-center font-mono text-slate-500">
                    ￥{item.revenue.toLocaleString()}
                  </td>

                  {/* ROI */}
                  <td className="px-4 py-3 text-center font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                    {item.roi.toFixed(2)}x
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
