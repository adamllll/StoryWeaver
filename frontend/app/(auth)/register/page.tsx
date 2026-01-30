"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, Mail, Lock, User } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="min-h-screen flex items-center justify-center px-4 grid-paper-bg">
      {/* Register Card */}
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
            <h1 className="font-caveat text-2xl font-bold text-sketch-text-primary mb-1">创建账户</h1>
            <p className="font-patrick text-sketch-text-secondary">加入织梦者，开启你的创作之旅</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="block font-patrick text-sm font-bold text-sketch-text-primary ml-1">
                用户名
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sketch-text-muted group-focus-within:text-sketch-text-primary transition-colors" />
                <Input
                  id="username"
                  type="text"
                  variant="sketch"
                  placeholder="你的昵称"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={isLoading}
                  minLength={2}
                  maxLength={50}
                  className="pl-12"
                />
              </div>
            </div>

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
              <label htmlFor="password" className="block font-patrick text-sm font-bold text-sketch-text-primary ml-1">
                密码
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sketch-text-muted group-focus-within:text-sketch-text-primary transition-colors" />
                <Input
                  id="password"
                  type="password"
                  variant="sketch"
                  placeholder="至少6位字符"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  minLength={6}
                  className="pl-12"
                />
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block font-patrick text-sm font-bold text-sketch-text-primary ml-1">
                确认密码
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sketch-text-muted group-focus-within:text-sketch-text-primary transition-colors" />
                <Input
                  id="confirmPassword"
                  type="password"
                  variant="sketch"
                  placeholder="再次输入密码"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={isLoading}
                  className="pl-12"
                />
              </div>
            </div>

            {/* Register Button */}
            <Button
              type="submit"
              variant="sketch"
              size="lg"
              disabled={isLoading}
              loading={isLoading}
              className="w-full py-4 mt-6"
            >
              注册
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center pt-6 border-t-2 border-dashed border-sketch-text-muted/30">
            <p className="font-patrick text-sketch-text-secondary">
              已有账户？{" "}
              <Link href="/login" className="font-bold text-sketch-text-primary hover:underline">
                立即登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
