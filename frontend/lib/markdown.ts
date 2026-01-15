/**
 * Markdown 渲染工具
 * 本小姐的专业配置！(￣▽￣)ノ
 */
import { marked } from 'marked';
// 移除顶层引用，防止 SSR 初始化时 jsdom 崩溃
// import DOMPurify from 'isomorphic-dompurify';

/**
 * 配置 marked 渲染器
 *
 * 安全配置：
 * - breaks: 支持 GFM 换行（GitHub Flavored Markdown）
 * - gfm: 启用 GitHub Flavored Markdown
 */
marked.setOptions({
  breaks: true,  // 将换行符转换为 <br>
  gfm: true,     // 启用 GitHub Flavored Markdown
});

/**
 * DOMPurify 安全配置
 * 允许的标签和属性
 */
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'del',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'code', 'pre',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

const ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'class'];

/**
 * 将 Markdown 文本转换为 HTML（未清理）
 * ⚠️ 不要直接在 dangerouslySetInnerHTML 中使用！
 *
 * @param markdown - Markdown 格式的文本
 * @returns HTML 字符串（未清理）
 */
function markdownToRawHtml(markdown: string): string {
  if (!markdown) return '';

  try {
    return marked.parse(markdown) as string;
  } catch (error) {
    console.error('Markdown 渲染失败:', error);
    return markdown; // 失败时返回原文本
  }
}

/**
 * 将 Markdown 文本转换为安全的 HTML
 * ✅ 可以安全地在 dangerouslySetInnerHTML 中使用
 *
 * @param markdown - Markdown 格式的文本
 * @returns 安全的 HTML 字符串（已清理）
 *
 * @example
 * ```typescript
 * const html = markdownToHtml('**粗体** 和 *斜体*');
 * // 返回: '<strong>粗体</strong> 和 <em>斜体</em>'
 * ```
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';

  const rawHtml = markdownToRawHtml(markdown);

  // 修复：在某些服务端环境（如 Next.js SSR）中，jsdom 可能会因为找不到默认样式表而崩溃
  // 使用延迟加载（Lazy Load）策略，确保只在调用时才尝试加载 DOMPurify
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const domPurifyModule = require('isomorphic-dompurify');
    const DOMPurify = domPurifyModule.default || domPurifyModule;

    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
    });
  } catch (error) {
    console.error('DOMPurify 加载或清理失败 (可能是 SSR 环境下的 jsdom 问题):', error);
    // 降级策略：避免输出未清理 HTML，改为纯文本
    return htmlToText(rawHtml);
  }
}

/**
 * @deprecated 使用 markdownToHtml 代替，它已经是安全的了
 * 这个函数保留只是为了向后兼容
 */
export function markdownToSafeHtml(markdown: string): string {
  return markdownToHtml(markdown);
}

/**
 * 从 HTML 中提取纯文本（用于预览）
 *
 * @param html - HTML 字符串
 * @returns 纯文本
 */
export function htmlToText(html: string): string {
  if (!html) return '';

  return html
    .replace(/<[^>]*>/g, '')  // 移除 HTML 标签
    .replace(/&nbsp;/g, ' ')  // 转换空格实体
    .replace(/&lt;/g, '<')    // 转换实体
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}
