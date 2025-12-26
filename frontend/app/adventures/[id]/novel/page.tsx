"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Download, BookOpen, Share2, FileText, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiClient } from "@/lib/api";
import { Adventure, StoryNode } from "@/lib/adventure-types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

export default function NovelReaderPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const adventureId = Number(params.id);

  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (adventureId) {
      Promise.all([
        apiClient.get<Adventure>(`/adventures/${adventureId}`),
        apiClient.get<StoryNode[]>(`/adventures/${adventureId}/nodes`)
      ])
      .then(([adv, n]) => {
        setAdventure(adv);
        setNodes(n);
      })
      .catch((err) => {
        toast({ title: "加载失败", description: "无法获取小说内容", variant: "destructive" });
      })
      .finally(() => setLoading(false));
    }
  }, [adventureId, toast]);

  const handleExport = () => {
    toast({ title: "即将推出", description: "导出 TXT/PDF 功能开发中..." });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9FB] flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-500">正在装订书籍...</p>
        </div>
      </div>
    );
  }

  if (!adventure) return null;

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Navigation Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200"
      >
        <div className="container max-w-4xl h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Button>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">{adventure.title}</h1>
              <p className="text-[10px] text-gray-500">第 {nodes.length} 章 · {adventure.protagonist_name}的传奇</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="hidden sm:flex">
              <Download className="w-4 h-4 mr-2" /> 导出
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container max-w-3xl py-12 px-4 md:px-8">
        
        {/* Cover Info */}
        <div className="text-center mb-16 space-y-6">
          <div className="w-32 h-40 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg shadow-2xl mx-auto flex items-center justify-center text-white/20">
            <BookOpen className="w-16 h-16" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">{adventure.title}</h1>
            <p className="text-gray-500 flex items-center justify-center gap-2">
              <User className="w-4 h-4" /> 
              <span>编剧: {adventure.player_id /* Using ID as name placeholder for now */ ? "玩家" : "AI"} & AI</span>
            </p>
          </div>
          <div className="flex justify-center gap-2">
            {adventure.keywords.map(k => (
              <span key={k} className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">
                {k}
              </span>
            ))}
          </div>
        </div>

        {/* Chapters */}
        <div className="space-y-16">
          {nodes.map((node, index) => (
            <motion.section 
              key={node.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              id={`chapter-${node.chapter_num}`}
              className="bg-white p-8 md:p-12 rounded-[2px] shadow-sm border border-gray-100"
            >
              <div className="mb-8 pb-4 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">第 {node.chapter_num} 章</span>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-2">
                  {node.title || "无题"}
                </h2>
              </div>
              
              <div className="prose prose-lg prose-slate max-w-none prose-p:indent-8 prose-p:text-justify font-serif leading-loose text-gray-800">
                <ReactMarkdown>{node.content}</ReactMarkdown>
              </div>

              {/* Chapter Footer Stats (Optional) */}
              <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-4">
                  <span>字数: {node.content.length}</span>
                  <span>选择: {node.choices?.length || 0}</span>
                </div>
                <div>
                   {/* State Delta could go here */}
                </div>
              </div>
            </motion.section>
          ))}
        </div>

        {/* End of Book */}
        <div className="py-20 text-center text-gray-400 space-y-4">
          <div className="w-16 h-px bg-gray-300 mx-auto" />
          <p className="font-serif italic">
            {adventure.is_finished ? "全书完" : "未完待续..."}
          </p>
          <div className="w-16 h-px bg-gray-300 mx-auto" />
        </div>

      </main>

      {/* Floating Action Button for Table of Contents (Mobile) */}
      <div className="fixed bottom-6 right-6 lg:hidden">
        <Button size="icon" className="h-14 w-14 rounded-full shadow-xl bg-gray-900 text-white hover:bg-gray-800">
          <BookOpen className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
