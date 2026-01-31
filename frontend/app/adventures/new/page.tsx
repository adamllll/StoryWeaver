"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Wand2,
  Dices,
  CheckCircle2,
  BookOpen,
  Sword,
  Heart,
  Building2,
  Ghost,
  Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { adventureApi } from "@/lib/api";
import { CreateAdventureRequest } from "@/lib/adventure-types";
import { cn } from "@/lib/utils";

// Categories Configuration with sketch-friendly colors
const CATEGORIES = [
  { id: "玄幻", name: "东方玄幻", icon: Sword, description: "修仙、武道、神魔", bgColor: "bg-sticky-yellow" },
  { id: "言情", name: "古言/现言", icon: Heart, description: "情感、宫斗、职场", bgColor: "bg-sticky-pink" },
  { id: "科幻", name: "未来科幻", icon: Rocket, description: "赛博、星际、末日", bgColor: "bg-sticky-blue" },
  { id: "悬疑", name: "悬疑推理", icon: Ghost, description: "侦探、惊悚、解谜", bgColor: "bg-sticky-green" },
  { id: "都市", name: "都市异能", icon: Building2, description: "异能、系统、直播", bgColor: "bg-sticky-blue-light" },
  { id: "其他", name: "自由题材", icon: BookOpen, description: "无限可能", bgColor: "bg-white" },
];

