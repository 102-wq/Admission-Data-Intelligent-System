import { RowData } from "../types";

export interface MajorAlertInfo {
  hasAlert: boolean;
  alertReason: string;
  isCritical: boolean;
  isVolatile: boolean;
  rateDelta: number;
}

/**
 * Calculates 24h progress rate volatility and critical threshold status for a major.
 * Triggered if:
 * 1. Progress rate drops below 50% critical threshold or falls significantly behind time baseline.
 * 2. Progress rate in past 24 hours experiences drastic fluctuation, negative growth, or sudden stagnation.
 */
export function getMajorAlertStatus(
  majorName: string,
  rows: RowData[],
  selectedDate: string,
  currentRate: number,
  expectedTimeRate: number
): MajorAlertInfo {
  if (!majorName || !rows || rows.length === 0) {
    const isCritical = currentRate < 50;
    return {
      hasAlert: isCritical,
      alertReason: isCritical ? `达成率跌破50%临界值 (${currentRate.toFixed(1)}%)` : "",
      isCritical,
      isVolatile: false,
      rateDelta: 0,
    };
  }

  // Filter rows for this major up to selectedDate
  const cutoffDate = selectedDate || "9999-12-31";
  const majorRows = rows
    .filter((r) => r.name === majorName && !r.isMergedGroup && r.date && r.date <= cutoffDate)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (majorRows.length === 0) {
    const isCritical = currentRate < 50 || (expectedTimeRate > 0 && currentRate < expectedTimeRate - 15);
    return {
      hasAlert: isCritical,
      alertReason: isCritical ? `达成率跌破临界值 (${currentRate.toFixed(1)}%)` : "",
      isCritical,
      isVolatile: false,
      rateDelta: 0,
    };
  }

  // Aggregate by date
  const dateAgg: { [dateStr: string]: { actual: number; target: number } } = {};
  majorRows.forEach((r) => {
    if (!dateAgg[r.date]) {
      dateAgg[r.date] = { actual: 0, target: 0 };
    }
    const chActual = r.channels ? r.channels.reduce((sum, c) => sum + (Number(c.actual) || 0), 0) : 0;
    const chTarget = r.channels ? r.channels.reduce((sum, c) => sum + (Number(c.target) || 0), 0) : 0;
    const oVal = r.other;
    const oActual = typeof oVal === "number" ? oVal : (typeof oVal === "object" && oVal !== null && "actual" in oVal ? (oVal as { actual: number }).actual : 0);
    dateAgg[r.date].actual += chActual + (Number(oActual) || 0);
    dateAgg[r.date].target += chTarget;
  });

  const dates = Object.keys(dateAgg).sort();
  const currentDateKey = dates[dates.length - 1];
  const prevDateKey = dates.length > 1 ? dates[dates.length - 2] : null;

  const currentAgg = dateAgg[currentDateKey] || { actual: 0, target: 0 };
  const prevAgg = prevDateKey ? dateAgg[prevDateKey] : null;

  const prevRate = prevAgg && prevAgg.target > 0 ? (prevAgg.actual / prevAgg.target) * 100 : currentRate;
  const rateDelta = currentRate - prevRate;

  const reasons: string[] = [];
  let isCritical = false;
  let isVolatile = false;

  // Condition 1: Critical threshold breach (跌破临界值)
  if (currentRate < 50) {
    isCritical = true;
    reasons.push(`达成率跌破50%临界值(${currentRate.toFixed(1)}%)`);
  } else if (expectedTimeRate > 0 && currentRate < expectedTimeRate - 15) {
    isCritical = true;
    reasons.push(`落后时间基准线超15%(${currentRate.toFixed(1)}% vs ${expectedTimeRate.toFixed(1)}%)`);
  }

  // Condition 2: Drastic 24h volatility / regression (过去24小时内剧烈波动)
  if (prevAgg) {
    if (rateDelta < -0.1) {
      isVolatile = true;
      reasons.push(`过去24h达成率逆向下滑(${rateDelta.toFixed(1)}%)`);
    } else if (currentAgg.actual < prevAgg.actual) {
      isVolatile = true;
      reasons.push(`过去24h招生人数核减(${currentAgg.actual - prevAgg.actual}人)`);
    } else if (Math.abs(rateDelta) >= 8) {
      isVolatile = true;
      reasons.push(`过去24h达成率剧烈波动(${rateDelta > 0 ? "+" : ""}${rateDelta.toFixed(1)}%)`);
    } else if (prevAgg.actual > 3 && currentAgg.actual === prevAgg.actual && currentRate < 80) {
      isVolatile = true;
      reasons.push(`过去24h招生增长突然停滞`);
    }
  }

  const hasAlert = isCritical || isVolatile;
  const alertReason = reasons.length > 0 ? reasons.join("；") : "";

  return {
    hasAlert,
    alertReason,
    isCritical,
    isVolatile,
    rateDelta,
  };
}
