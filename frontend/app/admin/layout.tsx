"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isInitialized } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // 等待初始化完成
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.push("/login?redirect=/admin");
      return;
    }

    // 简单的权限检查 (虽然主要靠后端API保障，但前端也得挡一下)
    if (user && !user.is_admin) {
      router.push("/"); // 非管理员踢回首页
      return;
    }

    setIsAuthorized(true);
  }, [user, isAuthenticated, isInitialized, router]);

  if (isLoading || !isInitialized || !isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F2F2F7]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-sm font-medium text-gray-500">验证权限中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      <AdminSidebar />
      <main className="pl-64 min-h-screen transition-all duration-200 ease-in-out">
        <div className="container mx-auto p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
