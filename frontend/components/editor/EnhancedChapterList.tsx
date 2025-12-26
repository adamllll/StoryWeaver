/**
 * 增强版章节管理面板 - Zen-iOS Hybrid 重构版
 *
 * 核心特性：
 * - 极致流畅的拖拽体验 (dnd-kit)
 * - 沉浸式毛玻璃列表项
 * - 智能筛选与大纲视图集成
 */

"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  FileText,
  Trash2,
  GripVertical,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  BookOpen,
  List,
  MoreVertical,
} from "lucide-react";
import { ChapterListProps, ChapterSummary } from "@/lib/types";
import { ChapterPreview } from "./ChapterPreview";
import { ChapterContextMenu } from "./ChapterContextMenu";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';

type TagType = "all" | "branch" | "main" | "completed" | "draft";
type SortType = "order" | "wordCount" | "recent";

// 可排序的章节项
function SortableChapterItem({
  chapter,
  index,
  isActive,
  novelId,
  onChapterClick,
  onChapterDelete,
}: {
  chapter: ChapterSummary;
  index: number;
  isActive: boolean;
  novelId: number;
  onChapterClick: (id: number) => void;
  onChapterDelete: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });
  const { toast } = useToast();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    position: "relative" as const,
  };

  return (
    <ChapterContextMenu
      onEdit={() => onChapterClick(chapter.id)}
      onDelete={() => {
        if (confirm(`确定要删除章节「${chapter.title}」吗？`)) {
          onChapterDelete(chapter.id);
        }
      }}
      onDuplicate={() => toast({ title: "复制章节", description: "该功能即将上线" })}
      onCreateBranch={() => toast({ title: "创建分支", description: "该功能即将上线" })}
      onAddTag={(tag) => toast({ title: "添加标签", description: `已为章节添加标签：${tag}` })}
      onViewStats={() => toast({ title: "章节统计", description: `${chapter.title}\n字数：${chapter.word_count.toLocaleString()} 字` })}
      onCopyLink={() => {
        const link = `${window.location.origin}/read/${novelId}/${chapter.id}`;
        navigator.clipboard.writeText(link);
        toast({ title: "复制成功", description: "章节链接已复制到剪贴板" });
      }}
    >
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
      >
        <ChapterPreview chapter={chapter}>
          <div
            className={cn(
              "group relative flex items-start p-3.5 rounded-ios-lg cursor-pointer transition-all duration-200 border",
              isActive
                ? "bg-white border-purple-200 shadow-ios-purple scale-[1.02]"
                : "bg-white/40 border-transparent hover:bg-white/80 hover:border-gray-100 hover:shadow-sm",
              isDragging && "shadow-2xl opacity-80 scale-105 bg-white z-50"
            )}
            onClick={() => onChapterClick(chapter.id)}
          >
            {/* 拖拽手柄 */}
            <div
              {...listeners}
              className={cn(
                "mt-1 mr-2 cursor-grab active:cursor-grabbing transition-opacity",
                isActive ? "text-purple-300" : "text-gray-300 opacity-0 group-hover:opacity-100"
              )}
            >
              <GripVertical className="w-4 h-4" />
            </div>

            {/* 章节信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2.5 mb-1.5">
                <span
                  className={cn(
                    "flex-shrink-0 w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-md transition-colors mt-0.5",
                    isActive
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                  )}
                >
                  {index + 1}
                </span>

                <h3
                  className={cn(
                    "flex-1 text-sm font-semibold leading-snug line-clamp-1 transition-colors",
                    isActive ? "text-gray-900" : "text-gray-700 group-hover:text-gray-900"
                  )}
                >
                  {chapter.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 ml-7 text-[10px]">
                <span className={cn("font-medium", isActive ? "text-purple-600" : "text-gray-500")}>
                  {chapter.word_count.toLocaleString()} 字
                </span>

                {chapter.is_branch && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium flex items-center gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-amber-400" />
                      分支
                    </span>
                  </>
                )}
                
                 {/* 状态点 (示例：草稿/发布) */}
                 {chapter.word_count < 100 && (
                   <>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-400 italic">草稿</span>
                   </>
                 )}
              </div>
            </div>

             {/* 悬停操作按钮 */}
             <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                  onClick={(e) => { e.stopPropagation(); /* 触发菜单 */ }}
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
             </div>
          </div>
        </ChapterPreview>
      </div>
    </ChapterContextMenu>
  );
}

