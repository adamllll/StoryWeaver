"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  Shield,
  LogOut,
  Home,
  Gamepad2
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";

const sidebarItems = [
  {
    title: "概览",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "用户管理",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "小说管理",
    href: "/admin/novels",
    icon: BookOpen,
  },
  {
    title: "冒险管理",
    href: "/admin/adventures",
    icon: Gamepad2,
  },
  {
    title: "系统设置",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = async () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200/50 bg-white/80 backdrop-blur-xl transition-transform">
      <div className="flex h-full flex-col justify-between px-4 py-6">
        <div>
          {/* Header */}
          <div className="mb-10 px-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Admin
            </span>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ease-in-out",
                    isActive
                      ? "bg-gray-100/80 text-gray-900 shadow-sm ring-1 ring-gray-200/50"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 transition-colors",
                      isActive ? "text-gray-900" : "text-gray-400 group-hover:text-gray-900"
                    )}
                  />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="space-y-1 pt-4 border-t border-gray-100">
           <Link
            href="/"
            className="group flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
          >
            <Home className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-900" />
            返回前台
          </Link>
          <button
            onClick={handleLogout}
            className="group flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <LogOut className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-600" />
            退出登录
          </button>
        </div>
      </div>
    </aside>
  );
}
