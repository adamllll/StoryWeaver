/**
 * 使用 Zustand 进行全局状态管理
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, authApi, setToken, removeToken } from "./api";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean; // 新增: 标记是否已完成初始认证检查

  // 操作方法
  setUser: (user: User | null) => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isInitialized: false, // 初始为 false

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      login: async (email, password, rememberMe = true) => {
        set({ isLoading: true });
        try {
          const result = await authApi.login({ email, password, remember_me: rememberMe });
          setToken(result.token, rememberMe);
          set({
            user: result,
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (username, email, password) => {
        set({ isLoading: true });
        try {
          const result = await authApi.register({ username, email, password });
          setToken(result.token);
          set({
            user: result,
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        removeToken();
        set({ user: null, isAuthenticated: false, isInitialized: true });
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const user = await authApi.me();
          set({ user, isAuthenticated: true, isInitialized: true, isLoading: false });
        } catch {
          removeToken();
          set({ user: null, isAuthenticated: false, isInitialized: true, isLoading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ============================================
// 小说编辑器状态
// ============================================

interface EditorState {
  currentNovelId: number | null;
  currentChapterId: number | null;
  isDirty: boolean;
  content: string;

  // 操作方法
  setCurrentNovel: (novelId: number | null) => void;
  setCurrentChapter: (chapterId: number | null) => void;
  setContent: (content: string) => void;
  markClean: () => void;
}

export const useEditorStore = create<EditorState>()((set) => ({
  currentNovelId: null,
  currentChapterId: null,
  isDirty: false,
  content: "",

  setCurrentNovel: (novelId) => {
    set({ currentNovelId: novelId, currentChapterId: null, content: "", isDirty: false });
  },

  setCurrentChapter: (chapterId) => {
    set({ currentChapterId: chapterId, isDirty: false });
  },

  setContent: (content) => {
    set({ content, isDirty: true });
  },

  markClean: () => {
    set({ isDirty: false });
  },
}));

// ============================================
// UI 状态
// ============================================

interface UIState {
  sidebarOpen: boolean;
  theme: "light" | "dark" | "system";

  // 操作方法
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: "system",

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      setTheme: (theme) => {
        set({ theme });
      },
    }),
    {
      name: "ui-storage",
    }
  )
);
