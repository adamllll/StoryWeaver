/**
 * 织梦者 - 共享类型定义
 * 从 api.ts 迁移并扩展
 */

// ============================================
// 用户相关类型
// ============================================

export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  created_at: string;
}

export interface UserWithToken extends User {
  token: string;
}

// ============================================
// 小说相关类型
// ============================================

export interface Novel {
  id: number;
  title: string;
  description?: string;
  outline?: string; // 小说大纲（AI 生成的章节概要）
  category: string;
  cover_url?: string;
  cover_image?: string; // 兼容性字段
  status: string;
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

// ============================================
// 章节相关类型
// ============================================

export interface ChapterSummary {
  id: number;
  title: string;
  order_num: number;
  word_count: number;
  is_branch: boolean;
  parent_chapter_id?: number; // 父章节 ID（用于分支）
  choice_text?: string; // 分支选择文本
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

// ============================================
// 角色相关类型
// ============================================

export type RoleType = "主角" | "女主" | "反派" | "配角" | "导师" | "其他";

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
  role_type: RoleType | null;
  description: string | null;
  created_at: string;
}

// ============================================
// AI 相关类型
// ============================================

export interface AIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * AI 生成的分支选择
 */
export interface BranchChoice {
  choice_text: string; // 选项显示文本
  inner_monologue: string; // 内心独白
  possible_outcome: string; // 可能的结局
  short_term_effects: string[]; // 短期影响
  long_term_effects: string[]; // 长期影响
  risk_level: "低" | "中" | "高"; // 风险等级
  emotion_tags: string[]; // 情感标签
  next_chapters_direction: string[]; // 下一章方向
}

/**
 * AI 分支生成结果
 */
export interface BranchGenerationResult {
  choices: BranchChoice[];
  branch_type: "短期" | "中期" | "长期";
  usage: AIUsage;
}

// ============================================
// 编辑器相关类型
// ============================================

/**
 * 保存状态
 */
export type SaveStatus = "saved" | "saving" | "unsaved";

/**
 * 编辑器设置
 */
export interface EditorSettings {
  fontSize: number; // 字体大小（px）
  lineHeight: number; // 行高
  isDark: boolean; // 深色模式
  fontFamily: "serif" | "sans" | "mono"; // 字体
}

/**
 * AI 消息
 */
export interface AIMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

// ============================================
// 组件 Props 类型
// ============================================

/**
 * 章节列表组件 Props
 */
export interface ChapterListProps {
  chapters: ChapterSummary[];
  currentChapterId: number | null;
  novelId: number;
  onChapterClick: (chapterId: number) => void;
  onChapterCreate: () => Promise<void>;
  onChapterDelete: (chapterId: number) => Promise<void>;
}

/**
 * 富文本编辑器组件 Props
 */
export interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  onWordCountChange?: (count: number) => void;
  placeholder?: string;
  className?: string;
}

/**
 * AI 助手组件 Props
 */
export interface AIAssistantProps {
  novelId: number;
  currentChapter: Chapter | null;
  editorContent: string;
  onContentInsert: (content: string, replace?: boolean) => void;
}

/**
 * 大纲面板组件 Props
 */
export interface OutlinePanelProps {
  outline: string;
}

