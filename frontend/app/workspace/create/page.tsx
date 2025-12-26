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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-3 text-gray-500">加载中...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* 导航栏 */}
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
          </nav>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container pt-24 pb-12 max-w-4xl">
        {/* 返回按钮 */}
        <Link
          href="/workspace"
          className="inline-flex items-center text-gray-500 hover:text-purple-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回创作中心
        </Link>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 1
                  ? "bg-purple-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step > 1 ? <Check className="w-5 h-5" /> : "1"}
            </div>
            <div
              className={`w-24 h-1 ${
                step > 1 ? "bg-purple-500" : "bg-gray-200"
              }`}
            />
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 2
                  ? "bg-purple-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              2
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="glass rounded-ios-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-ios-xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <h1 className="text-3xl font-bold mb-2">创建新小说</h1>
              <p className="text-gray-500">
                选择类型和关键词，让 AI 帮你生成故事大纲
              </p>
            </div>

            {/* 小说类型选择 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                小说类型
              </label>
              <div className="grid grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, category: cat.value })
                    }
                    className={`p-4 rounded-ios-lg text-left transition-all ${
                      formData.category === cat.value
                        ? "bg-purple-100 border-2 border-purple-500"
                        : "glass hover:bg-purple-50/50"
                    }`}
                  >
                    <div className="font-bold mb-1">{cat.label}</div>
                    <div className="text-xs text-gray-500">{cat.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 关键词输入 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                故事关键词
              </label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) =>
                  setFormData({ ...formData, keywords: e.target.value })
                }
                placeholder="例如：穿越、复仇、逆袭、系统"
                className="input-inset"
              />
              <p className="text-xs text-gray-400 mt-2">
                用逗号分隔多个关键词，AI 会根据这些关键词生成故事大纲
              </p>
            </div>

            {/* 风格偏好 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                风格偏好（可选）
              </label>
              <input
                type="text"
                value={formData.style}
                onChange={(e) =>
                  setFormData({ ...formData, style: e.target.value })
                }
                placeholder="例如：轻松搞笑、热血沸腾、细腻感人"
                className="input-inset"
              />
            </div>

            {/* 章节数量 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                预计章节数
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={formData.chapter_count}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      chapter_count: Number(e.target.value),
                    })
                  }
                  className="flex-1 accent-purple-500"
                />
                <span className="w-12 text-center font-bold text-purple-600">
                  {formData.chapter_count}
                </span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-4">
              <button
                onClick={generateOutline}
                disabled={isGenerating}
                className="flex-1 btn-primary py-4"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    AI 正在构思...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    AI 生成大纲
                  </>
                )}
              </button>
              <button
                onClick={() => setStep(2)}
                className="btn-secondary py-4 px-8"
              >
                跳过，直接创建
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="glass rounded-ios-2xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">确认小说信息</h1>
              <p className="text-gray-500">
                {outlineResult
                  ? "AI 已生成大纲，你可以修改后创建"
                  : "填写小说基本信息"}
              </p>
            </div>

            {/* 标题 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                小说标题
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="给你的小说起个名字"
                className="input-inset text-lg"
              />
            </div>

            {/* 简介 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                小说简介
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="介绍一下你的故事..."
                rows={4}
                className="textarea-glass"
              />
            </div>

            {/* 类型显示 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                小说类型
              </label>
              <div className="flex gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, category: cat.value })
                    }
                    className={`px-4 py-2 rounded-ios-lg text-sm font-medium transition-all ${
                      formData.category === cat.value
                        ? "bg-purple-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI 生成的大纲预览 */}
            {outlineResult && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  AI 生成的大纲
                </label>
                <div className="glass rounded-ios-xl p-4 max-h-80 overflow-y-auto custom-scrollbar">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                    {cleanOutlineText(outlineResult.outline)}
                  </pre>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  请参考上述大纲，填写小说标题和简介
                </p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="btn-secondary py-4 px-8"
              >
                上一步
              </button>
              <button
                onClick={createNovel}
                disabled={isLoading}
                className="flex-1 btn-primary py-4"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5 mr-2" />
                    创建小说
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 页脚 */}
      <footer className="glass border-t border-white/40 py-8">
        <div className="container text-center text-gray-500">
          <p>© 2024 织梦者 (StoryWeaver). AI 辅助应用开发课程设计项目.</p>
        </div>
      </footer>
    </div>
  );
}
