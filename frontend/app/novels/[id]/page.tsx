/**
 * 小说详情页 - Zen-iOS Hybrid 重构版
 * 
 * 核心特性：
 * - 沉浸式高斯模糊背景
 * - 悬浮式信息卡片
 * - 播放列表风格的章节目录
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
      <div className="min-h-screen flex items-center justify-center bg-ios-bg">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
          <span className="text-gray-500 font-medium">正在载入故事...</span>
        </div>
      </div>
    );
  }

  if (!novel) return null;

  const firstChapter = novel.chapters?.[0] || null;

  return (
    <div className="min-h-screen bg-ios-bg relative overflow-x-hidden">
      {/* 沉浸式模糊背景 */}
      <div className="absolute inset-0 h-[60vh] overflow-hidden z-0">
        {novel.cover_url && (
          <div
            className="w-full h-full bg-cover bg-center opacity-30 blur-[100px] scale-110"
            style={{ backgroundImage: `url(${novel.cover_url})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ios-bg" />
      </div>

      {/* 导航栏 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container flex h-16 items-center justify-between">
          <Link 
            href="/novels" 
            className="flex items-center gap-2 text-gray-800 hover:text-purple-700 transition-colors px-3 py-1.5 rounded-full hover:bg-white/40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">返回列表</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-white/40 text-gray-700 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
            {isAuthenticated && user ? (
              <Link href={`/workspace/${novelId}`} className="btn-primary text-xs px-4 py-2 h-9 ml-2">
                工作台
              </Link>
            ) : (
              <Link href="/login" className="btn-primary text-xs px-4 py-2 h-9 ml-2">
                登录
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container pt-28 pb-20 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-10"
        >
          {/* 左侧：封面卡片 */}
          <div className="flex flex-col gap-6">
            <div className="glass rounded-ios-2xl p-6 shadow-ios-float bg-white/60 backdrop-blur-xl border-white/60">
              {/* 封面图 */}
              <div className="relative aspect-[3/4] rounded-ios-xl overflow-hidden shadow-lg mb-6 group">
                {novel.cover_url ? (
                  <img
                    src={novel.cover_url}
                    alt={novel.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                    <BookOpen className="w-20 h-20 text-purple-200" />
                  </div>
                )}
                
                {/* 互动标记 */}
                {novel.is_interactive && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1.5 bg-amber-400/90 backdrop-blur-md text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5 animate-pulse-subtle">
                      <Sparkles className="w-3.5 h-3.5 fill-white" />
                      互动小说
                    </span>
                  </div>
                )}
              </div>

              {/* 核心数据 */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/50 rounded-xl p-3 text-center border border-white/60">
                  <div className="flex items-center justify-center gap-1.5 text-gray-400 text-xs mb-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>章节</span>
                  </div>
                  <span className="text-lg font-bold text-gray-800">{novel.chapter_count}</span>
                </div>
                <div className="bg-white/50 rounded-xl p-3 text-center border border-white/60">
                  <div className="flex items-center justify-center gap-1.5 text-gray-400 text-xs mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>字数</span>
                  </div>
                  <span className="text-lg font-bold text-gray-800">{(novel.word_count / 1000).toFixed(1)}k</span>
                </div>
              </div>

              {/* 行动按钮 */}
              <div className="space-y-3">
                {firstChapter ? (
                  <Link
                    href={`/read/${novel.id}/${firstChapter.id}`}
                    className="w-full py-3.5 rounded-ios-xl bg-gray-900 text-white font-bold text-center flex items-center justify-center gap-2 shadow-lg shadow-gray-300/50 hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    开始阅读
                  </Link>
                ) : (
                  <button disabled className="w-full py-3.5 rounded-ios-xl bg-gray-200 text-gray-400 font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                    暂无章节
                  </button>
                )}
                <button className="w-full py-3.5 rounded-ios-xl bg-white border border-gray-200 text-gray-700 font-bold flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-[0.98] transition-all">
                  <BookmarkPlus className="w-4 h-4" />
                  加入书架
                </button>
              </div>
            </div>

            {/* 作者信息小卡片 */}
            <div className="glass rounded-ios-xl p-4 flex items-center gap-4 border-white/60">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-100 to-indigo-100 flex items-center justify-center shadow-inner">
                <User className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">作者</div>
                <div className="font-bold text-gray-900">{novel.author.username}</div>
              </div>
              <button className="ml-auto text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors">
                关注
              </button>
            </div>
          </div>

          {/* 右侧：详细内容 */}
          <div className="space-y-8">
            {/* 标题区 */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                  {novel.category}
                </span>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                  novel.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {novel.status === "published" ? "连载中" : "草稿"}
                </span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">{novel.title}</h1>
              
              {/* 简介卡片 */}
              <div className="glass rounded-ios-2xl p-8 border-white/60 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4 text-gray-900 font-bold">
                  <Info className="w-4 h-4 text-purple-500" />
                  故事简介
                </div>
                <div 
                  className="prose prose-base text-gray-600 leading-relaxed font-serif max-w-none"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(novel.description || "暂无简介") }}
                />
                {/* 装饰 */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl pointer-events-none" />
              </div>
            </div>

            {/* 角色卡片组 (如果存在) */}
            {novel.characters && novel.characters.length > 0 && (
              <div>
                 <h2 className="text-lg font-bold text-gray-900 mb-4 px-2">登场角色</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {novel.characters.slice(0, 6).map((char) => (
                      <div key={char.id} className="glass rounded-ios-xl p-3 flex items-center gap-3 border-white/60 hover:border-purple-200 transition-colors">
                         <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                           {char.avatar ? (
                             <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center bg-gray-200">
                               <User className="w-4 h-4 text-gray-400" />
                             </div>
                           )}
                         </div>
                         <div className="min-w-0">
                            <div className="font-bold text-gray-800 text-sm truncate">{char.name}</div>
                            <div className="text-xs text-gray-500 truncate">{char.role_type}</div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* 章节目录 */}
            <div>
              <div className="flex items-center justify-between mb-4 px-2">
                 <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                   <List className="w-4 h-4" />
                   目录
                   <span className="text-sm font-normal text-gray-400 ml-1">({novel.chapters?.length || 0}章)</span>
                 </h2>
                 <button className="text-xs font-semibold text-purple-600 hover:text-purple-700">倒序查看</button>
              </div>

              <div className="bg-white/60 backdrop-blur-xl rounded-ios-2xl border border-white/60 overflow-hidden">
                {(!novel.chapters || novel.chapters.length === 0) ? (
                  <div className="text-center py-12 text-gray-400">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">作者正在努力码字中...</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {novel.chapters.map((chapter, index) => (
                      <Link
                        key={chapter.id}
                        href={`/read/${novel.id}/${chapter.id}`}
                        className="group flex items-center justify-between p-4 hover:bg-white/80 transition-all duration-200"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="w-6 text-center text-sm font-medium text-gray-400 group-hover:text-purple-500 transition-colors">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-800 group-hover:text-purple-700 transition-colors truncate pr-4">
                              {chapter.title}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-gray-400">
                                {chapter.word_count} 字
                              </span>
                              {chapter.is_branch && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                                  分支
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-purple-50 group-hover:text-purple-600 transition-all">
                           <Play className="w-3.5 h-3.5 ml-0.5 fill-current opacity-0 group-hover:opacity-100 transition-opacity" />
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

      <footer className="bg-white/30 backdrop-blur-md border-t border-white/40 py-8 relative z-10">
        <div className="container text-center text-gray-500 text-sm">
          <p>© 2025 织梦者 (StoryWeaver). Created by Serena.</p>
        </div>
      </footer>
    </div>
  );
}