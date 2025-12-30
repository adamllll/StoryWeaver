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
  LayoutGrid,
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
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  const filteredNovels = novels.filter((novel) => {
    if (filter === "all") return true;
    return novel.status === filter;
  });

  // 点击外部关闭菜单
  useEffect(() => {
    if (!openMenuId) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-menu-container]')) {
        setOpenMenuId(null);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMenuId]);

  useEffect(() => {
    if (!isInitialized) {
      checkAuth();
      return;
    }

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!user?.id) {
      return;
    }

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
  }, [isInitialized, isAuthenticated, user?.id, router, toast, checkAuth]);

  const handleDelete = async (novelId: number) => {
    if (!confirm("确定要删除这部小说吗?此操作不可撤销。")) return;

    try {
      await novelsApi.delete(novelId);
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
      <div className="min-h-screen flex items-center justify-center bg-ios-bg">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-3 text-gray-500 font-medium">加载中...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-bg text-gray-900 selection:bg-purple-100 selection:text-purple-900">
      {/* 顶部导航栏 - Zen-iOS 风格 */}
      <header className="sticky top-0 z-50 w-full h-20">
        {/* 毛玻璃背景层 */}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[20px] border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.03)] supports-[backdrop-filter]:bg-white/50" />

        <div className="container h-full relative flex items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/20 group-hover:scale-105 group-hover:shadow-purple-500/30 transition-all duration-300">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
              织梦者
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/novels"
              className="px-5 py-2.5 rounded-full text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-white/60 transition-all duration-200"
            >
              发现小说
            </Link>
            <Link
              href="/workspace"
              className="px-5 py-2.5 rounded-full text-sm font-medium text-purple-700 bg-white/60 shadow-sm transition-all duration-200"
            >
              创作中心
            </Link>
            {user && (
              <div className="flex items-center gap-3 pl-6 border-l border-gray-200/50 ml-2">
                <div className="flex items-center gap-3 px-2 py-1.5 rounded-full bg-white/50 border border-white/60 shadow-sm backdrop-blur-sm transition-transform hover:scale-105">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                    {user.username[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 pr-2 hidden sm:inline-block">
                    {user.username}
                  </span>
                </div>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container pt-32 pb-20 px-6 lg:px-8">
        {/* 页面标题区 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
              我的创作
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl">
              在这里管理你的所有作品。每一个伟大的故事，都始于一个简单的灵感。
            </p>
          </div>
          <Link
            href="/workspace/create"
            className="group relative inline-flex items-center justify-center px-8 py-4 font-semibold text-white transition-all duration-200 bg-gray-900 rounded-full hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-gray-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
          >
            <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            <span>创建新作品</span>
            <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20"></div>
          </Link>
        </div>

        {/* 过滤器/状态栏 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-xl p-1.5 rounded-2xl border border-white/50 shadow-sm">
             <button 
               onClick={() => setFilter('all')}
               className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                 filter === 'all' 
                   ? "bg-white shadow-sm text-gray-900" 
                   : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
               }`}
             >
                全部作品
             </button>
             <button 
               onClick={() => setFilter('published')}
               className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                 filter === 'published' 
                   ? "bg-white shadow-sm text-gray-900" 
                   : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
               }`}
             >
                已发布
             </button>
             <button 
               onClick={() => setFilter('draft')}
               className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                 filter === 'draft' 
                   ? "bg-white shadow-sm text-gray-900" 
                   : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
               }`}
             >
                草稿箱
             </button>
          </div>
          <div className="text-sm text-gray-400 font-medium">
            共 {filteredNovels.length} 部作品
          </div>
        </div>

        {/* 小说列表 */}
        {(!filteredNovels || filteredNovels.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white/40 backdrop-blur-3xl rounded-[40px] border border-white/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)]">
            <div className="w-24 h-24 bg-gradient-to-tr from-purple-100 to-white rounded-full flex items-center justify-center mb-6 shadow-ios-float">
              <LayoutGrid className="w-10 h-10 text-purple-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
              还没有作品
            </h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
              你的灵感正在等待被唤醒。使用我们的 AI 辅助工具，开始创作你的第一部互动小说吧。
            </p>
            <Link 
              href="/workspace/create" 
              className="px-8 py-3.5 bg-white text-purple-600 font-semibold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border border-purple-100"
            >
              开始创作之旅
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredNovels.map((novel) => (
              <div
                key={novel.id}
                className="group relative flex flex-col bg-white/60 backdrop-blur-[40px] rounded-[32px] border border-white/60 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.05)] hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* 封面区域 */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  {novel.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={novel.cover_url}
                      alt={novel.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-purple-200" />
                    </div>
                  )}
                  
                  {/* 遮罩 - 悬停时显示 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* 状态标签 */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full backdrop-blur-md shadow-sm flex items-center gap-1 ${
                        novel.status === "published"
                          ? "bg-green-500/90 text-white"
                          : "bg-white/90 text-gray-600"
                      }`}
                    >
                      {novel.status === "published" ? (
                        <>
                          <Globe className="w-3 h-3" />
                          已发布
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" />
                          草稿
                        </>
                      )}
                    </span>
                    {novel.is_interactive && (
                      <span className="px-3 py-1.5 bg-amber-500/90 text-white text-xs font-semibold rounded-full backdrop-blur-md shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        互动
                      </span>
                    )}
                  </div>

                  {/* 菜单按钮 */}
                  <div className="absolute top-4 right-4 z-20" data-menu-container>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === novel.id ? null : novel.id);
                      }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                        openMenuId === novel.id 
                          ? "bg-white text-gray-900 shadow-lg" 
                          : "bg-black/20 text-white hover:bg-black/40 backdrop-blur-md"
                      }`}
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    
                    {/* 下拉菜单 */}
                    {openMenuId === novel.id && (
                      <div className="absolute right-0 top-12 w-48 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] border border-white/50 p-1.5 animate-scale-in origin-top-right z-50">
                        <Link
                          href={`/workspace/${novel.id}`}
                          className="flex items-center px-3 py-2.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
                        >
                          <Edit className="w-4 h-4 mr-3 text-purple-500" />
                          <span className="text-sm font-medium">编辑内容</span>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePublish(novel.id, novel.status !== "published");
                          }}
                          className="flex items-center px-3 py-2.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors w-full text-left"
                        >
                          {novel.status === "published" ? (
                            <>
                              <Lock className="w-4 h-4 mr-3 text-gray-500" />
                              <span className="text-sm font-medium">转为草稿</span>
                            </>
                          ) : (
                            <>
                              <Globe className="w-4 h-4 mr-3 text-green-500" />
                              <span className="text-sm font-medium">发布作品</span>
                            </>
                          )}
                        </button>
                        <div className="h-px bg-gray-100 my-1" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(novel.id);
                          }}
                          className="flex items-center px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-600 transition-colors w-full text-left"
                        >
                          <Trash2 className="w-4 h-4 mr-3" />
                          <span className="text-sm font-medium">删除</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 信息区域 */}
                <Link href={`/workspace/${novel.id}`} className="flex-1 p-6 flex flex-col">
                  <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-1 leading-tight">
                    {novel.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-6 leading-relaxed flex-1">
                    {novel.description || "暂无简介"}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                      <span className="flex items-center">
                        <FileText className="w-3.5 h-3.5 mr-1.5" />
                        {novel.chapter_count} 章
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        {(novel.word_count / 1000).toFixed(1)}k 字
                      </span>
                    </div>
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
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
      <footer className="border-t border-white/40 py-10 bg-white/30 backdrop-blur-xl">
        <div className="container text-center text-gray-500 text-sm">
          <p>© 2025 织梦者 (StoryWeaver). Designed with <span className="text-red-400">♥</span> for Creators.</p>
        </div>
      </footer>
    </div>
  );
}