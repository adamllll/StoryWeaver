"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { Quote } from "lucide-react";

interface StoryDisplayProps {
  content: string;
  background?: string;
  className?: string;
}

// ------------------------------------------------------------------
// Typewriter Component (Replaced with Static Fade-in)
// ------------------------------------------------------------------
function TypewriterText({ text }: { text: string }) {
  // 智能格式化：确保段落正确分隔
  const formattedText = useMemo(() => {
    let formatted = text.trim();
    
    // 预处理 1：修复加粗符号内侧的空格
    formatted = formatted.replace(/\*\*\s+([^\*]+)\s+\*\*/g, '**$1**');
    
    // 预处理 2：将全角引号、括号移到加粗符号外侧
    formatted = formatted.replace(/\*\*([“"‘'\[\(（【])(.*?)([”"’'\]\)）】])\*\*/g, '$1**$2**$3');

    // 预处理 3：【强力补丁】修复 "粗体+中文" 紧密相连时的解析问题
    // 在 "**...**" 后面如果紧跟中文，ReactMarkdown 有时会解析失败。
    // 我们在 ** 后插入一个零宽空格 (\u200B) 来辅助断词，或者干脆加个普通空格? 
    // 不，零宽空格最好。
    formatted = formatted.replace(/(\*[\*\u4e00-\u9fa5]+)/g, '$1\u200B');

    formatted = formatted.replace(/\r\n/g, '\n');
    
    // 确保段落分行
    if (formatted.includes('\n\n')) {
      formatted = formatted.replace(/\n{3,}/g, '\n\n');
    } else if (formatted.includes('\n') && formatted.length > 100) {
      formatted = formatted.replace(/\n/g, '\n\n');
    }
    
    return formatted;
  }, [text]);

  const paragraphs = useMemo(() => {
    return formattedText.split(/\n\s*\n/).filter(p => p.trim());
  }, [formattedText]);

  return (
    <div className="font-serif text-gray-800 leading-loose tracking-wide text-[1.1rem] space-y-6 pb-8 break-words">
      {paragraphs.map((paragraph, index) => (
        <motion.div
          key={`${text.substring(0, 10)}-${index}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }} // 快速交错淡入，不再等待
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // 两端对齐 + 首行缩进
              p: ({ children }) => <p className="mb-4 leading-loose indent-8 text-justify">{children}</p>,
              // 纯净加粗
              strong: ({ children }) => <strong className="font-bold text-purple-700 mx-1">{children}</strong>,
              blockquote: ({ children }) => (
                <div className="relative pl-6 py-2 my-4 border-l-4 border-purple-300 bg-purple-50/50 rounded-r-lg italic text-gray-600">
                  <Quote className="absolute top-2 left-1 w-3 h-3 text-purple-300 opacity-50" />
                  {children}
                </div>
              ),
              h1: ({ children }) => <h3 className="text-xl font-bold text-center my-6 text-gray-900">{children}</h3>,
              h2: ({ children }) => <h4 className="text-lg font-bold my-4 text-gray-800">{children}</h4>,
              ul: ({ children }) => <ul className="list-disc list-inside my-4 space-y-1 text-gray-700">{children}</ul>,
            }}
          >
            {paragraph}
          </ReactMarkdown>
        </motion.div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------
export function StoryDisplay({ content, background: _background, className }: StoryDisplayProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn("relative w-full h-full px-2", className)}
    >
      {/* 沉浸式背景光效 */}
      <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-gradient-to-b from-purple-100/30 via-transparent to-transparent blur-[80px] -z-10 pointer-events-none" />

      {/* 主内容卡片 - Zen-iOS Style */}
      {/* 增加 scrollbar-hide 类 (需要确保 tailwind 插件支持，或者使用内联样式隐藏滚动条) */}
      <div 
        className="glass rounded-ios-2xl p-6 md:p-10 shadow-ios-float border border-white/60 relative overflow-y-auto overflow-x-hidden h-full"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Firefox & IE/Edge
      >
        {/* Webkit scrollbar hiding */}
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* 顶部装饰线 */}
        <div className="sticky top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-200/50 to-transparent opacity-50 mb-4" />
        
        {/* 章节序号装饰 (Optional) */}
        <div className="absolute top-6 right-8 text-[10rem] font-serif font-bold text-gray-50/80 -z-10 select-none pointer-events-none transform translate-x-10 -translate-y-10">
          “
        </div>

        <TypewriterText text={content} />
      </div>
    </motion.div>
  );
}

