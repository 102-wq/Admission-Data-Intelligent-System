import React, { useState } from "react";
import { RowData } from "../types";
import { PieChart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MajorPopularityChartProps {
  rows: RowData[];
  isDarkMode: boolean;
  selectedDate: string;
  viewMode: "daily" | "monthly";
}

// Helper to calculate coordinates for polar angles
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

// Helper to generate SVG path for a donut segment
function getDonutPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
) {
  const diff = endAngle - startAngle;
  // If it's a full 360-degree circle, adjust slightly to prevent overlapping start/end points
  const safeEndAngle = diff >= 359.99 ? startAngle + 359.99 : endAngle;

  const startOut = polarToCartesian(cx, cy, outerRadius, startAngle);
  const endOut = polarToCartesian(cx, cy, outerRadius, safeEndAngle);
  const startIn = polarToCartesian(cx, cy, innerRadius, startAngle);
  const endIn = polarToCartesian(cx, cy, innerRadius, safeEndAngle);

  const largeArcFlag = diff <= 180 ? "0" : "1";

  return [
    `M ${startOut.x} ${startOut.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOut.x} ${endOut.y}`,
    `L ${endIn.x} ${endIn.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startIn.x} ${startIn.y}`,
    "Z"
  ].join(" ");
}

export default function MajorPopularityChart({
  rows,
  isDarkMode,
  selectedDate,
  viewMode
}: MajorPopularityChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scope, setScope] = useState<"current" | "all">("current");
  const [selectedMajorName, setSelectedMajorName] = useState<string | null>(null);
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // 1. Filter rows based on selected scope
  const activeRows = scope === "all"
    ? rows
    : (viewMode === "daily"
        ? rows.filter((r) => r.date === selectedDate)
        : rows.filter((r) => r.date.startsWith(selectedDate.substring(0, 7))));

  // 2. Aggregate actual completions by Major Name
  const aggregation: { [name: string]: number } = {};
  activeRows.forEach((row) => {
    // row actual is the sum of channels + other
    const rowActual = row.channels.reduce((sum, ch) => sum + ch.actual, 0) + row.other;
    if (rowActual > 0) {
      aggregation[row.name] = (aggregation[row.name] || 0) + rowActual;
    }
  });

  const totalActual = Object.values(aggregation).reduce((sum, val) => sum + val, 0);

  // Convert to array, sort by value descending
  const rawSegments = Object.entries(aggregation).map(([name, value]) => ({
    name,
    value,
    share: totalActual > 0 ? (value / totalActual) * 100 : 0
  })).sort((a, b) => b.value - a.value);

  // If there are many segments, group after index 4 as '其他' (Other)
  const segments: { name: string; value: number; share: number; color: string }[] = [];
  const palette = [
    "#6366f1", // Indigo
    "#10b981", // Emerald
    "#0ea5e9", // Sky
    "#f59e0b", // Amber
    "#ec4899", // Pink
    "#8b5cf6", // Violet
    "#14b8a6", // Teal
    "#f43f5e", // Rose
  ];

  if (rawSegments.length > 5) {
    // Top 4 individual segments
    for (let i = 0; i < 4; i++) {
      segments.push({
        ...rawSegments[i],
        color: palette[i % palette.length]
      });
    }
    // Sum the remaining segments
    const otherVal = rawSegments.slice(4).reduce((sum, s) => sum + s.value, 0);
    const otherShare = totalActual > 0 ? (otherVal / totalActual) * 100 : 0;
    segments.push({
      name: "其他专业",
      value: otherVal,
      share: otherShare,
      color: "#94a3b8" // slate-400
    });
  } else {
    rawSegments.forEach((s, idx) => {
      segments.push({
        ...s,
        color: palette[idx % palette.length]
      });
    });
  }

  // Calculate angles for drawing
  let currentAngle = 0;
  const drawnSegments = segments.map((seg) => {
    const angleSize = totalActual > 0 ? (seg.value / totalActual) * 360 : 0;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angleSize;
    currentAngle = endAngle;
    return {
      ...seg,
      startAngle,
      endAngle
    };
  });

  const activeSegment = hoveredIndex !== null ? drawnSegments[hoveredIndex] : null;

  const activeMajorName = hoveredIndex !== null 
    ? drawnSegments[hoveredIndex].name 
    : (selectedMajorName || (drawnSegments.length > 0 ? drawnSegments[0].name : null));

  const trendData = React.useMemo(() => {
    if (!activeMajorName) return [];
    
    const dates: string[] = [];
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      for (let i = 6; i >= 0; i--) {
        const d = new Date(year, month, day - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        dates.push(`${yyyy}-${mm}-${dd}`);
      }
    } else {
      return [];
    }

    return dates.map((d) => {
      // Find rows for this date
      const rowsOnDate = rows.filter((r) => r.date === d);
      
      // Total completion on this day
      let dayTotal = 0;
      rowsOnDate.forEach((r) => {
        const actual = r.channels.reduce((sum, ch) => sum + ch.actual, 0) + r.other;
        dayTotal += actual;
      });

      // Target major completion on this day
      const isOtherGroup = activeMajorName === "其他专业";
      let dayTarget = 0;

      if (isOtherGroup) {
        // Find names of the top 4 segments to exclude
        const topNames = drawnSegments.slice(0, 4).map(s => s.name);
        rowsOnDate.forEach((r) => {
          if (!topNames.includes(r.name)) {
            const actual = r.channels.reduce((sum, ch) => sum + ch.actual, 0) + r.other;
            dayTarget += actual;
          }
        });
      } else {
        const matchRow = rowsOnDate.find((r) => r.name === activeMajorName);
        if (matchRow) {
          dayTarget = matchRow.channels.reduce((sum, ch) => sum + ch.actual, 0) + matchRow.other;
        }
      }

      const ratio = dayTotal > 0 ? (dayTarget / dayTotal) * 100 : 0;
      
      // Format label as "MM-DD"
      const dateParts = d.split('-');
      const label = dateParts.length === 3 ? `${dateParts[1]}-${dateParts[2]}` : d;

      return {
        date: d,
        label,
        value: dayTarget,
        ratio
      };
    });
  }, [activeMajorName, selectedDate, rows, drawnSegments]);

  // Get active major color
  const activeColor = drawnSegments.find(s => s.name === activeMajorName)?.color || "#6366f1";
  
  // Create coordinates for the 7 days trend line
  const ratios = trendData.map((d) => d.ratio);
  const maxRatio = Math.max(...ratios, 10); // scale up to at least 10%

  const points = trendData.map((d, idx) => {
    const x = 12 + idx * (216 / 6); // 12 to 228
    const y = 42 - (d.ratio / maxRatio) * 34; // 8 to 42
    return { x, y, ...d };
  });

  const linePath = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} 45 L ${points[0].x} 45 Z` 
    : "";

  const hoveredTrendPoint = hoveredTrendIdx !== null ? points[hoveredTrendIdx] : null;

  return (
    <div 
      className={`p-3.5 border rounded-xl space-y-3 transition-colors duration-200 relative ${
        isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50/70 border-slate-150"
      }`}
      onMouseMove={handleMouseMove}
    >
      {/* Title & Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center text-slate-500 font-bold text-[10px] uppercase tracking-wider">
            <PieChart className="w-3.5 h-3.5 mr-1.5 text-indigo-500 shrink-0" />
            <span>专业热度分布</span>
          </div>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as "current" | "all")}
            className={`text-[9px] font-semibold py-0.5 pl-1.5 pr-6 border rounded cursor-pointer transition-colors outline-none focus:ring-1 focus:ring-indigo-500 ${
              isDarkMode
                ? "bg-slate-900 border-slate-800 text-slate-300 focus:bg-slate-950"
                : "bg-white border-slate-200 text-slate-600 focus:bg-slate-50"
            }`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.25rem center',
              backgroundSize: '1rem 1rem',
              backgroundRepeat: 'no-repeat',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
            }}
          >
            <option value="current">
              {viewMode === "daily" ? "当前日期" : "当前月份"}
            </option>
            <option value="all">全历史数据</option>
          </select>
        </div>
        <p className="text-[9px] text-slate-400 leading-tight">
          {scope === "all"
            ? "所有历史记录累积下，各专业在总招生报到人数中的累计贡献占比。"
            : "当前选定时间段内，各专业在总招生报到人数中的贡献占比。"}
        </p>
      </div>

      {totalActual > 0 ? (
        <div className="flex flex-col items-center gap-4">
          {/* Donut Chart Container */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90 overflow-visible">
              {drawnSegments.map((seg, idx) => {
                const isHovered = hoveredIndex === idx;
                const path = getDonutPath(80, 80, 50, 72, seg.startAngle, seg.endAngle);
                
                // Calculate bisector angle in radians for pop-out shift
                const bisectorRad = (((seg.startAngle + seg.endAngle) / 2 - 90) * Math.PI) / 180;
                const shiftX = isHovered ? Math.cos(bisectorRad) * 4.5 : 0;
                const shiftY = isHovered ? Math.sin(bisectorRad) * 4.5 : 0;

                return (
                  <path
                    key={`seg-path-${seg.name}-${idx}`}
                    d={path}
                    fill={seg.color}
                    className="transition-all duration-300 cursor-pointer"
                    style={{
                      opacity: hoveredIndex === null || isHovered ? 1 : 0.45,
                      transform: isHovered 
                        ? `translate(${shiftX}px, ${shiftY}px) scale(1.02)` 
                        : "translate(0px, 0px) scale(1)",
                      transformOrigin: "80px 80px"
                    }}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => setSelectedMajorName(seg.name)}
                  />
                );
              })}
            </svg>

            {/* Inner Ring Overlay text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-3 select-none">
              <AnimatePresence mode="wait">
                {activeSegment ? (
                  <motion.div
                    key={`seg-${activeSegment.name}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-0.5"
                  >
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[95px] text-center w-full">
                      {activeSegment.name}
                    </p>
                    <p className="text-base font-extrabold font-mono text-slate-900 dark:text-white leading-none">
                      {activeSegment.share.toFixed(1)}%
                    </p>
                    <p className="text-[9px] text-slate-400">
                      {activeSegment.value} 人
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="total"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-0.5"
                  >
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      总招录完成
                    </p>
                    <p className="text-xl font-extrabold font-mono text-indigo-500 dark:text-indigo-400 leading-none">
                      {totalActual}
                    </p>
                    <p className="text-[8px] text-slate-450">
                      (共 {rawSegments.length} 个专业)
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Legend Grid */}
          <div className="w-full grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
            {drawnSegments.map((seg, idx) => {
              const isHovered = hoveredIndex === idx;
              const isActive = seg.name === activeMajorName;
              return (
                <div
                  key={`seg-legend-${seg.name}-${idx}`}
                  className={`flex items-center gap-1.5 py-0.5 px-1 rounded transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? (isDarkMode ? "bg-slate-800 text-white font-semibold ring-1 ring-slate-700/50" : "bg-indigo-50/80 text-indigo-950 font-semibold ring-1 ring-indigo-100") 
                      : (isHovered 
                          ? (isDarkMode ? "bg-slate-900" : "bg-slate-100") 
                          : "hover:bg-slate-100/50 dark:hover:bg-slate-900/40")
                  }`}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => setSelectedMajorName(seg.name)}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className={`truncate flex-1 ${
                    isActive 
                      ? (isDarkMode ? "text-slate-100" : "text-indigo-950") 
                      : (isDarkMode ? "text-slate-350" : "text-slate-600")
                  }`}>
                    {seg.name}
                  </span>
                  <span className={`font-mono shrink-0 font-semibold ${
                    isActive ? "text-indigo-500" : "text-slate-400"
                  }`}>
                    {seg.share.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* 7-Day Trend Section */}
          {activeMajorName && trendData.length > 0 && (
            <div className={`w-full mt-3.5 pt-3 border-t transition-colors ${
              isDarkMode ? "border-slate-800/80" : "border-slate-200/60"
            }`}>
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: activeColor }}
                  />
                  <span className={`text-[10px] font-bold truncate ${
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  }`}>
                    【{activeMajorName}】历史7天趋势
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 font-mono scale-90 origin-right">
                  (7-Day Trend)
                </span>
              </div>

              {/* Sparkline Graphic container */}
              <div className="relative w-full h-[62px] rounded-lg border flex items-center justify-center p-1 overflow-visible select-none bg-slate-500/5 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900">
                <svg width="100%" height="100%" viewBox="0 0 240 50" className="overflow-visible">
                  <defs>
                    <linearGradient id={`trend-gradient-${activeColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={activeColor} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={activeColor} stopOpacity="0.01" />
                    </linearGradient>
                  </defs>

                  {/* Shading Area */}
                  {areaPath && (
                    <path
                      d={areaPath}
                      fill={`url(#trend-gradient-${activeColor.replace('#', '')})`}
                      className="transition-all duration-500"
                    />
                  )}

                  {/* Trend Line */}
                  {linePath && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke={activeColor}
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all duration-500"
                    />
                  )}

                  {/* Circles & Interaction Targets */}
                  {points.map((p, idx) => {
                    const isPtHovered = hoveredTrendIdx === idx;
                    return (
                      <g key={`pt-trend-${p.date}-${idx}`} className="cursor-pointer">
                        {/* Larger background dot for easy hover */}
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="8"
                          fill="transparent"
                          onMouseEnter={() => setHoveredTrendIdx(idx)}
                          onMouseLeave={() => setHoveredTrendIdx(null)}
                        />
                        {/* Interactive Dot visual */}
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={isPtHovered ? "4" : "2.5"}
                          fill={isPtHovered ? "#fff" : activeColor}
                          stroke={isPtHovered ? activeColor : "none"}
                          strokeWidth={isPtHovered ? "1.5" : "0"}
                          className="transition-all duration-200"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Embedded Trend Tooltip */}
                <AnimatePresence>
                  {hoveredTrendPoint && (
                    <motion.div
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className={`absolute bottom-full mb-1.5 p-1.5 rounded-md border text-[9px] shadow-lg backdrop-blur-md flex flex-col gap-0.5 pointer-events-none z-10 font-mono ${
                        isDarkMode
                          ? "bg-slate-900/95 border-slate-800 text-slate-200"
                          : "bg-white/95 border-slate-200 text-slate-800"
                      }`}
                      style={{
                        left: `${(hoveredTrendPoint.x / 240) * 100}%`,
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <div className="font-bold text-slate-400 text-center">{hoveredTrendPoint.label}</div>
                      <div className="flex gap-2 justify-between">
                        <span className="text-slate-450">完成比:</span>
                        <span className="font-bold text-emerald-500">{hoveredTrendPoint.ratio.toFixed(1)}%</span>
                      </div>
                      <div className="flex gap-2 justify-between">
                        <span className="text-slate-450">人数:</span>
                        <span className="font-bold text-indigo-500">{hoveredTrendPoint.value}人</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Sparkline X Axis Indicators */}
              <div className="flex justify-between text-[8px] text-slate-400 font-mono px-1.5 mt-1">
                <span>{trendData[0]?.label}</span>
                <span>{trendData[3]?.label}</span>
                <span>{trendData[6]?.label}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="h-32 flex flex-col items-center justify-center border border-dashed rounded-lg dark:border-slate-800 border-slate-200">
          <p className="text-[10px] text-slate-400 font-medium text-center">当前时间段暂无实际招生数据</p>
          <p className="text-[9px] text-slate-500 mt-1 text-center">请在表格内填报或选择其它日期</p>
        </div>
      )}

      {/* Floating Tooltip */}
      <AnimatePresence>
        {hoveredIndex !== null && activeSegment && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 pointer-events-none p-2.5 rounded-lg shadow-xl border text-[11px] flex flex-col gap-1 backdrop-blur-md font-sans w-36"
            style={{
              left: mousePos.x > 140 ? mousePos.x - 150 : mousePos.x + 12,
              top: mousePos.y > 230 ? mousePos.y - 85 : mousePos.y + 12,
              backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.92)" : "rgba(255, 255, 255, 0.96)",
              borderColor: isDarkMode ? "rgba(51, 65, 85, 0.85)" : "rgba(226, 232, 240, 0.95)",
              color: isDarkMode ? "#f8fafc" : "#0f172a"
            }}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: activeSegment.color }} />
              <span className="truncate flex-1">{activeSegment.name}</span>
            </div>
            <div className="border-t border-slate-200/40 dark:border-slate-800/60 my-0.5" />
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-450 dark:text-slate-500">招录人数:</span>
              <span className="font-extrabold font-mono text-indigo-500 dark:text-indigo-400">{activeSegment.value}人</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-450 dark:text-slate-500">完成占比:</span>
              <span className="font-extrabold font-mono text-emerald-500">{activeSegment.share.toFixed(1)}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
