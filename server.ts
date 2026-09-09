import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase request size limit for base64 images
app.use(express.json({ limit: "50mb" }));

// Initialize Gemini API Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper to call generateContent with automatic model fallback for maximum resilience
async function generateWithModelFallback(params: {
  preferredModel: string;
  contents: any;
  config?: any;
}) {
  const modelsToTry = [
    params.preferredModel,
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-3.5-flash"
  ];

  // De-duplicate model list
  const uniqueModels = Array.from(new Set(modelsToTry));

  let lastError: any = null;
  for (const model of uniqueModels) {
    try {
      console.log(`[Gemini API] Attempting generateContent with model: ${model}`);
      const response = await ai.models.generateContent({
        model: model,
        contents: params.contents,
        config: params.config,
      });
      console.log(`[Gemini API] Success with model: ${model}`);
      return response;
    } catch (err: any) {
      console.warn(`[Gemini API] Failed with model ${model}:`, err.message || err);
      lastError = err;
      
      const errMsg = (err.message || "").toLowerCase();
      // If it's permission denied (403), not found, or quota issue, continue to the next model
      if (
        errMsg.includes("denied") ||
        errMsg.includes("permission") ||
        errMsg.includes("not found") ||
        errMsg.includes("403") ||
        errMsg.includes("quota") ||
        errMsg.includes("limit") ||
        errMsg.includes("not support")
      ) {
        continue;
      }
      
      // Fallback for general errors to make it highly resilient
      continue;
    }
  }

  throw lastError || new Error("All Gemini model fallback options failed.");
}

// API Routes
app.post("/api/ocr", async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image || !mimeType) {
      return res.status(400).json({ error: "Missing image or mimeType" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in environment secrets.",
      });
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: image,
      },
    };

    const textPart = {
      text: `You are a high-precision OCR data extraction assistant specialized in school enrollment and recruitment report sheets.
Analyze the provided screenshot, photograph or graphic table of recruitment/enrollment progress.
Identify the data rows. For each row, extract the major/specialty/subject name, and the targeted (计划) and actual (实际/已报/报名) enrollment values across the 7 major channels in this exact order:
1. 咨询一部 (Counseling Dept 1)
2. 咨询二部 (Counseling Dept 2)
3. 网络运营 (Network Operations)
4. 品牌渠道 (Brand Channels)
5. 新媒体部 (New Media Dept)
6. 代理合作 (Agency / Agent Partnership)
7. 老生转介绍 (Alumni/Student Referral)

Also look for a column or section representing unlisted/other channels ('其他/其它') and extract its actual count.
Try to find a date in the header or title of the sheet (format YYYY-MM-DD or similar). If you see a Chinese date like 6月28日, infer the year 2026.

Extract all records faithfully and map them to the structured response schema. Ensure you output exactly 7 integers in both channelTargets and channelActuals. Fill 0s for columns or channels that aren't mentioned or have empty values.`,
    };

    const response = await generateWithModelFallback({
      preferredModel: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedDate: {
              type: Type.STRING,
              description: "The date of the report found in the image header or body, format YYYY-MM-DD. If missing or not found, return empty string.",
            },
            rows: {
              type: Type.ARRAY,
              description: "List of extracted recruitment rows from the image.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: {
                    type: Type.STRING,
                    description: "The name of the major, specialty or class (e.g. 给排水专业, 电气基础).",
                  },
                  channelTargets: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: "Target (计划) goals for the 7 channels in order: [咨询一部, 咨询二部, 网络运营, 品牌渠道, 新媒体部, 代理合作, 老生转介绍]. Must contain exactly 7 integers. Fill 0 for columns that are missing.",
                  },
                  channelActuals: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: "Actual (实际/已报) counts for the 7 channels in order: [咨询一部, 咨询二部, 网络运营, 品牌渠道, 新媒体部, 代理合作, 老生转介绍]. Must contain exactly 7 integers. Fill 0 for columns that are missing.",
                  },
                  other: {
                    type: Type.INTEGER,
                    description: "Enrollment actual count from 'other' (其他) channels. Fill 0 if missing.",
                  },
                },
                required: ["name", "channelTargets", "channelActuals", "other"],
              },
            },
          },
          required: ["rows"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      return res.status(500).json({ error: "No text returned from Gemini." });
    }

    const data = JSON.parse(text.trim());
    return res.json(data);
  } catch (error: any) {
    console.error("Gemini OCR Error:", error);
    return res.status(500).json({ error: error.message || "Failed to process image OCR." });
  }
});

