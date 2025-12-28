"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, Mail, Lock } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(formData.email, formData.password, formData.rememberMe);
      toast({
        title: "登录成功",
        description: "欢迎回来！",
      });
      router.push("/");
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "登录失败",
          description: error.detail,
          variant: "destructive",
        });
      } else {
        toast({
          title: "登录失败",
          description: "网络错误，请稍后再试",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-ios-bg">
      {/* 背景装饰光晕 */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-200/30 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-200/30 blur-[100px] rounded-full pointer-events-none" />

      {/* 登录卡片 */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass rounded-ios-2xl p-8 md:p-10 shadow-ios-float border border-white/60 relative overflow-hidden">
          
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex flex-col items-center gap-3 group">
              <div className="relative w-14 h-14 flex items-center justify-center bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/20 group-hover:scale-105 group-hover:shadow-purple-500/30 transition-all duration-300">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
                织梦者
              </span>
            </Link>
          </div>

          {/* 标题 */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-gray-900 mb-1">欢迎回来</h1>
            <p className="text-sm text-gray-500">登录你的账户，继续创作之旅</p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 邮箱输入 */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">
                邮箱
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-ios-xl focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-100/50 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* 密码输入 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                  密码
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium hover:underline"
                >
                  忘记密码？
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-ios-xl focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-100/50 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* 记住我 */}
            <div className="flex items-center space-x-3 py-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                disabled={isLoading}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer select-none">
                记住我
              </label>
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-ios-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
              登录
            </button>
          </form>

          {/* 注册链接 */}
          <div className="mt-8 text-center pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              还没有账户？{" "}
              <Link href="/register" className="text-purple-600 font-bold hover:text-purple-700 hover:underline transition-all">
                立即注册
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
