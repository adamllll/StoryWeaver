/**
 * 小说列表页 - Sketch 手绘风格
 */

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
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
import { SkeletonSketchGrid } from "@/components/ui/skeleton-sketch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORIES = [
  { value: "", label: "全部" },
  { value: "玄幻", label: "玄幻" },
  { value: "言情", label: "言情" },
  { value: "科幻", label: "科幻" },
  { value: "悬疑", label: "悬疑" },
  { value: "历史", label: "历史" },
  { value: "都市", label: "都市" },
  { value: "其他", label: "其他" },
];

function getCardRotation(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 5) - 2;
}

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
    <div className="min-h-screen grid-paper-bg">
      <Header />

      <main className="container pt-32 pb-20">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 max-w-2xl mx-auto"
        >
          <h1 className="font-caveat text-5xl md:text-6xl font-bold mb-4 text-sketch-text-primary">
            探索无限奇妙世界
          </h1>
          <p className="font-patrick text-lg text-sketch-text-secondary leading-relaxed">
            由 AI 驱动的沉浸式阅读平台，每一个选择都通向未知的结局。
          </p>
        </motion.div>

        {/* Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <div className="bg-white border-2 border-sketch-text-primary rounded-xl p-4 shadow-sketch">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sketch-text-muted" />
                <Input
                  type="search"
                  variant="sketch"
                  placeholder="搜索感兴趣的故事..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12"
                />
              </div>

              {/* Category Tabs */}
              <Tabs
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value);
                  setPage(1);
                }}
                className="flex-shrink-0"
              >
                <TabsList variant="sketch" className="flex-wrap">
                  {CATEGORIES.map((cat) => (
                    <TabsTrigger key={cat.value} value={cat.value} variant="sketch">
                      {cat.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
        </motion.div>

        {/* Novel List */}
        {isLoading ? (
          <SkeletonSketchGrid count={8} className="xl:grid-cols-4" />
        ) : filteredNovels.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white border-2 border-sketch-text-primary rounded-xl shadow-sketch max-w-md mx-auto"
          >
            <div className="w-20 h-20 bg-sticky-yellow-light border-2 border-dashed border-sketch-text-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-8 h-8 text-sketch-text-secondary" />
            </div>
            <h3 className="font-caveat text-2xl font-bold text-sketch-text-primary mb-2">暂无相关小说</h3>
            <p className="font-patrick text-sketch-text-secondary mb-8 max-w-sm mx-auto px-4">
              {searchQuery ? "换个关键词试试？或者看看其他分类。" : "这里还是一片荒原，等待第一位开拓者。"}
            </p>
            <Link href="/workspace/create">
              <Button variant="sketch" size="lg">
                开始创作
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
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
              {filteredNovels.map((novel) => {
                const rotation = getCardRotation(String(novel.id));
                return (
                  <motion.div variants={itemVariants} key={novel.id}>
                    <Link href={`/novels/${novel.id}`} className="block h-full group">
                      <article
                        className="h-full bg-sticky-yellow-light border-2 border-sketch-text-primary rounded-xl overflow-hidden shadow-sketch hover:shadow-sketch-lg transition-all duration-sketch ease-sketch hover:-translate-y-1 motion-reduce:rotate-0"
                        style={{ transform: `rotate(${rotation}deg)` }}
                      >
                        {/* Cover */}
                        <div className="relative aspect-[3/4] overflow-hidden bg-sticky-yellow/30">
                          {novel.cover_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={novel.cover_url}
                              alt={novel.title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-sketch-text-muted">
                               <BookOpen className="w-12 h-12 mb-2 opacity-50" />
                               <span className="font-patrick text-xs uppercase tracking-widest opacity-50">No Cover</span>
                            </div>
                          )}

                          {/* Tags */}
                          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                             <span className="px-2.5 py-1 bg-white/90 border border-sketch-text-secondary text-sketch-text-primary font-patrick text-xs font-bold rounded-full shadow-sketch-sm">
                               {novel.category}
                             </span>
                          </div>

                          {novel.is_interactive && (
                             <div className="absolute top-3 right-3">
                               <span className="px-2.5 py-1 bg-sticky-pink border border-sketch-text-primary text-sketch-text-primary font-patrick text-xs font-bold rounded-full shadow-sketch-sm flex items-center gap-1">
                                 <Sparkles className="w-3 h-3" />
                                 互动
                               </span>
                             </div>
                          )}

                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-sketch-text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                             <span className="font-patrick text-white text-sm font-medium flex items-center bg-sticky-yellow px-4 py-2 rounded-full border-2 border-sketch-text-primary shadow-sketch">
                               阅读详情 <ArrowRight className="w-4 h-4 ml-1" />
                             </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 bg-white/50">
                          <h3 className="font-caveat text-xl font-bold text-sketch-text-primary mb-2 line-clamp-1 group-hover:text-sticky-pink transition-colors">
                            {novel.title}
                          </h3>
                          <p className="font-patrick text-sm text-sketch-text-secondary line-clamp-2 mb-4 h-10 leading-relaxed">
                            {novel.description || "暂无简介"}
                          </p>

                          <div className="pt-4 border-t-2 border-dashed border-sketch-text-muted/30 flex items-center justify-between font-patrick text-xs text-sketch-text-muted">
                             <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-sticky-yellow-light border border-sketch-text-secondary flex items-center justify-center">
                                  <User className="w-3 h-3" />
                                </div>
                                <span className="font-medium text-sketch-text-secondary max-w-[80px] truncate">{novel.author.username}</span>
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
                );
              })}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-16">
                <Button
                  variant="sketch-secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  上一页
                </Button>
                <span className="font-caveat text-xl font-bold text-sketch-text-primary">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="sketch-secondary"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  下一页
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-white/70 border-t-2 border-dashed border-sketch-text-muted/30 py-12">
        <div className="container text-center">
          <p className="font-patrick text-sketch-text-muted text-sm">© 2025 织梦者 (StoryWeaver). Created by Claude, Gemini & Codex.</p>
        </div>
      </footer>
    </div>
  );
}
