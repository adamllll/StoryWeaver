/**
 * 织梦者后端 API 客户端
 */

import {
  Adventure,
  CreateAdventureRequest,
  ChoiceRequest,
  ChoiceResponse,
  StoryNode,
  OpeningGenerationRequest,
  OpeningGenerationResponse,
  StoryNodeGenerationRequest,
  StoryNodeGenerationResponse
} from './adventure-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

/**
 * 自定义 API 错误类
 */
export class ApiError extends Error {
  status: number;
  detail: string;
  code?: string;      // 错误码（如 'json_parse_error', 'content_policy_violation'）
  retryable?: boolean; // 是否可重试

  constructor(status: number, detail: string, code?: string, retryable?: boolean) {
    super(detail);
    this.status = status;
    this.detail = detail;
    this.code = code;
    this.retryable = retryable;
    this.name = "ApiError";
  }
}

/**
 * 从 localStorage 或 sessionStorage 获取认证令牌
 */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  // 优先检查 localStorage（记住我），其次检查 sessionStorage
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

/**
 * 将认证令牌存储到 localStorage
 */
export function setToken(token: string, rememberMe: boolean = true): void {
  if (typeof window !== "undefined") {
    if (rememberMe) {
      localStorage.setItem("token", token);
      sessionStorage.removeItem("token");
    } else {
      sessionStorage.setItem("token", token);
      localStorage.removeItem("token");
    }
  }
}

/**
 * 从存储中移除认证令牌（同时清除 localStorage 和 sessionStorage）
 */
export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
  }
}

/**
 * 发起 API 请求
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "发生未知错误",
    }));
    // FastAPI 验证错误返回的 detail 是数组格式，需要转换为字符串
    let errorMessage: string;
    let errorCode: string | undefined;
    let retryable: boolean | undefined;

    if (Array.isArray(error.detail)) {
      // Pydantic 验证错误格式: [{type, loc, msg, input, url}, ...]
      errorMessage = error.detail
        .map((e: { msg?: string; loc?: string[] }) => e.msg || "验证错误")
        .join("; ");
    } else if (typeof error.detail === "object") {
      // 结构化错误格式: {code, message, retryable, ...}
      errorCode = error.detail.code;
      retryable = error.detail.retryable;
      errorMessage = error.detail.message || JSON.stringify(error.detail);
    } else {
      errorMessage = error.detail || "发生未知错误";
    }
    throw new ApiError(response.status, errorMessage, errorCode, retryable);
  }

  // 处理 204 无内容响应
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * API 客户端对象 - 提供便捷的请求方法
 */
export const apiClient = {
  get: <T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | null | undefined>
  ) => {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });
      const query = searchParams.toString();
      if (query) {
        url += `?${query}`;
      }
    }
    return request<T>(url, { method: "GET" });
  },

  post: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};

// ============================================
// API 类型定义
// ============================================

export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  is_admin?: boolean;
  created_at: string;
}

export interface UserWithToken extends User {
  token: string;
}

export interface Novel {
  id: number;
  title: string;
  description?: string;
  outline?: string; // 小说大纲（AI生成的章节概要）
  category: string;
  cover_url?: string; // 封面图片URL
  status: string;
  is_interactive: boolean; // 是否互动小说
  chapter_count: number;
  word_count: number;
  created_at: string;
  updated_at: string;
  author: {
    id: number;
    username: string;
    avatar?: string;
  };
}

export interface NovelDetail extends Novel {
  chapters: ChapterSummary[];
  characters: CharacterSummary[];
}

export interface ChapterSummary {
  id: number;
  title: string;
  order_num: number;
  word_count: number;
  is_branch: boolean;
  parent_chapter_id?: number;  // 分支章节的父章节ID
  choice_text?: string;        // 分支选项的文本
}

export interface CharacterSummary {
  id: number;
  name: string;
  role_type: string;
  avatar?: string;
}

export interface Character {
  id: number;
  novel_id: number;
  name: string;
  role_type: "主角" | "女主" | "反派" | "配角" | "导师" | "其他" | null;
  description: string | null;
  created_at: string;
}

export interface Chapter {
  id: number;
  novel_id: number;
  title: string;
  content: string;
  order_num: number;
  word_count: number;
  is_branch: boolean;
  parent_chapter_id?: number;
  choice_text?: string;
  created_at: string;
  updated_at: string;
  navigation: {
    prev_chapter_id?: number;
    prev_chapter_title?: string;
    next_chapter_id?: number;
    next_chapter_title?: string;
  };
  choices?: {
    chapter_id: number;
    choice_text: string;
  }[];
}

