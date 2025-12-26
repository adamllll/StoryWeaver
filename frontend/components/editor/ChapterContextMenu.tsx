/**
 * 章节右键菜单组件
 */

"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Edit,
  Trash2,
  Copy,
  GitBranch,
  Tag,
  BarChart3,
  Link,
  Star,
  FileText,
} from "lucide-react";

interface ChapterContextMenuProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onCreateBranch?: () => void;
  onAddTag?: (tag: string) => void;
  onViewStats?: () => void;
  onCopyLink?: () => void;
}

export function ChapterContextMenu({
  children,
  onEdit,
  onDelete,
  onDuplicate,
  onCreateBranch,
  onAddTag,
  onViewStats,
  onCopyLink,
}: ChapterContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-white/95 backdrop-blur-xl border-2 border-purple-200 shadow-2xl">
        {/* 编辑 */}
        <ContextMenuItem
          onClick={onEdit}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-purple-50 rounded-lg"
        >
          <Edit className="w-4 h-4 text-purple-600" />
          <span className="font-medium">编辑章节</span>
          <span className="ml-auto text-xs text-gray-500">Ctrl+E</span>
        </ContextMenuItem>

        {/* 复制 */}
        <ContextMenuItem
          onClick={onDuplicate}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-blue-50 rounded-lg"
        >
          <Copy className="w-4 h-4 text-blue-600" />
          <span className="font-medium">复制章节</span>
          <span className="ml-auto text-xs text-gray-500">Ctrl+D</span>
        </ContextMenuItem>

        <ContextMenuSeparator className="my-2" />

        {/* 创建分支 */}
        <ContextMenuItem
          onClick={onCreateBranch}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-amber-50 rounded-lg"
        >
          <GitBranch className="w-4 h-4 text-amber-600" />
          <span className="font-medium">创建分支</span>
        </ContextMenuItem>

        {/* 添加标签（子菜单） */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-green-50 rounded-lg">
            <Tag className="w-4 h-4 text-green-600" />
            <span className="font-medium">添加标签</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 bg-white/95 backdrop-blur-xl border-2 border-green-200 shadow-2xl">
            <ContextMenuItem
              onClick={() => onAddTag?.("主线")}
              className="px-4 py-2 cursor-pointer hover:bg-green-50 rounded-lg"
            >
              主线
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onAddTag?.("支线")}
              className="px-4 py-2 cursor-pointer hover:bg-green-50 rounded-lg"
            >
              支线
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onAddTag?.("重要")}
              className="px-4 py-2 cursor-pointer hover:bg-green-50 rounded-lg"
            >
              <Star className="w-3 h-3 mr-2 text-yellow-500" />
              重要
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onAddTag?.("草稿")}
              className="px-4 py-2 cursor-pointer hover:bg-green-50 rounded-lg"
            >
              草稿
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator className="my-2" />

        {/* 查看统计 */}
        <ContextMenuItem
          onClick={onViewStats}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-teal-50 rounded-lg"
        >
          <BarChart3 className="w-4 h-4 text-teal-600" />
          <span className="font-medium">查看统计</span>
        </ContextMenuItem>

        {/* 复制链接 */}
        <ContextMenuItem
          onClick={onCopyLink}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-lg"
        >
          <Link className="w-4 h-4 text-gray-600" />
          <span className="font-medium">复制链接</span>
        </ContextMenuItem>

        <ContextMenuSeparator className="my-2" />

        {/* 删除 */}
        <ContextMenuItem
          onClick={onDelete}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-red-50 rounded-lg text-red-600"
        >
          <Trash2 className="w-4 h-4" />
          <span className="font-medium">删除章节</span>
          <span className="ml-auto text-xs">Del</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
