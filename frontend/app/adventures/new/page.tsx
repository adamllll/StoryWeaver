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

// Categories Configuration
const CATEGORIES = [
  { id: "玄幻", name: "东方玄幻", icon: Sword, description: "修仙、武道、神魔", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { id: "言情", name: "古言/现言", icon: Heart, description: "情感、宫斗、职场", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { id: "科幻", name: "未来科幻", icon: Rocket, description: "赛博、星际、末日", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "悬疑", name: "悬疑推理", icon: Ghost, description: "侦探、惊悚、解谜", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { id: "都市", name: "都市异能", icon: Building2, description: "异能、系统、直播", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { id: "其他", name: "自由题材", icon: BookOpen, description: "无限可能", color: "bg-gray-100 text-gray-700 border-gray-200" },
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
    // 验证必填字段（哼，这么重要的验证怎么能少！）
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
      setStep(1); // 返回第一步
      return;
    }

    if (!formData.random && !formData.protagonist_name.trim()) {
      toast({ title: "请输入主角姓名", variant: "destructive" });
      setStep(2); // 返回第二步
      return;
    }

    try {
      setIsSubmitting(true);
      const adventure = await adventureApi.create(formData);

      // Navigate to play page
      // Note: We need to check if adventure.id exists. Assuming standard response.
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="h-16 border-b bg-white flex items-center px-4 sticky top-0 z-10">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> 返回
        </Button>
        <h1 className="text-lg font-semibold">创建新冒险</h1>
      </header>

      <main className="flex-1 container max-w-2xl py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 px-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-col items-center relative z-0">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300",
                step >= s ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-500"
              )}>
                {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
              </div>
              <span className="text-xs mt-2 text-gray-500 font-medium">
                {s === 1 ? "类型设定" : s === 2 ? "主角档案" : "确认开始"}
              </span>
              {/* Progress Line */}
              {s < 3 && (
                <div className={cn(
                  "absolute top-4 left-full w-[calc(100vw/3-40px)] md:w-48 h-0.5 -z-10 -ml-4",
                  step > s ? "bg-purple-600" : "bg-gray-200"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Category */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold mb-4">选择故事类型</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = formData.category === cat.id;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                          className={cn(
                            "cursor-pointer p-4 rounded-xl border-2 transition-all hover:shadow-md flex flex-col items-center text-center gap-2",
                            isSelected 
                              ? "border-purple-500 bg-purple-50/50" 
                              : "border-transparent bg-gray-50 hover:bg-white hover:border-gray-200"
                          )}
                        >
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", cat.color)}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{cat.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{cat.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label>关键词 (Tags)</Label>
                  <p className="text-sm text-gray-500 mb-2">添加 1-5 个关键词，帮助 AI 把握风格（如：热血、复仇、轻松）</p>
                  <div className="flex gap-2 mb-3">
                    <Input 
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                      placeholder="输入关键词后回车"
                      maxLength={10}
                    />
                    <Button onClick={addKeyword} variant="outline" size="icon">
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.keywords.map((kw, i) => (
                      <span key={i} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        {kw}
                        <button onClick={() => removeKeyword(i)} className="hover:text-purple-900">×</button>
                      </span>
                    ))}
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
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">主角设定</h2>
                  <div className="flex items-center gap-2">
                    <Label className="cursor-pointer" htmlFor="random-mode">完全随机生成</Label>
                    <input 
                      type="checkbox" 
                      id="random-mode"
                      className="toggle"
                      checked={formData.random}
                      onChange={(e) => setFormData(prev => ({ ...prev, random: e.target.checked }))}
                    />
                  </div>
                </div>

                {!formData.random && (
                  <>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>姓名</Label>
                        <Input 
                          placeholder="主角名字" 
                          value={formData.protagonist_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, protagonist_name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>性别</Label>
                        <div className="flex gap-2">
                          {genderOptions.map(opt => (
                            <Button
                              key={opt.value}
                              variant={formData.protagonist_gender === opt.value ? "default" : "outline"}
                              className={cn(
                                "flex-1", 
                                formData.protagonist_gender === opt.value && "bg-purple-600 hover:bg-purple-700"
                              )}
                              onClick={() => setFormData(prev => ({ ...prev, protagonist_gender: opt.value }))}
                            >
                              {opt.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>性格特征 (可选)</Label>
                      <Textarea 
                        placeholder="例如：冷静沉着，或者热血冲动..."
                        value={formData.protagonist_personality || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, protagonist_personality: e.target.value }))}
                        className="h-24 resize-none"
                      />
                    </div>
                  </>
                )}

                {formData.random && (
                  <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                    <Dices className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                    <p className="text-lg font-medium">命运将为你抉择一切</p>
                    <p className="text-sm">AI 将自动生成最适合该类型的主角设定</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 text-center py-8"
              >
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Wand2 className="h-10 w-10 text-purple-600" />
                </div>
                
                <h2 className="text-2xl font-bold">准备就绪！</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  即将开始一场 <span className="text-purple-600 font-bold">{formData.category}</span> 之旅。
                  {formData.random ? "命运的齿轮开始转动..." : `主角 ${formData.protagonist_name} 的故事即将展开...`}
                </p>

                <div className="bg-gray-50 p-4 rounded-lg text-left text-sm max-w-sm mx-auto space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">类型:</span>
                    <span className="font-medium">{CATEGORIES.find(c => c.id === formData.category)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">关键词:</span>
                    <span className="font-medium">{formData.keywords.join(", ") || "无"}</span>
                  </div>
                  {!formData.random && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">主角:</span>
                        <span className="font-medium">{formData.protagonist_name} ({formData.protagonist_gender === 'male' ? '男' : '女'})</span>
                      </div>
                    </>
                  )}
                </div>

                <Button 
                  size="lg" 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="w-full max-w-xs bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/25"
                >
                  {isSubmitting ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 animate-spin" /> 正在生成开局...
                    </>
                  ) : (
                    <>
                      <Rocket className="mr-2 h-4 w-4" /> 开始冒险
                    </>
                  )}
                </Button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        {step < 3 && (
          <div className="flex justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={handlePrev} 
              disabled={step === 1}
              className="w-32"
            >
              上一步
            </Button>
            <Button 
              onClick={handleNext}
              className="w-32 bg-purple-600 hover:bg-purple-700"
            >
              下一步
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
