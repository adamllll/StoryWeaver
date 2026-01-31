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
        <h2 className="text-2xl font-caveat font-bold tracking-tight text-sketch-text-primary">系统设置</h2>
        <p className="text-sm font-patrick text-sketch-text-secondary">管理应用程序的环境变量和系统配置</p>
      </div>

      <Card className="border-2 border-dashed border-sketch-text-secondary/20 bg-white shadow-sketch">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-sketch-text-muted" />
            <CardTitle className="font-caveat text-sketch-text-primary">环境变量</CardTitle>
          </div>
          <CardDescription className="font-patrick">
            配置文件路径：<span className="font-mono text-xs bg-sticky-yellow-light px-1 py-0.5 rounded border border-dashed border-sketch-text-secondary/20">{envPath}</span>
            <br />
            <span className="text-sticky-pink text-xs">注意：修改某些配置可能需要重启后端服务才能生效。</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-sketch-text-secondary font-patrick">加载配置中...</div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-sketch-text-secondary font-patrick">没有可配置的项目</div>
            ) : (
              items.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-xl border-2 border-dashed border-sketch-text-secondary/20 bg-sticky-blue-light/20 p-4 transition-colors hover:bg-sticky-blue-light/40 group"
                >
                  <div className="flex flex-col gap-1 min-w-0 flex-1 mr-4">
                    <div className="flex items-center gap-2">
                      <KeyIcon className="h-3 w-3 text-sketch-text-muted shrink-0" />
                      <span className="font-mono text-sm font-patrick font-medium text-sketch-text-primary truncate" title={item.key}>
                        {item.key}
                      </span>
                      {item.is_secret && (
                        <Badge variant="sticky-yellow" className="text-[10px] h-4 px-1">
                          敏感
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-sketch-text-secondary font-patrick truncate">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden md:block font-mono text-xs text-sketch-text-muted max-w-[200px] truncate bg-white px-2 py-1 rounded-lg border border-dashed border-sketch-text-secondary/20">
                      {item.value || <span className="text-sketch-text-muted italic">未设置</span>}
                    </div>
                    <Button
                      variant="sketch-ghost"
                      size="sm"
                      onClick={() => {
                        setEditItem(item);
                        setNewValue(item.is_secret ? "" : item.value);
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
            <DialogTitle className="font-caveat text-sketch-text-primary">修改配置项</DialogTitle>
            <DialogDescription className="font-patrick">
              正在修改 <strong>{editItem?.key}</strong>。
              <p className="mt-1 text-xs text-sketch-text-secondary">{editItem?.description}</p>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="value" className="font-patrick">配置值</Label>
              <Input
                id="value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={editItem?.is_secret ? "输入新值以覆盖..." : "输入配置值..."}
                type={editItem?.is_secret ? "password" : "text"}
                variant="sketch"
              />
              {editItem?.is_secret && (
                <p className="text-xs text-sticky-pink font-patrick">
                  此为敏感配置，输入框将隐藏内容。
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="sketch-secondary" onClick={() => setEditItem(null)}>
              取消
            </Button>
            <Button variant="sketch" onClick={handleUpdate}>
              <Save className="mr-2 h-4 w-4" />
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}