export interface AIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// ============================================
// 认证 API
// ============================================

export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    apiClient.post<UserWithToken>("/auth/register", data),

  login: (data: { email: string; password: string; remember_me?: boolean }) =>
    apiClient.post<UserWithToken>("/auth/login", data),

  me: () => apiClient.get<User>("/auth/me"),
};

// ============================================
// 小说 API
// ============================================

export const novelsApi = {
  list: (params?: {
    page?: number;
    page_size?: number;
    category?: string;
    status?: string;
    user_id?: number;
  }) => {
    return apiClient.get<{ novels: Novel[]; total: number; page: number; page_size: number }>(
      `/novels`, params
    );
  },

  get: (id: number) => apiClient.get<NovelDetail>(`/novels/${id}`),

  create: (data: {
    title: string;
    description?: string;
    category: string;
    cover_url?: string;
    outline?: string; // AI 生成的大纲
  }) => apiClient.post<NovelDetail>("/novels", data),

  update: (id: number, data: Partial<{
    title: string;
    description: string;
    category: string;
    cover_url: string;
    outline: string;
  }>) => apiClient.put<NovelDetail>(`/novels/${id}`, data),

  publish: (id: number, publish: boolean) =>
    apiClient.post<NovelDetail>(`/novels/${id}/publish`, { publish }),

  delete: (id: number) => apiClient.delete(`/novels/${id}`),
};

// ============================================
// 章节 API
// ============================================

export const chaptersApi = {
  list: (novelId: number) =>
    apiClient.get<{ novel_id: number; novel_title: string; chapters: ChapterSummary[] }>(
      `/novels/${novelId}/chapters`
    ),

  get: (novelId: number, chapterId: number) =>
    apiClient.get<Chapter>(`/novels/${novelId}/chapters/${chapterId}`),

  create: (novelId: number, data: {
    title: string;
    content?: string;
    order_num?: number;
    parent_chapter_id?: number;
    choice_text?: string;
  }) => apiClient.post<Chapter>(`/novels/${novelId}/chapters`, data),

  update: (novelId: number, chapterId: number, data: Partial<{
    title: string;
    content: string;
    choice_text: string;
  }>) => apiClient.put<Chapter>(`/novels/${novelId}/chapters/${chapterId}`, data),

  delete: (novelId: number, chapterId: number) =>
    apiClient.delete(`/novels/${novelId}/chapters/${chapterId}`),

  reorder: (novelId: number, chapterIds: number[]) =>
    apiClient.put(`/novels/${novelId}/chapters/reorder`, { chapter_ids: chapterIds }),
};

// ============================================
// AI API
// ============================================

