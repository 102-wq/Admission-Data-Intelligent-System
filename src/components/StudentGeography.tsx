/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RowData } from "../types";
import StudentGeographyMap from "./StudentGeographyMap";
import { 
  Map, 
  Users, 
  TrendingUp, 
  Compass, 
  Award, 
  Shield, 
  Check, 
  Edit3, 
  Save, 
  Trash2, 
  RotateCcw, 
  Plus, 
  X, 
  BarChart, 
  Settings, 
  Info,
  ChevronRight,
  Sparkles,
  Flame,
  Layers,
  LayoutGrid
} from "lucide-react";

interface StudentGeographyProps {
  rows: RowData[];
  isDarkMode: boolean;
}

export interface RegionalData {
  province: string;
  count: number;
  lastYearCount: number;
  growth: number;
  majors: { name: string; count: number }[];
  marketShare: number; // calculated percentage
}

export const DEFAULT_REGIONAL_SEED: RegionalData[] = [
  {
    province: "广东省",
    count: 145,
    lastYearCount: 120,
    growth: 20.8,
    majors: [
      { name: "给排水专业", count: 48 },
      { name: "发输电专业", count: 32 },
      { name: "暖通专业", count: 25 },
      { name: "供配电专业", count: 20 },
      { name: "道路专业", count: 20 }
    ],
    marketShare: 24.5
  },
  {
    province: "四川省",
    count: 112,
    lastYearCount: 95,
    growth: 17.9,
    majors: [
      { name: "发输电专业", count: 38 },
      { name: "岩土专业", count: 30 },
      { name: "给排水专业", count: 22 },
      { name: "环保专业", count: 12 },
      { name: "其他专业", count: 10 }
    ],
    marketShare: 18.9
  },
  {
    province: "浙江省",
    count: 94,
    lastYearCount: 88,
    growth: 6.8,
    majors: [
      { name: "供配电专业", count: 28 },
      { name: "暖通专业", count: 22 },
      { name: "环评专业", count: 18 },
      { name: "给排水专业", count: 14 },
      { name: "环保专业", count: 12 }
    ],
    marketShare: 15.9
  },
  {
    province: "山东省",
    count: 78,
    lastYearCount: 64,
    growth: 21.8,
    majors: [
      { name: "环保专业", count: 25 },
      { name: "给排水专业", count: 20 },
      { name: "暖通专业", count: 15 },
      { name: "结构专业", count: 10 },
      { name: "其他专业", count: 8 }
    ],
    marketShare: 13.2
  },
  {
    province: "湖北省",
    count: 65,
    lastYearCount: 60,
    growth: 8.3,
    majors: [
      { name: "岩土专业", count: 20 },
      { name: "环保专业", count: 18 },
      { name: "给排水专业", count: 12 },
      { name: "发输电专业", count: 10 },
      { name: "其他专业", count: 5 }
    ],
    marketShare: 11.0
  },
  {
    province: "江苏省",
    count: 55,
    lastYearCount: 52,
    growth: 5.7,
    majors: [
      { name: "供配电专业", count: 18 },
      { name: "暖通专业", count: 14 },
      { name: "发输电专业", count: 11 },
      { name: "岩土专业", count: 8 },
      { name: "其他专业", count: 4 }
    ],
    marketShare: 9.3
  },
  {
    province: "福建省",
    count: 42,
    lastYearCount: 30,
    growth: 40.0,
    majors: [
      { name: "发输电专业", count: 15 },
      { name: "暖通专业", count: 10 },
      { name: "给排水专业", count: 8 },
      { name: "环保专业", count: 6 },
      { name: "其他专业", count: 3 }
    ],
    marketShare: 7.1
  }
];

