"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
  Plus,
  Clock,
  MapPin,
  ChevronRight,
  Trophy,
  ScrollText,
  Sword,
  Search,
  Home,
  Trash2,
  Compass,
  GitFork,
  BookOpen,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SkeletonSketchGrid } from "@/components/ui/skeleton-sketch";
import { adventureApi } from "@/lib/api";
import { Adventure } from "@/lib/adventure-types";
import { useAuthStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

export default function AdventuresPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { toast } = useToast();

  // 主Tab：我的冒险 / 探索社区
  const initialMainTab = searchParams.get('tab') === 'explore' ? 'explore' : 'mine';
  const [mainTab, setMainTab] = useState<"mine" | "explore">(initialMainTab);

  // 子Tab：进行中 / 已完结（仅在"我的冒险"中使用）
  const [subTab, setSubTab] = useState<"ongoing" | "finished">("ongoing");

  // 数据状态
  const [myAdventures, setMyAdventures] = useState<Adventure[]>([]);
  const [communityAdventures, setCommunityAdventures] = useState<Adventure[]>([]);
  const [isLoadingMine, setIsLoadingMine] = useState(true);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);

  // UI状态
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isForking, setIsForking] = useState<number | null>(null);

  // 更新URL参数
  const handleMainTabChange = (value: string) => {
    setMainTab(value as "mine" | "explore");
    const url = value === 'explore' ? '/adventures?tab=explore' : '/adventures';
    router.replace(url, { scroll: false });
  };

  // 加载我的冒险
  useEffect(() => {
    checkAuth();

    const loadMyAdventures = async () => {
      try {
        setIsLoadingMine(true);
        const adventureList = await adventureApi.list({ page: 1, page_size: 100 });
        setMyAdventures(Array.isArray(adventureList) ? adventureList : []);
      } catch (error) {
        console.error("Failed to load my adventures", error);
        toast({
          title: "加载失败",
          description: "无法获取您的冒险记录",
          variant: "destructive",
        });
      } finally {
        setIsLoadingMine(false);
      }
    };

    if (isAuthenticated) {
      loadMyAdventures();
    }
  }, [isAuthenticated, checkAuth, toast]);

  // 加载社区冒险（仅在切换到explore tab时）
  useEffect(() => {
    if (mainTab !== 'explore' || communityAdventures.length > 0) return;

    const loadCommunityAdventures = async () => {
      try {
        setIsLoadingCommunity(true);
        const adventures = await adventureApi.explore({ limit: 100 });
        setCommunityAdventures(adventures);
      } catch (error) {
        console.error("Failed to load community adventures", error);
        toast({
          title: "加载失败",
          description: "无法获取社区冒险",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCommunity(false);
      }
    };

    loadCommunityAdventures();
  }, [mainTab, communityAdventures.length, toast]);

  // 删除冒险
  const handleDelete = async (e: React.MouseEvent, id: number, title: string) => {
    e.preventDefault();

    if (!window.confirm(`确定要删除冒险 "${title}" 吗？此操作无法撤销。`)) {
      return;
    }

    try {
      setIsDeleting(id);
      await adventureApi.delete(id);
      setMyAdventures(prev => prev.filter(a => a.id !== id));
      toast({
        title: "删除成功",
        description: `冒险 "${title}" 已被删除`,
      });
    } catch (error) {
      console.error("Failed to delete adventure", error);
      toast({
        title: "删除失败",
        description: "无法删除该冒险，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleFork = async (adventureId: number) => {
    if (isForking) return;
    try {
      setIsForking(adventureId);
      const forkInfo = await adventureApi.getForkPoints(adventureId);
      const forkPoints = forkInfo.fork_points ?? [];
      const preferredPoint = [...forkPoints].reverse().find((point) => point.has_choices)
        ?? forkPoints[forkPoints.length - 1];

      if (!preferredPoint) {
        throw new Error("没有可分叉的章节节点");
      }

      const forked = await adventureApi.fork(adventureId, { fork_from_node_id: preferredPoint.node_id });
      toast({
        title: "分叉成功",
        description: `已从第 ${preferredPoint.chapter_num} 章创建新冒险`,
      });
      router.push(`/adventures/${forked.id}/play`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "分叉失败，请稍后重试";
      toast({
        title: "分叉失败",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsForking(null);
    }
  };

  // 筛选我的冒险
  const filteredMyAdventures = myAdventures.filter(adv => {
    const matchesTab = subTab === "ongoing" ? !adv.is_finished : adv.is_finished;
    const matchesSearch = adv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          adv.keywords.some(k => k.includes(searchQuery));
    return matchesTab && matchesSearch;
  });

  // 筛选社区冒险
  const filteredCommunityAdventures = communityAdventures.filter(adv => {
    return adv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           adv.keywords.some(k => k.includes(searchQuery));
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  // Loading skeleton component using sketch style
  const LoadingSkeleton = () => <SkeletonSketchGrid count={6} />;

  // Empty state component with sketch style
  const EmptyState = ({ type }: { type: 'mine-ongoing' | 'mine-finished' | 'explore' }) => {
    const config = {
      'mine-ongoing': {
        icon: <Gamepad2 className="w-12 h-12 text-sketch-text-muted" />,
        title: "没有进行中的冒险",
        description: "一切伟大的传奇都始于第一步。现在就开始你的旅程吧！",
        showButton: true
      },
      'mine-finished': {
        icon: <Trophy className="w-12 h-12 text-sketch-text-muted" />,
        title: "还没有完结的故事",
        description: "当一段旅程结束，它便成为了永恒的传说。去创造你的结局吧！",
        showButton: false
      },
      'explore': {
        icon: <Compass className="w-12 h-12 text-sketch-text-muted" />,
        title: "暂无社区冒险",
        description: "成为第一个分享冒险故事的人吧！",
        showButton: true
      }
    };

    const { icon, title, description, showButton } = config[type];

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-32 h-32 bg-sticky-pink-light border-2 border-dashed border-sketch-text-secondary/30 rounded-full flex items-center justify-center mb-6">
          {icon}
        </div>
        <h2 className="text-2xl font-caveat font-bold text-sketch-text-primary mb-2">{title}</h2>
        <p className="text-sketch-text-secondary font-patrick max-w-sm mb-8">{description}</p>
        {showButton && (
          <Link href="/adventures/new">
            <Button variant="sketch" size="lg">
              开启新篇章
            </Button>
          </Link>
        )}
      </motion.div>
    );
  };

  // My adventure card with sticky-pink sketch style
  const MyAdventureCard = ({ adv }: { adv: Adventure }) => (
    <motion.div
      key={adv.id}
      variants={itemVariants}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card variant="sticky-pink" rotationId={String(adv.id)} className="h-full flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1 flex-1 mr-2">
            <Badge variant="sticky-yellow" className="text-[10px] uppercase tracking-wider">
              {adv.category}
            </Badge>
            <h3 className="font-caveat font-bold text-xl text-sketch-text-primary line-clamp-1">
              {adv.title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {adv.is_finished ? (
              adv.final_ending === "happy" ? (
                <Badge variant="sticky-blue" className="text-[10px] shrink-0">
                  圆满结局
                </Badge>
              ) : adv.final_ending === "tragic" ? (
                <Badge variant="sticky-pink" className="text-[10px] shrink-0">
                  悲剧结局
                </Badge>
              ) : adv.final_ending === "game_over" ? (
                <Badge variant="sticky-pink" className="text-[10px] shrink-0">
                  Game Over
                </Badge>
              ) : (
                <Badge variant="outline" className="font-patrick text-[10px] shrink-0">
                  已完结
                </Badge>
              )
            ) : (
              <Badge variant="sticky-green" className="text-[10px] shrink-0">
                进行中
              </Badge>
            )}
            <Button
              variant="sketch-ghost"
              size="icon"
              className="h-8 w-8 text-sketch-text-muted hover:text-red-500 hover:bg-sticky-pink-light shrink-0"
              onClick={(e) => handleDelete(e, adv.id, adv.title)}
              disabled={isDeleting === adv.id}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-white/50 border-2 border-dashed border-sketch-text-secondary/20 flex flex-col gap-1">
            <span className="text-[10px] text-sketch-text-muted uppercase font-patrick flex items-center gap-1">
              <Sword className="w-3 h-3" /> 主角
            </span>
            <span className="text-sm font-patrick font-semibold text-sketch-text-primary truncate">
              {adv.protagonist_name}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-white/50 border-2 border-dashed border-sketch-text-secondary/20 flex flex-col gap-1">
            <span className="text-[10px] text-sketch-text-muted uppercase font-patrick flex items-center gap-1">
              <MapPin className="w-3 h-3" /> 进度
            </span>
            <span className="text-sm font-patrick font-semibold text-sketch-text-primary">
              第 {adv.total_nodes} 章
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {adv.keywords.slice(0, 3).map(k => (
            <span key={k} className="px-2 py-0.5 bg-white/70 border border-dashed border-sketch-text-secondary/30 text-sketch-text-secondary rounded font-patrick text-[10px]">
              {k}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t-2 border-dashed border-sketch-text-secondary/20 flex items-center justify-between">
          <span className="text-xs text-sketch-text-muted font-patrick flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(adv.updated_at).toLocaleDateString()}
          </span>

          <div className="flex items-center gap-2">
            <Link href={`/adventures/${adv.id}/tree`}>
              <Button variant="sketch-ghost" size="icon" className="h-8 w-8 text-sketch-text-muted hover:text-sketch-text-primary">
                <GitFork className="w-4 h-4" />
              </Button>
            </Link>
            {adv.is_finished ? (
              <Link href={`/adventures/${adv.id}/novel`}>
                <Button variant="sketch-secondary" size="sm">
                  <ScrollText className="w-3.5 h-3.5 mr-2" />
                  阅读小说
                </Button>
              </Link>
            ) : (
              <Link href={`/adventures/${adv.id}/play`}>
                <Button variant="sketch" size="sm">
                  继续冒险
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );

  // Community adventure card with sticky-pink sketch style
  const CommunityAdventureCard = ({ adv }: { adv: Adventure }) => (
    <motion.div
      key={adv.id}
      variants={itemVariants}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card variant="sticky-pink" rotationId={`community-${adv.id}`} className="h-full flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1 flex-1 mr-2">
            <Badge variant="sticky-yellow" className="text-[10px] uppercase tracking-wider">
              {adv.category}
            </Badge>
            <h3 className="font-caveat font-bold text-xl text-sketch-text-primary line-clamp-1">
              {adv.title}
            </h3>
          </div>
          <Badge variant="sticky-blue" className="text-[10px] shrink-0">
            <User className="w-3 h-3 mr-1" />
            社区
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-white/50 border-2 border-dashed border-sketch-text-secondary/20 flex flex-col gap-1">
            <span className="text-[10px] text-sketch-text-muted uppercase font-patrick flex items-center gap-1">
              <Sword className="w-3 h-3" /> 主角
            </span>
            <span className="text-sm font-patrick font-semibold text-sketch-text-primary truncate">
              {adv.protagonist_name}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-white/50 border-2 border-dashed border-sketch-text-secondary/20 flex flex-col gap-1">
            <span className="text-[10px] text-sketch-text-muted uppercase font-patrick flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> 章节
            </span>
            <span className="text-sm font-patrick font-semibold text-sketch-text-primary">
              {adv.total_nodes} 章
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {adv.keywords.slice(0, 3).map(k => (
            <span key={k} className="px-2 py-0.5 bg-white/70 border border-dashed border-sketch-text-secondary/30 text-sketch-text-secondary rounded font-patrick text-[10px]">
              #{k}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t-2 border-dashed border-sketch-text-secondary/20 flex items-center justify-between">
          <span className="text-xs text-sketch-text-muted font-patrick flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(adv.created_at).toLocaleDateString()}
          </span>

          <Button
            variant="sketch"
            size="sm"
            onClick={() => handleFork(adv.id)}
            disabled={isForking === adv.id}
          >
            <GitFork className="w-3.5 h-3.5 mr-2" />
            {isForking === adv.id ? "分叉中..." : "分叉探索"}
          </Button>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen grid-paper-bg">
      {/* Header - Sketch style */}
      <header className="sticky top-0 z-50 w-full">
        <div className="bg-white/95 border-b-2 border-dashed border-sketch-text-secondary/30">
          <div className="container py-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Link href="/" className="group">
                  <Button variant="sketch-ghost" size="icon" className="shrink-0 mr-2">
                    <Home className="w-5 h-5" />
                  </Button>
                </Link>
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border-2 border-dashed transition-colors",
                  mainTab === 'mine' ? "bg-sticky-pink-light border-sketch-text-secondary/30" : "bg-sticky-blue-light border-sketch-text-secondary/30"
                )}>
                  {mainTab === 'mine' ? <Gamepad2 className="w-6 h-6 text-sketch-text-primary" /> : <Compass className="w-6 h-6 text-sketch-text-primary" />}
                </div>
                <div>
                  <h1 className="text-2xl font-caveat font-bold text-sketch-text-primary">
                    {mainTab === 'mine' ? '我的冒险' : '探索社区'}
                  </h1>
                  <p className="text-xs text-sketch-text-secondary font-patrick">
                    {mainTab === 'mine' ? '记录你的每一次传奇旅程' : '发现精彩的社区故事'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sketch-text-muted" />
                  <Input
                    variant="sketch"
                    placeholder="搜索标题或关键词..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>
                <Link href="/adventures/new">
                  <Button variant="sketch">
                    <Plus className="w-4 h-4 mr-2" /> 新冒险
                  </Button>
                </Link>
              </div>
            </div>

            {/* Main Tab: mine / explore */}
            <div>
              <Tabs value={mainTab} onValueChange={handleMainTabChange} className="w-full">
                <TabsList variant="sketch">
                  <TabsTrigger variant="sketch" value="mine">
                    <Gamepad2 className="w-4 h-4 mr-2" />
                    我的冒险 ({myAdventures.length})
                  </TabsTrigger>
                  <TabsTrigger variant="sketch" value="explore">
                    <Compass className="w-4 h-4 mr-2" />
                    探索社区 {communityAdventures.length > 0 && `(${communityAdventures.length})`}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Sub Tab: ongoing / finished (only shown in "mine" tab) */}
            {mainTab === 'mine' && (
              <div className="pt-2">
                <Tabs value={subTab} onValueChange={(v) => setSubTab(v as "ongoing" | "finished")} className="w-full">
                  <TabsList className="bg-transparent p-0 h-auto border-b-2 border-dashed border-sketch-text-secondary/20 rounded-none w-full justify-start">
                    <TabsTrigger
                      value="ongoing"
                      className="px-4 py-2 rounded-none border-b-2 border-transparent font-patrick text-sketch-text-secondary data-[state=active]:border-sketch-text-primary data-[state=active]:bg-transparent data-[state=active]:text-sketch-text-primary data-[state=active]:shadow-none transition-all"
                    >
                      进行中 ({myAdventures.filter(a => !a.is_finished).length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="finished"
                      className="px-4 py-2 rounded-none border-b-2 border-transparent font-patrick text-sketch-text-secondary data-[state=active]:border-sketch-text-primary data-[state=active]:bg-transparent data-[state=active]:text-sketch-text-primary data-[state=active]:shadow-none transition-all"
                    >
                      已完结 ({myAdventures.filter(a => a.is_finished).length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {mainTab === 'mine' ? (
          // 我的冒险内容
          isLoadingMine ? (
            <LoadingSkeleton />
          ) : filteredMyAdventures.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredMyAdventures.map((adv) => (
                  <MyAdventureCard key={adv.id} adv={adv} />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <EmptyState type={subTab === 'ongoing' ? 'mine-ongoing' : 'mine-finished'} />
          )
        ) : (
          // 探索社区内容
          isLoadingCommunity ? (
            <LoadingSkeleton />
          ) : filteredCommunityAdventures.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredCommunityAdventures.map((adv) => (
                  <CommunityAdventureCard key={adv.id} adv={adv} />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <EmptyState type="explore" />
          )
        )}
      </main>
    </div>
  );
}
