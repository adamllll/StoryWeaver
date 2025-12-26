"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
  Loader2,
  FileText,
  Clock,
  MoreHorizontal,
  Edit,
  Trash2,
  Globe,
  Lock,
  Sparkles,
} from "lucide-react";
import { novelsApi, Novel, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";

export default function WorkspacePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated, isInitialized, checkAuth } = useAuthStore();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    if (!openMenuId) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // 检查点击是否在菜单或触发按钮外部
      if (!target.closest('[data-menu-container]')) {
        setOpenMenuId(null);
      }
    };

    // 添加延迟以避免立即触发
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMenuId]);

  useEffect(() => {
    // 第一步：检查认证状态
    if (!isInitialized) {
      checkAuth();
      return;
    }

    // 第二步：如果未认证，跳转登录
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // 第三步：等待用户信息加载
    if (!user?.id) {
      return;
    }

    // 第四步：加载小说列表
    const fetchNovels = async () => {
      try {
        const data = await novelsApi.list({ user_id: user.id });
        setNovels(data.novels || []);
      } catch (error) {
        if (error instanceof ApiError) {
          toast({
            title: "加载失败",
            description: error.detail,
            variant: "destructive",
          });
        }
        setNovels([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNovels();
  }, [isInitialized, isAuthenticated, user?.id, router, toast]);

  const handleDelete = async (novelId: number) => {
    if (!confirm("确定要删除这部小说吗?此操作不可撤销。")) return;

    try {
      await novelsApi.delete(novelId);
      // 只在成功时更新状态和关闭菜单
      setNovels((novels || []).filter((n) => n.id !== novelId));
      setOpenMenuId(null);
      toast({
        title: "删除成功",
        description: "小说已被删除",
      });
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "删除失败",
          description: error.detail,
          variant: "destructive",
        });
      }
      // 删除失败时不关闭菜单，让用户可以重试
    }
  };

  const handlePublish = async (novelId: number, publish: boolean) => {
    try {
      await novelsApi.publish(novelId, publish);
      setNovels(
        novels.map((n) =>
          n.id === novelId ? { ...n, status: publish ? "published" : "draft" } : n
        )
      );
      toast({
        title: publish ? "发布成功" : "已取消发布",
        description: publish ? "小说已公开发布" : "小说已转为草稿",
      });
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "操作失败",
          description: error.detail,
          variant: "destructive",
        });
      }
    }
    setOpenMenuId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-3 text-gray-500">加载中...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* 毛玻璃导航栏 */}
      <header className="nav-glass">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-purple-500" />
            <span className="text-xl font-bold">织梦者</span>
          </Link>
          <nav className="flex items-center space-x-6">
            <Link
              href="/novels"
              className="text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors"
            >
              发现小说
            </Link>
            <Link
              href="/workspace"
              className="text-sm font-medium text-purple-600"
            >
              创作中心
            </Link>
            {user && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-purple-600">
                    {user.username[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium">{user.username}</span>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container pt-24 pb-12">
        {/* 页面标题和创建按钮 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">我的创作</h1>
            <p className="text-gray-500">管理你的小说作品，开始新的创作之旅</p>
          </div>
          <Link
            href="/workspace/create"
            className="btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            创建新小说
          </Link>
        </div>

        {/* 小说列表 */}
        {(!novels || novels.length === 0) ? (
          <div className="glass rounded-ios-2xl p-16 text-center">
            <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-600 mb-3">
              还没有作品
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              开始你的创作之旅吧！使用 AI 辅助功能，轻松创建你的第一部小说。
            </p>
            <Link href="/workspace/create" className="btn-primary inline-flex">
              <Plus className="w-5 h-5 mr-2" />
              创建第一部小说
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {novels.map((novel) => (
              <div
                key={novel.id}
                className="glass rounded-ios-xl overflow-hidden hover:shadow-ios-float transition-all duration-300 group"
              >
                {/* 封面区域 */}
                <div className="relative aspect-[16/9] bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                  {novel.cover_url ? (
                    <img
                      src={novel.cover_url}
                      alt={novel.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-16 h-16 text-purple-300" />
                  )}
                  {/* 状态标签 */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full backdrop-blur-md ${
                        novel.status === "published"
                          ? "bg-green-500/90 text-white"
                          : "bg-gray-500/90 text-white"
                      }`}
                    >
                      {novel.status === "published" ? (
                        <>
                          <Globe className="w-3 h-3 inline mr-1" />
                          已发布
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 inline mr-1" />
                          草稿
                        </>
                      )}
                    </span>
                    {novel.is_interactive && (
                      <span className="px-3 py-1 bg-amber-500/90 text-white text-xs font-medium rounded-full backdrop-blur-md">
                        <Sparkles className="w-3 h-3 inline mr-1" />
                        互动
                      </span>
                    )}
                  </div>
                  {/* 操作菜单按钮 */}
                  <div className="absolute top-3 right-3" data-menu-container>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === novel.id ? null : novel.id);
                      }}
                      className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center hover:bg-white transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-gray-600" />
                    </button>
                    {/* 下拉菜单 */}
                    {openMenuId === novel.id && (
                      <div className="absolute right-0 top-10 w-40 glass rounded-ios-lg shadow-ios-float overflow-hidden z-50">
                        <Link
                          href={`/workspace/${novel.id}`}
                          className="flex items-center px-4 py-3 hover:bg-purple-50 transition-colors"
                        >
                          <Edit className="w-4 h-4 mr-3 text-gray-500" />
                          <span className="text-sm">编辑</span>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePublish(novel.id, novel.status !== "published");
                          }}
                          className="flex items-center px-4 py-3 hover:bg-purple-50 transition-colors w-full text-left"
                        >
                          {novel.status === "published" ? (
                            <>
                              <Lock className="w-4 h-4 mr-3 text-gray-500" />
                              <span className="text-sm">取消发布</span>
                            </>
                          ) : (
                            <>
                              <Globe className="w-4 h-4 mr-3 text-gray-500" />
                              <span className="text-sm">发布</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(novel.id);
                          }}
                          className="flex items-center px-4 py-3 hover:bg-red-50 transition-colors w-full text-left text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-3" />
                          <span className="text-sm">删除</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 信息区域 */}
                <Link href={`/workspace/${novel.id}`} className="block p-5">
                  <h3 className="text-lg font-bold mb-2 group-hover:text-purple-600 transition-colors line-clamp-1">
                    {novel.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                    {novel.description || "暂无简介"}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center">
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        {novel.chapter_count} 章
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {(novel.word_count / 1000).toFixed(1)}k 字
                      </span>
                    </div>
                    <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded-md">
                      {novel.category}
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 页脚 */}
      <footer className="glass border-t border-white/40 py-8">
        <div className="container text-center text-gray-500">
          <p>© 2025 织梦者 (StoryWeaver). AI 辅助应用开发课程设计项目.</p>
        </div>
      </footer>
    </div>
  );
}
