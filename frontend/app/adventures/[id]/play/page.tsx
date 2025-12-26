"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAdventureStore } from "@/lib/adventure-store";
import { apiClient } from "@/lib/api";
import { StoryNode, Choice, PlayerState } from "@/lib/adventure-types";
import { PlayerStatePanel } from "@/components/adventure/PlayerStatePanel";
import { StoryDisplay } from "@/components/adventure/StoryDisplay";
import { ChoiceCards } from "@/components/adventure/ChoiceCards";
import { DiceRollAnimation } from "@/components/adventure/DiceRollAnimation";
import { ChapterSidebar } from "@/components/adventure/ChapterSidebar";
import { EndAdventureButton } from "@/components/adventure/EndAdventureButton";
import { GameEndDialog } from "@/components/adventure/GameEndDialog";
import { Button } from "@/components/ui/button";
import { Menu, X, Share2, BookText, Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// ------------------------------------------------------------------
// Main Game Page
// ------------------------------------------------------------------
export default function AdventurePlayPage() {
  const params = useParams();
  const adventureId = Number(params.id);
  const { toast } = useToast();

  const {
    currentAdventure,
    currentNode: storeCurrentNode,
    isLoading,
    isRolling,
    rollResult,
    showEndDialog,
    setShowEndDialog,
    loadAdventure,
    makeChoice,
    reset
  } = useAdventureStore();

  // Local UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statePanelOpen, setStatePanelOpen] = useState(false);
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [viewingNode, setViewingNode] = useState<StoryNode | null>(null);

  // Initialize
  useEffect(() => {
    if (adventureId) {
      loadAdventure(adventureId)
        .then(() => {
           // Also fetch all nodes for the history list
           return apiClient.get<StoryNode[]>(`/adventures/${adventureId}/nodes`);
        })
        .then((fetchedNodes) => {
          setNodes(fetchedNodes);
        })
        .catch((err) => {
          toast({
            title: "加载失败",
            description: err.message,
            variant: "destructive"
          });
        });
    }
    return () => reset();
  }, [adventureId, loadAdventure, reset, toast]);

  // Sync viewing node with current node initially, or when new node arrives
  useEffect(() => {
    if (storeCurrentNode) {
      setViewingNode(storeCurrentNode);
      // Refresh node list if it's a new node
      if (nodes.length > 0 && storeCurrentNode.id !== nodes[nodes.length - 1].id) {
         apiClient.get<StoryNode[]>(`/adventures/${adventureId}/nodes`).then(setNodes);
      }
    }
  }, [storeCurrentNode, adventureId]); // Added adventureId to dependencies to avoid stale closures, though mostly handled by fetch

  // Handlers
  const handleChoice = async (choice: Choice) => {
    try {
      await makeChoice(choice);
    } catch (err: any) {
      toast({
        title: "选择失败",
        description: err.message || "请稍后重试",
        variant: "destructive"
      });
    }
  };

  const handleAnimationComplete = () => {
    // The store updates state after a timeout, 
    // but the animation component calls this when it's visually done.
    // We can rely on the store's reactive state update to refresh the UI.
    // Maybe we just ensure we re-fetch the node list here to be safe
    apiClient.get<StoryNode[]>(`/adventures/${adventureId}/nodes`).then(setNodes);
  };

  const handleNodeSelect = (node: StoryNode) => {
    setViewingNode(node);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // derived state
  const isLatest = viewingNode?.id === storeCurrentNode?.id;
  const showChoices = isLatest && !isRolling && !currentAdventure?.is_finished;

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">正在加载冒险...</p>
        </div>
      </div>
    );
  }

  // 冒险不存在
  if (!currentAdventure) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800">冒险不存在</h2>
          <p className="text-gray-500">该冒险可能已被删除或您没有访问权限</p>
          <Button onClick={() => window.history.back()} variant="outline">
            返回上一页
          </Button>
        </div>
      </div>
    );
  }

  // 冒险存在但没有节点（正在生成中）
  if (!viewingNode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
          <h2 className="text-lg font-bold text-gray-800">正在生成开局...</h2>
          <p className="text-gray-500 text-sm">AI 正在为您创作精彩的故事开端，请稍候</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-gray-900 font-sans selection:bg-purple-200 selection:text-purple-900 overflow-hidden flex">
      
      {/* ------------------------------------------------------------------
          Left Sidebar (Desktop): Player State
          ------------------------------------------------------------------ */}
      <motion.aside 
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="hidden lg:block w-[320px] h-screen sticky top-0 p-6 pr-0"
      >
        <PlayerStatePanel 
          state={currentAdventure.player_state} 
          protagonist={currentAdventure.protagonist_name}
        />
      </motion.aside>

      {/* ------------------------------------------------------------------
          Main Content Area
          ------------------------------------------------------------------ */}
      <main className="flex-1 h-screen overflow-y-auto relative scroll-smooth">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-40 px-4 py-3 bg-white/80 backdrop-blur-md border-b border-gray-200 flex justify-between items-center">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <span className="font-bold text-gray-800 truncate max-w-[150px]">
            {currentAdventure.title}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setStatePanelOpen(true)}>
            <span className="sr-only">状态</span>
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
               {/* Avatar placeholder */}
               <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500" />
            </div>
          </Button>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12 pb-32">
          
          {/* Header Info */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-200/50 text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              第 {viewingNode.chapter_num} 章
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              {viewingNode.title || `冒险篇章 ${viewingNode.chapter_num}`}
            </h1>
          </motion.div>

          {/* Story Content */}
          <StoryDisplay 
            content={viewingNode.content} 
            background={viewingNode.chapter_num === 1 ? currentAdventure.keywords[0] : undefined}
          />

          {/* Choices Area */}
          <div className="min-h-[200px]">
            <AnimatePresence mode="wait">
              {isRolling && rollResult ? (
                <DiceRollAnimation
                  key="dice"
                  rollValue={rollResult.roll_value}
                  target={rollResult.target}
                  success={rollResult.success}
                  onComplete={handleAnimationComplete}
                />
              ) : isRolling && !rollResult ? (
                // API 调用中的加载提示
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-md"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                    <p className="text-gray-600 font-medium text-lg">正在处理您的选择...</p>
                    <p className="text-gray-400 text-sm">AI 正在生成后续剧情</p>
                  </div>
                </motion.div>
              ) : showChoices ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 py-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">做出抉择</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                  </div>
                  <ChoiceCards
                    choices={viewingNode.choices}
                    onSelect={handleChoice}
                    playerState={currentAdventure.player_state}
                    disabled={isRolling}
                  />

                  {/* 结束冒险按钮 */}
                  <EndAdventureButton
                    adventureId={adventureId}
                    disabled={isRolling}
                  />
                </div>
              ) : !isLatest ? (
                <div className="text-center py-12 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <BookText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>正在查看历史章节</p>
                  <Button variant="link" onClick={() => handleNodeSelect(nodes[nodes.length - 1])}>
                    回到最新进度
                  </Button>
                </div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* ------------------------------------------------------------------
          Right Sidebar (Desktop): Chapter List
          ------------------------------------------------------------------ */}
      <motion.aside 
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="hidden lg:block w-[280px] h-screen sticky top-0"
      >
        <ChapterSidebar 
          nodes={nodes} 
          currentNodeId={viewingNode.id}
          onSelect={handleNodeSelect}
        />
      </motion.aside>

      {/* ------------------------------------------------------------------
          Mobile Drawers (Overlays)
          ------------------------------------------------------------------ */}
      
      {/* Mobile Chapter Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm lg:hidden"
            />
            <motion.div 
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-[80%] max-w-[300px] bg-white lg:hidden shadow-2xl"
            >
              <div className="p-4 flex justify-end">
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <ChapterSidebar 
                nodes={nodes} 
                currentNodeId={viewingNode.id}
                onSelect={handleNodeSelect}
                className="h-[calc(100%-60px)] border-none bg-transparent"
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile State Drawer */}
      <AnimatePresence>
        {statePanelOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setStatePanelOpen(false)}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm lg:hidden"
            />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-[85%] max-w-[340px] bg-white lg:hidden shadow-2xl p-4"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-lg">角色状态</span>
                <Button variant="ghost" size="icon" onClick={() => setStatePanelOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="h-[calc(100%-60px)]">
                <PlayerStatePanel 
                  state={currentAdventure.player_state} 
                  protagonist={currentAdventure.protagonist_name}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 游戏结束对话框 */}
      {currentAdventure && (
        <GameEndDialog
          open={showEndDialog}
          onOpenChange={setShowEndDialog}
          adventure={currentAdventure}
          trigger={currentAdventure.final_ending === 'game_over' ? 'auto' : 'manual'}
          endingContent={
            // 仅当是happy或tragic结局时，传入最后一个节点的内容
            (currentAdventure.final_ending === "happy" || currentAdventure.final_ending === "tragic")
              ? nodes[nodes.length - 1]?.content
              : undefined
          }
        />
      )}

    </div>
  );
}
