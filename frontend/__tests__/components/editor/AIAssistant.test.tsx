/**
 * AIAssistant 组件简化测试
 * 测试 components/editor/AIAssistant.tsx 的核心功能
 *
 * 注意：这是简化版测试，只覆盖渲染和基本交互
 * 完整的 API 调用测试需要更复杂的 mock 设置
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AIAssistant } from '@/components/editor/AIAssistant';

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick, ...props }: any) => (
      <div className={className} onClick={onClick} data-testid="motion-div">
        {children}
      </div>
    ),
    button: ({ children, className, onClick, disabled, ...props }: any) => (
      <button className={className} onClick={onClick} disabled={disabled} data-testid="motion-button">
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Sparkles: () => <span data-testid="icon-sparkles" />,
  Wand2: () => <span data-testid="icon-wand" />,
  FileText: () => <span data-testid="icon-file" />,
  RefreshCw: () => <span data-testid="icon-refresh" />,
  Users: () => <span data-testid="icon-users" />,
  Loader2: () => <span data-testid="icon-loader" />,
  GitBranch: () => <span data-testid="icon-branch" />,
  AlignJustify: () => <span data-testid="icon-align" />,
  Send: () => <span data-testid="icon-send" />,
  Zap: () => <span data-testid="icon-zap" />,
  MoreHorizontal: () => <span data-testid="icon-more" />,
  Eraser: () => <span data-testid="icon-eraser" />,
  CheckCircle2: () => <span data-testid="icon-check" />,
  X: () => <span data-testid="icon-x" />,
  ChevronDown: () => <span data-testid="icon-chevron" />,
}));

// Mock API
jest.mock('@/lib/api', () => ({
  aiApi: {
    continueChapter: jest.fn(),
    rewrite: jest.fn(),
    expandText: jest.fn(),
    generateBranch: jest.fn(),
    optimizeFormat: jest.fn(),
  },
  ApiError: class ApiError extends Error {
    status: number;
    detail: string;
    constructor(status: number, detail: string) {
      super(detail);
      this.status = status;
      this.detail = detail;
    }
  },
}));

// Mock useToast
const mockToast = jest.fn();
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock markdown
jest.mock('@/lib/markdown', () => ({
  markdownToHtml: (text: string) => `<p>${text}</p>`,
}));

// Mock ComparisonDialog
jest.mock('@/components/editor/ComparisonDialog', () => ({
  ComparisonDialog: ({ open, onClose }: any) =>
    open ? <div data-testid="comparison-dialog">Dialog</div> : null,
}));

// Mock Popover
jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: any) => <div>{children}</div>,
  PopoverContent: ({ children }: any) => <div data-testid="popover-content">{children}</div>,
  PopoverTrigger: ({ children }: any) => <div data-testid="popover-trigger">{children}</div>,
}));

// Mock props
const mockProps = {
  novelId: 1,
  currentChapter: {
    id: 1,
    novel_id: 1,
    title: '第一章',
    content: '这是章节内容，已经有一些文字了。',
    order_num: 1,
    word_count: 100,
    is_branch: false,
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
    navigation: {},
  },
  editorContent: '这是编辑器中的内容，已经有一些文字了。',
  onContentInsert: jest.fn(),
  onBranchGenerate: jest.fn(),
};

describe('AIAssistant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render header with title', () => {
      render(<AIAssistant {...mockProps} />);

      expect(screen.getByText('AI 创作助手')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<AIAssistant {...mockProps} />);

      // 检查主要操作按钮（默认状态下显示的）
      expect(screen.getByText('智能续写')).toBeInTheDocument();
    });

    it('should show empty state when no messages', () => {
      render(<AIAssistant {...mockProps} />);

      expect(screen.getByText(/准备好开始创作了吗/)).toBeInTheDocument();
      expect(screen.getByText(/选中编辑器中的文字/)).toBeInTheDocument();
    });

    it('should render style options', () => {
      render(<AIAssistant {...mockProps} />);

      // 检查风格选项
      expect(screen.getByText('自动推断')).toBeInTheDocument();
    });

    it('should render format optimization button', () => {
      render(<AIAssistant {...mockProps} />);

      expect(screen.getByText('优化章节格式')).toBeInTheDocument();
    });

    it('should render generate chapter button', () => {
      render(<AIAssistant {...mockProps} />);

      expect(screen.getByText('生成整章内容')).toBeInTheDocument();
    });
  });

  describe('input handling', () => {
    it('should have input field for custom prompt', () => {
      render(<AIAssistant {...mockProps} />);

      const input = screen.getByPlaceholderText(/告诉 AI 你的想法/);
      expect(input).toBeInTheDocument();
    });

    it('should update input value on change', () => {
      render(<AIAssistant {...mockProps} />);

      const input = screen.getByPlaceholderText(/告诉 AI 你的想法/) as HTMLInputElement;
      fireEvent.change(input, { target: { value: '测试输入' } });

      expect(input.value).toBe('测试输入');
    });

    it('should have send button', () => {
      render(<AIAssistant {...mockProps} />);

      expect(screen.getByTestId('icon-send')).toBeInTheDocument();
    });
  });

  describe('style selection', () => {
    it('should render all continue style options', () => {
      render(<AIAssistant {...mockProps} />);

      // 检查续写风格选项
      expect(screen.getByText('自动推断')).toBeInTheDocument();
      expect(screen.getByText('热血爽文')).toBeInTheDocument();
      expect(screen.getByText('细腻感人')).toBeInTheDocument();
    });

    it('should allow clicking style buttons', () => {
      render(<AIAssistant {...mockProps} />);

      const styleButton = screen.getByText('热血爽文');
      fireEvent.click(styleButton);

      // 按钮应该可以点击（不会抛出错误）
      expect(styleButton).toBeInTheDocument();
    });
  });

});
