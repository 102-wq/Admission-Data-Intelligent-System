/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RowData, TableConfig } from "./types";

export const DEFAULT_CONFIG: TableConfig = {
  title: "2026年6月招生数据动态表(2026年6月1日-6月28日)",
  channels: [
    "咨询一部",
    "咨询二部",
    "网络运营",
    "品牌渠道",
    "新媒体部",
    "代理合作",
    "老生转介绍"
  ]
};

export const DEFAULT_ROWS: RowData[] = [
  {
    id: "row-1",
    seq: 1,
    name: "给排水专业",
    date: "2026-06-28",
    channels: [
      { target: 1, actual: 0 },
      { target: 7, actual: 5 },
      { target: 5, actual: 1 },
      { target: 5, actual: 0 },
      { target: 4, actual: 0 },
      { target: 3, actual: 0 },
      { target: 2, actual: 0 }
    ],
    other: 5
  },
  {
    id: "row-2",
    seq: 2,
    name: "发输电专业",
    date: "2026-06-28",
    channels: [
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 3, actual: 3 },
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 1, actual: 1 }
    ],
    other: 1
  },
  {
    id: "row-3",
    seq: 3,
    name: "供配电专业",
    date: "2026-06-28",
    channels: [
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 2, actual: 0 },
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 1, actual: 0 }
    ],
    other: 1
  },
  {
    id: "row-4",
    seq: 4,
    name: "环保专业",
    date: "2026-06-28",
    channels: [
      { target: 2, actual: 0 },
      { target: 2, actual: 0 },
      { target: 4, actual: 0 },
      { target: 7, actual: 6 },
      { target: 4, actual: 0 },
      { target: 2, actual: 2 },
      { target: 2, actual: 0 }
    ],
    other: 1
  },
  {
    id: "row-5",
    seq: 5,
    name: "环评专业",
    date: "2026-06-28",
    channels: [
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 2, actual: 0 },
      { target: 1, actual: 0 }
    ],
    other: 0
  },
  {
    id: "row-6",
    seq: 6,
    name: "岩土专业",
    date: "2026-06-28",
    channels: [
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 2, actual: 0 },
      { target: 1, actual: 0 },
      { target: 3, actual: 0 },
      { target: 1, actual: 0 },
      { target: 1, actual: 0 }
    ],
    other: 0
  },
  {
    id: "row-7",
    seq: 7,
    name: "暖通专业",
    date: "2026-06-28",
    channels: [
      { target: 1, actual: 0 },
      { target: 2, actual: 0 },
      { target: 2, actual: 0 },
      { target: 2, actual: 0 },
      { target: 2, actual: 0 },
      { target: 2, actual: 0 },
      { target: 5, actual: 3 }
    ],
    other: 0
  },
  {
    id: "row-8",
    seq: 8,
    name: "结构专业",
    date: "2026-06-28",
    channels: [
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 2, actual: 0 },
      { target: 1, actual: 0 }
    ],
    other: 0
  },
  {
    id: "row-9",
    seq: 9,
    name: "道路专业",
    date: "2026-06-28",
    channels: [
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 1, actual: 0 }
    ],
    other: 0
  },
  {
    id: "row-10",
    seq: 10,
    name: "233网校",
    date: "2026-06-28",
    channels: [
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 1, actual: 1 },
      { target: 1, actual: 1 },
      { target: 1, actual: 0 },
      { target: 1, actual: 0 }
    ],
    other: 1
  },
  {
    id: "row-11",
    seq: 11,
    name: "电气基础",
    date: "2026-06-28",
    channels: [
      { target: 3, actual: 0 },
      { target: 4, actual: 2 },
      { target: 12, actual: 15 },
      { target: 6, actual: 3 },
      { target: 6, actual: 4 },
      { target: 4, actual: 2 },
      { target: 3, actual: 3 }
    ],
    other: 7
  },
  {
    id: "row-12",
    seq: 12,
    name: "环保基础",
    date: "2026-06-28",
    channels: [
      { target: 2, actual: 2 },
      { target: 3, actual: 0 },
      { target: 5, actual: 3 },
      { target: 8, actual: 5 },
      { target: 4, actual: 0 },
      { target: 3, actual: 2 },
      { target: 3, actual: 3 }
    ],
    other: 4
  },
  {
    id: "row-13",
    seq: 13,
    name: "岩土基础",
    date: "2026-06-28",
    channels: [
      { target: 2, actual: 0 },
      { target: 3, actual: 1 },
      { target: 4, actual: 1 },
      { target: 5, actual: 1 },
      { target: 9, actual: 3 },
      { target: 3, actual: 0 },
      { target: 3, actual: 0 }
    ],
    other: 3
  },
  {
    id: "row-14",
    seq: 14,
    name: "水基础",
    date: "2026-06-28",
    channels: [
      { target: 1, actual: 0 },
      { target: 4, actual: 1 },
      { target: 3, actual: 2 },
      { target: 3, actual: 0 },
      { target: 2, actual: 0 },
      { target: 2, actual: 0 },
      { target: 2, actual: 2 }
    ],
    other: 1
  },
  {
    id: "row-15",
    seq: 15,
    name: "暖通基础",
    date: "2026-06-28",
    channels: [
      { target: 1, actual: 0 },
      { target: 2, actual: 1 },
      { target: 3, actual: 2 },
      { target: 3, actual: 1 },
      { target: 2, actual: 3 },
      { target: 2, actual: 2 },
      { target: 5, actual: 3 }
    ],
    other: 3
  },
  {
    id: "row-16",
    seq: 16,
    name: "结构基础",
    date: "2026-06-28",
    channels: [
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 2, actual: 1 },
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 2, actual: 0 },
      { target: 1, actual: 1 }
    ],
    other: 1
  },
  {
    id: "row-17",
    seq: 17,
    name: "公共基础",
    date: "2026-06-28",
    channels: [
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 2, actual: 0 },
      { target: 3, actual: 0 },
      { target: 2, actual: 0 },
      { target: 2, actual: 0 },
      { target: 1, actual: 0 }
    ],
    other: 0
  },
  {
    id: "row-18",
    seq: 18,
    name: "道路基础",
    date: "2026-06-28",
    channels: [
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 1, actual: 1 },
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 1, actual: 0 },
      { target: 2, actual: 0 }
    ],
    other: 0
  },
  {
    id: "row-19",
    seq: 19,
    name: "水利水电基础",
    date: "2026-06-28",
    channels: [
      { target: 3, actual: 1 },
      { target: 1, actual: 0 },
      { target: 2, actual: 2 },
      { target: 2, actual: 0 },
      { target: 2, actual: 5 },
      { target: 2, actual: 0 },
      { target: 1, actual: 1 }
    ],
    other: 2
  }
];

