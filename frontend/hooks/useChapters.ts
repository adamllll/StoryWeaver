/**
 * 章节管理 Hook
 * 封装章节 CRUD 逻辑，简化组件复杂度
 */

import { useState, useCallback } from "react";
import { chaptersApi, ApiError } from "@/lib/api";
import { Chapter, ChapterSummary } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";

interface UseChaptersOptions {
  novelId: number;
  onChapterUpdate?: () => void;
}

export function useChapters({ novelId, onChapterUpdate }: UseChaptersOptions) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 创建新章节
   */
  const createChapter = useCallback(
    async (data: {
      title: string;
      content?: string;
      order_num?: number;
      parent_chapter_id?: number;
      choice_text?: string;
    }): Promise<Chapter | null> => {
      setIsLoading(true);
      try {
        const chapter = await chaptersApi.create(novelId, data);
        toast({
          title: "章节创建成功",
          description: `已创建章节：${chapter.title}`,
        });
        onChapterUpdate?.();
        return chapter;
      } catch (error) {
        if (error instanceof ApiError) {
          toast({
            title: "创建失败",
            description: error.detail,
            variant: "destructive",
          });
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [novelId, toast, onChapterUpdate]
  );

  /**
   * 批量创建分支章节
   */
  const createBranches = useCallback(
    async (
      branches: Array<{
        title: string;
        parent_chapter_id: number;
        choice_text: string;
        order_num: number;
      }>
    ): Promise<Chapter[]> => {
      setIsLoading(true);
      try {
        const createdChapters = await Promise.all(
          branches.map((branch) =>
            chaptersApi.create(novelId, {
              ...branch,
              content: "", // 分支章节初始内容为空
            })
          )
        );

        toast({
          title: "分支创建成功",
          description: `已创建 ${createdChapters.length} 个分支章节`,
        });

        onChapterUpdate?.();
        return createdChapters;
      } catch (error) {
        if (error instanceof ApiError) {
          toast({
            title: "分支创建失败",
            description: error.detail,
            variant: "destructive",
          });
        }
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [novelId, toast, onChapterUpdate]
  );

  /**
   * 更新章节内容
   */
  const updateChapter = useCallback(
    async (
      chapterId: number,
      data: { title?: string; content?: string }
    ): Promise<boolean> => {
      setIsLoading(true);
      try {
        await chaptersApi.update(novelId, chapterId, data);
        onChapterUpdate?.();
        return true;
      } catch (error) {
        if (error instanceof ApiError) {
          toast({
            title: "更新失败",
            description: error.detail,
            variant: "destructive",
          });
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [novelId, toast, onChapterUpdate]
  );

  /**
   * 删除章节
   */
  const deleteChapter = useCallback(
    async (chapterId: number): Promise<boolean> => {
      setIsLoading(true);
      try {
        await chaptersApi.delete(novelId, chapterId);
        toast({
          title: "章节已删除",
        });
        onChapterUpdate?.();
        return true;
      } catch (error) {
        if (error instanceof ApiError) {
          toast({
            title: "删除失败",
            description: error.detail,
            variant: "destructive",
          });
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [novelId, toast, onChapterUpdate]
  );

  /**
   * 章节排序
   */
  const reorderChapters = useCallback(
    async (chapterIds: number[]): Promise<boolean> => {
      setIsLoading(true);
      try {
        await chaptersApi.reorder(novelId, chapterIds);
        toast({
          title: "排序成功",
        });
        onChapterUpdate?.();
        return true;
      } catch (error) {
        if (error instanceof ApiError) {
          toast({
            title: "排序失败",
            description: error.detail,
            variant: "destructive",
          });
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [novelId, toast, onChapterUpdate]
  );

  /**
   * 计算下一个可用的 order_num（用于创建分支）
   */
  const getNextOrderNum = useCallback(
    (chapters: ChapterSummary[], parentOrderNum: number): number => {
      // 找出所有以 parentOrderNum 开头的章节
      const siblingBranches = chapters.filter((ch) => {
        const orderStr = ch.order_num.toString();
        const parentStr = parentOrderNum.toString();
        return (
          orderStr.startsWith(parentStr + ".") ||
          orderStr.startsWith(parentStr)
        );
      });

      // 如果没有分支，返回 parent + 0.1
      if (siblingBranches.length === 0) {
        return parentOrderNum + 0.1;
      }

      // 找最大的小数部分
      const maxDecimal = Math.max(
        ...siblingBranches.map((ch) => {
          const decimal = ch.order_num - Math.floor(ch.order_num);
          return decimal;
        })
      );

      // 返回下一个递增的小数
      return parentOrderNum + maxDecimal + 0.1;
    },
    []
  );

  return {
    isLoading,
    createChapter,
    createBranches,
    updateChapter,
    deleteChapter,
    reorderChapters,
    getNextOrderNum,
  };
}