export const aiApi = {
  // Adventure Mode AI
  generateOpening: (data: OpeningGenerationRequest) => 
    apiClient.post<OpeningGenerationResponse>("/ai/generate-opening", data),

  generateStoryNode: (data: StoryNodeGenerationRequest) =>
    apiClient.post<StoryNodeGenerationResponse>("/ai/generate-story-node", data),

  // Existing AI methods
  generateOutline: (data: {
    category: string;
    keywords: string;  // 后端期望字符串，不是数组
    chapter_count?: number;
    target_words?: number;
    target_audience?: string;
    protagonist?: string;
    background?: string;
    special_requirements?: string;
  }) => apiClient.post<{
    title: string;           // AI生成的小说标题
    description: string;     // AI生成的故事简介
    outline: string;         // 完整大纲(Markdown格式)
    usage: AIUsage;
  }>("/ai/outline", data),

  continueChapter: (data: {
    novel_id: number;
    chapter_id?: number;
    chapter_outline: string;
    word_count?: number;
    style?: string;
    special_requirements?: string;
    cursor_position?: number;  // 光标位置（字符偏移量），用于从指定位置续写
    mode?: "continue" | "generate_chapter"; // 生成模式
  }) => apiClient.post<{
    content: string;
    title: string;
    word_count: number;
    usage: AIUsage;
  }>("/ai/continue", data),

  rewrite: (data: {
    novel_id: number;
    chapter_id?: number;
    original_text: string;
    rewrite_style: string;
    special_requirements?: string;
  }) => apiClient.post<{
    rewritten_text: string;
    original_word_count: number;
    rewritten_word_count: number;
    usage: AIUsage;
    warning?: string;
  }>("/ai/rewrite", data),

  expandText: (data: {
    text: string;
    style?: "详细描写" | "动作描写" | "心理描写" | "环境描写";
    word_count?: number;
    chapter_title?: string;
    context_before?: string;
    context_after?: string;
    position_hint?: string;
  }) => apiClient.post<{
    expanded_text: string;
    word_count: number;
    usage: AIUsage;
    warning?: string;
  }>("/ai/expand", data),

  generateCharacter: (data: {
    novel_id: number;
    role_type: "主角" | "女主" | "反派" | "配角" | "导师" | "其他";
    design_direction?: string;
    character_name?: string;
  }) => apiClient.post<{
    character: {
      name: string;
      gender: string;
      age: number;
      identity: string;
      appearance: string;
      personality: string[];
      background: string;
      abilities: string;
      role_type: string;
    };
    usage: AIUsage;
  }>("/ai/character", data),

  generateBranch: (data: {
    current_scene: string;
    protagonist_status?: string;
    companion_status?: string;
    external_threat?: string;
    story_direction?: string;
  }) => apiClient.post<{
    choices: {
      choice_text: string;
      inner_monologue: string;
      possible_outcome: string;
      short_term_effects: string[];
      long_term_effects: string[];
      risk_level: "低" | "中" | "高";
      emotion_tags: string[];
      next_chapters_direction: string[];
    }[];
    branch_type: "短期" | "中期" | "长期";
    usage: AIUsage;
  }>("/ai/branch", data),

  optimizeFormat: (data: {
    chapter_id: number;
    optimization_focus?: string;
  }) => apiClient.post<{
    optimized_content: string;
    original_word_count: number;
    optimized_word_count: number;
    usage: AIUsage;
  }>("/ai/format-optimize", data),

  optimizeFormatBatch: (data: {
    novel_id: number;
    chapter_ids: number[];
    optimization_focus?: string;
  }) => apiClient.post<{
    results: {
      chapter_id: number;
      chapter_title: string;
      success: boolean;
      optimized_content?: string;
      original_word_count?: number;
      optimized_word_count?: number;
      error_message?: string;
    }[];
    success_count: number;
    failed_count: number;
    total_usage: AIUsage;
  }>("/ai/format-optimize-batch", data),
};

// ============================================
// 冒险模式 API
// ============================================

export const adventureApi = {
  create: (data: CreateAdventureRequest) =>
    apiClient.post<Adventure>("/adventures/", data),

  get: (id: number) => apiClient.get<Adventure>(`/adventures/${id}`),

  // 修复：后端直接返回数组，不是包装对象
  list: (params?: { page?: number; page_size?: number; status?: string }) =>
    apiClient.get<Adventure[]>("/adventures/", params),

  choose: (id: number, data: ChoiceRequest) =>
    apiClient.post<ChoiceResponse>(`/adventures/${id}/choose`, data),

  getNodes: (id: number) => apiClient.get<StoryNode[]>(`/adventures/${id}/nodes`),

  export: (id: number, format: 'txt' | 'pdf') =>
    request<Blob>(`/adventures/${id}/export?format=${format}`, {
      method: "GET",
      headers: {
        Accept: format === 'pdf' ? 'application/pdf' : 'text/plain'
      }
    }),

  delete: (id: number) => apiClient.delete(`/adventures/${id}`),

  // 探索社区冒险（其他用户的冒险）
  explore: (params?: { category?: string; skip?: number; limit?: number }) =>
    apiClient.get<Adventure[]>("/adventures/explore", params),

  // 获取可分叉节点
  getForkPoints: (id: number) =>
    apiClient.get<{
      adventure_id: number;
      adventure_title: string;
      total_nodes: number;
      fork_points: {
        node_id: number;
        chapter_num: number;
        title: string;
        preview: string;
        state_after: unknown;
        has_choices: boolean;
        word_count: number;
      }[];
    }>(`/adventures/${id}/fork-points`),

  // 从指定节点分叉冒险
  fork: (id: number, data: { fork_from_node_id: number }) =>
    apiClient.post<Adventure>(`/adventures/${id}/fork`, data),

  // 新增：结束冒险
  finish: (id: number, data: { ending_type: 'happy' | 'tragic' | 'user_quit' }) =>
    apiClient.post<{
      message: string;
      ending_type: string;
      novel: unknown;
    }>(`/adventures/${id}/finish`, data),
};

// ============================================
// 阅读进度 API
// ============================================

export interface ReadingProgressResponse {
  novel_id: number;
  chapter_id: number;
  chapter_title: string;
  choices_made: {
    chapter_id: number;
    choice_index: number;
    choice_text: string;
    timestamp: string;
  }[];
  endings_unlocked: string[];
  progress_percentage: number;
}

