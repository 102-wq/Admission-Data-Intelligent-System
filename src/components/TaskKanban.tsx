/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Users, 
  ArrowRight, 
  ArrowLeft, 
  Search, 
  Filter, 
  RotateCcw, 
  CheckSquare, 
  Archive, 
  ChevronRight,
  TrendingUp,
  Sparkles
} from "lucide-react";

interface TaskKanbanProps {
  isDarkMode: boolean;
}

interface KanbanTask {
  id: string;
  title: string;
  description: string;
  assignee: string; // Counsel department
  priority: "high" | "medium" | "low";
  deadline: string;
  status: "todo" | "progress" | "done";
}

const DEFAULT_TASKS: KanbanTask[] = [
  {
    id: "task-1",
    title: "跟进给排水专业高意向定金锁定",
    description: "针对在2026年6月28日通过老生转介绍渠道获取的3个高价值线索，进行电话高规格跟进，争取全部转为到账。",
    assignee: "咨询一部",
    priority: "high",
    deadline: "2026-06-29",
    status: "todo"
  },
  {
    id: "task-2",
    title: "网络运营新版搜索引擎广告投放审核",
    description: "网络运营部今晚安排上线的全新搜索落地页及创意文案排期，重点突击岩土与环保专业的覆盖率。",
    assignee: "网络运营",
    priority: "medium",
    deadline: "2026-06-28",
    status: "progress"
  },
  {
    id: "task-3",
    title: "代理渠道周末总结大会",
    description: "同华东区、华南区三大代理召开远程视频会议，结算6月第四周的有效登记人数与目标契合度分析。",
    assignee: "代理合作",
    priority: "high",
    deadline: "2026-06-27",
    status: "done"
  },
  {
    id: "task-4",
    title: "策划暖通与结构专业专属老生转介绍海报",
    description: "新媒体部设计一套可一键定制的「携友报名立减2000元」高转化海报，并在老生社群内广泛推送。",
    assignee: "新媒体部",
    priority: "low",
    deadline: "2026-06-30",
    status: "todo"
  },
  {
    id: "task-5",
    title: "咨询二部全员话术通关抽测",
    description: "针对近两日「环保专业」到账转化率下滑的问题，对咨询二部全体老师进行针对性抗锯齿式突击面测。",
    assignee: "咨询二部",
    priority: "medium",
    deadline: "2026-06-29",
    status: "todo"
  }
];

