/**
 * 冒险模式状态管理单元测试
 * 测试 lib/adventure-store.ts 中的 Zustand store
 */

import { useAdventureStore } from '@/lib/adventure-store';
import { apiClient } from '@/lib/api';
import { Adventure, StoryNode, Choice, ChoiceResponse } from '@/lib/adventure-types';

// Mock API 客户端
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock 数据
const mockAdventure: Adventure = {
  id: 1,
  title: '测试冒险',
  genre: '玄幻',
  protagonist_name: '叶无痕',
  status: 'active',
  player_state: {
    生命值: 100,
    最大生命值: 100,
    物品: [],
    关键属性: { 力量: 10, 敏捷: 8 },
    故事事件: [],
    关系网: {},
  },
  total_nodes: 5,
  total_choices: 10,
  total_words: 5000,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const mockNode: StoryNode = {
  id: 1,
  adventure_id: 1,
  content: '你站在一个神秘的洞穴入口前...',
  choices: [
    {
      index: 0,
      text: '进入洞穴',
      inner_monologue: '或许里面有宝藏...',
      success_rate: 0.8,
      difficulty: '普通',
      potential_reward: '发现宝物',
      potential_risk: '可能遇到怪物',
      state_requirements: null,
    },
    {
      index: 1,
      text: '绕道而行',
      inner_monologue: '安全第一...',
      success_rate: 1.0,
      difficulty: '简单',
      potential_reward: '安全通过',
      potential_risk: '无',
      state_requirements: null,
    },
  ],
  is_ending: false,
  created_at: '2025-01-01T00:00:00Z',
};

const mockChoiceResponse: ChoiceResponse = {
  success: true,
  roll_result: {
    base_success_rate: 0.8,
    modifiers: [],
    final_success_rate: 0.8,
    roll_value: 0.5,
    is_success: true,
  },
  narrative: '你成功进入了洞穴...',
  state_changes: { 生命值: -10 },
  state_after: {
    生命值: 90,
    最大生命值: 100,
    物品: ['神秘钥匙'],
    关键属性: { 力量: 10, 敏捷: 8 },
    故事事件: ['进入洞穴'],
    关系网: {},
  },
  new_node: {
    id: 2,
    adventure_id: 1,
    content: '洞穴内部漆黑一片...',
    choices: [],
    is_ending: false,
    created_at: '2025-01-01T00:00:00Z',
  },
};

describe('useAdventureStore', () => {
  beforeEach(() => {
    // 重置 store 状态
    useAdventureStore.setState({
      currentAdventure: null,
      currentNode: null,
      isLoading: false,
      isRolling: false,
      rollResult: null,
    });
    // 清除所有 mock 调用记录
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useAdventureStore.getState();
      expect(state.currentAdventure).toBeNull();
      expect(state.currentNode).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isRolling).toBe(false);
      expect(state.rollResult).toBeNull();
    });
  });

  describe('setAdventure', () => {
    it('should set currentAdventure', () => {
      useAdventureStore.getState().setAdventure(mockAdventure);

      const state = useAdventureStore.getState();
      expect(state.currentAdventure).toEqual(mockAdventure);
    });
  });

  describe('setCurrentNode', () => {
    it('should set currentNode', () => {
      useAdventureStore.getState().setCurrentNode(mockNode);

      const state = useAdventureStore.getState();
      expect(state.currentNode).toEqual(mockNode);
    });
  });

  describe('makeChoice', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should do nothing if no currentAdventure', async () => {
      const choice: Choice = mockNode.choices[0];

      await useAdventureStore.getState().makeChoice(choice);

      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('should set isRolling to true during API call', async () => {
      useAdventureStore.setState({ currentAdventure: mockAdventure });
      (apiClient.post as jest.Mock).mockResolvedValue(mockChoiceResponse);

      const choice: Choice = mockNode.choices[0];
      const promise = useAdventureStore.getState().makeChoice(choice);

      // 在 API 调用期间检查 isRolling
      expect(useAdventureStore.getState().isRolling).toBe(true);

      await promise;
    });

    it('should call API with correct params', async () => {
      useAdventureStore.setState({ currentAdventure: mockAdventure });
      (apiClient.post as jest.Mock).mockResolvedValue(mockChoiceResponse);

      const choice: Choice = mockNode.choices[0];
      await useAdventureStore.getState().makeChoice(choice);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/adventures/${mockAdventure.id}/choose`,
        {
          choice_index: choice.index,
          choice_text: choice.text,
        }
      );
    });

    it('should set rollResult on success', async () => {
      useAdventureStore.setState({ currentAdventure: mockAdventure });
      (apiClient.post as jest.Mock).mockResolvedValue(mockChoiceResponse);

      const choice: Choice = mockNode.choices[0];
      await useAdventureStore.getState().makeChoice(choice);

      const state = useAdventureStore.getState();
      expect(state.rollResult).toEqual(mockChoiceResponse);
      expect(state.isRolling).toBe(false);
    });

    it('should update state after 3.5s timeout', async () => {
      useAdventureStore.setState({ currentAdventure: mockAdventure });
      (apiClient.post as jest.Mock).mockResolvedValue(mockChoiceResponse);

      const choice: Choice = mockNode.choices[0];
      await useAdventureStore.getState().makeChoice(choice);

      // 在 timeout 之前，currentNode 应该还是 null
      expect(useAdventureStore.getState().currentNode).toBeNull();

      // 快进 3.5 秒
      jest.advanceTimersByTime(3500);

      // 现在应该更新了
      const state = useAdventureStore.getState();
      expect(state.currentNode).toEqual(mockChoiceResponse.new_node);
      expect(state.currentAdventure?.player_state).toEqual(mockChoiceResponse.state_after);
      expect(state.rollResult).toBeNull();
    });

    it('should reset isRolling on error', async () => {
      useAdventureStore.setState({ currentAdventure: mockAdventure });
      const error = new Error('API Error');
      (apiClient.post as jest.Mock).mockRejectedValue(error);

      const choice: Choice = mockNode.choices[0];

      await expect(
        useAdventureStore.getState().makeChoice(choice)
      ).rejects.toThrow('API Error');

      const state = useAdventureStore.getState();
      expect(state.isRolling).toBe(false);
    });
  });

  describe('loadAdventure', () => {
    it('should set isLoading to true during load', async () => {
      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce(mockAdventure)
        .mockResolvedValueOnce([mockNode]);

      const promise = useAdventureStore.getState().loadAdventure(1);

      // 在加载期间检查 isLoading
      expect(useAdventureStore.getState().isLoading).toBe(true);

      await promise;
    });

    it('should fetch adventure and nodes', async () => {
      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce(mockAdventure)
        .mockResolvedValueOnce([mockNode]);

      await useAdventureStore.getState().loadAdventure(1);

      expect(apiClient.get).toHaveBeenCalledWith('/adventures/1');
      expect(apiClient.get).toHaveBeenCalledWith('/adventures/1/nodes');
    });

    it('should set currentNode to last node', async () => {
      const nodes = [
        { ...mockNode, id: 1 },
        { ...mockNode, id: 2 },
        { ...mockNode, id: 3 },
      ];
      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce(mockAdventure)
        .mockResolvedValueOnce(nodes);

      await useAdventureStore.getState().loadAdventure(1);

      const state = useAdventureStore.getState();
      expect(state.currentAdventure).toEqual(mockAdventure);
      expect(state.currentNode?.id).toBe(3); // 最后一个节点
      expect(state.isLoading).toBe(false);
    });

    it('should reset isLoading on error', async () => {
      const error = new Error('Load Error');
      (apiClient.get as jest.Mock).mockRejectedValue(error);

      await expect(
        useAdventureStore.getState().loadAdventure(1)
      ).rejects.toThrow('Load Error');

      const state = useAdventureStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('reset', () => {
    it('should clear all state', () => {
      // 先设置一些状态
      useAdventureStore.setState({
        currentAdventure: mockAdventure,
        currentNode: mockNode,
        rollResult: mockChoiceResponse,
      });

      useAdventureStore.getState().reset();

      const state = useAdventureStore.getState();
      expect(state.currentAdventure).toBeNull();
      expect(state.currentNode).toBeNull();
      expect(state.rollResult).toBeNull();
    });
  });
});
