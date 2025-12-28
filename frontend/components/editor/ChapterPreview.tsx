/**
 * 章节缩略预览组件 - 暂时禁用
 */

"use client";

import { ChapterSummary } from "@/lib/types";

interface ChapterPreviewProps {
  chapter: ChapterSummary;
  children: React.ReactNode;
  fullContent?: string;
}

export function ChapterPreview({ children }: ChapterPreviewProps) {
  return <>{children}</>;
}
