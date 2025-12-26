/**
 * PlayerStatePanel 组件单元测试
 * 测试 components/adventure/PlayerStatePanel.tsx
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerStatePanel } from '@/components/adventure/PlayerStatePanel';
import { PlayerState } from '@/lib/adventure-types';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} data-testid="motion-div">
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Heart: () => <span data-testid="icon-heart" />,
  Zap: () => <span data-testid="icon-zap" />,
  Briefcase: () => <span data-testid="icon-briefcase" />,
  ScrollText: () => <span data-testid="icon-scroll" />,
  Users: () => <span data-testid="icon-users" />,
  User: () => <span data-testid="icon-user" />,
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  ChevronUp: () => <span data-testid="icon-chevron-up" />,
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className} data-testid="card-header">{children}</div>,
  CardTitle: ({ children, className }: any) => <h2 className={className} data-testid="card-title">{children}</h2>,
  CardContent: ({ children, className }: any) => <div className={className} data-testid="card-content">{children}</div>,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: any) => <div className={className} data-testid="scroll-area">{children}</div>,
}));

// Mock 数据
const mockPlayerState: PlayerState = {
  生命值: 80,
  最大生命值: 100,
  物品: [
    { name: '治疗药水', description: '恢复生命值', count: 3 },
    { name: '神秘钥匙', description: '打开某扇门', count: 1 },
  ],
  关键属性: { 力量: 10, 敏捷: 8, 智慧: 12 },
  故事事件: ['进入洞穴', '击败小怪', '获得宝物'],
  关系网: {
    '师父': { name: '张三', favor: 70, description: '教导你武艺的恩师' },
    '仇人': { name: '李四', favor: 20, description: '杀父之仇' },
  },
};

const mockPlayerStateWithSpirit: PlayerState = {
  ...mockPlayerState,
  灵力: 50,
  最大灵力: 100,
};

const mockEmptyPlayerState: PlayerState = {
  生命值: 100,
  最大生命值: 100,
  物品: [],
  关键属性: {},
  故事事件: [],
  关系网: {},
};

describe('PlayerStatePanel', () => {
  describe('rendering', () => {
    it('should render protagonist name', () => {
      render(
        <PlayerStatePanel
          state={mockPlayerState}
          protagonist="叶无痕"
        />
      );

      expect(screen.getByText('叶无痕')).toBeInTheDocument();
    });

    it('should render health bar', () => {
      render(
        <PlayerStatePanel
          state={mockPlayerState}
          protagonist="叶无痕"
        />
      );

      expect(screen.getByText('生命值')).toBeInTheDocument();
      // 检查数值显示
      expect(screen.getByText('/ 100')).toBeInTheDocument();
    });

    it('should render spirit bar when available', () => {
      render(
        <PlayerStatePanel
          state={mockPlayerStateWithSpirit}
          protagonist="叶无痕"
        />
      );

      expect(screen.getByText('灵力')).toBeInTheDocument();
    });

    it('should not render spirit bar when not available', () => {
      render(
        <PlayerStatePanel
          state={mockPlayerState}
          protagonist="叶无痕"
        />
      );

      expect(screen.queryByText('灵力')).not.toBeInTheDocument();
    });

    it('should render key attributes', () => {
      render(
        <PlayerStatePanel
          state={mockPlayerState}
          protagonist="叶无痕"
        />
      );

      expect(screen.getByText('力量')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('敏捷')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('智慧')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('should render items', () => {
      render(
        <PlayerStatePanel
          state={mockPlayerState}
          protagonist="叶无痕"
        />
      );

      expect(screen.getByText('治疗药水')).toBeInTheDocument();
      expect(screen.getByText('神秘钥匙')).toBeInTheDocument();
      expect(screen.getByText('x3')).toBeInTheDocument();
      expect(screen.getByText('x1')).toBeInTheDocument();
    });

    it('should render empty state for items', () => {
      render(
        <PlayerStatePanel
          state={mockEmptyPlayerState}
          protagonist="叶无痕"
        />
      );

      expect(screen.getByText('空空如也')).toBeInTheDocument();
    });

    it('should render section headers', () => {
      render(
        <PlayerStatePanel
          state={mockPlayerState}
          protagonist="叶无痕"
        />
      );

      expect(screen.getByText('关键属性')).toBeInTheDocument();
      expect(screen.getByText('物品背包')).toBeInTheDocument();
      expect(screen.getByText('人际关系')).toBeInTheDocument();
      expect(screen.getByText('故事足迹')).toBeInTheDocument();
    });
  });

  describe('collapsible sections', () => {
    it('should toggle relationships section', () => {
      render(
        <PlayerStatePanel
          state={mockPlayerState}
          protagonist="叶无痕"
        />
      );

      // 初始状态下，关系内容应该是隐藏的
      expect(screen.queryByText('张三')).not.toBeInTheDocument();

      // 点击展开
      const relationsButton = screen.getByText('人际关系').closest('button');
      fireEvent.click(relationsButton!);

      // 现在应该显示关系内容
      expect(screen.getByText(/张三/)).toBeInTheDocument();
      expect(screen.getByText(/李四/)).toBeInTheDocument();
    });

    it('should toggle events section', () => {
      render(
        <PlayerStatePanel
          state={mockPlayerState}
          protagonist="叶无痕"
        />
      );

      // 初始状态下，事件内容应该是隐藏的
      expect(screen.queryByText('进入洞穴')).not.toBeInTheDocument();

      // 点击展开
      const eventsButton = screen.getByText('故事足迹').closest('button');
      fireEvent.click(eventsButton!);

      // 现在应该显示事件内容
      expect(screen.getByText('进入洞穴')).toBeInTheDocument();
      expect(screen.getByText('击败小怪')).toBeInTheDocument();
      expect(screen.getByText('获得宝物')).toBeInTheDocument();
    });

    it('should show empty state for relationships', () => {
      render(
        <PlayerStatePanel
          state={mockEmptyPlayerState}
          protagonist="叶无痕"
        />
      );

      // 点击展开关系
      const relationsButton = screen.getByText('人际关系').closest('button');
      fireEvent.click(relationsButton!);

      expect(screen.getByText('暂无关系')).toBeInTheDocument();
    });

    it('should show empty state for events', () => {
      render(
        <PlayerStatePanel
          state={mockEmptyPlayerState}
          protagonist="叶无痕"
        />
      );

      // 点击展开事件
      const eventsButton = screen.getByText('故事足迹').closest('button');
      fireEvent.click(eventsButton!);

      expect(screen.getByText('冒险刚刚开始...')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty attributes', () => {
      render(
        <PlayerStatePanel
          state={mockEmptyPlayerState}
          protagonist="叶无痕"
        />
      );

      // 应该正常渲染，不崩溃
      expect(screen.getByText('叶无痕')).toBeInTheDocument();
    });
  });
});
