import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { RowData } from "../types";
import { TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

interface MajorTrendChartProps {
  rows: RowData[];
  isDarkMode: boolean;
  selectedDate: string;
  viewMode: "daily" | "monthly";
}

export default function MajorTrendChart({
  rows,
  isDarkMode,
  selectedDate,
  viewMode
}: MajorTrendChartProps) {
  // Filter rows for the active period
  const activeRows = viewMode === "daily"
    ? rows.filter((r) => r.date === selectedDate)
    : rows.filter((r) => r.date.startsWith(selectedDate.substring(0, 7)));

  // Map data to chart format
  const data = activeRows.map((row) => {
    const target = row.channels.reduce((sum, ch) => sum + ch.target, 0);
    const actual = row.channels.reduce((sum, ch) => sum + ch.actual, 0) + row.other;
    const gap = Math.max(0, target - actual);
    const shortName = row.name.length > 4 ? row.name.slice(0, 4) + ".." : row.name;
    
    return {
      fullName: row.name,
      name: shortName,
      "目标计划": target,
      "实际报到": actual,
      "招生缺口": gap,
    };
  });

  // Calculate overall statistics
  const totalTarget = data.reduce((sum, d) => sum + d["目标计划"], 0);
  const totalActual = data.reduce((sum, d) => sum + d["实际报到"], 0);
  const totalGap = Math.max(0, totalTarget - totalActual);

  const colors = {
    target: isDarkMode ? "#3b82f6" : "#2563eb", // Blue
    actual: isDarkMode ? "#10b981" : "#059669", // Emerald
    gap: isDarkMode ? "#f59e0b" : "#d97706",    // Amber
    grid: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
    text: isDarkMode ? "#94a3b8" : "#64748b",
  };

  return (
    <div className={`p-3 border rounded-xl space-y-3 transition-colors duration-200 ${
      isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50/70 border-slate-150"
    }`}>
      {/* Title & Stats Summary */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-slate-500 font-bold text-[10px] uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-indigo-500 shrink-0" />
            <span>专业招生趋势 (Major Gaps)</span>
          </div>
          {totalGap > 0 ? (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 flex items-center gap-0.5 font-bold animate-pulse">
              <AlertTriangle className="w-2.5 h-2.5" />
              缺口 {totalGap}人
            </span>
          ) : totalTarget > 0 ? (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center gap-0.5 font-bold">
              <CheckCircle2 className="w-2.5 h-2.5" />
              已达标
            </span>
          ) : null}
        </div>
        
        <p className="text-[9px] text-slate-400 leading-tight">
          对比 {viewMode === "daily" ? `当日 (${selectedDate})` : `${selectedDate.substring(0, 7)}月`} 各专业计划数与目前实际报到人数，找出薄弱环。
        </p>
      </div>

      {/* Chart Canvas */}
      {data.length > 0 ? (
        <div className="h-44 w-full -ml-4 pr-1 text-[9px] select-none">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke={colors.text} 
                tickLine={false}
                axisLine={false}
                fontSize={8}
              />
              <YAxis 
                stroke={colors.text} 
                tickLine={false}
                axisLine={false}
                fontSize={8}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    const tgt = item["目标计划"];
                    const act = item["实际报到"];
                    const gp = item["招生缺口"];
                    const rate = tgt > 0 ? ((act / tgt) * 100).toFixed(0) : "0";
                    return (
                      <div className={`p-2 border rounded-lg shadow-xl text-[10px] space-y-1 ${
                        isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-150 text-slate-800"
                      }`}>
                        <p className="font-bold border-b pb-1 dark:border-slate-800 border-slate-100 mb-1 max-w-[150px] truncate">
                          {item.fullName}
                        </p>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">目标计划:</span>
                          <span className="font-mono font-bold">{tgt}人</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-emerald-500">实际完成:</span>
                          <span className="font-mono font-bold text-emerald-500">{act}人</span>
                        </div>
                        {gp > 0 ? (
                          <div className="flex justify-between gap-4 border-t border-dashed dark:border-slate-800 border-slate-100 pt-1 mt-1 text-amber-500 font-bold">
                            <span>招生缺口:</span>
                            <span className="font-mono">-{gp}人 ({rate}%)</span>
                          </div>
                        ) : (
                          <div className="flex justify-between gap-4 border-t border-dashed dark:border-slate-800 border-slate-100 pt-1 mt-1 text-emerald-500 font-bold">
                            <span>完成进度:</span>
                            <span className="font-mono">{rate}%</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="目标计划" fill={colors.target} radius={[2, 2, 0, 0]} maxBarSize={15} />
              <Bar dataKey="实际报到" fill={colors.actual} radius={[2, 2, 0, 0]} maxBarSize={15} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-32 flex flex-col items-center justify-center border border-dashed rounded-lg dark:border-slate-800 border-slate-200">
          <p className="text-[10px] text-slate-400 font-medium">当前选定日期暂无招生明细</p>
          <p className="text-[9px] text-slate-500 mt-1">可在明细表格中增加专业招生行</p>
        </div>
      )}

      {/* Mini Legend */}
      {data.length > 0 && (
        <div className="flex items-center justify-center gap-4 text-[8px] font-bold text-slate-400">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.target }} />
            <span>目标计划</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.actual }} />
            <span>实际报到</span>
          </div>
          {totalGap > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.gap }} />
              <span>存在缺口</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
