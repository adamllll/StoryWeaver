/**
 * 全局常量配置
 * 本小姐把所有魔法数字都整理好了！(￣▽￣)ノ
 */

/**
 * AI 生成功能的限制
 */
export const AI_GENERATION_LIMITS = {
  /** 续写功能最少需要的内容长度 */
  MIN_CONTENT_FOR_CONTINUE: 10,

  /** 生成整章功能最大允许的内容长度 */
  MAX_CONTENT_FOR_GENERATE: 100,

  /** 格式优化功能最少需要的内容长度 */
  MIN_CONTENT_FOR_OPTIMIZE: 50,

  /** 一键扩写功能最少需要的内容长度 */
  MIN_CONTENT_FOR_EXPAND: 10,

  /** 重写功能最少需要的内容长度 */
  MIN_CONTENT_FOR_REWRITE: 20,
} as const;

/**
 * 分页配置
 */
export const PAGINATION = {
  /** 小说列表每页数量 */
  NOVELS_PER_PAGE: 12,

  /** 章节列表每页数量 */
  CHAPTERS_PER_PAGE: 20,
} as const;

/**
 * 自动保存配置
 */
export const AUTO_SAVE = {
  /** 防抖延迟（毫秒） */
  DEBOUNCE_DELAY: 2000,

  /** 备份检查延迟（毫秒） */
  BACKUP_CHECK_DELAY: 500,
} as const;

/**
 * 文件大小限制
 */
export const FILE_LIMITS = {
  /** 封面图片最大大小（字节）*/
  MAX_COVER_SIZE: 5 * 1024 * 1024, // 5MB

  /** 头像图片最大大小（字节）*/
  MAX_AVATAR_SIZE: 2 * 1024 * 1024, // 2MB
} as const;

/**
 * 小说类别列表
 */
export const NOVEL_CATEGORIES = [
  { value: "", label: "全部分类" },
  { value: "玄幻", label: "玄幻" },
  { value: "言情", label: "言情" },
  { value: "科幻", label: "科幻" },
  { value: "悬疑", label: "悬疑" },
  { value: "历史", label: "历史" },
  { value: "都市", label: "都市" },
  { value: "其他", label: "其他" },
] as const;
