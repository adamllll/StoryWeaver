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

export default function CharactersPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated } = useAuthStore();
  const novelId = Number(params.novelId);

  // 状态
  const [novel, setNovel] = useState<NovelDetail | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const aiButtonRef = useRef<HTMLButtonElement>(null);

  // 表单状态
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
        // 更新现有角色
        const updated = await charactersApi.update(novelId, editingCharacter.id, {
          name: form.name,
          role_type: form.role_type || undefined,
          description: form.description || undefined,
        });
        setCharacters(characters.map(c => c.id === updated.id ? updated : c));
        toast({ title: "角色已更新" });
      } else {
        // 创建新角色
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
      setCharacters(characters.filter(c => c.id !== character.id));
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

    setShowAIMenu(false); // 关闭菜单
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
      <div className="min-h-screen flex items-center justify-center bg-ios-bg">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ios-bg">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">小说不存在</h2>
          <Link href="/workspace" className="btn-primary mt-4 inline-flex">
            返回创作中心
          </Link>
        </div>
      </div>
    );
  }

  const roleTypeOptions: Array<{ value: Character["role_type"]; label: string; color: string }> = [
    { value: "主角", label: "主角", color: "bg-purple-100 text-purple-700" },
    { value: "女主", label: "女主", color: "bg-pink-100 text-pink-700" },
    { value: "反派", label: "反派", color: "bg-red-100 text-red-700" },
    { value: "配角", label: "配角", color: "bg-blue-100 text-blue-700" },
    { value: "导师", label: "导师", color: "bg-green-100 text-green-700" },
    { value: "其他", label: "其他", color: "bg-gray-100 text-gray-700" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-ios-bg">
      {/* 顶部导航栏 */}
      <header className="flex-shrink-0 backdrop-blur-3xl bg-white/70 border-b border-white/60" style={{ boxShadow: '0 0 0 1px rgba(156, 163, 175, 0.2), 0 4px 12px -2px rgba(0, 0, 0, 0.05)' }}>
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Link
              href={`/workspace/${novelId}`}
              className="flex items-center text-gray-500 hover:text-purple-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回创作
            </Link>
            <div className="w-px h-6 bg-gray-200" />
            <h1 className="text-lg font-bold truncate">{novel.title} - 角色管理</h1>
          </div>
          <button
            onClick={handleCreate}
            disabled={isCreating || editingCharacter !== null}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            创建角色
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="max-w-7xl mx-auto h-full flex gap-6">
          {/* 左侧：角色列表 */}
          <div className="w-96 flex-shrink-0 glass rounded-ios-2xl p-6 overflow-hidden flex flex-col">
            <div className="mb-4">
              <h2 className="text-lg font-bold mb-2">角色列表</h2>
              <p className="text-xs text-gray-400">共 {characters.length} 个角色</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {characters.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">暂无角色</p>
                  <p className="text-xs text-gray-400 mt-1">点击右上角创建第一个角色</p>
                </div>
              ) : (
                characters.map((character) => {
                  const roleType = roleTypeOptions.find(r => r.value === character.role_type);
                  return (
                    <div
                      key={character.id}
                      className={`group p-4 rounded-ios-lg cursor-pointer transition-all ${
                        editingCharacter?.id === character.id
                          ? "bg-purple-100 ring-2 ring-purple-400"
                          : "hover:bg-gray-100/60"
                      }`}
                      onClick={() => handleEdit(character)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{character.name}</h3>
                          {roleType && (
                            <span className={`inline-block mt-2 px-2 py-0.5 rounded-md text-xs ${roleType.color}`}>
                              {roleType.label}
                            </span>
                          )}
                          {character.description && (
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                              {character.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(character);
                          }}
                          className="w-8 h-8 rounded-ios-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all ml-2"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 右侧：编辑区域 */}
          <div className="flex-1 glass rounded-ios-2xl p-6 overflow-hidden flex flex-col">
            {!isCreating && !editingCharacter ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-500 mb-2">选择或创建角色</h3>
                  <p className="text-gray-400 mb-6">从左侧选择角色进行编辑，或创建新角色</p>
                  <div className="flex justify-center gap-3">
                    <button onClick={handleCreate} className="btn-primary">
                      <Plus className="w-5 h-5 mr-2" />
                      手动创建
                    </button>
                    <div className="relative">
                      <button
                        ref={aiButtonRef}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAIMenu(!showAIMenu);
                        }}
                        disabled={isAIGenerating}
                        className="btn-secondary disabled:opacity-50"
                      >
                        {isAIGenerating ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-5 h-5 mr-2" />
                        )}
                        AI 生成
                      </button>
                      {showAIMenu && (
                        <>
                          {/* 遮罩层 - 点击关闭 */}
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowAIMenu(false)}
                          />
                          {/* 菜单内容 */}
                          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-50">
                            <div className="glass rounded-ios-lg p-3 shadow-lg w-[240px]">
                              <p className="text-xs text-gray-500 mb-2 px-1">选择角色类型：</p>
                              <div className="grid grid-cols-2 gap-2">
                                {roleTypeOptions.slice(0, 5).map((role) => (
                                  <button
                                    key={role.value}
                                    onClick={() => handleAIGenerate(role.value)}
                                    disabled={isAIGenerating}
                                    className={`px-3 py-2 rounded-ios-md text-sm font-medium ${role.color} hover:opacity-80 active:scale-95 transition-all disabled:opacity-50`}
                                  >
                                    {role.label}
                                  </button>
                                ))}
                              </div>
                            </div>
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
                  <h2 className="text-xl font-bold">
                    {editingCharacter ? "编辑角色" : "创建角色"}
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="w-8 h-8 rounded-ios-md hover:bg-gray-100 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                  {/* 角色名称 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      角色名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="输入角色名称"
                      className="input-inset w-full py-2.5"
                    />
                  </div>

                  {/* 角色类型 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">角色类型</label>
                    <div className="flex flex-wrap gap-2">
                      {roleTypeOptions.map((role) => (
                        <button
                          key={role.value}
                          onClick={() => setForm({ ...form, role_type: role.value })}
                          className={`px-4 py-2 rounded-ios-lg text-sm font-medium transition-all ${
                            form.role_type === role.value
                              ? `${role.color} ring-2 ring-offset-2`
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {role.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 角色描述 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">角色描述</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="描述角色的外貌、性格、背景等..."
                      rows={12}
                      className="input-inset w-full py-2.5 font-serif resize-none"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={handleCancel} className="btn-secondary px-6 py-2.5">
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary px-6 py-2.5 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    保存
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
