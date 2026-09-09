/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChannelData {
  target: number;
  actual: number;
}

export interface RowData {
  id: string;
  seq: number;
  name: string;
  date: string; // YYYY-MM-DD format
  channels: ChannelData[]; // Length must be exactly 7
  other: number;
  note?: string;
  isMergedGroup?: boolean;
}

export interface TableConfig {
  title: string;
  channels: string[]; // 7 channel names
}

export interface WeeklySnapshot {
  id: string;
  title: string;
  createdAt: string;
  startDate: string;
  endDate: string;
  totalActual: number;
  totalTarget: number;
  completionRate: number;
  averageDaily: number;
  peakDaily: number;
  peakDate: string;
  channelBreakdown: { name: string; target: number; actual: number }[];
  majorBreakdown: { name: string; target: number; actual: number; rate: number }[];
  dailyRecords: {
    date: string;
    actual: number;
    target: number;
    rate: number;
  }[];
  note?: string;
}
