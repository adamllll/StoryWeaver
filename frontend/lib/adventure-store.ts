import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { apiClient } from './api';
import { Adventure, StoryNode, Choice, ChoiceResponse } from './adventure-types';
import { toast } from '@/components/ui/use-toast';

// Extend RollResult if not defined in types (it wasn't in my previous write, but ChoiceResponse seems to cover it)
// In the plan, it uses `RollResult` type for `rollResult` state, but `ChoiceResponse` seems to be the one.
// The plan says `rollResult: RollResult | null;` but `makeChoice` returns `result` which is `ChoiceResponse`.
// Let's assume RollResult is alias for ChoiceResponse or similar.

interface AdventureState {
  // 当前冒险数据
  currentAdventure: Adventure | null;
  currentNode: StoryNode | null;

  // UI 状态
  isLoading: boolean;
  isRolling: boolean;
  rollResult: ChoiceResponse | null;
  showEndDialog: boolean;  // 控制游戏结束对话框显示

  // Actions
  setAdventure: (adventure: Adventure) => void;
  setCurrentNode: (node: StoryNode) => void;
  makeChoice: (choice: Choice) => Promise<void>;
  loadAdventure: (id: number) => Promise<void>;
  reset: () => void;
  finishAdventure: (adventureId: number, endingType: 'happy' | 'tragic' | 'user_quit') => Promise<void>;
  setShowEndDialog: (show: boolean) => void;
}

export const useAdventureStore = create<AdventureState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        currentAdventure: null,
        currentNode: null,
        isLoading: false,
        isRolling: false,
        rollResult: null,
        showEndDialog: false,

        // Actions
        setAdventure: (adventure) => set({ currentAdventure: adventure }),

        setCurrentNode: (node) => set({ currentNode: node }),

        setShowEndDialog: (show) => set({ showEndDialog: show }),

        makeChoice: async (choice) => {
          const { currentAdventure, isRolling } = get();
          if (!currentAdventure) return;

          // 防止重复提交：如果正在投骰子，直接返回
          if (isRolling) return;

          set({ isRolling: true });

          try {
            const result = await apiClient.post<ChoiceResponse>(
              `/adventures/${currentAdventure.id}/choose`,
              {
                choice_index: choice.index,
                choice_text: choice.text,
              }
            );

            // 设置结果，但保持 isRolling 为 true 直到动画完成
            set({
              rollResult: result,
              // 注意：不要在这里设置 isRolling: false！
              // 动画需要 3.5 秒，在此期间禁止用户再次选择
            });

            // 等待动画完成后更新状态
            setTimeout(() => {
              set((state) => ({
                currentNode: result.new_node,
                currentAdventure: state.currentAdventure ? {
                  ...state.currentAdventure,
                  player_state: result.state_after,
                } : null,
                rollResult: null,
                isRolling: false,  // 动画完成后才设为 false
              }));

              // 检测游戏自动结束
              if (result.game_over && !get().currentAdventure?.is_finished) {
                const endingType = _inferEndingType(result.game_over_reason);
                setTimeout(() => {
                  get().finishAdventure(currentAdventure.id, endingType);
                }, 500); // 等待状态更新后再触发结束流程
              }
            }, 3500); // 3.5s for animation
          } catch (error) {
            set({ isRolling: false });
            throw error;
          }
        },

        loadAdventure: async (id) => {
          set({ isLoading: true });

          try {
            const adventure = await apiClient.get<Adventure>(`/adventures/${id}`);
            const nodes = await apiClient.get<StoryNode[]>(`/adventures/${id}/nodes`);

            set({
              currentAdventure: adventure,
              // 防御性编程：确保 nodes 数组不为空
              currentNode: nodes.length > 0 ? nodes[nodes.length - 1] : null,
              isLoading: false,
            });
          } catch (error) {
            set({ isLoading: false });
            throw error;
          }
        },

        finishAdventure: async (adventureId, endingType) => {
          set({ isLoading: true });

          try {
            // 调用后端结束 API
            await apiClient.post(`/adventures/${adventureId}/finish`, {
              ending_type: endingType,
            });

            // 更新当前冒险状态为已完成
            set((state) => ({
              currentAdventure: state.currentAdventure ? {
                ...state.currentAdventure,
                is_finished: true,
                final_ending: endingType,
              } : null,
              showEndDialog: true,
              isLoading: false,
            }));

            toast({
              title: "冒险已结束",
              description: "您的冒险故事已保存",
            });
          } catch (error: unknown) {
            set({ isLoading: false });
            const message = error instanceof Error ? error.message : "请稍后重试";
            toast({
              title: "结束失败",
              description: message,
              variant: "destructive",
            });
            throw error;
          }
        },

        reset: () => set({
          currentAdventure: null,
          currentNode: null,
          rollResult: null,
          showEndDialog: false,  // 重置时清空对话框状态
        }),
      }),
      {
        name: 'adventure-storage',
        partialize: (state) => ({
          currentAdventure: state.currentAdventure,
        }),
      }
    )
  )
);

// 辅助函数：从游戏结束原因推断结局类型
function _inferEndingType(reason?: string | null): 'happy' | 'tragic' {
  if (!reason) return 'tragic';
  const tragicKeywords = ['死亡', '失败', '崩溃', '归零'];
  return tragicKeywords.some(kw => reason.includes(kw)) ? 'tragic' : 'happy';
}
