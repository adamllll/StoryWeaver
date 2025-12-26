/**
 * Zustand Store 单元测试
 * 测试 lib/store.ts 中的全局状态管理
 */

import { useAuthStore, useEditorStore, useUIStore } from '@/lib/store';
import { authApi, setToken, removeToken } from '@/lib/api';

// Mock API 模块
jest.mock('@/lib/api', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    me: jest.fn(),
  },
  setToken: jest.fn(),
  removeToken: jest.fn(),
}));

describe('useAuthStore', () => {
  // 在每个测试前重置 store 状态
  beforeEach(() => {
    // 重置 store 到初始状态
    useAuthStore.setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isInitialized: false,
    });
    // 清除所有 mock 调用记录
    jest.clearAllMocks();
    // 清除 localStorage
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.isInitialized).toBe(false);
    });
  });

  describe('setUser', () => {
    it('should set user and isAuthenticated to true', () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };

      useAuthStore.getState().setUser(mockUser as any);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should clear user when passed null', () => {
      // 先设置一个用户
      useAuthStore.setState({
        user: { id: 1, username: 'test' } as any,
        isAuthenticated: true,
      });

      useAuthStore.getState().setUser(null);

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    const mockLoginResponse = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      token: 'test-token',
    };

    it('should set isLoading during login', async () => {
      (authApi.login as jest.Mock).mockImplementation(() => {
        // 在 login 执行期间检查 isLoading
        expect(useAuthStore.getState().isLoading).toBe(true);
        return Promise.resolve(mockLoginResponse);
      });

      await useAuthStore.getState().login('test@example.com', 'password');
    });

    it('should update state on successful login', async () => {
      (authApi.login as jest.Mock).mockResolvedValue(mockLoginResponse);

      await useAuthStore.getState().login('test@example.com', 'password');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockLoginResponse);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isInitialized).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should call setToken with rememberMe flag', async () => {
      (authApi.login as jest.Mock).mockResolvedValue(mockLoginResponse);

      await useAuthStore.getState().login('test@example.com', 'password', true);

      expect(setToken).toHaveBeenCalledWith('test-token', true);
    });

    it('should call setToken with rememberMe=false', async () => {
      (authApi.login as jest.Mock).mockResolvedValue(mockLoginResponse);

      await useAuthStore.getState().login('test@example.com', 'password', false);

      expect(setToken).toHaveBeenCalledWith('test-token', false);
    });

    it('should throw and reset isLoading on error', async () => {
      const error = new Error('Login failed');
      (authApi.login as jest.Mock).mockRejectedValue(error);

      await expect(
        useAuthStore.getState().login('test@example.com', 'wrong-password')
      ).rejects.toThrow('Login failed');

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('register', () => {
    const mockRegisterResponse = {
      id: 1,
      username: 'newuser',
      email: 'new@example.com',
      token: 'new-token',
    };

    it('should update state on successful registration', async () => {
      (authApi.register as jest.Mock).mockResolvedValue(mockRegisterResponse);

      await useAuthStore.getState().register('newuser', 'new@example.com', 'password');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockRegisterResponse);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isInitialized).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should call setToken on successful registration', async () => {
      (authApi.register as jest.Mock).mockResolvedValue(mockRegisterResponse);

      await useAuthStore.getState().register('newuser', 'new@example.com', 'password');

      expect(setToken).toHaveBeenCalledWith('new-token');
    });

    it('should throw and reset isLoading on error', async () => {
      const error = new Error('Email already exists');
      (authApi.register as jest.Mock).mockRejectedValue(error);

      await expect(
        useAuthStore.getState().register('newuser', 'existing@example.com', 'password')
      ).rejects.toThrow('Email already exists');

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear user and call removeToken', () => {
      // 先设置登录状态
      useAuthStore.setState({
        user: { id: 1, username: 'test' } as any,
        isAuthenticated: true,
        isInitialized: true,
      });

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isInitialized).toBe(true);
      expect(removeToken).toHaveBeenCalled();
    });
  });

  describe('checkAuth', () => {
    it('should update state on successful auth check', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
      (authApi.me as jest.Mock).mockResolvedValue(mockUser);

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isInitialized).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should clear state and token on failed auth check', async () => {
      (authApi.me as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isInitialized).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(removeToken).toHaveBeenCalled();
    });
  });
});

