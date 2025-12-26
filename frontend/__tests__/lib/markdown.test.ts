/**
 * Markdown 工具函数单元测试
 * 测试 lib/markdown.ts 中的 Markdown 处理函数
 */

// Mock marked 和 DOMPurify 以避免 ESM 问题
// 注意：mock 必须在 import 之前定义
const mockSanitize = jest.fn((html: string) => {
  // 简单的 sanitize 模拟：移除 script 标签
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onerror=/gi, '')
    .replace(/onclick=/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
});

jest.mock('marked', () => ({
  marked: Object.assign(
    (text: string) => `<p>${text}</p>`,
    {
      parse: (text: string) => `<p>${text}</p>`,
      setOptions: jest.fn(),
    }
  ),
}));

jest.mock('isomorphic-dompurify', () => ({
  __esModule: true,
  default: {
    sanitize: (html: string, options?: any) => mockSanitize(html),
  },
}));

import { markdownToHtml, markdownToSafeHtml, htmlToText } from '@/lib/markdown';

describe('markdownToHtml', () => {
  it('should convert basic markdown to HTML', () => {
    const result = markdownToHtml('**粗体** 和 *斜体*');
    // 由于 mock，结果会是简单的 <p> 包裹
    expect(result).toContain('<p>');
  });

  it('should handle empty string', () => {
    expect(markdownToHtml('')).toBe('');
  });

  it('should handle null/undefined gracefully', () => {
    expect(markdownToHtml(null as unknown as string)).toBe('');
    expect(markdownToHtml(undefined as unknown as string)).toBe('');
  });

  it('should return HTML content', () => {
    const result = markdownToHtml('# 标题一');
    expect(result).toContain('<p>');
  });

  // XSS 防护测试
  describe('XSS prevention', () => {
    it('should remove script tags', () => {
      const result = markdownToHtml('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
    });

    it('should remove onclick handlers', () => {
      const result = markdownToHtml('<div onclick="alert(1)">test</div>');
      expect(result).not.toContain('onclick');
    });

    it('should remove javascript: URLs', () => {
      const result = markdownToHtml('[恶意链接](javascript:alert(1))');
      expect(result).not.toContain('javascript:');
    });

    it('should remove onerror handlers', () => {
      const result = markdownToHtml('<img src="x" onerror="alert(1)">');
      expect(result).not.toContain('onerror');
    });

    it('should remove iframe tags', () => {
      const result = markdownToHtml('<iframe src="https://evil.com"></iframe>');
      expect(result).not.toContain('<iframe');
    });
  });
});

describe('markdownToSafeHtml', () => {
  it('should be an alias for markdownToHtml (backward compatibility)', () => {
    const markdown = '**测试** 文本';
    expect(markdownToSafeHtml(markdown)).toBe(markdownToHtml(markdown));
  });

  it('should handle empty string', () => {
    expect(markdownToSafeHtml('')).toBe('');
  });
});

describe('htmlToText', () => {
  it('should strip HTML tags', () => {
    expect(htmlToText('<p>段落文本</p>')).toBe('段落文本');
    expect(htmlToText('<strong>粗体</strong>')).toBe('粗体');
    expect(htmlToText('<div><span>嵌套</span></div>')).toBe('嵌套');
  });

  it('should convert HTML entities', () => {
    // 注意：&nbsp; 转换后是空格，但 trim() 会去掉首尾空格
    expect(htmlToText('text&nbsp;here')).toBe('text here');
    expect(htmlToText('&lt;')).toBe('<');
    expect(htmlToText('&gt;')).toBe('>');
    expect(htmlToText('&amp;')).toBe('&');
  });

  it('should handle empty string', () => {
    expect(htmlToText('')).toBe('');
  });

  it('should handle null/undefined gracefully', () => {
    expect(htmlToText(null as unknown as string)).toBe('');
    expect(htmlToText(undefined as unknown as string)).toBe('');
  });

  it('should handle complex HTML', () => {
    const html = '<div><h1>标题</h1><p>段落 <strong>粗体</strong></p></div>';
    const result = htmlToText(html);
    expect(result).toContain('标题');
    expect(result).toContain('段落');
    expect(result).toContain('粗体');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('should trim whitespace', () => {
    expect(htmlToText('  <p>文本</p>  ')).toBe('文本');
  });

  it('should handle multiple entities', () => {
    expect(htmlToText('A &lt; B &amp;&amp; B &gt; C')).toBe('A < B && B > C');
  });
});
