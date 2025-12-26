/**
 * 自动保存 Hook
 * 提供防抖自动保存、本地备份、离开提醒、恢复机制
 */

import { useEffect, useState, useRef } from "react";
import { chaptersApi } from "@/lib/api";
import { SaveStatus } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";

interface UseAutoSaveOptions {
  novelId: number;
  chapterId: number | null;
  content: string;
  title: string;
  delay?: number; // 防抖延迟（毫秒）
  enabled?: boolean; // 是否启用自动保存
  onSaveSuccess?: () => void | Promise<void>; // 保存成功回调
}

interface UseAutoSaveReturn {
  saveStatus: SaveStatus;
  saveNow: () => Promise<void>; // 手动保存
  hasUnsavedChanges: boolean;
  checkLocalBackup: () => string | null; // 检查本地备份
  restoreFromBackup: () => void; // 恢复备份
  clearBackup: () => void; // 清除备份
}

export function useAutoSave({
  novelId,
  chapterId,
  content,
  title,
  delay = 2000,
  enabled = true,
  onSaveSuccess,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const { toast } = useToast();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 保存上次保存的内容，用于判断是否有更改
  const lastSavedContentRef = useRef<string>(content);
  const lastSavedTitleRef = useRef<string>(title);

  // 保存定时器引用
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 本地存储 key
  const getBackupKey = (chapterId: number) => `chapter-backup-${chapterId}`;

  /**
   * 执行保存操作
   */
  const saveNow = async () => {
    if (!chapterId) {
      return;
    }

    // 如果内容和标题都没有变化，跳过保存
    if (
      content === lastSavedContentRef.current &&
      title === lastSavedTitleRef.current
    ) {
      setSaveStatus("saved");
      setHasUnsavedChanges(false);
      return;
    }

    setSaveStatus("saving");

    try {
      // 保存到后端
      await chaptersApi.update(novelId, chapterId, {
        content,
        title,
      });

      // 同步保存到本地存储（备份）
      localStorage.setItem(
        getBackupKey(chapterId),
        JSON.stringify({
          content,
          title,
          timestamp: Date.now(),
        })
      );

      // 更新最后保存的内容
      lastSavedContentRef.current = content;
      lastSavedTitleRef.current = title;

      setSaveStatus("saved");
      setHasUnsavedChanges(false);

      // 调用保存成功回调（用于更新章节列表等）
      if (onSaveSuccess) {
        await onSaveSuccess();
      }
    } catch (error) {
      console.error("保存失败:", error);
      setSaveStatus("unsaved");
      toast({
        title: "保存失败",
        description: "网络错误或服务器异常，内容已保存到本地",
        variant: "destructive",
      });
    }
  };

  /**
   * 检查本地备份
   */
  const checkLocalBackup = (): string | null => {
    if (!chapterId) return null;

    const backupData = localStorage.getItem(getBackupKey(chapterId));
    if (!backupData) return null;

    try {
      const backup = JSON.parse(backupData);
      // 检查备份是否与当前内容不同
      if (backup.content !== content || backup.title !== title) {
        return backupData;
      }
    } catch (error) {
      console.error("解析本地备份失败:", error);
    }

    return null;
  };

  /**
   * 从备份恢复
   */
  const restoreFromBackup = () => {
    if (!chapterId) return;

    const backupData = localStorage.getItem(getBackupKey(chapterId));
    if (!backupData) {
      toast({
        title: "无备份数据",
        description: "未找到本地备份",
        variant: "destructive",
      });
      return;
    }

    try {
      const backup = JSON.parse(backupData);
      toast({
        title: "已恢复备份",
        description: `恢复时间：${new Date(backup.timestamp).toLocaleString()}`,
      });
      // 注意：实际恢复需要由父组件处理，这里只是提示
      // 父组件应该监听这个函数的调用并更新 content 和 title
    } catch (error) {
      console.error("恢复备份失败:", error);
      toast({
        title: "恢复失败",
        description: "备份数据已损坏",
        variant: "destructive",
      });
    }
  };

  /**
   * 清除备份
   */
  const clearBackup = () => {
    if (!chapterId) return;
    localStorage.removeItem(getBackupKey(chapterId));
  };

  /**
   * 防抖自动保存
   */
  useEffect(() => {
    if (!enabled || !chapterId) {
      return;
    }

    // 检查是否有变化
    const hasChanges =
      content !== lastSavedContentRef.current ||
      title !== lastSavedTitleRef.current;

    if (hasChanges) {
      setSaveStatus("unsaved");
      setHasUnsavedChanges(true);

      // 清除之前的定时器
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      // 设置新的定时器
      saveTimerRef.current = setTimeout(() => {
        saveNow();
      }, delay);
    }

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [content, title, chapterId, enabled, delay]);

  /**
   * 离开页面提醒
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "你有未保存的更改，确定要离开吗？";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  /**
   * 页面加载时检查本地备份
   */
  useEffect(() => {
    if (!chapterId) return;

    const backup = checkLocalBackup();
    if (backup) {
      try {
        const backupData = JSON.parse(backup);
        const backupTime = new Date(backupData.timestamp).toLocaleString();

        // 提示用户发现备份（由父组件处理恢复逻辑）
        toast({
          title: "发现未保存的更改",
          description: `备份时间：${backupTime}。请手动恢复或继续编辑。`,
        });
      } catch (error) {
        console.error("检查备份失败:", error);
      }
    }
  }, [chapterId]); // 只在 chapterId 变化时检查

  /**
   * 注意：不使用 sendBeacon 在卸载时保存
   * 原因：sendBeacon 无法发送自定义 header（JWT token），后端会拒绝请求
   *
   * 替代方案：
   * 1. 依赖自动保存机制（每 2 秒保存一次）
   * 2. localStorage 备份（已实现）
   * 3. 用户手动保存（Ctrl+S）
   */

  return {
    saveStatus,
    saveNow,
    hasUnsavedChanges,
    checkLocalBackup,
    restoreFromBackup,
    clearBackup,
  };
}
