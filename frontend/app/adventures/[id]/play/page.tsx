"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAdventureStore } from "@/lib/adventure-store";
import { apiClient, ApiError, conversationsApi, ConversationMessage } from "@/lib/api";
import { StoryNode, Choice } from "@/lib/adventure-types";
import { PlayerStatePanel } from "@/components/adventure/PlayerStatePanel";
import { StoryDisplay } from "@/components/adventure/StoryDisplay";
import { ChoiceModal } from "@/components/adventure/ChoiceModal";
import { DiceRollAnimation } from "@/components/adventure/DiceRollAnimation";
import { ChapterSidebar } from "@/components/adventure/ChapterSidebar";
import { GameEndDialog } from "@/components/adventure/GameEndDialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, BookText, Sparkles, User, List, ArrowLeft, RefreshCw, MessageSquare, GitFork } from "lucide-react";
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
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [conversationOpen, setConversationOpen] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [isConversationLoading, setIsConversationLoading] = useState(true);
  const conversationSeededRef = useRef(false);

  // 重试相关状态
  const [canRetry, setCanRetry] = useState(false);
  const [lastChoice, setLastChoice] = useState<Choice | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Initialize
  useEffect(() => {
    if (adventureId) {
      loadAdventure(adventureId)
        .then(() => {
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

  // Sync viewing node
  useEffect(() => {
    if (storeCurrentNode) {
      setViewingNode(storeCurrentNode);
      apiClient.get<StoryNode[]>(`/adventures/${adventureId}/nodes`)
        .then(fetchedNodes => {
          const sorted = [...fetchedNodes].sort((a, b) => a.chapter_num - b.chapter_num);
          setNodes(sorted);
        })
        .catch(err => console.error('Failed to refresh nodes:', err));
    }
  }, [storeCurrentNode, adventureId]);

  useEffect(() => {
    if (!adventureId) return;
    conversationSeededRef.current = false;
    setIsConversationLoading(true);
    conversationsApi.get(adventureId)
      .then((data) => {
        setConversationMessages(data.messages ?? []);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) {
          setConversationMessages([]);
          return;
        }
        console.warn("Failed to load conversation:", error);
      })
      .finally(() => setIsConversationLoading(false));
  }, [adventureId]);

  const persistConversation = useCallback(async (messages: ConversationMessage[]) => {
    if (!adventureId) return;
    try {
      await conversationsApi.save(adventureId, { messages });
    } catch (error) {
      console.warn("Failed to save conversation:", error);
    }
  }, [adventureId]);

  useEffect(() => {
    if (!storeCurrentNode || isConversationLoading) return;
    if (conversationMessages.length > 0 || conversationSeededRef.current) return;
    const seedMessages: ConversationMessage[] = [
      { role: "assistant", content: storeCurrentNode.content },
    ];
    conversationSeededRef.current = true;
    setConversationMessages(seedMessages);
    persistConversation(seedMessages);
  }, [storeCurrentNode, conversationMessages.length, isConversationLoading, persistConversation]);

  // Handlers
  const handleChoice = useCallback(async (choice: Choice) => {
    setIsChoiceModalOpen(false);
    setLastChoice(choice);  // 保存选择以便重试
    setCanRetry(false);  // 清除之前的重试状态

    try {
      const result = await makeChoice(choice);
      if (result) {
        setConversationMessages((prev) => {
          const baseMessages: ConversationMessage[] = prev.length > 0
            ? [...prev]
            : storeCurrentNode
              ? [{ role: "assistant" as const, content: storeCurrentNode.content }]
              : [];
          const nextMessages: ConversationMessage[] = [
            ...baseMessages,
            { role: "user" as const, content: choice.text },
            { role: "assistant" as const, content: result.new_node.content },
          ];
          persistConversation(nextMessages);
          return nextMessages;
        });
      }
    } catch (err: unknown) {
      let message = "请稍后重试";
      let isRetryable = false;

      if (err instanceof ApiError) {
        message = err.detail;
        // 检测可重试的错误
        isRetryable = err.retryable === true ||
          err.code === "json_parse_error" ||
          err.status === 422 ||
          err.status === 503;
      } else if (err instanceof Error) {
        message = err.message;
      }

      // 设置重试状态
      if (isRetryable) {
        setCanRetry(true);
      }

      toast({
        title: "选择失败",
        description: isRetryable ? `${message}（可重试）` : message,
        variant: "destructive"
      });
    }
  }, [makeChoice, persistConversation, storeCurrentNode, toast]);

  // 重试功能
  const handleRetry = useCallback(async () => {
    if (!canRetry || !lastChoice) return;
    setCanRetry(false);
    await handleChoice(lastChoice);
  }, [canRetry, lastChoice, handleChoice]);

  // 重新生成当前章节
  const handleRegenerateChapter = useCallback(async () => {
    if (!currentAdventure || isRegenerating) return;

    setIsRegenerating(true);
    try {
      const result = await apiClient.post<{
        message: string;
        node: StoryNode;
        state_after: Record<string, number>;
      }>(`/adventures/${currentAdventure.id}/regenerate`);

      // 更新当前节点
      setViewingNode(result.node);

      // 刷新节点列表
      const updatedNodes = await apiClient.get<StoryNode[]>(`/adventures/${currentAdventure.id}/nodes`);
      setNodes(updatedNodes);

      setConversationMessages((prev) => {
        const nextMessages: ConversationMessage[] = prev.length > 0
          ? [...prev]
          : [{ role: "assistant" as const, content: result.node.content }];
        let lastAssistantIndex = -1;
        for (let i = nextMessages.length - 1; i >= 0; i -= 1) {
          if (nextMessages[i].role === "assistant") {
            lastAssistantIndex = i;
            break;
          }
        }
        if (lastAssistantIndex >= 0) {
          nextMessages[lastAssistantIndex] = {
            ...nextMessages[lastAssistantIndex],
            content: result.node.content,
          };
        } else {
          nextMessages.push({ role: "assistant" as const, content: result.node.content });
        }
        persistConversation(nextMessages);
        return nextMessages;
      });

      toast({
        title: "章节已重新生成",
        description: "AI 为你创作了新的故事内容 ✨",
      });
    } catch (err: unknown) {
      let message = "重新生成失败，请稍后重试";
      let isRetryable = false;

      if (err instanceof ApiError) {
        message = err.detail;
        isRetryable = err.retryable === true || err.status === 503;
      }

      toast({
        title: "重新生成失败",
        description: isRetryable ? `${message}（可重试）` : message,
        variant: "destructive"
      });
    } finally {
      setIsRegenerating(false);
    }
  }, [currentAdventure, isRegenerating, persistConversation, toast]);

  const handleAnimationComplete = () => {
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

  // Loading state - sketch style
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-paper-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-dashed border-sketch-text-secondary border-t-sketch-text-primary rounded-full animate-spin" />
          <p className="text-sketch-text-secondary font-patrick font-medium">正在加载冒险...</p>
        </div>
      </div>
    );
  }

  // Adventure not found - sketch style
  if (!currentAdventure) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-paper-bg">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="w-16 h-16 rounded-xl bg-sticky-pink border-2 border-dashed border-sketch-text-secondary/30 flex items-center justify-center">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-xl font-caveat font-bold text-sketch-text-primary">冒险不存在</h2>
          <p className="text-sketch-text-secondary font-patrick">该冒险可能已被删除或您没有访问权限</p>
          <Button variant="sketch-secondary" onClick={() => window.history.back()}>
            返回上一页
          </Button>
        </div>
      </div>
    );
  }

  // Generating initial content - sketch style
  if (!viewingNode) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-paper-bg">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="w-16 h-16 border-4 border-dashed border-sticky-yellow border-t-sketch-text-primary rounded-full animate-spin" />
          <h2 className="text-lg font-caveat font-bold text-sketch-text-primary">正在生成开局...</h2>
          <p className="text-sketch-text-secondary font-patrick text-sm">AI 正在为您创作精彩的故事开端，请稍候</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-paper-bg text-sketch-text-primary font-patrick selection:bg-sticky-yellow selection:text-sketch-text-primary overflow-hidden flex flex-col relative">

      {/* ------------------------------------------------------------------
          Main Content Area (Zen Mode)
          ------------------------------------------------------------------ */}
      <main className="flex-1 h-screen overflow-y-auto relative scroll-smooth pb-32">
        <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12">

          {/* Top Navigation Bar - Sketch style */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/adventures">
              <Button variant="sketch-ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回列表
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              <Link href={`/adventures/${adventureId}/tree`}>
                <Button variant="sketch-ghost" size="sm">
                  <GitFork className="w-4 h-4 mr-1" />
                  分支树
                </Button>
              </Link>
              {/* Regenerate Chapter Button (Only for chapter > 1 and not finished) */}
              {!currentAdventure?.is_finished && isLatest && viewingNode.chapter_num > 1 && (
                <Button
                  variant="sketch-ghost"
                  size="sm"
                  onClick={handleRegenerateChapter}
                  disabled={isRegenerating || isRolling}
                  className="text-orange-600 hover:bg-sticky-yellow-light"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${isRegenerating ? 'animate-spin' : ''}`} />
                  {isRegenerating ? '生成中...' : '重新生成'}
                </Button>
              )}

              {/* End Game Trigger (Only visible if not finished) */}
              {!currentAdventure?.is_finished && (
                 <Button
                   variant="sketch-ghost"
                   size="sm"
                   onClick={() => setShowEndDialog(true)}
                   className="text-red-500 hover:bg-sticky-pink-light"
                 >
                   提前结局
                 </Button>
              )}
            </div>
          </div>

          {/* Header Info - Sketch style */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-3 py-1 rounded-lg bg-sticky-pink border-2 border-dashed border-sketch-text-secondary/30 text-sketch-text-primary text-xs font-patrick font-bold mb-3 tracking-wide uppercase">
              {currentAdventure.title}
            </span>
            <h1 className="text-3xl md:text-4xl font-caveat font-bold text-sketch-text-primary tracking-tight">
              {viewingNode.title || `第 ${viewingNode.chapter_num} 章`}
            </h1>
          </motion.div>

          {/* Story Content */}
          <StoryDisplay
            content={viewingNode.content}
            background={viewingNode.chapter_num === 1 ? currentAdventure.keywords[0] : undefined}
          />

          {/* Inline History Indicators */}
          <div className="min-h-[100px] flex justify-center">
            <AnimatePresence mode="wait">
              {!isLatest ? (
                <div className="text-center py-8 text-sketch-text-muted">
                  <BookText className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-patrick">正在回溯历史</p>
                  <Button variant="link" onClick={() => handleNodeSelect(nodes[nodes.length - 1])} className="text-sketch-text-primary font-patrick">
                    回到最新进度
                  </Button>
                </div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* ------------------------------------------------------------------
          Global Overlays (Root Level)
          ------------------------------------------------------------------ */}

      {/* AI Generation Overlay (Loading) - Sketch style */}
      <AnimatePresence>
        {isRolling && !rollResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-dashed border-sketch-text-secondary border-t-sketch-text-primary rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-sketch-text-primary animate-pulse" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-caveat font-bold text-sketch-text-primary mb-1">命运推演中...</h3>
                <p className="text-sketch-text-secondary font-patrick">AI 正在编织你的未来</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dice Roll Overlay */}
      <AnimatePresence>
        {isRolling && rollResult && (
          <DiceRollAnimation
            key="dice"
            rollValue={rollResult.roll_value}
            target={rollResult.target}
            success={rollResult.success}
            onComplete={handleAnimationComplete}
          />
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------
          Floating Control Dock (Bottom Center) - Sketch style
          ------------------------------------------------------------------ */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4">
        {/* Menu Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSidebarOpen(true)}
          className="w-12 h-12 rounded-xl bg-white border-2 border-dashed border-sketch-text-secondary/30 flex items-center justify-center text-sketch-text-secondary shadow-sketch hover:text-sketch-text-primary hover:border-solid transition-all duration-sketch"
          title="章节列表"
        >
          <List className="w-5 h-5" />
        </motion.button>

        {/* Main Action Button (Choice Trigger) - Sketch style */}
        <AnimatePresence>
          {showChoices && !canRetry && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.05, rotate: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsChoiceModalOpen(true)}
              className="h-14 px-8 rounded-xl bg-sticky-yellow border-2 border-sketch-text-primary text-sketch-text-primary font-caveat font-bold text-xl shadow-sketch flex items-center gap-2 hover:shadow-sketch-lg transition-all duration-sketch"
            >
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="tracking-wide">抉择时刻</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Retry button - Sketch style */}
        <AnimatePresence>
          {canRetry && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.05, rotate: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRetry}
              disabled={isRolling}
              className="h-14 px-8 rounded-xl bg-sticky-pink border-2 border-sketch-text-primary text-sketch-text-primary font-caveat font-bold text-xl shadow-sketch flex items-center gap-2 disabled:opacity-50 hover:shadow-sketch-lg transition-all duration-sketch"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="tracking-wide">重新生成</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* State Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setStatePanelOpen(true)}
          className="w-12 h-12 rounded-xl bg-white border-2 border-dashed border-sketch-text-secondary/30 flex items-center justify-center text-sketch-text-secondary shadow-sketch hover:text-sketch-text-primary hover:border-solid transition-all duration-sketch"
          title="角色状态"
        >
          <User className="w-5 h-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setConversationOpen(true)}
          className="w-12 h-12 rounded-xl bg-white border-2 border-dashed border-sketch-text-secondary/30 flex items-center justify-center text-sketch-text-secondary shadow-sketch hover:text-sketch-text-primary hover:border-solid transition-all duration-sketch"
          title="对话记录"
        >
          <MessageSquare className="w-5 h-5" />
        </motion.button>
      </div>

      {/* ------------------------------------------------------------------
          Drawers & Modals - Sketch style
          ------------------------------------------------------------------ */}

      {/* Chapter Drawer (Left) */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-50 bg-sketch-text-primary/10"
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-80 bg-white border-r-2 border-dashed border-sketch-text-secondary/30 shadow-sketch-lg"
            >
              <div className="p-4 flex justify-between items-center border-b-2 border-dashed border-sketch-text-secondary/20">
                <span className="font-caveat font-bold text-lg text-sketch-text-primary">章节目录</span>
                <Button variant="sketch-ghost" size="icon" onClick={() => setSidebarOpen(false)}>
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

      {/* State Drawer (Right) */}
      <AnimatePresence>
        {statePanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setStatePanelOpen(false)}
              className="fixed inset-0 z-50 bg-sketch-text-primary/10"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-80 bg-white border-l-2 border-dashed border-sketch-text-secondary/30 shadow-sketch-lg p-4"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-caveat font-bold text-lg text-sketch-text-primary">角色状态</span>
                <Button variant="sketch-ghost" size="icon" onClick={() => setStatePanelOpen(false)}>
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

      {/* Conversation Drawer (Right) */}
      <AnimatePresence>
        {conversationOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConversationOpen(false)}
              className="fixed inset-0 z-50 bg-sketch-text-primary/10"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-96 bg-white border-l-2 border-dashed border-sketch-text-secondary/30 shadow-sketch-lg p-4"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-caveat font-bold text-lg text-sketch-text-primary">对话记录</span>
                <Button variant="sketch-ghost" size="icon" onClick={() => setConversationOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <ScrollArea className="h-[calc(100%-60px)] pr-3">
                {isConversationLoading ? (
                  <div className="flex items-center justify-center py-12 text-sm text-sketch-text-muted font-patrick">
                    正在载入对话...
                  </div>
                ) : conversationMessages.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-sm text-sketch-text-muted font-patrick">
                    暂无对话记录
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversationMessages.map((message, index) => {
                      const isUser = message.role === "user";
                      const isSystem = message.role === "system";
                      return (
                        <div
                          key={`${message.role}-${index}`}
                          className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-xl px-4 py-2 text-sm font-patrick leading-relaxed whitespace-pre-wrap border-2 ${
                              isSystem
                                ? "bg-sticky-blue-light border-dashed border-sketch-text-secondary/30 text-sketch-text-secondary"
                                : isUser
                                ? "bg-sticky-yellow border-sketch-text-primary/20 text-sketch-text-primary"
                                : "bg-white border-dashed border-sketch-text-secondary/30 text-sketch-text-primary"
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Choice Modal */}
      <ChoiceModal
        isOpen={isChoiceModalOpen}
        onClose={() => setIsChoiceModalOpen(false)}
        choices={viewingNode.choices}
        onSelect={handleChoice}
        playerState={currentAdventure.player_state}
        disabled={isRolling}
      />

      {/* Game End Dialog */}
      {currentAdventure && (
        <GameEndDialog
          open={showEndDialog}
          onOpenChange={setShowEndDialog}
          adventure={currentAdventure}
          trigger={currentAdventure.final_ending === 'game_over' ? 'auto' : 'manual'}
          endingContent={
            (currentAdventure.final_ending === "happy" || currentAdventure.final_ending === "tragic")
              ? nodes[nodes.length - 1]?.content
              : undefined
          }
        />
      )}

    </div>
  );
}
