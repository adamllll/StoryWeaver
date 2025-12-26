/**
 * 批量格式优化弹窗
 * 支持选择多个章节进行批量优化，显示进度和单独预览
 */

"use client";

import { useState } from "react";
import { Check, X, Loader2, Eye, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { ChapterSummary } from "@/lib/types";

interface OptimizationResult {
  chapterId: number;
  status: "pending" | "processing" | "success" | "error";
  originalContent?: string;
  optimizedContent?: string;
  changesSummary?: string;
  error?: string;
}

interface BatchOptimizeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: ChapterSummary[];
  onOptimize: (chapterIds: number[]) => Promise<void>;
  onPreview: (chapterId: number) => void;
}

export function BatchOptimizeDialog({
  isOpen,
  onClose,
  chapters,
  onOptimize,
  onPreview,
}: BatchOptimizeDialogProps) {
  const [selectedChapters, setSelectedChapters] = useState<number[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [results, setResults] = useState<OptimizationResult[]>([]);
  const [currentStep, setCurrentStep] = useState<"select" | "processing" | "complete">("select");

  // 切换章节选择
  const toggleChapter = (chapterId: number) => {
    setSelectedChapters((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  // 全选/取消全选
  const toggleAll = () => {
    if (selectedChapters.length === chapters.length) {
      setSelectedChapters([]);
    } else {
      setSelectedChapters(chapters.map((c) => c.id));
    }
  };

  // 开始批量优化
  const handleStartOptimize = async () => {
    if (selectedChapters.length === 0) return;

    setIsOptimizing(true);
    setCurrentStep("processing");

    // 初始化结果
    const initialResults: OptimizationResult[] = selectedChapters.map((id) => ({
      chapterId: id,
      status: "pending",
    }));
    setResults(initialResults);

    try {
      await onOptimize(selectedChapters);
      setCurrentStep("complete");
    } catch (error) {
      console.error("批量优化失败:", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  // 计算进度
  const progress = results.length > 0
    ? (results.filter((r) => r.status === "success" || r.status === "error").length / results.length) * 100
    : 0;

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>批量格式优化</DialogTitle>
          <DialogDescription>
            {currentStep === "select" && "选择需要优化的章节"}
            {currentStep === "processing" && "正在优化章节格式..."}
            {currentStep === "complete" && "优化完成"}
          </DialogDescription>
        </DialogHeader>

        {/* 选择章节阶段 */}
        {currentStep === "select" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedChapters.length === chapters.length}
                  onCheckedChange={toggleAll}
                  id="select-all"
                />
                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                  全选 ({selectedChapters.length}/{chapters.length})
                </label>
              </div>
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-4 space-y-2">
                {chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedChapters.includes(chapter.id)}
                      onCheckedChange={() => toggleChapter(chapter.id)}
                      id={`chapter-${chapter.id}`}
                    />
                    <label
                      htmlFor={`chapter-${chapter.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium text-sm">{chapter.title}</div>
                      <div className="text-xs text-gray-500">
                        {chapter.word_count} 字
                        {chapter.is_branch && (
                          <span className="ml-2 text-purple-600">分支章节</span>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* 处理中阶段 */}
        {currentStep === "processing" && (
          <div className="flex-1 flex flex-col py-8">
            <div className="text-center mb-6">
              <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">正在优化章节格式</p>
              <p className="text-sm text-gray-500">
                已完成 {successCount + errorCount} / {results.length} 个章节
              </p>
            </div>

            <Progress value={progress} className="mb-6" />

            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-4 space-y-2">
                {results.map((result) => {
                  const chapter = chapters.find((c) => c.id === result.chapterId);
                  return (
                    <div
                      key={result.chapterId}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                    >
                      {result.status === "pending" && (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                      {result.status === "processing" && (
                        <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                      )}
                      {result.status === "success" && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {result.status === "error" && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{chapter?.title}</div>
                        {result.error && (
                          <div className="text-xs text-red-600">{result.error}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* 完成阶段 */}
        {currentStep === "complete" && (
          <div className="flex-1 flex flex-col py-8">
            <div className="text-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">优化完成</p>
              <p className="text-sm text-gray-500">
                成功 {successCount} 个，失败 {errorCount} 个
              </p>
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-4 space-y-2">
                {results.map((result) => {
                  const chapter = chapters.find((c) => c.id === result.chapterId);
                  return (
                    <div
                      key={result.chapterId}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                    >
                      {result.status === "success" && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {result.status === "error" && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{chapter?.title}</div>
                        {result.changesSummary && (
                          <div className="text-xs text-gray-600 mt-1">
                            {result.changesSummary}
                          </div>
                        )}
                        {result.error && (
                          <div className="text-xs text-red-600 mt-1">{result.error}</div>
                        )}
                      </div>
                      {result.status === "success" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onPreview(result.chapterId)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          预览
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter className="gap-2">
          {currentStep === "select" && (
            <>
              <Button variant="outline" onClick={onClose}>
                <X className="w-4 h-4 mr-2" />
                取消
              </Button>
              <Button
                onClick={handleStartOptimize}
                disabled={selectedChapters.length === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Check className="w-4 h-4 mr-2" />
                开始优化 ({selectedChapters.length})
              </Button>
            </>
          )}
          {currentStep === "processing" && (
            <Button variant="outline" disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              优化中...
            </Button>
          )}
          {currentStep === "complete" && (
            <Button onClick={onClose} className="bg-purple-600 hover:bg-purple-700">
              <Check className="w-4 h-4 mr-2" />
              完成
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
