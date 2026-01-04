/**
 * 织梦者创作中心 - Zen-iOS 重构版
 *
 * 核心特性：
 * - 沉浸式三栏 Grid 布局
 * - Framer Motion 侧边栏平滑折叠
 * - 全局物理噪点背景透传
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

// 组件导入
import { EnhancedChapterList } from "@/components/editor/EnhancedChapterList";

// 大型组件懒加载（优化首屏加载性能）
const MindMapTree = dynamic(
  () => import("@/components/editor/MindMapTree").then((mod) => mod.MindMapTree),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
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
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
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
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
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
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    ),
  }
);

// Tiptap 编辑器懒加载 (带更好的 Loading 骨架屏)
const TiptapEditor = dynamic(
  () => import("@/components/editor/TiptapEditor").then((mod) => mod.TiptapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col space-y-4 p-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
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

  // 侧边栏宽度控制 (使用 ref 避免重渲染导致的卡顿)
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
  const loadChapter = useCallback(async (chapterId: number) => {
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
  }, [novelId, toast]);

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
          const order = Number.isFinite(chapter.order_num)
            ? Math.round(chapter.order_num)
            : 0;
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

    // 创建新章节
    const newChapter = await createChapter({
      title: `第 ${nextOrderNum} 章`,
      content: "",
      order_num: nextOrderNum,
    });

    if (newChapter) {
      // 直接设置状态，不调用 loadChapter（避免异步覆盖问题）
      setCurrentChapter(newChapter);
      setEditorContent("");  // 新章节内容为空
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

    // 乐观更新章节列表中的字数
    setNovel((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        chapters: prev.chapters.map((c) =>
          c.id === currentChapter.id ? { ...c, word_count: count } : c
        ),
      };
    });
    
    // 更新当前章节状态
    setCurrentChapter(prev => prev ? { ...prev, word_count: count } : null);
  };

  // === 渲染逻辑 ===
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-ios-bg">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!novel) return null;

  return (
    <div className="h-screen flex flex-col bg-ios-bg overflow-hidden relative">
      {/* 全局背景纹理 (透传 global.css 的 noise) */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-br from-purple-50/50 via-blue-50/30 to-white/80" />

      {/* 顶部导航栏 */}
      <header className="h-16 flex-shrink-0 nav-glass-purple z-50 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Link href="/workspace" className="p-2 rounded-lg hover:bg-black/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">{novel.title}</h1>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                {novel.category}
              </span>
              <span>{novel.word_count.toLocaleString()} 字</span>
            </div>
          </div>
        </div>

        {/* 视图切换 Tabs */}
        <div className="flex bg-gray-100/50 p-1 rounded-xl border border-gray-200/50 backdrop-blur-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-white text-purple-700 shadow-sm ring-1 ring-black/5" : "text-gray-500 hover:text-gray-700 hover:bg-black/5"}`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* 保存状态指示器 */}
          <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-white/40 border border-white/60">
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                <span className="text-purple-600">保存中...</span>
              </>
            ) : saveStatus === "saved" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-gray-500">已保存</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-amber-600">未保存</span>
              </>
            )}
          </div>

          <button
            onClick={() => saveNow()}
            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="手动保存 (Ctrl+S)"
          >
            <Save className="w-5 h-5" />
          </button>
          
          <div className="h-6 w-px bg-gray-300 mx-1" />

          <button
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className={`p-2 rounded-lg transition-colors ${rightPanelOpen ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100"}`}
            title="切换 AI 助手"
          >
            {rightPanelOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* 主工作区 (CSS Grid) */}
      <div className="flex-1 grid overflow-hidden relative z-10"
           style={{
             gridTemplateColumns: (
               `${leftPanelOpen ? `${sidebarWidth}px` : '0px'} 
               1fr 
               ${rightPanelOpen ? '320px' : '0px'}`
             ),
             transition: "grid-template-columns 0.4s cubic-bezier(0.16, 1, 0.3, 1)" // iOS 风格缓动
           }}
      >
        {/* === 左侧栏：章节列表 === */}
        <aside className="border-r border-gray-200/60 bg-white/40 backdrop-blur-xl h-full flex flex-col overflow-hidden relative group">
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
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-purple-400/50 transition-colors z-20"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = sidebarWidth;
              const handleMouseMove = (e: MouseEvent) => {
                const newWidth = Math.max(240, Math.min(480, startWidth + (e.clientX - startX)));
                setSidebarWidth(newWidth);
              };
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />
        </aside>

        {/* 左侧栏切换按钮 (浮动) */}
        <div className="absolute left-4 bottom-4 z-50">
          <button
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className="w-8 h-8 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-purple-600 transition-transform hover:scale-110"
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
                <div className="max-w-3xl mx-auto py-12 px-8 min-h-full bg-white shadow-sm my-6 rounded-lg border border-gray-100">
                  <input
                    type="text"
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    className="w-full text-3xl font-bold text-gray-900 placeholder:text-gray-300 border-none focus:ring-0 p-0 mb-8 bg-transparent"
                    placeholder="在此输入章节标题..."
                  />
                  <TiptapEditor
                    content={editorContent}
                    onChange={setEditorContent}
                    onWordCountChange={handleWordCountChange}
                    className="min-h-[500px]"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <Sparkles className="w-16 h-16 mb-4 text-purple-200" />
                <p className="text-lg font-medium text-gray-500">选择或创建一个章节开始写作</p>
                <button
                  onClick={handleChapterCreate}
                  className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  新建章节
                </button>
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

          {/* 世界观 Tab（哼，让笨蛋管理世界设定更方便～）*/}
          {activeTab === "world" && (
            <div className="h-full overflow-y-auto p-8">
              <WorldSettingsPanel novelId={novelId} />
            </div>
          )}
        </main>

        {/* === 右侧栏：AI 助手 === */}
        <aside className="border-l border-gray-200/60 bg-white/60 backdrop-blur-xl h-full overflow-hidden relative">
          <div className="w-[320px] h-full overflow-hidden">
            <AIAssistant
              novelId={novelId}
              currentChapter={currentChapter}
              editorContent={editorContent}
              onContentInsert={handleContentInsert}
              novelOutline={novel?.outline}  // 关键修复：传递小说大纲用于整章生成
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