export interface ChoiceHistoryItem {
  chapter_id: number;
  chapter_title: string;
  choice_index: number;
  choice_text: string;
  timestamp: string;
}

export interface EndingInfo {
  chapter_id: number;
  chapter_title: string;
  ending_description: string;
  unlocked_at: string;
}

export const readingProgressApi = {
  // 获取阅读进度
  get: (novelId: number) =>
    apiClient.get<ReadingProgressResponse>(`/novels/${novelId}/reading-progress`),

  // 保存阅读进度
  save: (novelId: number, data: {
    chapter_id: number;
    choice_index?: number;
    choice_text?: string;
  }) => apiClient.post<ReadingProgressResponse>(`/novels/${novelId}/reading-progress`, data),

  // 清除阅读进度
  clear: (novelId: number) =>
    apiClient.delete(`/novels/${novelId}/reading-progress`),

  // 获取选择历史
  getChoiceHistory: (novelId: number) =>
    apiClient.get<{ choices: ChoiceHistoryItem[] }>(`/novels/${novelId}/choice-history`),

  // 获取所有结局
  getEndings: (novelId: number) =>
    apiClient.get<{ endings: EndingInfo[] }>(`/novels/${novelId}/endings`),
};

// ============================================
// 角色 API
// ============================================

export const charactersApi = {
  list: (novelId: number) =>
    apiClient.get<{
      novel_id: number;
      characters: Character[];
      total: number;
    }>(`/novels/${novelId}/characters`),

  get: (novelId: number, characterId: number) =>
    apiClient.get<Character>(`/novels/${novelId}/characters/${characterId}`),

  create: (novelId: number, data: {
    name: string;
    role_type?: "主角" | "女主" | "反派" | "配角" | "导师" | "其他";
    description?: string;
  }) => apiClient.post<Character>(`/novels/${novelId}/characters`, data),

  update: (novelId: number, characterId: number, data: Partial<{
    name: string;
    role_type: "主角" | "女主" | "反派" | "配角" | "导师" | "其他";
    description: string;
  }>) => apiClient.put<Character>(`/novels/${novelId}/characters/${characterId}`, data),

  delete: (novelId: number, characterId: number) =>
    apiClient.delete(`/novels/${novelId}/characters/${characterId}`),
};

// ============================================
// 世界观设定 API
// ============================================

export type WorldSettingType = "地理" | "力量体系" | "势力分布" | "历史背景" | "文化习俗" | "其他";

export interface WorldSetting {
  id: number;
  novel_id: number;
  setting_type: WorldSettingType;
  name: string;
  description?: string;
  created_at: string;
}

export const worldSettingsApi = {
  // 获取世界观设定列表
  list: (novelId: number) =>
    apiClient.get<{
      novel_id: number;
      world_settings: WorldSetting[];
      total: number;
    }>(`/novels/${novelId}/world-settings`),

  // 获取单个设定
  get: (novelId: number, settingId: number) =>
    apiClient.get<WorldSetting>(`/novels/${novelId}/world-settings/${settingId}`),

  // 创建新设定
  create: (novelId: number, data: {
    setting_type: WorldSettingType;
    name: string;
    description?: string;
  }) => apiClient.post<WorldSetting>(`/novels/${novelId}/world-settings`, data),

  // 更新设定
  update: (novelId: number, settingId: number, data: Partial<{
    setting_type: WorldSettingType;
    name: string;
    description: string;
  }>) => apiClient.put<WorldSetting>(`/novels/${novelId}/world-settings/${settingId}`, data),

  // 删除设定
  delete: (novelId: number, settingId: number) =>
    apiClient.delete(`/novels/${novelId}/world-settings/${settingId}`),
};

// ============================================
// 对话持久化 API
// ============================================

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ConversationResponse {
  id: number;
  adventure_id: number | null;
  user_id: number;
  messages: ConversationMessage[];
  created_at: string;
  updated_at: string;
}

