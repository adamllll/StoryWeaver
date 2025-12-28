"use client";

import { useEffect, useState } from "react";
import { adminApi, EnvConfigItem } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Edit2, Save, Key as KeyIcon, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const [items, setItems] = useState<EnvConfigItem[]>([]);
  const [envPath, setEnvPath] = useState("");
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<EnvConfigItem | null>(null);
  const [newValue, setNewValue] = useState("");
  const { toast } = useToast();

  const fetchEnv = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getEnv();
      setItems(response.items);
      setEnvPath(response.env_file_path);
    } catch (error) {
      toast({
        title: "获取配置失败",
        description: "请检查您的权限",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnv();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdate = async () => {
    if (!editItem) return;
    try {
      await adminApi.updateEnv(editItem.key, newValue);
      toast({
        title: "配置已更新",
        description: `${editItem.key} 已成功修改`,
      });
      setEditItem(null);
      setNewValue("");
      fetchEnv(); 
    } catch (error) {
      toast({
        title: "更新失败",
        description: "可能是服务器拒绝了修改请求",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">系统设置</h2>
        <p className="text-sm text-gray-500">管理应用程序的环境变量和系统配置</p>
      </div>

      <Card className="border-gray-200 bg-white/60 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-gray-400" />
            <CardTitle>环境变量</CardTitle>
          </div>
          <CardDescription>
            配置文件路径：<span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">{envPath}</span>
            <br />
            <span className="text-amber-600 text-xs">注意：修改某些配置可能需要重启后端服务才能生效。</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-500">加载配置中...</div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">没有可配置的项目</div>
            ) : (
              items.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-white/50 p-4 transition-colors hover:bg-white/80 group"
                >
                  <div className="flex flex-col gap-1 min-w-0 flex-1 mr-4">
                    <div className="flex items-center gap-2">
                      <KeyIcon className="h-3 w-3 text-gray-400 shrink-0" />
                      <span className="font-mono text-sm font-medium text-gray-700 truncate" title={item.key}>
                        {item.key}
                      </span>
                      {item.is_secret && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-amber-50 text-amber-600 border-amber-100">
                          敏感
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500 truncate">{item.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="hidden md:block font-mono text-xs text-gray-400 max-w-[200px] truncate bg-gray-50 px-2 py-1 rounded">
                      {item.value || <span className="text-gray-300 italic">未设置</span>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditItem(item);
                        setNewValue(item.is_secret ? "" : item.value); // 敏感信息不预填原值，除非你要解密
                      }}
                      className="shrink-0"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span className="sr-only">编辑</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改配置项</DialogTitle>
            <DialogDescription>
              正在修改 <strong>{editItem?.key}</strong>。
              <p className="mt-1 text-xs text-gray-500">{editItem?.description}</p>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="value">配置值</Label>
              <Input
                id="value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={editItem?.is_secret ? "输入新值以覆盖..." : "输入配置值..."}
                type={editItem?.is_secret ? "password" : "text"}
              />
              {editItem?.is_secret && (
                <p className="text-xs text-amber-600">
                  此为敏感配置，输入框将隐藏内容。
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>
              取消
            </Button>
            <Button onClick={handleUpdate}>
              <Save className="mr-2 h-4 w-4" />
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}