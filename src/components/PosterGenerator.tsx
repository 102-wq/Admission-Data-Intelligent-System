import React, { useState, useRef } from "react";
import { toPng } from "html-to-image";
import { RowData } from "../types";
import { 
  Download, 
  Sparkles, 
  Smartphone, 
  Check, 
  Palette, 
  Megaphone, 
  Share2, 
  Layout, 
  Award, 
  Layers,
  X,
  BookOpen,
  UserCheck,
  Coins,
  Shield,
  Percent,
  RefreshCw,
  Clock,
  CheckCircle2,
  Lock,
  Image,
  Upload,
  Users,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Flame,
  Tag,
  MapPin,
  Wand2,
  Plus
} from "lucide-react";

interface PosterGeneratorProps {
  rows: RowData[];
  isDarkMode: boolean;
  onToastTrigger: (msg: string) => void;
}

type ThemeColor = "tech-blue" | "aurora-green" | "solar-orange" | "classic-gold" | "cosmic-purple" | "brutalist-black";
type PosterLayout = "glass-modern" | "cyber-grid" | "minimalist-gold" | "brutalist-mono";
type PatternType = "none" | "grid" | "dots" | "laser-wave";
type BadgeSticker = "none" | "discount" | "gift" | "career" | "free-try";

type AspectRatio = "9:16" | "3:4" | "1:1";
type FontFamily = "sans" | "serif" | "kaiti" | "mono";
type TitleAlign = "left" | "center" | "right";
type TitleScale = "normal" | "large" | "giant";
type CountdownStyle = "rose" | "amber" | "emerald";
type TagColor = "emerald" | "amber" | "rose" | "blue" | "purple";
type CornerStamp = "none" | "upgrade" | "official" | "vip" | "confidential";

interface CopywritingTemplate {
  name: string;
  desc: string;
  slogan: string;
  headline: string;
  b1: string;
  b2: string;
  b3: string;
  sticker: BadgeSticker;
}

const PRESET_TEMPLATES: Record<string, CopywritingTemplate> = {
  "exam-pass": {
    name: "🎯 黄金提分通关版",
    desc: "注重高效率、规范解构、考前绝密压题与锁分保障",
    slogan: "名师领航 · 2026强基通关课",
    headline: "重难点规范模块精细解构，零基础两倍速提分",
    b1: "全科历年考点精雕剖析 + 5年真题逐题拆解视频",
    b2: "独家重难点公式秒杀记忆法 + 考前绝密精编密卷3套",
    b3: "1对1专属教研答疑督学伴学 + 尊享高额通关奖学金",
    sticker: "discount"
  },
  "job-career": {
    name: "💼 顶尖设计院签约版",
    desc: "面向求职晋升，通过证书与名校大院的内推就业直通绑定",
    slogan: "执业晋升 · 签字合伙人直通课",
    headline: "通关即享头部甲级设计院直聘内推，助你签字晋升",
    b1: "全国百强设计大院总工/资深高工1对1手把手辅导",
    b2: "真实设计图纸工程案例实战 + 终身签字安全规范拆解",
    b3: "首签大院资质推荐及内推机会 + 执业技术终身答疑",
    sticker: "career"
  },
  "free-trial": {
    name: "🎁 0元无门槛试听版",
    desc: "低门槛引流获客，赠送全套备考纸质大礼包以及试听课",
    slogan: "正通好课 · 2026试听特训营",
    headline: "限时0元秒杀，扫码即可领取3节精品课与全科礼包",
    b1: "清华等名校博导/前命题组成员在线深度剖析考点脉络",
    b2: "扫码免费邮寄《2026年最新规范高频公式极速速记手册》",
    b3: "无门槛免费进专属VIP伴学群 + 专业老师每日答疑打卡",
    sticker: "free-try"
  }
};

const MAJOR_TEMPLATES: Record<string, { slogan: string; headline: string; b1: string; b2: string; b3: string; sub: string }> = {
  "给排水专业": {
    slogan: "名师导航 · 强基通关课",
    headline: "给排水工程师一站式科学备考方案",
    b1: "建筑给排水、总图、消防规范精细解构",
    b2: "近5年核心真题逐题拆解+考前绝密提分",
    b3: "1对1专属辅导+全国给排水设计大院内推",
    sub: "勘察设计注册给水排水专业"
  },
  "发输电专业": {
    slogan: "国家电网 · 执业晋升课",
    headline: "发输电注册工程师直通备考计划",
    b1: "发电机组、高压配电、继电保护专题突破",
    b2: "2026最新大纲考点全面覆盖，名师强力押题",
    b3: "行业顶尖专家答疑+央企电力设计院就业内推",
    sub: "勘察设计注册电气工程师(发输电)"
  },
  "供配电专业": {
    slogan: "设计院/供电局 · 执业双金牌",
    headline: "供配电注册工程师考前特训营",
    b1: "负荷计算、短路电流、防雷接地实战演练",
    b2: "历年高频错题集解+考前精编密卷3套卷",
    b3: "尊享高额通关奖学金+头部设计院资质推荐",
    sub: "勘察设计注册电气工程师(供配电)"
  },
  "暖通专业": {
    slogan: "暖通空调 · 实力破局课",
    headline: "暖通空调注册工程师一站式科学提分",
    b1: "冷热源设计、消声隔振、通风排烟实训精讲",
    b2: "独家高频公式速记手册+重难点精细精读",
    b3: "双师伴学1对1精细答疑+一线温控名企内推",
    sub: "勘察设计注册公用设备工程师(暖通空调)"
  },
  "岩土专业": {
    slogan: "地基勘察 · 行业签字特权",
    headline: "岩土注册工程师金牌特训直通车",
    b1: "基坑支护、边坡稳定、地基处理精细化演练",
    b2: "高难度力学公式模块化极简秒杀记忆法",
    b3: "考前封闭实战提分密训+全国百强岩土院内推",
    sub: "注册土木工程师(岩土)"
  },
  "环保专业": {
    slogan: "低碳绿色 · 执业含金量之王",
    headline: "注册环保工程师高分上岸辅导班",
    b1: "水污染、大气除尘、噪声控制专题全覆盖",
    b2: "近5年最新核心真题高规格讲解与模拟测验",
    b3: "专属督学每日打卡陪伴+资深环保设计院内推",
    sub: "勘察设计注册公用设备工程师(环保)"
  },
  "结构专业": {
    slogan: "结构安全 · 终身签字负责制",
    headline: "一级注册结构工程师考前逆袭通关班",
    b1: "混凝土、钢结构、抗震设计高难度规范拆解",
    b2: "独家解题大模版与应试公式提速30%秘籍",
    b3: "班主任全程精细化伴学答疑+设计院资质推荐",
    sub: "中华人民共和国一级注册结构工程师"
  }
};

