/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  HelpCircle, 
  Copy, 
  Check, 
  Filter, 
  MessageSquare, 
  BookOpen, 
  Volume2, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Save, 
  Edit3, 
  X,
  Sparkles,
  Award
} from "lucide-react";

interface FAQKnowledgeBaseProps {
  isDarkMode: boolean;
  onToastTrigger: (msg: string) => void;
}

interface FAQItem {
  id: string;
  category: "course" | "tuition" | "career" | "cert";
  question: string;
  objection: string; // Typical student concern
  strategy: string;  // Counseling approach
  script: string;    // Gold standard script
}

const FAQ_DATABASE_SEED: FAQItem[] = [
  {
    id: "faq-1",
    category: "course",
    question: "学习给排水和暖通，零基础能学得会吗？",
    objection: "学员觉得专业门槛太高，害怕报了名听不懂、学不会，浪费钱。",
    strategy: "降低准入焦虑，强调我们的「零基础模块化教学法」与三阶段递进式学习体系，辅以双师答疑保障。",
    script: "“张工，您的顾虑非常普遍，其实我们历届有近40%的学员都是零基础转行。我们专门为零基础研发了「预科先导模块」，从最基本的制图标准和基础物性讲起。而且课程是录播理论+直播实操答疑双线并行，有专属助教老师在线1对1辅导。只要您跟着学习计划走，通关真的没想象中那么难。要不我先给您发一节3分钟的精髓体验视频，您看看好不好懂？”"
  },
  {
    id: "faq-2",
    category: "tuition",
    question: "学费太贵了，能不能便宜点或打个折？",
    objection: "学员试探底价，寻找优惠政策，希望性价比最大化。",
    strategy: "先进行价值锚定（证书带来的升职加薪），再推出限时政策（如今日转账锁定老生介绍名额或享受政府专项补贴渠道）。",
    script: "“李老师，我完全理解您想控制预算。但我们要看的是投资回报比，一旦通关拿下证书，在咱们广东省一个月津贴就是1500到3000元，基本上两三个月就把学费双倍挣回来了。况且咱们这期正赶上「6月冲刺专属老生转介绍补贴」，只要今天下午5点前通过转账锁定一个100元学位定金，我就能向学校帮您申请直接减免1800元的学费！这个优惠名额全省只有3个，非常难得。”"
  },
  {
    id: "faq-3",
    category: "cert",
    question: "国家现在的证书含金量如何？政策会变吗？",
    objection: "担心国家简政放权，证书贬值，拿了证没地方用。",
    strategy: "出示国家红头文件及企业资质评定标准，强调注册工程师作为「唯一准入类执业资格」的不可替代性。",
    script: "“刘工，国家确实在精简一些水平评价类证书，但咱们考的‘勘察设计注册工程师’属于国家‘准入类’含金量最高的执业资格。根据住房和城乡建设部最新规定，企业申请甲级设计资质、招投标盖章，必须配备足够数量 of 注册工程师。只要设计院还在，只要招投标项目存在，这个证就是妥妥的刚需，是您身份和签字权唯一的黄金招牌。”"
  },
  {
    id: "faq-4",
    category: "career",
    question: "你们推荐就业是真的吗？一般能推荐到哪里？",
    objection: "怀疑学校虚假宣传，担心学完依然失业，拿不到高薪。",
    strategy: "展示真实校企合作名单，阐明我们与全国中铁、中建以及头部民营勘察设计院的长期人才输送协议，并说明具体的内推流程。",
    script: "“王工，我们的推荐就业可绝不是一句空话。我们学校与全国300多家大型设计院 and 建筑企业签订了「订单式委托培养协议」。毕业前，我们会为您进行免费的简历精修与一对一模拟面试，直接走企业内推绿色通道。像在华东地区，我们上个月就成功内推了15位学员入职中建三局和华东勘测设计院，平均薪资涨幅都在30%以上。如果您确定报考，今天入学就可以提前建档，排队锁定内推名额。”"
  },
  {
    id: "faq-5",
    category: "course",
    question: "平时工作特别忙，赶不上直播怎么办？",
    objection: "工作加班多、应酬多，担心缺课跟不上进度，导致弃考。",
    strategy: "强调移动端便捷学习、录播无限回放以及智能APP学习进度管理，打消时间流失的顾虑。",
    script: "“陈工，现在大家工作压力都很大，我们绝大部分学员都是边上班边备考的。针对这个情况，我们所有直播课都配备了1080P超清重播，并且支持手机、平板、电脑随时随地1.5倍速观看，上下班通勤就能把知识点学完。同时，我们的督学系统还会每周为您推送个性化‘进度追赶方案’，漏了课也不用慌，助教老师会贴心提醒并发送课后讲义，相当于给您配了一个私人学习小秘书！”"
  }
];

