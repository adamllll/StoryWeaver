"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import {
  BookOpen,
  Sparkles,
  PenTool,
  LogOut,
  ArrowRight,
  Gamepad2,
  Swords,
  ScrollText,
  Dices
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

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
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, [checkAuth]);

  const handleLogout = () => {
    logout();
    toast({
      title: "已退出登录",
      description: "期待你的再次光临！",
    });
    router.refresh();
  };

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
    <div className="min-h-screen bg-ios-bg text-gray-900 selection:bg-purple-100 selection:text-purple-900 flex flex-col relative overflow-hidden">
      
      {/* 装饰性背景 */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-purple-100/40 to-transparent pointer-events-none z-0" />
      <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-purple-200/20 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-200/20 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* 顶部导航栏 */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="sticky top-0 z-50 w-full h-20"
      >
        {/* 毛玻璃背景层 */}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[20px] border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.03)] supports-[backdrop-filter]:bg-white/50" />

        <div className="container h-full relative flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/20 group-hover:scale-105 group-hover:shadow-purple-500/30 transition-all duration-300">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
              织梦者
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/adventures" className="px-5 py-2.5 rounded-full text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-white/60 transition-all duration-200">
              互动冒险
            </Link>
            <Link href="/novels" className="px-5 py-2.5 rounded-full text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-white/60 transition-all duration-200">
              发现小说
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3 pl-6 border-l border-gray-200/50">
                <div className="flex items-center gap-3 px-2 py-1.5 rounded-full bg-white/50 border border-white/60 shadow-sm backdrop-blur-sm transition-transform hover:scale-105">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 pr-2 hidden sm:inline-block">
                    {user.username}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2.5 hover:bg-white/80 rounded-full transition-colors text-gray-400 hover:text-red-500 shadow-sm border border-transparent hover:border-red-100"
                  title="退出登录"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="rounded-full px-5 text-gray-600 hover:text-gray-900 hover:bg-white/60">
                    登录
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="rounded-full px-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all">
                    注册
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 container py-12 md:py-24 flex flex-col justify-center relative z-10">
        <motion.div 
          className="text-center mb-16 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-white/50 shadow-sm mb-4">
            <span className="text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-500" />
              AI 驱动的沉浸式创作平台
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
            <span className="block mb-2">编织你的</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 animate-gradient-x">
              梦想故事
            </span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
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
              <div className="h-full glass rounded-ios-2xl p-8 border border-white/60 shadow-ios-float hover:shadow-ios-elevated transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300 text-white">
                    <PenTool className="h-8 w-8" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                    创作模式
                  </h3>
                  <p className="text-gray-500 text-sm font-medium mb-6">我是作者，我要掌控一切</p>
                  
                  <div className="space-y-4 mb-8 flex-1">
                    <p className="text-gray-600 leading-relaxed text-sm">
                      使用强大的 AI 辅助工具，从大纲生成到智能续写，打造你的完美小说。适合想要系统创作、发布连载作品的作家。
                    </p>
                    <ul className="space-y-2.5">
                      {[
                        "AI 智能大纲与角色生成",
                        "上下文感知的智能续写",
                        "专业的章节管理与导出"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center text-sm text-gray-600">
                          <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center mr-3 text-blue-500">
                            <Sparkles className="w-3 h-3" />
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto">
                    <div className="w-full py-4 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
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
              <div className="h-full glass rounded-ios-2xl p-8 border border-white/60 shadow-ios-float hover:shadow-ios-elevated transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300 text-white">
                    <Gamepad2 className="h-8 w-8" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">
                    冒险模式
                  </h3>
                  <p className="text-gray-500 text-sm font-medium mb-6">我是玩家，我要探索未知</p>
                  
                  <div className="space-y-4 mb-8 flex-1">
                    <p className="text-gray-600 leading-relaxed text-sm">
                      体验 AI 实时生成的互动式文字冒险。你的每一次选择都将改变剧情走向，投掷骰子决定命运，探索无限可能的故事分支。
                    </p>
                    <ul className="space-y-2.5">
                      {[
                        { icon: Dices, text: "D100 判定系统与属性成长" },
                        { icon: Swords, text: "实时生成的剧情与选项" },
                        { icon: ScrollText, text: "自动整理为完整小说导出" }
                      ].map((item, i) => (
                        <li key={i} className="flex items-center text-sm text-gray-600">
                          <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center mr-3 text-purple-500">
                            <item.icon className="w-3 h-3" />
                          </div>
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto">
                    <div className="w-full py-4 rounded-xl bg-purple-50 text-purple-700 font-bold flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
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
      <footer className="border-t border-white/20 bg-white/30 backdrop-blur-xl py-8 mt-auto relative z-10">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2 opacity-60 hover:opacity-100 transition-opacity">
            <BookOpen className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-sm text-gray-600">织梦者 StoryWeaver</span>
          </div>
          <div className="text-xs text-gray-400">
            © 2025 Created by Serena with ❤️
          </div>
        </div>
      </footer>
    </div>
  );
}
