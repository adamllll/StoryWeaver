"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Mail, User, Lock, ArrowLeft } from "lucide-react";
import { apiClient, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "密码不一致",
        description: "两次输入的密码不一致，请重新输入",
        variant: "destructive",
      });
      return;
    }

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
    <div className="min-h-screen flex items-center justify-center px-4 grid-paper-bg">
      {/* Reset Password Card */}
      <div className="w-full max-w-md">
        <div className="bg-white border-2 border-sketch-text-primary rounded-xl p-8 shadow-sketch">
          {/* Logo */}
          <div className="flex justify-center mb-6">
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
            <h1 className="font-caveat text-2xl font-bold text-sketch-text-primary mb-2">忘记密码？</h1>
            <p className="font-patrick text-sketch-text-secondary">输入你的注册邮箱，我们将帮你重置密码</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-2">
              <label htmlFor="username" className="block font-patrick text-sm font-bold text-sketch-text-primary">
                用户名
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sketch-text-muted group-focus-within:text-sketch-text-primary transition-colors" />
                <Input
                  id="username"
                  type="text"
                  variant="sketch"
                  placeholder="你的用户名"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={isLoading}
                  className="pl-12"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="block font-patrick text-sm font-bold text-sketch-text-primary">
                注册邮箱
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

            {/* New Password Input */}
            <div className="space-y-2">
              <label htmlFor="newPassword" className="block font-patrick text-sm font-bold text-sketch-text-primary">
                新密码
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sketch-text-muted group-focus-within:text-sketch-text-primary transition-colors" />
                <Input
                  id="newPassword"
                  type="password"
                  variant="sketch"
                  placeholder="至少6位字符"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  required
                  disabled={isLoading}
                  minLength={6}
                  className="pl-12"
                />
              </div>
            </div>

            {/* Confirm New Password Input */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block font-patrick text-sm font-bold text-sketch-text-primary">
                确认新密码
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sketch-text-muted group-focus-within:text-sketch-text-primary transition-colors" />
                <Input
                  id="confirmPassword"
                  type="password"
                  variant="sketch"
                  placeholder="再次输入新密码"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={isLoading}
                  className="pl-12"
                />
              </div>
            </div>

            {/* Reset Password Button */}
            <Button
              type="submit"
              variant="sketch"
              size="lg"
              disabled={isLoading}
              loading={isLoading}
              className="w-full py-4 mt-6"
            >
              重置密码
            </Button>
          </form>

          {/* Back to Login Link */}
          <Link
            href="/login"
            className="flex items-center justify-center font-patrick text-sm text-sketch-text-secondary hover:text-sketch-text-primary mt-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回登录
          </Link>
        </div>
      </div>
    </div>
  );
}
