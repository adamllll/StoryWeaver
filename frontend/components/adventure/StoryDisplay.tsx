"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import { cn } from "@/lib/utils";

interface StoryDisplayProps {
  content: string;
  background?: string;
  className?: string;
}

// ------------------------------------------------------------------
// Typewriter Component (Paragraph-level)
// ------------------------------------------------------------------
// 段落级Typewriter：逐段显示而非逐字符，保护Markdown完整性
function TypewriterText({ text }: { text: string }) {
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // 智能格式化：确保段落正确分隔，适配不同的AI输出格式
  const formatContent = (content: string): string => {
    // 步骤1: 清理内容，去除首尾空白
    let formatted = content.trim();

    // 步骤2: 统一换行符（处理Windows风格的\r\n）
    formatted = formatted.replace(/\r\n/g, '\n');

    // 步骤3: 处理AI可能返回的各种格式
    // 如果已经有双换行符（正确格式），保留并清理多余空行
    if (formatted.includes('\n\n')) {
      // 将3个或更多换行符压缩为2个
      formatted = formatted.replace(/\n{3,}/g, '\n\n');
      return formatted;
    }

    // 步骤4: 如果只有单换行符，需要智能处理
    // 将单个换行符转换为双换行符（让每行都成为独立段落）
    formatted = formatted.replace(/\n/g, '\n\n');

    // 步骤5: 如果连换行符都没有，尝试按句子分段
    if (!formatted.includes('\n')) {
      const sentences = formatted.match(/[^。！？.!?]+[。！？.!?]+/g) || [];

      if (sentences.length > 0) {
        // 每2-3句合并为一段
        const paragraphs: string[] = [];
        for (let i = 0; i < sentences.length; i += 3) {
          const chunk = sentences.slice(i, i + 3).join('').trim();
          if (chunk) {
            paragraphs.push(chunk);
          }
        }
        return paragraphs.join('\n\n');
      }
    }

    return formatted;
  };

  // 按双换行符分割段落，过滤空段落
  const paragraphs = useMemo(() =>
    formatContent(text).split('\n\n').filter(p => p.trim()),
    [text]
  );

  // Reset when text changes
  useEffect(() => {
    setCurrentParagraphIndex(0);
    setIsComplete(false);
  }, [text]);

  // 逐段显示动画
  useEffect(() => {
    if (isComplete) return;

    const timer = setTimeout(() => {
      if (currentParagraphIndex < paragraphs.length - 1) {
        setCurrentParagraphIndex(prev => prev + 1);
      } else {
        setIsComplete(true);
      }
    }, 300); // 每段间隔300ms

    return () => clearTimeout(timer);
  }, [currentParagraphIndex, paragraphs.length, isComplete]);

  // 显示到当前段落（段落内Markdown完整，不会被切断）
  const displayText = paragraphs.slice(0, currentParagraphIndex + 1).join('\n\n');

  return (
    <div className="prose prose-lg prose-gray max-w-none font-serif text-justify
                    prose-p:leading-relaxed prose-p:mb-4 prose-p:indent-8
                    prose-headings:font-bold prose-headings:mb-4
                    prose-strong:text-purple-700
                    [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        components={{
          // 自定义段落组件，确保段落间距
          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
        }}
      >
        {displayText}
      </ReactMarkdown>
      {!isComplete && <span className="inline-block w-2 h-5 bg-purple-500 ml-1 animate-pulse"/>}
    </div>
  );
}

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------
export function StoryDisplay({ content, background, className }: StoryDisplayProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("relative w-full max-w-3xl mx-auto mb-12", className)}
    >
      {/* Background Image/Hint (if any) */}
      {background && (
        <div className="absolute -top-20 -left-20 -right-20 h-64 bg-gradient-to-b from-purple-50 to-transparent opacity-50 blur-3xl -z-10 pointer-events-none" />
      )}

      {/* Main Content Card */}
      <div className="bg-white/50 backdrop-blur-sm rounded-[32px] p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60">
        <TypewriterText text={content} />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-purple-100 to-transparent rounded-full blur-2xl opacity-60 -z-10" />
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-gradient-to-tr from-blue-100 to-transparent rounded-full blur-2xl opacity-60 -z-10" />
    </motion.div>
  );
}