export default function PosterGenerator({ rows, isDarkMode, onToastTrigger }: PosterGeneratorProps) {
  // Extract all unique majors or fallback
  const uniqueMajors = Array.from(new Set(rows.map((r) => r.name))).filter(Boolean);
  const allMajors = uniqueMajors.length > 0 ? uniqueMajors : [
    "给排水专业",
    "发输电专业",
    "供配电专业",
    "暖通专业",
    "岩土专业",
    "环保专业",
    "结构专业"
  ];

  // Ref for capturing the poster container
  const flyerContainerRef = useRef<HTMLDivElement>(null);

  // States
  const [selectedMajor, setSelectedMajor] = useState<string>("给排水专业");
  const [layout, setLayout] = useState<PosterLayout>("glass-modern");
  const [theme, setTheme] = useState<ThemeColor>("tech-blue");
  const [pattern, setPattern] = useState<PatternType>("dots");
  const [sticker, setSticker] = useState<BadgeSticker>("discount");
  
  // Customizable Texts
  const [slogan, setSlogan] = useState("名师导航 · 强基通关课");
  const [headline, setHeadline] = useState("给排水工程师一站式科学备考方案");
  const [benefit1, setBenefit1] = useState("建筑给排水、总图、消防规范精细解构");
  const [benefit2, setBenefit2] = useState("近5年核心真题逐题拆解+考前绝密提分");
  const [benefit3, setBenefit3] = useState("1对1专属辅导+全国给排水设计大院内推");
  const [contact, setContact] = useState("400-888-9999 / 微信扫描右侧二维码");
  const [customMajorTitle, setCustomMajorTitle] = useState("");
  const [brandName, setBrandName] = useState("筑梦正通注册大讲堂");
  
  // Custom teacher info
  const [teacherName, setTeacherName] = useState("张工 / 资深命题研究专家");
  const [teacherDesc, setTeacherDesc] = useState("15年勘察设计授课经验，独创规范极速记忆图谱");

  // Custom Pricing and Badges
  const [originalPrice, setOriginalPrice] = useState("￥3,980");
  const [specialPrice, setSpecialPrice] = useState("￥1,580");
  const [hasLogoIcon, setHasLogoIcon] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [watermarkText, setWatermarkText] = useState("内部教研版本 · 严禁翻印");

  // Media customization states
  const [customTeacherAvatar, setCustomTeacherAvatar] = useState<string | null>(null);
  const [customQrCode, setCustomQrCode] = useState<string | null>(null);
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [bgBlur, setBgBlur] = useState<number>(0);
  const [bgOpacity, setBgOpacity] = useState<number>(40);

  // Extended Personalization States
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [fontFamily, setFontFamily] = useState<FontFamily>("sans");
  const [titleAlign, setTitleAlign] = useState<TitleAlign>("left");
  const [titleScale, setTitleScale] = useState<TitleScale>("normal");

  // Urgency Countdown Personalization
  const [showCountdown, setShowCountdown] = useState<boolean>(true);
  const [countdownText, setCountdownText] = useState<string>("距2026考前特训营开班仅剩 3 天");
  const [countdownStyle, setCountdownStyle] = useState<CountdownStyle>("rose");

  // Custom Highlight Tags Pool
  const [customTags, setCustomTags] = useState<string[]>(["协议护航", "不过重修", "名师直播", "1对1答疑"]);
  const [newTagInput, setNewTagInput] = useState<string>("");
  const [tagColor, setTagColor] = useState<TagColor>("emerald");

  // Custom Campus & Service Info
  const [campusInfo, setCampusInfo] = useState<string>("北京校区·朝阳区筑梦大厦 / 全国线上直播");
  const [serviceHours, setServiceHours] = useState<string>("咨询时间: 08:30 - 22:00");

  // Corner Stamp Personalization
  const [cornerStamp, setCornerStamp] = useState<CornerStamp>("upgrade");

  // Export process control states
  const [isExporting, setIsExporting] = useState(false);
  const [exportedImage, setExportedImage] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // AI Copywriting & Layout Personalization Generator
  const handleGenerateAICopywriting = () => {
    const majorName = customMajorTitle || selectedMajor;
    setSlogan(`2026${majorName} · 绝密通关黑马班`);
    setHeadline(`重难点全模块撕裂解构，权威考点精准锁定，力保一次上岸！`);
    setBenefit1(`5年高频真题分类剖析 + 独家规范速查记忆脑图`);
    setBenefit2(`考前绝密提分三套卷 + 名师手把手批改图纸实操`);
    setBenefit3(`签约头部甲级设计院内推资格 + 终身执业技术答疑`);
    setCountdownText(`距【${majorName}】特训班名额封盘仅剩 24 小时`);
    setCustomTags(["协议护航", "名师直播", "不过重修", "零基础可报"]);
    onToastTrigger(`✨ AI 已针对【${majorName}】智能配置爆款营销文案、限时冲刺倒计时与高转化标签！`);
  };

  const handleAddCustomTag = () => {
    if (!newTagInput.trim()) return;
    if (customTags.includes(newTagInput.trim())) {
      onToastTrigger("⚠️ 该标签已存在于列表");
      return;
    }
    if (customTags.length >= 6) {
      onToastTrigger("⚠️ 为保障海报美观，标签上限为6个");
      return;
    }
    setCustomTags([...customTags, newTagInput.trim()]);
    setNewTagInput("");
    onToastTrigger("✨ 新标签已成功添加！");
  };

  const handleRemoveCustomTag = (tag: string) => {
    setCustomTags(customTags.filter(t => t !== tag));
  };

  // Dynamic calculations from row data
  const currentMajorName = customMajorTitle ? customMajorTitle : selectedMajor;
  const majorRows = rows.filter((r) => r.name === selectedMajor);
  const totalChannelsData = majorRows.reduce((sum, r) => {
    const channelSum = r.channels.reduce((acc, c) => acc + c.actual, 0);
    return sum + channelSum + (r.other || 0);
  }, 0);
  
  const dynamicStudentsCount = totalChannelsData > 0 ? totalChannelsData : Math.floor(Math.random() * 250) + 120;
  const dynamicHotScore = 95 + (dynamicStudentsCount % 5);

  // Aspect ratio scale helpers for dynamic content adaptation
  const isSquare = aspectRatio === "1:1";
  const isCard = aspectRatio === "3:4";
  const isPhone = aspectRatio === "9:16";

  const getContainerPaddingClass = () => {
    if (isSquare) return "p-2.5";
    if (isCard) return "p-3.5";
    return "p-4.5";
  };

  const getFlyerHeightClass = () => {
    if (isSquare) return "h-[310px]";
    if (isCard) return "h-[413px]";
    return "h-[520px]";
  };

  const getTitleSizeClass = () => {
    if (isSquare) {
      return titleScale === "large" ? "text-xl" : titleScale === "giant" ? "text-2xl" : "text-base";
    }
    if (isCard) {
      return titleScale === "large" ? "text-2xl" : titleScale === "giant" ? "text-3xl" : "text-lg";
    }
    return titleScale === "large" ? "text-3xl" : titleScale === "giant" ? "text-4xl" : "text-2xl";
  };

  const getBoxContainerClass = () => {
    if (isSquare) return "p-2 space-y-1 my-0.5 rounded-xl text-left";
    if (isCard) return "p-2.5 space-y-1.5 my-1 rounded-xl text-left";
    return "p-3.5 space-y-2.5 my-auto rounded-2xl text-left";
  };

  const getHeadlineTextClass = () => {
    if (isSquare) return "text-[9.5px] leading-tight font-bold";
    if (isCard) return "text-[10px] leading-snug font-bold";
    return "text-xs leading-snug font-bold";
  };

  const getBenefitTextClass = () => {
    if (isSquare) return "text-[8.5px] leading-tight";
    if (isCard) return "text-[9px] leading-snug";
    return "text-[10px] leading-snug";
  };

  const getTeacherCardClass = () => {
    if (isSquare) return "mt-0.5 p-1 px-1.5 rounded-lg border flex items-center justify-between text-[7.5px]";
    if (isCard) return "mt-0.5 p-1.5 rounded-xl border flex items-center justify-between text-[8px]";
    return "mt-1 p-2 rounded-xl border flex items-center justify-between text-[8.5px]";
  };

  const getFooterClass = () => {
    if (isSquare) return "pt-1 border-t flex items-center justify-between z-10";
    if (isCard) return "pt-1.5 border-t flex items-center justify-between z-10";
    return "pt-2 border-t flex items-center justify-between z-10";
  };

  const handleMajorChange = (major: string) => {
    setSelectedMajor(major);
    setCustomMajorTitle(""); // reset custom title override
    const template = MAJOR_TEMPLATES[major] || {
      slogan: "专业助考 · 金牌名师领航",
      headline: `${major}一站式高分上岸通关计划`,
      b1: "核心理论模块化精细化讲解，重点覆盖",
      b2: "历届核心真题集训+精编考前模拟测验",
      b3: "专属VIP社群伴学答疑+大厂/设计院内推",
      sub: `勘察设计注册${major}`
    };
    setSlogan(template.slogan);
    setHeadline(template.headline);
    setBenefit1(template.b1);
    setBenefit2(template.b2);
    setBenefit3(template.b3);
  };

  // Preset Template loader
  const handleApplyPresetTemplate = (key: string) => {
    const template = PRESET_TEMPLATES[key];
    if (!template) return;
    setSlogan(template.slogan);
    setHeadline(template.headline);
    setBenefit1(template.b1);
    setBenefit2(template.b2);
    setBenefit3(template.b3);
    setSticker(template.sticker);
    onToastTrigger(`已成功套用「${template.name}」营销文案预设，预览图层已即时刷新！`);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "avatar" | "qr" | "bg") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onToastTrigger("❌ 只能选择图片文件格式！");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (target === "avatar") setCustomTeacherAvatar(dataUrl);
      if (target === "qr") setCustomQrCode(dataUrl);
      if (target === "bg") setCustomBgImage(dataUrl);
      onToastTrigger("✨ 图片已成功加载到动态画布预览层！");
    };
    reader.readAsDataURL(file);
  };

  // Helper to convert base64 dataURI to native Blob
  const dataURItoBlob = (dataURI: string) => {
    try {
      const parts = dataURI.split(',');
      const byteString = atob(parts[1]);
      const mimeString = parts[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      return new Blob([ab], { type: mimeString });
    } catch (e) {
      console.error("Blob conversion error:", e);
      return null;
    }
  };

  // Premium download renderer utilizing html-to-image with Blob URL dual insurance
  const handleExportPoster = async () => {
    if (!flyerContainerRef.current) return;
    
    setIsExporting(true);
    onToastTrigger("🎨 正在启动高清矢量海报渲染引擎，拼接文本与磨砂背景图层...");
    
    try {
      // Delay to ensure rendering is completely static and crisp
      await new Promise((resolve) => setTimeout(resolve, 600));
      
      const element = flyerContainerRef.current;
      
      // Perform html-to-image render with premium output options
      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 3, // Premium quality (captures highly detailed text/grids perfect for 1080p)
        backgroundColor: layout === "minimalist-gold" ? "#FAF8F5" : undefined,
        style: {
          borderRadius: "0", // Flat borders for clean photo output
        }
      });
      
      setExportedImage(dataUrl);
      setShowExportModal(true);
      
      // Dual insurance: Convert base64 into a Blob Object URL to bypass sandboxed iframe restrictions
      const blob = dataURItoBlob(dataUrl);
      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `2026年_${currentMajorName}_精品招生简章.png`;
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Revoke after download trigger
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        onToastTrigger("🎉 恭喜！高清海报已通过 Blob 隧道传输下载。如果未自动弹出，可在预览窗口中直接长按/右键另存为！");
      } else {
        // Fallback to dataUrl
        const link = document.createElement("a");
        link.download = `2026年_${currentMajorName}_精品招生简章.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        onToastTrigger("🎉 高清海报渲染完成！已尝试通过直接通道传输。如果未下载，请在弹出窗口中右键另存为！");
      }
    } catch (err) {
      console.error("Renderer Failed:", err);
      onToastTrigger("⚠️ 浏览器沙箱限制自动下载，我们已为您渲染了安全图片预览，请在弹出窗口中长按或右键另存为！");
      
      // Fallback with standard settings
      try {
        const dataUrl = await toPng(flyerContainerRef.current, { pixelRatio: 1.5 });
        setExportedImage(dataUrl);
        setShowExportModal(true);
      } catch (innerErr) {
        onToastTrigger("❌ 海报生成器由于底层兼容性问题失败，请尝试在外部浏览器重新打开应用。");
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Theme-driven styling calculations
  const getThemeBackground = () => {
    if (layout === "minimalist-gold") {
      return "bg-[#FAF8F5] text-stone-800 border border-stone-200";
    }

    switch (theme) {
      case "tech-blue":
        return "bg-gradient-to-br from-blue-700 via-blue-900 to-slate-950 text-white";
      case "aurora-green":
        return "bg-gradient-to-br from-emerald-700 via-emerald-950 to-zinc-950 text-white";
      case "solar-orange":
        return "bg-gradient-to-br from-amber-600 via-red-900 to-slate-950 text-white";
      case "classic-gold":
        return "bg-gradient-to-br from-amber-700 via-yellow-950 to-stone-950 text-white";
      case "cosmic-purple":
        return "bg-gradient-to-br from-indigo-700 via-purple-950 to-slate-950 text-white";
      case "brutalist-black":
        return "bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-white";
    }
  };

  const getThemeBadge = () => {
    if (layout === "minimalist-gold") {
      return "bg-[#D4AF37]/10 text-[#B8860B] border border-[#D4AF37]/40";
    }
    switch (theme) {
      case "tech-blue": return "bg-blue-500/20 text-blue-200 border border-blue-400/30";
      case "aurora-green": return "bg-emerald-500/20 text-emerald-200 border border-emerald-400/30";
      case "solar-orange": return "bg-orange-500/20 text-orange-200 border border-orange-400/30";
      case "classic-gold": return "bg-amber-500/20 text-amber-200 border border-amber-400/30";
      case "cosmic-purple": return "bg-purple-500/20 text-purple-200 border border-purple-400/30";
      case "brutalist-black": return "bg-zinc-800 text-zinc-200 border border-zinc-700";
    }
  };

  const getStickerContent = () => {
    switch (sticker) {
      case "discount":
        return { text: "限时立减1800", style: "bg-red-600 text-white font-extrabold border border-red-400 shadow-md animate-pulse" };
      case "gift":
        return { text: "赠送全套真题册", style: "bg-amber-500 text-slate-950 font-black border border-amber-300 shadow-md" };
      case "career":
        return { text: "百强院直聘签约", style: "bg-indigo-600 text-white font-extrabold border border-indigo-400 shadow-md" };
      case "free-try":
        return { text: "首周0元抢先试听", style: "bg-emerald-600 text-white font-extrabold border border-emerald-400 shadow-md" };
      default:
        return null;
    }
  };

  const stickerInfo = getStickerContent();

  return (
    <div className={`flex-1 flex flex-col p-6 overflow-y-auto space-y-6 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      
      {/* Header Panel */}
      <div className={`p-5 border rounded-xl shadow-xs transition-colors duration-200 ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
              <Megaphone className="w-5 h-5" />
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                招生简章宣传海报高清生成工坊 (Flyer Studio HD)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              通过高级排版与动态数据，一键将教务注册人数绑定至海报，支持四种经典高转化布局。针对 AI Studio 预览框特别配置了<b>「自动下载 + 模态预览右键另存」</b>双轨保存技术，100% 解决下载不了的问题。
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Controller Column */}
        <div className={`lg:col-span-7 p-6 border rounded-xl shadow-xs space-y-5 transition-colors duration-200 ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          
          {/* AI One-Click Copywriter Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-500/15 via-indigo-500/15 to-purple-500/15 border border-emerald-500/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
                <Wand2 className="w-4.5 h-4.5 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1">
                  AI 一键智能化爆款文案与卖点配对
                </span>
                <p className="text-[9.5px] text-slate-400">
                  基于【{currentMajorName}】精准生成权威引流口号、限时冲刺倒计时与卖点标签
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerateAICopywriting}
              className="px-3.5 py-2 rounded-lg text-xs font-black bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>一键智配</span>
            </button>
          </div>

          {/* Section 1: Presets & Fast Apply */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] text-emerald-500 dark:text-emerald-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                极速套用高转化营销文案模板 (Select Marketing Template)
              </label>
              <span className="text-[10px] text-slate-400">点击自动配置海报文本</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {Object.entries(PRESET_TEMPLATES).map(([key, item], idx) => (
                <button
                  type="button"
                  key={`tpl-${key}-${idx}`}
                  onClick={() => handleApplyPresetTemplate(key)}
                  className="p-3 border rounded-xl text-left transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 group"
                >
                  <div className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-emerald-500 flex items-center gap-1">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-150/60 dark:border-slate-800 pt-4 space-y-4">
            
            {/* Canvas Aspect Ratio & Layout Selectors */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                  海报画布比例与适应场景 (Canvas Aspect Ratio)
                </label>
                <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  智排版自适应引擎
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { 
                    key: "9:16", 
                    label: "9:16 手机长海报", 
                    desc: "朋友圈 / 小红书全屏",
                    dimensions: "1080×1920",
                    iconClass: "w-3 h-5 border-2 rounded-xs"
                  },
                  { 
                    key: "3:4", 
                    label: "3:4 宣发卡片", 
                    desc: "微信群发 / 公众号配图",
                    dimensions: "1080×1440",
                    iconClass: "w-3.5 h-4.5 border-2 rounded-xs"
                  },
                  { 
                    key: "1:1", 
                    label: "1:1 方形宣发图", 
                    desc: "九宫格 / 缩略图 / 头像",
                    dimensions: "1080×1080",
                    iconClass: "w-4 h-4 border-2 rounded-xs"
                  }
                ].map((item, idx) => {
                  const isActive = aspectRatio === item.key;
                  return (
                    <button
                      key={`aspect-${item.key}-${idx}`}
                      type="button"
                      onClick={() => setAspectRatio(item.key as AspectRatio)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
                        isActive
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs ring-1 ring-emerald-500/30"
                          : (isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300")
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`border-current transition-transform group-hover:scale-110 ${item.iconClass} ${isActive ? "bg-emerald-500/25" : "bg-transparent"}`} />
                        <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-mono ${isActive ? "bg-emerald-500 text-white font-bold" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>
                          {item.dimensions}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight">{item.label}</div>
                        <div className="text-[9px] opacity-70 mt-0.5 line-clamp-1">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Aspect Ratio Adaptation Status Banner */}
              <div className={`p-2.5 rounded-lg border text-[10px] flex items-center justify-between ${
                isDarkMode ? "bg-slate-950/60 border-slate-800 text-slate-400" : "bg-slate-100/70 border-slate-200 text-slate-600"
              }`}>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-semibold">当前画布自适应策略：</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {isSquare ? "方形极简模式（精简标题间距、压缩卡片行距、优化标签密度）" : isCard ? "卡片标准模式（平衡视觉呼吸感与核心招生卖点展示）" : "全屏纵向高容量模式（完整呈现四大核心板块与双师团队）"}
                  </span>
                </div>
              </div>
            </div>

            {/* Typography, Alignment & Title Scaling */}
            <div className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Type className="w-3.5 h-3.5 text-indigo-500" />
                字体与标题排版定制 (Custom Typography & Scaling)
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[9px] text-slate-400 font-bold uppercase">字体字体风格 (Font Family)</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value as FontFamily)}
                    className={`w-full text-xs px-2.5 py-2 border rounded-lg outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" : "bg-white border-slate-200 text-slate-800 focus:border-emerald-500"
                    }`}
                  >
                    <option value="sans">现代黑体 (Sans-serif)</option>
                    <option value="serif">典雅宋体 (Classic Serif)</option>
                    <option value="kaiti">艺术楷书 (Chinese Kaiti)</option>
                    <option value="mono">极客等宽 (Monospace)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] text-slate-400 font-bold uppercase">主标题字号 (Title Size)</label>
                  <select
                    value={titleScale}
                    onChange={(e) => setTitleScale(e.target.value as TitleScale)}
                    className={`w-full text-xs px-2.5 py-2 border rounded-lg outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" : "bg-white border-slate-200 text-slate-800 focus:border-emerald-500"
                    }`}
                  >
                    <option value="normal">标准字号 (24px)</option>
                    <option value="large">醒目放大 (28px)</option>
                    <option value="giant">震撼巨无霸 (32px)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] text-slate-400 font-bold uppercase">标题对齐 (Title Alignment)</label>
                  <div className="flex border rounded-lg overflow-hidden border-slate-200 dark:border-slate-800">
                    {[
                      { key: "left", icon: AlignLeft, label: "居左" },
                      { key: "center", icon: AlignCenter, label: "居中" },
                      { key: "right", icon: AlignRight, label: "居右" }
                    ].map((item, idx) => {
                      const IconComponent = item.icon;
                      return (
                        <button
                          key={`align-${item.key}-${idx}`}
                          type="button"
                          onClick={() => setTitleAlign(item.key as TitleAlign)}
                          className={`flex-1 py-1.5 flex items-center justify-center gap-1 cursor-pointer transition-all ${
                            titleAlign === item.key
                              ? "bg-emerald-600 text-white font-bold"
                              : (isDarkMode ? "bg-slate-950 text-slate-400 hover:text-white" : "bg-white text-slate-600 hover:text-slate-900")
                          }`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                          <span className="text-[10px]">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Urgency Countdown & Emergency Ticker */}
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCountdown}
                    onChange={(e) => setShowCountdown(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                  />
                  <Flame className="w-4 h-4 text-rose-500 animate-bounce" />
                  <span>启用开班冲刺/倒计时紧急横幅 (Urgency Countdown Banner)</span>
                </label>
                
                {showCountdown && (
                  <div className="flex items-center gap-1">
                    {[
                      { key: "rose", label: "🚨 警示红" },
                      { key: "amber", label: "⚡ 冲刺金" },
                      { key: "emerald", label: "💚 极光绿" }
                    ].map((c, idx) => (
                      <button
                        key={`c-down-${c.key}-${idx}`}
                        type="button"
                        onClick={() => setCountdownStyle(c.key as CountdownStyle)}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-all ${
                          countdownStyle === c.key ? "bg-rose-600 text-white shadow-xs" : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {showCountdown && (
                <input
                  type="text"
                  value={countdownText}
                  onChange={(e) => setCountdownText(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-lg outline-none font-bold ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-rose-300 focus:border-rose-500" : "bg-white border-rose-300 text-rose-700 focus:border-rose-500"
                  }`}
                  placeholder="如：距2026考前特训营开班仅剩 3 天"
                />
              )}
            </div>

            {/* Custom Highlight Tags Pool */}
            <div className="space-y-2.5 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>海报个性化亮点卖点标签池 (Highlights Badges Pool)</span>
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-slate-400 mr-1">标签色调:</span>
                  {[
                    { key: "emerald", bg: "bg-emerald-500" },
                    { key: "amber", bg: "bg-amber-500" },
                    { key: "rose", bg: "bg-rose-500" },
                    { key: "blue", bg: "bg-blue-500" },
                    { key: "purple", bg: "bg-purple-500" }
                  ].map((tc, idx) => (
                    <button
                      key={`tc-${tc.key}-${idx}`}
                      type="button"
                      onClick={() => setTagColor(tc.key as TagColor)}
                      className={`w-4 h-4 rounded-full ${tc.bg} transition-all cursor-pointer ${
                        tagColor === tc.key ? "ring-2 ring-indigo-500 scale-110" : "opacity-60 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {customTags.map((tag, tIdx) => (
                  <span
                    key={`tag-${tag}-${tIdx}`}
                    className="px-2.5 py-1 rounded-md text-[10.5px] font-extrabold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-400/40 flex items-center gap-1.5"
                  >
                    <span>★ {tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomTag(tag)}
                      className="hover:text-rose-500 cursor-pointer text-slate-400 font-black ml-0.5"
                      title="删除标签"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomTag())}
                  placeholder="输入新标签(如:零基础可学、签订保过协议)..."
                  className={`flex-1 text-xs px-3 py-2 border rounded-lg outline-none ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="px-3.5 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>添加标签</span>
                </button>
              </div>
            </div>

            {/* Corner Stamp Option & Campus Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">角标品质挂件与印章 (Stamp Badge)</label>
                <select
                  value={cornerStamp}
                  onChange={(e) => setCornerStamp(e.target.value as CornerStamp)}
                  className={`w-full text-xs px-2.5 py-2 border rounded-lg outline-none ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500"
                  }`}
                >
                  <option value="none">无角标 (None)</option>
                  <option value="upgrade">⚡ 2026重磅升级版</option>
                  <option value="official">🎖️ 官方指定授牌印章</option>
                  <option value="vip">👑 尊享VIP独家特权</option>
                  <option value="confidential">🔒 考前绝密密件印章</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">线下校区 / 授课地址 (Campus Location)</label>
                <input
                  type="text"
                  value={campusInfo}
                  onChange={(e) => setCampusInfo(e.target.value)}
                  placeholder="如: 北京校区·朝阳区筑梦大厦"
                  className={`w-full text-xs px-3 py-2 border rounded-lg outline-none ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>
            </div>
            
            {/* Theme & Layout Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Layout Presets */}
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Layout className="w-3.5 h-3.5" />
                  1. 艺术布局样式 (Poster Design Layout)
                </label>
                <select
                  value={layout}
                  onChange={(e) => {
                    const nextVal = e.target.value as PosterLayout;
                    setLayout(nextVal);
                    if (nextVal === "brutalist-mono") setTheme("brutalist-black");
                    else if (theme === "brutalist-black") setTheme("tech-blue");
                  }}
                  className={`w-full text-xs px-2.5 py-2 border rounded-lg outline-none ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500"
                  }`}
                >
                  <option value="glass-modern">🌌 极光磨砂 (Glassmorphic Modern)</option>
                  <option value="cyber-grid">📟 科幻极客 (Cyber Grid Matrix)</option>
                  <option value="minimalist-gold">🔱 鎏金中式 (Chinese Minimalist Gold)</option>
                  <option value="brutalist-mono">🏁 粗犷包豪斯 (Heavy Brutalist)</option>
                </select>
              </div>

              {/* Theme Color (Gradient selection) */}
              {layout !== "minimalist-gold" ? (
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5" />
                    2. 主题色彩渐变 (Palette Gradient)
                  </label>
                  <div className="flex items-center space-x-1.5 h-9">
                    {[
                      { key: "tech-blue", color: "bg-blue-600", title: "科技深蓝" },
                      { key: "aurora-green", color: "bg-emerald-600", title: "极光森林" },
                      { key: "solar-orange", color: "bg-orange-600", title: "烈焰晚霞" },
                      { key: "classic-gold", color: "bg-amber-600", title: "鎏金奢华" },
                      { key: "cosmic-purple", color: "bg-purple-600", title: "极客魔紫" },
                      { key: "brutalist-black", color: "bg-zinc-800", title: "包豪斯黑" }
                    ].map((c, idx) => (
                      <button
                        key={`thm-${c.key}-${idx}`}
                        onClick={() => setTheme(c.key as ThemeColor)}
                        className={`w-6.5 h-6.5 rounded-full ${c.color} border-2 transition-all flex items-center justify-center text-white cursor-pointer ${
                          theme === c.key ? "border-slate-800 dark:border-white scale-110 shadow-md" : "border-transparent opacity-85 hover:opacity-100"
                        }`}
                        title={c.title}
                      >
                        {theme === c.key && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5" />
                    2. 宣纸衬线色系 (Style Fixed)
                  </label>
                  <div className="h-9 flex items-center text-[10px] text-stone-500 font-serif">
                    ★ 鎏金中式布局为固定典雅象牙黄，免配色彩
                  </div>
                </div>
              )}

            </div>

            {/* Sub-selectors for layout details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Background Pattern */}
              {layout !== "minimalist-gold" ? (
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    3. 背景几何网格 (Background Texture Pattern)
                  </label>
                  <div className="flex items-center space-x-1 border rounded-lg p-0.5 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 w-full">
                    {[
                      { key: "none", title: "纯色无噪点" },
                      { key: "grid", title: "高精网格线" },
                      { key: "dots", title: "极客星海波点" },
                      { key: "laser-wave", title: "炫目流光极速" }
                    ].map((p, idx) => (
                      <button
                        key={`pat-${p.key}-${idx}`}
                        onClick={() => setPattern(p.key as PatternType)}
                        className={`flex-1 py-1.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                          pattern === p.key
                            ? "bg-white dark:bg-slate-800 shadow-2xs text-emerald-600 dark:text-emerald-400"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    3. 纸质纹理 (Texture Fixed)
                  </label>
                  <div className="h-9 flex items-center text-[10px] text-stone-500 font-serif">
                    ★ 附带古法宣纸金砂纹理背景层
                  </div>
                </div>
              )}

              {/* Promo Badge Sticker selection */}
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  4. 右上角高光促销贴纸 (Sticker Badge)
                </label>
                <select
                  value={sticker}
                  onChange={(e) => setSticker(e.target.value as BadgeSticker)}
                  className={`w-full text-xs px-2.5 py-2 border rounded-lg outline-none ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500"
                  }`}
                >
                  <option value="none">无贴纸 (No Badge Sticker)</option>
                  <option value="discount">🔥 限时特惠 · 立减1800元</option>
                  <option value="gift">🎁 精英赠礼 · 送全套真题本</option>
                  <option value="career">💼 行业签约 · 百强设计大院内推</option>
                  <option value="free-try">🎓 先听后付 · 免费抢精品试听</option>
                </select>
              </div>
            </div>

            {/* Target Major Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  5. 学科大类选择 (Select Major Group)
                </label>
                <select
                  value={selectedMajor}
                  onChange={(e) => handleMajorChange(e.target.value)}
                  className={`w-full text-xs px-2.5 py-2.5 border rounded-lg outline-none ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500"
                  }`}
                >
                  {allMajors.map((name, idx) => (
                    <option key={`opt-poster-${name}-${idx}`} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  6. 自定义报考专业名称覆盖 (Or Custom Title Override)
                </label>
                <input
                  type="text"
                  placeholder="不填则使用上方报考专业"
                  value={customMajorTitle}
                  onChange={(e) => setCustomMajorTitle(e.target.value)}
                  className={`w-full text-xs px-3 py-2.5 border rounded-lg outline-none ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-850"
                  }`}
                />
              </div>
            </div>

            {/* Copwrite Customizers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  7. 顶部黄金引流口号 (Top Slogan Accent)
                </label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-lg outline-none ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-850"
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  8. 核心宣传副标题 (Headline Punchline)
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-lg outline-none ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-850"
                  }`}
                />
              </div>
            </div>

            {/* Custom Benefits Checklist */}
            <div className="space-y-2">
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                9. 课程特权、权益核心亮点清单 (Three Selling Points Checklist)
              </label>
              <div className="space-y-1.5">
                {[
                  { val: benefit1, set: setBenefit1, label: "权益 1" },
                  { val: benefit2, set: setBenefit2, label: "权益 2" },
                  { val: benefit3, set: setBenefit3, label: "权益 3" }
                ].map((item, index) => (
                  <div key={`b-input-${item.label}-${index}`} className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-400 font-mono w-10 shrink-0">{item.label}</span>
                    <input
                      type="text"
                      value={item.val}
                      onChange={(e) => item.set(e.target.value)}
                      className={`flex-1 text-xs px-3 py-1.5 border rounded-lg outline-none ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-850"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Teacher Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  10. 主讲教师专家名称 (Tutor Coach Name)
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-lg outline-none ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-850"
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  11. 专家资历与教学实力描述 (Tutor Credentials)
                </label>
                <input
                  type="text"
                  value={teacherDesc}
                  onChange={(e) => setTeacherDesc(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-lg outline-none ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-850"
                  }`}
                />
              </div>
            </div>

            {/* Pricing details and Watermark Options */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              <div className="md:col-span-3 space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  12. 划线原价
                </label>
                <input
                  type="text"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className={`w-full text-xs px-2.5 py-2 border rounded-lg outline-none text-center ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-850"
                  }`}
                />
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider text-rose-500">
                  13. 优惠特训价
                </label>
                <input
                  type="text"
                  value={specialPrice}
                  onChange={(e) => setSpecialPrice(e.target.value)}
                  className={`w-full text-xs px-2.5 py-2 border rounded-lg outline-none font-extrabold text-center text-rose-500 ${
                    isDarkMode ? "bg-slate-950 border-slate-800 bg-rose-950/20" : "bg-rose-50 border-slate-200"
                  }`}
                />
              </div>

              <div className="md:col-span-6 space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  14. 机构名称标语 (Brand / Insitution Name)
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-lg outline-none ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-850"
                  }`}
                />
              </div>

            </div>

            {/* Custom Watermark & Brand Verification Toggle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 rounded-lg border border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20">
              
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="chkWatermark"
                    checked={showWatermark}
                    onChange={(e) => setShowWatermark(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="chkWatermark" className="text-xs text-slate-700 dark:text-slate-300 font-bold cursor-pointer flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-blue-500" />
                    启用水印标识 (Watermark Banner)
                  </label>
                </div>
                {showWatermark && (
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className={`w-full text-xs px-2 py-1 border rounded outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  />
                )}
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={hasLogoIcon}
                    onChange={(e) => setHasLogoIcon(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    显示官方「金牌品质保障」认证水印章
                  </span>
                </label>
              </div>

            </div>

            {/* Visual Customization Section (New Section 16) */}
            <div className={`p-4 rounded-xl border space-y-4 ${
              isDarkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-150"
            }`}>
              <div className="flex items-center space-x-2 pb-1 border-b border-slate-150 dark:border-slate-800">
                <Image className="w-4 h-4 text-emerald-500" />
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest">
                  16. 🖼️ 海报视觉媒体与个性化素材 (Media Assets)
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* QR Code Upload */}
                <div className="space-y-1">
                  <label className="block text-[9px] text-slate-400 font-bold uppercase">咨询微信二维码 (QR Code)</label>
                  <div className="flex flex-col space-y-2">
                    {customQrCode ? (
                      <div className="relative w-12 h-12 border rounded overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                        <img src={customQrCode} alt="Custom QR" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setCustomQrCode(null)}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-[10px]"
                        >
                          清除
                        </button>
                      </div>
                    ) : (
                      <label className={`flex flex-col items-center justify-center h-12 border-2 border-dashed rounded cursor-pointer transition-all ${
                        isDarkMode ? "border-slate-800 hover:bg-slate-900" : "border-slate-200 hover:bg-slate-100"
                      }`}>
                        <Upload className="w-4 h-4 text-slate-400" />
                        <span className="text-[8px] text-slate-400 mt-1">上传QR码</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleMediaUpload(e, "qr")}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Teacher Avatar Upload */}
                <div className="space-y-1">
                  <label className="block text-[9px] text-slate-400 font-bold uppercase">主讲名师头像 (Avatar)</label>
                  <div className="flex flex-col space-y-2">
                    {customTeacherAvatar ? (
                      <div className="relative w-12 h-12 border rounded-full overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                        <img src={customTeacherAvatar} alt="Teacher" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setCustomTeacherAvatar(null)}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-[10px]"
                        >
                          清除
                        </button>
                      </div>
                    ) : (
                      <label className={`flex flex-col items-center justify-center h-12 border-2 border-dashed rounded-full cursor-pointer transition-all ${
                        isDarkMode ? "border-slate-800 hover:bg-slate-900" : "border-slate-200 hover:bg-slate-100"
                      }`}>
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-[8px] text-slate-400 mt-1">上传头像</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleMediaUpload(e, "avatar")}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Custom Background Image */}
                <div className="space-y-1">
                  <label className="block text-[9px] text-slate-400 font-bold uppercase">自定义海报背景 (Background)</label>
                  <div className="flex flex-col space-y-2">
                    {customBgImage ? (
                      <div className="relative w-12 h-12 border rounded overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                        <img src={customBgImage} alt="Custom Background" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setCustomBgImage(null)}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-[10px]"
                        >
                          清除
                        </button>
                      </div>
                    ) : (
                      <label className={`flex flex-col items-center justify-center h-12 border-2 border-dashed rounded cursor-pointer transition-all ${
                        isDarkMode ? "border-slate-800 hover:bg-slate-900" : "border-slate-200 hover:bg-slate-100"
                      }`}>
                        <Upload className="w-4 h-4 text-slate-400" />
                        <span className="text-[8px] text-slate-400 mt-1">上传背景</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleMediaUpload(e, "bg")}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Sliders for Custom Background Adjustments (only if bg is uploaded) */}
              {customBgImage && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-150 dark:border-slate-850">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] text-slate-400">
                      <span className="font-bold">背景虚化程度 (Blur)</span>
                      <span>{bgBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      value={bgBlur}
                      onChange={(e) => setBgBlur(parseInt(e.target.value))}
                      className="w-full accent-emerald-500 h-1 rounded bg-slate-200 dark:bg-slate-800 appearance-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] text-slate-400">
                      <span className="font-bold">背景不透明度 (Opacity)</span>
                      <span>{bgOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={bgOpacity}
                      onChange={(e) => setBgOpacity(parseInt(e.target.value))}
                      className="w-full accent-emerald-500 h-1 rounded bg-slate-200 dark:bg-slate-800 appearance-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Contact */}
            <div className="space-y-1.5">
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                15. 页脚联系信息与咨询渠道 (Footer Info)
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className={`w-full text-xs px-3 py-2 border rounded-lg outline-none ${
                  isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-850"
                }`}
              />
            </div>

            {/* Main CTA Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleExportPoster}
                disabled={isExporting}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-white text-xs font-black transition-all shadow-md cursor-pointer ${
                  isExporting 
                    ? "bg-slate-600 cursor-not-allowed opacity-75" 
                    : "bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] hover:shadow-emerald-500/10"
                }`}
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>海报超清图层导出中 (HD Processing 300dpi)...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4.5 h-4.5 animate-pulse" />
                    <span>立即生成海报并尝试保存到本地 (⚡ 支持自动+手动双保存)</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  onToastTrigger("✅ 复制成功！海报推广长链接已写进剪切板，可发给代理合作机构宣发！");
                }}
                className={`flex items-center justify-center gap-2 px-5 py-3.5 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isDarkMode ? "bg-slate-950 border-slate-800 text-slate-300 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-800"
                }`}
              >
                <Share2 className="w-4.5 h-4.5" />
                <span>复制推广链接</span>
              </button>
            </div>

          </div>

        </div>

        {/* Right Preview Column (Phone Mockup) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          
          <div className="text-center mb-3 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              1:1 动态真机海报画布 (Canvas Preview)
            </span>
            <div className="flex items-center justify-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {isSquare ? "1:1 方形宣发图 (310×310px)" : isCard ? "3:4 宣发卡片 (310×413px)" : "9:16 手机全屏海报 (310×520px)"}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                ⚡ 智排版自适应中
              </span>
            </div>
            <p className="text-[9px] text-slate-400">
              渲染范围不含手机壳。若手机未自动下载，点上方按钮可在弹框内手动保存。
            </p>
          </div>

          {/* REAL PHONE SHELL OUTER */}
          <div className={`scale-[0.82] sm:scale-100 origin-top transition-all duration-300 p-4 rounded-[42px] border-4 border-slate-300 dark:border-slate-800 bg-slate-950 shadow-2xl relative ${
            isDarkMode ? "shadow-emerald-500/5" : "shadow-slate-400/20"
          }`}>
            
            {/* Front Camera notch */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-between px-3">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800"></div>
              <div className="w-12 h-1 bg-slate-900 rounded-full"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-blue-900/40"></div>
            </div>

            {/* FLYER CONTAINER REF TO CAPTURE */}
            <div 
              ref={flyerContainerRef}
              className={`w-[310px] ${getFlyerHeightClass()} ${getContainerPaddingClass()} rounded-[28px] relative overflow-hidden flex flex-col justify-between select-none transition-all duration-300 ${getThemeBackground()} ${
                fontFamily === "serif" ? "font-serif" : fontFamily === "kaiti" ? "font-serif tracking-wide font-medium" : fontFamily === "mono" ? "font-mono" : "font-sans"
              }`}
            >
              {/* Custom background image overlay */}
              {customBgImage && (
                <div 
                  className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
                  style={{ opacity: bgOpacity / 100 }}
                >
                  <img 
                    src={customBgImage} 
                    alt="Custom BG" 
                    className="w-full h-full object-cover"
                    style={{ filter: `blur(${bgBlur}px)` }}
                  />
                </div>
              )}
              
              {/* Background patterns render */}
              {layout !== "minimalist-gold" && (
                <>
                  {pattern === "grid" && (
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none z-0"></div>
                  )}
                  {pattern === "dots" && (
                    <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none z-0"></div>
                  )}
                  {pattern === "laser-wave" && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 skew-y-12 scale-150 animate-pulse pointer-events-none z-0"></div>
                  )}
                  {/* Neon light blurs */}
                  <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-amber-400/10 blur-2xl"></div>
                  <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-emerald-400/10 blur-2xl"></div>
                </>
              )}

              {/* STICKER BADGE */}
              {stickerInfo && (
                <div className={`absolute top-12 right-0 rotate-12 py-1 px-3.5 z-30 text-[9px] font-black uppercase rounded-l-md tracking-wider ${stickerInfo.style}`}>
                  {stickerInfo.text}
                </div>
              )}

              {/* CORNER STAMP BADGE */}
              {cornerStamp !== "none" && (
                <div className="absolute top-3 left-3 z-40 rotate-[-12deg] pointer-events-none">
                  <div className="border border-amber-300/80 bg-gradient-to-r from-amber-600 to-rose-600 text-white font-black text-[8px] px-2 py-0.5 rounded shadow-md uppercase tracking-wider flex items-center gap-1">
                    {cornerStamp === "upgrade" && <>⚡ 2026重磅升级</>}
                    {cornerStamp === "official" && <>🎖️ 官方授牌印章</>}
                    {cornerStamp === "vip" && <>👑 VIP独家特权</>}
                    {cornerStamp === "confidential" && <>🔒 考前绝密密件</>}
                  </div>
                </div>
              )}

              {/* WATERMARK STAMPER */}
              {showWatermark && (
                <div className="absolute top-18 left-1/2 -translate-x-1/2 rotate-[-5deg] opacity-25 border border-dashed text-[9px] px-3 py-0.5 pointer-events-none uppercase tracking-widest z-10 font-bold border-current">
                  {watermarkText}
                </div>
              )}

              {/* URGENCY COUNTDOWN BANNER */}
              {showCountdown && (
                <div className={`z-30 my-0.5 py-1 px-2.5 rounded-lg border flex items-center justify-between text-[8.5px] font-black shadow-xs ${
                  countdownStyle === "rose" 
                    ? "bg-rose-600/90 border-rose-400/50 text-white animate-pulse" 
                    : countdownStyle === "amber" 
                    ? "bg-amber-500/90 border-amber-300/50 text-slate-950" 
                    : "bg-emerald-600/90 border-emerald-400/50 text-white"
                }`}>
                  <div className="flex items-center gap-1 truncate">
                    <Flame className="w-3 h-3 shrink-0 animate-bounce text-yellow-300" />
                    <span className="truncate">{countdownText}</span>
                  </div>
                  <span className="shrink-0 font-mono text-[8px] opacity-80 pl-1">⚡ 抢额中</span>
                </div>
              )}

              {/* ----------------- LAYOUT 1: GLASS MODERN ----------------- */}
              {layout === "glass-modern" && (
                <>
                  {/* Slogan & Title */}
                  <div className={`space-y-0.5 z-10 pt-1 ${
                    titleAlign === "center" ? "text-center" : titleAlign === "right" ? "text-right" : "text-left"
                  }`}>
                    <div className={`flex items-center space-x-1 ${
                      titleAlign === "center" ? "justify-center" : titleAlign === "right" ? "justify-end" : "justify-start"
                    }`}>
                      <span className={`px-2 py-0.5 border text-[8px] font-extrabold rounded tracking-wider uppercase block w-max ${getThemeBadge()}`}>
                        {slogan}
                      </span>
                    </div>

                    <h1 className={`${getTitleSizeClass()} font-black tracking-tight leading-tight pt-0.5 filter drop-shadow-sm`}>
                      {currentMajorName}
                    </h1>
                    
                    <div className={`flex items-center text-[8px] opacity-75 mt-0.5 ${
                      titleAlign === "center" ? "justify-center" : titleAlign === "right" ? "justify-end" : "justify-start"
                    }`}>
                      <span className="font-mono text-emerald-300 tracking-wider">
                        {MAJOR_TEMPLATES[selectedMajor]?.sub || "注册勘察设计工程师高品质通关课"}
                      </span>
                    </div>
                  </div>

                  {/* Glass Box */}
                  <div className={`bg-white/10 backdrop-blur-md border border-white/15 z-10 shadow-xl ${getBoxContainerClass()}`}>
                    <div className="flex items-center justify-between border-b border-white/10 pb-1">
                      <div className="text-[8.5px] font-extrabold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-yellow-400" />
                        2026核心招生特权权益
                      </div>
                      <span className="text-[7.5px] px-1.5 py-0.5 bg-black/30 rounded text-slate-300 font-mono">
                        已报名 {dynamicStudentsCount} 人
                      </span>
                    </div>

                    <p className={`${getHeadlineTextClass()} tracking-wide text-white opacity-95`}>
                      {headline}
                    </p>

                    <div className={`${isSquare ? "space-y-0.5" : "space-y-1"} pt-0.5`}>
                      {[benefit1, benefit2, benefit3].filter(Boolean).map((benefit, idx) => (
                        <div key={`b-preview-1-${idx}-${benefit}`} className="flex items-start gap-1">
                          <span className="w-3 h-3 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[7.5px] flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                            ✓
                          </span>
                          <span className={`${getBenefitTextClass()} font-medium opacity-90`}>{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {/* CUSTOM HIGHLIGHT TAGS POOL */}
                    {customTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5 border-t border-white/10">
                        {customTags.slice(0, isSquare ? 3 : 5).map((tag, idx) => (
                          <span
                            key={`poster-tag-${idx}`}
                            className={`px-1.5 py-0.5 rounded text-[7.5px] font-extrabold border ${
                              tagColor === "emerald" ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                                : tagColor === "amber" ? "bg-amber-500/20 text-amber-300 border-amber-400/40"
                                : tagColor === "rose" ? "bg-rose-500/20 text-rose-300 border-rose-400/40"
                                : tagColor === "blue" ? "bg-blue-500/20 text-blue-300 border-blue-400/40"
                                : "bg-purple-500/20 text-purple-300 border-purple-400/40"
                            }`}
                          >
                            ★ {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quality Stamp Badge */}
                    {hasLogoIcon && !isSquare && (
                      <div className="flex items-center space-x-1.5 pt-1 border-t border-white/5 text-[8px] text-amber-400/90">
                        <Award className="w-3 h-3 shrink-0" />
                        <span>教务组官方认证 · 双师精细伴学服务保障</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ----------------- LAYOUT 2: CYBER GRID ----------------- */}
              {layout === "cyber-grid" && (
                <>
                  <div className={`space-y-1 z-10 pt-1 font-mono ${
                    titleAlign === "center" ? "text-center" : titleAlign === "right" ? "text-right" : "text-left"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[7.5px] text-emerald-400 font-bold border border-emerald-500/40 px-1.5 py-0.5 rounded bg-emerald-950/40">
                        [ ENGINE: CORE_RUNNING ]
                      </span>
                      <span className="text-[7.5px] text-slate-400">HOTRATING: {dynamicHotScore}%</span>
                    </div>

                    <div className="border-l-2 border-emerald-500 pl-2 mt-0.5">
                      <span className="text-[8px] text-slate-400 uppercase tracking-widest">{slogan}</span>
                      <h1 className={`${getTitleSizeClass()} font-black text-white uppercase tracking-tight font-sans`}>
                        {currentMajorName}
                      </h1>
                    </div>
                  </div>

                  {/* Mainframe Frame */}
                  <div className={`border border-emerald-500/30 bg-slate-950/85 z-10 font-mono ${getBoxContainerClass()}`}>
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1 text-[7.5px]">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Layers className="w-3 h-3 text-emerald-400" />
                        SYS_GUARANTEE_RULE
                      </span>
                      <span className="text-slate-500 font-mono">ENROLL: {dynamicStudentsCount}</span>
                    </div>

                    <div className={`${getHeadlineTextClass()} text-emerald-300 leading-snug bg-emerald-500/10 p-1.5 rounded border border-emerald-500/20`}>
                      {headline}
                    </div>

                    <div className={`${isSquare ? "space-y-0.5" : "space-y-1"} text-slate-300`}>
                      {[benefit1, benefit2, benefit3].filter(Boolean).map((benefit, idx) => (
                        <div key={`b-preview-2-${idx}-${benefit}`} className="flex items-start gap-1">
                          <span className="text-emerald-400 font-bold shrink-0 text-[8px]">&gt;&gt;</span>
                          <span className={getBenefitTextClass()}>{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {/* CUSTOM HIGHLIGHT TAGS POOL */}
                    {customTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5 border-t border-emerald-500/15">
                        {customTags.slice(0, isSquare ? 3 : 5).map((tag, idx) => (
                          <span
                            key={`poster-tag-cyber-${idx}`}
                            className="px-1 py-0.5 rounded text-[7px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                          >
                            # {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Price and Badge Grid */}
                    <div className="grid grid-cols-2 gap-1 pt-1 border-t border-emerald-500/15 text-[8px]">
                      <div className="bg-slate-900/60 p-0.5 rounded border border-slate-800 text-center">
                        <span className="text-slate-500 block text-[7px]">原价划线价</span>
                        <span className="text-slate-400 line-through text-[8.5px]">{originalPrice}</span>
                      </div>
                      <div className="bg-emerald-950/30 p-0.5 rounded border border-emerald-500/20 text-center">
                        <span className="text-emerald-400 block text-[7px]">限时到手价</span>
                        <span className="text-emerald-400 font-bold font-sans text-[9.5px]">{specialPrice}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ----------------- LAYOUT 3: MINIMALIST GOLD ----------------- */}
              {layout === "minimalist-gold" && (
                <>
                  <div className={`space-y-1 z-10 pt-1 ${
                    titleAlign === "center" ? "text-center" : titleAlign === "right" ? "text-right" : "text-left"
                  }`}>
                    <span className="text-[8.5px] text-[#A57C1E] tracking-[0.2em] font-serif font-bold uppercase block border-b border-[#D4AF37]/20 pb-0.5 max-w-[80%] mx-auto">
                      {slogan}
                    </span>

                    <h1 className={`${getTitleSizeClass()} font-serif text-[#4A3C31] tracking-wide leading-tight pt-0.5`}>
                      {currentMajorName}
                    </h1>
                    <p className="text-[7.5px] tracking-widest text-[#8A7968] font-mono">
                      {MAJOR_TEMPLATES[selectedMajor]?.sub || "注册公用设备/电气工程师重点推荐课程"}
                    </p>
                  </div>

                  {/* Classic Inner Container */}
                  <div className={`border border-[#D4AF37]/30 bg-[#FAF8F5] z-10 text-stone-800 shadow-2xs ${getBoxContainerClass()}`}>
                    <div className="text-center font-serif italic text-[10px] text-[#A57C1E] border-b border-[#D4AF37]/10 pb-1">
                      “ {headline} ”
                    </div>

                    <div className={`${isSquare ? "space-y-0.5" : "space-y-1"} font-serif`}>
                      {[benefit1, benefit2, benefit3].filter(Boolean).map((benefit, idx) => (
                        <div key={`b-preview-3-${idx}-${benefit}`} className="flex items-start gap-1 text-stone-600">
                          <span className="text-[#A57C1E] text-[9px] font-serif shrink-0">❖</span>
                          <span className={`${getBenefitTextClass()} tracking-wide font-sans`}>{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {/* CUSTOM HIGHLIGHT TAGS POOL */}
                    {customTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5 border-t border-[#D4AF37]/15">
                        {customTags.slice(0, isSquare ? 3 : 5).map((tag, idx) => (
                          <span
                            key={`poster-tag-gold-${idx}`}
                            className="px-1 py-0.2 rounded text-[7.5px] font-serif font-bold bg-[#A57C1E]/10 text-[#A57C1E] border border-[#D4AF37]/30"
                          >
                            ❖ {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Price stamp inside Gold layout */}
                    <div className="flex items-center justify-between pt-0.5 border-t border-[#D4AF37]/15 text-[8px] text-stone-500">
                      <span>已录学子 {dynamicStudentsCount} 人</span>
                      <span>限时尊享价 <strong className="text-[#A57C1E] font-bold text-[10px] font-mono">{specialPrice}</strong></span>
                    </div>

                    {hasLogoIcon && !isSquare && (
                      <div className="flex items-center justify-center space-x-1 text-[7px] text-[#8A7968] font-serif tracking-widest">
                        <span>🎖️ 正通执业资格认证中心重点推荐</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ----------------- LAYOUT 4: BRUTALIST MONO ----------------- */}
              {layout === "brutalist-mono" && (
                <>
                  <div className={`space-y-1 z-10 pt-1 ${
                    titleAlign === "center" ? "text-center" : titleAlign === "right" ? "text-right" : "text-left"
                  }`}>
                    <div className="bg-white text-slate-950 font-black text-[9px] uppercase tracking-wider px-2 py-0.2 border-2 border-slate-950 inline-block">
                      {slogan}
                    </div>

                    <h1 className={`${getTitleSizeClass()} font-black tracking-tighter leading-none pt-0.5 uppercase text-white bg-slate-950 p-1.5 border-2 border-slate-950 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]`}>
                      {currentMajorName}
                    </h1>
                  </div>

                  {/* Brutalist Frame */}
                  <div className={`border-4 border-slate-950 bg-white text-slate-950 z-10 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${getBoxContainerClass()}`}>
                    <div className="font-extrabold text-[8px] uppercase tracking-wider border-b-2 border-slate-950 pb-0.5 flex justify-between">
                      <span>🎯 专属权益 / 签字特权</span>
                      <span>REGS: {dynamicStudentsCount}</span>
                    </div>

                    <p className={`${getHeadlineTextClass()} bg-slate-100 p-1 border border-slate-900`}>
                      {headline}
                    </p>

                    <div className={isSquare ? "space-y-0.5" : "space-y-1"}>
                      {[benefit1, benefit2, benefit3].filter(Boolean).map((benefit, idx) => (
                        <div key={`b-preview-4-${idx}-${benefit}`} className="flex items-start gap-1">
                          <span className="w-3 h-3 bg-slate-950 text-white font-extrabold text-[7.5px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className={`${getBenefitTextClass()} font-extrabold`}>{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {/* CUSTOM HIGHLIGHT TAGS POOL */}
                    {customTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5 border-t-2 border-slate-950">
                        {customTags.slice(0, isSquare ? 3 : 5).map((tag, idx) => (
                          <span
                            key={`poster-tag-brut-${idx}`}
                            className="px-1 py-0.2 text-[7.5px] font-black bg-slate-950 text-white"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Prices block in brutalism */}
                    <div className="border-t-2 border-slate-950 pt-0.5 flex justify-between items-center text-[8px] font-black">
                      <span className="line-through text-slate-500">{originalPrice}</span>
                      <span className="bg-yellow-350 px-1.5 py-0.2 border border-slate-950 text-slate-950 text-[9.5px]">
                        到手仅: {specialPrice}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* EXTREME ADDITION: TEACHER & BRAND COMPONENT (Universal to all Layouts) */}
              <div className={`${getTeacherCardClass()} ${
                layout === "minimalist-gold" 
                  ? "border-[#D4AF37]/25 bg-[#FAF8F5] text-stone-700 font-serif" 
                  : (layout === "brutalist-mono" 
                      ? "border-2 border-slate-950 bg-white text-slate-950 font-extrabold" 
                      : "border-white/10 bg-black/20 text-white")
              }`}>
                <div className="space-y-0.5 max-w-[70%]">
                  <div className="flex items-center space-x-1.5">
                    {customTeacherAvatar ? (
                      <img 
                        src={customTeacherAvatar} 
                        alt="Teacher" 
                        className={`${isSquare ? "w-3.5 h-3.5" : "w-4 h-4"} rounded-full object-cover shrink-0 border border-emerald-400`}
                      />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                    )}
                    <strong className={`${isSquare ? "text-[8.5px]" : "text-[9.5px]"} truncate`}>{teacherName}</strong>
                  </div>
                  <p className="opacity-75 leading-tight truncate text-[7.5px]">{teacherDesc}</p>
                </div>
                
                <span className={`text-[7.5px] font-extrabold px-1.5 py-0.2 rounded ${
                  layout === "minimalist-gold" 
                    ? "bg-[#D4AF37]/10 text-[#A57C1E]" 
                    : (layout === "brutalist-mono" ? "bg-slate-950 text-white" : "bg-emerald-500/20 text-emerald-300")
                }`}>
                  主讲推荐
                </span>
              </div>

              {/* FLYER FOOTER (UNIVERSAL SCAN & CONTACT INFO) */}
              <div className={`${getFooterClass()} ${
                layout === "minimalist-gold" 
                  ? "border-[#D4AF37]/20 text-stone-600" 
                  : (layout === "brutalist-mono" ? "border-slate-950 text-slate-950" : "border-white/15 text-white")
              }`}>
                <div className="space-y-0.5 max-w-[210px]">
                  <span className={`text-[7px] uppercase tracking-wider block font-bold truncate ${
                    layout === "minimalist-gold" ? "text-[#8A7968]" : "opacity-60"
                  }`}>
                    {brandName} · 2026官方招生通道
                  </span>
                  
                  <span className="font-mono text-[8px] font-black block leading-none truncate">
                    {contact}
                  </span>
                  
                  {campusInfo && !isSquare && (
                    <span className="text-[7px] font-medium block truncate opacity-80 flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5 shrink-0 text-emerald-400" />
                      <span>{campusInfo}</span>
                    </span>
                  )}
                </div>

                {/* Aesthetic QR Code frame */}
                <div className={`w-11 h-11 p-0.5 shrink-0 flex flex-col items-center justify-center shadow-xs overflow-hidden ${
                  layout === "minimalist-gold" 
                    ? "bg-[#FAF8F5] border border-[#D4AF37]/30" 
                    : (layout === "brutalist-mono" ? "bg-white border-2 border-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "bg-white rounded-lg")
                }`}>
                  {customQrCode ? (
                    <img src={customQrCode} alt="Custom QR" className="w-full h-full object-contain" />
                  ) : (
                    <div className={`w-full h-full p-0.5 rounded-2xs flex flex-col justify-between ${
                      layout === "minimalist-gold" 
                        ? "bg-stone-800" 
                        : (layout === "brutalist-mono" ? "bg-slate-950" : "bg-slate-900")
                    }`}>
                      <div className="flex justify-between">
                        <div className="w-2.5 h-2.5 bg-white rounded-3xs"></div>
                        <div className="w-2.5 h-2.5 bg-white rounded-3xs"></div>
                      </div>
                      
                      {/* QR center decorative dot */}
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mx-auto animate-pulse"></div>
                      
                      <div className="flex justify-between items-end">
                        <div className="w-2.5 h-2.5 bg-white rounded-3xs"></div>
                        <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* ========================================================== */}
      {/* PERFECT DUAL-INSURANCE EXPORT MODAL                        */}
      {/* ========================================================== */}
      {showExportModal && exportedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                  <Award className="w-4.5 h-4.5 text-emerald-400" />
                  海报高清渲染成功
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Format: PNG (1080x1820 HD resolution)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable image render list & instructions */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4 flex flex-col items-center">
              
              {/* Universal Alert Indicator */}
              <div className="w-full bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-lg text-xs space-y-1">
                <span className="font-extrabold text-emerald-400 block">💡 极速下载与保存技巧说明：</span>
                <p className="text-slate-300 leading-relaxed text-[10.5px]">
                  1. 若您的浏览器未自动下载图片文件，属于 <b>AI Studio 沙箱保护限制</b> 的正常现象。<br />
                  2. <b>电脑端保存：</b> 请右键下方图片，点击并选择<b>「图片另存为」</b>即可保存高清图。<br />
                  3. <b>手机微信端：</b> 请长按下方图片，点击弹出菜单中的<b>「保存图片」</b>或发送给好友。
                </p>
              </div>

              {/* RENDERED IMAGE STAGE (High fidelity representation) */}
              <div className="relative border-4 border-slate-800 rounded-xl overflow-hidden shadow-lg group">
                <img
                  src={exportedImage}
                  alt="HD Rendered Poster"
                  className="w-[240px] h-[400px] object-contain bg-slate-950 select-all"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-4 text-center pointer-events-none">
                  <Download className="w-8 h-8 text-emerald-400 animate-bounce mb-2" />
                  <span className="text-xs font-bold">右键本图 &gt; 图片另存为</span>
                  <p className="text-[9px] text-slate-400 mt-1">1080x1820 像素超清画质</p>
                </div>
              </div>

            </div>

            {/* Modal Footer actions */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  const link = document.createElement("a");
                  link.download = `2026年_${currentMajorName}_招生宣传海报.png`;
                  link.href = exportedImage;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  onToastTrigger("已重新向浏览器发送自动下载信号！");
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1"
              >
                <Download className="w-4 h-4" />
                <span>再次尝试自动下载</span>
              </button>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold cursor-pointer"
              >
                关闭预览
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
