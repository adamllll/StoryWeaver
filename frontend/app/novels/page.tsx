/**
 * 小说列表页 - Zen-iOS Hybrid 重构版
 * 
 * 核心特性：
 * - 沉浸式 Hero 头部
 * - 悬浮搜索栏
 * - 交错式卡片入场动画
 * - 高级毛玻璃卡片设计
 */

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Filter,
  User,
  Clock,
  FileText,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { novelsApi, Novel, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { SkeletonNovelList } from "@/components/ui/skeleton";
import { CategorySelect } from "@/components/ui/category-select";
import { Header } from "@/components/layout/Header";

const CATEGORIES = [
  { value: "", label: "全部分类" },
  { value: "玄幻", label: "玄幻" },
  { value: "言情", label: "言情" },
  { value: "科幻", label: "科幻" },
  { value: "悬疑", label: "悬疑" },
  { value: "历史", label: "历史" },
  { value: "都市", label: "都市" },
  { value: "其他", label: "其他" },
];

export default function NovelsPage() {
  const { toast } = useToast();
  const { checkAuth } = useAuthStore();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const fetchNovels = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await novelsApi.list({
        page,
        page_size: pageSize,
        category: selectedCategory || undefined,
        status: "published",
      });
      setNovels(response.novels || []);
      setTotal(response.total || 0);
    } catch (error) {
      if (error instanceof ApiError) {
        toast({ title: "加载失败", description: error.detail, variant: "destructive" });
      }
      setNovels([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, selectedCategory, toast]);

  useEffect(() => {
    checkAuth();
    fetchNovels();
  }, [checkAuth, fetchNovels]);

  const filteredNovels = useMemo(() => {
    if (!searchQuery.trim()) return novels || [];
    const query = searchQuery.toLowerCase();
    return (novels || []).filter((novel) =>
      novel.title.toLowerCase().includes(query) ||
      (novel.description?.toLowerCase() || '').includes(query)
    );
  }, [novels, searchQuery]);

  const totalPages = Math.ceil(total / pageSize);

  // 动画变体
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-ios-bg relative overflow-x-hidden">
      {/* 装饰性背景光晕 */}
      <div className="fixed -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-200/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed top-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-200/20 blur-[100px] rounded-full pointer-events-none" />

      {/* 导航栏 */}
      <Header />

      <main className="container pt-32 pb-20 relative z-10">
        {/* Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 max-w-2xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900">
            探索无限<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">奇妙世界</span>
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            由 AI 驱动的沉浸式阅读平台，每一个选择都通向未知的结局。
          </p>
        </motion.div>

        {/* 悬浮搜索栏 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-4xl mx-auto mb-16 relative z-30"
        >
          <div className="glass rounded-ios-2xl p-2 flex flex-col md:flex-row gap-2 shadow-ios-float hover:shadow-xl transition-shadow duration-300">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder="搜索感兴趣的故事..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-transparent border-none focus:ring-0 text-gray-800 placeholder:text-gray-400 text-base"
              />
            </div>
            <div className="w-full md:w-48 h-12 flex-shrink-0 border-l border-gray-200 pl-2">
              <CategorySelect
                value={selectedCategory}
                options={CATEGORIES}
                onChange={(value) => {
                  setSelectedCategory(value);
                  setPage(1);
                }}
                icon={<Filter className="w-4 h-4" />}
                placeholder="全部分类"
              />
            </div>
          </div>
        </motion.div>

        {/* 小说列表 */}
        {isLoading ? (
          <SkeletonNovelList count={8} />
        ) : filteredNovels.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white/40 backdrop-blur-xl rounded-ios-2xl border border-white/50"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">暂无相关小说</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {searchQuery ? "换个关键词试试？或者看看其他分类。" : "这里还是一片荒原，等待第一位开拓者。"}
            </p>
            <Link 
              href="/workspace/create" 
              className="inline-flex items-center px-6 py-3 rounded-ios-lg bg-gray-900 text-white font-medium hover:bg-black transition-colors shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              开始创作
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </motion.div>
        ) : (
          <>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredNovels.map((novel) => (
                <motion.div variants={itemVariants} key={novel.id}>
                  <Link href={`/novels/${novel.id}`} className="block h-full group">
                    <article className="h-full bg-white/70 backdrop-blur-xl rounded-ios-2xl overflow-hidden border border-white/60 shadow-sm hover:shadow-ios-float transition-all duration-300 hover:-translate-y-1 relative">
                      {/* 封面区域 */}
                      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                        {novel.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={novel.cover_url}
                            alt={novel.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-300">
                             <BookOpen className="w-12 h-12 mb-2 opacity-50" />
                             <span className="text-xs font-medium uppercase tracking-widest opacity-50">No Cover</span>
                          </div>
                        )}
                        
                        {/* 浮动标签 */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                           <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md text-gray-800 text-[10px] font-bold rounded-full shadow-sm">
                             {novel.category}
                           </span>
                        </div>
                        
                        {novel.is_interactive && (
                           <div className="absolute top-3 right-3">
                             <span className="px-2.5 py-1 bg-amber-400/90 backdrop-blur-md text-white text-[10px] font-bold rounded-full shadow-sm flex items-center gap-1">
                               <Sparkles className="w-3 h-3 fill-white" />
                               互动
                             </span>
                           </div>
                        )}

                        {/* 悬停遮罩 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                           <span className="text-white text-sm font-medium flex items-center">
                             阅读详情 <ArrowRight className="w-4 h-4 ml-1" />
                           </span>
                        </div>
                      </div>

                      {/* 内容区域 */}
                      <div className="p-5">
                        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1 group-hover:text-purple-700 transition-colors">
                          {novel.title}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10 leading-relaxed">
                          {novel.description || "暂无简介"}
                        </p>

                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                           <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                <User className="w-3 h-3" />
                              </div>
                              <span className="font-medium text-gray-600 max-w-[80px] truncate">{novel.author.username}</span>
                           </div>
                           <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1" title="章节数">
                                <FileText className="w-3 h-3" />
                                {novel.chapter_count}
                              </span>
                              <span className="flex items-center gap-1" title="总字数">
                                <Clock className="w-3 h-3" />
                                {(novel.word_count / 1000).toFixed(1)}k
                              </span>
                           </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-16">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  上一页
                </button>
                <span className="text-sm font-bold text-gray-700">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-white/50 backdrop-blur-xl border-t border-white/60 py-12 relative z-10">
        <div className="container text-center">
          <p className="text-gray-500 text-sm">© 2025 织梦者 (StoryWeaver). Created by Claude, Gemini & Codex.</p>
        </div>
      </footer>
    </div>
  );
}
