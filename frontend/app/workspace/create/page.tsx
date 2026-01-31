"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ArrowLeft,
  Loader2,
  Sparkles,
  Wand2,
  Check,
} from "lucide-react";
import { novelsApi, aiApi, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORIES = [
  { value: "玄幻", label: "玄幻", desc: "修仙、魔法、异世界" },
  { value: "言情", label: "言情", desc: "现代、古代、都市爱情" },
  { value: "科幻", label: "科幻", desc: "未来、星际、赛博朋克" },
  { value: "悬疑", label: "悬疑", desc: "推理、惊悚、犯罪" },
  { value: "历史", label: "历史", desc: "穿越、架空、真实历史" },
  { value: "都市", label: "都市", desc: "职场、生活、励志" },
];

interface OutlineResult {
  title: string;
  description: string;
  outline: string;
}

function cleanOutlineText(text: string): string {
  if (!text) return "";

  let cleaned = text;

  const prefixPatterns = [
    /^(好的[，,]?|嗯[，,]?|是的[，,]?|当然[，,]?)/,
    /^(我[来会]为[你您]|让我[来为]|下面[是我]|以下是)/,
    /^(根据[你您]的?(要求|需求|描述|信息|设定)[，,]?)/,
    /^(按照[你您]的?(要求|需求|描述)[，,]?)/,
    /^(这[是就]一[份个部])/,
    /^(我已?为[你您]生成了?|我设计了?|我创作了?)/,
    /^.*?[，,]\s*(我[来会]为[你您])/,
  ];

  for (const pattern of prefixPatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  const suffixPatterns = [
    /[。.!！]?\s*(希望[这这份个]|如果[你您]需要|有任何问题|欢迎[继续随时]|如有[需要其他]|以上[是就]|祝[你您创])[^]*$/,
    /[。.!！]?\s*---\s*\n*$/,
  ];

  for (const pattern of suffixPatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  return cleaned.trim();
}

export default function CreateNovelPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, checkAuth } = useAuthStore();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    keywords: "",
    style: "",
    chapter_count: 10,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [outlineResult, setOutlineResult] = useState<OutlineResult | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const doCheckAuth = async () => {
      await checkAuth();
      setAuthChecked(true);
    };
    doCheckAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      router.push("/login");
    }
  }, [authChecked, isAuthenticated, router]);

  const generateOutline = async () => {
    if (!formData.category) {
      toast({
        title: "请先选择类型",
        description: "需要选择小说类型才能生成大纲",
        variant: "destructive",
      });
      return;
    }

    const keywords = formData.keywords
      .split(/[,，、\s]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (keywords.length === 0) {
      toast({
        title: "请输入关键词",
        description: "需要至少一个关键词来生成大纲",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await aiApi.generateOutline({
        category: formData.category as "玄幻" | "言情" | "科幻" | "悬疑" | "历史" | "都市" | "其他",
        keywords: keywords.join("、"),
        chapter_count: formData.chapter_count,
      });
      setOutlineResult(result);

      setFormData({
        ...formData,
        title: result.title,
        description: result.description,
      });

      setStep(2);
      toast({
        title: "大纲生成成功",
        description: "AI 已生成故事大纲和基本信息，你可以修改后创建",
      });
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "生成失败",
          description: error.detail,
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const createNovel = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "请输入标题",
        description: "小说标题不能为空",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "请选择类型",
        description: "请选择小说类型",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const novel = await novelsApi.create({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        outline: outlineResult?.outline || undefined,
      });

      toast({
        title: "创建成功",
        description: "正在跳转到编辑器...",
      });

      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push(`/workspace/${novel.id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "创建失败",
          description: error.detail,
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen grid-paper-bg flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-sketch-text-secondary" />
          <span className="font-patrick text-sketch-text-secondary">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-paper-bg">
      <Header />

      <main className="container pt-12 pb-20 max-w-4xl">
        {/* Back button */}
        <Link
          href="/workspace"
          className="inline-flex items-center font-patrick text-sketch-text-secondary hover:text-sketch-text-primary transition-colors mb-8 group"
        >
          <div className="w-8 h-8 rounded-full bg-white border-2 border-dashed border-sketch-text-secondary/30 flex items-center justify-center mr-2 group-hover:border-sketch-text-primary group-hover:shadow-sketch transition-all">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </div>
          返回创作中心
        </Link>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-caveat font-bold transition-all border-2",
                  step >= 1
                    ? "bg-sticky-yellow border-sketch-text-primary text-sketch-text-primary shadow-sketch"
                    : "bg-white border-sketch-text-secondary/30 text-sketch-text-muted"
                )}
              >
                {step > 1 ? <Check className="w-4 h-4" /> : "1"}
              </div>
              <span className={cn("text-sm font-patrick", step >= 1 ? "text-sketch-text-primary" : "text-sketch-text-muted")}>
                构思大纲
              </span>
            </div>
            <div className="w-16 h-0.5 border-t-2 border-dashed border-sketch-text-secondary/30" />
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-caveat font-bold transition-all border-2",
                  step >= 2
                    ? "bg-sticky-yellow border-sketch-text-primary text-sketch-text-primary shadow-sketch"
                    : "bg-white border-sketch-text-secondary/30 text-sketch-text-muted"
                )}
              >
                2
              </div>
              <span className={cn("text-sm font-patrick", step >= 2 ? "text-sketch-text-primary" : "text-sketch-text-muted")}>
                确认创建
              </span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card variant="sketch" className="p-8 md:p-10">
                <div className="text-center mb-10">
                  <div className="w-20 h-20 rounded-xl bg-sticky-blue border-2 border-dashed border-sketch-text-secondary/30 flex items-center justify-center mx-auto mb-6 shadow-sketch">
                    <Sparkles className="w-10 h-10 text-sketch-text-primary" />
                  </div>
                  <h1 className="text-3xl font-caveat font-bold mb-3 text-sketch-text-primary">
                    激发你的创作灵感
                  </h1>
                  <p className="font-patrick text-sketch-text-secondary max-w-md mx-auto">
                    选择类型并输入关键词，让 AI 为你构建一个精彩的故事骨架
                  </p>
                </div>

                {/* Category selection */}
                <div className="mb-8">
                  <label className="block text-sm font-caveat font-bold text-sketch-text-primary mb-4 ml-1">
                    小说类型
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.value })}
                        className={cn(
                          "p-4 rounded-xl text-left transition-all border-2 group",
                          formData.category === cat.value
                            ? "bg-sticky-blue border-sketch-text-primary shadow-sketch"
                            : "bg-white border-dashed border-sketch-text-secondary/30 hover:border-solid hover:border-sketch-text-secondary hover:shadow-sketch-sm"
                        )}
                      >
                        <div
                          className={cn(
                            "font-caveat font-bold mb-1 text-base",
                            formData.category === cat.value
                              ? "text-sketch-text-primary"
                              : "text-sketch-text-secondary group-hover:text-sketch-text-primary"
                          )}
                        >
                          {cat.label}
                        </div>
                        <div className="text-xs font-patrick text-sketch-text-muted">{cat.desc}</div>
                        {formData.category === cat.value && (
                          <div className="absolute top-2 right-2 text-sketch-text-primary">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Keywords input */}
                <div className="mb-8">
                  <label className="block text-sm font-caveat font-bold text-sketch-text-primary mb-2 ml-1">
                    核心关键词
                  </label>
                  <div className="relative">
                    <Input
                      variant="sketch"
                      value={formData.keywords}
                      onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                      placeholder="例如：穿越、复仇、逆袭、系统..."
                      className="pr-20"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-patrick text-sketch-text-muted pointer-events-none bg-white/80 px-2 py-1 rounded-md">
                      用逗号分隔
                    </div>
                  </div>
                </div>

                {/* More settings */}
                <div className="grid md:grid-cols-2 gap-6 mb-10">
                  <div>
                    <label className="block text-sm font-caveat font-bold text-sketch-text-primary mb-2 ml-1">
                      风格偏好 <span className="text-sketch-text-muted font-patrick font-normal">(可选)</span>
                    </label>
                    <Input
                      variant="sketch"
                      value={formData.style}
                      onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                      placeholder="例如：轻松搞笑、热血沸腾"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-caveat font-bold text-sketch-text-primary mb-2 ml-1">
                      预计章节数
                    </label>
                    <div className="h-12 bg-white border-2 border-dashed border-sketch-text-secondary/30 rounded-xl flex items-center px-4 gap-4">
                      <input
                        type="range"
                        min="5"
                        max="50"
                        step="5"
                        value={formData.chapter_count}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            chapter_count: Number(e.target.value),
                          })
                        }
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sticky-blue"
                      />
                      <span className="w-16 text-center font-caveat font-bold text-sketch-text-primary bg-sticky-yellow py-1 rounded-lg border border-sketch-text-secondary/30">
                        {formData.chapter_count}章
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col md:flex-row gap-4">
                  <Button
                    variant="sketch-secondary"
                    onClick={() => setStep(2)}
                    className="px-8 py-4"
                  >
                    跳过 AI，直接创建
                  </Button>
                  <Button
                    variant="sketch"
                    onClick={generateOutline}
                    disabled={isGenerating}
                    loading={isGenerating}
                    className="flex-1 py-4"
                  >
                    {isGenerating ? (
                      "正在构思大纲..."
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5 mr-2" />
                        AI 生成大纲
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card variant="sketch" className="p-8 md:p-10">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-caveat font-bold mb-2 text-sketch-text-primary">
                    确认小说信息
                  </h1>
                  <p className="font-patrick text-sketch-text-secondary">
                    {outlineResult ? "AI 已为你生成大纲，请确认或修改" : "填写小说基本信息以完成创建"}
                  </p>
                </div>

                {/* Title */}
                <div className="mb-6">
                  <label className="block text-sm font-caveat font-bold text-sketch-text-primary mb-2 ml-1">
                    小说标题
                  </label>
                  <Input
                    variant="sketch"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="给你的小说起个名字"
                    className="text-lg font-bold"
                  />
                </div>

                {/* Description */}
                <div className="mb-6">
                  <label className="block text-sm font-caveat font-bold text-sketch-text-primary mb-2 ml-1">
                    小说简介
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="介绍一下你的故事..."
                    rows={4}
                    className="w-full px-5 py-4 rounded-xl bg-white border-2 border-dashed border-sketch-text-secondary/30 focus:border-solid focus:border-sketch-text-primary focus:ring-2 focus:ring-sticky-yellow/50 transition-all outline-none font-patrick text-sketch-text-primary text-sm leading-relaxed resize-none"
                  />
                </div>

                {/* AI generated outline preview */}
                {outlineResult && (
                  <div className="mb-8">
                    <label className="block text-sm font-caveat font-bold text-sketch-text-primary mb-2 ml-1 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-sticky-blue" />
                      AI 生成的大纲
                    </label>
                    <div className="w-full px-5 py-4 rounded-xl bg-sticky-yellow-light/30 border-2 border-dashed border-sticky-yellow max-h-80 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm font-patrick text-sketch-text-secondary leading-relaxed">
                        {cleanOutlineText(outlineResult.outline)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-4 pt-4 border-t-2 border-dashed border-sketch-text-secondary/20">
                  <Button variant="sketch-secondary" onClick={() => setStep(1)} className="px-8">
                    返回修改
                  </Button>
                  <Button
                    variant="sketch"
                    onClick={createNovel}
                    disabled={isLoading}
                    loading={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      "创建中..."
                    ) : (
                      <>
                        <BookOpen className="w-5 h-5 mr-2" />
                        立即创建
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-dashed border-sketch-text-secondary/30 py-8 grid-paper-bg">
        <div className="container text-center font-patrick text-sketch-text-muted text-sm">
          <p>© 2025 织梦者 (StoryWeaver). AI 辅助应用开发课程设计项目.</p>
        </div>
      </footer>
    </div>
  );
}
