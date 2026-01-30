"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import {
  BookOpen,
  Sparkles,
  PenTool,
  ArrowRight,
  Gamepad2,
  Swords,
  ScrollText,
  Dices,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { Header } from "@/components/layout/Header";

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const cardVariants: Variants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
    },
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, [checkAuth]);

  const handleProtectedNavigation = (path: string, featureName: string) => {
    if (!isAuthenticated) {
      toast({
        title: "请先登录",
        description: `登录后即可使用「${featureName}」功能哦～`,
        variant: "default",
      });
      router.push("/login");
      return;
    }
    router.push(path);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen grid-paper-bg text-sketch-text-primary selection:bg-sticky-yellow selection:text-sketch-text-primary flex flex-col relative overflow-hidden">

      {/* 顶部导航栏 */}
      <Header isHome />

      {/* Main Content */}
      <main className="flex-1 container py-12 md:py-24 flex flex-col justify-center relative z-10">
        <motion.div
          className="text-center mb-16 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-sticky-pink-light border-2 border-dashed border-sketch-text-secondary/30 mb-4">
            <span className="text-xs font-patrick font-semibold text-sketch-text-secondary flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sketch-text-muted" />
              AI 驱动的沉浸式创作平台
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-7xl font-caveat font-bold tracking-tight text-sketch-text-primary leading-[1.1]">
            <span className="block mb-2">编织你的</span>
            <span className="text-sketch-text-secondary underline decoration-wavy decoration-sticky-yellow underline-offset-8">
              梦想故事
            </span>
          </h1>
          <p className="text-lg font-patrick text-sketch-text-secondary max-w-2xl mx-auto leading-relaxed">
            选择你的旅程：用 AI 辅助创作小说，或者投身于一场未知的文字冒险。
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto w-full px-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* 创作模式卡片 */}
          <motion.div variants={cardVariants} whileHover="hover" className="h-full">
            <div
              onClick={() => handleProtectedNavigation("/workspace/create", "创作模式")}
              className="block h-full cursor-pointer group"
            >
              <div className="h-full sticky-note bg-sticky-blue-light relative overflow-hidden">
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-16 h-16 rounded-xl bg-sticky-blue border-2 border-sketch-text-primary/30 flex items-center justify-center mb-6 shadow-sketch group-hover:scale-110 transition-all duration-sketch ease-sketch text-sketch-text-primary">
                    <PenTool className="h-8 w-8" />
                  </div>

                  <h3 className="text-2xl font-caveat font-bold text-sketch-text-primary mb-2 group-hover:text-sketch-text-secondary transition-colors">
                    创作模式
                  </h3>
                  <p className="font-patrick text-sketch-text-muted text-sm font-medium mb-6">我是作者，我要掌控一切</p>

                  <div className="space-y-4 mb-8 flex-1">
                    <p className="font-patrick text-sketch-text-secondary leading-relaxed text-sm">
                      使用强大的 AI 辅助工具，从大纲生成到智能续写，打造你的完美小说。适合想要系统创作、发布连载作品的作家。
                    </p>
                    <ul className="space-y-2.5">
                      {[
                        "AI 智能大纲与角色生成",
                        "上下文感知的智能续写",
                        "专业的章节管理与导出"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center text-sm font-patrick text-sketch-text-secondary">
                          <div className="w-5 h-5 rounded-full bg-sticky-blue border border-sketch-text-primary/20 flex items-center justify-center mr-3 text-sketch-text-primary">
                            <Sparkles className="w-3 h-3" />
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto">
                    <div className="w-full py-4 rounded-xl bg-sticky-blue border-2 border-sketch-text-primary/30 text-sketch-text-primary font-caveat font-bold text-lg flex items-center justify-center shadow-sketch group-hover:shadow-sketch-lg group-hover:-translate-y-0.5 transition-all duration-sketch ease-sketch">
                      开始创作 <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 冒险模式卡片 */}
          <motion.div variants={cardVariants} whileHover="hover" className="h-full">
            <div
              onClick={() => handleProtectedNavigation("/adventures/new", "冒险模式")}
              className="block h-full cursor-pointer group"
            >
              <div className="h-full sticky-note bg-sticky-yellow-light relative overflow-hidden">
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-16 h-16 rounded-xl bg-sticky-yellow border-2 border-sketch-text-primary/30 flex items-center justify-center mb-6 shadow-sketch group-hover:scale-110 transition-all duration-sketch ease-sketch text-sketch-text-primary">
                    <Gamepad2 className="h-8 w-8" />
                  </div>

                  <h3 className="text-2xl font-caveat font-bold text-sketch-text-primary mb-2 group-hover:text-sketch-text-secondary transition-colors">
                    冒险模式
                  </h3>
                  <p className="font-patrick text-sketch-text-muted text-sm font-medium mb-6">我是玩家，我要探索未知</p>

                  <div className="space-y-4 mb-8 flex-1">
                    <p className="font-patrick text-sketch-text-secondary leading-relaxed text-sm">
                      体验 AI 实时生成的互动式文字冒险。你的每一次选择都将改变剧情走向，投掷骰子决定命运，探索无限可能的故事分支。
                    </p>
                    <ul className="space-y-2.5">
                      {[
                        { icon: Dices, text: "D100 判定系统与属性成长" },
                        { icon: Swords, text: "实时生成的剧情与选项" },
                        { icon: ScrollText, text: "自动整理为完整小说导出" }
                      ].map((item, i) => (
                        <li key={i} className="flex items-center text-sm font-patrick text-sketch-text-secondary">
                          <div className="w-5 h-5 rounded-full bg-sticky-yellow border border-sketch-text-primary/20 flex items-center justify-center mr-3 text-sketch-text-primary">
                            <item.icon className="w-3 h-3" />
                          </div>
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto">
                    <div className="w-full py-4 rounded-xl bg-sticky-yellow border-2 border-sketch-text-primary/30 text-sketch-text-primary font-caveat font-bold text-lg flex items-center justify-center shadow-sketch group-hover:shadow-sketch-lg group-hover:-translate-y-0.5 transition-all duration-sketch ease-sketch">
                      开始冒险 <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* 页脚 */}
      <footer className="border-t-2 border-dashed border-sketch-text-secondary/30 grid-paper-bg py-8 mt-auto relative z-10">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2 opacity-60 hover:opacity-100 transition-opacity">
            <BookOpen className="h-4 w-4 text-sketch-text-muted" />
            <span className="font-patrick font-medium text-sm text-sketch-text-secondary">织梦者 StoryWeaver</span>
          </div>
          <div className="font-patrick text-xs text-sketch-text-muted">
            © 2025 Created by Claude, Gemini & Codex with ❤️
          </div>
        </div>
      </footer>
    </div>
  );
}