// Generate Daily Recruitment Summary Endpoint
app.post("/api/summarize", async (req, res) => {
  try {
    const { date, rows } = req.body;
    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: "Invalid rows data" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in environment secrets.",
      });
    }

    let rowsContext = rows.map((r, i) => {
      const target = r.channels.reduce((sum: number, ch: any) => sum + ch.target, 0);
      const actual = r.channels.reduce((sum: number, ch: any) => sum + ch.actual, 0) + r.other;
      const progress = target > 0 ? ((actual / target) * 100).toFixed(1) + "%" : "0.0%";
      const notesStr = r.note ? `【备注注释】: ${r.note}` : "";
      
      const channelDetails = r.channels.map((ch: any, idx: number) => {
        const channelNames = ["咨询一部", "咨询二部", "网络运营", "品牌渠道", "新媒体", "代理合作", "老生转介绍"];
        return `${channelNames[idx]}: 实际报到 ${ch.actual}人 (目标 ${ch.target}人)`;
      }).join(", ");

      return `${i+1}. 专业: ${r.name} | 报到总人数: ${actual}人 (目标总量: ${target}人, 进度: ${progress}) \n   各渠道情况: ${channelDetails}${r.other > 0 ? `, 其他渠道: ${r.other}人` : ""}\n   ${notesStr}`;
    }).join("\n\n");

    if (rows.length === 0) {
      rowsContext = "今日暂无招生报到登记数据。";
    }

    const systemInstruction = `你是一位专业且资深的教育招生与运营数据分析师。
请根据用户提供的【今日各专业招生登记数据】及【备注异常信息】，撰写一份简洁生动、格式优美、重点突出的【招生日报/招生综述文案】。

文案要求：
1. 语言风格：专业、严谨、鼓舞士气，适合直接复制并发送至「招生工作群」或「管理团队汇报群」。
2. 包含以下核心板块：
   - 📅 【今日招生概况】（汇总今日的总招生报到人数，以及整体目标进度，例如“今日共计报到xx人，达成整体指标的xx%”）
   - 🌟 【今日招生之星/亮点专业】（分析并列出报到绝对值或完成比例最突出的专业，提炼其最关键的贡献渠道，如新媒体或咨询一部等）
   - ⚠️ 【重点备注与原因剖析】（高度整合和提炼备注中反馈的具体情况，比如招生波动、特定渠道高峰、外界环境反馈等，进行简练总结）
   - 🚀 【明日运营动作建议】（提出1-2条简易、能够马上落地的业务策略或渠道推进建议）
3. 格式规范：充分利用漂亮的 Emoji 符号进行清晰的视觉分栏（如 📅, 🌟, ⚠️, 🚀, 📈），每段不要太长，保持高度可读和整洁。
4. 字数控制：300-500字左右，切记言简意赅，不要生成啰嗦无用的废话。`;

    const prompt = `当前日期：${date}

今日各专业招生数据明细如下：
${rowsContext}`;

    const response = await generateWithModelFallback({
      preferredModel: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const summary = response.text;
    if (!summary) {
      return res.status(500).json({ error: "No summary text generated from Gemini." });
    }

    return res.json({ summary });
  } catch (error: any) {
    console.error("Gemini Summarize Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate recruitment summary." });
  }
});

