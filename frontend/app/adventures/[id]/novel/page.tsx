"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  List,
  Settings,
  Moon,
  Sun,
  Type,
  ChevronLeft,
  ChevronRight,
  Loader2,
  GitFork,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { Adventure, StoryNode } from "@/lib/adventure-types";
import { useToast } from "@/components/ui/use-toast";
import { markdownToHtml } from "@/lib/markdown";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

export default function AdventureNovelReaderPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const adventureId = Number(params.id);

  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const [settings, setSettings] = useState({
    fontSize: 18,
    lineHeight: 1.8,
    isDark: false,
    fontFamily: "serif" as "serif" | "sans",
  });

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

  useEffect(() => {
    if (!adventureId) return;
    setIsLoading(true);
    Promise.all([
      apiClient.get<Adventure>(`/adventures/${adventureId}`),
      apiClient.get<StoryNode[]>(`/adventures/${adventureId}/nodes`),
    ])
      .then(([adv, fetchedNodes]) => {
        const sorted = [...fetchedNodes].sort((a, b) => a.chapter_num - b.chapter_num);
        setAdventure(adv);
        setNodes(sorted);
        setCurrentIndex(0);
      })
      .catch(() => {
        toast({
          title: "加载失败",
          description: "无法获取冒险小说内容",
          variant: "destructive",
        });
      })
      .finally(() => setIsLoading(false));
  }, [adventureId, toast]);

  useEffect(() => {
    if (nodes.length > 0) {
      window.scrollTo(0, 0);
    }
  }, [currentIndex, nodes.length]);

  const currentNode = nodes[currentIndex];

  const goToPrevChapter = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNextChapter = () => {
    setCurrentIndex((prev) => Math.min(nodes.length - 1, prev + 1));
  };

  if (isLoading) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center transition-colors duration-500",
        settings.isDark ? "bg-gray-900" : "grid-paper-bg"
      )}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={cn("w-8 h-8 animate-spin", settings.isDark ? "text-sticky-yellow" : "text-sketch-text-primary")} />
          <span className={cn("text-sm font-patrick", settings.isDark ? "text-gray-400" : "text-sketch-text-secondary")}>正在装订书籍...</span>
        </div>
      </div>
    );
  }

  if (!adventure || !currentNode) return null;

  return (
    <div
      className={cn(
        "min-h-screen transition-colors duration-500 selection:bg-sticky-yellow/50",
        settings.isDark ? "bg-[#1a1a1c] text-gray-200" : "grid-paper-bg text-sketch-text-primary"
      )}
    >
      {/* Header - Sketch style with auto-hide */}
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
          <button
            onClick={() => router.push("/adventures")}
            className={cn(
              "p-2 rounded-xl transition-colors flex-shrink-0 border-2 border-dashed",
              settings.isDark ? "border-white/20 hover:bg-white/10 text-gray-400" : "border-sketch-text-secondary/30 hover:bg-sticky-yellow-light text-sketch-text-secondary"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-px h-4 bg-current opacity-20" />
          <h1 className={cn("text-lg font-caveat font-bold truncate max-w-[200px] md:max-w-md", settings.isDark ? "text-gray-100" : "text-sketch-text-primary")}>
            {adventure.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/adventures/${adventureId}/tree`)}
            className={cn(
              "p-2 rounded-xl transition-colors border-2 border-dashed",
              settings.isDark ? "border-white/20 hover:bg-white/10 text-gray-400" : "border-sketch-text-secondary/30 hover:bg-sticky-pink-light text-sketch-text-secondary"
            )}
          >
            <GitFork className="w-5 h-5" />
          </button>
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

      {/* Table of contents - Sketch style */}
      <AnimatePresence>
        {showToc && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-sketch-text-primary/20"
              onClick={() => setShowToc(false)}
            />
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              className={cn(
                "fixed top-0 left-0 z-50 h-full w-72 p-6 border-r-2 border-dashed",
                settings.isDark ? "bg-gray-900/95 border-white/10" : "bg-white/95 border-sketch-text-secondary/30"
              )}
            >
              <h2 className={cn("text-lg font-caveat font-bold mb-4", settings.isDark ? "text-gray-100" : "text-sketch-text-primary")}>章节目录</h2>
              <div className="space-y-2 overflow-y-auto max-h-[calc(100%-3rem)] pr-1">
                {nodes.map((node, index) => (
                  <button
                    key={node.id}
                    onClick={() => {
                      setCurrentIndex(index);
                      setShowToc(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm font-patrick transition-colors border-2",
                      index === currentIndex
                        ? (settings.isDark ? "bg-white/10 text-white border-white/20" : "bg-sticky-yellow border-sketch-text-primary/20 text-sketch-text-primary")
                        : (settings.isDark ? "text-gray-400 hover:bg-white/10 border-transparent" : "text-sketch-text-secondary hover:bg-sticky-yellow-light border-transparent")
                    )}
                  >
                    <span className="text-xs opacity-60 mr-2">{index + 1}.</span>
                    {node.title || `第 ${node.chapter_num} 章`}
                  </button>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Settings panel - Sketch style */}
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

              {/* Font size */}
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

              {/* Background mode */}
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

              {/* Font family */}
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

      {/* Main reading area */}
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
          <h1
            className={cn(
              "text-3xl md:text-4xl font-caveat font-bold mb-10 text-center tracking-wide",
              settings.isDark ? "text-gray-100" : "text-sketch-text-primary"
            )}
          >
            {currentNode.title || `第 ${currentNode.chapter_num} 章`}
          </h1>

          <div
            className={cn(
              "leading-relaxed tracking-wide text-justify",
              settings.isDark ? "prose-invert text-gray-300" : "text-sketch-text-primary"
            )}
            dangerouslySetInnerHTML={{
              __html: markdownToHtml(currentNode.content),
            }}
          />
        </motion.article>

        <div className={cn("mt-20 pt-10 border-t-2 border-dashed flex flex-col items-center", settings.isDark ? "border-white/10" : "border-sketch-text-secondary/20")}>
          <p className={cn("text-xs font-patrick mb-8 opacity-40", settings.isDark ? "text-gray-500" : "text-sketch-text-muted")}>
            —— End of Chapter ——
          </p>
          <div className="w-full flex items-center justify-between gap-4">
            <button
              onClick={goToPrevChapter}
              disabled={currentIndex === 0}
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
            <button
              onClick={goToNextChapter}
              disabled={currentIndex >= nodes.length - 1}
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
          </div>
        </div>

        <div className={cn("py-12 text-center font-patrick", settings.isDark ? "text-gray-500" : "text-sketch-text-muted")}>
          {adventure.is_finished ? "全书完" : "未完待续..."}
        </div>
      </main>
    </div>
  );
}
