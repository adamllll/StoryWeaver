/**
 * StoryDisplay 组件单元测试
 * 测试 components/adventure/StoryDisplay.tsx
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { StoryDisplay } from '@/components/adventure/StoryDisplay';

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

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Quote: () => <span data-testid="icon-quote" />,
}));

// Mock react-markdown
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

describe('StoryDisplay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('rendering', () => {
    it('should render content', () => {
      render(<StoryDisplay content="这是一段故事内容" />);

      // 等待打字机效果完成
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // 有多个 motion-div，使用 getAllByTestId
      const motionDivs = screen.getAllByTestId('motion-div');
      expect(motionDivs.length).toBeGreaterThan(0);
    });

    it('should render with custom className', () => {
      render(<StoryDisplay content="测试内容" className="custom-class" />);

      // 获取所有 motion-div，检查是否有包含 custom-class 的
      const motionDivs = screen.getAllByTestId('motion-div');
      const hasCustomClass = motionDivs.some(div => div.classList.contains('custom-class'));
      expect(hasCustomClass).toBe(true);
    });

    it('should render background gradient when background prop is provided', () => {
      const { container } = render(
        <StoryDisplay content="测试内容" background="forest" />
      );

      // 检查背景渐变元素存在
      const gradientElement = container.querySelector('.bg-gradient-to-b');
      expect(gradientElement).toBeInTheDocument();
    });
  });

  describe('typewriter effect', () => {
    it('should show loading indicator during animation', () => {
      // 多段落内容才会显示加载指示器
      render(<StoryDisplay content="第一段内容\n\n第二段内容\n\n第三段内容" />);

      // 在动画期间应该显示加载指示器（三个弹跳的小圆点）
      const loadingDots = document.querySelector('.animate-bounce');
      expect(loadingDots).toBeInTheDocument();
    });

    it('should complete typing after animation', () => {
      const content = '短文本';
      render(<StoryDisplay content={content} />);

      // 快进足够的时间让打字机效果完成
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // 动画完成后，加载指示器应该消失
      const loadingDots = document.querySelector('.animate-bounce');
      expect(loadingDots).not.toBeInTheDocument();
    });

    it('should handle content changes', () => {
      const { rerender } = render(<StoryDisplay content="第一段\n\n第二段\n\n第三段" />);

      // 等待内容显示完成
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // 更改内容为多段落 - 组件应该正常重新渲染
      rerender(<StoryDisplay content="新第一段\n\n新第二段\n\n新第三段" />);

      // 组件应该正常渲染
      const motionDivs = screen.getAllByTestId('motion-div');
      expect(motionDivs.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty content', () => {
      render(<StoryDisplay content="" />);

      // 应该正常渲染，不崩溃
      const motionDivs = screen.getAllByTestId('motion-div');
      expect(motionDivs.length).toBeGreaterThan(0);
    });

    it('should handle very long content', () => {
      const longContent = '这是一段非常长的内容。'.repeat(100);
      render(<StoryDisplay content={longContent} />);

      // 应该正常渲染，不崩溃
      const motionDivs = screen.getAllByTestId('motion-div');
      expect(motionDivs.length).toBeGreaterThan(0);
    });

    it('should handle markdown content', () => {
      const markdownContent = '# 标题\n\n**粗体** 和 *斜体*\n\n- 列表项1\n- 列表项2';
      render(<StoryDisplay content={markdownContent} />);

      // 等待打字机效果完成
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // 有多个段落，每个段落都有 markdown-content
      const markdownElements = screen.getAllByTestId('markdown-content');
      expect(markdownElements.length).toBeGreaterThan(0);
    });
  });
});