export default function StudentGeography({ rows, isDarkMode }: StudentGeographyProps) {
  // Load state from local storage or defaults
  const [regions, setRegions] = useState<RegionalData[]>(() => {
    const saved = localStorage.getItem("recruitment_geography_data");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading geography storage", e);
      }
    }
    return DEFAULT_REGIONAL_SEED;
  });

  const [selectedProvinceName, setSelectedProvinceName] = useState<string>(
    regions[0]?.province || "广东省"
  );
  
  // Visual Mode: "overview" (Map + Details), "map" (Expanded Map Focus), "list" (List Focus)
  const [geoViewMode, setGeoViewMode] = useState<"overview" | "map" | "list">("overview");

  // Advanced Editor States
  const [isEditing, setIsEditing] = useState(false);
  const [newProvinceName, setNewProvinceName] = useState("");
  const [newCount, setNewCount] = useState(50);
  const [newLastYearCount, setNewLastYearCount] = useState(45);
  const [showAddForm, setShowAddForm] = useState(false);

  // Custom interactive modal states
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    isAlert?: boolean;
  } | null>(null);

  const [addMajorModal, setAddMajorModal] = useState<{
    province: string;
  } | null>(null);

  const [newMajorName, setNewMajorName] = useState("");
  const [newMajorCount, setNewMajorCount] = useState(10);

  // Auto-persist and synchronize regions
  useEffect(() => {
    localStorage.setItem("recruitment_geography_data", JSON.stringify(regions));
  }, [regions]);

  // Handle active selection fallbacks
  const selectedRegion = regions.find(r => r.province === selectedProvinceName) || regions[0] || DEFAULT_REGIONAL_SEED[0];

  // Global calculations
  const totalStudents = regions.reduce((sum, r) => sum + r.count, 0);
  const averageGrowth = regions.length > 0 
    ? regions.reduce((sum, r) => sum + r.growth, 0) / regions.length 
    : 0;

  // Handle resets
  const handleResetToDefaults = () => {
    setConfirmModal({
      title: "确定恢复默认数据吗？",
      message: "此操作将清除您对地域生源分布、大类占比所作的全部自定义修改，并重置为系统默认的种子数据。",
      onConfirm: () => {
        setRegions(DEFAULT_REGIONAL_SEED);
        setSelectedProvinceName(DEFAULT_REGIONAL_SEED[0].province);
        setIsEditing(false);
        setShowAddForm(false);
        setConfirmModal(null);
      }
    });
  };

  // Update specific province numeric totals
  const handleUpdateNumericValue = (province: string, field: "count" | "lastYearCount", value: number) => {
    const nextRegions = regions.map((r) => {
      if (r.province === province) {
        const updated = { ...r, [field]: value };
        // Recalculate YOY growth rate
        const lastYr = field === "lastYearCount" ? value : r.lastYearCount;
        const cur = field === "count" ? value : r.count;
        updated.growth = lastYr > 0 ? parseFloat((((cur - lastYr) / lastYr) * 100).toFixed(1)) : 0;
        return updated;
      }
      return r;
    });

    // Recalculate marketShares dynamically
    const sum = nextRegions.reduce((s, r) => s + r.count, 0);
    nextRegions.forEach((r) => {
      r.marketShare = sum > 0 ? parseFloat(((r.count / sum) * 100).toFixed(1)) : 0;
    });

    setRegions(nextRegions);
  };

  // Update specific major count within selected province
  const handleUpdateMajorCount = (province: string, majorName: string, value: number) => {
    const nextRegions = regions.map((r) => {
      if (r.province === province) {
        const nextMajors = r.majors.map((m) => {
          if (m.name === majorName) {
            return { ...m, count: value };
          }
          return m;
        });
        
        // Sum major counts and keep it matched to province count (optional, but logical)
        const newSum = nextMajors.reduce((s, m) => s + m.count, 0);
        
        return {
          ...r,
          majors: nextMajors,
          count: newSum, // Dynamic alignment
          growth: r.lastYearCount > 0 ? parseFloat((((newSum - r.lastYearCount) / r.lastYearCount) * 100).toFixed(1)) : r.growth
        };
      }
      return r;
    });

    // Recalculate marketShares
    const sum = nextRegions.reduce((s, r) => s + r.count, 0);
    nextRegions.forEach((r) => {
      r.marketShare = sum > 0 ? parseFloat(((r.count / sum) * 100).toFixed(1)) : 0;
    });

    setRegions(nextRegions);
  };

  // Add a new custom major to the active province
  const handleAddMajor = (province: string) => {
    setNewMajorName("");
    setNewMajorCount(10);
    setAddMajorModal({ province });
  };

  const executeAddMajor = (province: string, name: string, count: number) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setConfirmModal({
        title: "专业名称无效",
        message: "❌ 请输入有效的专业或基础学科名称！",
        isAlert: true,
        onConfirm: () => setConfirmModal(null)
      });
      return;
    }

    const currentProvince = regions.find((r) => r.province === province);
    if (currentProvince && currentProvince.majors.some((m) => m.name === trimmed)) {
      setConfirmModal({
        title: "专业名称已存在",
        message: "⚠️ 该专业大类在当前生源省份中已存在，无需重复添加！",
        isAlert: true,
        onConfirm: () => setConfirmModal(null)
      });
      return;
    }

    const nextRegions = regions.map((r) => {
      if (r.province === province) {
        const nextMajors = [...r.majors, { name: trimmed, count }];
        const newSum = nextMajors.reduce((s, m) => s + m.count, 0);
        return {
          ...r,
          majors: nextMajors,
          count: newSum,
          growth: r.lastYearCount > 0 ? parseFloat((((newSum - r.lastYearCount) / r.lastYearCount) * 100).toFixed(1)) : r.growth
        };
      }
      return r;
    });

    // Recalculate shares
    const sum = nextRegions.reduce((s, r) => s + r.count, 0);
    nextRegions.forEach((r) => {
      r.marketShare = sum > 0 ? parseFloat(((r.count / sum) * 100).toFixed(1)) : 0;
    });

    setRegions(nextRegions);
    setAddMajorModal(null);
  };

  // Remove a major from the active province
  const handleRemoveMajor = (province: string, majorName: string) => {
    setConfirmModal({
      title: "确认移除该专业？",
      message: `此操作将彻底删除「${province}」下「${majorName}」的大类生源。`,
      onConfirm: () => {
        const nextRegions = regions.map((r) => {
          if (r.province === province) {
            const nextMajors = r.majors.filter((m) => m.name !== majorName);
            const newSum = nextMajors.reduce((s, m) => s + m.count, 0);
            return {
              ...r,
              majors: nextMajors,
              count: newSum,
              growth: r.lastYearCount > 0 ? parseFloat((((newSum - r.lastYearCount) / r.lastYearCount) * 100).toFixed(1)) : r.growth
            };
          }
          return r;
        });

        // Recalculate shares
        const sum = nextRegions.reduce((s, r) => s + r.count, 0);
        nextRegions.forEach((r) => {
          r.marketShare = sum > 0 ? parseFloat(((r.count / sum) * 100).toFixed(1)) : 0;
        });

        setRegions(nextRegions);
        setConfirmModal(null);
      }
    });
  };

  // Delete an entire province
  const handleDeleteProvince = (province: string) => {
    if (regions.length <= 1) {
      setConfirmModal({
        title: "无法删除唯一省份",
        message: "❌ 系统至少需要保留一个有效的生源地省份进行数据建模。",
        isAlert: true,
        onConfirm: () => setConfirmModal(null)
      });
      return;
    }

    setConfirmModal({
      title: "危险操作：彻底删除省份生源数据？",
      message: `⚠️ 您确定要删除「${province}」及其下属全部大类的报考数据吗？此操作不可撤销！`,
      onConfirm: () => {
        const nextRegions = regions.filter((r) => r.province !== province);
        
        // Recalculate marketShares
        const sum = nextRegions.reduce((s, r) => s + r.count, 0);
        nextRegions.forEach((r) => {
          r.marketShare = sum > 0 ? parseFloat(((r.count / sum) * 100).toFixed(1)) : 0;
        });

        setRegions(nextRegions);
        if (selectedProvinceName === province) {
          setSelectedProvinceName(nextRegions[0]?.province || "");
        }
        setConfirmModal(null);
      }
    });
  };

  // Add a new province to regions
  const handleCreateProvince = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newProvinceName.trim();
    if (!name) return;

    if (regions.some((r) => r.province === name)) {
      setConfirmModal({
        title: "省份已存在",
        message: "⚠️ 该省份名称已经存在，请选择在左侧列表编辑或换一个省份！",
        isAlert: true,
        onConfirm: () => setConfirmModal(null)
      });
      return;
    }

    const growthVal = newLastYearCount > 0 ? parseFloat((((newCount - newLastYearCount) / newLastYearCount) * 100).toFixed(1)) : 0;

    const newRegion: RegionalData = {
      province: name,
      count: newCount,
      lastYearCount: newLastYearCount,
      growth: growthVal,
      majors: [
        { name: "给排水专业", count: Math.round(newCount * 0.4) },
        { name: "发输电专业", count: Math.round(newCount * 0.3) },
        { name: "暖通专业", count: Math.round(newCount * 0.3) }
      ],
      marketShare: 0
    };

    const nextRegions = [...regions, newRegion];
    
    // Recalculate shares
    const sum = nextRegions.reduce((s, r) => s + r.count, 0);
    nextRegions.forEach((r) => {
      r.marketShare = sum > 0 ? parseFloat(((r.count / sum) * 100).toFixed(1)) : 0;
    });

    setRegions(nextRegions);
    setSelectedProvinceName(name);
    setNewProvinceName("");
    setShowAddForm(false);
  };

  return (
    <div className={`flex-1 flex flex-col p-6 overflow-y-auto space-y-6 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      
      {/* Header Panel */}
      <div className={`p-5 border rounded-xl shadow-xs transition-colors duration-200 ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
              <Map className="w-5 h-5" />
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                生源地域分布与市场渗透率 (Geographic Source Analyzer)
              </h3>
              <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-500 rounded text-[9px] font-bold uppercase tracking-wider">
                PRO-DASHBOARD
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              追踪当前周期到账生源的省份分布、同比增长率，提供基于生源地的专业招生倾斜分析，支持对地域生源数据进行实时在线校正、模拟编辑和自定义导入。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* View Mode Switcher */}
            <div className={`flex items-center p-0.5 rounded-lg border text-xs font-bold ${
              isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
            }`}>
              <button
                type="button"
                onClick={() => setGeoViewMode("overview")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  geoViewMode === "overview"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="地图热力与榜单联动全景"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>全景热力</span>
              </button>
              <button
                type="button"
                onClick={() => setGeoViewMode("map")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  geoViewMode === "map"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="聚焦地图热力大图"
              >
                <Map className="w-3.5 h-3.5" />
                <span>地图聚焦</span>
              </button>
              <button
                type="button"
                onClick={() => setGeoViewMode("list")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  geoViewMode === "list"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="表格数据矩阵"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>数据清单</span>
              </button>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                isEditing
                  ? "bg-amber-600 text-white border-amber-500 hover:bg-amber-500"
                  : (isDarkMode ? "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100")
              }`}
            >
              {isEditing ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              <span>{isEditing ? "退出高级编辑" : "编辑地域数据"}</span>
            </button>

            <button
              onClick={handleResetToDefaults}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
              }`}
              title="一键恢复种子默认值"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置默认</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Map Heatmap Component (Rendered in overview or map mode) */}
      {geoViewMode !== "list" && (
        <StudentGeographyMap
          regions={regions}
          selectedProvinceName={selectedProvinceName}
          onSelectProvince={(prov) => setSelectedProvinceName(prov)}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Top statistics indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className={`p-4 border rounded-xl flex items-center space-x-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">累计到账生源基数</span>
            <span className="text-xl font-extrabold font-mono text-slate-800 dark:text-slate-100">{totalStudents} 人</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">覆盖 {regions.length} 个主要省市自治区</span>
          </div>
        </div>

        <div className={`p-4 border rounded-xl flex items-center space-x-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg text-amber-600 dark:text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">整体同比增长率 (YOY)</span>
            <span className="text-xl font-extrabold font-mono text-amber-600">
              {averageGrowth >= 0 ? "+" : ""}{averageGrowth.toFixed(1)}%
            </span>
            <span className="text-[9px] text-slate-400 block mt-0.5">全省级多维代理渠道加权算术平均值</span>
          </div>
        </div>

        <div className={`p-4 border rounded-xl flex items-center space-x-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-400">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">首选生源贡献地</span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              {regions.length > 0 ? [...regions].sort((a,b)=>b.count - a.count)[0]?.province : "无数据"}
            </span>
            <span className="text-[9px] text-slate-400 block mt-0.5">
              {regions.length > 0 ? (
                `单省贡献总份额 ${((([...regions].sort((a,b)=>b.count-a.count)[0]?.count || 0) / (totalStudents || 1)) * 100).toFixed(1)}%`
              ) : "暂未录入生源省份"}
            </span>
          </div>
        </div>

      </div>

      {/* Advanced inline add Form (when editing and clicked add) */}
      {isEditing && (
        <div className={`p-4 border rounded-xl space-y-3 ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="flex justify-between items-center pb-2 border-b border-slate-150 dark:border-slate-850">
            <div className="flex items-center space-x-1.5 text-xs font-extrabold text-slate-800 dark:text-white">
              <Plus className="w-4 h-4 text-emerald-500" />
              <span>新增生源投放地区 (Add New Province)</span>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-xs text-emerald-500 hover:text-emerald-400 font-bold"
            >
              {showAddForm ? "收起面板" : "展开新增面板"}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleCreateProvince} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold uppercase">省份/区域名称</label>
                <input
                  type="text"
                  placeholder="如: 四川省、北京市"
                  required
                  value={newProvinceName}
                  onChange={(e) => setNewProvinceName(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-lg outline-none ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200"
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold uppercase">今年生源基数 (人)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newCount}
                  onChange={(e) => setNewCount(parseInt(e.target.value) || 0)}
                  className={`w-full text-xs px-3 py-2 border rounded-lg outline-none ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200"
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold uppercase">去年同期基数 (人)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newLastYearCount}
                  onChange={(e) => setNewLastYearCount(parseInt(e.target.value) || 1)}
                  className={`w-full text-xs px-3 py-2 border rounded-lg outline-none ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200"
                  }`}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>立即录入省份</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Main Grid: Region Selector + Detailed Majors breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Province ranking (5 columns) */}
        <div className={`lg:col-span-5 p-5 border rounded-xl shadow-2xs space-y-4 ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="flex justify-between items-center">
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Award className="w-4.5 h-4.5 text-amber-500" />
              省市生源贡献排行 ({regions.length}个活跃地域)
            </h4>
            {isEditing && !showAddForm && (
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setNewProvinceName("");
                }}
                className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5 hover:underline"
              >
                <Plus className="w-3 h-3" /> 新增省份
              </button>
            )}
          </div>

          <div className="space-y-2">
            {regions.map((reg, regIdx) => {
              const isSelected = selectedProvinceName === reg.province;
              const share = (reg.count / (totalStudents || 1)) * 100;

              return (
                <div
                  key={`reg-${reg.province}-${regIdx}`}
                  className={`relative group rounded-xl border transition-all ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/5"
                      : "border-slate-200/60 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800/80 dark:hover:bg-slate-900/60"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedProvinceName(reg.province)}
                    className="w-full p-3 text-left flex items-center justify-between cursor-pointer"
                  >
                    <div className="space-y-1.5 flex-1 pr-4">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1">
                          {reg.province}
                          {isSelected && <Check className="w-3 h-3 text-emerald-500" />}
                        </span>
                        
                        {!isEditing ? (
                          <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                            {reg.count}人 <span className="text-[9px] opacity-70">({share.toFixed(1)}%)</span>
                          </span>
                        ) : (
                          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="number"
                              min="0"
                              value={reg.count}
                              title="点击编辑今年人数"
                              onChange={(e) => handleUpdateNumericValue(reg.province, "count", parseInt(e.target.value) || 0)}
                              className={`w-12 text-center text-[10px] font-bold py-0.5 border rounded ${
                                isDarkMode ? "bg-slate-950 border-slate-800 text-emerald-400" : "bg-white border-slate-300 text-emerald-600"
                              }`}
                            />
                            <span className="text-[9px] text-slate-400">人</span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar representation */}
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, share * 3.5)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Growth Rate bubble */}
                    <div className="flex flex-col items-end gap-1">
                      <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                        reg.growth >= 15
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                      }`}>
                        {reg.growth >= 0 ? "+" : ""}{reg.growth.toFixed(1)}%
                      </div>
                      
                      {isEditing && (
                        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[8px] text-slate-400 font-normal">前值</span>
                          <input
                            type="number"
                            min="1"
                            value={reg.lastYearCount}
                            title="点击编辑去年同期人数"
                            onChange={(e) => handleUpdateNumericValue(reg.province, "lastYearCount", parseInt(e.target.value) || 1)}
                            className={`w-9 text-center text-[9px] py-0.2 border rounded ${
                              isDarkMode ? "bg-slate-950 border-slate-850 text-slate-300" : "bg-white border-slate-200 text-slate-700"
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Absolute Delete Button in editing mode */}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProvince(reg.province);
                      }}
                      className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-md cursor-pointer"
                      title="彻底删除此地区"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
 
        {/* Right Side: Major Preferences breakdown of Selected province (7 columns) */}
        <div className={`lg:col-span-7 p-6 border rounded-xl shadow-2xs flex flex-col justify-between ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-150/50 dark:border-slate-800/50">
              <div>
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Shield className="w-4.5 h-4.5 text-blue-500" />
                  【{selectedRegion.province}】生源报考专业细分
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">该地区报考大类的细分人数分布及占比系数</p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 text-[10px] font-bold rounded">
                  当前统计 {selectedRegion.count} 人
                </span>
                
                {isEditing && (
                  <button
                    onClick={() => handleAddMajor(selectedRegion.province)}
                    className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[9px] font-bold flex items-center gap-0.5 cursor-pointer"
                    title="在此省份下增加生源细分专业"
                  >
                    <Plus className="w-3 h-3" />
                    <span>增报大类</span>
                  </button>
                )}
              </div>
            </div>

            {/* List of Majors */}
            <div className="space-y-4">
              {selectedRegion.majors.map((maj, majIdx) => {
                const percentage = selectedRegion.count > 0 ? (maj.count / selectedRegion.count) * 100 : 0;

                return (
                  <div key={`maj-${maj.name}-${majIdx}`} className="space-y-1.5 group/major relative">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        {maj.name}
                      </span>
                      
                      <div className="flex items-center space-x-2">
                        {!isEditing ? (
                          <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                            {maj.count} 人 <span className="text-[10px] text-slate-400">({percentage.toFixed(1)}%)</span>
                          </span>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              value={maj.count}
                              onChange={(e) => handleUpdateMajorCount(selectedRegion.province, maj.name, parseInt(e.target.value) || 0)}
                              className={`w-14 text-center text-[10px] font-bold py-0.5 border rounded ${
                                isDarkMode ? "bg-slate-950 border-slate-800 text-blue-400" : "bg-white border-slate-300 text-blue-600"
                              }`}
                            />
                            <span className="text-[10px] text-slate-400">人 ({percentage.toFixed(1)}%)</span>
                            
                            <button
                              onClick={() => handleRemoveMajor(selectedRegion.province, maj.name)}
                              className="p-0.5 text-slate-400 hover:text-red-500 rounded transition-colors"
                              title="移除此大类生源"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Regional Diagnostic Summary */}
          <div className={`p-4 border rounded-xl mt-6 space-y-1 ${
            isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-150"
          }`}>
            <p className="font-bold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 地域智能宣发指导:
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              基于 <strong>{selectedRegion.province}</strong> 最新走势，最热门方向为 <strong>{selectedRegion.majors[0]?.name || "暂无报考"}</strong>。
              建议配合该省当地高校及建筑设计院，开展定向推广，并主攻 <strong>{selectedRegion.majors[0]?.name || "本专业"}</strong> 的证书含金量与新政策解读，能取得最大投放回报。
            </p>
          </div>

        </div>

      </div>

      {/* Dynamic Confirm Modal */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`max-w-md w-full p-6 rounded-2xl shadow-2xl border ${
                isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              <h4 className="text-sm font-black mb-2 text-slate-900 dark:text-white">
                {confirmModal.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                {confirmModal.message}
              </p>
              <div className="flex justify-end space-x-2">
                {!confirmModal.isAlert && (
                  <button
                    type="button"
                    onClick={() => setConfirmModal(null)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                      isDarkMode ? "border-slate-800 hover:bg-slate-850 text-slate-400" : "border-slate-200 hover:bg-slate-50 text-slate-500"
                    }`}
                  >
                    取消
                  </button>
                )}
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-500/10"
                >
                  确定
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Add Major Modal */}
      <AnimatePresence>
        {addMajorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`max-w-md w-full p-6 rounded-2xl shadow-2xl border ${
                isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-150 dark:border-slate-800 mb-4">
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  【{addMajorModal.province}】增报生源专业大类
                </h4>
                <button
                  type="button"
                  onClick={() => setAddMajorModal(null)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase">
                    专业大类名称 (如: 建筑结构、设备配电)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="请输入新注册专业名称"
                    value={newMajorName}
                    onChange={(e) => setNewMajorName(e.target.value)}
                    className={`w-full text-xs px-3 py-2 border rounded-lg outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase">
                    已报名到账生源基数 (人)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newMajorCount}
                    onChange={(e) => setNewMajorCount(parseInt(e.target.value) || 0)}
                    className={`w-full text-xs px-3 py-2 border rounded-lg outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddMajorModal(null)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                    isDarkMode ? "border-slate-800 hover:bg-slate-850 text-slate-400" : "border-slate-200 hover:bg-slate-50 text-slate-500"
                  }`}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => executeAddMajor(addMajorModal.province, newMajorName, newMajorCount)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-500/10"
                >
                  立即录入
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
