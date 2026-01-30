/**
 * 织梦者创作中心 - Sketch 风格适配版
 *
 * 核心特性：
 * - 沉浸式三栏 Grid 布局
 * - Framer Motion 侧边栏平滑折叠
 * - Sketch 风格背景和 UI 元素
 * - 高度模块化的状态管理
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Globe,
  Loader2,
  Edit3,
  GitBranch as GitBranchIcon,
  BarChart3,
  Save,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
} from "lucide-react";
import { novelsApi, chaptersApi, ApiError } from "@/lib/api";
import type { NovelDetail, Chapter, ChapterSummary } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { useChapters } from "@/hooks/useChapters";
import { useAutoSave } from "@/hooks/useAutoSave";
import { Button } from "@/components/ui/button";

// 组件导入
import { EnhancedChapterList } from "@/components/editor/EnhancedChapterList";

// 大型组件懒加载
const MindMapTree = dynamic(
  () => import("@/components/editor/MindMapTree").then((mod) => mod.MindMapTree),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-sketch-text-secondary" />
      </div>
    ),
  }
);

const ProgressDashboard = dynamic(
  () => import("@/components/editor/ProgressDashboard").then((mod) => mod.ProgressDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-sketch-text-secondary" />
      </div>
    ),
  }
);

const AIAssistant = dynamic(
  () => import("@/components/editor/AIAssistant").then((mod) => mod.AIAssistant),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-sketch-text-secondary" />
      </div>
    ),
  }
);

const WorldSettingsPanel = dynamic(
  () => import("@/components/editor/WorldSettingsPanel").then((mod) => mod.WorldSettingsPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-sketch-text-secondary" />
      </div>
    ),
  }
);

const TiptapEditor = dynamic(
  () => import("@/components/editor/TiptapEditor").then((mod) => mod.TiptapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col space-y-4 p-8 animate-pulse">
        <div className="h-8 bg-gray-200/60 rounded w-1/3 mb-8 border-2 border-dashed border-gray-300/50"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200/60 rounded w-full border border-dashed border-gray-300/30"></div>
          <div className="h-4 bg-gray-200/60 rounded w-5/6 border border-dashed border-gray-300/30"></div>
          <div className="h-4 bg-gray-200/60 rounded w-4/6 border border-dashed border-gray-300/30"></div>
        </div>
      </div>
    ),
  }
);

export default function NovelWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated } = useAuthStore();
  const novelId = Number(params.novelId);

  // === 核心数据状态 ===
  const [novel, setNovel] = useState<NovelDetail | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // === 编辑器状态 ===
  const [editorContent, setEditorContent] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");

  // === UI 布局状态 ===
  const [activeTab, setActiveTab] = useState<"editor" | "mindmap" | "stats" | "world">("editor");
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const [sidebarWidth, setSidebarWidth] = useState(320);

  // === Hooks ===
  const { createChapter, deleteChapter } = useChapters({
    novelId,
    onChapterUpdate: async () => {
      const data = await novelsApi.get(novelId);
      setNovel(data);
    },
  });

  const { saveStatus, saveNow } = useAutoSave({
    novelId,
    chapterId: currentChapter?.id || null,
    content: editorContent,
    title: chapterTitle,
    delay: 2000,
    enabled: !!currentChapter,
    onSaveSuccess: async () => {
      try {
        const data = await novelsApi.get(novelId);
        setNovel(data);
      } catch (error) {
        console.error("更新数据失败:", error);
      }
    },
  });

  const tabs = [
    { id: "editor", icon: Edit3, label: "编辑" },
    { id: "mindmap", icon: GitBranchIcon, label: "脑图" },
    { id: "stats", icon: BarChart3, label: "统计" },
    { id: "world", icon: Globe, label: "世界观" },
  ] as const;

  // === 业务逻辑方法 ===
  const loadChapter = useCallback(
    async (chapterId: number) => {
      try {
        const chapter = await chaptersApi.get(novelId, chapterId);
        setCurrentChapter(chapter);
        setEditorContent(chapter.content);
        setChapterTitle(chapter.title);
        setActiveTab("editor");
      } catch (error: unknown) {
        const message = error instanceof ApiError ? error.detail : "无法加载章节";
        toast({ title: "无法加载章节", description: message, variant: "destructive" });
      }
    },
    [novelId, toast]
  );

  // === 初始化加载 ===
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchNovel = async () => {
      try {
        const data = await novelsApi.get(novelId);
        setNovel(data);
        if (data.chapters && data.chapters.length > 0) {
          loadChapter(data.chapters[0].id);
        }
      } catch (error: unknown) {
        const message = error instanceof ApiError ? error.detail : "无法加载小说";
        toast({
          title: "加载失败",
          description: message,
          variant: "destructive",
        });
        if (error instanceof ApiError && error.status === 404) router.push("/workspace");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNovel();
  }, [isAuthenticated, novelId, router, toast, loadChapter]);

  const handleChapterCreate = async () => {
    if (!novel) return;

    const getNextOrderNum = (chapters: ChapterSummary[]) => {
      const used = new Set<number>();
      chapters
        .filter((chapter) => !chapter.is_branch)
        .forEach((chapter) => {
          const order = Number.isFinite(chapter.order_num) ? Math.round(chapter.order_num) : 0;
          if (order > 0) {
            used.add(order);
          }
        });

      let next = 1;
      while (used.has(next)) {
        next += 1;
      }
      return next;
    };

    const nextOrderNum = getNextOrderNum(novel.chapters);

    const newChapter = await createChapter({
      title: `第 ${nextOrderNum} 章`,
      content: "",
      order_num: nextOrderNum,
    });

    if (newChapter) {
      setCurrentChapter(newChapter);
      setEditorContent("");
      setChapterTitle(newChapter.title);
      setActiveTab("editor");
    }
  };

  const handleChapterDelete = async (chapterId: number) => {
    if (!novel) return;
    await deleteChapter(chapterId);
    if (currentChapter?.id === chapterId) {
      const remaining = novel.chapters.filter((c) => c.id !== chapterId);
      if (remaining.length > 0) loadChapter(remaining[0].id);
      else {
        setCurrentChapter(null);
        setEditorContent("");
        setChapterTitle("");
      }
    }
  };

  const handleOutlineUpdate = (newOutline: string) => {
    if (!novel) return;
    setNovel({ ...novel, outline: newOutline });
  };

  const handleContentInsert = (content: string, replace: boolean = false, title?: string) => {
    const isAutoTitle = (value: string) => /^第\s*\d+\s*章$/.test(value.trim());
    const shouldUpdateTitle = Boolean(
      title &&
        title.trim() &&
        (replace && (isAutoTitle(chapterTitle) || editorContent.trim().length === 0 || !chapterTitle))
    );

    if (shouldUpdateTitle && title) {
      setChapterTitle(title.trim());
    }
    setEditorContent((prev) => (replace ? content : prev + "\n\n" + content));
  };

  const handleWordCountChange = (count: number) => {
    if (!currentChapter || !novel) return;

    setNovel((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        chapters: prev.chapters.map((c) => (c.id === currentChapter.id ? { ...c, word_count: count } : c)),
      };
    });

    setCurrentChapter((prev) => (prev ? { ...prev, word_count: count } : null));
  };

  // === 渲染逻辑 ===
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center grid-paper-bg">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-sketch-text-secondary" />
          <span className="font-patrick text-sketch-text-secondary">加载中...</span>
        </div>
      </div>
    );
  }

  if (!novel) return null;

  return (
    <div className="h-screen flex flex-col grid-paper-bg overflow-hidden relative">
      {/* 顶部导航栏 - Sketch 风格 */}
      <header className="h-16 flex-shrink-0 z-50 flex items-center justify-between px-4 lg:px-6 border-b-2 border-dashed border-sketch-text-secondary/30 bg-white/80">
        <div className="flex items-center gap-4">
          <Link
            href="/workspace"
            className="p-2 rounded-lg border-2 border-dashed border-sketch-text-secondary/30 hover:border-sketch-text-primary hover:bg-sticky-blue/20 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-sketch-text-primary" />
          </Link>
          <div>
            <h1 className="font-caveat font-bold text-xl text-sketch-text-primary leading-tight">{novel.title}</h1>
            <div className="flex items-center gap-2 text-xs font-patrick text-sketch-text-secondary">
              <span className="bg-sticky-blue px-2 py-0.5 rounded-full border border-sketch-text-secondary/30 font-caveat font-bold text-sketch-text-primary">
                {novel.category}
              </span>
              <span>{novel.word_count.toLocaleString()} 字</span>
            </div>
          </div>
        </div>

        {/* 视图切换 Tabs - Sketch 风格 */}
        <div className="flex bg-sticky-yellow-light/50 p-1 rounded-full border-2 border-dashed border-sketch-text-secondary/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-patrick transition-all ${
                activeTab === tab.id
                  ? "bg-sticky-yellow font-caveat font-bold text-sketch-text-primary shadow-sketch"
                  : "text-sketch-text-secondary hover:text-sketch-text-primary hover:bg-sticky-yellow/30"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* 保存状态指示器 */}
          <div className="flex items-center gap-2 text-xs font-patrick px-3 py-1.5 rounded-full bg-white border-2 border-dashed border-sketch-text-secondary/30">
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-sticky-blue" />
                <span className="text-sticky-blue font-bold">保存中...</span>
              </>
            ) : saveStatus === "saved" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-sticky-green" />
                <span className="text-sketch-text-muted">已保存</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-sticky-yellow" />
                <span className="text-sketch-text-secondary">未保存</span>
              </>
            )}
          </div>

          <button
            onClick={() => saveNow()}
            className="p-2 text-sketch-text-secondary hover:text-sketch-text-primary hover:bg-sticky-blue/30 rounded-lg border-2 border-dashed border-transparent hover:border-sketch-text-secondary/30 transition-all"
            title="手动保存 (Ctrl+S)"
          >
            <Save className="w-5 h-5" />
          </button>

          <div className="h-6 w-px bg-sketch-text-secondary/30 mx-1" />

          <button
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className={`p-2 rounded-lg border-2 transition-all ${
              rightPanelOpen
                ? "bg-sticky-blue border-sketch-text-primary text-sketch-text-primary shadow-sketch"
                : "text-sketch-text-secondary border-dashed border-sketch-text-secondary/30 hover:border-sketch-text-primary hover:bg-sticky-blue/30"
            }`}
            title="切换 AI 助手"
          >
            {rightPanelOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* 主工作区 (CSS Grid) */}
      <div
        className="flex-1 grid overflow-hidden relative z-10"
        style={{
          gridTemplateColumns: `${leftPanelOpen ? `${sidebarWidth}px` : "0px"}
               1fr
               ${rightPanelOpen ? "320px" : "0px"}`,
          transition: "grid-template-columns 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* === 左侧栏：章节列表 === */}
        <aside className="border-r-2 border-dashed border-sketch-text-secondary/30 bg-white/60 h-full flex flex-col overflow-hidden relative group">
          <div className="flex-1 overflow-hidden">
            <div style={{ width: sidebarWidth }} className="h-full">
              <EnhancedChapterList
                chapters={novel.chapters}
                currentChapterId={currentChapter?.id || null}
                novelId={novelId}
                onChapterClick={loadChapter}
                onChapterCreate={handleChapterCreate}
                onChapterDelete={handleChapterDelete}
                outline={novel.outline}
                onOutlineUpdate={handleOutlineUpdate}
              />
            </div>
          </div>

          {/* 拖拽手柄 */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-sticky-blue/50 transition-colors z-20"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = sidebarWidth;
              const handleMouseMove = (e: MouseEvent) => {
                const newWidth = Math.max(240, Math.min(480, startWidth + (e.clientX - startX)));
                setSidebarWidth(newWidth);
              };
              const handleMouseUp = () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
              };
              document.addEventListener("mousemove", handleMouseMove);
              document.addEventListener("mouseup", handleMouseUp);
            }}
          />
        </aside>

        {/* 左侧栏切换按钮 (浮动) */}
        <div className="absolute left-4 bottom-4 z-50">
          <button
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className="w-8 h-8 rounded-full bg-white shadow-sketch border-2 border-sketch-text-secondary/30 flex items-center justify-center text-sketch-text-secondary hover:text-sketch-text-primary hover:border-sketch-text-primary transition-all hover:scale-110"
            title={leftPanelOpen ? "折叠侧边栏" : "展开侧边栏"}
          >
            {leftPanelOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        </div>

        {/* === 中间栏：主要内容 === */}
        <main className="h-full overflow-hidden bg-white/50 relative">
          {/* 编辑器 Tab */}
          <div className={`h-full flex flex-col ${activeTab === "editor" ? "block" : "hidden"}`}>
            {currentChapter ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl mx-auto py-12 px-8 min-h-full bg-white shadow-sketch my-6 rounded-xl border-2 border-sketch-text-secondary/20">
                  <input
                    type="text"
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    className="w-full text-3xl font-caveat font-bold text-sketch-text-primary placeholder:text-sketch-text-muted/50 border-none focus:ring-0 p-0 mb-8 bg-transparent"
                    placeholder="在此输入章节标题..."
                  />
                  <TiptapEditor
                    content={editorContent}
                    onChange={setEditorContent}
                    onWordCountChange={handleWordCountChange}
                    className="min-h-[500px] font-patrick"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-xl bg-sticky-blue border-2 border-dashed border-sketch-text-secondary/30 flex items-center justify-center mb-6 shadow-sketch">
                  <Sparkles className="w-10 h-10 text-sketch-text-primary" />
                </div>
                <p className="text-lg font-patrick text-sketch-text-secondary mb-4">选择或创建一个章节开始写作</p>
                <Button variant="sketch" onClick={handleChapterCreate}>
                  新建章节
                </Button>
              </div>
            )}
          </div>

          {/* 思维导图 Tab */}
          {activeTab === "mindmap" && (
            <div className="h-full w-full">
              <MindMapTree
                chapters={novel.chapters}
                currentChapterId={currentChapter?.id || null}
                onChapterClick={loadChapter}
              />
            </div>
          )}

          {/* 统计 Tab */}
          {activeTab === "stats" && (
            <div className="h-full overflow-y-auto p-8">
              <ProgressDashboard
                chapters={novel.chapters}
                targetWordCount={100000}
                targetChapterCount={20}
                createdAt={novel.created_at}
              />
            </div>
          )}

          {/* 世界观 Tab */}
          {activeTab === "world" && (
            <div className="h-full overflow-y-auto p-8">
              <WorldSettingsPanel novelId={novelId} />
            </div>
          )}
        </main>

        {/* === 右侧栏：AI 助手 === */}
        <aside className="border-l-2 border-dashed border-sketch-text-secondary/30 bg-white/60 h-full overflow-hidden relative">
          <div className="w-[320px] h-full overflow-hidden">
            <AIAssistant
              novelId={novelId}
              currentChapter={currentChapter}
              editorContent={editorContent}
              onContentInsert={handleContentInsert}
              novelOutline={novel?.outline}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