describe('useEditorStore', () => {
  beforeEach(() => {
    // 重置 store 到初始状态
    useEditorStore.setState({
      currentNovelId: null,
      currentChapterId: null,
      isDirty: false,
      content: '',
    });
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useEditorStore.getState();
      expect(state.currentNovelId).toBeNull();
      expect(state.currentChapterId).toBeNull();
      expect(state.isDirty).toBe(false);
      expect(state.content).toBe('');
    });
  });

  describe('setCurrentNovel', () => {
    it('should set novelId and reset chapter/content', () => {
      // 先设置一些状态
      useEditorStore.setState({
        currentNovelId: 1,
        currentChapterId: 5,
        content: 'some content',
        isDirty: true,
      });

      useEditorStore.getState().setCurrentNovel(2);

      const state = useEditorStore.getState();
      expect(state.currentNovelId).toBe(2);
      expect(state.currentChapterId).toBeNull();
      expect(state.content).toBe('');
      expect(state.isDirty).toBe(false);
    });

    it('should handle null novelId', () => {
      useEditorStore.setState({ currentNovelId: 1 });

      useEditorStore.getState().setCurrentNovel(null);

      expect(useEditorStore.getState().currentNovelId).toBeNull();
    });
  });

  describe('setCurrentChapter', () => {
    it('should set chapterId and reset isDirty', () => {
      useEditorStore.setState({ isDirty: true });

      useEditorStore.getState().setCurrentChapter(10);

      const state = useEditorStore.getState();
      expect(state.currentChapterId).toBe(10);
      expect(state.isDirty).toBe(false);
    });
  });

  describe('setContent', () => {
    it('should set content and mark as dirty', () => {
      useEditorStore.getState().setContent('新内容');

      const state = useEditorStore.getState();
      expect(state.content).toBe('新内容');
      expect(state.isDirty).toBe(true);
    });
  });

  describe('markClean', () => {
    it('should set isDirty to false', () => {
      useEditorStore.setState({ isDirty: true });

      useEditorStore.getState().markClean();

      expect(useEditorStore.getState().isDirty).toBe(false);
    });
  });
});

describe('useUIStore', () => {
  beforeEach(() => {
    // 重置 store 到初始状态
    useUIStore.setState({
      sidebarOpen: true,
      theme: 'system',
    });
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useUIStore.getState();
      expect(state.sidebarOpen).toBe(true);
      expect(state.theme).toBe('system');
    });
  });

  describe('toggleSidebar', () => {
    it('should toggle sidebarOpen state', () => {
      expect(useUIStore.getState().sidebarOpen).toBe(true);

      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);

      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });
  });

  describe('setSidebarOpen', () => {
    it('should set sidebarOpen to specific value', () => {
      useUIStore.getState().setSidebarOpen(false);
      expect(useUIStore.getState().sidebarOpen).toBe(false);

      useUIStore.getState().setSidebarOpen(true);
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });
  });

  describe('setTheme', () => {
    it('should set theme to light', () => {
      useUIStore.getState().setTheme('light');
      expect(useUIStore.getState().theme).toBe('light');
    });

    it('should set theme to dark', () => {
      useUIStore.getState().setTheme('dark');
      expect(useUIStore.getState().theme).toBe('dark');
    });

    it('should set theme to system', () => {
      useUIStore.setState({ theme: 'dark' });
      useUIStore.getState().setTheme('system');
      expect(useUIStore.getState().theme).toBe('system');
    });
  });
});
