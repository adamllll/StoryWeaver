/**
 * useAutoSave Hook 单元测试
 * 测试自动保存功能的核心逻辑
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSave } from '@/hooks/useAutoSave';

// Mock chaptersApi
jest.mock('@/lib/api', () => ({
  chaptersApi: {
    update: jest.fn(),
  },
}));

// Mock toast
const mockToast = jest.fn();
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

import { chaptersApi } from '@/lib/api';

describe('useAutoSave', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('should initialize with saved status', () => {
    const { result } = renderHook(() =>
      useAutoSave({
        novelId: 1,
        chapterId: 1,
        content: 'Initial content',
        title: 'Test Title',
      })
    );

    expect(result.current.saveStatus).toBe('saved');
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('should mark as unsaved when content changes', () => {
    const { result, rerender } = renderHook(
      ({ content }) =>
        useAutoSave({
          novelId: 1,
          chapterId: 1,
          content,
          title: 'Test Title',
        }),
      { initialProps: { content: 'Initial' } }
    );

    expect(result.current.saveStatus).toBe('saved');

    // 修改内容
    rerender({ content: 'Modified' });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.saveStatus).toBe('unsaved');
    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('should auto-save after delay', async () => {
    (chaptersApi.update as jest.Mock).mockResolvedValue({});

    const { result, rerender } = renderHook(
      ({ content }) =>
        useAutoSave({
          novelId: 1,
          chapterId: 1,
          content,
          title: 'Test Title',
        }),
      { initialProps: { content: 'Initial' } }
    );

    // 修改内容
    rerender({ content: 'Modified' });

    // 等待防抖延迟（2秒）
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.saveStatus).toBe('saved');
    });

    expect(chaptersApi.update).toHaveBeenCalledWith(1, 1, {
      content: 'Modified',
      title: 'Test Title',
    });
  });

  it('should save to localStorage as backup', async () => {
    (chaptersApi.update as jest.Mock).mockResolvedValue({});

    const { rerender } = renderHook(
      ({ content }) =>
        useAutoSave({
          novelId: 1,
          chapterId: 1,
          content,
          title: 'Test Title',
        }),
      { initialProps: { content: 'Initial' } }
    );

    // 修改内容
    rerender({ content: 'Modified content for backup' });

    // 等待防抖延迟
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      const backup = localStorage.getItem('chapter-backup-1');
      expect(backup).toBeTruthy();
      if (backup) {
        const parsed = JSON.parse(backup);
        expect(parsed.content).toBe('Modified content for backup');
      }
    });
  });

  it('should handle save errors gracefully', async () => {
    (chaptersApi.update as jest.Mock).mockRejectedValue(new Error('Save failed'));

    const { result, rerender } = renderHook(
      ({ content }) =>
        useAutoSave({
          novelId: 1,
          chapterId: 1,
          content,
          title: 'Test Title',
        }),
      { initialProps: { content: 'Initial' } }
    );

    // 修改内容
    rerender({ content: 'Modified' });

    // 等待防抖延迟
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      // 保存失败后状态应该是 unsaved
      expect(result.current.saveStatus).toBe('unsaved');
    });

    // 应该显示错误提示
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '保存失败',
        variant: 'destructive',
      })
    );
  });

  it('should manually save when requested', async () => {
    (chaptersApi.update as jest.Mock).mockResolvedValue(undefined);

    const { result, rerender } = renderHook(
      ({ content }) =>
        useAutoSave({
          novelId: 1,
          chapterId: 1,
          content,
          title: 'Test Title',
        }),
      { initialProps: { content: 'Initial' } }
    );

    // 修改内容使其变为 unsaved
    rerender({ content: 'Modified content' });

    await act(async () => {
      await result.current.saveNow();
    });

    expect(chaptersApi.update).toHaveBeenCalledWith(1, 1, {
      content: 'Modified content',
      title: 'Test Title',
    });
    expect(result.current.saveStatus).toBe('saved');
  });

  it('should not save when chapterId is null', async () => {
    const { result } = renderHook(() =>
      useAutoSave({
        novelId: 1,
        chapterId: null,
        content: 'Test content',
        title: 'Test Title',
      })
    );

    await act(async () => {
      await result.current.saveNow();
    });

    expect(chaptersApi.update).not.toHaveBeenCalled();
  });

  it('should not save when content has not changed', async () => {
    const { result } = renderHook(() =>
      useAutoSave({
        novelId: 1,
        chapterId: 1,
        content: 'Same content',
        title: 'Same Title',
      })
    );

    await act(async () => {
      await result.current.saveNow();
    });

    // 内容没有变化，不应该调用 API
    expect(chaptersApi.update).not.toHaveBeenCalled();
    expect(result.current.saveStatus).toBe('saved');
  });

  it('should check local backup', () => {
    // 设置备份
    const backupData = {
      content: 'Backup content',
      title: 'Backup Title',
      timestamp: Date.now(),
    };
    localStorage.setItem('chapter-backup-1', JSON.stringify(backupData));

    const { result } = renderHook(() =>
      useAutoSave({
        novelId: 1,
        chapterId: 1,
        content: 'Current content',
        title: 'Current Title',
      })
    );

    const backup = result.current.checkLocalBackup();
    expect(backup).toBeTruthy();
    if (backup) {
      const parsed = JSON.parse(backup);
      expect(parsed.content).toBe('Backup content');
    }
  });

  it('should clear backup', () => {
    // 设置备份
    localStorage.setItem('chapter-backup-1', JSON.stringify({ content: 'test' }));

    const { result } = renderHook(() =>
      useAutoSave({
        novelId: 1,
        chapterId: 1,
        content: 'Current content',
        title: 'Current Title',
      })
    );

    act(() => {
      result.current.clearBackup();
    });

    expect(localStorage.getItem('chapter-backup-1')).toBeNull();
  });

  it('should call onSaveSuccess callback after successful save', async () => {
    (chaptersApi.update as jest.Mock).mockResolvedValue({});
    const onSaveSuccess = jest.fn();

    const { result, rerender } = renderHook(
      ({ content }) =>
        useAutoSave({
          novelId: 1,
          chapterId: 1,
          content,
          title: 'Test Title',
          onSaveSuccess,
        }),
      { initialProps: { content: 'Initial' } }
    );

    // 修改内容
    rerender({ content: 'Modified' });

    await act(async () => {
      await result.current.saveNow();
    });

    expect(onSaveSuccess).toHaveBeenCalled();
  });

  it('should respect enabled flag', async () => {
    (chaptersApi.update as jest.Mock).mockResolvedValue({});

    const { result, rerender } = renderHook(
      ({ content, enabled }) =>
        useAutoSave({
          novelId: 1,
          chapterId: 1,
          content,
          title: 'Test Title',
          enabled,
        }),
      { initialProps: { content: 'Initial', enabled: false } }
    );

    // 修改内容
    rerender({ content: 'Modified', enabled: false });

    // 等待防抖延迟
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    // 禁用时不应该自动保存
    expect(chaptersApi.update).not.toHaveBeenCalled();
  });
});
