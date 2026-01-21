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
        settings.isDark ? "bg-gray-900" : "bg-ios-reading"
      )}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={cn("w-8 h-8 animate-spin", settings.isDark ? "text-purple-400" : "text-purple-600")} />
          <span className={cn("text-sm font-medium", settings.isDark ? "text-gray-400" : "text-gray-500")}>正在装订书籍...</span>
        </div>
      </div>
    );
  }

  if (!adventure || !currentNode) return null;

  return (
    <div
      className={cn(
        "min-h-screen transition-colors duration-500 selection:bg-purple-300/50",
        settings.isDark ? "bg-[#1a1a1c] text-gray-200" : "bg-[#F9F9F6] text-gray-800"
      )}
    >
      {/* 顶部导航栏 (自动隐藏) */}
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: isHeaderVisible ? 0 : -80 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-between px-4 md:px-8 border-b backdrop-blur-xl transition-colors duration-500",
          settings.isDark
            ? "bg-gray-900/80 border-white/5"
            : "bg-white/80 border-gray-200/50"
        )}
      >
        <div className="flex items-center gap-4 overflow-hidden">
          <button
            onClick={() => router.push("/adventures")}
            className={cn(
              "p-2 rounded-full transition-colors flex-shrink-0",
              settings.isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-black/5 text-gray-600"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-px h-4 bg-gray-500/20" />
          <h1 className="text-sm font-bold truncate max-w-[200px] md:max-w-md opacity-90">
            {adventure.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/adventures/${adventureId}/tree`)}
            className={cn(
              "p-2 rounded-full transition-colors",
              settings.isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-black/5 text-gray-600"
            )}
          >
            <GitFork className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowToc(!showToc)}
            className={cn(
              "p-2 rounded-full transition-colors",
              settings.isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-black/5 text-gray-600"
            )}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "p-2 rounded-full transition-colors",
              settings.isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-black/5 text-gray-600",
              showSettings && (settings.isDark ? "bg-white/10 text-white" : "bg-black/5 text-black")
            )}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </motion.header>

      {/* 章节目录 */}
      <AnimatePresence>
        {showToc && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowToc(false)}
            />
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              className={cn(
                "fixed top-0 left-0 z-50 h-full w-72 p-6 border-r backdrop-blur-xl",
                settings.isDark ? "bg-gray-900/90 border-white/10" : "bg-white/90 border-gray-200"
              )}
            >
              <h2 className={cn("text-sm font-bold mb-4", settings.isDark ? "text-gray-100" : "text-gray-900")}>章节目录</h2>
              <div className="space-y-2 overflow-y-auto max-h-[calc(100%-3rem)] pr-1">
                {nodes.map((node, index) => (
                  <button
                    key={node.id}
                    onClick={() => {
                      setCurrentIndex(index);
                      setShowToc(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      index === currentIndex
                        ? (settings.isDark ? "bg-white/10 text-white" : "bg-black/5 text-gray-900")
                        : (settings.isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-600 hover:bg-black/5")
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

      {/* 设置面板 */}
      <AnimatePresence>
        {showSettings && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className={cn(
                "fixed top-20 right-4 md:right-8 z-50 w-80 rounded-ios-2xl p-6 shadow-2xl border backdrop-blur-3xl",
                settings.isDark
                  ? "bg-gray-800/90 border-gray-700 text-gray-100"
                  : "bg-white/90 border-white/60 text-gray-900"
              )}
            >
              <h3 className="text-xs font-bold uppercase tracking-wider opacity-50 mb-4">阅读偏好</h3>

              {/* 字体大小 */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2 opacity-80">
                  <span>小</span>
                  <span>字号</span>
                  <span>大</span>
                </div>
                <div className={cn("flex items-center p-1 rounded-full", settings.isDark ? "bg-black/20" : "bg-gray-100")}>
                  <button onClick={() => setSettings(s => ({...s, fontSize: Math.max(14, s.fontSize - 1)}))} className="p-2 flex-1 flex justify-center"><Type className="w-3 h-3" /></button>
                  <div className="w-px h-4 bg-current opacity-10" />
                  <button onClick={() => setSettings(s => ({...s, fontSize: Math.min(24, s.fontSize + 1)}))} className="p-2 flex-1 flex justify-center"><Type className="w-5 h-5" /></button>
                </div>
              </div>

              {/* 背景模式 */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setSettings(s => ({...s, isDark: false}))}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-xl border transition-all",
                    !settings.isDark
                      ? "bg-[#F9F9F6] border-purple-400 ring-1 ring-purple-400 text-gray-900"
                      : "bg-gray-700 border-transparent hover:bg-gray-600"
                  )}
                >
                  <Sun className="w-4 h-4" />
                  <span>护眼</span>
                </button>
                <button
                  onClick={() => setSettings(s => ({...s, isDark: true}))}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-xl border transition-all",
                    settings.isDark
                      ? "bg-[#1a1a1c] border-purple-400 ring-1 ring-purple-400 text-white"
                      : "bg-gray-100 border-transparent hover:bg-gray-200"
                  )}
                >
                  <Moon className="w-4 h-4" />
                  <span>深色</span>
                </button>
              </div>

              {/* 字体选择 */}
              <div className="flex p-1 rounded-xl bg-gray-500/10">
                <button
                  onClick={() => setSettings(s => ({...s, fontFamily: "serif"}))}
                  className={cn(
                    "flex-1 py-2 text-sm font-serif rounded-lg transition-all",
                    settings.fontFamily === "serif"
                      ? (settings.isDark ? "bg-gray-600 shadow-sm text-white" : "bg-white shadow-sm text-gray-900")
                      : "opacity-60 hover:opacity-100"
                  )}
                >
                  宋体
                </button>
                <button
                  onClick={() => setSettings(s => ({...s, fontFamily: "sans"}))}
                  className={cn(
                    "flex-1 py-2 text-sm font-sans rounded-lg transition-all",
                    settings.fontFamily === "sans"
                      ? (settings.isDark ? "bg-gray-600 shadow-sm text-white" : "bg-white shadow-sm text-gray-900")
                      : "opacity-60 hover:opacity-100"
                  )}
                >
                  黑体
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
            fontFamily: settings.fontFamily === "serif" ? '"Georgia", "Noto Serif SC", serif' : 'system-ui, sans-serif',
          }}
        >
          <h1
            className={cn(
              "text-3xl md:text-4xl font-bold mb-10 text-center tracking-wide",
              settings.isDark ? "text-gray-100" : "text-gray-900"
            )}
          >
            {currentNode.title || `第 ${currentNode.chapter_num} 章`}
          </h1>

          <div
            className={cn(
              "leading-relaxed tracking-wide text-justify",
              settings.isDark ? "prose-invert text-gray-300" : "text-gray-800"
            )}
            dangerouslySetInnerHTML={{
              __html: markdownToHtml(currentNode.content),
            }}
          />
        </motion.article>

        <div className="mt-20 pt-10 border-t border-gray-500/10 flex flex-col items-center">
          <p className={cn("text-xs font-mono mb-8 opacity-40", settings.isDark ? "text-gray-500" : "text-gray-400")}>
            —— End of Chapter ——
          </p>
          <div className="w-full flex items-center justify-between gap-4">
            <button
              onClick={goToPrevChapter}
              disabled={currentIndex === 0}
              className={cn(
                "flex-1 py-4 rounded-ios-xl flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed",
                settings.isDark
                  ? "bg-white/5 hover:bg-white/10 text-gray-300"
                  : "bg-black/5 hover:bg-black/10 text-gray-600"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              上一章
            </button>
            <button
              onClick={goToNextChapter}
              disabled={currentIndex >= nodes.length - 1}
              className={cn(
                "flex-1 py-4 rounded-ios-xl flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed",
                settings.isDark
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-black/80 hover:bg-black text-white shadow-lg"
              )}
            >
              下一章
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="py-12 text-center text-gray-400">
          {adventure.is_finished ? "全书完" : "未完待续..."}
        </div>
      </main>
    </div>
  );
}
