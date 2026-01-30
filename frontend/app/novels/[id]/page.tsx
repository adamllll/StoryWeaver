/**
 * 小说详情页 - Sketch 手绘风格
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  BookOpen,
  ArrowLeft,
  User,
  Clock,
  FileText,
  Loader2,
  BookmarkPlus,
  Play,
  Sparkles,
  Share2,
  Info,
  List
} from "lucide-react";
import { motion } from "framer-motion";
import { novelsApi, NovelDetail, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { markdownToHtml } from "@/lib/markdown";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";

export default function NovelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuthStore();
  const [novel, setNovel] = useState<NovelDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const novelId = Number(params.id);

  useEffect(() => {
    const fetchNovel = async () => {
      try {
        const data = await novelsApi.get(novelId);
        setNovel(data);
      } catch (error) {
        if (error instanceof ApiError) {
          toast({ title: "加载失败", description: error.detail, variant: "destructive" });
          if (error.status === 404) router.push("/novels");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (novelId) fetchNovel();
  }, [novelId, toast, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-paper-bg">
        <div className="bg-white border-2 border-sketch-text-primary rounded-xl p-8 shadow-sketch flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-dashed border-sketch-text-secondary rounded-full flex items-center justify-center animate-spin">
            <BookOpen className="w-5 h-5 text-sketch-text-secondary" />
          </div>
          <span className="font-patrick text-sketch-text-secondary">正在载入故事...</span>
        </div>
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-paper-bg">
        <div className="bg-white border-2 border-sketch-text-primary rounded-xl p-8 shadow-sketch text-center max-w-md">
          <div className="w-20 h-20 bg-sticky-yellow-light border-2 border-dashed border-sketch-text-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-sketch-text-secondary" />
          </div>
          <h2 className="font-caveat text-2xl font-bold text-sketch-text-primary mb-2">小说不存在</h2>
          <p className="font-patrick text-sketch-text-secondary mb-6">这本小说可能已被删除或不存在</p>
          <Link href="/novels">
            <Button variant="sketch">返回小说列表</Button>
          </Link>
        </div>
      </div>
    );
  }

  const firstChapter = novel.chapters?.[0] || null;

  return (
    <div className="min-h-screen grid-paper-bg">
      <Header />

      <main className="container pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-10"
        >
          {/* Left: Cover Card */}
          <div className="flex flex-col gap-6">
            <div className="bg-sticky-yellow-light border-2 border-sketch-text-primary rounded-xl p-6 shadow-sketch">
              {/* Cover Image */}
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-sketch-text-secondary shadow-sketch mb-6 group">
                {novel.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={novel.cover_url}
                    alt={novel.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-sticky-yellow/50 flex items-center justify-center">
                    <BookOpen className="w-20 h-20 text-sketch-text-muted" />
                  </div>
                )}

                {/* Interactive Tag */}
                {novel.is_interactive && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1.5 bg-sticky-pink border-2 border-sketch-text-primary text-sketch-text-primary font-patrick text-xs font-bold rounded-full shadow-sketch flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      互动小说
                    </span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/70 border-2 border-dashed border-sketch-text-secondary/50 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-sketch-text-muted font-patrick text-xs mb-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>章节</span>
                  </div>
                  <span className="font-caveat text-xl font-bold text-sketch-text-primary">{novel.chapter_count}</span>
                </div>
                <div className="bg-white/70 border-2 border-dashed border-sketch-text-secondary/50 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-sketch-text-muted font-patrick text-xs mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>字数</span>
                  </div>
                  <span className="font-caveat text-xl font-bold text-sketch-text-primary">{(novel.word_count / 1000).toFixed(1)}k</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {firstChapter ? (
                  <Link href={`/read/${novel.id}/${firstChapter.id}`}>
                    <Button variant="sketch" size="lg" className="w-full">
                      <Play className="w-4 h-4 mr-2" />
                      开始阅读
                    </Button>
                  </Link>
                ) : (
                  <Button variant="sketch" size="lg" disabled className="w-full">
                    暂无章节
                  </Button>
                )}
                <Button variant="sketch-secondary" size="lg" className="w-full">
                  <BookmarkPlus className="w-4 h-4 mr-2" />
                  加入书架
                </Button>
              </div>
            </div>

            {/* Author Card */}
            <div className="bg-white border-2 border-sketch-text-primary rounded-xl p-4 shadow-sketch flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-sticky-yellow-light border-2 border-sketch-text-secondary flex items-center justify-center">
                <User className="w-5 h-5 text-sketch-text-secondary" />
              </div>
              <div>
                <div className="font-patrick text-xs text-sketch-text-muted mb-0.5">作者</div>
                <div className="font-caveat font-bold text-lg text-sketch-text-primary">{novel.author.username}</div>
              </div>
              <Button variant="sketch-ghost" size="sm" className="ml-auto">
                关注
              </Button>
            </div>
          </div>

          {/* Right: Content */}
          <div className="space-y-8">
            {/* Title Section */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-sticky-yellow border border-sketch-text-secondary font-patrick text-sketch-text-primary text-xs font-bold rounded-full">
                  {novel.category}
                </span>
                <span className={`px-3 py-1 font-patrick text-xs font-bold rounded-full border ${
                  novel.status === "published"
                    ? "bg-sticky-green-light border-sticky-green text-sketch-text-primary"
                    : "bg-gray-100 border-gray-300 text-sketch-text-muted"
                }`}>
                  {novel.status === "published" ? "连载中" : "草稿"}
                </span>
              </div>
              <h1 className="font-caveat text-5xl font-bold text-sketch-text-primary mb-6 leading-tight">{novel.title}</h1>

              {/* Description Card */}
              <div className="bg-white border-2 border-sketch-text-primary rounded-xl p-8 shadow-sketch">
                <div className="flex items-center gap-2 mb-4 font-caveat text-xl font-bold text-sketch-text-primary">
                  <Info className="w-5 h-5 text-sticky-yellow" />
                  故事简介
                </div>
                <div
                  className="font-patrick text-sketch-text-secondary leading-relaxed prose prose-base max-w-none"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(novel.description || "暂无简介") }}
                />
              </div>
            </div>

            {/* Characters (if exist) */}
            {novel.characters && novel.characters.length > 0 && (
              <div>
                <h2 className="font-caveat text-2xl font-bold text-sketch-text-primary mb-4 px-2">登场角色</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {novel.characters.slice(0, 6).map((char) => (
                    <div key={char.id} className="bg-white border-2 border-dashed border-sketch-text-secondary/50 rounded-xl p-3 flex items-center gap-3 hover:border-solid hover:border-sketch-text-primary transition-all duration-sketch">
                      <div className="w-10 h-10 rounded-full bg-sticky-yellow-light border border-sketch-text-secondary overflow-hidden flex-shrink-0">
                        {char.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-4 h-4 text-sketch-text-muted" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-caveat font-bold text-sketch-text-primary truncate">{char.name}</div>
                        <div className="font-patrick text-xs text-sketch-text-muted truncate">{char.role_type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chapter List */}
            <div>
              <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="font-caveat text-2xl font-bold text-sketch-text-primary flex items-center gap-2">
                  <List className="w-5 h-5" />
                  目录
                  <span className="font-patrick text-sm font-normal text-sketch-text-muted ml-1">({novel.chapters?.length || 0}章)</span>
                </h2>
                <button className="font-patrick text-xs font-semibold text-sketch-text-primary hover:underline">倒序查看</button>
              </div>

              <div className="bg-white border-2 border-sketch-text-primary rounded-xl shadow-sketch overflow-hidden">
                {(!novel.chapters || novel.chapters.length === 0) ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-sticky-yellow-light border-2 border-dashed border-sketch-text-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-6 h-6 text-sketch-text-muted" />
                    </div>
                    <p className="font-patrick text-sketch-text-muted">作者正在努力码字中...</p>
                  </div>
                ) : (
                  <div className="divide-y-2 divide-dashed divide-sketch-text-muted/20">
                    {novel.chapters.map((chapter, index) => (
                      <Link
                        key={chapter.id}
                        href={`/read/${novel.id}/${chapter.id}`}
                        className="group flex items-center justify-between p-4 hover:bg-sticky-yellow-light/50 transition-all duration-sketch"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="w-8 h-8 flex items-center justify-center rounded-full bg-sticky-yellow-light border border-sketch-text-secondary font-caveat font-bold text-sketch-text-secondary group-hover:bg-sticky-yellow group-hover:text-sketch-text-primary transition-colors">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="font-patrick font-medium text-sketch-text-primary group-hover:text-sticky-pink transition-colors truncate pr-4">
                              {chapter.title}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-patrick text-xs text-sketch-text-muted">
                                {chapter.word_count} 字
                              </span>
                              {chapter.is_branch && (
                                <span className="px-1.5 py-0.5 rounded font-patrick text-[10px] font-bold bg-sticky-pink-light text-sketch-text-primary border border-sticky-pink">
                                  分支
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sketch-text-muted group-hover:bg-sticky-yellow group-hover:text-sketch-text-primary transition-all">
                          <Play className="w-3.5 h-3.5 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="bg-white/70 border-t-2 border-dashed border-sketch-text-muted/30 py-12">
        <div className="container text-center">
          <p className="font-patrick text-sketch-text-muted text-sm">© 2025 织梦者 (StoryWeaver). Created by Claude, Gemini & Codex.</p>
        </div>
      </footer>
    </div>
  );
}
