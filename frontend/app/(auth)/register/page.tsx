"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, Mail, Lock, User } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { register, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "注册失败",
        description: "两次输入的密码不一致",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "注册失败",
        description: "密码长度至少为6位",
        variant: "destructive",
      });
      return;
    }

    try {
      await register(formData.username, formData.email, formData.password);
      toast({
        title: "注册成功",
        description: "欢迎加入织梦者！",
      });
      router.push("/");
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "注册失败",
          description: error.detail,
          variant: "destructive",
        });
      } else {
        toast({
          title: "注册失败",
          description: "网络错误，请稍后再试",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-ios-bg">
      {/* 背景装饰光晕 */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-200/30 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-200/30 blur-[100px] rounded-full pointer-events-none" />

      {/* 注册卡片 */}
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
            <h1 className="text-xl font-bold text-gray-900 mb-1">创建账户</h1>
            <p className="text-sm text-gray-500">加入织梦者，开启你的创作之旅</p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 用户名输入 */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">
                用户名
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                <input
                  id="username"
                  type="text"
                  placeholder="你的昵称"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={isLoading}
                  minLength={2}
                  maxLength={50}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-ios-xl focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-100/50 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

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
              <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">
                密码
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                <input
                  id="password"
                  type="password"
                  placeholder="至少6位字符"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  minLength={6}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-ios-xl focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-100/50 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* 确认密码输入 */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">
                确认密码
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="再次输入密码"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-ios-xl focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-100/50 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* 注册按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-ios-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 mt-6"
            >
              {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
              注册
            </button>
          </form>

          {/* 登录链接 */}
          <div className="mt-8 text-center pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              已有账户？{" "}
              <Link href="/login" className="text-purple-600 font-bold hover:text-purple-700 hover:underline transition-all">
                立即登录
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
