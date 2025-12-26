/**
 * 工具函数单元测试
 * 测试 lib/utils.ts 中的纯函数
 */

import { cn, formatDate, formatRelativeTime, truncate, formatWordCount } from '@/lib/utils';

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    expect(cn('foo', true && 'bar', 'baz')).toBe('foo bar baz');
  });

  it('should dedupe Tailwind classes', () => {
    // tailwind-merge should handle conflicting classes
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle arrays and objects', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
    expect(cn({ foo: true, bar: false })).toBe('foo');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn(null, undefined)).toBe('');
  });
});

describe('formatDate', () => {
  it('should format Date object to Chinese locale', () => {
    const date = new Date('2025-01-15');
    const result = formatDate(date);
    // 中文格式: "2025年1月15日"
    expect(result).toContain('2025');
    expect(result).toContain('1');
    expect(result).toContain('15');
  });

  it('should format ISO string to Chinese locale', () => {
    const result = formatDate('2025-06-20T10:30:00Z');
    expect(result).toContain('2025');
    expect(result).toContain('6');
    expect(result).toContain('20');
  });

  it('should handle different date formats', () => {
    const result = formatDate('2024-12-25');
    expect(result).toContain('2024');
    expect(result).toContain('12');
    expect(result).toContain('25');
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    // Mock Date.now() to have consistent tests
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return "刚刚" for < 1 minute', () => {
    const date = new Date('2025-01-15T11:59:30Z'); // 30 seconds ago
    expect(formatRelativeTime(date)).toBe('刚刚');
  });

  it('should return "X 分钟前" for < 60 minutes', () => {
    const date = new Date('2025-01-15T11:30:00Z'); // 30 minutes ago
    expect(formatRelativeTime(date)).toBe('30 分钟前');
  });

  it('should return "X 小时前" for < 24 hours', () => {
    const date = new Date('2025-01-15T06:00:00Z'); // 6 hours ago
    expect(formatRelativeTime(date)).toBe('6 小时前');
  });

  it('should return "X 天前" for < 7 days', () => {
    const date = new Date('2025-01-12T12:00:00Z'); // 3 days ago
    expect(formatRelativeTime(date)).toBe('3 天前');
  });

  it('should return formatted date for >= 7 days', () => {
    const date = new Date('2025-01-01T12:00:00Z'); // 14 days ago
    const result = formatRelativeTime(date);
    // Should return formatted date instead of relative time
    expect(result).toContain('2025');
    expect(result).toContain('1');
  });

  it('should handle string input', () => {
    const result = formatRelativeTime('2025-01-15T11:55:00Z'); // 5 minutes ago
    expect(result).toBe('5 分钟前');
  });
});

describe('truncate', () => {
  it('should return original text if shorter than maxLength', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
    expect(truncate('Hi', 5)).toBe('Hi');
  });

  it('should truncate and add ellipsis if longer', () => {
    expect(truncate('Hello World', 8)).toBe('Hello...');
    expect(truncate('This is a long text', 10)).toBe('This is...');
  });

  it('should handle exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });

  it('should handle empty string', () => {
    expect(truncate('', 10)).toBe('');
  });

  it('should handle very short maxLength', () => {
    expect(truncate('Hello', 3)).toBe('...');
  });
});

describe('formatWordCount', () => {
  it('should format < 1000 as "X 字"', () => {
    expect(formatWordCount(0)).toBe('0 字');
    expect(formatWordCount(100)).toBe('100 字');
    expect(formatWordCount(999)).toBe('999 字');
  });

  it('should format 1000-9999 as "X.Xk 字"', () => {
    expect(formatWordCount(1000)).toBe('1.0k 字');
    expect(formatWordCount(1500)).toBe('1.5k 字');
    expect(formatWordCount(9999)).toBe('10.0k 字');
  });

  it('should format >= 10000 as "X.X 万字"', () => {
    expect(formatWordCount(10000)).toBe('1.0 万字');
    expect(formatWordCount(15000)).toBe('1.5 万字');
    expect(formatWordCount(100000)).toBe('10.0 万字');
  });

  it('should handle edge cases', () => {
    expect(formatWordCount(1)).toBe('1 字');
    expect(formatWordCount(10001)).toBe('1.0 万字');
  });
});
