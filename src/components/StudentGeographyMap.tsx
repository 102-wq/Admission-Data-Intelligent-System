/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { RegionalData } from "./StudentGeography";
import { 
  Compass, 
  Flame, 
  Layers, 
  Award, 
  TrendingUp, 
  Users, 
  Check, 
  Maximize2,
  Filter
} from "lucide-react";

interface StudentGeographyMapProps {
  regions: RegionalData[];
  selectedProvinceName: string;
  onSelectProvince: (province: string) => void;
  isDarkMode?: boolean;
}

export interface GeoProvinceDef {
  id: string;
  name: string;
  shortName: string;
  region: "华东" | "华南" | "华中" | "华北" | "西南" | "西北" | "东北" | "港澳台";
  cx: number;
  cy: number;
  path: string;
}

// 34 Provincial administrative divisions with stylized geometric choropleth SVG paths
export const CHINA_PROVINCES_GEO: GeoProvinceDef[] = [
  // 东北
  {
    id: "heilongjiang",
    name: "黑龙江省",
    shortName: "黑龙江",
    region: "东北",
    cx: 740,
    cy: 105,
    path: "M 685,75 L 750,55 L 795,95 L 775,145 L 715,140 L 685,115 Z"
  },
  {
    id: "jilin",
    name: "吉林省",
    shortName: "吉林",
    region: "东北",
    cx: 735,
    cy: 170,
    path: "M 695,145 L 770,150 L 780,185 L 725,200 L 685,175 Z"
  },
  {
    id: "liaoning",
    name: "辽宁省",
    shortName: "辽宁",
    region: "东北",
    cx: 685,
    cy: 220,
    path: "M 660,195 L 715,195 L 720,240 L 670,250 L 645,225 Z"
  },

  // 华北
  {
    id: "neimenggu",
    name: "内蒙古自治区",
    shortName: "内蒙古",
    region: "华北",
    cx: 505,
    cy: 155,
    path: "M 390,180 L 460,135 L 565,130 L 675,135 L 685,185 L 620,185 L 540,190 L 470,200 L 415,225 Z"
  },
  {
    id: "beijing",
    name: "北京市",
    shortName: "北京",
    region: "华北",
    cx: 580,
    cy: 200,
    path: "M 565,190 L 595,190 L 595,212 L 565,212 Z"
  },
  {
    id: "tianjin",
    name: "天津市",
    shortName: "天津",
    region: "华北",
    cx: 608,
    cy: 222,
    path: "M 598,212 L 622,212 L 620,235 L 598,230 Z"
  },
  {
    id: "hebei",
    name: "河北省",
    shortName: "河北",
    region: "华北",
    cx: 575,
    cy: 240,
    path: "M 545,200 L 565,190 L 595,190 L 635,215 L 625,265 L 565,270 L 545,245 Z"
  },
  {
    id: "shanxi",
    name: "山西省",
    shortName: "山西",
    region: "华北",
    cx: 518,
    cy: 255,
    path: "M 495,220 L 540,215 L 545,285 L 500,290 Z"
  },

  // 西北
  {
    id: "xinjiang",
    name: "新疆维吾尔自治区",
    shortName: "新疆",
    region: "西北",
    cx: 215,
    cy: 195,
    path: "M 125,145 L 245,130 L 320,185 L 290,265 L 185,275 L 130,225 Z"
  },
  {
    id: "qinghai",
    name: "青海省",
    shortName: "青海",
    region: "西北",
    cx: 335,
    cy: 285,
    path: "M 275,255 L 375,245 L 395,305 L 325,335 L 265,305 Z"
  },
  {
    id: "gansu",
    name: "甘肃省",
    shortName: "甘肃",
    region: "西北",
    cx: 405,
    cy: 250,
    path: "M 320,225 L 420,210 L 465,250 L 425,310 L 375,260 Z"
  },
  {
    id: "ningxia",
    name: "宁夏回族自治区",
    shortName: "宁夏",
    region: "西北",
    cx: 450,
    cy: 242,
    path: "M 435,220 L 468,220 L 462,268 L 435,265 Z"
  },
  {
    id: "shaanxi",
    name: "陕西省",
    shortName: "陕西",
    region: "西北",
    cx: 478,
    cy: 300,
    path: "M 462,240 L 498,240 L 505,345 L 452,345 L 455,295 Z"
  },

  // 西南
  {
    id: "xizang",
    name: "西藏自治区",
    shortName: "西藏",
    region: "西南",
    cx: 210,
    cy: 350,
    path: "M 130,310 L 275,305 L 315,355 L 285,415 L 140,405 Z"
  },
  {
    id: "sichuan",
    name: "四川省",
    shortName: "四川",
    region: "西南",
    cx: 405,
    cy: 375,
    path: "M 335,335 L 450,335 L 470,410 L 385,435 L 340,395 Z"
  },
  {
    id: "chongqing",
    name: "重庆市",
    shortName: "重庆",
    region: "西南",
    cx: 485,
    cy: 385,
    path: "M 468,360 L 512,365 L 505,420 L 468,410 Z"
  },
  {
    id: "guizhou",
    name: "贵州省",
    shortName: "贵州",
    region: "西南",
    cx: 455,
    cy: 450,
    path: "M 425,425 L 495,425 L 485,485 L 420,475 Z"
  },
  {
    id: "yunnan",
    name: "云南省",
    shortName: "云南",
    region: "西南",
    cx: 375,
    cy: 485,
    path: "M 345,435 L 420,440 L 415,530 L 340,515 Z"
  },

  // 华中
  {
    id: "henan",
    name: "河南省",
    shortName: "河南",
    region: "华中",
    cx: 550,
    cy: 320,
    path: "M 515,285 L 590,285 L 585,355 L 515,350 Z"
  },
  {
    id: "hubei",
    name: "湖北省",
    shortName: "湖北",
    region: "华中",
    cx: 545,
    cy: 388,
    path: "M 495,355 L 600,355 L 590,415 L 495,410 Z"
  },
  {
    id: "hunan",
    name: "湖南省",
    shortName: "湖南",
    region: "华中",
    cx: 535,
    cy: 455,
    path: "M 500,415 L 575,415 L 565,495 L 495,485 Z"
  },

  // 华东
  {
    id: "shandong",
    name: "山东省",
    shortName: "山东",
    region: "华东",
    cx: 640,
    cy: 275,
    path: "M 585,255 L 685,245 L 705,285 L 635,305 L 585,290 Z"
  },
  {
    id: "jiangsu",
    name: "江苏省",
    shortName: "江苏",
    region: "华东",
    cx: 655,
    cy: 335,
    path: "M 615,295 L 690,305 L 685,365 L 620,360 Z"
  },
  {
    id: "anhui",
    name: "安徽省",
    shortName: "安徽",
    region: "华东",
    cx: 618,
    cy: 365,
    path: "M 585,335 L 645,335 L 645,410 L 585,405 Z"
  },
  {
    id: "shanghai",
    name: "上海市",
    shortName: "上海",
    region: "华东",
    cx: 700,
    cy: 362,
    path: "M 685,350 L 715,350 L 712,375 L 685,372 Z"
  },
  {
    id: "zhejiang",
    name: "浙江省",
    shortName: "浙江",
    region: "华东",
    cx: 665,
    cy: 415,
    path: "M 635,385 L 695,380 L 690,445 L 630,445 Z"
  },
  {
    id: "jiangxi",
    name: "江西省",
    shortName: "江西",
    region: "华东",
    cx: 605,
    cy: 445,
    path: "M 575,410 L 635,410 L 630,490 L 570,485 Z"
  },
  {
    id: "fujian",
    name: "福建省",
    shortName: "福建",
    region: "华东",
    cx: 655,
    cy: 475,
    path: "M 625,445 L 685,445 L 675,510 L 620,505 Z"
  },
  {
    id: "taiwan",
    name: "台湾省",
    shortName: "台湾",
    region: "港澳台",
    cx: 715,
    cy: 505,
    path: "M 700,480 L 730,485 L 725,535 L 700,525 Z"
  },

  // 华南
  {
    id: "guangdong",
    name: "广东省",
    shortName: "广东",
    region: "华南",
    cx: 585,
    cy: 520,
    path: "M 535,490 L 655,495 L 640,555 L 545,550 Z"
  },
  {
    id: "guangxi",
    name: "广西壮族自治区",
    shortName: "广西",
    region: "华南",
    cx: 485,
    cy: 515,
    path: "M 435,485 L 535,485 L 525,550 L 440,545 Z"
  },
  {
    id: "hainan",
    name: "海南省",
    shortName: "海南",
    region: "华南",
    cx: 535,
    cy: 585,
    path: "M 515,570 L 560,570 L 555,605 L 515,600 Z"
  },
  {
    id: "xianggang",
    name: "香港特别行政区",
    shortName: "香港",
    region: "港澳台",
    cx: 615,
    cy: 545,
    path: "M 605,538 L 625,538 L 623,552 L 605,550 Z"
  },
  {
    id: "aomen",
    name: "澳门特别行政区",
    shortName: "澳门",
    region: "港澳台",
    cx: 582,
    cy: 550,
    path: "M 572,544 L 590,544 L 588,558 L 572,556 Z"
  }
];

