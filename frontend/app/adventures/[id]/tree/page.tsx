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
      <div className="min-h-screen flex items-center justify-center grid-paper-bg">
        <div className="flex flex-col items-center gap-3 text-sketch-text-secondary font-patrick">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">正在装载分支树...</span>
        </div>
      </div>
    );
  }

  if (!adventure || !treeResponse?.tree) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-paper-bg">
        <div className="text-center text-sketch-text-secondary font-patrick">
          <p>无法加载分支树内容</p>
          <Link href="/adventures">
            <Button variant="sketch-secondary" className="mt-4">
              返回列表
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-paper-bg">
      {/* Header - Sketch style */}
      <header className="sticky top-0 z-40 border-b-2 border-dashed border-sketch-text-secondary/30 bg-white/95">
        <div className="container py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/adventures">
              <Button variant="sketch-ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sticky-pink border-2 border-dashed border-sketch-text-secondary/30 flex items-center justify-center">
                <GitFork className="w-5 h-5 text-sketch-text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-caveat font-bold text-sketch-text-primary">{adventure.title}</h1>
                <p className="text-xs text-sketch-text-secondary font-patrick">分支树 · {adventure.category}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/adventures/${adventure.id}/play`}>
              <Button variant="sketch-secondary" size="sm">
                返回冒险
              </Button>
            </Link>
            {adventure.is_finished && (
              <Link href={`/adventures/${adventure.id}/novel`}>
                <Button variant="sketch" size="sm">
                  阅读小说
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {/* Tabs - Sketch style */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList variant="sketch">
            <TabsTrigger variant="sketch" value="mindmap">
              <Map className="w-4 h-4 mr-2" /> 脑图
            </TabsTrigger>
            <TabsTrigger variant="sketch" value="stats">
              <LineChart className="w-4 h-4 mr-2" /> 统计
            </TabsTrigger>
            <TabsTrigger variant="sketch" value="world">
              <Globe2 className="w-4 h-4 mr-2" /> 世界观
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "mindmap" && (
          <Card variant="sketch" className="p-0">
            <div className="flex items-center justify-between p-6 border-b-2 border-dashed border-sketch-text-secondary/20">
              <div>
                <h2 className="text-lg font-caveat font-bold text-sketch-text-primary">分支脑图</h2>
                <p className="text-sm text-sketch-text-secondary font-patrick">展示所有冒险分叉路径</p>
              </div>
              <Badge variant="sticky-pink" className="text-xs">
                共 {treeStats?.totalAdventures ?? 1} 条冒险线
              </Badge>
            </div>
            <div className="p-6">
              <AdventureBranchTree tree={treeResponse.tree} />
            </div>
          </Card>
        )}

        {activeTab === "stats" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card variant="sticky-pink" rotationId="stats-forks">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/50 border-2 border-dashed border-sketch-text-secondary/20 flex items-center justify-center">
                  <GitFork className="w-5 h-5 text-sketch-text-primary" />
                </div>
                <div>
                  <p className="text-xs text-sketch-text-secondary font-patrick">总分叉数</p>
                  <p className="text-xl font-caveat font-bold text-sketch-text-primary">{treeResponse.total_forks}</p>
                </div>
              </div>
            </Card>
            <Card variant="sticky-blue" rotationId="stats-nodes">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/50 border-2 border-dashed border-sketch-text-secondary/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-sketch-text-primary" />
                </div>
                <div>
                  <p className="text-xs text-sketch-text-secondary font-patrick">累计章节</p>
                  <p className="text-xl font-caveat font-bold text-sketch-text-primary">{treeStats?.totalNodes ?? adventure.total_nodes}</p>
                </div>
              </div>
            </Card>
            <Card variant="sticky-green" rotationId="stats-words">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/50 border-2 border-dashed border-sketch-text-secondary/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-sketch-text-primary" />
                </div>
                <div>
                  <p className="text-xs text-sketch-text-secondary font-patrick">累计字数</p>
                  <p className="text-xl font-caveat font-bold text-sketch-text-primary">{(treeStats?.totalWords ?? adventure.total_words).toLocaleString()}</p>
                </div>
              </div>
            </Card>
            <Card variant="sticky-yellow" rotationId="stats-finished">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/50 border-2 border-dashed border-sketch-text-secondary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-sketch-text-primary" />
                </div>
                <div>
                  <p className="text-xs text-sketch-text-secondary font-patrick">完成线路</p>
                  <p className="text-xl font-caveat font-bold text-sketch-text-primary">{treeStats?.finishedCount ?? (adventure.is_finished ? 1 : 0)}</p>
                </div>
              </div>
            </Card>
            <Card variant="sketch" className="md:col-span-2 lg:col-span-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-caveat font-semibold text-sketch-text-primary">分支纵深</h3>
                  <p className="text-xs text-sketch-text-secondary font-patrick">最大深度 {treeStats?.maxDepth ?? 1} 层</p>
                </div>
                <Badge variant="sticky-pink">分支路线 {treeStats?.totalAdventures ?? 1} 条</Badge>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "world" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card variant="sticky-yellow" rotationId="world-settings">
              <h3 className="text-base font-caveat font-bold text-sketch-text-primary mb-4">冒险设定</h3>
              <div className="space-y-4 text-sm text-sketch-text-secondary font-patrick">
                <div>
                  <div className="text-xs text-sketch-text-muted mb-1">类型</div>
                  <Badge variant="sticky-pink" className="text-xs">{adventure.category}</Badge>
                </div>
                <div>
                  <div className="text-xs text-sketch-text-muted mb-2">关键词</div>
                  <div className="flex flex-wrap gap-2">
                    {adventure.keywords.map((keyword) => (
                      <Badge key={keyword} variant="sticky-blue" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-sketch-text-muted mb-1">主角</div>
                  <div className="font-semibold text-sketch-text-primary">{adventure.protagonist_name}</div>
                  {adventure.protagonist_personality && (
                    <div className="text-xs text-sketch-text-secondary mt-1">{adventure.protagonist_personality}</div>
                  )}
                </div>
              </div>
            </Card>

            <Card variant="sticky-blue" rotationId="world-events">
              <h3 className="text-base font-caveat font-bold text-sketch-text-primary mb-4">世界轨迹</h3>
              <ScrollArea className="h-48 pr-2">
                {storyEvents.length > 0 ? (
                  <div className="space-y-2">
                    {storyEvents.map((event, index) => (
                      <div key={`${event}-${index}`} className="text-sm text-sketch-text-secondary font-patrick bg-white/50 border-2 border-dashed border-sketch-text-secondary/20 rounded-lg px-3 py-2">
                        {event}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-sketch-text-muted font-patrick">暂无事件记录</p>
                )}
              </ScrollArea>
            </Card>

            <Card variant="sticky-pink" rotationId="world-relations">
              <h3 className="text-base font-caveat font-bold text-sketch-text-primary mb-4">关系网</h3>
              <ScrollArea className="h-56 pr-2">
                {relationshipList.length > 0 ? (
                  <div className="space-y-3">
                    {relationshipList.map((relation) => (
                      <div key={relation.name} className="border-2 border-dashed border-sketch-text-secondary/20 rounded-xl p-3 bg-white/50">
                        <div className="flex items-center justify-between">
                          <span className="font-patrick font-semibold text-sketch-text-primary">{relation.name}</span>
                          <Badge variant="sticky-yellow" className="text-xs">好感 {relation.favor}</Badge>
                        </div>
                        <p className="text-xs text-sketch-text-secondary font-patrick mt-2">{relation.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-sketch-text-muted font-patrick">暂无关系记录</p>
                )}
              </ScrollArea>
            </Card>

            <Card variant="sticky-green" rotationId="world-items">
              <h3 className="text-base font-caveat font-bold text-sketch-text-primary mb-4">关键属性与物品</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(attributes).map(([key, value]) => (
                    <div key={key} className="rounded-lg border-2 border-dashed border-sketch-text-secondary/20 bg-white/50 px-3 py-2">
                      <div className="text-xs text-sketch-text-muted font-patrick">{key}</div>
                      <div className="text-sm font-patrick font-semibold text-sketch-text-primary">{value}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-xs text-sketch-text-muted font-patrick mb-2">物品</div>
                  {inventory.length > 0 ? (
                    <div className="space-y-2">
                      {inventory.map((item) => (
                        <div key={item.name} className="flex items-center justify-between rounded-lg border-2 border-dashed border-sketch-text-secondary/20 bg-white/50 px-3 py-2 text-sm font-patrick">
                          <span className="text-sketch-text-primary">{item.name}</span>
                          <span className="text-xs text-sketch-text-muted">x{item.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-sketch-text-muted font-patrick">暂无物品</p>
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
