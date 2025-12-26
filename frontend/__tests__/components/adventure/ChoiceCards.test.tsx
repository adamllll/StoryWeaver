/**
 * ChoiceCards 组件单元测试
 * 测试 components/adventure/ChoiceCards.tsx
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChoiceCards } from '@/components/adventure/ChoiceCards';
import { Choice, PlayerState } from '@/lib/adventure-types';

// Mock framer-motion - 需要正确传递所有 props 包括 onClick
jest.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, onClick, className, ...props }: any, ref: any) => (
      <div ref={ref} onClick={onClick} className={className} data-testid="motion-div">
        {children}
      </div>
    )),
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  MessageCircle: () => <span data-testid="icon-message" />,
  Dices: () => <span data-testid="icon-dices" />,
  Package: () => <span data-testid="icon-package" />,
  AlertTriangle: () => <span data-testid="icon-alert" />,
  Lock: () => <span data-testid="icon-lock" />,
  ChevronRight: () => <span data-testid="icon-chevron" />,
}));

// Mock 数据
const mockChoices: Choice[] = [
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
    potential_risk: null,
    state_requirements: null,
  },
  {
    index: 2,
    text: '使用魔法',
    inner_monologue: '需要足够的魔力...',
    success_rate: 0.6,
    difficulty: '困难',
    potential_reward: '快速通过',
    potential_risk: '消耗魔力',
    state_requirements: { '魔力': '>= 50' },
  },
];

const mockPlayerState: PlayerState = {
  生命值: 100,
  最大生命值: 100,
  物品: [],
  关键属性: { 力量: 10, 敏捷: 8, 魔力: 30 },
  故事事件: [],
  关系网: {},
};

const mockPlayerStateWithMagic: PlayerState = {
  ...mockPlayerState,
  关键属性: { ...mockPlayerState.关键属性, 魔力: 60 },
};

describe('ChoiceCards', () => {
  describe('rendering', () => {
    it('should render all choices', () => {
      const onSelect = jest.fn();
      render(
        <ChoiceCards
          choices={mockChoices}
          onSelect={onSelect}
          playerState={mockPlayerState}
        />
      );

      expect(screen.getByText('进入洞穴')).toBeInTheDocument();
      expect(screen.getByText('绕道而行')).toBeInTheDocument();
      expect(screen.getByText('使用魔法')).toBeInTheDocument();
    });

    it('should display choice text and inner monologue', () => {
      const onSelect = jest.fn();
      render(
        <ChoiceCards
          choices={[mockChoices[0]]}
          onSelect={onSelect}
          playerState={mockPlayerState}
        />
      );

      expect(screen.getByText('进入洞穴')).toBeInTheDocument();
      expect(screen.getByText('"或许里面有宝藏..."')).toBeInTheDocument();
    });

    it('should show difficulty badge', () => {
      const onSelect = jest.fn();
      render(
        <ChoiceCards
          choices={mockChoices}
          onSelect={onSelect}
          playerState={mockPlayerState}
        />
      );

      expect(screen.getByText('普通')).toBeInTheDocument();
      expect(screen.getByText('简单')).toBeInTheDocument();
      expect(screen.getByText('困难')).toBeInTheDocument();
    });

    it('should show success rate', () => {
      const onSelect = jest.fn();
      render(
        <ChoiceCards
          choices={[mockChoices[0]]}
          onSelect={onSelect}
          playerState={mockPlayerState}
        />
      );

      expect(screen.getByText('成功率 80%')).toBeInTheDocument();
    });

    it('should show potential reward and risk', () => {
      const onSelect = jest.fn();
      render(
        <ChoiceCards
          choices={[mockChoices[0]]}
          onSelect={onSelect}
          playerState={mockPlayerState}
        />
      );

      expect(screen.getByText('发现宝物')).toBeInTheDocument();
      expect(screen.getByText('可能遇到怪物')).toBeInTheDocument();
    });

    it('should show choice index number', () => {
      const onSelect = jest.fn();
      render(
        <ChoiceCards
          choices={mockChoices}
          onSelect={onSelect}
          playerState={mockPlayerState}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('checkRequirements', () => {
    it('should enable choice when no requirements', () => {
      const onSelect = jest.fn();
      render(
        <ChoiceCards
          choices={[mockChoices[0]]} // No requirements
          onSelect={onSelect}
          playerState={mockPlayerState}
        />
      );

      // 没有锁定图标
      expect(screen.queryByTestId('icon-lock')).not.toBeInTheDocument();
    });

    it('should enable choice when requirements met', () => {
      const onSelect = jest.fn();
      render(
        <ChoiceCards
          choices={[mockChoices[2]]} // Requires 魔力 >= 50
          onSelect={onSelect}
          playerState={mockPlayerStateWithMagic} // Has 魔力 = 60
        />
      );

      // 没有锁定图标
      expect(screen.queryByTestId('icon-lock')).not.toBeInTheDocument();
    });

    it('should disable choice when requirements not met', () => {
      const onSelect = jest.fn();
      render(
        <ChoiceCards
          choices={[mockChoices[2]]} // Requires 魔力 >= 50
          onSelect={onSelect}
          playerState={mockPlayerState} // Has 魔力 = 30
        />
      );

      // 应该显示锁定图标
      expect(screen.getByTestId('icon-lock')).toBeInTheDocument();
    });

    it('should show lock overlay for disabled choices', () => {
      const onSelect = jest.fn();
      render(
        <ChoiceCards
          choices={[mockChoices[2]]}
          onSelect={onSelect}
          playerState={mockPlayerState}
        />
      );

      expect(screen.getByText(/需要:/)).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('should call onSelect when enabled choice clicked', () => {
      const onSelect = jest.fn();
      render(
        <ChoiceCards
          choices={[mockChoices[0]]}
          onSelect={onSelect}
          playerState={mockPlayerState}
        />
      );

      // 找到选项文本并点击其父容器
      const choiceText = screen.getByText('进入洞穴');
      // 向上找到可点击的卡片容器
      const card = choiceText.closest('[data-testid="motion-div"]');
      if (card) {
        fireEvent.click(card);
      }

      expect(onSelect).toHaveBeenCalledWith(mockChoices[0]);
    });

    it('should not call onSelect when disabled choice clicked', () => {
      const onSelect = jest.fn();
      render(
        <ChoiceCards
          choices={[mockChoices[2]]} // Requires 魔力 >= 50
          onSelect={onSelect}
          playerState={mockPlayerState} // Has 魔力 = 30
        />
      );

      const choiceText = screen.getByText('使用魔法');
      const card = choiceText.closest('[data-testid="motion-div"]');
      if (card) {
        fireEvent.click(card);
      }

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('should not call onSelect when disabled prop is true', () => {
      const onSelect = jest.fn();
      render(
        <ChoiceCards
          choices={[mockChoices[0]]}
          onSelect={onSelect}
          playerState={mockPlayerState}
          disabled={true}
        />
      );

      const choiceText = screen.getByText('进入洞穴');
      const card = choiceText.closest('[data-testid="motion-div"]');
      if (card) {
        fireEvent.click(card);
      }

      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty choices array', () => {
      const onSelect = jest.fn();
      render(
        <ChoiceCards
          choices={[]}
          onSelect={onSelect}
          playerState={mockPlayerState}
        />
      );

      // 应该渲染空容器
      expect(screen.queryByText('进入洞穴')).not.toBeInTheDocument();
    });

    it('should handle null playerState', () => {
      const onSelect = jest.fn();
      render(
        <ChoiceCards
          choices={[mockChoices[2]]} // Has requirements
          onSelect={onSelect}
          playerState={null}
        />
      );

      // 没有 playerState 时，有需求的选项应该被禁用
      expect(screen.getByTestId('icon-lock')).toBeInTheDocument();
    });

    it('should handle choice without potential_risk', () => {
      const onSelect = jest.fn();
      render(
        <ChoiceCards
          choices={[mockChoices[1]]} // No potential_risk
          onSelect={onSelect}
          playerState={mockPlayerState}
        />
      );

      // 不应该显示风险图标
      expect(screen.queryByTestId('icon-alert')).not.toBeInTheDocument();
    });
  });
});
