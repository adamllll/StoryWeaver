"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  LogOut,
  Shield,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  isHome?: boolean;
}

export function Header({ isHome = false }: HeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast({
      title: "已退出登录",
      description: "期待你的再次光临！",
    });
    router.refresh();
    router.push("/");
  };

  const Content = (
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
          <div className="flex items-center pl-6 border-l border-gray-200/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 px-2 py-1.5 rounded-full bg-white/50 border border-white/60 shadow-sm backdrop-blur-sm transition-transform hover:scale-105 outline-none ring-offset-2 focus:ring-2 ring-purple-500/20">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 pr-2 hidden sm:inline-block">
                    {user.username}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white/90 backdrop-blur-xl border-white/40">
                <DropdownMenuLabel>我的账户</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.is_admin && (
                  <>
                    <DropdownMenuItem onClick={() => router.push('/admin')} className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4 text-purple-600" />
                      <span>管理后台</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>退出登录</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="rounded-full px-5 text-gray-600 hover:text-gray-900 hover:bg-white/60">
                登录
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm" className="rounded-full px-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all">
                注册
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  // 如果是首页，使用 framer-motion 动画
  if (isHome) {
    return (
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="sticky top-0 z-50 w-full h-20"
      >
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[20px] border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.03)] supports-[backdrop-filter]:bg-white/50" />
        {Content}
      </motion.header>
    );
  }

  // 其他页面使用静态 Header
  return (
    <header className="sticky top-0 z-50 w-full h-20 bg-white/70 backdrop-blur-[20px] border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.03)] supports-[backdrop-filter]:bg-white/50">
      {Content}
    </header>
  );
}