// Generate Monthly Enrollment Trend Analysis and Markdown Report
app.post("/api/analyze-trends", async (req, res) => {
  try {
    const { rows, config } = req.body;
    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: "Invalid rows data" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in environment secrets.",
      });
    }

    // Sort rows by date to ensure proper chronological order
    const sortedRows = [...rows].sort((a, b) => a.date.localeCompare(b.date));

    // 1. Gather general statistics
    const totalTarget = sortedRows.reduce((sum, r) => {
      return sum + r.channels.reduce((chSum: number, ch: any) => chSum + (ch.target || 0), 0);
    }, 0);
    const totalActual = sortedRows.reduce((sum, r) => {
      const chActual = r.channels.reduce((chSum: number, ch: any) => chSum + (ch.actual || 0), 0);
      return sum + chActual + (r.other || 0);
    }, 0);
    const overallRate = totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) + "%" : "0.0%";

    // 2. Aggregate by Channel
    const channelNames = config?.channels || ["咨询一部", "咨询二部", "网络运营", "品牌渠道", "新媒体", "代理合作", "老生转介绍"];
    const channelStats = channelNames.map((name: string, idx: number) => ({
      name,
      target: 0,
      actual: 0
    }));

    let totalOtherActual = 0;
    sortedRows.forEach(r => {
      totalOtherActual += (r.other || 0);
      r.channels.forEach((ch: any, idx: number) => {
        if (idx < channelStats.length) {
          channelStats[idx].target += (ch.target || 0);
          channelStats[idx].actual += (ch.actual || 0);
        }
      });
    });

    // 3. Aggregate by Major
    const majorMap: { [key: string]: { target: number, actual: number } } = {};
    sortedRows.forEach(r => {
      const mName = r.name.trim();
      if (!mName) return;
      if (!majorMap[mName]) {
        majorMap[mName] = { target: 0, actual: 0 };
      }
      const dayTarget = r.channels.reduce((sum: number, ch: any) => sum + (ch.target || 0), 0);
      const dayActual = r.channels.reduce((sum: number, ch: any) => sum + (ch.actual || 0), 0) + (r.other || 0);
      majorMap[mName].target += dayTarget;
      majorMap[mName].actual += dayActual;
    });

    const majorStats = Object.entries(majorMap).map(([name, data]) => ({
      name,
      target: data.target,
      actual: data.actual,
      rate: data.target > 0 ? ((data.actual / data.target) * 100).toFixed(1) + "%" : "0.0%"
    })).sort((a, b) => b.actual - a.actual);

    // 4. Extract rich notes / observations
    const observations = sortedRows
      .filter(r => r.note && r.note.trim())
      .map(r => `[${r.date}] ${r.name}: ${r.note}`);

    // 5. Build daily trends timeline context
    const dailyTrend = sortedRows.map(r => {
      const target = r.channels.reduce((sum: number, ch: any) => sum + (ch.target || 0), 0);
      const actual = r.channels.reduce((sum: number, ch: any) => sum + (ch.actual || 0), 0) + (r.other || 0);
      return `${r.date} (${r.name}): 实际 ${actual} 人, 计划 ${target} 人`;
    });

    // Build prompt for Gemini
    const systemInstruction = `你是一位专业、资深的招生与学校运营数据分析专家，擅长撰写高水平的、适合呈给校领导和管理层传阅的“月度招生数据深度分析及运营优化建议”报告。
请根据用户提供的月度招生明细、渠道贡献、专业热度及每日备注信息，自动进行多维度的数据洞察与趋势研判，并生成一份格式精美、排版考究、重点突出的 **Markdown 格式报告**。

由于这份报告最终将呈现为 PDF 打印预览格式，请特别注重 Markdown 排版的专业度，格式要求：
1. **统一的高级视觉风格**：标题使用规范的多级标题标记（# 标题, ## 子标题, ### 段落标题），使用分割线 (---) 划分报告板块。
2. **重点突出**：重要数据（如人数、百分比、核心结论）使用 **加粗** 或 \`行内代码\` 框起以凸显专业感。
3. **数据图表/列表表达**：在“渠道效能”或“专业热度”中，充分利用 Markdown 表格 (Table) 呈现数据对比，避免大段纯文本堆砌。
4. **语言风格**：沉稳、深邃、极其专业。多使用结构化句式（如“从趋势演变来看...”、“值得关注的异常是...”、“针对下一阶段的运营方向，建议如下...”）。
5. **结构规范**：请严格按照以下几个板块进行扩写分析：
   - 📊 **月度招生大局观 (Admissions Executive Summary)**：对本月的总体指标完成率进行评述，指出核心成就。
   - 📈 **招生时序趋势及波动分析 (Timeline & Daily Registration Trends)**：对每日报到人数的波动规律、高峰低谷期进行解读，并结合备注里的异常事件（如网络异常、节假日等）说明背后的原因。
   - 🎯 **多渠道效能透视 (Multi-Channel Performance & Efficiency Analysis)**：通过数据表格比较 7 个渠道的完成进度，分析各渠道的贡献占比与瓶颈所在。
   - 🎓 **各专业报到热度分析 (Academic Major Demand Insights)**：总结哪些专业是“吸生大户”、哪些冷门，以及完成进度表现。
   - 🚀 **下一阶段精细化运营建议 (Strategic Operational Action Items)**：基于上述漏洞与优势，提出 3-4 条高度可落地、可执行的具体运营改进动作（如渠道预算调整、特定专业主攻、特殊时段应对等）。`;

    const prompt = `表格标题: ${config?.title || "招生工作报表"}
分析时间范围: 本本月历史登记日期范围

1. 【总体概况】
   - 总招生目标计划数: ${totalTarget} 人
   - 总实际完成报到数: ${totalActual} 人 (含其他渠道)
   - 整体指标达成率: ${overallRate}

2. 【渠道招生统计】
${channelStats.map(c => `   - ${c.name}: 实际报到 ${c.actual} 人 (计划目标 ${c.target} 人, 完成率: ${c.target > 0 ? ((c.actual / c.target) * 100).toFixed(1) + "%" : "0.0%"})`).join("\n")}
   - 其他渠道实际报到: ${totalOtherActual} 人

3. 【主要专业报到排行】
${majorStats.slice(0, 8).map((m, idx) => `   ${idx + 1}. ${m.name}: 实际完成 ${m.actual} 人, 目标数 ${m.target} 人, 达成率 ${m.rate}`).join("\n")}

4. 【招生工作重要事件及备注 (从明细中提取)】
${observations.length > 0 ? observations.map(o => `   - ${o}`).join("\n") : "   - 暂无特殊异常备注记录"}

5. 【每日招生波动轨迹】
${dailyTrend.slice(0, 31).map(t => `   - ${t}`).join("\n")}
`;

    const response = await generateWithModelFallback({
      preferredModel: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2, // Low temperature for consistent, analytical output
      },
    });

    const analysis = response.text;
    if (!analysis) {
      return res.status(500).json({ error: "No trend analysis generated from Gemini." });
    }

    return res.json({ analysis });
  } catch (error: any) {
    console.error("Gemini Analyze Trends Error:", error);
    return res.status(500).json({ error: error.message || "Failed to analyze enrollment trends." });
  }
});