// Seedable deterministic pseudo-random helper
function getDeterministicValue(seedString: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
  }
  const x = Math.sin(hash) * 10000;
  const rand = x - Math.floor(x);
  return Math.floor(rand * (max - min + 1)) + min;
}

// Generate rich historical data to fulfill user comparison requests (Mon-Sun, this week, last week, last month, last year)
export function generateDefaultRowsWithHistory(): RowData[] {
  const dates: string[] = [];

  // This Month: 2026-06-01 to 2026-06-28 (today is Sunday June 28, 2026)
  for (let d = 1; d <= 28; d++) {
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    dates.push(`2026-06-${dayStr}`);
  }

  // Last Month: 2026-05-01 to 2026-05-31
  for (let d = 1; d <= 31; d++) {
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    dates.push(`2026-05-${dayStr}`);
  }

  // Last Year Same Period: 2025-06-01 to 2025-06-28
  for (let d = 1; d <= 28; d++) {
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    dates.push(`2025-06-${dayStr}`);
  }

  const baseRows = DEFAULT_ROWS;
  const allRows: RowData[] = [];

  dates.forEach((date) => {
    // Determine daily factors
    const dayNum = parseInt(date.substring(date.length - 2), 10);
    const dayOfWeek = (dayNum % 7); // Mock week cycle
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    const dateFactor = isWeekend ? 1.4 : 0.8;
    const yearFactor = date.startsWith("2025") ? 0.85 : 1.0;
    const monthFactor = date.includes("-05-") ? 0.9 : 1.05;

    baseRows.forEach((base, idx) => {
      const channels = base.channels.map((ch, chIdx) => {
        // Generate targets for daily entries (much lower than monthly cumulative total)
        let target = 0;
        const targetBaseline = base.channels[chIdx].target;
        if (targetBaseline > 0) {
          // Deterministic target based on seed
          target = getDeterministicValue(`${date}-${base.name}-${chIdx}-t`, 1, Math.ceil(targetBaseline / 4));
        }

        let actual = 0;
        if (target > 0) {
          const completionRate = getDeterministicValue(`${date}-${base.name}-${chIdx}-a`, 35, 115) / 100;
          actual = Math.round(target * completionRate * dateFactor * yearFactor * monthFactor);
          // ensure realistic numbers
          actual = Math.max(0, actual);
        } else if (getDeterministicValue(`${date}-${base.name}-${chIdx}-a-zero`, 0, 100) < 12) {
          // Sometimes get 1 enrollment even if daily target is 0
          actual = 1;
        }

        return { target, actual };
      });

      let other = 0;
      if (base.other > 0) {
        other = getDeterministicValue(`${date}-${base.name}-other`, 0, Math.ceil(base.other / 4));
        other = Math.round(other * dateFactor * yearFactor * monthFactor);
      }

      allRows.push({
        id: `row-${date}-${idx + 1}`,
        seq: idx + 1,
        name: base.name,
        date,
        channels,
        other
      });
    });
  });

  return allRows;
}

