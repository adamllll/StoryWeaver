"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Users,
  Sparkles,
  Trash2,
  Save,
  X,
} from "lucide-react";
import {
  novelsApi,
  charactersApi,
  aiApi,
  NovelDetail,
  Character,
  ApiError,
} from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CharactersPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated } = useAuthStore();
  const novelId = Number(params.novelId);

  const [novel, setNovel] = useState<NovelDetail | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const aiButtonRef = useRef<HTMLButtonElement>(null);

  const [form, setForm] = useState({
    name: "",
    role_type: null as Character["role_type"],
    description: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [novelData, charactersData] = await Promise.all([
          novelsApi.get(novelId),
          charactersApi.list(novelId),
        ]);
        setNovel(novelData);
        setCharacters(charactersData.characters);
      } catch (error) {
        if (error instanceof ApiError) {
          toast({
            title: "加载失败",
            description: error.detail,
            variant: "destructive",
          });
          if (error.status === 404) {
            router.push("/workspace");
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, novelId, router, toast]);

  const handleCreate = () => {
    setIsCreating(true);
    setForm({ name: "", role_type: null, description: "" });
    setEditingCharacter(null);
  };

  const handleEdit = (character: Character) => {
    setEditingCharacter(character);
    setForm({
      name: character.name,
      role_type: character.role_type,
      description: character.description || "",
    });
    setIsCreating(false);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingCharacter(null);
    setForm({ name: "", role_type: null, description: "" });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({
        title: "请输入角色名称",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editingCharacter) {
        const updated = await charactersApi.update(novelId, editingCharacter.id, {
          name: form.name,
          role_type: form.role_type || undefined,
          description: form.description || undefined,
        });
        setCharacters(characters.map((c) => (c.id === updated.id ? updated : c)));
        toast({ title: "角色已更新" });
      } else {
        const created = await charactersApi.create(novelId, {
          name: form.name,
          role_type: form.role_type || undefined,
          description: form.description || undefined,
        });
        setCharacters([...characters, created]);
        toast({ title: "角色已创建" });
      }
      handleCancel();
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "保存失败",
          description: error.detail,
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (character: Character) => {
    if (!confirm(`确定要删除角色"${character.name}"吗？`)) return;

    try {
      await charactersApi.delete(novelId, character.id);
      setCharacters(characters.filter((c) => c.id !== character.id));
      toast({ title: "角色已删除" });
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "删除失败",
          description: error.detail,
          variant: "destructive",
        });
      }
    }
  };

  const handleAIGenerate = async (roleType: Character["role_type"]) => {
    if (!roleType) return;

    setShowAIMenu(false);
    setIsAIGenerating(true);
    try {
      const result = await aiApi.generateCharacter({
        novel_id: novelId,
        role_type: roleType,
      });

      const characterData = result.character;
      setForm({
        name: characterData.name,
        role_type: roleType,
        description: `性别: ${characterData.gender}
年龄: ${characterData.age}
身份: ${characterData.identity}

外貌:
${characterData.appearance}

性格:
${characterData.personality.join("、")}

背景故事:
${characterData.background}

能力特长:
${characterData.abilities}`,
      });
      setIsCreating(true);
      toast({
        title: "AI 生成成功",
        description: "已生成角色设定，你可以继续编辑或直接保存",
      });
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "AI 生成失败",
          description: error.detail,
          variant: "destructive",
        });
      }
    } finally {
      setIsAIGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen grid-paper-bg flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-sketch-text-secondary" />
          <span className="font-patrick text-sketch-text-secondary">加载中...</span>
        </div>
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="min-h-screen grid-paper-bg flex items-center justify-center">
        <Card variant="sketch" className="text-center p-12">
          <div className="w-20 h-20 rounded-xl bg-sticky-blue border-2 border-dashed border-sketch-text-secondary/30 flex items-center justify-center mx-auto mb-6 shadow-sketch">
            <Users className="w-10 h-10 text-sketch-text-secondary" />
          </div>
          <h2 className="text-xl font-caveat font-bold text-sketch-text-primary mb-2">小说不存在</h2>
          <Link href="/workspace">
            <Button variant="sketch" className="mt-4">返回创作中心</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const roleTypeOptions: Array<{ value: Character["role_type"]; label: string; bgColor: string; textColor: string }> = [
    { value: "主角", label: "主角", bgColor: "bg-sticky-yellow", textColor: "text-amber-800" },
    { value: "女主", label: "女主", bgColor: "bg-sticky-pink", textColor: "text-pink-800" },
    { value: "反派", label: "反派", bgColor: "bg-red-200", textColor: "text-red-800" },
    { value: "配角", label: "配角", bgColor: "bg-sticky-blue", textColor: "text-blue-800" },
    { value: "导师", label: "导师", bgColor: "bg-sticky-green", textColor: "text-green-800" },
    { value: "其他", label: "其他", bgColor: "bg-gray-200", textColor: "text-gray-700" },
  ];

  return (
    <div className="min-h-screen grid-paper-bg flex flex-col">
      <Header />

      {/* Sub-navigation */}
      <div className="border-b-2 border-dashed border-sketch-text-secondary/30 bg-white/60 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/workspace/${novelId}`}
              className="flex items-center font-patrick text-sketch-text-secondary hover:text-sketch-text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回创作
            </Link>
            <div className="w-px h-6 bg-sketch-text-secondary/30" />
            <h1 className="text-lg font-caveat font-bold text-sketch-text-primary truncate">
              {novel.title} - 角色管理
            </h1>
          </div>
          <Button
            variant="sketch"
            onClick={handleCreate}
            disabled={isCreating || editingCharacter !== null}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            创建角色
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="max-w-7xl mx-auto h-full flex gap-6">
          {/* Left: Character list */}
          <Card variant="sketch" className="w-96 flex-shrink-0 overflow-hidden flex flex-col">
            <div className="mb-4">
              <h2 className="text-lg font-caveat font-bold text-sketch-text-primary mb-2">角色列表</h2>
              <p className="text-xs font-patrick text-sketch-text-muted">共 {characters.length} 个角色</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {characters.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-xl bg-sticky-blue/30 border-2 border-dashed border-sketch-text-secondary/30 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-sketch-text-secondary" />
                  </div>
                  <p className="text-sm font-patrick text-sketch-text-muted">暂无角色</p>
                  <p className="text-xs font-patrick text-sketch-text-muted mt-1">点击右上角创建第一个角色</p>
                </div>
              ) : (
                characters.map((character) => {
                  const roleType = roleTypeOptions.find((r) => r.value === character.role_type);
                  return (
                    <div
                      key={character.id}
                      className={`group p-4 rounded-xl cursor-pointer transition-all border-2 ${
                        editingCharacter?.id === character.id
                          ? "bg-sticky-blue border-sketch-text-primary shadow-sketch"
                          : "bg-white/50 border-dashed border-sketch-text-secondary/30 hover:border-solid hover:border-sketch-text-secondary hover:shadow-sketch-sm"
                      }`}
                      onClick={() => handleEdit(character)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-caveat font-bold text-sketch-text-primary truncate">{character.name}</h3>
                          {roleType && (
                            <span
                              className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-caveat font-bold border ${roleType.bgColor} ${roleType.textColor} border-current/20`}
                            >
                              {roleType.label}
                            </span>
                          )}
                          {character.description && (
                            <p className="text-xs font-patrick text-sketch-text-muted mt-2 line-clamp-2">
                              {character.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(character);
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-sticky-pink/50 transition-all ml-2"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Right: Edit area */}
          <Card variant="sketch" className="flex-1 overflow-hidden flex flex-col">
            {!isCreating && !editingCharacter ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-xl bg-sticky-blue border-2 border-dashed border-sketch-text-secondary/30 flex items-center justify-center mx-auto mb-6 shadow-sketch">
                    <Users className="w-12 h-12 text-sketch-text-primary" />
                  </div>
                  <h3 className="text-xl font-caveat font-bold text-sketch-text-primary mb-2">选择或创建角色</h3>
                  <p className="font-patrick text-sketch-text-secondary mb-6">从左侧选择角色进行编辑，或创建新角色</p>
                  <div className="flex justify-center gap-3">
                    <Button variant="sketch" onClick={handleCreate}>
                      <Plus className="w-5 h-5 mr-2" />
                      手动创建
                    </Button>
                    <div className="relative">
                      <Button
                        ref={aiButtonRef}
                        variant="sketch-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAIMenu(!showAIMenu);
                        }}
                        disabled={isAIGenerating}
                        loading={isAIGenerating}
                      >
                        {!isAIGenerating && <Sparkles className="w-5 h-5 mr-2" />}
                        AI 生成
                      </Button>
                      {showAIMenu && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowAIMenu(false)} />
                          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-50">
                            <Card variant="sketch" className="p-3 shadow-sketch w-[240px]">
                              <p className="text-xs font-patrick text-sketch-text-muted mb-2 px-1">选择角色类型：</p>
                              <div className="grid grid-cols-2 gap-2">
                                {roleTypeOptions.slice(0, 5).map((role) => (
                                  <button
                                    key={role.value}
                                    onClick={() => handleAIGenerate(role.value)}
                                    disabled={isAIGenerating}
                                    className={`px-3 py-2 rounded-lg text-sm font-caveat font-bold border-2 ${role.bgColor} ${role.textColor} border-current/20 hover:opacity-80 active:scale-95 transition-all disabled:opacity-50`}
                                  >
                                    {role.label}
                                  </button>
                                ))}
                              </div>
                            </Card>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-caveat font-bold text-sketch-text-primary">
                    {editingCharacter ? "编辑角色" : "创建角色"}
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="w-8 h-8 rounded-lg border-2 border-dashed border-sketch-text-secondary/30 hover:border-sketch-text-primary hover:bg-sticky-pink/30 flex items-center justify-center transition-all"
                  >
                    <X className="w-5 h-5 text-sketch-text-secondary" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                  {/* Character name */}
                  <div>
                    <label className="block text-sm font-caveat font-bold text-sketch-text-primary mb-2">
                      角色名称 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      variant="sketch"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="输入角色名称"
                    />
                  </div>

                  {/* Role type */}
                  <div>
                    <label className="block text-sm font-caveat font-bold text-sketch-text-primary mb-2">角色类型</label>
                    <div className="flex flex-wrap gap-2">
                      {roleTypeOptions.map((role) => (
                        <button
                          key={role.value}
                          onClick={() => setForm({ ...form, role_type: role.value })}
                          className={`px-4 py-2 rounded-lg text-sm font-caveat font-bold transition-all border-2 ${
                            form.role_type === role.value
                              ? `${role.bgColor} ${role.textColor} border-current shadow-sketch`
                              : "bg-white border-dashed border-sketch-text-secondary/30 text-sketch-text-secondary hover:border-solid hover:border-sketch-text-secondary"
                          }`}
                        >
                          {role.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Character description */}
                  <div>
                    <label className="block text-sm font-caveat font-bold text-sketch-text-primary mb-2">角色描述</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="描述角色的外貌、性格、背景等..."
                      rows={12}
                      className="w-full px-5 py-4 rounded-xl bg-white border-2 border-dashed border-sketch-text-secondary/30 focus:border-solid focus:border-sketch-text-primary focus:ring-2 focus:ring-sticky-yellow/50 transition-all outline-none font-patrick text-sketch-text-primary text-sm leading-relaxed resize-none"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-4 border-t-2 border-dashed border-sketch-text-secondary/20">
                  <Button variant="sketch-secondary" onClick={handleCancel}>
                    取消
                  </Button>
                  <Button variant="sketch" onClick={handleSave} disabled={isSaving} loading={isSaving}>
                    {!isSaving && <Save className="w-4 h-4 mr-2" />}
                    保存
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
