/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { 
  MapPin, 
  Flame, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Users, 
  Layers, 
  Filter, 
  ArrowRight, 
  Sparkles,
  BarChart3,
  RotateCcw,
  CheckCircle2,
  PieChart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RowData, TableConfig } from "../types";
import { CHINA_PROVINCES_GEO, GeoProvinceDef } from "./StudentGeographyMap";
import { RegionalData, DEFAULT_REGIONAL_SEED } from "./StudentGeography";

interface SidebarStudentGeographyHeatmapProps {
  rows: RowData[];
  isDarkMode: boolean;
  onNavigateToTab?: (tabId: string) => void;
  onSelectMajor?: (majorName: string) => void;
}

type HeatmapViewMode = "map" | "ranking";

export const SidebarStudentGeographyHeatmap: React.FC<SidebarStudentGeographyHeatmapProps> = ({
  rows,
  isDarkMode,
  onNavigateToTab,
  onSelectMajor,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<HeatmapViewMode>("map");
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>("全部");
  
  // Local storage synchronized regional data
  const [regions, setRegions] = useState<RegionalData[]>(() => {
    try {
      const saved = localStorage.getItem("recruitment_geography_data");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error reading geography data in sidebar", e);
    }
    return DEFAULT_REGIONAL_SEED;
  });

  // Listen for storage changes from StudentGeography component
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem("recruitment_geography_data");
        if (saved) {
          setRegions(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Failed to sync geography data", e);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Selected province for drilldown details
  const [selectedProvince, setSelectedProvince] = useState<string>("广东省");
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

  // Aggregated totals
  const totalStudents = useMemo(() => {
    return regions.reduce((acc, r) => acc + (r.count || 0), 0);
  }, [regions]);

  const totalProvincesCovered = useMemo(() => {
    return regions.filter(r => (r.count || 0) > 0).length;
  }, [regions]);

  // Province visual data lookup
  const provinceDataMap = useMemo(() => {
    const map = new Map<string, RegionalData>();
    regions.forEach(r => {
      // Normalize province name (e.g. "广东省" and "广东")
      map.set(r.province, r);
      const clean = r.province.replace(/(省|市|自治区|维吾尔自治区|壮族自治区|回族自治区|特别行政区)$/, "");
      map.set(clean, r);
    });
    return map;
  }, [regions]);

  // Drilldown detail data for the currently selected province
  const currentProvinceDetail = useMemo(() => {
    if (!selectedProvince) return null;
    const clean = selectedProvince.replace(/(省|市|自治区|维吾尔自治区|壮族自治区|回族自治区|特别行政区)$/, "");
    const found = regions.find(r => r.province === selectedProvince || r.province.startsWith(clean) || clean.startsWith(r.province.slice(0, 2)));
    
    if (found) return found;

    // Fallback stub for provinces without registered students yet
    const geo = CHINA_PROVINCES_GEO.find(g => g.name === selectedProvince || g.shortName === selectedProvince);
    return {
      province: geo?.name || selectedProvince,
      count: 0,
      lastYearCount: 0,
      growth: 0,
      majors: [],
      marketShare: 0
    };
  }, [selectedProvince, regions]);

  // Sorted regions by enrollment count
  const sortedRegions = useMemo(() => {
    return [...regions].sort((a, b) => (b.count || 0) - (a.count || 0));
  }, [regions]);

  // Top regions by filter
  const filteredRankings = useMemo(() => {
    if (selectedRegionFilter === "全部") return sortedRegions;
    return sortedRegions.filter(r => {
      const geo = CHINA_PROVINCES_GEO.find(g => g.name === r.province || g.shortName === r.province.replace(/(省|市|自治区)$/, ""));
      return geo ? geo.region === selectedRegionFilter : true;
    });
  }, [sortedRegions, selectedRegionFilter]);

  // Color generator for heatmap based on student count
  const getProvinceColor = (count: number, isSelected: boolean) => {
    if (isSelected) {
      return isDarkMode ? "#10b981" : "#059669"; // Highlight emerald
    }
    if (count >= 100) {
      return isDarkMode ? "#047857" : "#059669"; // Emerald 700 / 600
    }
    if (count >= 60) {
      return isDarkMode ? "#059669" : "#10b981"; // Emerald 600 / 500
    }
    if (count >= 30) {
      return isDarkMode ? "#0d9488" : "#34d399"; // Teal / Emerald 400
    }
    if (count > 0) {
      return isDarkMode ? "#134e4a" : "#a7f3d0"; // Emerald 200 / Teal dark
    }
    return isDarkMode ? "#1e293b" : "#f1f5f9"; // Slate 800 / 100 for zero
  };

  // Get SVG province visual attributes
  const getProvinceVisual = (geo: GeoProvinceDef) => {
    const data = provinceDataMap.get(geo.name) || provinceDataMap.get(geo.shortName);
    const count = data?.count || 0;
    const isSelected = selectedProvince === geo.name || selectedProvince === geo.shortName;
    const isHovered = hoveredProvince === geo.name || hoveredProvince === geo.shortName;
    const fillColor = getProvinceColor(count, isSelected || isHovered);

    return {
      data,
      count,
      isSelected,
      isHovered,
      fillColor
    };
  };

  const regionTabs = ["全部", "华东", "华南", "华中", "西南", "华北", "西北", "东北"];

  return (
    <div 
      id="sidebar-student-geography-heatmap-card"
      className={`border rounded-xl transition-all duration-300 overflow-hidden shadow-2xs ${
        isDarkMode 
          ? "bg-slate-900/90 border-slate-800/90" 
          : "bg-white border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
      }`}
    >
      {/* Component Header Bar */}
      <div 
        className={`px-3 py-2.5 flex items-center justify-between cursor-pointer select-none transition-colors ${
          isDarkMode 
            ? "hover:bg-slate-850/80 border-b border-slate-800/60" 
            : "hover:bg-slate-50 border-b border-slate-150"
        }`}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center space-x-2 min-w-0">
          <div className={`p-1.5 rounded-lg shrink-0 ${
            isDarkMode ? "bg-teal-500/15 text-teal-400" : "bg-teal-50 text-teal-600"
          }`}>
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className={`text-xs font-bold leading-tight truncate ${
                isDarkMode ? "text-slate-200" : "text-slate-800"
              }`}>
                全国生源分布热力图
              </h4>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                isDarkMode 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}>
                {totalProvincesCovered} 省
              </span>
            </div>
            <p className="text-[9px] text-slate-400 mt-0.5 truncate flex items-center gap-1">
              <span>总招生生源: <strong>{totalStudents}</strong> 人</span>
              <span>•</span>
              <span>点击省份下钻专业</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          {onNavigateToTab && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToTab("geography");
              }}
              title="打开全屏生源地域分析大屏"
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isDarkMode ? "text-slate-400 hover:text-teal-300 hover:bg-slate-800" : "text-slate-400 hover:text-teal-700 hover:bg-slate-100"
              }`}
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            className={`p-1 rounded-md transition-colors ${
              isDarkMode ? "text-slate-400 hover:bg-slate-800" : "text-slate-400 hover:bg-slate-100"
            }`}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Content Body */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-2.5">
              {/* Controls: Mode Switcher & Region Filter */}
              <div className="flex items-center justify-between gap-1">
                {/* View Mode Toggle */}
                <div className={`flex items-center p-0.5 rounded-lg border text-[10px] font-bold ${
                  isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
                }`}>
                  <button
                    type="button"
                    onClick={() => setViewMode("map")}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                      viewMode === "map"
                        ? isDarkMode 
                          ? "bg-teal-500/20 text-teal-300 shadow-2xs font-extrabold" 
                          : "bg-white text-teal-700 shadow-2xs font-extrabold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Flame className="w-2.5 h-2.5" />
                    <span>热力地图</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("ranking")}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                      viewMode === "ranking"
                        ? isDarkMode 
                          ? "bg-teal-500/20 text-teal-300 shadow-2xs font-extrabold" 
                          : "bg-white text-teal-700 shadow-2xs font-extrabold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <BarChart3 className="w-2.5 h-2.5" />
                    <span>生源排行</span>
                  </button>
                </div>

                {/* Region Filter Dropdown / Pill */}
                <div className="relative">
                  <select
                    value={selectedRegionFilter}
                    onChange={(e) => setSelectedRegionFilter(e.target.value)}
                    className={`text-[10px] font-semibold py-1 px-2 pr-6 rounded-lg border outline-none cursor-pointer appearance-none ${
                      isDarkMode 
                        ? "bg-slate-850 border-slate-750 text-slate-300 focus:border-teal-500" 
                        : "bg-slate-50 border-slate-200 text-slate-700 focus:border-teal-500"
                    }`}
                  >
                    {regionTabs.map((r, rIdx) => (
                      <option key={`region-opt-${r}-${rIdx}`} value={r}>{r}</option>
                    ))}
                  </select>
                  <Filter className="w-2.5 h-2.5 absolute right-2 top-2 pointer-events-none text-slate-400" />
                </div>
              </div>

              {/* View Mode 1: Interactive Heatmap Map */}
              {viewMode === "map" && (
                <div className="space-y-2">
                  {/* SVG Map Container */}
                  <div className={`relative rounded-xl border p-1 overflow-hidden select-none ${
                    isDarkMode ? "bg-slate-950/80 border-slate-850" : "bg-slate-50/80 border-slate-200"
                  }`}>
                    {/* Floating Info Tooltip */}
                    <div className="absolute top-1.5 left-2 z-10 pointer-events-none flex items-center gap-1 text-[9px] text-slate-400">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                      <span>已选中: <strong className={isDarkMode ? "text-teal-300" : "text-teal-700"}>{currentProvinceDetail?.province}</strong> ({currentProvinceDetail?.count || 0}人)</span>
                    </div>

                    <svg 
                      viewBox="300 30 550 540" 
                      className="w-full h-auto max-h-[190px] drop-shadow-xs transition-all"
                    >
                      <defs>
                        <filter id="sidebar-map-glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10b981" floodOpacity="0.4" />
                        </filter>
                      </defs>

                      {/* Map Paths */}
                      {CHINA_PROVINCES_GEO.map((geo, geoIdx) => {
                        const visual = getProvinceVisual(geo);
                        const isFilteredOut = selectedRegionFilter !== "全部" && geo.region !== selectedRegionFilter;

                        return (
                          <g
                            key={`sidebar-geo-${geo.id}-${geoIdx}`}
                            className="cursor-pointer transition-all duration-150"
                            onClick={() => setSelectedProvince(geo.name)}
                            onMouseEnter={() => setHoveredProvince(geo.name)}
                            onMouseLeave={() => setHoveredProvince(null)}
                            opacity={isFilteredOut ? 0.25 : 1}
                          >
                            <path
                              d={geo.path}
                              fill={visual.fillColor}
                              stroke={visual.isSelected ? "#38bdf8" : isDarkMode ? "#334155" : "#cbd5e1"}
                              strokeWidth={visual.isSelected ? 2 : 0.8}
                              filter={visual.isSelected ? "url(#sidebar-map-glow)" : undefined}
                              className="transition-colors hover:brightness-110"
                            />
                            {/* Province Label (Rendered for active or large contributors) */}
                            {(visual.count > 30 || visual.isSelected) && (
                              <text
                                x={geo.cx}
                                y={geo.cy}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill={visual.isSelected ? "#ffffff" : isDarkMode ? "#f8fafc" : "#0f172a"}
                                fontSize={visual.isSelected ? "11px" : "9px"}
                                fontWeight="800"
                                className="pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                              >
                                {geo.shortName}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>

                    {/* Heatmap Legend */}
                    <div className="flex items-center justify-between px-1.5 pt-1 text-[8px] text-slate-400 border-t border-slate-200/40 dark:border-slate-800/60">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-xs bg-slate-300 dark:bg-slate-700 inline-block" />
                        <span>0</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-xs bg-emerald-200 dark:bg-teal-900 inline-block" />
                        <span>1-30</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-xs bg-emerald-400 dark:bg-teal-600 inline-block" />
                        <span>30-60</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-xs bg-emerald-600 dark:bg-emerald-500 inline-block" />
                        <span>&gt;100人</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* View Mode 2: Tier Rankings */}
              {viewMode === "ranking" && (
                <div className="space-y-1 max-h-[190px] overflow-y-auto thin-scrollbar pr-0.5">
                  {filteredRankings.slice(0, 8).map((reg, idx) => {
                    const isSelected = selectedProvince === reg.province;
                    const maxCount = sortedRegions[0]?.count || 1;
                    const barWidth = Math.max(8, ((reg.count || 0) / maxCount) * 100);

                    return (
                      <div
                        key={`sidebar-rank-${reg.province}-${idx}`}
                        onClick={() => setSelectedProvince(reg.province)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between text-xs ${
                          isSelected
                            ? isDarkMode
                              ? "bg-teal-500/15 border-teal-500/40 text-teal-200"
                              : "bg-teal-50 border-teal-300 text-teal-900"
                            : isDarkMode
                            ? "bg-slate-950/60 border-slate-850 hover:bg-slate-850 text-slate-300"
                            : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 ${
                            idx === 0 
                              ? "bg-amber-400 text-amber-950 font-black" 
                              : idx === 1 
                              ? "bg-slate-300 text-slate-900 font-black" 
                              : idx === 2 
                              ? "bg-amber-700 text-amber-100 font-black" 
                              : isDarkMode 
                              ? "bg-slate-800 text-slate-400" 
                              : "bg-slate-200 text-slate-600"
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between text-[11px] mb-0.5">
                              <span className="font-bold truncate">{reg.province}</span>
                              <span className="font-mono font-black">{reg.count}人</span>
                            </div>
                            {/* Mini bar */}
                            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  idx === 0 
                                    ? "bg-amber-500" 
                                    : isDarkMode ? "bg-teal-400" : "bg-teal-500"
                                }`} 
                                style={{ width: `${barWidth}%` }} 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Drilldown Detail Card: Province Specific Major Breakdown */}
              {currentProvinceDetail && (
                <div className={`p-2.5 rounded-xl border space-y-2 transition-all ${
                  isDarkMode 
                    ? "bg-slate-950/90 border-teal-500/30 shadow-xs" 
                    : "bg-teal-50/30 border-teal-200 shadow-xs"
                }`}>
                  {/* Drilldown Header */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-teal-500/20">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                      <h5 className={`font-black text-xs truncate ${
                        isDarkMode ? "text-teal-300" : "text-teal-900"
                      }`}>
                        {currentProvinceDetail.province} 招生专业构成
                      </h5>
                    </div>

                    <div className="flex items-center space-x-1 text-[10px] font-mono shrink-0">
                      <span className="font-bold text-teal-600 dark:text-teal-400">
                        {currentProvinceDetail.count}人
                      </span>
                      <span className="text-slate-400">
                        ({totalStudents > 0 ? ((currentProvinceDetail.count / totalStudents) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                  </div>

                  {/* Growth Badge */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">同比上届:</span>
                    <span className={`font-mono font-bold flex items-center gap-0.5 ${
                      (currentProvinceDetail.growth || 0) >= 0 
                        ? isDarkMode ? "text-emerald-400" : "text-emerald-600"
                        : isDarkMode ? "text-rose-400" : "text-rose-600"
                    }`}>
                      {(currentProvinceDetail.growth || 0) >= 0 ? (
                        <TrendingUp className="w-2.5 h-2.5" />
                      ) : (
                        <TrendingDown className="w-2.5 h-2.5" />
                      )}
                      {(currentProvinceDetail.growth || 0) > 0 ? `+${currentProvinceDetail.growth}%` : `${currentProvinceDetail.growth || 0}%`}
                    </span>
                  </div>

                  {/* Majors Breakdown List */}
                  <div className="space-y-1.5 pt-0.5">
                    {currentProvinceDetail.majors && currentProvinceDetail.majors.length > 0 ? (
                      currentProvinceDetail.majors.map((maj, majIdx) => {
                        const provinceTotal = currentProvinceDetail.count || 1;
                        const pct = Math.round((maj.count / provinceTotal) * 100);

                        return (
                          <div 
                            key={`sidebar-maj-${maj.name}-${majIdx}`}
                            className={`p-1.5 rounded-lg border text-[10px] space-y-1 transition-all ${
                              isDarkMode 
                                ? "bg-slate-900/80 border-slate-800 hover:border-teal-500/50" 
                                : "bg-white border-slate-200/90 hover:border-teal-300 shadow-2xs"
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span 
                                onClick={() => onSelectMajor && onSelectMajor(maj.name)}
                                className="truncate cursor-pointer hover:underline text-slate-800 dark:text-slate-200 flex items-center gap-1"
                                title="点击联动筛选该专业"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                <span>{maj.name}</span>
                              </span>
                              <div className="flex items-center space-x-1.5 font-mono shrink-0">
                                <span className="font-extrabold text-teal-600 dark:text-teal-400">{maj.count} 人</span>
                                <span className="text-slate-400 font-medium">({pct}%)</span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300"
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-2 text-center text-[10px] text-slate-400">
                        暂无该省份具体专业生源拆分明细
                      </div>
                    )}
                  </div>

                  {/* Link to Full Geography View */}
                  {onNavigateToTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateToTab("geography")}
                      className={`w-full py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer border ${
                        isDarkMode
                          ? "bg-slate-900 hover:bg-slate-850 text-teal-300 border-teal-500/30"
                          : "bg-white hover:bg-teal-50 text-teal-700 border-teal-200"
                      }`}
                    >
                      <Sparkles className="w-2.5 h-2.5 text-teal-500" />
                      <span>进入「生源地域大屏」调整或补充数据</span>
                      <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SidebarStudentGeographyHeatmap;