interface EnhancedChapterListProps extends ChapterListProps {
  outline?: string;
}

export function EnhancedChapterList({
  chapters,
  currentChapterId,
  novelId,
  onChapterClick,
  onChapterCreate,
  onChapterDelete,
  outline,
}: EnhancedChapterListProps) {
  const [items, setItems] = useState(chapters);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<TagType[]>(["all"]);
  const [sortBy, setSortBy] = useState<SortType>("order");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"chapters" | "outline">("chapters");
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // 防止点击触发拖拽
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const tags: { value: TagType; label: string; color: string }[] = [
    { value: "all", label: "全部", color: "bg-gray-100 text-gray-700" },
    { value: "branch", label: "分支", color: "bg-amber-50 text-amber-700 border-amber-100" },
    { value: "main", label: "主线", color: "bg-blue-50 text-blue-700 border-blue-100" },
    { value: "completed", label: "完稿", color: "bg-green-50 text-green-700 border-green-100" },
    { value: "draft", label: "草稿", color: "bg-purple-50 text-purple-700 border-purple-100" },
  ];

  const sortOptions: { value: SortType; label: string }[] = [
    { value: "order", label: "默认排序" },
    { value: "wordCount", label: "按字数" },
    { value: "recent", label: "最近创建" },
  ];

  const filteredAndSortedChapters = useMemo(() => {
    let filtered = [...chapters];
    if (searchQuery.trim()) {
      filtered = filtered.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (!selectedTags.includes("all")) {
      filtered = filtered.filter((c) => {
        if (selectedTags.includes("branch") && c.is_branch) return true;
        if (selectedTags.includes("main") && !c.is_branch) return true;
        if (selectedTags.includes("completed") && c.word_count >= 3000) return true;
        if (selectedTags.includes("draft") && c.word_count < 3000) return true;
        return false;
      });
    }
    if (sortBy === "wordCount") {
      filtered.sort((a, b) => b.word_count - a.word_count);
    } else if (sortBy === "recent") {
      filtered.sort((a, b) => b.order_num - a.order_num);
    } else {
      filtered.sort((a, b) => a.order_num - b.order_num);
    }
    return filtered;
  }, [chapters, searchQuery, selectedTags, sortBy]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      toast({ title: "顺序已调整", description: "章节顺序将在保存后生效" });
    }
  };

  if (JSON.stringify(items) !== JSON.stringify(chapters)) {
    setItems(chapters);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 顶部 Tab 栏 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex flex-col h-full">
        <div className="px-4 pt-4 pb-2 flex-shrink-0">
          <TabsList className="w-full h-10 bg-gray-100/50 p-1 rounded-ios-lg grid grid-cols-2">
            <TabsTrigger 
              value="chapters" 
              className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-700 text-xs font-medium transition-all"
            >
              <List className="w-3.5 h-3.5 mr-1.5" />
              章节目录
            </TabsTrigger>
            <TabsTrigger 
              value="outline" 
              className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-700 text-xs font-medium transition-all"
            >
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              故事大纲
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chapters" className="flex-1 flex flex-col m-0 overflow-hidden outline-none data-[state=inactive]:hidden data-[state=inactive]:!flex-none">
          
          {/* 工具栏 */}
          <div className="px-4 pb-3 space-y-3 flex-shrink-0">
            {/* 搜索 */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索章节..."
                className="w-full pl-9 pr-8 py-2 bg-white/50 border border-gray-200/50 rounded-ios-lg text-xs focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-200 transition-all outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 text-gray-400"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 筛选切换 */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {tags.slice(0, 3).map(tag => (
                   <button
                    key={tag.value}
                    onClick={() => {
                       const isSelected = selectedTags.includes(tag.value);
                       if (tag.value === 'all') setSelectedTags(['all']);
                       else {
                         const newTags = selectedTags.filter(t => t !== 'all');
                         if (isSelected) {
                            const remaining = newTags.filter(t => t !== tag.value);
                            setSelectedTags(remaining.length ? remaining : ['all']);
                         } else {
                            setSelectedTags([...newTags, tag.value]);
                         }
                       }
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[10px] font-medium transition-all border",
                      selectedTags.includes(tag.value)
                        ? tag.color
                        : "bg-transparent border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-200"
                    )}
                   >
                     {tag.label}
                   </button>
                ))}
                <button 
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  className={cn(
                    "px-2 py-1 rounded-md text-[10px] text-gray-400 hover:bg-gray-100 transition-colors",
                    isFilterExpanded && "bg-gray-100 text-gray-600"
                  )}
                >
                   <MoreVertical className="w-3 h-3" />
                </button>
              </div>

              <button
                onClick={onChapterCreate}
                className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 hover:scale-105 active:scale-95 transition-all shadow-sm"
                title="新建章节"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* 扩展筛选区域 */}
            <AnimatePresence>
              {isFilterExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-2 pt-1 border-t border-gray-100"
                >
                   <div className="flex flex-wrap gap-2 pt-2">
                      {tags.slice(3).map(tag => (
                        <button
                          key={tag.value}
                          onClick={() => {
                             const isSelected = selectedTags.includes(tag.value);
                             const newTags = selectedTags.filter(t => t !== 'all');
                             if (isSelected) {
                                const remaining = newTags.filter(t => t !== tag.value);
                                setSelectedTags(remaining.length ? remaining : ['all']);
                             } else {
                                setSelectedTags([...newTags, tag.value]);
                             }
                          }}
                          className={cn(
                            "px-2.5 py-1 rounded-md text-[10px] font-medium transition-all border",
                            selectedTags.includes(tag.value)
                              ? tag.color
                              : "bg-white border-gray-200 text-gray-500 hover:border-purple-200"
                          )}
                        >
                          {tag.label}
                        </button>
                      ))}
                   </div>
                   <div className="flex gap-2">
                      {sortOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setSortBy(opt.value)}
                          className={cn(
                            "flex-1 py-1 text-[10px] rounded border transition-colors",
                            sortBy === opt.value
                              ? "bg-purple-50 border-purple-200 text-purple-700 font-semibold"
                              : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 列表区域 */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
             {filteredAndSortedChapters.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <FileText className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs">暂无章节</p>
                </div>
             ) : (
                <DndContext 
                  sensors={sensors} 
                  collisionDetection={closestCenter} 
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={filteredAndSortedChapters.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {filteredAndSortedChapters.map((chapter, index) => (
                        <SortableChapterItem
                          key={chapter.id}
                          chapter={chapter}
                          index={index}
                          isActive={currentChapterId === chapter.id}
                          novelId={novelId}
                          onChapterClick={onChapterClick}
                          onChapterDelete={onChapterDelete}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
             )}
             
             {/* 底部留白 */}
             <div className="h-12" />
          </div>
        </TabsContent>

        <TabsContent value="outline" className="flex-1 flex flex-col !m-0 !mt-0 !p-0 overflow-hidden outline-none data-[state=active]:flex">
          {outline ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 bg-white/30">
               <article className="prose prose-sm prose-purple max-w-none !mt-0 !pt-0 prose-headings:font-serif prose-p:my-2 prose-headings:my-3 prose-headings:first:mt-0 [&>*:first-child]:!mt-0 [&>*:first-child]:!pt-0 [&>h1:first-child]:!mt-0 [&>h2:first-child]:!mt-0 [&>p:first-child]:!mt-0 [&>ol:first-child]:!mt-0 [&>ul:first-child]:!mt-0">
                 <ReactMarkdown>{outline.trim()}</ReactMarkdown>
               </article>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <BookOpen className="w-10 h-10 opacity-50" />
              <p className="text-xs">暂无大纲内容</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}