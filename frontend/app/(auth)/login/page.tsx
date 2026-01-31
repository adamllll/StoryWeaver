"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Mail, Lock } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="min-h-screen flex items-center justify-center px-4 grid-paper-bg">
      {/* Login Card */}
      <div className="w-full max-w-md">
        <div className="bg-white border-2 border-sketch-text-primary rounded-xl p-8 md:p-10 shadow-sketch">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex flex-col items-center gap-3 group">
              <div className="relative w-14 h-14 flex items-center justify-center bg-sticky-yellow border-2 border-sketch-text-primary rounded-xl shadow-sketch group-hover:-translate-y-1 group-hover:shadow-sketch-lg transition-all duration-sketch ease-sketch">
                <BookOpen className="h-7 w-7 text-sketch-text-primary" />
              </div>
              <span className="font-caveat text-3xl font-bold text-sketch-text-primary">
                织梦者
              </span>
            </Link>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="font-caveat text-2xl font-bold text-sketch-text-primary mb-1">欢迎回来</h1>
            <p className="font-patrick text-sketch-text-secondary">登录你的账户，继续创作之旅</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block font-patrick text-sm font-bold text-sketch-text-primary ml-1">
                邮箱
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sketch-text-muted group-focus-within:text-sketch-text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  variant="sketch"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                  className="pl-12"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label htmlFor="password" className="block font-patrick text-sm font-bold text-sketch-text-primary">
                  密码
                </label>
                <Link
                  href="/forgot-password"
                  className="font-patrick text-sm text-sketch-text-primary hover:underline"
                >
                  忘记密码？
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sketch-text-muted group-focus-within:text-sketch-text-primary transition-colors" />
                <Input
                  id="password"
                  type="password"
                  variant="sketch"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  className="pl-12"
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-3 py-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                disabled={isLoading}
                className="w-4 h-4 rounded border-2 border-sketch-text-secondary text-sticky-yellow focus:ring-sketch-text-primary cursor-pointer"
              />
              <label htmlFor="rememberMe" className="font-patrick text-sm text-sketch-text-secondary cursor-pointer select-none">
                记住我
              </label>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              variant="sketch"
              size="lg"
              disabled={isLoading}
              loading={isLoading}
              className="w-full py-4"
            >
              登录
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center pt-6 border-t-2 border-dashed border-sketch-text-muted/30">
            <p className="font-patrick text-sketch-text-secondary">
              还没有账户？{" "}
              <Link href="/register" className="font-bold text-sketch-text-primary hover:underline">
                立即注册
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