// Diagnose Channel Variance (Delta > 10%) Endpoint
app.post("/api/diagnose-channel-delta", async (req, res) => {
  try {
    const { majorA, majorB, channelName, date } = req.body;
    if (!majorA || !majorB || !channelName) {
      return res.status(400).json({ error: "Missing required parameters (majorA, majorB, channelName)" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in environment secrets.",
      });
    }

    const systemInstruction = `你是一位专业且高水平的高校及职业教育招生运营精细化诊断专家。
请根据用户提供的两个对比专业在【${channelName}】特定招生渠道的计划目标、实际报到人数及完成率极差（差异超过10%），运用数据驱动的归因模型，撰写一份深度而富有实用价值的【智能渠道胜负与差异归因诊断报告】。

诊断报告要求：
1. **对比总结 (Executive Summary)**：
   - 用精炼的一句话点出两专业在该渠道的胜负悬殊现状（例如：“【${majorA.name}】在此渠道表现显著强势，完成率高出 ${Math.abs(majorA.channelRate - majorB.channelRate).toFixed(1)}%”）。
2. **三维归因分析 (Root Cause Diagnosis)**：
   - 🎯 **生源画像与渠道契合度 (Target Demographic Alignment)**：分析这两个专业所对应的目标学子/家长在【${channelName}】这个渠道上的受众匹配度与心理偏好。
   - ⚡ **转化链路与触达痛点 (Conversion & Engagement Drivers)**：从咨询话术、内容吸引力或渠道资源投放力度切入，解释领先专业为何转化率高，或落后专业在此遇到的瓶颈。
   - 🚀 **宣介卖点与吸引力差异 (Value Proposition)**：分析该专业在该渠道上的核心特色（如薪资就业、技术热门度、师资/实训条件）是否被有效释放。
3. **针对性优化策略 (Strategic Recommendations)**：
   - 针对落后专业，提出 2 条极速改进与追赶的操作建议。
   - 针对优势专业，提出 1 条经验萃取与跨专业复制的方法。

排版格式：使用清晰优雅的 Markdown 格式，搭配丰富的 Emoji 图标 (🎯, ⚡, 💡, 📈, 🚀) 以及粗体强调，保持干练严谨，切中要害，字数在 350-500 字之间。`;

    const prompt = `评估日期：${date || "最新数据"}
评估渠道：${channelName}

【专业 A】: ${majorA.name}
- 渠道计划数: ${majorA.channelTarget} 人
- 渠道实际完成: ${majorA.channelActual} 人
- 渠道达成率: ${majorA.channelRate.toFixed(1)}%
- 该专业全渠道总计划: ${majorA.totalTarget} 人，全渠道总完成率: ${majorA.totalRate.toFixed(1)}%

【专业 B】: ${majorB.name}
- 渠道计划数: ${majorB.channelTarget} 人
- 渠道实际完成: ${majorB.channelActual} 人
- 渠道达成率: ${majorB.channelRate.toFixed(1)}%
- 该专业全渠道总计划: ${majorB.totalTarget} 人，全渠道总完成率: ${majorB.totalRate.toFixed(1)}%

渠道完成率极差: ${Math.abs(majorA.channelRate - majorB.channelRate).toFixed(1)}%
领先方: ${majorA.channelRate > majorB.channelRate ? majorA.name : majorB.name}

请深度诊断两专业在此渠道极差超过10%的根本原因，并给出具体调优策略。`;

    const response = await generateWithModelFallback({
      preferredModel: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    const diagnosis = response.text;
    if (!diagnosis) {
      return res.status(500).json({ error: "No diagnosis text generated from Gemini." });
    }

    return res.json({ diagnosis });
  } catch (error: any) {
    console.error("Gemini Diagnose Delta Error:", error);
    return res.status(500).json({ error: error.message || "Failed to diagnose channel delta." });
  }
});

// Vite middleware setup for development, or static file serving for production
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
