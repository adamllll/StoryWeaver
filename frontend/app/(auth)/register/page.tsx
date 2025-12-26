"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, Mail, Lock, User } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

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

    // 验证密码一致
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "注册失败",
        description: "两次输入的密码不一致",
        variant: "destructive",
      });
      return;
    }

    // 验证密码长度
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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* 背景装饰光晕 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl" />
      </div>

      {/* 注册卡片 */}
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">创建账户</h1>
            <p className="text-gray-600">加入织梦者，开启你的创作之旅</p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 用户名输入 */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-semibold text-gray-800">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                  className="input-inset pl-12"
                />
              </div>
            </div>

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
                  placeholder="至少6位字符"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  minLength={6}
                  className="input-inset pl-12"
                />
              </div>
            </div>

            {/* 确认密码输入 */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-800">
                确认密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="再次输入密码"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={isLoading}
                  className="input-inset pl-12"
                />
              </div>
            </div>

            {/* 注册按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              注册
            </button>
          </form>

          {/* 登录链接 */}
          <p className="text-sm text-gray-500 text-center mt-6">
            已有账户？{" "}
            <Link href="/login" className="text-purple-600 font-semibold hover:text-purple-700">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
