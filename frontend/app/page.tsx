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
  User, 
  ArrowRight, 
  Gamepad2, 
  Swords, 
  ScrollText,
  Dices
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
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

  // Handle protected route navigation with login check
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
    <div className="min-h-screen bg-gray-50/50 selection:bg-purple-200 selection:text-purple-900 flex flex-col">
      {/* 顶部导航栏 */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md"
      >
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-400 blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />
              <BookOpen className="h-6 w-6 text-purple-600 relative z-10" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              织梦者
            </span>
          </Link>
          
          <nav className="flex items-center space-x-8">
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/adventures" className="text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors">
                冒险
              </Link>
              <Link href="/novels" className="text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors">
                发现小说
              </Link>
            </div>

            {isAuthenticated && user ? (
              <div className="flex items-center space-x-4 pl-6 border-l border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 border border-white shadow-sm flex items-center justify-center">
                    <User className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <LogOut className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm">登录</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">注册</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 container py-12 md:py-20 flex flex-col justify-center">
        <motion.div 
          className="text-center mb-16 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900">
            <span className="block mb-2">编织你的</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              梦想故事
            </span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            选择你的旅程：用 AI 辅助创作小说，或者投身于一场未知的文字冒险。
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto w-full px-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* 创作模式卡片 */}
          <motion.div variants={cardVariants} whileHover="hover" className="h-full">
            <div
              onClick={() => handleProtectedNavigation("/workspace/create", "创作模式")}
              className="block h-full cursor-pointer"
            >
              <Card className="h-full border-2 hover:border-blue-500/50 transition-colors cursor-pointer overflow-hidden group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <PenTool className="h-7 w-7 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                    创作模式
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    我是作者，我要掌控一切
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    使用强大的 AI 辅助工具，从大纲生成到智能续写，打造你的完美小说。适合想要系统创作、发布连载作品的作家。
                  </p>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li className="flex items-center"><Sparkles className="w-4 h-4 mr-2 text-blue-500" /> AI 智能大纲与角色生成</li>
                    <li className="flex items-center"><Sparkles className="w-4 h-4 mr-2 text-blue-500" /> 上下文感知的智能续写</li>
                    <li className="flex items-center"><Sparkles className="w-4 h-4 mr-2 text-blue-500" /> 专业的章节管理与导出</li>
                  </ul>
                </CardContent>
                <CardFooter className="relative mt-4">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-all">
                    开始创作 <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </motion.div>

          {/* 冒险模式卡片 */}
          <motion.div variants={cardVariants} whileHover="hover" className="h-full">
            <div
              onClick={() => handleProtectedNavigation("/adventures/new", "冒险模式")}
              className="block h-full cursor-pointer"
            >
              <Card className="h-full border-2 hover:border-purple-500/50 transition-colors cursor-pointer overflow-hidden group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Gamepad2 className="h-7 w-7 text-purple-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                    冒险模式
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    我是玩家，我要探索未知
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    体验 AI 实时生成的互动式文字冒险。你的每一次选择都将改变剧情走向，投掷骰子决定命运，探索无限可能的故事分支。
                  </p>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li className="flex items-center"><Dices className="w-4 h-4 mr-2 text-purple-500" /> D100 判定系统与属性成长</li>
                    <li className="flex items-center"><Swords className="w-4 h-4 mr-2 text-purple-500" /> 实时生成的剧情与选项</li>
                    <li className="flex items-center"><ScrollText className="w-4 h-4 mr-2 text-purple-500" /> 自动整理为完整小说导出</li>
                  </ul>
                </CardContent>
                <CardFooter className="relative mt-4">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 group-hover:shadow-lg group-hover:shadow-purple-500/20 transition-all">
                    开始冒险 <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* 页脚 */}
      <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-md py-8 mt-auto">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2 opacity-80 hover:opacity-100 transition-opacity">
            <BookOpen className="h-5 w-5 text-gray-400" />
            <span className="font-semibold text-gray-700">织梦者</span>
          </div>
          <div className="text-sm text-gray-500">
            © 2025 StoryWeaver. Powered by Gemini & Claude.
          </div>
        </div>
      </footer>
    </div>
  );
}
