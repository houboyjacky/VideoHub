"use client";

import React from "react";
import { Layers } from "lucide-react";

export interface GroupItem {
  id: string;
  name: string;
}

interface GroupFilterBarProps {
  groups: GroupItem[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
}

export function GroupFilterBar({
  groups,
  selectedGroupId,
  onSelectGroup,
}: GroupFilterBarProps) {
  if (!groups || groups.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500 pr-2 border-r border-white/10 shrink-0">
        <Layers className="w-3.5 h-3.5" />
        <span>分組：</span>
      </div>

      {/* 全部按鈕 */}
      <button
        type="button"
        onClick={() => onSelectGroup(null)}
        className={`px-3.5 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer ${
          selectedGroupId === null
            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10"
            : "bg-white/[0.03] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.07] border border-white/5"
        }`}
      >
        全部影片
      </button>

      {/* 各分組按鈕 */}
      {groups.map((group) => {
        const isSelected = selectedGroupId === group.id;
        return (
          <button
            key={group.id}
            type="button"
            onClick={() => onSelectGroup(isSelected ? null : group.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer ${
              isSelected
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10"
                : "bg-white/[0.03] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.07] border border-white/5"
            }`}
          >
            {group.name}
          </button>
        );
      })}
    </div>
  );
}

export default GroupFilterBar;
