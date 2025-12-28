"use client";

import { useState } from "react";
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
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "玄幻", label: "玄幻", desc: "修仙、魔法、异世界" },
  { value: "言情", label: "言情", desc: "现代、古代、都市爱情" },
  { value: "科幻", label: "科幻", desc: "未来、星际、赛博朋克" },
  { value: "悬疑", label: "悬疑", desc: "推理、惊悚、犯罪" },
  { value: "历史", label: "历史", desc: "穿越、架空、真实历史" },
  { value: "都市", label: "都市", desc: "职场、生活、励志" },
];

// 后端返回的大纲格式
interface OutlineResult {
  title: string;        // AI生成的标题
  description: string;  // AI生成的简介
  outline: string;      // 完整大纲(Markdown)
}

// 清理 AI 生成的大纲中的提示词废话
function cleanOutlineText(text: string): string {
  if (!text) return "";

  let cleaned = text;

  // 移除常见的 AI 开头客套话
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

  // 移除常见的 AI 结尾客套话
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

  // 表单状态
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
    // 等待认证检查完成后再决定是否跳转
    if (authChecked && !isAuthenticated) {
      router.push("/login");
    }
  }, [authChecked, isAuthenticated, router]);

  // AI 生成大纲
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
        keywords: keywords.join("、"),  // 后端期望字符串，用顿号连接
        chapter_count: formData.chapter_count,
      });
      setOutlineResult(result);

      // ✨ 自动填充AI生成的标题和简介到表单
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

  // 创建小说
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
        // ✅ 添加大纲字段：如果有 AI 生成的大纲，就传递给后端
        outline: outlineResult?.outline || undefined,
      });

      toast({
        title: "创建成功",
        description: "正在跳转到编辑器...",
      });

      // 添加短暂延迟让toast显示，提升用户体验
      await new Promise(resolve => setTimeout(resolve, 500));

      // 不要立即关闭loading，让页面跳转有loading反馈
      router.push(`/workspace/${novel.id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "创建失败",
          description: error.detail,
          variant: "destructive",
        });
      }
      // 只在错误时关闭loading
      setIsLoading(false);
    }
  };

  // 认证检查中显示加载
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ios-bg">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-3 text-gray-500 font-medium">加载中...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-bg relative overflow-hidden">
      {/* 装饰性背景 */}
      <div className="fixed -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-200/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed top-[20%] -right-[10%] w-[40%] h-[40%] bg-blue-200/20 blur-[100px] rounded-full pointer-events-none" />

      {/* 导航栏 */}
      <header className="sticky top-0 z-50 w-full h-20 nav-glass">
        <div className="container h-full relative flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-all duration-300">
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
          </nav>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container pt-12 pb-20 max-w-4xl relative z-10">
        {/* 返回按钮 */}
        <Link
          href="/workspace"
          className="inline-flex items-center text-gray-500 hover:text-purple-600 transition-colors mb-8 group"
        >
          <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center mr-2 group-hover:bg-white shadow-sm transition-all">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </div>
          返回创作中心
        </Link>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-sm",
                  step >= 1 ? "bg-purple-600 text-white shadow-purple-200" : "bg-white text-gray-400"
                )}
              >
                {step > 1 ? <Check className="w-4 h-4" /> : "1"}
              </div>
              <span className={cn("text-sm font-medium", step >= 1 ? "text-purple-900" : "text-gray-400")}>构思大纲</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-200" />
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-sm",
                  step >= 2 ? "bg-purple-600 text-white shadow-purple-200" : "bg-white text-gray-400"
                )}
              >
                2
              </div>
              <span className={cn("text-sm font-medium", step >= 2 ? "text-purple-900" : "text-gray-400")}>确认创建</span>
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
              className="glass rounded-ios-2xl p-8 md:p-10 shadow-ios-float border border-white/60 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              
              <div className="text-center mb-10 relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-50 flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/50">
                  <Sparkles className="w-10 h-10 text-purple-600" />
                </div>
                <h1 className="text-3xl font-bold mb-3 text-gray-900 tracking-tight">激发你的创作灵感</h1>
                <p className="text-gray-500 max-w-md mx-auto">
                  选择类型并输入关键词，让 AI 为你构建一个精彩的故事骨架
                </p>
              </div>

              {/* 小说类型选择 */}
              <div className="mb-8 relative z-10">
                <label className="block text-sm font-bold text-gray-700 mb-4 ml-1">
                  小说类型
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, category: cat.value })
                      }
                      className={cn(
                        "p-4 rounded-ios-xl text-left transition-all border relative overflow-hidden group",
                        formData.category === cat.value
                          ? "bg-purple-50/80 border-purple-500 shadow-ios-purple"
                          : "bg-white/60 border-transparent hover:bg-white hover:border-purple-200 hover:shadow-lg"
                      )}
                    >
                      <div className="relative z-10">
                        <div className={cn(
                          "font-bold mb-1 text-base",
                          formData.category === cat.value ? "text-purple-700" : "text-gray-800 group-hover:text-purple-700"
                        )}>{cat.label}</div>
                        <div className="text-xs text-gray-500">{cat.desc}</div>
                      </div>
                      {formData.category === cat.value && (
                        <div className="absolute top-2 right-2 text-purple-600">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 关键词输入 */}
              <div className="mb-8 relative z-10">
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                  核心关键词
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) =>
                      setFormData({ ...formData, keywords: e.target.value })
                    }
                    placeholder="例如：穿越、复仇、逆袭、系统..."
                    className="w-full pl-5 pr-4 py-4 rounded-ios-xl bg-white/50 border border-gray-200 focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-100/50 transition-all outline-none text-gray-900 placeholder:text-gray-400 shadow-sm group-hover:shadow-md"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none bg-white/80 px-2 py-1 rounded-md backdrop-blur-sm">
                    用逗号分隔
                  </div>
                </div>
              </div>

              {/* 更多设置折叠区 (简单处理，平铺) */}
              <div className="grid md:grid-cols-2 gap-6 mb-10 relative z-10">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                    风格偏好 <span className="text-gray-400 font-normal">(可选)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.style}
                    onChange={(e) =>
                      setFormData({ ...formData, style: e.target.value })
                    }
                    placeholder="例如：轻松搞笑、热血沸腾"
                    className="input-glass bg-white/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                    预计章节数
                  </label>
                  <div className="h-12 bg-white/50 rounded-ios-xl border border-gray-200 flex items-center px-4 gap-4">
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
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <span className="w-16 text-center font-mono font-bold text-purple-600 bg-purple-50 py-1 rounded-md">
                      {formData.chapter_count}章
                    </span>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-col md:flex-row gap-4 relative z-10">
                <button
                  onClick={() => setStep(2)}
                  className="px-8 py-4 rounded-ios-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                >
                  跳过 AI，直接创建
                </button>
                <button
                  onClick={generateOutline}
                  disabled={isGenerating}
                  className="flex-1 btn-primary py-4 rounded-ios-xl text-lg font-bold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      正在构思大纲...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      AI 生成大纲
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass rounded-ios-2xl p-8 md:p-10 shadow-ios-float border border-white/60"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2 text-gray-900">确认小说信息</h1>
                <p className="text-gray-500">
                  {outlineResult
                    ? "AI 已为你生成大纲，请确认或修改"
                    : "填写小说基本信息以完成创建"}
                </p>
              </div>

              {/* 标题 */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                  小说标题
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="给你的小说起个名字"
                  className="w-full px-5 py-4 text-lg font-bold rounded-ios-xl bg-white/60 border border-gray-200 focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-100/50 transition-all outline-none text-gray-900 placeholder:text-gray-400 font-sans"
                />
              </div>

              {/* 简介 */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                  小说简介
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="介绍一下你的故事..."
                  rows={4}
                  className="w-full px-5 py-4 rounded-ios-xl bg-white/60 border border-gray-200 focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-100/50 transition-all outline-none text-gray-700 text-sm leading-relaxed resize-none font-sans"
                />
              </div>

              {/* AI 生成的大纲预览 */}
              {outlineResult && (
                <div className="mb-8">
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    AI 生成的大纲
                  </label>
                  <div className="w-full px-5 py-4 rounded-ios-xl bg-white/60 border border-gray-200 max-h-80 overflow-y-auto custom-scrollbar shadow-inner">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                      {cleanOutlineText(outlineResult.outline)}
                    </pre>
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-4 pt-4 border-t border-gray-100/50">
                <button
                  onClick={() => setStep(1)}
                  className="px-8 py-3.5 rounded-ios-xl bg-white border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  返回修改
                </button>
                <button
                  onClick={createNovel}
                  disabled={isLoading}
                  className="flex-1 btn-primary py-3.5 rounded-ios-xl text-lg font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-5 h-5" />
                      立即创建
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 页脚 */}
      <footer className="glass border-t border-white/40 py-8 relative z-10">
        <div className="container text-center text-gray-500 text-sm">
          <p>© 2025 织梦者 (StoryWeaver). AI 辅助应用开发课程设计项目.</p>
        </div>
      </footer>
    </div>
  );
}