export interface MajorMetadata {
  description: string;
  keywords: string[];
  summary: string;
}

export const MAJOR_METADATA: Record<string, MajorMetadata> = {
  "给排水专业": {
    description: "注册给水排水工程师专业考试内容，包含建筑给水排水、建筑热水、消防给水、高层给水排水等工程实践经验及规范要求。",
    keywords: ["供水", "给排水", "给水", "排水", "建筑给水排水", "水污染", "水处理", "污水", "阀门", "管道"],
    summary: "勘察设计注册给水排水工程师专业考试，涉及城镇给水、排水及建筑给排水。"
  },
  "发输电专业": {
    description: "注册电气工程师（发输电）专业考试内容，涵盖发电厂、变电所、输配电线路等电网一次和二次系统的工程设计与运行维护。",
    keywords: ["发电厂", "变电站", "输配电", "输电线路", "电网", "高压电", "继电保护", "二次系统", "发电机", "变压器"],
    summary: "注册电气工程师（发输电），主攻发电厂与高低压输配电电网设计。"
  },
  "供配电专业": {
    description: "注册电气工程师（供配电）专业考试内容，针对厂矿企业、民用建筑、商业建筑供配电系统、照明、防雷、接地、强电及弱电系统设计。",
    keywords: ["厂矿供电", "低压配电", "强电", "照明设计", "防雷接地", "负荷计算", "配电箱", "动力配电", "变配电所"],
    summary: "注册电气工程师（供配电），针对工业与建筑供配电及防雷接地电气系统设计。"
  },
  "环保专业": {
    description: "注册公用设备工程师（环保）专业考试内容，包括水污染防治、大气污染防治、固体废物处理与处置、物理污染防治等环保技术实务。",
    keywords: ["废气", "烟气脱硫", "环境治理", "污水治理", "固废处理", "噪声控制", "大气污染", "水污染"],
    summary: "注册公用设备工程师（环保），涵盖废气、废水、固废及环境综合治理。"
  },
  "环评专业": {
    description: "环境影响评价工程师考试内容，针对规划和建设项目实施后可能造成的环境影响进行分析、预测和评估，编写环评报告书、报告表。",
    keywords: ["环评报告", "报告书", "报告表", "环境现状", "排污许可", "环境监理", "三同时", "环评大纲"],
    summary: "环境影响评价师，主要编制建设项目环评报告及提供环保咨询服务。"
  },
  "岩土专业": {
    description: "注册土木工程师（岩土）专业考试内容，核心在于岩土工程勘察、浅基础、深基础、边坡工程、基坑工程、地基处理及特殊土工程实践。",
    keywords: ["勘察", "桩基", "深基坑", "边坡支护", "地基处理", "土力学", "滑坡", "特殊土", "大坝基础"],
    summary: "注册岩土工程师，涉及工程地质勘察、基础及基坑边坡支护设计。"
  },
  "暖通专业": {
    description: "注册公用设备工程师（暖通空调）专业考试内容，涵盖供暖、通风、空气调节、冷热源设计、多联机、净化空调、锅炉房及消防排烟系统。",
    keywords: ["采暖", "暖通空调", "通风", "制冷", "新风系统", "多联机", "防排烟", "热负荷", "锅炉房"],
    summary: "注册公用设备工程师（暖通空调），包含集中供暖、通风、空气调节及冷热源。"
  },
  "结构专业": {
    description: "注册结构工程师（一级/二级）专业考试内容，针对房屋、高层、大跨度等建筑的混凝土结构、钢结构、砌体结构及木结构，含抗震防灾设计、荷载分析及PKPM应用。",
    keywords: ["混凝土", "钢结构", "结构设计", "抗震设计", "受力分析", "梁柱", "墙体", "荷载计算", "PKPM"],
    summary: "注册结构工程师，涉及各类建筑结构受力计算与抗震。"
  },
  "道路专业": {
    description: "注册土木工程师（道路工程）专业考试内容，包括公路、城市道路、立交桥梁、隧道、交通工程设施规划、几何线形设计与路基路面工程。",
    keywords: ["公路", "城市道路", "路基", "路面", "立交桥", "高架", "交通工程", "几何线形", "线形设计"],
    summary: "注册道路工程师，负责高等级公路、市政道路及交通安全附属工程设计。"
  },
  "233网校": {
    description: "233网校是一款综合性线上职业教育平台，提供勘察设计注册工程师、一级建造师、二级建造师、消防工程师等领域的线上网课、名师辅导和免费题库答疑。",
    keywords: ["网校", "网课", "在线题库", "一级建造师", "二级建造师", "消防工程师", "刷题", "免费资料"],
    summary: "合作在线网校渠道，包含各类注册工程师和建造师一建、二建考证课程。"
  },
  "电气基础": {
    description: "勘察设计注册电气工程师基础考试内容，涵盖高等数学、大学物理、大学化学、理论力学、材料力学、流体力学、电路分析、电磁场、数电及模电等专业基础理论。",
    keywords: ["电路分析", "电磁场", "数电", "模电", "晶体管", "放大电路", "基础课", "二极管"],
    summary: "注册电气基础考试，侧重电路分析、电磁场、数模电基础理论。"
  },
  "环保基础": {
    description: "勘察设计注册环保工程师基础考试内容，核心包含高等数学、普通物理、普通化学、工程流体力学、环境科学与工程原理、环境微生物学、环境监测等理论知识。",
    keywords: ["物理化学", "流体力学", "微生物", "环境监测", "环境工程原理", "分析化学", "化学反应", "基础课"],
    summary: "注册环保基础考试，侧重流体力学、环境监测、微生物及环保原理。"
  },
  "岩土基础": {
    description: "勘察设计注册土木工程师（岩土）基础考试内容，涵盖高等数学、材料力学、理论力学、流体力学、土力学、岩体力学、工程地质基础等课目。",
    keywords: ["土力学", "岩体力学", "地质学", "材料力学", "理论力学", "静力学", "水文地质", "基础课"],
    summary: "注册岩土基础考试，偏向岩体力学、土力学、工程地质和普通力学。"
  },
  "水基础": {
    description: "勘察设计注册给排水工程师基础考试内容，包含高等数学、普通物理、化学、水力学、明渠水流、管道阻力、水泵与水泵站、水分析化学、水污染控制等。",
    keywords: ["水力学", "流体力学", "明渠", "水泵", "水泵站", "分析化学", "管道阻力", "水处理原理", "基础课"],
    summary: "注册给排水基础考试，侧重水力学、水分析化学、水泵站运行理论。"
  },
  "暖通基础": {
    description: "勘察设计注册暖通工程师基础考试内容，包含高等数学、普通物理、普通力学、工程热力学、传热学、传热分析、流体力学等。",
    keywords: ["热力学", "传热学", "传热", "流体力学", "辐射", "对流", "卡诺循环", "工质", "基础课"],
    summary: "注册暖通基础考试，侧重工程热力学、传热学及工质循环计算。"
  },
  "结构基础": {
    description: "注册结构工程师基础考试内容，针对高等数学、普通力学（理力、材力、流力）、结构力学基本分析、混凝土与钢结构基础理论、计算机、电工等综合基础课。",
    keywords: ["结构力学", "材料力学", "理论力学", "弯矩", "剪力", "桁架", "受力分析", "基础课"],
    summary: "注册结构基础考试，强调力学基础、结构分析及三大力学。"
  },
  "公共基础": {
    description: "全国勘察设计注册工程师统一公共基础考试，所有专业通用。包括：数学（高数、线代、概率论）、物理、化学、理论力学、材料力学、流体力学、计算机基础、电工电子信号、工程经济、法律法规等11个模块。",
    keywords: ["高等数学", "概率论", "大学物理", "大学化学", "理论力学", "材料力学", "流体力学", "工程经济", "法律法规", "计算机基础", "公共课"],
    summary: "勘察设计公共基础，所有方向通用，包含高数、物理、力学、工程经济法律等。"
  },
  "道路基础": {
    description: "勘察设计注册道路工程师基础考试内容，包含高数、理力、测量学、道路工程材料、道路几何设计基础、路基工程等专业基础和公共基础基础内容。",
    keywords: ["测量学", "道路材料", "路基工程", "经纬仪", "水准仪", "土工", "基础课"],
    summary: "注册道路基础考试，包含测量学、道路材料及路基路面力学原理。"
  },
  "水利水电基础": {
    description: "勘察设计注册水利水电工程师基础考试内容，涉及水力学、水文学、水工建筑物、岩土力学与材料学基础等理论与实务基础。",
    keywords: ["工程水文学", "重力坝", "溢洪道", "水流", "径流", "泥沙", "水库", "基础课"],
    summary: "注册水利水电基础考试，侧重工程水文学、大坝水工及泥沙动力学。"
  }
};
