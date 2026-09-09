import React, { useState, useEffect } from "react";
import { RowData, TableConfig } from "../types";
import { X, Plus, Trash2, ArrowUp, ArrowDown, Settings, Save, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

interface ChannelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TableConfig;
  onConfigChange: (newConfig: TableConfig) => void;
  rows: RowData[];
  onRowsChange: (newRows: RowData[]) => void;
  isDarkMode: boolean;
  onToast: (msg: string) => void;
}

export default function ChannelConfigModal({
  isOpen,
  onClose,
  config,
  onConfigChange,
  rows,
  onRowsChange,
  isDarkMode,
  onToast
}: ChannelConfigModalProps) {
  const [localChannels, setLocalChannels] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLocalChannels(
        config.channels.map((name, idx) => ({
          id: `ch-${idx}`,
          name
        }))
      );
    }
  }, [isOpen, config.channels]);

  if (!isOpen) return null;

  const handleAddChannel = () => {
    const newId = `ch-new-${Date.now()}`;
    const nextIndex = localChannels.length + 1;
    setLocalChannels([
      ...localChannels,
      { id: newId, name: `新增渠道 ${nextIndex}` }
    ]);
  };

  const handleDeleteChannel = (idToDelete: string) => {
    if (localChannels.length <= 1) {
      onToast("⚠️ 必须至少保留 1 个招生渠道！");
      return;
    }
    const targetCh = localChannels.find((ch) => ch.id === idToDelete);
    if (
      window.confirm(
        `🚨 警告：确定要删除渠道【${targetCh?.name || ""}】吗？\n删除后将永久丢失所有历史数据中该渠道的“招生计划”及“已报人数”，此操作无法恢复！`
      )
    ) {
      setLocalChannels(localChannels.filter((ch) => ch.id !== idToDelete));
      onToast(`🗑️ 已将 ${targetCh?.name || "渠道"} 移出配置列表`);
    }
  };

  const handleRenameChannel = (idToRename: string, newName: string) => {
    setLocalChannels(
      localChannels.map((ch) =>
        ch.id === idToRename ? { ...ch, name: newName } : ch
      )
    );
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    const newList = [...localChannels];
    const temp = newList[idx];
    newList[idx] = newList[idx - 1];
    newList[idx - 1] = temp;
    setLocalChannels(newList);
  };

  const handleMoveDown = (idx: number) => {
    if (idx === localChannels.length - 1) return;
    const newList = [...localChannels];
    const temp = newList[idx];
    newList[idx] = newList[idx + 1];
    newList[idx + 1] = temp;
    setLocalChannels(newList);
  };

  const handleSave = () => {
    const hasEmpty = localChannels.some((ch) => !ch.name.trim());
    if (hasEmpty) {
      onToast("❌ 渠道名称不能为空，请检查！");
      return;
    }

    const hasDuplicates = localChannels.some(
      (ch, index) =>
        localChannels.findIndex((c) => c.name.trim() === ch.name.trim()) !== index
    );
    if (hasDuplicates) {
      onToast("❌ 渠道名称不能重复，请检查！");
      return;
    }

    // Map of old channels to old IDs
    const oldChannelIds = config.channels.map((_, idx) => `ch-${idx}`);

    // Sync the channels array for all RowData items in `rows`
    const updatedRows = rows.map((row) => {
      const syncedChannels = localChannels.map((newCh) => {
        const oldIdx = oldChannelIds.indexOf(newCh.id);
        if (oldIdx !== -1 && oldIdx < row.channels.length) {
          return {
            target: row.channels[oldIdx].target,
            actual: row.channels[oldIdx].actual
          };
        } else {
          return { target: 0, actual: 0 };
        }
      });

      return {
        ...row,
        channels: syncedChannels
      };
    });

    const newConfig: TableConfig = {
      ...config,
      channels: localChannels.map((ch) => ch.name.trim())
    };

    onConfigChange(newConfig);
    onRowsChange(updatedRows);
    onToast("🎉 招生渠道配置更新成功！");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className={`rounded-2xl shadow-2xl max-w-lg w-full border overflow-hidden flex flex-col max-h-[85vh] ${
          isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
        }`}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
          isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"
        }`}>
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-emerald-500 animate-spin-slow" />
            <h3 className="text-sm font-black">招生渠道配置 (Dynamic Channels)</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info panel */}
        <div className={`p-3 px-5 text-xs flex gap-2 shrink-0 ${
          isDarkMode ? "bg-amber-950/20 text-amber-400 border-b border-slate-800" : "bg-amber-50 text-amber-800 border-b border-slate-100"
        }`}>
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
          <p className="leading-normal font-medium">
            您在此处对渠道的新增、重命名或删除，系统都将<strong>实时自适应重组全量招生数据</strong>。删除渠道将同步清空该渠道所有的已填指标。
          </p>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
            配置渠道列表 ({localChannels.length}个活跃渠道)
          </div>

          <div className="space-y-2">
            {localChannels.map((ch, idx) => (
              <div
                key={`cfg-ch-${ch.id}-${idx}`}
                className={`flex items-center gap-2 p-2 border rounded-xl transition-all ${
                  isDarkMode 
                    ? "bg-slate-950/60 border-slate-800 hover:border-slate-700" 
                    : "bg-slate-50/50 border-slate-150 hover:border-slate-250"
                }`}
              >
                {/* Index Indicator */}
                <span className="w-6 font-mono text-[10px] text-slate-400 font-bold text-center">
                  #{idx + 1}
                </span>

                {/* Input Name field */}
                <input
                  type="text"
                  value={ch.name}
                  onChange={(e) => handleRenameChannel(ch.id, e.target.value)}
                  placeholder="渠道名称 (如: 百度推广)"
                  className={`flex-1 font-bold text-xs px-2.5 py-1.5 border rounded-lg outline-none transition-all ${
                    isDarkMode 
                      ? "bg-slate-900 border-slate-800 hover:bg-slate-850 text-white focus:border-emerald-500" 
                      : "bg-white border-slate-200 hover:border-slate-250 text-slate-800 focus:border-emerald-500"
                  }`}
                />

                {/* Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveUp(idx)}
                    className={`p-1.5 rounded-md border transition-all ${
                      idx === 0 
                        ? "opacity-30 cursor-not-allowed" 
                        : isDarkMode 
                          ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750" 
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                    title="上移"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    disabled={idx === localChannels.length - 1}
                    onClick={() => handleMoveDown(idx)}
                    className={`p-1.5 rounded-md border transition-all ${
                      idx === localChannels.length - 1 
                        ? "opacity-30 cursor-not-allowed" 
                        : isDarkMode 
                          ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750" 
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                    title="下移"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteChannel(ch.id)}
                    className={`p-1.5 rounded-md border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer`}
                    title="删除此渠道"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddChannel}
            className={`w-full py-2 border border-dashed rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              isDarkMode 
                ? "border-slate-800 bg-slate-950/20 hover:bg-slate-950 text-slate-300 hover:border-slate-700" 
                : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-600 hover:border-slate-300"
            }`}
          >
            <Plus className="w-4 h-4 text-emerald-500" />
            <span>添加全新招生渠道</span>
          </button>
        </div>

        {/* Footer actions */}
        <div className={`px-5 py-4 border-t flex items-center justify-between shrink-0 ${
          isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isDarkMode 
                ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850" 
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            取消
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>应用并保存配置</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