export default function FAQKnowledgeBase({ isDarkMode, onToastTrigger }: FAQKnowledgeBaseProps) {
  // Load dynamic FAQs from localStorage or seed fallback
  const [faqs, setFaqs] = useState<FAQItem[]>(() => {
    const saved = localStorage.getItem("recruitment_faq_items");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading FAQs from storage", e);
      }
    }
    return FAQ_DATABASE_SEED;
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "course" | "tuition" | "career" | "cert">("all");
  const [expandedId, setExpandedId] = useState<string | null>("faq-1");
  
  // Custom Addition/Editing States
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Add form fields
  const [newQuestion, setNewQuestion] = useState("");
  const [newObjection, setNewObjection] = useState("");
  const [newStrategy, setNewStrategy] = useState("");
  const [newScript, setNewScript] = useState("");
  const [newCategory, setNewCategory] = useState<"course" | "tuition" | "career" | "cert">("course");

  // Inline editing state helpers
  const [editQuestion, setEditQuestion] = useState("");
  const [editObjection, setEditObjection] = useState("");
  const [editStrategy, setEditStrategy] = useState("");
  const [editScript, setEditScript] = useState("");

  // Persist FAQs on update
  useEffect(() => {
    localStorage.setItem("recruitment_faq_items", JSON.stringify(faqs));
  }, [faqs]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    onToastTrigger("📋 话术金句已复制到剪贴板！可直接粘贴发送给咨询学员。");
  };

  const handleResetToDefaults = () => {
    setConfirmModal({
      title: "确定重置经典话术库吗？",
      message: "此操作将清除您当前添加或校准过的所有自定义学员疑问解答与辅导话术，并重新加载系统内置的招生金句种子库。",
      onConfirm: () => {
        setFaqs(FAQ_DATABASE_SEED);
        setExpandedId(FAQ_DATABASE_SEED[0].id);
        setEditingItemId(null);
        setShowAddForm(false);
        setConfirmModal(null);
        onToastTrigger("✅ 经典话术话本已恢复！");
      }
    });
  };

  const handleDeleteFAQ = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      title: "确定删除此条话术吗？",
      message: "该疑问解答属于招生黄金话术本，删除后将不再出现在左侧问题列表中，除非点击重置默认。",
      onConfirm: () => {
        const updated = faqs.filter(f => f.id !== id);
        setFaqs(updated);
        setConfirmModal(null);
        onToastTrigger("🗑️ 成功删除了该话术项目");
        if (expandedId === id) setExpandedId(updated[0]?.id || null);
      }
    });
  };

  const handleCreateFAQ = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newScript.trim()) {
      onToastTrigger("❌ 请填写问题和标准话术金句！");
      return;
    }

    const newItem: FAQItem = {
      id: `faq-custom-${Date.now()}`,
      category: newCategory,
      question: newQuestion.trim(),
      objection: newObjection.trim() || "未指定抗拒痛点",
      strategy: newStrategy.trim() || "常规化辅导跟进策略",
      script: newScript.trim()
    };

    const nextFaqs = [...faqs, newItem];
    setFaqs(nextFaqs);
    setExpandedId(newItem.id);
    
    // Clear form
    setNewQuestion("");
    setNewObjection("");
    setNewStrategy("");
    setNewScript("");
    setShowAddForm(false);
    onToastTrigger("🎉 成功添加了一条个性化跟进话术！");
  };

  const startInlineEdit = (item: FAQItem) => {
    setEditingItemId(item.id);
    setEditQuestion(item.question);
    setEditObjection(item.objection);
    setEditStrategy(item.strategy);
    setEditScript(item.script);
  };

  const handleSaveInlineEdit = (id: string) => {
    const updated = faqs.map((f) => {
      if (f.id === id) {
        return {
          ...f,
          question: editQuestion,
          objection: editObjection,
          strategy: editStrategy,
          script: editScript
        };
      }
      return f;
    });
    setFaqs(updated);
    setEditingItemId(null);
    onToastTrigger("✨ 话术已成功原地校准并保存！");
  };

  // Filter items
  const filteredFAQs = faqs.filter((item) => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.script.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.objection.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.strategy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={`flex-1 flex flex-col p-6 overflow-y-auto space-y-6 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      
      {/* Header Panel */}
      <div className={`p-5 border rounded-xl shadow-xs transition-colors duration-200 ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
              <MessageSquare className="w-5 h-5" />
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                招生精选话术与学员问答 FAQ 库 (Counseling Script Desk)
              </h3>
              <span className="px-1.5 py-0.5 bg-indigo-500/15 text-indigo-500 rounded text-[9px] font-bold">
                智能备忘本
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              快速应对学员的各种抗拒、顾虑和疑问。提供针对零基础、学费预算、证书贬值忧虑以及推荐就业刚需的黄金答辩金句，支持原地定制修改，适配您学校的最新特惠方案。
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                showAddForm
                  ? "bg-amber-600 text-white border-amber-500 hover:bg-amber-50"
                  : (isDarkMode ? "bg-slate-950 border-slate-800 text-emerald-400" : "bg-white border-slate-200 text-emerald-600 hover:bg-emerald-50")
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? "关闭新增面板" : "新增个性化话术"}</span>
            </button>

            <button
              onClick={handleResetToDefaults}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
              }`}
              title="恢复系统初始种子话术"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置默认</span>
            </button>
          </div>
        </div>
      </div>

      {/* Addition Form (slide down if showAddForm) */}
      {showAddForm && (
        <form onSubmit={handleCreateFAQ} className={`p-5 border rounded-xl space-y-4 shadow-sm ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-250"
        }`}>
          <div className="flex justify-between items-center pb-2 border-b border-slate-150 dark:border-slate-850">
            <span className="text-xs font-black flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              新增金牌高转录话术
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 space-y-1">
              <label className="block text-[10px] text-slate-400 font-bold uppercase">学员提问 / 疑虑痛点问题 (Question)</label>
              <input
                type="text"
                placeholder="例如: 考过了注册证书真的能领到政府技能补贴吗？"
                required
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className={`w-full text-xs px-3 py-2 border rounded-lg outline-none ${
                  isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200"
                }`}
              />
            </div>

            <div className="md:col-span-4 space-y-1">
              <label className="block text-[10px] text-slate-400 font-bold uppercase">归属痛点大类 (Category)</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className={`w-full text-xs px-3 py-2 border rounded-lg outline-none ${
                  isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200"
                }`}
              >
                <option value="course">零基础/缺时间</option>
                <option value="tuition">学费预算/性价比</option>
                <option value="cert">证书含金量/真伪</option>
                <option value="career">就业内推/校企协议</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] text-slate-400 font-bold uppercase">学员心理深层痛点诊断</label>
              <textarea
                placeholder="例如: 害怕考完拿不到补贴，或者是纯虚构的忽悠"
                rows={2}
                value={newObjection}
                onChange={(e) => setNewObjection(e.target.value)}
                className={`w-full text-xs px-3 py-2 border rounded-lg outline-none ${
                  isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200"
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] text-slate-400 font-bold uppercase">顾问切入策略与沟通破局思路</label>
              <textarea
                placeholder="例如: 先出示广东省政务服务网站的补贴指引截图，打消虚假焦虑，锁定政策有效期"
                rows={2}
                value={newStrategy}
                onChange={(e) => setNewStrategy(e.target.value)}
                className={`w-full text-xs px-3 py-2 border rounded-lg outline-none ${
                  isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200"
                }`}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] text-slate-400 font-bold uppercase">金牌咨询解答话术示范脚本 (Script - 支持复制)</label>
            <textarea
              placeholder="“老师，政策是真的。您可以打开粤省事小程序，在‘职业技能补贴’里检索...我把具体的截图发您...”"
              rows={3}
              required
              value={newScript}
              onChange={(e) => setNewScript(e.target.value)}
              className={`w-full text-xs px-3 py-2 border rounded-lg outline-none ${
                isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200"
              }`}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className={`px-4 py-2 text-xs rounded-lg font-bold border ${
                isDarkMode ? "border-slate-800 text-slate-400 hover:bg-slate-850" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>发布到我的话术库</span>
            </button>
          </div>
        </form>
      )}

      {/* Control Panel: Search & Category tabs */}
      <div className={`p-4 border rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 transition-colors duration-200 ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`}>
        
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索疑问、抗拒痛点、话术金句..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full text-xs pl-9 pr-3 py-2 border rounded-lg outline-none ${
              isDarkMode ? "bg-slate-950 border-slate-800 text-slate-100 focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500"
            }`}
          />
        </div>

        {/* Categories Tabs */}
        <div className="flex flex-wrap gap-1 w-full md:w-auto">
          {[
            { key: "all", label: "全部痛点话术" },
            { key: "course", label: "零基础/缺时间" },
            { key: "tuition", label: "学费/性价比" },
            { key: "cert", label: "证书含金量" },
            { key: "career", label: "内推就业" }
          ].map((cat, idx) => (
            <button
              key={`faq-cat-${cat.key}-${idx}`}
              onClick={() => setActiveCategory(cat.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat.key
                  ? "bg-emerald-600 text-white"
                  : (isDarkMode ? "bg-slate-950 hover:bg-slate-800 text-slate-400" : "bg-slate-100 hover:bg-slate-200 text-slate-600")
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

      </div>

      {/* Main FAQ Accordion Lists */}
      <div className="space-y-4">
        {filteredFAQs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            未检索到包含该关键词的话术或应对策略，请重新输入。
          </div>
        ) : (
          filteredFAQs.map((item, idx) => {
            const isExpanded = expandedId === item.id;
            const isEditingItem = editingItemId === item.id;

            return (
              <div
                key={`faq-${item.id}-${idx}`}
                className={`border rounded-xl shadow-3xs overflow-hidden transition-all duration-200 group/item ${
                  isExpanded
                    ? (isDarkMode ? "border-emerald-800 bg-slate-900/60" : "border-emerald-200 bg-white shadow-xs")
                    : (isDarkMode ? "border-slate-850 bg-slate-900/30 hover:border-slate-800" : "border-slate-200/80 bg-white hover:border-slate-300")
                }`}
              >
                {/* FAQ Item Header row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center space-x-3 pr-4 flex-1">
                    <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 shrink-0">
                      <HelpCircle className="w-4 h-4" />
                    </span>
                    
                    {!isEditingItem ? (
                      <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 leading-tight">
                        {item.question}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={editQuestion}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setEditQuestion(e.target.value)}
                        className={`w-full text-xs font-bold px-2 py-1 border rounded outline-none ${
                          isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-300"
                        }`}
                      />
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      item.category === "course" ? "bg-blue-100 text-blue-800" :
                      item.category === "tuition" ? "bg-amber-100 text-amber-800" :
                      item.category === "cert" ? "bg-rose-100 text-rose-800" : "bg-purple-100 text-purple-800"
                    }`}>
                      {item.category === "course" ? "零基础" :
                       item.category === "tuition" ? "学费预算" :
                       item.category === "cert" ? "证书资质" : "就业保障"}
                    </span>

                    {/* Quick custom edit/trash controls */}
                    <button
                      onClick={() => {
                        if (isExpanded) {
                          setExpandedId(null);
                        } else {
                          setExpandedId(item.id);
                        }
                      }}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <Filter className="w-3.5 h-3.5 rotate-90" />
                    </button>

                    <button
                      onClick={(e) => handleDeleteFAQ(item.id, e)}
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 rounded opacity-0 group-hover/item:opacity-100 transition-all cursor-pointer"
                      title="删除话术"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* FAQ Expanded Details */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-150/40 dark:border-slate-850/60 space-y-4">
                    
                    {/* Part 1: Objection & Counseling strategy */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      
                      {/* OBJECTION */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/40 dark:border-slate-850 rounded-lg space-y-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          学员抗拒心理诊断 (Student Objection)
                        </span>
                        
                        {!isEditingItem ? (
                          <p className="text-slate-400 leading-relaxed text-[11px]">{item.objection}</p>
                        ) : (
                          <textarea
                            value={editObjection}
                            onChange={(e) => setEditObjection(e.target.value)}
                            rows={3}
                            className={`w-full text-xs px-2 py-1 border rounded outline-none ${
                              isDarkMode ? "bg-slate-950 border-slate-850 text-white" : "bg-white border-slate-250"
                            }`}
                          />
                        )}
                      </div>

                      {/* STRATEGY */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/40 dark:border-slate-850 rounded-lg space-y-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                          <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                          应对策略与破局思路 (Counseling Strategy)
                        </span>
                        
                        {!isEditingItem ? (
                          <p className="text-slate-400 leading-relaxed text-[11px]">{item.strategy}</p>
                        ) : (
                          <textarea
                            value={editStrategy}
                            onChange={(e) => setEditStrategy(e.target.value)}
                            rows={3}
                            className={`w-full text-xs px-2 py-1 border rounded outline-none ${
                              isDarkMode ? "bg-slate-950 border-slate-850 text-white" : "bg-white border-slate-250"
                            }`}
                          />
                        )}
                      </div>
                    </div>

                    {/* Part 2: Gold standard script */}
                    <div className={`p-4 border rounded-xl relative ${
                      isDarkMode ? "bg-emerald-950/15 border-emerald-900/60 text-emerald-300" : "bg-emerald-50/60 border-emerald-100 text-emerald-800"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" />
                          金牌话术解答脚本 (Counseling Script Template)
                        </span>

                        <div className="flex items-center space-x-2">
                          {isEditingItem ? (
                            <button
                              type="button"
                              onClick={() => handleSaveInlineEdit(item.id)}
                              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer transition-colors shadow-2xs"
                            >
                              <Save className="w-3 h-3" />
                              <span>保存此话术</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startInlineEdit(item)}
                              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-slate-700 hover:bg-slate-600 text-white rounded cursor-pointer transition-colors shadow-2xs"
                              title="点击编辑当前话术内容"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>微调内容</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleCopy(isEditingItem ? editScript : item.script)}
                            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer transition-colors shadow-2xs"
                          >
                            <Copy className="w-3 h-3" />
                            <span>复制发送话术</span>
                          </button>
                        </div>
                      </div>

                      {!isEditingItem ? (
                        <p className="font-serif leading-relaxed text-[12px] italic pr-4 whitespace-pre-wrap">
                          {item.script}
                        </p>
                      ) : (
                        <textarea
                          value={editScript}
                          onChange={(e) => setEditScript(e.target.value)}
                          rows={4}
                          className={`w-full text-xs font-serif px-2.5 py-2 border rounded outline-none ${
                            isDarkMode ? "bg-slate-950 border-emerald-800 text-emerald-200" : "bg-white border-emerald-200 text-emerald-900"
                          }`}
                        />
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Dynamic Confirm Modal */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`max-w-md w-full p-6 rounded-2xl shadow-2xl border ${
                isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              <h4 className="text-sm font-black mb-2 text-slate-900 dark:text-white">
                {confirmModal.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                {confirmModal.message}
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                    isDarkMode ? "border-slate-800 hover:bg-slate-850 text-slate-400" : "border-slate-200 hover:bg-slate-50 text-slate-500"
                  }`}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-500/10"
                >
                  确定
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
