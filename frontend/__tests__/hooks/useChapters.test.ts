/**
 * useChapters Hook 单元测试
 * 测试章节管理功能的核心逻辑
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useChapters } from '@/hooks/useChapters';
import type { Chapter, ChapterSummary } from '@/lib/types';

// Mock chaptersApi
jest.mock('@/lib/api', () => ({
  chaptersApi: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    reorder: jest.fn(),
  },
  ApiError: class ApiError extends Error {
    detail: string;
    constructor(status: number, detail: string) {
      super(detail);
      this.detail = detail;
    }
  },
}));

// Mock toast
const mockToast = jest.fn();
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

import { chaptersApi, ApiError } from '@/lib/api';

const mockChapter: Chapter = {
  id: 1,
  novel_id: 1,
  title: 'Chapter 1',
  content: 'Content 1',
  order_num: 1,
  is_branch: false,
  word_count: 100,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  navigation: {},
};

describe('useChapters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createChapter', () => {
    it('should create a new chapter successfully', async () => {
      const newChapter: Chapter = {
        ...mockChapter,
        id: 3,
        title: 'Chapter 3',
        content: 'Content 3',
      };

      (chaptersApi.create as jest.Mock).mockResolvedValue(newChapter);
      const onChapterUpdate = jest.fn();

      const { result } = renderHook(() =>
        useChapters({ novelId: 1, onChapterUpdate })
      );

      let createdChapter: Chapter | null = null;
      await act(async () => {
        createdChapter = await result.current.createChapter({
          title: 'Chapter 3',
          content: 'Content 3',
        });
      });

      expect(chaptersApi.create).toHaveBeenCalledWith(1, {
        title: 'Chapter 3',
        content: 'Content 3',
      });
      expect(createdChapter).toEqual(newChapter);
      expect(onChapterUpdate).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '章节创建成功',
        })
      );
    });

    it('should handle create error', async () => {
      const error = new ApiError(400, '创建失败');
      (chaptersApi.create as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useChapters({ novelId: 1 }));

      let createdChapter: Chapter | null = null;
      await act(async () => {
        createdChapter = await result.current.createChapter({
          title: 'Test',
        });
      });

      expect(createdChapter).toBeNull();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '创建失败',
          variant: 'destructive',
        })
      );
    });
  });

  describe('updateChapter', () => {
    it('should update a chapter successfully', async () => {
      const updatedChapter: Chapter = {
        ...mockChapter,
        title: 'Updated Title',
        content: 'Updated Content',
      };

      (chaptersApi.update as jest.Mock).mockResolvedValue(updatedChapter);
      const onChapterUpdate = jest.fn();

      const { result } = renderHook(() =>
        useChapters({ novelId: 1, onChapterUpdate })
      );

      let success = false;
      await act(async () => {
        success = await result.current.updateChapter(1, {
          title: 'Updated Title',
          content: 'Updated Content',
        });
      });

      expect(chaptersApi.update).toHaveBeenCalledWith(1, 1, {
        title: 'Updated Title',
        content: 'Updated Content',
      });
      expect(success).toBe(true);
      expect(onChapterUpdate).toHaveBeenCalled();
    });

    it('should handle update error', async () => {
      const error = new ApiError(400, '更新失败');
      (chaptersApi.update as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useChapters({ novelId: 1 }));

      let success = false;
      await act(async () => {
        success = await result.current.updateChapter(1, {
          title: 'Test',
        });
      });

      expect(success).toBe(false);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '更新失败',
          variant: 'destructive',
        })
      );
    });
  });

  describe('deleteChapter', () => {
    it('should delete a chapter successfully', async () => {
      (chaptersApi.delete as jest.Mock).mockResolvedValue(undefined);
      const onChapterUpdate = jest.fn();

      const { result } = renderHook(() =>
        useChapters({ novelId: 1, onChapterUpdate })
      );

      let success = false;
      await act(async () => {
        success = await result.current.deleteChapter(1);
      });

      expect(chaptersApi.delete).toHaveBeenCalledWith(1, 1);
      expect(success).toBe(true);
      expect(onChapterUpdate).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '章节已删除',
        })
      );
    });

    it('should handle delete error', async () => {
      const error = new ApiError(400, '删除失败');
      (chaptersApi.delete as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useChapters({ novelId: 1 }));

      let success = false;
      await act(async () => {
        success = await result.current.deleteChapter(1);
      });

      expect(success).toBe(false);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '删除失败',
          variant: 'destructive',
        })
      );
    });
  });

  describe('reorderChapters', () => {
    it('should reorder chapters successfully', async () => {
      (chaptersApi.reorder as jest.Mock).mockResolvedValue(undefined);
      const onChapterUpdate = jest.fn();

      const { result } = renderHook(() =>
        useChapters({ novelId: 1, onChapterUpdate })
      );

      let success = false;
      await act(async () => {
        success = await result.current.reorderChapters([2, 1, 3]);
      });

      expect(chaptersApi.reorder).toHaveBeenCalledWith(1, [2, 1, 3]);
      expect(success).toBe(true);
      expect(onChapterUpdate).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '排序成功',
        })
      );
    });

    it('should handle reorder error', async () => {
      const error = new ApiError(400, '排序失败');
      (chaptersApi.reorder as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useChapters({ novelId: 1 }));

      let success = false;
      await act(async () => {
        success = await result.current.reorderChapters([2, 1]);
      });

      expect(success).toBe(false);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '排序失败',
          variant: 'destructive',
        })
      );
    });
  });

  describe('createBranches', () => {
    it('should create branch chapters successfully', async () => {
      const branchChapter: Chapter = {
        ...mockChapter,
        id: 4,
        title: 'Branch 1',
        is_branch: true,
        parent_chapter_id: 1,
      };

      (chaptersApi.create as jest.Mock).mockResolvedValue(branchChapter);
      const onChapterUpdate = jest.fn();

      const { result } = renderHook(() =>
        useChapters({ novelId: 1, onChapterUpdate })
      );

      const branchData = [
        {
          title: 'Branch 1',
          parent_chapter_id: 1,
          choice_text: '选择A',
          order_num: 1.1,
        },
        {
          title: 'Branch 2',
          parent_chapter_id: 1,
          choice_text: '选择B',
          order_num: 1.2,
        },
      ];

      let createdBranches: Chapter[] = [];
      await act(async () => {
        createdBranches = await result.current.createBranches(branchData);
      });

      expect(chaptersApi.create).toHaveBeenCalledTimes(2);
      expect(createdBranches).toHaveLength(2);
      expect(onChapterUpdate).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '分支创建成功',
        })
      );
    });

    it('should handle branch creation error', async () => {
      const error = new ApiError(400, '分支创建失败');
      (chaptersApi.create as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useChapters({ novelId: 1 }));

      const branchData = [
        {
          title: 'Branch 1',
          parent_chapter_id: 1,
          choice_text: '选择A',
          order_num: 1.1,
        },
      ];

      let createdBranches: Chapter[] = [];
      await act(async () => {
        createdBranches = await result.current.createBranches(branchData);
      });

      expect(createdBranches).toEqual([]);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '分支创建失败',
          variant: 'destructive',
        })
      );
    });
  });

  describe('getNextOrderNum', () => {
    it('should calculate next order number correctly', () => {
      const { result } = renderHook(() => useChapters({ novelId: 1 }));

      const chapters: ChapterSummary[] = [
        { id: 1, title: 'Ch1', order_num: 1, is_branch: false, word_count: 100 },
        { id: 2, title: 'Ch2', order_num: 2, is_branch: false, word_count: 100 },
      ];

      const nextOrder = result.current.getNextOrderNum(chapters, 1);

      // 当前有 order_num 1 的章节，下一个分支应该是 1.1
      expect(nextOrder).toBeCloseTo(1.1, 1);
    });

    it('should handle existing branches', () => {
      const { result } = renderHook(() => useChapters({ novelId: 1 }));

      const chapters: ChapterSummary[] = [
        { id: 1, title: 'Ch1', order_num: 1, is_branch: false, word_count: 100 },
        { id: 2, title: 'Branch1', order_num: 1.1, is_branch: true, word_count: 100 },
        { id: 3, title: 'Branch2', order_num: 1.2, is_branch: true, word_count: 100 },
      ];

      const nextOrder = result.current.getNextOrderNum(chapters, 1);

      // 已有 1.1 和 1.2，下一个应该是 1.3
      expect(nextOrder).toBeCloseTo(1.3, 1);
    });
  });

  describe('isLoading state', () => {
    it('should set isLoading during operations', async () => {
      let resolvePromise: (value: Chapter) => void;
      const promise = new Promise<Chapter>((resolve) => {
        resolvePromise = resolve;
      });
      (chaptersApi.create as jest.Mock).mockReturnValue(promise);

      const { result } = renderHook(() => useChapters({ novelId: 1 }));

      expect(result.current.isLoading).toBe(false);

      // 开始创建
      let createPromise: Promise<Chapter | null>;
      act(() => {
        createPromise = result.current.createChapter({ title: 'Test' });
      });

      // 应该正在加载
      expect(result.current.isLoading).toBe(true);

      // 完成创建
      await act(async () => {
        resolvePromise!(mockChapter);
        await createPromise;
      });

      // 加载完成
      expect(result.current.isLoading).toBe(false);
    });
  });
});
