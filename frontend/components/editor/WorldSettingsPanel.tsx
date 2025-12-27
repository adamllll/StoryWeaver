/**
 * 世界观设定管理面板
 * 让笨蛋们可以管理小说的世界观设定～
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Save, X, Globe } from "lucide-react";
import { worldSettingsApi, WorldSetting, WorldSettingType, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface WorldSettingsPanelProps {
  novelId: number;
}

const SETTING_TYPES: WorldSettingType[] = ["地理", "力量体系", "势力分布", "历史背景", "文化习俗", "其他"];

export function WorldSettingsPanel({ novelId }: WorldSettingsPanelProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<WorldSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState<{
    setting_type: WorldSettingType;
    name: string;
    description: string;
  }>({
    setting_type: "其他",
    name: "",
    description: "",
  });

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await worldSettingsApi.list(novelId);
      setSettings(data.world_settings);
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "加载失败",
          description: error.detail,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [novelId, toast]);

  // 加载世界观设定
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // 创建新设定
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "请填写必填项",
        description: "设定名称不能为空",
        variant: "destructive",
      });
      return;
    }

    try {
      const newSetting = await worldSettingsApi.create(novelId, formData);
      setSettings([...settings, newSetting]);
      setFormData({ setting_type: "其他", name: "", description: "" });
      setIsCreating(false);
      toast({ title: "创建成功", description: "世界观设定已添加" });
    } catch (error) {
      if (error instanceof ApiError) {
        toast({ title: "创建失败", description: error.detail, variant: "destructive" });
      }
    }
  };

  // 更新设定
  const handleUpdate = async (id: number) => {
    if (!formData.name.trim()) {
      toast({
        title: "请填写必填项",
        description: "设定名称不能为空",
        variant: "destructive",
      });
      return;
    }

    try {
      const updated = await worldSettingsApi.update(novelId, id, formData);
      setSettings(settings.map((s) => (s.id === id ? updated : s)));
      setEditingId(null);
      setFormData({ setting_type: "其他", name: "", description: "" });
      toast({ title: "更新成功" });
    } catch (error) {
      if (error instanceof ApiError) {
        toast({ title: "更新失败", description: error.detail, variant: "destructive" });
      }
    }
  };

  // 删除设定
  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个世界观设定吗？")) return;

    try {
      await worldSettingsApi.delete(novelId, id);
      setSettings(settings.filter((s) => s.id !== id));
      toast({ title: "删除成功" });
    } catch (error) {
      if (error instanceof ApiError) {
        toast({ title: "删除失败", description: error.detail, variant: "destructive" });
      }
    }
  };

  // 开始编辑
  const startEdit = (setting: WorldSetting) => {
    setEditingId(setting.id);
    setFormData({
      setting_type: setting.setting_type,
      name: setting.name,
      description: setting.description || "",
    });
    setIsCreating(false);
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ setting_type: "其他", name: "", description: "" });
  };

  // 开始创建
  const startCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({ setting_type: "其他", name: "", description: "" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 标题和新建按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">世界观设定</h3>
        </div>
        {!isCreating && !editingId && (
          <Button onClick={startCreate} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> 新建设定
          </Button>
        )}
      </div>

      {/* 创建/编辑表单 */}
      {(isCreating || editingId !== null) && (
        <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-950/20 space-y-4">
          <div>
            <Label htmlFor="setting_type">设定类型 *</Label>
            <Select
              value={formData.setting_type}
              onValueChange={(value) => setFormData({ ...formData, setting_type: value as WorldSettingType })}
            >
              <SelectTrigger id="setting_type">
                <SelectValue placeholder="选择设定类型" />
              </SelectTrigger>
              <SelectContent>
                {SETTING_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="name">设定名称 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="如：东玄大陆、九重天塔、天元宗..."
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="description">设定描述（可选）</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="详细描述这个设定的内容..."
              className="h-32 resize-none"
              maxLength={5000}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={cancelEdit} size="sm" className="gap-2">
              <X className="h-4 w-4" /> 取消
            </Button>
            <Button
              onClick={() => (editingId ? handleUpdate(editingId) : handleCreate())}
              size="sm"
              className="gap-2"
            >
              <Save className="h-4 w-4" /> {editingId ? "保存" : "创建"}
            </Button>
          </div>
        </div>
      )}

      {/* 设定列表 */}
      {settings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>还没有世界观设定</p>
          <p className="text-sm mt-1">点击"新建设定"开始添加吧～</p>
        </div>
      ) : (
        <div className="space-y-3">
          {settings.map((setting) => (
            <div
              key={setting.id}
              className={cn(
                "border rounded-lg p-4 transition-colors",
                editingId === setting.id
                  ? "bg-purple-50 dark:bg-purple-950/20 border-purple-300"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                      {setting.setting_type}
                    </span>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {setting.name}
                    </h4>
                  </div>
                  {setting.description && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                      {setting.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    创建于 {new Date(setting.created_at).toLocaleDateString()}
                  </p>
                </div>

                {editingId !== setting.id && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(setting)}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(setting.id)}
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
