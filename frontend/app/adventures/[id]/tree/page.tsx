"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adventureApi, AdventureTreeResponse } from "@/lib/api";
import { Adventure } from "@/lib/adventure-types";
import { AdventureBranchTree } from "@/components/adventure/AdventureBranchTree";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  GitFork,
  LineChart,
  Globe2,
  Map,
  Loader2,
  BookOpen,
  Users,
  Sparkles,
} from "lucide-react";

export default function AdventureTreePage() {
  const params = useParams();
  const { toast } = useToast();
  const adventureId = Number(params.id);

  const [activeTab, setActiveTab] = useState<"mindmap" | "stats" | "world">("mindmap");
  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [treeResponse, setTreeResponse] = useState<AdventureTreeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!adventureId) return;
    setIsLoading(true);
    Promise.all([
      adventureApi.get(adventureId),
      adventureApi.getTree(adventureId),
    ])
      .then(([adventureData, treeData]) => {
        setAdventure(adventureData);
        setTreeResponse(treeData);
      })
      .catch((error) => {
        console.error("Failed to load adventure tree", error);
        toast({
          title: "加载失败",
          description: "无法获取分支树数据",
          variant: "destructive",
        });
      })
      .finally(() => setIsLoading(false));
  }, [adventureId, toast]);

  const treeStats = useMemo(() => {
    if (!treeResponse?.tree) return null;
    const stats = {
      totalAdventures: 0,
      totalNodes: 0,
      totalWords: 0,
      finishedCount: 0,
      maxDepth: 0,
    };

    const walk = (node: AdventureTreeResponse["tree"], depth: number) => {
      stats.totalAdventures += 1;
      stats.totalNodes += node.total_nodes;
      stats.totalWords += node.total_words;
      if (node.is_finished) stats.finishedCount += 1;
      stats.maxDepth = Math.max(stats.maxDepth, depth);
      node.children?.forEach((child) => walk(child, depth + 1));
    };

    walk(treeResponse.tree, 1);
    return stats;
  }, [treeResponse]);

  const playerState = adventure?.player_state;
  const storyEvents = playerState?.故事事件 ?? [];
  const relationships = playerState?.关系网 ?? {};
  const relationshipList = Object.values(relationships);
  const inventory = playerState?.物品 ?? [];
  const attributes = playerState?.关键属性 ?? {};

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ios-bg">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">正在装载分支树...</span>
        </div>
      </div>
    );
  }

  if (!adventure || !treeResponse?.tree) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ios-bg">
        <div className="text-center text-gray-500">
          <p>无法加载分支树内容</p>
          <Link href="/adventures">
            <Button variant="outline" className="mt-4">
              返回列表
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-bg">
      <header className="sticky top-0 z-40 border-b border-white/40 bg-white/70 backdrop-blur-xl">
        <div className="container py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/adventures">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <GitFork className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{adventure.title}</h1>
                <p className="text-xs text-gray-500">分支树 · {adventure.category}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/adventures/${adventure.id}/play`}>
              <Button variant="outline" size="sm">
                返回冒险
              </Button>
            </Link>
            {adventure.is_finished && (
              <Link href={`/adventures/${adventure.id}/novel`}>
                <Button size="sm" className="bg-gray-900 text-white">
                  阅读小说
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList className="bg-white/70 border border-white/60 rounded-full px-2">
            <TabsTrigger value="mindmap" className="rounded-full px-4">
              <Map className="w-4 h-4 mr-2" /> 脑图
            </TabsTrigger>
            <TabsTrigger value="stats" className="rounded-full px-4">
              <LineChart className="w-4 h-4 mr-2" /> 统计
            </TabsTrigger>
            <TabsTrigger value="world" className="rounded-full px-4">
              <Globe2 className="w-4 h-4 mr-2" /> 世界观
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "mindmap" && (
          <Card className="p-6 bg-white/80 border-white/60 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">分支脑图</h2>
                <p className="text-sm text-gray-500">展示所有冒险分叉路径</p>
              </div>
              <Badge variant="outline" className="text-xs">
                共 {treeStats?.totalAdventures ?? 1} 条冒险线
              </Badge>
            </div>
            <AdventureBranchTree tree={treeResponse.tree} />
          </Card>
        )}

        {activeTab === "stats" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5 bg-white/80 border-white/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <GitFork className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">总分叉数</p>
                  <p className="text-xl font-bold text-gray-900">{treeResponse.total_forks}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white/80 border-white/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">累计章节</p>
                  <p className="text-xl font-bold text-gray-900">{treeStats?.totalNodes ?? adventure.total_nodes}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white/80 border-white/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">累计字数</p>
                  <p className="text-xl font-bold text-gray-900">{(treeStats?.totalWords ?? adventure.total_words).toLocaleString()}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white/80 border-white/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">完成线路</p>
                  <p className="text-xl font-bold text-gray-900">{treeStats?.finishedCount ?? (adventure.is_finished ? 1 : 0)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 bg-white/80 border-white/60 md:col-span-2 lg:col-span-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">分支纵深</h3>
                  <p className="text-xs text-gray-500">最大深度 {treeStats?.maxDepth ?? 1} 层</p>
                </div>
                <Badge variant="outline">分支路线 {treeStats?.totalAdventures ?? 1} 条</Badge>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "world" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6 bg-white/80 border-white/60">
              <h3 className="text-base font-bold text-gray-900 mb-4">冒险设定</h3>
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <div className="text-xs text-gray-400 mb-1">类型</div>
                  <Badge variant="outline" className="text-xs">{adventure.category}</Badge>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-2">关键词</div>
                  <div className="flex flex-wrap gap-2">
                    {adventure.keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">主角</div>
                  <div className="font-semibold text-gray-900">{adventure.protagonist_name}</div>
                  {adventure.protagonist_personality && (
                    <div className="text-xs text-gray-500 mt-1">{adventure.protagonist_personality}</div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/80 border-white/60">
              <h3 className="text-base font-bold text-gray-900 mb-4">世界轨迹</h3>
              <ScrollArea className="h-48 pr-2">
                {storyEvents.length > 0 ? (
                  <div className="space-y-2">
                    {storyEvents.map((event, index) => (
                      <div key={`${event}-${index}`} className="text-sm text-gray-600 bg-gray-50/70 border border-gray-100 rounded-lg px-3 py-2">
                        {event}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">暂无事件记录</p>
                )}
              </ScrollArea>
            </Card>

            <Card className="p-6 bg-white/80 border-white/60">
              <h3 className="text-base font-bold text-gray-900 mb-4">关系网</h3>
              <ScrollArea className="h-56 pr-2">
                {relationshipList.length > 0 ? (
                  <div className="space-y-3">
                    {relationshipList.map((relation) => (
                      <div key={relation.name} className="border border-gray-100 rounded-xl p-3 bg-gray-50/80">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">{relation.name}</span>
                          <Badge variant="outline" className="text-xs">好感 {relation.favor}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{relation.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">暂无关系记录</p>
                )}
              </ScrollArea>
            </Card>

            <Card className="p-6 bg-white/80 border-white/60">
              <h3 className="text-base font-bold text-gray-900 mb-4">关键属性与物品</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(attributes).map(([key, value]) => (
                    <div key={key} className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2">
                      <div className="text-xs text-gray-400">{key}</div>
                      <div className="text-sm font-semibold text-gray-900">{value}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-2">物品</div>
                  {inventory.length > 0 ? (
                    <div className="space-y-2">
                      {inventory.map((item) => (
                        <div key={item.name} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2 text-sm">
                          <span className="text-gray-700">{item.name}</span>
                          <span className="text-xs text-gray-400">x{item.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">暂无物品</p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
