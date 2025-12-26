"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, Mail, User, Lock, ArrowLeft } from "lucide-react";
import { apiClient, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证密码一致
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "密码不一致",
        description: "两次输入的密码不一致，请重新输入",
        variant: "destructive",
      });
      return;
    }

    // 验证密码长度
    if (formData.newPassword.length < 6) {
      toast({
        title: "密码过短",
        description: "密码长度至少为6位",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post("/auth/reset-password", {
        username: formData.username,
        email: formData.email,
        new_password: formData.newPassword,
      });

      toast({
        title: "密码重置成功",
        description: "请使用新密码登录",
      });

      // 跳转到登录页
      router.push("/login");
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "密码重置失败",
          description: error.detail,
          variant: "destructive",
        });
      } else {
        toast({
          title: "密码重置失败",
          description: "网络错误，请稍后再试",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* 背景装饰光晕 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl" />
      </div>

      {/* 重置密码卡片 */}
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">忘记密码？</h1>
            <p className="text-gray-600">输入你的注册邮箱，我们将帮你重置密码</p>
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
                  placeholder="你的用户名"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={isLoading}
                  className="input-inset pl-12"
                />
              </div>
            </div>

            {/* 注册邮箱输入 */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-800">
                注册邮箱
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

            {/* 新密码输入 */}
            <div className="space-y-2">
              <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-800">
                新密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="newPassword"
                  type="password"
                  placeholder="至少6位字符"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  required
                  disabled={isLoading}
                  minLength={6}
                  className="input-inset pl-12"
                />
              </div>
            </div>

            {/* 确认新密码输入 */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-800">
                确认新密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="再次输入新密码"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={isLoading}
                  className="input-inset pl-12"
                />
              </div>
            </div>

            {/* 重置密码按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              重置密码
            </button>
          </form>

          {/* 返回登录链接 */}
          <Link
            href="/login"
            className="flex items-center justify-center text-sm text-gray-600 hover:text-purple-600 mt-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回登录
          </Link>
        </div>
      </div>
    </div>
  );
}
