/**
 * 章节过滤面板 - 标签、搜索、排序
 */

"use client";

import { useState } from "react";
import { Search, X, Filter, SortAsc } from "lucide-react";
import { ChapterSummary } from "@/lib/types";

interface ChapterFilterProps {
  chapters: ChapterSummary[];
  onFilterChange: (filteredChapters: ChapterSummary[]) => void;
}

type TagType = "all" | "branch" | "main" | "completed" | "draft";
type SortType = "order" | "wordCount" | "recent";

export function ChapterFilter({
  chapters,
  onFilterChange,
}: ChapterFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<TagType[]>(["all"]);
  const [sortBy, setSortBy] = useState<SortType>("order");

  // 标签定义
  const tags: { value: TagType; label: string; color: string }[] = [
    { value: "all", label: "全部", color: "bg-gray-100 text-gray-700" },
    {
      value: "branch",
      label: "分支章节",
      color: "bg-amber-100 text-amber-700",
    },
    { value: "main", label: "主线章节", color: "bg-blue-100 text-blue-700" },
    {
      value: "completed",
      label: "已完成",
      color: "bg-green-100 text-green-700",
    },
    { value: "draft", label: "草稿", color: "bg-purple-100 text-purple-700" },
  ];

  // 排序选项
  const sortOptions: { value: SortType; label: string }[] = [
    { value: "order", label: "默认顺序" },
    { value: "wordCount", label: "字数排序" },
    { value: "recent", label: "最近更新" },
  ];

  // 过滤和排序逻辑
  const filterAndSort = () => {
    let filtered = [...chapters];

    // 搜索过滤
    if (searchQuery.trim()) {
      filtered = filtered.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 标签过滤
    if (!selectedTags.includes("all")) {
      filtered = filtered.filter((c) => {
        if (selectedTags.includes("branch") && c.is_branch) return true;
        if (selectedTags.includes("main") && !c.is_branch) return true;
        if (selectedTags.includes("completed") && c.word_count >= 3000)
          return true;
        if (selectedTags.includes("draft") && c.word_count < 3000) return true;
        return false;
      });
    }

    // 排序
    if (sortBy === "wordCount") {
      filtered.sort((a, b) => b.word_count - a.word_count);
    } else if (sortBy === "recent") {
      // ChapterSummary 没有 created_at，使用 order_num 倒序（最新的章节 order_num 更大）
      filtered.sort((a, b) => b.order_num - a.order_num);
    } else {
      filtered.sort((a, b) => a.order_num - b.order_num);
    }

    onFilterChange(filtered);
  };

  // 标签切换
  const toggleTag = (tag: TagType) => {
    if (tag === "all") {
      setSelectedTags(["all"]);
    } else {
      const newTags = selectedTags.filter((t) => t !== "all");
      if (selectedTags.includes(tag)) {
        const filtered = newTags.filter((t) => t !== tag);
        setSelectedTags(filtered.length === 0 ? ["all"] : filtered);
      } else {
        setSelectedTags([...newTags, tag]);
      }
    }
  };

  // 应用过滤
  const applyFilter = () => {
    filterAndSort();
  };

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilter()}
          placeholder="搜索章节标题..."
          className="w-full pl-12 pr-12 py-3 bg-white/60 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              applyFilter();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* 标签过滤 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">筛选标签</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.value}
              onClick={() => toggleTag(tag.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedTags.includes(tag.value)
                  ? tag.color + " ring-2 ring-offset-1 ring-current scale-105"
                  : "bg-white/60 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tag.label}
              {tag.value !== "all" && (
                <span className="ml-1.5 opacity-75">
                  (
                  {tag.value === "branch"
                    ? chapters.filter((c) => c.is_branch).length
                    : tag.value === "main"
                    ? chapters.filter((c) => !c.is_branch).length
                    : tag.value === "completed"
                    ? chapters.filter((c) => c.word_count >= 3000).length
                    : chapters.filter((c) => c.word_count < 3000).length}
                  )
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 排序 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <SortAsc className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">排序方式</span>
        </div>
        <div className="flex gap-2">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value)}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                sortBy === option.value
                  ? "bg-purple-500 text-white shadow-lg scale-105"
                  : "bg-white/60 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 应用按钮 */}
      <button
        onClick={applyFilter}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
      >
        应用筛选
      </button>

      {/* 结果统计 */}
      <div className="text-center text-sm text-gray-500 pt-2 border-t border-white/40">
        共 {chapters.length} 章节
        {searchQuery && ` · 搜索"${searchQuery}"`}
      </div>
    </div>
  );
}
