import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import WorkspacePage from '@/app/workspace/page';
import { novelsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

jest.mock('@/lib/api', () => ({
  novelsApi: {
    list: jest.fn(),
    delete: jest.fn(),
    publish: jest.fn(),
  },
  ApiError: class extends Error {
    detail: string;
    constructor(detail: string) {
      super(detail);
      this.detail = detail;
    }
  },
}));

jest.mock('@/lib/store', () => ({
  useAuthStore: jest.fn(),
}));

// Mock Data
const mockNovels = [
  {
    id: 1,
    title: '已发布小说',
    description: '这是一个已发布的测试小说',
    status: 'published',
    cover_url: null,
    chapter_count: 5,
    word_count: 10000,
    category: 'Fantasy',
    is_interactive: false,
    created_at: '2023-01-01',
    updated_at: '2023-01-02',
  },
  {
    id: 2,
    title: '草稿小说',
    description: '这是一个草稿测试小说',
    status: 'draft',
    cover_url: null,
    chapter_count: 2,
    word_count: 2000,
    category: 'Sci-Fi',
    is_interactive: true,
    created_at: '2023-01-03',
    updated_at: '2023-01-04',
  },
];

describe('WorkspacePage', () => {
  const mockCheckAuth = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Store Mock
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: { id: 1, username: 'TestUser' },
      isAuthenticated: true,
      isInitialized: true,
      checkAuth: mockCheckAuth,
    });

    // Setup API Mock
    (novelsApi.list as jest.Mock).mockResolvedValue({ novels: mockNovels });
  });

  it('renders loading state initially', async () => {
    // 模拟加载慢一点
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => { resolvePromise = resolve; });
    (novelsApi.list as jest.Mock).mockReturnValue(promise);

    render(<WorkspacePage />);
    
    expect(screen.getByText('加载中...')).toBeInTheDocument();
    
    await act(async () => {
      // @ts-ignore
      resolvePromise({ novels: [] });
    });
  });

  it('renders novels list correctly', async () => {
    render(<WorkspacePage />);

    await waitFor(() => {
      expect(screen.getByText('已发布小说')).toBeInTheDocument();
      expect(screen.getByText('草稿小说')).toBeInTheDocument();
    });

    expect(screen.getByText('共 2 部作品')).toBeInTheDocument();
  });

  it('filters novels correctly', async () => {
    render(<WorkspacePage />);

    await waitFor(() => {
      expect(screen.getByText('已发布小说')).toBeInTheDocument();
    });

    // 点击"已发布"
    fireEvent.click(screen.getByRole('button', { name: '已发布' }));

    // 应该只显示已发布的小说
    expect(screen.getByText('已发布小说')).toBeInTheDocument();
    expect(screen.queryByText('草稿小说')).not.toBeInTheDocument();
    expect(screen.getByText('共 1 部作品')).toBeInTheDocument();

    // 点击"草稿箱"
    fireEvent.click(screen.getByRole('button', { name: '草稿箱' }));

    // 应该只显示草稿
    expect(screen.queryByText('已发布小说')).not.toBeInTheDocument();
    expect(screen.getByText('草稿小说')).toBeInTheDocument();
    expect(screen.getByText('共 1 部作品')).toBeInTheDocument();

    // 点击"全部作品"
    fireEvent.click(screen.getByRole('button', { name: '全部作品' }));

    // 应该显示所有
    expect(screen.getByText('已发布小说')).toBeInTheDocument();
    expect(screen.getByText('草稿小说')).toBeInTheDocument();
    expect(screen.getByText('共 2 部作品')).toBeInTheDocument();
  });

  it('renders empty state when no novels found', async () => {
    (novelsApi.list as jest.Mock).mockResolvedValue({ novels: [] });

    render(<WorkspacePage />);

    await waitFor(() => {
      expect(screen.getByText('还没有作品')).toBeInTheDocument();
    });
  });
});