export default function TaskKanban({ isDarkMode }: TaskKanbanProps) {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAssignee, setNewAssignee] = useState("咨询一部");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [newDeadline, setNewDeadline] = useState("2026-06-30");

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  useEffect(() => {
    const saved = localStorage.getItem("recruitment_kanban_tasks");
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Error reading kanban tasks", e);
        setTasks(DEFAULT_TASKS);
      }
    } else {
      setTasks(DEFAULT_TASKS);
      localStorage.setItem("recruitment_kanban_tasks", JSON.stringify(DEFAULT_TASKS));
    }
  }, []);

  const saveTasks = (newTasks: KanbanTask[]) => {
    setTasks(newTasks);
    localStorage.setItem("recruitment_kanban_tasks", JSON.stringify(newTasks));
  };

  const handleOpenAddModal = () => {
    setEditingTaskId(null);
    setNewTitle("");
    setNewDesc("");
    setNewAssignee("咨询一部");
    setNewPriority("medium");
    setNewDeadline("2026-06-30");
    setShowAddModal(true);
  };

  const handleOpenEditModal = (task: KanbanTask) => {
    setEditingTaskId(task.id);
    setNewTitle(task.title);
    setNewDesc(task.description);
    setNewAssignee(task.assignee);
    setNewPriority(task.priority);
    setNewDeadline(task.deadline);
    setShowAddModal(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (editingTaskId) {
      // Editing an existing task
      const updated = tasks.map((t) => {
        if (t.id === editingTaskId) {
          return {
            ...t,
            title: newTitle.trim(),
            description: newDesc.trim(),
            assignee: newAssignee,
            priority: newPriority,
            deadline: newDeadline
          };
        }
        return t;
      });
      saveTasks(updated);
    } else {
      // Adding a new task
      const newTask: KanbanTask = {
        id: `task-${Date.now()}`,
        title: newTitle.trim(),
        description: newDesc.trim(),
        assignee: newAssignee,
        priority: newPriority,
        deadline: newDeadline,
        status: "todo"
      };
      saveTasks([newTask, ...tasks]);
    }

    setShowAddModal(false);
    setEditingTaskId(null);
  };

  const moveTask = (id: string, newStatus: "todo" | "progress" | "done") => {
    const updated = tasks.map((t) => {
      if (t.id === id) {
        return { ...t, status: newStatus };
      }
      return t;
    });
    saveTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    if (window.confirm("确定要删除这条招生跟进任务吗？")) {
      const updated = tasks.filter((t) => t.id !== id);
      saveTasks(updated);
    }
  };

  const handleClearCompleted = () => {
    const completedCount = tasks.filter(t => t.status === "done").length;
    if (completedCount === 0) {
      alert("当前没有已办结的任务可供清理归档。");
      return;
    }
    if (window.confirm(`确定要彻底清理并归档这 ${completedCount} 个已完成的任务吗？`)) {
      const updated = tasks.filter((t) => t.status !== "done");
      saveTasks(updated);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm("确定要恢复默认看板任务设置吗？您当前所作的全部任务更改都将被清空。")) {
      saveTasks(DEFAULT_TASKS);
      setSearchTerm("");
      setFilterAssignee("all");
      setFilterPriority("all");
    }
  };

  // Unique list of assignees for filter
  const uniqueAssignees = Array.from(new Set(tasks.map((t) => t.assignee)));
  const selectDepartments = Array.from(
    new Set([
      "咨询一部",
      "咨询二部",
      "网络运营",
      "品牌渠道",
      "新媒体部",
      "代理合作",
      "老生转介绍",
      ...uniqueAssignees
    ])
  );

  // Filter logic
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAssignee = filterAssignee === "all" || t.assignee === filterAssignee;
    const matchesPriority = filterPriority === "all" || t.priority === filterPriority;
    return matchesSearch && matchesAssignee && matchesPriority;
  });

  // Groups for columns based on filtered tasks
  const todoTasks = filteredTasks.filter((t) => t.status === "todo");
  const progressTasks = filteredTasks.filter((t) => t.status === "progress");
  const doneTasks = filteredTasks.filter((t) => t.status === "done");

  // Calculate stats based on TOTAL active tasks
  const totalCount = tasks.length;
  const doneCount = tasks.filter(t => t.status === "done").length;
  const progressCount = tasks.filter(t => t.status === "progress").length;
  const todoCount = tasks.filter(t => t.status === "todo").length;
  const completionPercentage = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const getPriorityBadge = (p: "high" | "medium" | "low") => {
    switch (p) {
      case "high":
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-600 dark:bg-rose-500/25 dark:text-rose-400">🚨 紧急特快</span>;
      case "medium":
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:bg-amber-500/25 dark:text-amber-400">📅 重点跟进</span>;
      case "low":
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400">💬 常规筹备</span>;
    }
  };

  return (
    <div className={`flex-1 flex flex-col p-6 overflow-y-auto space-y-6 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      
      {/* Header Panel */}
      <div className={`p-5 border rounded-xl shadow-xs transition-colors duration-200 ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
              <CheckSquare className="w-5 h-5" />
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                招生排班与团队任务待办看板 (Task Kanban Desk)
              </h3>
              <span className="px-1.5 py-0.5 bg-indigo-500/15 text-indigo-500 rounded text-[9px] font-bold uppercase tracking-wider">
                COLLABORATIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              由招生主管指派和监控的实时待办看板。支持顾问排班、高意向跟进、推广投放审批及老生社群促活等多维协同，提供完整的检索、分发、原地内容校准和清理机制。
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>发布新跟进任务</span>
            </button>

            <button
              onClick={handleClearCompleted}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                isDarkMode ? "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
              title="一键清理所有已办结的跟进记录"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>归档清理已办结 ({doneCount})</span>
            </button>

            <button
              onClick={handleResetToDefault}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
              }`}
              title="恢复初始种子任务"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置默认</span>
            </button>
          </div>
        </div>
      </div>

      {/* Task Performance Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className={`p-4 border rounded-xl flex items-center space-x-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">任务综合完成进度</span>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-xl font-extrabold font-mono text-slate-800 dark:text-slate-100">{completionPercentage}%</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-300" 
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className={`p-4 border rounded-xl flex items-center space-x-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-lg text-slate-500 dark:text-slate-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">待办任务基数</span>
            <span className="text-xl font-extrabold font-mono text-slate-800 dark:text-slate-100">{todoCount} 项</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">尚未启动的后备工作</span>
          </div>
        </div>

        <div className={`p-4 border rounded-xl flex items-center space-x-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg text-amber-600 dark:text-amber-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">正在邀约攻坚数</span>
            <span className="text-xl font-extrabold font-mono text-amber-600">{progressCount} 项</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">各顾问组跟进中的实时工作</span>
          </div>
        </div>

        <div className={`p-4 border rounded-xl flex items-center space-x-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">累计办结到账数</span>
            <span className="text-xl font-extrabold font-mono text-emerald-600">{doneCount} 项</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">完成度：{totalCount > 0 ? `${doneCount}/${totalCount}` : "0/0"}</span>
          </div>
        </div>

      </div>

      {/* Control Panel: Search & Filter widgets */}
      <div className={`p-4 border rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 transition-colors duration-200 ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`}>
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索任务标题、描述或承接部门..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full text-xs pl-9 pr-3 py-2 border rounded-lg outline-none ${
              isDarkMode ? "bg-slate-950 border-slate-800 text-slate-100 focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500"
            }`}
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Department Filter */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-400 flex items-center gap-0.5 font-bold uppercase"><Users className="w-3.5 h-3.5" /> 部门:</span>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className={`text-xs font-bold px-2 py-1.5 border rounded-lg outline-none ${
                isDarkMode ? "bg-slate-950 border-slate-850 text-white" : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <option value="all">全部执行部门</option>
              {selectDepartments.map((dept, dIdx) => (
                <option key={`dept-${dept}-${dIdx}`} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-400 flex items-center gap-0.5 font-bold uppercase"><Filter className="w-3.5 h-3.5" /> 优先级:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className={`text-xs font-bold px-2 py-1.5 border rounded-lg outline-none ${
                isDarkMode ? "bg-slate-950 border-slate-850 text-white" : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <option value="all">所有优先级</option>
              <option value="high">🚨 紧急特快 (High)</option>
              <option value="medium">📅 重点跟进 (Medium)</option>
              <option value="low">💬 常规筹备 (Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board Columns Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-start">
        
        {/* Column 1: Todo */}
        <div className={`p-4 border rounded-xl shadow-2xs flex flex-col gap-4 transition-colors duration-200 ${
          isDarkMode ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center justify-between pb-2 border-b dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-300">待跟进 / 未开始</h4>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 font-mono">
              {todoTasks.length}
            </span>
          </div>

          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {todoTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-[11px] border border-dashed rounded-lg">
                📋 没有处于待跟进的任务
              </div>
            ) : (
              todoTasks.map((t, tIdx) => (
                <div key={`task-todo-${t.id}-${tIdx}`} className={`p-3.5 border rounded-xl space-y-2.5 transition-all shadow-3xs group relative ${
                  isDarkMode ? "bg-slate-950 border-slate-800 hover:border-slate-700" : "bg-slate-50 border-slate-200 hover:border-slate-300"
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100 leading-tight">
                      {t.title}
                    </h5>
                    <div className="flex items-center space-x-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleOpenEditModal(t)} 
                        className="text-slate-400 hover:text-emerald-500 p-0.5 rounded"
                        title="编辑此任务"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteTask(t.id)} 
                        className="text-slate-400 hover:text-rose-500 p-0.5 rounded"
                        title="删除此任务"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {t.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-dashed border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex items-center space-x-1 text-[10px] font-bold text-slate-500">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.assignee}</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {getPriorityBadge(t.priority)}
                      <button
                        onClick={() => moveTask(t.id, "progress")}
                        className="p-1 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer"
                        title="推移到进行中"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className={`p-4 border rounded-xl shadow-2xs flex flex-col gap-4 transition-colors duration-200 ${
          isDarkMode ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center justify-between pb-2 border-b dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-300">进行中 / 正邀约</h4>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-[10px] font-bold text-amber-600 font-mono">
              {progressTasks.length}
            </span>
          </div>

          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {progressTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-[11px] border border-dashed rounded-lg">
                ⏳ 暂无正在处理的突击事务
              </div>
            ) : (
              progressTasks.map((t, tIdx) => (
                <div key={`task-prog-${t.id}-${tIdx}`} className={`p-3.5 border rounded-xl space-y-2.5 transition-all shadow-3xs group relative ${
                  isDarkMode ? "bg-slate-950 border-slate-800 hover:border-slate-700" : "bg-slate-50 border-slate-200 hover:border-slate-300"
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100 leading-tight">
                      {t.title}
                    </h5>
                    <div className="flex items-center space-x-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleOpenEditModal(t)} 
                        className="text-slate-400 hover:text-emerald-500 p-0.5 rounded"
                        title="编辑此任务"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteTask(t.id)} 
                        className="text-slate-400 hover:text-rose-500 p-0.5 rounded"
                        title="删除此任务"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {t.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-dashed border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex items-center space-x-1 text-[10px] font-bold text-slate-500">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.assignee}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => moveTask(t.id, "todo")}
                        className="p-1 rounded bg-slate-500/10 text-slate-600 hover:bg-slate-500 hover:text-white transition-colors cursor-pointer"
                        title="退回到待处理"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      
                      {getPriorityBadge(t.priority)}

                      <button
                        onClick={() => moveTask(t.id, "done")}
                        className="p-1 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer"
                        title="归档为已办结"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Done */}
        <div className={`p-4 border rounded-xl shadow-2xs flex flex-col gap-4 transition-colors duration-200 ${
          isDarkMode ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center justify-between pb-2 border-b dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-300">已到账 / 已办结</h4>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[10px] font-bold text-emerald-600 font-mono">
              {doneTasks.length}
            </span>
          </div>

          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {doneTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-[11px] border border-dashed rounded-lg">
                ✅ 暂无已经办结归档的跟进单
              </div>
            ) : (
              doneTasks.map((t, tIdx) => (
                <div key={`task-done-${t.id}-${tIdx}`} className={`p-3.5 border rounded-xl space-y-2.5 transition-all opacity-80 shadow-3xs group relative ${
                  isDarkMode ? "bg-slate-950/70 border-slate-850 hover:border-slate-800" : "bg-slate-50 border-slate-200 hover:border-slate-250"
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-bold text-xs text-slate-500 dark:text-slate-400 line-through leading-tight">
                      {t.title}
                    </h5>
                    <div className="flex items-center space-x-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleOpenEditModal(t)} 
                        className="text-slate-400 hover:text-emerald-500 p-0.5 rounded"
                        title="编辑此任务"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteTask(t.id)} 
                        className="text-slate-400 hover:text-rose-500 p-0.5 rounded"
                        title="删除此任务"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed line-through">
                    {t.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-dashed border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex items-center space-x-1 text-[10px] font-medium text-slate-500">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>已办结 ({t.assignee})</span>
                    </div>

                    <button
                      onClick={() => moveTask(t.id, "progress")}
                      className="p-1 rounded bg-slate-500/10 text-slate-600 hover:bg-slate-500 hover:text-white transition-colors cursor-pointer"
                      title="重开此任务"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Task Creation / Editing Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleSaveTask} className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">
                  {editingTaskId ? "✏️ 编辑现有招生任务" : "🚀 发布新招生跟进任务"}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {editingTaskId ? "调整当前任务属性与部门分配" : "指派顾问部门开展重点学科线索爆破跟进"}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wide">任务名称 / 主题</label>
                <input
                  type="text"
                  placeholder="例如：督导老生转介绍渠道到账"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md outline-none ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wide">详细任务描述</label>
                <textarea
                  rows={3}
                  placeholder="提供具体线索数、顾问回访频次和核心转化目标要求..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md outline-none resize-none ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wide">负责/执行部门</label>
                  <select
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className={`w-full text-xs px-2.5 py-1.5 border rounded-md outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="咨询一部">咨询一部</option>
                    <option value="咨询二部">咨询二部</option>
                    <option value="网络运营">网络运营部</option>
                    <option value="品牌渠道">品牌渠道部</option>
                    <option value="新媒体部">新媒体部</option>
                    <option value="代理合作">代理合作部</option>
                    <option value="老生转介绍">老生转介绍组</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wide">优先级状态</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className={`w-full text-xs px-2.5 py-1.5 border rounded-md outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="high">🚨 高优先级 (High)</option>
                    <option value="medium">📅 普通跟进 (Medium)</option>
                    <option value="low">💬 常规筹备 (Low)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wide">限定截止日期</label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className={`w-full text-xs px-3 py-1.5 border rounded-md outline-none ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-150 rounded-lg cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
              >
                {editingTaskId ? "保存任务修改" : "确认投产发布"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
