/**
 * 章节列表组件 - 重新设计版
 * 特点：大气、宽敞、专业
 */

"use client";

import { Plus, FileText, Trash2, GripVertical } from "lucide-react";
import { ChapterListProps } from "@/lib/types";

export function ChapterList({
  chapters,
  currentChapterId,
  novelId,
  onChapterClick,
  onChapterCreate,
  onChapterDelete,
}: ChapterListProps) {
  return (
    <div className="glass rounded-ios-2xl flex flex-col overflow-hidden flex-1">
      {/* 标题栏 */}
      <div className="p-6 border-b border-white/40">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">章节目录</h2>
          <button
            onClick={onChapterCreate}
            className="w-10 h-10 rounded-ios-lg bg-purple-500 flex items-center justify-center hover:bg-purple-600 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
            title="新建章节"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
        <p className="text-sm text-gray-500">共 {chapters.length} 章</p>
      </div>

      {/* 章节列表 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {chapters.length === 0 ? (
          /* 空状态 */
          <div className="text-center py-12 px-6">
            <FileText className="w-14 h-14 mx-auto mb-4 text-gray-300" />
            <p className="text-base text-gray-500 mb-4">暂无章节</p>
            <button
              onClick={onChapterCreate}
              className="text-purple-600 text-base font-medium hover:underline"
            >
              创建第一章
            </button>
          </div>
        ) : (
          /* 章节列表 */
          <div className="space-y-3">
            {chapters.map((chapter, index) => {
              const isActive = currentChapterId === chapter.id;
              return (
                <div
                  key={chapter.id}
                  className={`group relative flex items-start p-6 rounded-ios-xl cursor-pointer transition-all duration-300 ${
                    isActive
                      ? "bg-purple-50 text-purple-900 shadow-lg scale-[1.02] border-l-4 border-purple-500"
                      : "bg-white hover:bg-purple-50/50 hover:shadow-md hover:scale-[1.01] border border-transparent hover:border-purple-200"
                  }`}
                  onClick={() => onChapterClick(chapter.id)}
                >
                  {/* 左侧色条（选中状态） */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-purple-600 rounded-l-ios-xl" />
                  )}

                  {/* 拖拽图标 */}
                  <GripVertical
                    className={`w-5 h-5 mr-3 transition-opacity cursor-grab flex-shrink-0 mt-1 ${
                      isActive
                        ? "text-purple-400 opacity-60"
                        : "text-gray-300 opacity-0 group-hover:opacity-100"
                    }`}
                  />

                  {/* 章节信息 */}
                  <div className="flex-1 min-w-0">
                    {/* 顶部：序号 + 标题 */}
                    <div className="flex items-start gap-3 mb-3">
                      {/* 序号徽章 */}
                      <span
                        className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-base font-bold transition-all duration-200 ${
                          isActive
                            ? "bg-purple-500 text-white shadow-md"
                            : "bg-gray-100 text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-600"
                        }`}
                      >
                        {index + 1}
                      </span>

                      {/* 标题 */}
                      <h3
                        className={`flex-1 font-bold text-lg leading-snug line-clamp-3 group-hover:line-clamp-none transition-all ${
                          isActive
                            ? "text-purple-900"
                            : "text-gray-900 group-hover:text-purple-700"
                        }`}
                        title={chapter.title}
                      >
                        {chapter.title}
                      </h3>
                    </div>

                    {/* 底部：元数据 */}
                    <div className="flex flex-wrap items-center gap-3 ml-13 text-base">
                      {/* 字数 */}
                      <span
                        className={`font-semibold ${
                          isActive ? "text-purple-700" : "text-gray-600"
                        }`}
                      >
                        {chapter.word_count.toLocaleString()} 字
                      </span>

                      {/* 分支标识 */}
                      {chapter.is_branch && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-bold text-sm">
                            🌿 分支
                          </span>
                        </>
                      )}

                      {/* 选择文本 */}
                      {chapter.parent_chapter_id && chapter.choice_text && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span
                            className={`font-medium text-base truncate max-w-[200px] ${
                              isActive ? "text-purple-600" : "text-gray-500"
                            }`}
                            title={chapter.choice_text}
                          >
                            ↳ {chapter.choice_text}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 删除按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`确定要删除章节「${chapter.title}」吗？`)) {
                        onChapterDelete(chapter.id);
                      }
                    }}
                    className={`w-9 h-9 rounded-ios-lg flex items-center justify-center hover:bg-red-100 transition-all duration-200 flex-shrink-0 ml-2 ${
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                    title="删除章节"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
