"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
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
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkeletonSketchGrid } from "@/components/ui/skeleton-sketch";

export default function WorkspacePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated, isInitialized, checkAuth } = useAuthStore();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  const filteredNovels = novels.filter((novel) => {
    if (filter === "all") return true;
    return novel.status === filter;
  });

  useEffect(() => {
    if (!openMenuId) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-menu-container]")) {
        setOpenMenuId(null);
      }
    };

    setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);

    return () => {
      document.removeEventListener("click", handleClickOutside);
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
      <div className="min-h-screen grid-paper-bg">
        <Header />
        <main className="container pt-12 pb-20 px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-caveat font-bold text-sketch-text-primary mb-3">
                我的创作
              </h1>
              <p className="text-lg font-patrick text-sketch-text-secondary max-w-2xl">
                在这里管理你的所有作品。每一个伟大的故事，都始于一个简单的灵感。
              </p>
            </div>
          </div>
          <SkeletonSketchGrid count={6} className="lg:grid-cols-3 xl:grid-cols-4" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-paper-bg">
      <Header />

      <main className="container pt-12 pb-20 px-6 lg:px-8">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-caveat font-bold text-sketch-text-primary mb-3">
              我的创作
            </h1>
            <p className="text-lg font-patrick text-sketch-text-secondary max-w-2xl">
              在这里管理你的所有作品。每一个伟大的故事，都始于一个简单的灵感。
            </p>
          </div>
          <Link href="/workspace/create">
            <Button variant="sketch" size="lg" className="group">
              <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-sketch" />
              创建新作品
            </Button>
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center justify-between mb-8">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList variant="sketch">
              <TabsTrigger value="all" variant="sketch">
                全部作品
              </TabsTrigger>
              <TabsTrigger value="published" variant="sketch">
                已发布
              </TabsTrigger>
              <TabsTrigger value="draft" variant="sketch">
                草稿箱
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="text-sm font-patrick text-sketch-text-muted">
            共 {filteredNovels.length} 部作品
          </div>
        </div>

        {/* Novel list */}
        {!filteredNovels || filteredNovels.length === 0 ? (
          <Card variant="sketch" className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="w-24 h-24 bg-sticky-blue border-2 border-dashed border-sketch-text-secondary/30 rounded-full flex items-center justify-center mb-6 shadow-sketch">
              <LayoutGrid className="w-10 h-10 text-sketch-text-secondary" />
            </div>
            <h2 className="text-2xl font-caveat font-bold text-sketch-text-primary mb-3">
              还没有作品
            </h2>
            <p className="font-patrick text-sketch-text-secondary mb-8 max-w-md mx-auto leading-relaxed">
              你的灵感正在等待被唤醒。使用我们的 AI 辅助工具，开始创作你的第一部互动小说吧。
            </p>
            <Link href="/workspace/create">
              <Button variant="sketch">开始创作之旅</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredNovels.map((novel) => (
              <Card
                key={novel.id}
                variant="sticky-blue"
                rotationId={String(novel.id)}
                className="group relative flex flex-col overflow-hidden"
              >
                {/* Cover area */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 rounded-lg mb-4 border-2 border-dashed border-sketch-text-secondary/20">
                  {novel.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={novel.cover_url}
                      alt={novel.title}
                      className="w-full h-full object-cover transition-transform duration-sketch group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-sticky-blue-light/50 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-sketch-text-secondary/50" />
                    </div>
                  )}

                  {/* Status badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span
                      className={`px-2.5 py-1 text-xs font-caveat font-bold rounded-full border-2 flex items-center gap-1 ${
                        novel.status === "published"
                          ? "bg-sticky-green border-green-700/50 text-green-800"
                          : "bg-white border-sketch-text-secondary/30 text-sketch-text-secondary"
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
                      <span className="px-2.5 py-1 bg-sticky-yellow border-2 border-amber-600/50 text-amber-800 text-xs font-caveat font-bold rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        互动
                      </span>
                    )}
                  </div>

                  {/* Menu button */}
                  <div className="absolute top-3 right-3 z-20" data-menu-container>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === novel.id ? null : novel.id);
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-sketch ${
                        openMenuId === novel.id
                          ? "bg-white border-2 border-sketch-text-primary text-sketch-text-primary shadow-sketch"
                          : "bg-white/80 border-2 border-sketch-text-secondary/30 text-sketch-text-secondary hover:bg-white hover:border-sketch-text-primary hover:text-sketch-text-primary"
                      }`}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* Dropdown menu */}
                    {openMenuId === novel.id && (
                      <div className="absolute right-0 top-10 w-44 bg-white border-2 border-sketch-text-primary/20 rounded-xl shadow-sketch p-1.5 animate-in fade-in zoom-in-95 origin-top-right z-50">
                        <Link
                          href={`/workspace/${novel.id}`}
                          className="flex items-center px-3 py-2 rounded-lg hover:bg-sticky-blue/30 text-sketch-text-primary font-patrick transition-colors"
                        >
                          <Edit className="w-4 h-4 mr-3 text-sticky-blue" />
                          <span className="text-sm">编辑内容</span>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePublish(novel.id, novel.status !== "published");
                          }}
                          className="flex items-center px-3 py-2 rounded-lg hover:bg-sticky-blue/30 text-sketch-text-primary font-patrick transition-colors w-full text-left"
                        >
                          {novel.status === "published" ? (
                            <>
                              <Lock className="w-4 h-4 mr-3 text-sketch-text-secondary" />
                              <span className="text-sm">转为草稿</span>
                            </>
                          ) : (
                            <>
                              <Globe className="w-4 h-4 mr-3 text-sticky-green" />
                              <span className="text-sm">发布作品</span>
                            </>
                          )}
                        </button>
                        <div className="h-px bg-sketch-text-secondary/20 my-1" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(novel.id);
                          }}
                          className="flex items-center px-3 py-2 rounded-lg hover:bg-sticky-pink/30 text-red-600 font-patrick transition-colors w-full text-left"
                        >
                          <Trash2 className="w-4 h-4 mr-3" />
                          <span className="text-sm">删除</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info area */}
                <Link href={`/workspace/${novel.id}`} className="flex-1 flex flex-col">
                  <h3 className="text-xl font-caveat font-bold mb-2 text-sketch-text-primary group-hover:text-blue-700 transition-colors line-clamp-1 leading-tight">
                    {novel.title}
                  </h3>
                  <p className="text-sm font-patrick text-sketch-text-secondary line-clamp-2 mb-4 leading-relaxed flex-1">
                    {novel.description || "暂无简介"}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t-2 border-dashed border-sketch-text-secondary/20">
                    <div className="flex items-center gap-4 text-xs font-patrick text-sketch-text-muted">
                      <span className="flex items-center">
                        <FileText className="w-3.5 h-3.5 mr-1.5" />
                        {novel.chapter_count} 章
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        {(novel.word_count / 1000).toFixed(1)}k 字
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-sticky-yellow-light border border-sketch-text-secondary/20 text-sketch-text-secondary text-xs font-patrick rounded-lg">
                      {novel.category}
                    </span>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-dashed border-sketch-text-secondary/30 py-10 grid-paper-bg">
        <div className="container text-center font-patrick text-sketch-text-muted text-sm">
          <p>© 2025 织梦者 (StoryWeaver). Designed with <span className="text-sticky-pink">♥</span> for Creators.</p>
        </div>
      </footer>
    </div>
  );
}
