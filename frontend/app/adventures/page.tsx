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
import { Skeleton } from "@/components/ui/skeleton";
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

  // 骨架屏组件
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <Card key={i} className="p-6 border-none shadow-sm space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </Card>
      ))}
    </div>
  );

  // 空状态组件
  const EmptyState = ({ type }: { type: 'mine-ongoing' | 'mine-finished' | 'explore' }) => {
    const config = {
      'mine-ongoing': {
        icon: <Gamepad2 className="w-12 h-12 text-gray-300" />,
        title: "没有进行中的冒险",
        description: "一切伟大的传奇都始于第一步。现在就开始你的旅程吧！",
        showButton: true
      },
      'mine-finished': {
        icon: <Trophy className="w-12 h-12 text-gray-300" />,
        title: "还没有完结的故事",
        description: "当一段旅程结束，它便成为了永恒的传说。去创造你的结局吧！",
        showButton: false
      },
      'explore': {
        icon: <Compass className="w-12 h-12 text-gray-300" />,
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
        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500 max-w-sm mb-8">{description}</p>
        {showButton && (
          <Link href="/adventures/new">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 shadow-xl shadow-purple-500/20">
              开启新篇章
            </Button>
          </Link>
        )}
      </motion.div>
    );
  };

  // 我的冒险卡片
  const MyAdventureCard = ({ adv }: { adv: Adventure }) => (
    <motion.div
      key={adv.id}
      variants={itemVariants}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="group relative overflow-hidden border-gray-200 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 h-full flex flex-col">
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1",
          adv.is_finished ? "bg-gray-200" : "bg-gradient-to-r from-purple-400 to-blue-400"
        )} />

        <div className="p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1 flex-1 mr-2">
              <Badge variant="outline" className={cn(
                "rounded-md border-0 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase",
                adv.category === '玄幻' ? "bg-amber-50 text-amber-700" :
                adv.category === '科幻' ? "bg-blue-50 text-blue-700" :
                "bg-gray-100 text-gray-600"
              )}>
                {adv.category}
              </Badge>
              <h3 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-purple-700 transition-colors">
                {adv.title}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {adv.is_finished ? (
                adv.final_ending === "happy" ? (
                  <Badge className="bg-blue-500 text-white hover:bg-blue-600 text-[10px] px-2 py-0.5 shrink-0">
                    圆满结局
                  </Badge>
                ) : adv.final_ending === "tragic" ? (
                  <Badge variant="destructive" className="text-[10px] px-2 py-0.5 shrink-0">
                    悲剧结局
                  </Badge>
                ) : adv.final_ending === "game_over" ? (
                  <Badge variant="destructive" className="text-[10px] px-2 py-0.5 shrink-0">
                    Game Over
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 shrink-0">
                    已完结
                  </Badge>
                )
              ) : (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] px-2 py-0.5 shrink-0">
                  进行中
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                onClick={(e) => handleDelete(e, adv.id, adv.title)}
                disabled={isDeleting === adv.id}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col gap-1">
              <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1">
                <Sword className="w-3 h-3" /> 主角
              </span>
              <span className="text-sm font-semibold text-gray-700 truncate">
                {adv.protagonist_name}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col gap-1">
              <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3" /> 进度
              </span>
              <span className="text-sm font-semibold text-gray-700">
                第 {adv.total_nodes} 章
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-6">
            {adv.keywords.slice(0, 3).map(k => (
              <span key={k} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-500 rounded text-[10px]">
                {k}
              </span>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(adv.updated_at).toLocaleDateString()}
            </span>

            {adv.is_finished ? (
              <Link href={`/adventures/${adv.id}/novel`}>
                <Button variant="outline" size="sm" className="group/btn">
                  <ScrollText className="w-3.5 h-3.5 mr-2 text-gray-500 group-hover/btn:text-gray-900" />
                  阅读小说
                </Button>
              </Link>
            ) : (
              <Link href={`/adventures/${adv.id}/play`}>
                <Button size="sm" className="bg-gray-900 hover:bg-black text-white group/btn">
                  继续冒险
                  <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );

  // 社区冒险卡片
  const CommunityAdventureCard = ({ adv }: { adv: Adventure }) => (
    <motion.div
      key={adv.id}
      variants={itemVariants}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="group relative overflow-hidden border-gray-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 h-full flex flex-col">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-400" />

        <div className="p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1 flex-1 mr-2">
              <Badge variant="outline" className={cn(
                "rounded-md border-0 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase",
                adv.category === '玄幻' ? "bg-amber-50 text-amber-700" :
                adv.category === '科幻' ? "bg-blue-50 text-blue-700" :
                "bg-gray-100 text-gray-600"
              )}>
                {adv.category}
              </Badge>
              <h3 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-blue-700 transition-colors">
                {adv.title}
              </h3>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-2 py-0.5 shrink-0">
              <User className="w-3 h-3 mr-1" />
              社区
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col gap-1">
              <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1">
                <Sword className="w-3 h-3" /> 主角
              </span>
              <span className="text-sm font-semibold text-gray-700 truncate">
                {adv.protagonist_name}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col gap-1">
              <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> 章节
              </span>
              <span className="text-sm font-semibold text-gray-700">
                {adv.total_nodes} 章
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-6">
            {adv.keywords.slice(0, 3).map(k => (
              <span key={k} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-500 rounded text-[10px]">
                #{k}
              </span>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(adv.created_at).toLocaleDateString()}
            </span>

            <Link href={`/adventures/${adv.id}/play`}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white group/btn">
                <GitFork className="w-3.5 h-3.5 mr-2" />
                分叉探索
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#F9F9FB]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-30">
        <div className="container py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" className="shrink-0 hover:bg-gray-100 rounded-full mr-2">
                  <Home className="w-5 h-5 text-gray-600" />
                </Button>
              </Link>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                mainTab === 'mine' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
              )}>
                {mainTab === 'mine' ? <Gamepad2 className="w-6 h-6" /> : <Compass className="w-6 h-6" />}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {mainTab === 'mine' ? '我的冒险' : '探索社区'}
                </h1>
                <p className="text-xs text-gray-500">
                  {mainTab === 'mine' ? '记录你的每一次传奇旅程' : '发现精彩的社区故事，分叉创造属于你的结局'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索标题或关键词..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-gray-50/50 border-gray-200 focus:bg-white transition-all h-10"
                />
              </div>
              <Link href="/adventures/new">
                <Button className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20">
                  <Plus className="w-4 h-4 mr-2" /> 新冒险
                </Button>
              </Link>
            </div>
          </div>

          {/* 主Tab：我的冒险 / 探索社区 */}
          <div className="mt-6">
            <Tabs value={mainTab} onValueChange={handleMainTabChange} className="w-full">
              <TabsList className="bg-gray-100/50 p-1">
                <TabsTrigger
                  value="mine"
                  className="px-6 data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm"
                >
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  我的冒险 ({myAdventures.length})
                </TabsTrigger>
                <TabsTrigger
                  value="explore"
                  className="px-6 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
                >
                  <Compass className="w-4 h-4 mr-2" />
                  探索社区 {communityAdventures.length > 0 && `(${communityAdventures.length})`}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* 子Tab：进行中 / 已完结（仅在我的冒险中显示）*/}
          {mainTab === 'mine' && (
            <div className="mt-4">
              <Tabs value={subTab} onValueChange={(v) => setSubTab(v as "ongoing" | "finished")} className="w-full">
                <TabsList className="bg-transparent p-0 h-auto border-b border-gray-200 rounded-none">
                  <TabsTrigger
                    value="ongoing"
                    className="px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:text-purple-700 data-[state=active]:shadow-none"
                  >
                    进行中 ({myAdventures.filter(a => !a.is_finished).length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="finished"
                    className="px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:text-purple-700 data-[state=active]:shadow-none"
                  >
                    已完结 ({myAdventures.filter(a => a.is_finished).length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}
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