export const conversationsApi = {
  // 获取冒险对话
  get: (adventureId: number) =>
    apiClient.get<ConversationResponse>(`/conversations/${adventureId}`),

  // 保存/更新冒险对话
  save: (adventureId: number, data: {
    messages: ConversationMessage[];
  }) => apiClient.put<ConversationResponse>(`/conversations/${adventureId}`, data),

  // 删除对话
  delete: (adventureId: number) =>
    apiClient.delete(`/conversations/${adventureId}`),

  // 获取用户所有对话
  listAll: () =>
    apiClient.get<ConversationResponse[]>("/conversations/user/all"),

  // 创建独立对话（不关联冒险）
  createStandalone: (data: {
    messages: ConversationMessage[];
  }) => apiClient.post<ConversationResponse>("/conversations/standalone", data),

  // 获取独立对话
  getStandalone: (conversationId: number) =>
    apiClient.get<ConversationResponse>(`/conversations/standalone/${conversationId}`),

  // 更新独立对话
  updateStandalone: (conversationId: number, data: {
    messages: ConversationMessage[];
  }) => apiClient.put<ConversationResponse>(`/conversations/standalone/${conversationId}`, data),

  // 关联对话到冒险
  linkToAdventure: (conversationId: number, adventureId: number) =>
    apiClient.post(`/conversations/${conversationId}/link/${adventureId}`, {}),
};

// ============================================
// 管理员 API
// ============================================

export interface AdminUser extends User {
  is_active: boolean;
  // is_admin 已经在 User 接口里定义了，这里不需要重复，或者如果必须明确，可以保留
  last_login_at?: string;
  deleted_at?: string;
}

export interface AdminStats {
  total_users: number;
  active_users_24h: number;
  total_novels: number;
  total_chapters: number;
  total_words: number;
  total_adventures: number;
  active_adventures_24h: number;
}

export const adminApi = {
  // 统计信息
  getStats: () => apiClient.get<AdminStats>("/admin/stats/overview"),
  
  // 用户管理
  listUsers: (params?: { page?: number; page_size?: number; q?: string; is_active?: boolean; include_deleted?: boolean }) =>
    apiClient.get<{ users: AdminUser[]; total: number; page: number; page_size: number }>("/admin/users", params),
  
  getUser: (id: number) => apiClient.get<AdminUser>(`/admin/users/${id}`),
  
  toggleSuperuser: (id: number, is_admin: boolean) =>
    request<AdminUser>(`/admin/users/${id}/admin`, { 
      method: "PATCH", 
      body: JSON.stringify({ is_admin }) 
    }),

  toggleUserStatus: (id: number, active: boolean) =>
    request<AdminUser>(`/admin/users/${id}/status`, { 
      method: "PATCH", 
      body: JSON.stringify({ is_active: active }) 
    }),

  deleteUser: (id: number) => apiClient.delete(`/admin/users/${id}`),
  
  restoreUser: (id: number) => apiClient.post(`/admin/users/${id}/restore`),

  // 内容管理
  listNovels: (params?: { page?: number; page_size?: number; q?: string; status?: string; include_deleted?: boolean }) =>
    apiClient.get<{ novels: AdminNovel[]; total: number; page: number; page_size: number }>("/admin/novels", params),

  listAdventures: (params?: { page?: number; page_size?: number; q?: string }) =>
    apiClient.get<{ adventures: AdminAdventure[]; total: number; page: number; page_size: number }>("/admin/adventures", params),

  updateNovelStatus: (id: number, status: string) =>
    request<Novel>(`/admin/novels/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    }),

  deleteNovel: (id: number) => apiClient.delete(`/admin/novels/${id}`),
  
  restoreNovel: (id: number) => apiClient.post(`/admin/novels/${id}/restore`),
  
  // 冒险管理
  deleteAdventure: (id: number) => apiClient.delete(`/admin/adventures/${id}`),

  // 批量操作
  batchDeleteUsers: (ids: number[]) => apiClient.post("/admin/users/batch/delete", { user_ids: ids }),
  batchDisableUsers: (ids: number[]) => apiClient.post("/admin/users/batch/disable", { user_ids: ids }),
  batchDeleteNovels: (ids: number[]) => apiClient.post("/admin/novels/batch/delete", { novel_ids: ids }),

  // 系统配置
  getEnv: () => apiClient.get<{ items: EnvConfigItem[]; env_file_path: string }>("/admin/env"),
  updateEnv: (key: string, value: string) => 
    request<EnvConfigItem>("/admin/env", {
      method: "PATCH",
      body: JSON.stringify({ key, value })
    }),
};

export interface EnvConfigItem {
  key: string;
  value: string;
  is_secret: boolean;
  description: string;
}

export interface AdminNovel {
  id: number;
  title: string;
  description?: string;
  category: string;
  status: string;
  is_interactive: boolean;
  chapter_count: number;
  word_count: number;
  author_id: number;
  author_username: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  cover_url?: string;
}

export interface AdminAdventure {
  id: number;
  title: string;
  category: string;
  protagonist_name: string;
  is_finished: boolean;
  total_nodes: number;
  total_words: number;
  player_id: number;
  player_username: string;
  created_at: string;
  updated_at: string;
}
