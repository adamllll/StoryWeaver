/**
 * 沉浸式阅读页面 - Sketch 手绘风格版
 *
 * 核心特性：
 * - 极致的无干扰阅读模式 (Zen Mode)
 * - 手绘纸质感的排版引擎
 * - 手绘风格的分支选择交互
 */

"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  List,
  Settings,
  Moon,
  Sun,
  Type,
  Loader2,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { chaptersApi, readingProgressApi, Chapter, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { markdownToHtml } from "@/lib/markdown";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

interface Choice {
  chapter_id: number;
  choice_text: string;
}

export default function ReadPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const novelId = Number(params.novelId);
  const chapterId = Number(params.chapterId);

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  
  // 顶部栏显隐控制
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);

  // 监听滚动隐藏头部
  useMotionValueEvent(scrollY, "change", (latest) => {
    const direction = latest > lastScrollY.current ? "down" : "up";
    if (latest < 100) {
      setIsHeaderVisible(true);
    } else if (direction === "down") {
      setIsHeaderVisible(false);
    } else {
      setIsHeaderVisible(true);
    }
    lastScrollY.current = latest;
  });

  // 阅读设置
  const [settings, setSettings] = useState({
    fontSize: 18,
    lineHeight: 1.8,
    isDark: false,
    fontFamily: "serif",
  });

  useEffect(() => {
    const fetchChapter = async () => {
      setIsLoading(true);
      try {
        const data = await chaptersApi.get(novelId, chapterId);
        setChapter(data);
        if (data.choices && data.choices.length > 0) {
          setShowChoices(true);
        }
        window.scrollTo(0, 0);

        // 自动保存阅读进度（哼，这样笨蛋就不会丢失进度了！）
        try {
          await readingProgressApi.save(novelId, { chapter_id: chapterId });
        } catch (progressError) {
          // 进度保存失败不影响阅读，静默处理
          console.warn("Failed to save reading progress:", progressError);
        }
      } catch (error) {
        if (error instanceof ApiError) {
          toast({ title: "加载失败", description: error.detail, variant: "destructive" });
          if (error.status === 404) router.push(`/novels/${novelId}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchChapter();
  }, [novelId, chapterId, toast, router]);

  const goToNextChapter = () => {
    if (chapter?.navigation.next_chapter_id) {
      router.push(`/read/${novelId}/${chapter.navigation.next_chapter_id}`);
    }
  };

  const goToPrevChapter = () => {
    if (chapter?.navigation.prev_chapter_id) {
      router.push(`/read/${novelId}/${chapter.navigation.prev_chapter_id}`);
    }
  };

  const handleChoice = async (choice: Choice, choiceIndex: number) => {
    setShowChoices(false);

    try {
      const result = await chaptersApi.selectChoice(novelId, chapterId, {
        choice_id: choiceIndex,
      });
      const nextChapterId = result.next_chapter_id ?? choice.chapter_id;
      router.push(`/read/${novelId}/${nextChapterId}`);
      return;
    } catch (error) {
      const message = error instanceof ApiError ? error.detail : "选择失败，请稍后重试";
      toast({
        title: "选择失败",
        description: message,
        variant: "destructive",
      });
      setShowChoices(true);
    }
  };

  if (isLoading) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center transition-colors duration-500",
        settings.isDark ? "bg-gray-900" : "grid-paper-bg"
      )}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={cn("w-8 h-8 animate-spin", settings.isDark ? "text-sticky-yellow" : "text-sketch-text-primary")} />
          <span className={cn("text-sm font-patrick", settings.isDark ? "text-gray-400" : "text-sketch-text-secondary")}>正在加载章节...</span>
        </div>
      </div>
    );
  }

  if (!chapter) return null;

  return (
    <div
      className={cn(
        "min-h-screen transition-colors duration-500 selection:bg-sticky-yellow/50",
        settings.isDark ? "bg-[#1a1a1c] text-gray-200" : "grid-paper-bg text-sketch-text-primary"
      )}
    >
      {/* 顶部导航栏 (自动隐藏) - Sketch style */}
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: isHeaderVisible ? 0 : -80 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-between px-4 md:px-8 border-b-2 border-dashed transition-colors duration-500",
          settings.isDark
            ? "bg-gray-900/95 border-white/10"
            : "bg-white/95 border-sketch-text-secondary/30"
        )}
      >
        <div className="flex items-center gap-4 overflow-hidden">
          <Link
            href={`/novels/${novelId}`}
            className={cn(
              "p-2 rounded-xl transition-colors flex-shrink-0 border-2 border-dashed",
              settings.isDark ? "border-white/20 hover:bg-white/10 text-gray-400" : "border-sketch-text-secondary/30 hover:bg-sticky-yellow-light text-sketch-text-secondary"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-px h-4 bg-current opacity-20" />
          <h1 className={cn("text-lg font-caveat font-bold truncate max-w-[200px] md:max-w-md", settings.isDark ? "text-gray-100" : "text-sketch-text-primary")}>
            {chapter.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowToc(!showToc)}
            className={cn(
              "p-2 rounded-xl transition-colors border-2 border-dashed",
              settings.isDark ? "border-white/20 hover:bg-white/10 text-gray-400" : "border-sketch-text-secondary/30 hover:bg-sticky-blue-light text-sketch-text-secondary"
            )}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "p-2 rounded-xl transition-colors border-2",
              showSettings
                ? (settings.isDark ? "bg-white/10 text-white border-white/30" : "bg-sticky-yellow border-sketch-text-primary/30 text-sketch-text-primary")
                : (settings.isDark ? "border-dashed border-white/20 hover:bg-white/10 text-gray-400" : "border-dashed border-sketch-text-secondary/30 hover:bg-sticky-green-light text-sketch-text-secondary")
            )}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </motion.header>

      {/* 设置面板 Popover - Sketch style */}
      <AnimatePresence>
        {showSettings && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className={cn(
                "fixed top-20 right-4 md:right-8 z-50 w-80 rounded-xl p-6 shadow-sketch border-2",
                settings.isDark
                  ? "bg-gray-800/95 border-gray-700 text-gray-100"
                  : "bg-white border-sketch-text-primary/20 text-sketch-text-primary"
              )}
            >
              <h3 className="text-sm font-caveat font-bold uppercase tracking-wider opacity-70 mb-4">阅读偏好</h3>

              {/* 字体大小 */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2 opacity-80 font-patrick">
                  <span>小</span>
                  <span>字号</span>
                  <span>大</span>
                </div>
                <div className={cn("flex items-center p-1 rounded-xl border-2 border-dashed", settings.isDark ? "bg-black/20 border-white/10" : "bg-sticky-yellow-light/50 border-sketch-text-secondary/20")}>
                  <button onClick={() => setSettings(s => ({...s, fontSize: Math.max(14, s.fontSize - 1)}))} className="p-2 flex-1 flex justify-center"><Type className="w-3 h-3" /></button>
                  <div className="w-px h-4 bg-current opacity-20" />
                  <button onClick={() => setSettings(s => ({...s, fontSize: Math.min(24, s.fontSize + 1)}))} className="p-2 flex-1 flex justify-center"><Type className="w-5 h-5" /></button>
                </div>
              </div>

              {/* 背景模式 */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setSettings(s => ({...s, isDark: false}))}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-patrick",
                    !settings.isDark
                      ? "bg-sticky-yellow border-sketch-text-primary text-sketch-text-primary"
                      : "bg-gray-700 border-transparent hover:bg-gray-600"
                  )}
                >
                  <Sun className="w-4 h-4" />
                  <span>手绘纸</span>
                </button>
                <button
                  onClick={() => setSettings(s => ({...s, isDark: true}))}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-patrick",
                    settings.isDark
                      ? "bg-[#1a1a1c] border-sticky-yellow text-white"
                      : "bg-gray-100 border-transparent hover:bg-gray-200"
                  )}
                >
                  <Moon className="w-4 h-4" />
                  <span>深色</span>
                </button>
              </div>

              {/* 字体选择 */}
              <div className={cn("flex p-1 rounded-xl border-2 border-dashed", settings.isDark ? "bg-black/20 border-white/10" : "bg-sticky-pink-light/30 border-sketch-text-secondary/20")}>
                <button
                  onClick={() => setSettings(s => ({...s, fontFamily: "serif"}))}
                  className={cn(
                    "flex-1 py-2 text-sm font-serif rounded-lg transition-all",
                    settings.fontFamily === "serif"
                      ? (settings.isDark ? "bg-gray-600 shadow-sm text-white" : "bg-sticky-yellow shadow-sketch-sm text-sketch-text-primary")
                      : "opacity-60 hover:opacity-100"
                  )}
                >
                  宋体
                </button>
                <button
                  onClick={() => setSettings(s => ({...s, fontFamily: "sans"}))}
                  className={cn(
                    "flex-1 py-2 text-sm font-patrick rounded-lg transition-all",
                    settings.fontFamily === "sans"
                      ? (settings.isDark ? "bg-gray-600 shadow-sm text-white" : "bg-sticky-yellow shadow-sketch-sm text-sketch-text-primary")
                      : "opacity-60 hover:opacity-100"
                  )}
                >
                  手写体
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 主阅读区域 */}
      <main className="max-w-3xl mx-auto px-6 py-32 md:py-40 relative z-10">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="prose prose-lg max-w-none break-words"
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            fontFamily: settings.fontFamily === "serif" ? '"Georgia", "Noto Serif SC", serif' : '"Patrick Hand", "KaiTi", "STKaiti", cursive',
          }}
        >
          {/* 标题 */}
          <h1 className={cn(
            "text-3xl md:text-4xl font-caveat font-bold mb-16 text-center tracking-wide",
            settings.isDark ? "text-gray-100" : "text-sketch-text-primary"
          )}>
            {chapter.title}
          </h1>

          {/* 正文 */}
          <div
            className={cn(
              "leading-relaxed tracking-wide text-justify",
              settings.isDark ? "prose-invert text-gray-300" : "text-sketch-text-primary"
            )}
            dangerouslySetInnerHTML={{
              __html: markdownToHtml(chapter.content),
            }}
          />
        </motion.article>

        {/* 底部互动区 - Sketch style */}
        <div className={cn("mt-24 pt-10 border-t-2 border-dashed flex flex-col items-center", settings.isDark ? "border-white/10" : "border-sketch-text-secondary/20")}>
          <p className={cn("text-xs font-patrick mb-8 opacity-40", settings.isDark ? "text-gray-500" : "text-sketch-text-muted")}>
             —— End of Chapter ——
          </p>

          <div className="w-full flex items-center justify-between gap-4">
             <button
               onClick={goToPrevChapter}
               disabled={!chapter.navigation.prev_chapter_id}
               className={cn(
                 "flex-1 py-4 rounded-xl flex items-center justify-center gap-2 transition-all font-patrick border-2 disabled:opacity-30 disabled:cursor-not-allowed",
                 settings.isDark
                   ? "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
                   : "bg-white hover:bg-sticky-yellow-light text-sketch-text-secondary border-dashed border-sketch-text-secondary/30"
               )}
             >
               <ChevronLeft className="w-4 h-4" />
               上一章
             </button>

             {chapter.choices && chapter.choices.length > 0 ? (
               <button
                 onClick={() => setShowChoices(true)}
                 className="flex-[2] py-4 rounded-xl bg-sticky-yellow text-sketch-text-primary font-caveat text-lg font-bold shadow-sketch hover:shadow-sketch-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 border-2 border-sketch-text-primary/20 animate-pulse-subtle"
               >
                 <Sparkles className="w-5 h-5" />
                 抉择时刻
               </button>
             ) : (
                <button
                onClick={goToNextChapter}
                disabled={!chapter.navigation.next_chapter_id}
                className={cn(
                  "flex-1 py-4 rounded-xl flex items-center justify-center gap-2 transition-all font-caveat text-lg font-bold border-2 disabled:opacity-30 disabled:cursor-not-allowed",
                  settings.isDark
                    ? "bg-white/10 hover:bg-white/20 text-white border-white/20"
                    : "bg-sticky-yellow hover:shadow-sketch text-sketch-text-primary border-sketch-text-primary/20"
                )}
              >
                下一章
                <ChevronRight className="w-4 h-4" />
              </button>
             )}
          </div>
        </div>
      </main>

      {/* 沉浸式互动选择弹窗 - Sketch style */}
      <AnimatePresence>
        {showChoices && chapter.choices && chapter.choices.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-sketch-text-primary/60"
              onClick={() => setShowChoices(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white border-2 border-sketch-text-primary/20 rounded-xl p-8 shadow-sketch overflow-hidden"
            >
              {/* 装饰条纹 */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-sticky-yellow" />

              <div className="relative z-10 text-center mb-8">
                <Sparkles className="w-10 h-10 text-sticky-yellow mx-auto mb-4 animate-spin-slow" />
                <h2 className="text-2xl font-caveat font-bold text-sketch-text-primary mb-2">命运的分岔路口</h2>
                <p className="text-sketch-text-secondary font-patrick text-sm">你的选择将决定故事的走向</p>
              </div>

              <div className="space-y-4 relative z-10">
                {(chapter.choices || []).map((choice, index) => (
                  <motion.button
                    key={choice.chapter_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    onClick={() => handleChoice(choice, index)}
                    className="w-full text-left group relative p-5 rounded-xl bg-sticky-yellow-light hover:bg-sticky-yellow border-2 border-dashed border-sketch-text-secondary/30 hover:border-sketch-text-primary/40 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-sticky-pink opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-dashed border-sketch-text-secondary/30 flex items-center justify-center text-sketch-text-secondary font-caveat font-bold group-hover:bg-sticky-yellow group-hover:text-sketch-text-primary group-hover:border-sketch-text-primary/30 transition-colors">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <div>
                         <p className="text-lg font-patrick font-medium text-sketch-text-primary group-hover:text-sketch-text-primary transition-colors">
                           {choice.choice_text}
                         </p>
                         <p className="text-xs text-sketch-text-muted font-patrick mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                           <ArrowLeft className="w-3 h-3 rotate-180" /> 点击确认选择
                         </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <button
                onClick={() => setShowChoices(false)}
                className="w-full mt-6 py-3 text-sketch-text-muted font-patrick text-sm hover:text-sketch-text-secondary hover:bg-sticky-yellow-light rounded-xl border-2 border-dashed border-transparent hover:border-sketch-text-secondary/20 transition-colors"
              >
                稍后再选
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
