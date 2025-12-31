/**
 * 进度仪表盘组件 - 显示写作统计、热力图、完成度
 */

"use client";

import { useMemo } from "react";
import { ChapterSummary } from "@/lib/types";
import {
  TrendingUp,
  FileText,
  CheckCircle2,
  Clock,
  Target,
  Zap,
} from "lucide-react";

interface ProgressDashboardProps {
  chapters: ChapterSummary[];
  targetWordCount?: number;
  targetChapterCount?: number;
  createdAt?: string; // 新增：小说创建时间
}

export function ProgressDashboard({
  chapters,
  targetWordCount = 100000,
  targetChapterCount = 20,
  createdAt,
}: ProgressDashboardProps) {
  // 真实热力图数据 (基于章节更新时间)
  const heatmapData = useMemo(() => {
    // 1. 确定统计的起始日期
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 如果有创建时间，且创建时间在 30 天内，则从创建日开始；否则统计最近 30 天
    const createdDate = createdAt ? new Date(createdAt) : new Date();
    createdDate.setHours(0, 0, 0, 0);
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // 起始日期取 max(创建日期, 30天前)
    const startDate = createdDate > thirtyDaysAgo ? createdDate : thirtyDaysAgo;

    // 计算总天数 (包含今天)
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // 生成日期数组
    const result: { date: string; words: number; level: number; fullDate: string; timestamp: number }[] = [];
    for (let i = 0; i < diffDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
      result.push({ 
        date: dateStr, 
        words: 0, 
        level: 0, 
        fullDate: d.toDateString(),
        timestamp: d.getTime() 
      });
    }

    // 2. 遍历章节，将字数累加到对应的 created_at 日期
    chapters.forEach(chapter => {
      if (!chapter.created_at) return;
      const createDate = new Date(chapter.created_at);
      createDate.setHours(0, 0, 0, 0);

      const dayEntry = result.find(r => r.timestamp === createDate.getTime());
      if (dayEntry) {
         dayEntry.words += chapter.word_count;
      }
    });

    // 3. 计算等级
    return result.map(day => {
      let level = 0;
      if (day.words > 0) {
        if (day.words < 500) level = 1;
        else if (day.words < 2000) level = 2;
        else if (day.words < 5000) level = 3;
        else level = 4;
      }
      return { ...day, level };
    });
  }, [chapters, createdAt]);

  // 计算统计数据
  const stats = useMemo(() => {
    const totalWords = chapters.reduce((sum, c) => sum + c.word_count, 0);
    const totalChapters = chapters.length;
    const completedChapters = chapters.filter((c) => c.word_count >= 3000).length;
    const branchChapters = chapters.filter((c) => c.is_branch).length;

    const wordProgress = Math.min(100, (totalWords / targetWordCount) * 100);
    const chapterProgress = Math.min(
      100,
      (totalChapters / targetChapterCount) * 100
    );

    return {
      totalWords,
      totalChapters,
      completedChapters,
      branchChapters,
      wordProgress,
      chapterProgress,
    };
  }, [chapters, targetWordCount, targetChapterCount]);

  return (
    <div className="space-y-6">
      {/* 核心指标卡片 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 总字数 */}
        <div className="glass rounded-2xl p-5 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-600">总字数</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {stats.totalWords.toLocaleString()}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${stats.wordProgress}%` }}
              />
            </div>
            <span className="font-bold text-purple-600">
              {stats.wordProgress.toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            目标 {targetWordCount.toLocaleString()} 字
          </p>
        </div>

        {/* 章节数 */}
        <div className="glass rounded-2xl p-5 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-600">章节进度</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {stats.totalChapters} / {targetChapterCount}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${stats.chapterProgress}%` }}
              />
            </div>
            <span className="font-bold text-blue-600">
              {stats.chapterProgress.toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            已完成 {stats.completedChapters} 章
          </p>
        </div>

        {/* 分支章节 */}
        <div className="glass rounded-2xl p-5 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-600">分支章节</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.branchChapters}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            占总章节 {((stats.branchChapters / stats.totalChapters) * 100 || 0).toFixed(0)}%
          </p>
        </div>

        {/* 平均字数 */}
        <div className="glass rounded-2xl p-5 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-600">平均字数</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalChapters > 0
              ? Math.floor(stats.totalWords / stats.totalChapters).toLocaleString()
              : 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">每章平均字数</p>
        </div>
      </div>

      {/* 写作热力图 */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">写作活动</h3>
            <p className="text-sm text-gray-500">最近 30 天</p>
          </div>
        </div>

        {/* 热力图网格 */}
        <div className="flex flex-wrap gap-1.5">
          {heatmapData.map((day, index) => (
            <div
              key={index}
              className="group relative w-8 h-8 rounded-md transition-all duration-200 hover:scale-110 hover:shadow-lg cursor-pointer"
              style={{
                backgroundColor:
                  day.level === 0
                    ? "#f3f4f6"
                    : day.level === 1
                    ? "#ddd6fe"
                    : day.level === 2
                    ? "#c4b5fd"
                    : day.level === 3
                    ? "#a78bfa"
                    : "#8b5cf6",
              }}
              title={`${day.date}: 活跃涉及约 ${day.words} 字`}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900/90 backdrop-blur-sm text-white text-[10px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl border border-white/10">
                {day.date} · 活跃 {day.words} 字
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900/90" />
              </div>
            </div>
          ))}
        </div>

        {/* 图例 */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/40">
          <span className="text-xs text-gray-500">少</span>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className="w-6 h-6 rounded-md"
                style={{
                  backgroundColor:
                    level === 0
                      ? "#f3f4f6"
                      : level === 1
                      ? "#ddd6fe"
                      : level === 2
                      ? "#c4b5fd"
                      : level === 3
                      ? "#a78bfa"
                      : "#8b5cf6",
                }}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">多</span>
        </div>
      </div>

      {/* 章节完成度列表 */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">章节完成度</h3>
            <p className="text-sm text-gray-500">
              {stats.completedChapters} / {stats.totalChapters} 章已达标（3000字）
            </p>
          </div>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
          {chapters.map((chapter, index) => {
            const progress = Math.min(100, (chapter.word_count / 3000) * 100);
            const isCompleted = progress >= 100;

            return (
              <div
                key={chapter.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/60 transition-colors"
              >
                {/* 序号 */}
                <span className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-100 text-gray-600 font-bold text-sm flex items-center justify-center">
                  {index + 1}
                </span>

                {/* 标题 */}
                <span className="flex-1 text-sm font-medium text-gray-900 truncate">
                  {chapter.title}
                </span>

                {/* 进度条 */}
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted
                          ? "bg-gradient-to-r from-green-500 to-green-600"
                          : "bg-gradient-to-r from-purple-500 to-purple-600"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-600 w-12 text-right">
                    {progress.toFixed(0)}%
                  </span>
                </div>

                {/* 完成标识 */}
                {isCompleted && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
