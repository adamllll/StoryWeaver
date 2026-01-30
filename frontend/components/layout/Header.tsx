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
        <div className="relative w-10 h-10 flex items-center justify-center bg-sticky-yellow border-2 border-sketch-text-primary rounded-xl shadow-sketch group-hover:scale-105 group-hover:shadow-sketch-lg transition-all duration-sketch ease-sketch">
          <BookOpen className="h-5 w-5 text-sketch-text-primary" />
        </div>
        <span className="text-xl font-caveat font-bold text-sketch-text-primary tracking-tight">
          织梦者
        </span>
      </Link>

      <nav className="hidden md:flex items-center gap-2">
        <Link href="/adventures" className="px-5 py-2.5 rounded-full text-sm font-patrick font-medium text-sketch-text-secondary hover:text-sketch-text-primary hover:bg-sticky-yellow/50 transition-all duration-200">
          互动冒险
        </Link>
        <Link href="/novels" className="px-5 py-2.5 rounded-full text-sm font-patrick font-medium text-sketch-text-secondary hover:text-sketch-text-primary hover:bg-sticky-yellow/50 transition-all duration-200">
          发现小说
        </Link>
      </nav>

      <div className="flex items-center gap-4">
        {isAuthenticated && user ? (
          <div className="flex items-center pl-6 border-l-2 border-dashed border-sketch-text-secondary/30">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 px-2 py-1.5 rounded-full bg-sticky-pink-light border-2 border-sketch-text-primary/30 shadow-sketch-sm transition-all duration-sketch ease-sketch hover:scale-105 hover:shadow-sketch outline-none">
                  <div className="w-8 h-8 rounded-full bg-sticky-blue border-2 border-sketch-text-primary/50 flex items-center justify-center text-sketch-text-primary text-xs font-caveat font-bold">
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-patrick font-medium text-sketch-text-primary pr-2 hidden sm:inline-block">
                    {user.username}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white/95 border-2 border-sketch-text-primary/20 shadow-sketch font-patrick">
                <DropdownMenuLabel className="font-caveat text-lg">我的账户</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.is_admin && (
                  <>
                    <DropdownMenuItem onClick={() => router.push('/admin')} className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4 text-sketch-text-secondary" />
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
            <Link href="/login">
              <Button variant="ghost" size="sm" className="rounded-full px-5 font-patrick text-sketch-text-secondary hover:text-sketch-text-primary hover:bg-sticky-yellow/30">
                登录
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="sketch" size="sm" className="rounded-full px-6">
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
        <div className="absolute inset-0 grid-paper-bg border-b-2 border-dashed border-sketch-text-secondary/30" />
        {Content}
      </motion.header>
    );
  }

  // 其他页面使用静态 Header
  return (
    <header className="sticky top-0 z-50 w-full h-20 grid-paper-bg border-b-2 border-dashed border-sketch-text-secondary/30">
      {Content}
    </header>
  );
}
