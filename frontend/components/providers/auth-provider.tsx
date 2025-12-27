"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { Loader2 } from "lucide-react";

/**
 * 认证提供者组件
 *
 * 职责：
 * 1. 应用启动时自动检查认证状态
 * 2. 验证 localStorage 中的 token 是否有效
 * 3. 如果 token 有效，恢复用户状态
 * 4. 如果 token 无效，清除过期状态
 *
 * 使用方式：在 app/layout.tsx 中包裹 children
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth, isInitialized } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // 只在首次挂载时执行认证检查
    const initAuth = async () => {
      if (!isInitialized) {
        // ✨ 优化：只在有 token 时才调用 checkAuth，避免无意义的 403 请求
        const hasToken = typeof window !== "undefined" &&
          (localStorage.getItem("token") || sessionStorage.getItem("token"));

        if (hasToken) {
          await checkAuth(); // 验证 token 是否有效
        } else {
          // 没有 token，直接标记为已初始化（未登录状态）
          useAuthStore.setState({ isInitialized: true });
        }
      }
      setIsChecking(false);
    };

    initAuth();
  }, [checkAuth, isInitialized]);

  // 认证检查期间显示加载界面
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">正在初始化...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
