"use client";

import React from "react";
import { Tag, X } from "lucide-react";

interface TagFilterChipsProps {
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export function TagFilterChips({
  tags,
  selectedTag,
  onSelectTag,
}: TagFilterChipsProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      <div className="flex items-center gap-1 text-xs text-zinc-500 mr-1 shrink-0">
        <Tag className="w-3 h-3" />
        <span>標籤：</span>
      </div>

      {tags.map((tag) => {
        const isSelected = selectedTag === tag;
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onSelectTag(isSelected ? null : tag)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
              isSelected
                ? "bg-amber-500/25 text-amber-200 border border-amber-500/40 shadow-sm"
                : "bg-white/[0.02] hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 border border-white/5"
            }`}
          >
            <span>#{tag}</span>
            {isSelected && <X className="w-3 h-3 ml-0.5 opacity-70" />}
          </button>
        );
      })}

      {selectedTag && (
        <button
          type="button"
          onClick={() => onSelectTag(null)}
          className="text-[11px] text-zinc-500 hover:text-amber-400 underline ml-2 cursor-pointer"
        >
          清除標籤
        </button>
      )}
    </div>
  );
}

export default TagFilterChips;