export default function StudentGeographyMap({
  regions,
  selectedProvinceName,
  onSelectProvince,
  isDarkMode = false
}: StudentGeographyMapProps) {
  const [hoveredProvince, setHoveredProvince] = useState<GeoProvinceDef | null>(null);
  const [regionFilter, setRegionFilter] = useState<string>("全部");

  // Map province data to name lookup
  const regionMap = useMemo(() => {
    const map = new Map<string, RegionalData>();
    regions.forEach((r) => {
      // Direct match or substring match (e.g. "广东省" matches "广东")
      map.set(r.province, r);
      const short = r.province.replace(/(省|市|自治区|壮族自治区|回族自治区|维吾尔自治区|特别行政区)$/, "");
      map.set(short, r);
    });
    return map;
  }, [regions]);

  const maxCount = useMemo(() => {
    const counts = regions.map((r) => r.count);
    return Math.max(...counts, 1);
  }, [regions]);

  const totalCount = useMemo(() => {
    return regions.reduce((s, r) => s + r.count, 0) || 1;
  }, [regions]);

  // Ranked provinces for medals
  const topRankedNames = useMemo(() => {
    const sorted = [...regions].sort((a, b) => b.count - a.count);
    return {
      first: sorted[0]?.province,
      second: sorted[1]?.province,
      third: sorted[2]?.province
    };
  }, [regions]);

  // Color calculation based on recruitment ratio
  const getProvinceVisual = (geo: GeoProvinceDef) => {
    const data = regionMap.get(geo.name) || regionMap.get(geo.shortName);
    const count = data ? data.count : 0;
    const ratio = count / maxCount;
    const isSelected = selectedProvinceName === geo.name || selectedProvinceName === geo.shortName;
    const isHovered = hoveredProvince?.id === geo.id;

    let fillColor = isDarkMode ? "#1e293b" : "#f1f5f9";
    let textColor = isDarkMode ? "#64748b" : "#94a3b8";
    let badgeTier = "未覆盖";

    if (count > 0) {
      if (ratio >= 0.75) {
        fillColor = isDarkMode ? "#059669" : "#047857";
        textColor = "#ffffff";
        badgeTier = "重点重镇 (>75%)";
      } else if (ratio >= 0.5) {
        fillColor = isDarkMode ? "#10b981" : "#059669";
        textColor = "#ffffff";
        badgeTier = "骨干生源 (50-75%)";
      } else if (ratio >= 0.25) {
        fillColor = isDarkMode ? "#34d399" : "#10b981";
        textColor = isDarkMode ? "#064e3b" : "#ffffff";
        badgeTier = "稳健增长 (25-50%)";
      } else {
        fillColor = isDarkMode ? "#065f46" : "#6ee7b7";
        textColor = isDarkMode ? "#a7f3d0" : "#065f46";
        badgeTier = "潜力拓展 (<25%)";
      }
    }

    if (isSelected) {
      fillColor = isDarkMode ? "#10b981" : "#059669";
      textColor = "#ffffff";
    }

    return {
      data,
      count,
      ratio,
      fillColor,
      textColor,
      badgeTier,
      isSelected,
      isHovered
    };
  };

  const activeHoverData = hoveredProvince
    ? regionMap.get(hoveredProvince.name) || regionMap.get(hoveredProvince.shortName)
    : null;

  return (
    <div className={`p-5 border rounded-2xl shadow-xs transition-all relative overflow-hidden ${
      isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
    }`}>
      {/* Top Header & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Flame className="w-4 h-4" />
            </div>
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>全国招生生源地图热力分布</span>
              <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded text-[9px] font-bold">
                实时热力
              </span>
            </h4>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            根据各省市已到账生源基数自动渲染色温深度，支持悬浮探测、区域过滤与点击联动
          </p>
        </div>

        {/* Region Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1">
          {["全部", "华东", "华南", "华中", "西南", "西北", "华北", "东北"].map((r, rIdx) => (
            <button
              key={`rf-${r}-${rIdx}`}
              type="button"
              onClick={() => setRegionFilter(r)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                regionFilter === r
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : isDarkMode
                  ? "bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-slate-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Map Visual Stage */}
      <div className="relative w-full my-3 flex items-center justify-center">
        <svg
          viewBox="100 40 700 580"
          className="w-full h-auto max-h-[480px] drop-shadow-sm select-none"
        >
          {/* Map Background grid / compass aesthetic */}
          <defs>
            <radialGradient id="heatGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
            <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Provinces Path rendering */}
          {CHINA_PROVINCES_GEO.map((geo, geoIdx) => {
            const visual = getProvinceVisual(geo);
            const isFiltered = regionFilter !== "全部" && geo.region !== regionFilter;

            return (
              <g
                key={`geo-${geo.id}-${geoIdx}`}
                className="cursor-pointer transition-all duration-200"
                onClick={() => {
                  if (visual.data) {
                    onSelectProvince(visual.data.province);
                  } else {
                    onSelectProvince(geo.name);
                  }
                }}
                onMouseEnter={() => setHoveredProvince(geo)}
                onMouseLeave={() => setHoveredProvince(null)}
              >
                {/* Polygon Shape */}
                <motion.path
                  d={geo.path}
                  fill={visual.fillColor}
                  stroke={
                    visual.isSelected
                      ? "#ffffff"
                      : visual.isHovered
                      ? isDarkMode ? "#38bdf8" : "#0284c7"
                      : isDarkMode ? "#334155" : "#cbd5e1"
                  }
                  strokeWidth={visual.isSelected ? 2.5 : visual.isHovered ? 2 : 1}
                  strokeLinejoin="round"
                  opacity={isFiltered ? 0.25 : 1}
                  className="transition-all duration-200"
                  whileHover={{ scale: 1.015 }}
                  filter={visual.isSelected ? "url(#shadowFilter)" : undefined}
                />

                {/* Province Name & Count Center Tag */}
                <g
                  transform={`translate(${geo.cx}, ${geo.cy})`}
                  className="pointer-events-none"
                  opacity={isFiltered ? 0.3 : 1}
                >
                  {/* Top 3 Medals */}
                  {geo.name === topRankedNames.first && (
                    <text x="0" y="-12" textAnchor="middle" className="text-[9px]">
                      🥇
                    </text>
                  )}
                  {geo.name === topRankedNames.second && (
                    <text x="0" y="-12" textAnchor="middle" className="text-[9px]">
                      🥈
                    </text>
                  )}
                  {geo.name === topRankedNames.third && (
                    <text x="0" y="-12" textAnchor="middle" className="text-[9px]">
                      🥉
                    </text>
                  )}

                  {/* Province Short Name */}
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[9.5px] font-black tracking-tight"
                    fill={visual.textColor}
                    style={{
                      textShadow: visual.isSelected || visual.count > 0
                        ? "0px 1px 2px rgba(0,0,0,0.5)"
                        : "none"
                    }}
                  >
                    {geo.shortName}
                  </text>

                  {/* Recruitment Count indicator */}
                  {visual.count > 0 && (
                    <text
                      x="0"
                      y="11"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[8px] font-mono font-bold"
                      fill={visual.textColor}
                      style={{
                        textShadow: "0px 1px 2px rgba(0,0,0,0.6)"
                      }}
                    >
                      {visual.count}人
                    </text>
                  )}
                </g>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip during Hover */}
        {hoveredProvince && (
          <div
            className={`absolute z-30 p-3 rounded-xl shadow-2xl border pointer-events-none transition-all duration-150 backdrop-blur-md min-w-[210px] ${
              isDarkMode
                ? "bg-slate-900/95 border-slate-700 text-slate-100"
                : "bg-white/95 border-slate-200 text-slate-800"
            }`}
            style={{
              left: `${Math.max(10, Math.min(520, hoveredProvince.cx - 100))}px`,
              top: `${Math.max(10, hoveredProvince.cy - 120)}px`
            }}
          >
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-black text-xs">{hoveredProvince.name}</span>
                <span className="px-1 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-[9px]">
                  {hoveredProvince.region}
                </span>
              </div>
              {activeHoverData && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  占比 {((activeHoverData.count / totalCount) * 100).toFixed(1)}%
                </span>
              )}
            </div>

            {activeHoverData ? (
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">已招到账:</span>
                  <strong className="text-emerald-500 font-extrabold text-xs">
                    {activeHoverData.count} 人
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">去年同期:</span>
                  <span className="text-slate-600 dark:text-slate-300 font-bold">
                    {activeHoverData.lastYearCount} 人
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">同比增长率:</span>
                  <span className={`font-bold ${activeHoverData.growth >= 0 ? "text-rose-500" : "text-slate-400"}`}>
                    {activeHoverData.growth >= 0 ? "+" : ""}{activeHoverData.growth.toFixed(1)}%
                  </span>
                </div>
                {activeHoverData.majors && activeHoverData.majors.length > 0 && (
                  <div className="pt-1.5 mt-1 border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
                    <span className="text-slate-400 block mb-0.5 font-sans">热门报考首选:</span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400">
                      ★ {activeHoverData.majors[0]?.name} ({activeHoverData.majors[0]?.count}人)
                    </span>
                  </div>
                )}
                <div className="text-[9px] text-slate-400 font-sans mt-1.5 text-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 py-0.5 rounded">
                  点击查看专业深度画像 ➔
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 py-1">
                暂未录入该省招生数据，点击可在右侧编辑录入
              </div>
            )}
          </div>
        )}
      </div>

      {/* Heatmap Legend and Density Levels */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px]">
        {/* Heat Intensity Scale */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 font-bold uppercase tracking-wider">生源热力梯度:</span>
          <div className="flex items-center space-x-1 font-bold">
            <span className="px-1.5 py-0.5 rounded text-white bg-[#047857] text-[9px]">
              &gt;75% 极高密
            </span>
            <span className="px-1.5 py-0.5 rounded text-white bg-[#059669] text-[9px]">
              50-75% 骨干区
            </span>
            <span className="px-1.5 py-0.5 rounded text-white bg-[#10b981] text-[9px]">
              25-50% 稳健区
            </span>
            <span className="px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-900 bg-[#6ee7b7] text-[9px]">
              &lt;25% 潜力区
            </span>
            <span className="px-1.5 py-0.5 rounded text-slate-500 bg-slate-200 dark:bg-slate-800 text-[9px]">
              0 无覆盖
            </span>
          </div>
        </div>

        {/* Active Selection Pin & Quick Action */}
        <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
          <span>当前聚焦省份:</span>
          <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
            {selectedProvinceName}
          </strong>
        </div>
      </div>
    </div>
  );
}
