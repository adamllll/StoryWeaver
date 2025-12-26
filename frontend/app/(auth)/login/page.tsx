"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, Mail, Lock } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* 背景装饰光晕 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl" />
      </div>

      {/* 登录卡片 */}
      <div className="w-full max-w-md relative animate-scale-in">
        <div className="glass rounded-ios-2xl p-8 shadow-ios-float">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-purple-500" />
              <span className="text-2xl font-bold text-gray-900">织梦者</span>
            </Link>
          </div>

          {/* 标题 */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">欢迎回来</h1>
            <p className="text-gray-600">登录你的账户，继续创作之旅</p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 邮箱输入 */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-800">
                邮箱
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                  className="input-inset pl-12"
                />
              </div>
            </div>

            {/* 密码输入 */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-800">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  className="input-inset pl-12"
                />
              </div>
            </div>

            {/* 记住我和忘记密码 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  disabled={isLoading}
                  className="w-5 h-5 rounded-md border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-sm text-gray-700 cursor-pointer">
                  记住我
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                忘记密码？
              </Link>
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              登录
            </button>
          </form>

          {/* 注册链接 */}
          <p className="text-sm text-gray-500 text-center mt-6">
            还没有账户？{" "}
            <Link href="/register" className="text-purple-600 font-semibold hover:text-purple-700">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