export default function CreateAdventurePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const genderOptions: Array<{
    value: CreateAdventureRequest["protagonist_gender"];
    label: string;
  }> = [
    { value: "male", label: "男" },
    { value: "female", label: "女" },
    { value: "other", label: "其他" },
  ];

  // Form State
  const [formData, setFormData] = useState<CreateAdventureRequest>({
    category: "",
    keywords: [],
    protagonist_name: "",
    protagonist_gender: "male",
    protagonist_personality: "",
    random: false,
  });

  const [keywordInput, setKeywordInput] = useState("");

  const handleNext = () => {
    if (step === 1 && !formData.category) {
      toast({ title: "请选择一个类型", variant: "destructive" });
      return;
    }
    if (step === 2 && !formData.protagonist_name && !formData.random) {
      toast({ title: "请输入主角姓名", variant: "destructive" });
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrev = () => setStep(prev => prev - 1);

  const addKeyword = () => {
    if (keywordInput.trim() && formData.keywords.length < 5) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput("");
    }
  };

  const removeKeyword = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.category) {
      toast({ title: "请选择故事类型", variant: "destructive" });
      return;
    }

    if (formData.keywords.length === 0) {
      toast({
        title: "至少添加1个关键词",
        description: "关键词帮助 AI 更好地生成故事～",
        variant: "destructive"
      });
      setStep(1);
      return;
    }

    if (!formData.random && !formData.protagonist_name.trim()) {
      toast({ title: "请输入主角姓名", variant: "destructive" });
      setStep(2);
      return;
    }

    try {
      setIsSubmitting(true);
      const adventure = await adventureApi.create(formData);

      if (adventure?.id) {
         toast({ title: "冒险开始！", description: "正在生成开局..." });
         router.push(`/adventures/${adventure.id}/play`);
      } else {
         throw new Error("Failed to create adventure");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "创建失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid-paper-bg flex flex-col relative overflow-hidden">
      {/* Header - Sketch style */}
      <header className="h-16 flex items-center px-4 sticky top-0 z-50 bg-white/95 border-b-2 border-dashed border-sketch-text-secondary/30">
        <div className="container max-w-4xl mx-auto flex items-center">
          <Button variant="sketch-ghost" size="sm" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> 返回
          </Button>
          <h1 className="text-xl font-caveat font-bold text-sketch-text-primary">创建新冒险</h1>
        </div>
      </header>

      <main className="flex-1 container max-w-4xl py-8 relative z-10">
        {/* Progress Steps - Sketch style */}
        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-sketch font-patrick",
                  step >= s ? "bg-sticky-yellow border-2 border-sketch-text-primary shadow-sketch text-sketch-text-primary" : "text-sketch-text-muted border-2 border-dashed border-sketch-text-secondary/30"
                )}>
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                    step >= s ? "bg-sketch-text-primary text-white" : "bg-gray-200 text-sketch-text-muted"
                  )}>
                    {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                  </div>
                  <span className="text-sm font-medium">
                    {s === 1 ? "类型设定" : s === 2 ? "主角档案" : "确认开始"}
                  </span>
                </div>
                {s < 3 && (
                  <div className="w-8 h-0.5 border-t-2 border-dashed border-sketch-text-secondary/30 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content - Sketch card style */}
        <div className="bg-white border-2 border-sketch-text-primary rounded-xl p-8 md:p-10 shadow-sketch min-h-[500px] relative overflow-hidden">
          <AnimatePresence mode="wait">

            {/* Step 1: Category */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-caveat font-bold mb-6 text-sketch-text-primary">选择故事类型</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = formData.category === cat.id;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                          className={cn(
                            "cursor-pointer group relative p-6 rounded-xl transition-all duration-sketch border-2",
                            isSelected
                              ? "border-sketch-text-primary shadow-sketch scale-[1.02]"
                              : "border-dashed border-sketch-text-secondary/30 hover:border-solid hover:border-sketch-text-secondary",
                            cat.bgColor
                          )}
                        >
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-white/70 border-2 border-dashed border-sketch-text-secondary/30 text-sketch-text-primary transition-transform group-hover:scale-110">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="font-caveat font-bold text-sketch-text-primary text-lg mb-1">{cat.name}</div>
                          <div className="text-xs text-sketch-text-secondary font-patrick">{cat.description}</div>

                          {isSelected && (
                            <div className="absolute top-3 right-3 text-sketch-text-primary">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-sticky-pink-light/50 rounded-xl p-6 border-2 border-dashed border-sketch-text-secondary/30">
                  <Label className="text-base font-caveat font-bold text-sketch-text-primary mb-2 block">关键词 (Tags)</Label>
                  <p className="text-sm text-sketch-text-secondary font-patrick mb-4">添加 1-5 个关键词，帮助 AI 把握风格（如：热血、复仇、轻松）</p>
                  <div className="flex gap-2 mb-4">
                    <Input
                      variant="sketch"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                      placeholder="输入关键词后回车"
                      maxLength={10}
                    />
                    <Button variant="sketch-secondary" onClick={addKeyword} className="aspect-square p-0 w-12">
                      <Sparkles className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[32px]">
                    {formData.keywords.map((kw, i) => (
                      <span key={i} className="bg-sticky-yellow text-sketch-text-primary px-3 py-1.5 rounded-lg text-sm font-patrick font-bold border-2 border-sketch-text-primary/20 flex items-center gap-2">
                        {kw}
                        <button onClick={() => removeKeyword(i)} className="hover:text-red-600 w-4 h-4 flex items-center justify-center rounded-full hover:bg-white/50 transition-colors">×</button>
                      </span>
                    ))}
                    {formData.keywords.length === 0 && (
                      <span className="text-sm text-sketch-text-muted font-patrick italic py-1.5">暂无关键词...</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Protagonist */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-caveat font-bold text-sketch-text-primary">主角设定</h2>
                  <div className="flex items-center gap-3 bg-sticky-blue-light/50 px-4 py-2 rounded-xl border-2 border-dashed border-sketch-text-secondary/30">
                    <Label className="cursor-pointer font-patrick font-medium text-sketch-text-primary" htmlFor="random-mode">完全随机生成</Label>
                    <input
                      type="checkbox"
                      id="random-mode"
                      className="w-5 h-5 accent-sketch-text-primary rounded cursor-pointer"
                      checked={formData.random}
                      onChange={(e) => setFormData(prev => ({ ...prev, random: e.target.checked }))}
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {!formData.random ? (
                    <motion.div
                      key="manual"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="font-patrick font-semibold text-sketch-text-primary">姓名</Label>
                          <Input
                            variant="sketch"
                            placeholder="主角名字"
                            value={formData.protagonist_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, protagonist_name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-patrick font-semibold text-sketch-text-primary">性别</Label>
                          <div className="flex gap-3 bg-sticky-yellow-light/50 p-1 rounded-xl border-2 border-dashed border-sketch-text-secondary/30">
                            {genderOptions.map(opt => (
                              <button
                                key={opt.value}
                                className={cn(
                                  "flex-1 py-2 rounded-lg text-sm font-patrick font-medium transition-all duration-sketch",
                                  formData.protagonist_gender === opt.value
                                    ? "bg-sticky-yellow text-sketch-text-primary shadow-sketch-sm border-2 border-sketch-text-primary/20"
                                    : "text-sketch-text-secondary hover:text-sketch-text-primary"
                                )}
                                onClick={() => setFormData(prev => ({ ...prev, protagonist_gender: opt.value }))}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-patrick font-semibold text-sketch-text-primary">性格特征 (可选)</Label>
                        <Textarea
                          placeholder="例如：冷静沉着，擅长分析；或者热血冲动，重情重义..."
                          value={formData.protagonist_personality || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, protagonist_personality: e.target.value }))}
                          className="h-32 font-patrick bg-white/90 border-2 border-dashed border-sketch-text-secondary focus:border-solid focus:border-sketch-text-primary rounded-xl transition-all"
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="random"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="py-16 text-center"
                    >
                      <div className="w-24 h-24 mx-auto mb-6 bg-sticky-pink-light border-2 border-dashed border-sketch-text-secondary/30 rounded-full flex items-center justify-center animate-pulse">
                        <Dices className="h-12 w-12 text-sketch-text-primary" />
                      </div>
                      <h3 className="text-xl font-caveat font-bold text-sketch-text-primary mb-2">命运将为你抉择一切</h3>
                      <p className="text-sketch-text-secondary font-patrick max-w-sm mx-auto">
                        AI 将根据你选择的类型和关键词，自动生成最适合的主角设定。准备好迎接惊喜了吗？
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10 text-center py-4"
              >
                <div className="relative inline-block">
                  <div className="relative w-24 h-24 bg-sticky-yellow border-2 border-sketch-text-primary rounded-xl shadow-sketch flex items-center justify-center mx-auto mb-6">
                    <Wand2 className="h-12 w-12 text-sketch-text-primary" />
                  </div>
                </div>

                <div>
                  <h2 className="text-3xl font-caveat font-bold text-sketch-text-primary mb-2">准备就绪！</h2>
                  <p className="text-sketch-text-secondary font-patrick text-lg">
                    即将开启一段 <span className="text-sketch-text-primary font-bold">{CATEGORIES.find(c => c.id === formData.category)?.name}</span> 传奇
                  </p>
                </div>

                <div className="bg-sticky-pink-light/50 p-6 rounded-xl border-2 border-dashed border-sketch-text-secondary/30 max-w-md mx-auto space-y-4 text-left">
                  <div className="flex justify-between items-center pb-3 border-b-2 border-dashed border-sketch-text-secondary/20">
                    <span className="text-sketch-text-secondary font-patrick">类型</span>
                    <span className="font-caveat font-bold text-sketch-text-primary">{CATEGORIES.find(c => c.id === formData.category)?.name}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b-2 border-dashed border-sketch-text-secondary/20">
                    <span className="text-sketch-text-secondary font-patrick">关键词</span>
                    <div className="flex gap-1">
                      {formData.keywords.length > 0 ? formData.keywords.map(k => (
                        <span key={k} className="text-xs bg-sticky-yellow text-sketch-text-primary px-2 py-1 rounded-md font-patrick">{k}</span>
                      )) : <span className="text-sketch-text-muted font-patrick">无</span>}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sketch-text-secondary font-patrick">主角</span>
                    {formData.random ? (
                      <span className="font-patrick font-bold text-sketch-text-primary flex items-center gap-1"><Dices className="w-4 h-4" /> 随机生成</span>
                    ) : (
                      <span className="font-patrick font-bold text-sketch-text-primary">{formData.protagonist_name} ({formData.protagonist_gender === 'male' ? '男' : formData.protagonist_gender === 'female' ? '女' : '其他'})</span>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    variant="sketch"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    className="w-full max-w-sm h-14 text-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" /> 正在织造世界...
                      </>
                    ) : (
                      <>
                        <Rocket className="mr-2 h-5 w-5" /> 开始冒险
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Navigation Buttons - Sketch style */}
        {step < 3 && (
          <div className="flex justify-between mt-8 px-2">
            <Button
              variant="sketch-ghost"
              onClick={handlePrev}
              disabled={step === 1}
              className="w-32"
            >
              上一步
            </Button>
            <Button
              variant="sketch"
              onClick={handleNext}
              className="w-32"
            >
              下一步
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
