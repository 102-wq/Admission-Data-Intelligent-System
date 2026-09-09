import React from "react";

interface MiniSparklineProps {
  data: number[];
  dates?: string[];
  color?: string;
  width?: number;
  height?: number;
  label?: string;
  unit?: string;
  isDarkMode?: boolean;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({
  data,
  dates = [],
  color = "#10b981",
  width = 56,
  height = 24,
  label = "趋势",
  unit = "",
  isDarkMode = false,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-12 h-6 flex items-center justify-center text-[8px] text-slate-400 font-mono">
        -
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;

  const paddingY = 4;
  const paddingX = 4;
  const drawWidth = width - paddingX * 2;
  const drawHeight = height - paddingY * 2;

  const points = data.map((val, idx) => {
    const x = paddingX + (data.length > 1 ? (idx / (data.length - 1)) * drawWidth : drawWidth / 2);
    const y = height - paddingY - ((val - min) / range) * drawHeight;
    return { x, y, val, date: dates[idx] || "" };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${height - 1} L ${points[0].x.toFixed(1)} ${height - 1} Z`;

  const first = data[0];
  const last = data[data.length - 1];
  const diff = last - first;
  const percentChange = first > 0 ? ((diff / first) * 100).toFixed(0) : (last > 0 ? "+100" : "0");
  const isUp = diff >= 0;

  const gradientId = React.useId ? React.useId().replace(/:/g, '') : `sparkline-grad-${Math.random().toString(36).substring(2, 8)}`;
  const lastPoint = points[points.length - 1];

  const tooltipText = `${label} (${data.length}个时间节点):\n` + data.map((v, i) => `${dates[i] ? dates[i] + ': ' : ''}${v}${unit}`).join('\n');

  return (
    <div
      className="flex flex-col items-end justify-center shrink-0 ml-1 group/sparkline cursor-help relative"
      title={tooltipText}
    >
      <div className="flex items-center gap-1">
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Area under curve */}
          <path d={areaD} fill={`url(#${gradientId})`} />

          {/* Line stroke */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Latest value point indicator */}
          {lastPoint && (
            <g>
              <circle
                cx={lastPoint.x}
                cy={lastPoint.y}
                r="2.5"
                fill={color}
              />
              <circle
                cx={lastPoint.x}
                cy={lastPoint.y}
                r="1"
                fill="#ffffff"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Mini Trend badge */}
      <span
        className={`text-[8px] font-mono font-bold leading-none mt-0.5 flex items-center gap-0.5 ${
          isUp
            ? isDarkMode
              ? "text-emerald-400"
              : "text-emerald-600"
            : isDarkMode
            ? "text-rose-400"
            : "text-rose-600"
        }`}
      >
        {isUp ? "↑" : "↓"}
        {Math.abs(Number(percentChange))}%
      </span>
    </div>
  );
};
