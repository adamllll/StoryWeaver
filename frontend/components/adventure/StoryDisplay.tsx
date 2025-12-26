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

  // 智能格式化：如果没有段落分隔，自动添加
  const formatContent = (content: string): string => {
    // 如果已经有段落分隔，直接返回
    if (content.includes('\n\n')) {
      return content;
    }

    // 否则按句号分割并每3-4句合并为一个段落
    const sentences = content.split(/([。！？])/);
    const paragraphs: string[] = [];
    let currentParagraph = '';
    let sentenceCount = 0;

    for (let i = 0; i < sentences.length; i += 2) {
      if (i + 1 < sentences.length) {
        currentParagraph += sentences[i] + sentences[i + 1];
        sentenceCount++;

        // 每3句形成一个段落
        if (sentenceCount >= 3) {
          paragraphs.push(currentParagraph.trim());
          currentParagraph = '';
          sentenceCount = 0;
        }
      }
    }

    // 添加剩余内容
    if (currentParagraph.trim()) {
      paragraphs.push(currentParagraph.trim());
    }

    return paragraphs.join('\n\n');
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
    <div className="prose prose-lg prose-gray max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-strong:text-purple-700">
      <ReactMarkdown>{displayText}</ReactMarkdown>
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
