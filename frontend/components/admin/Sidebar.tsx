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
  Gamepad2,
  Trash2
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
  {
    title: "回收站",
    href: "/admin/recycle",
    icon: Trash2,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = async () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r-2 border-dashed border-sketch-text-secondary/30 bg-white/95 transition-transform">
      <div className="flex h-full flex-col justify-between px-4 py-6">
        <div>
          {/* Header */}
          <div className="mb-10 px-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sticky-blue border-2 border-dashed border-sketch-text-secondary/30 text-sketch-text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-xl font-caveat font-bold tracking-tight text-sketch-text-primary">
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
                    "group flex items-center rounded-xl px-4 py-3 text-sm font-patrick transition-all duration-200 ease-in-out border-2",
                    isActive
                      ? "bg-sticky-blue border-sketch-text-primary/20 text-sketch-text-primary shadow-sketch-sm"
                      : "text-sketch-text-secondary hover:bg-sticky-blue-light hover:text-sketch-text-primary border-transparent"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 transition-colors",
                      isActive ? "text-sketch-text-primary" : "text-sketch-text-muted group-hover:text-sketch-text-primary"
                    )}
                  />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="space-y-1 pt-4 border-t-2 border-dashed border-sketch-text-secondary/20">
           <Link
            href="/"
            className="group flex w-full items-center rounded-xl px-4 py-3 text-sm font-patrick text-sketch-text-secondary hover:bg-sticky-yellow-light hover:text-sketch-text-primary transition-all duration-200"
          >
            <Home className="mr-3 h-5 w-5 text-sketch-text-muted group-hover:text-sketch-text-primary" />
            返回前台
          </Link>
          <button
            onClick={handleLogout}
            className="group flex w-full items-center rounded-xl px-4 py-3 text-sm font-patrick text-sticky-pink hover:bg-sticky-pink-light hover:text-sketch-text-primary transition-all duration-200"
          >
            <LogOut className="mr-3 h-5 w-5 text-sticky-pink group-hover:text-sketch-text-primary" />
            退出登录
          </button>
        </div>
      </div>
    </aside>
  );
}
