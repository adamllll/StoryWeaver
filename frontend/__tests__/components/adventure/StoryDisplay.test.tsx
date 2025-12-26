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

      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<StoryDisplay content="测试内容" className="custom-class" />);

      const container = screen.getByTestId('motion-div');
      expect(container).toHaveClass('custom-class');
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
    it('should show typing cursor during animation', () => {
      render(<StoryDisplay content="这是一段很长的故事内容，需要打字机效果来显示" />);

      // 在动画期间应该显示光标
      const cursor = document.querySelector('.animate-pulse');
      expect(cursor).toBeInTheDocument();
    });

    it('should complete typing after animation', () => {
      const content = '短文本';
      render(<StoryDisplay content={content} />);

      // 快进足够的时间让打字机效果完成
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // 动画完成后，光标应该消失
      const cursor = document.querySelector('.animate-pulse');
      expect(cursor).not.toBeInTheDocument();
    });

    it('should reset when content changes', () => {
      const { rerender } = render(<StoryDisplay content="第一段内容" />);

      // 等待第一段内容显示
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // 更改内容
      rerender(<StoryDisplay content="第二段内容" />);

      // 应该重新开始打字机效果，显示光标
      const cursor = document.querySelector('.animate-pulse');
      expect(cursor).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty content', () => {
      render(<StoryDisplay content="" />);

      // 应该正常渲染，不崩溃
      expect(screen.getByTestId('motion-div')).toBeInTheDocument();
    });

    it('should handle very long content', () => {
      const longContent = '这是一段非常长的内容。'.repeat(100);
      render(<StoryDisplay content={longContent} />);

      // 应该正常渲染，不崩溃
      expect(screen.getByTestId('motion-div')).toBeInTheDocument();
    });

    it('should handle markdown content', () => {
      const markdownContent = '# 标题\n\n**粗体** 和 *斜体*\n\n- 列表项1\n- 列表项2';
      render(<StoryDisplay content={markdownContent} />);

      // 等待打字机效果完成
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });
  });
});
