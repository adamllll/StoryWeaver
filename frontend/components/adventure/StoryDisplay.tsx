"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import { cn } from "@/lib/utils";
import { Quote } from "lucide-react";

interface StoryDisplayProps {
  content: string;
  background?: string;
  className?: string;
}

// ------------------------------------------------------------------
// Typewriter Component (Paragraph-level with Motion)
// ------------------------------------------------------------------
function TypewriterText({ text }: { text: string }) {
  const [visibleCount, setVisibleCount] = useState(0);

  // 智能格式化：确保段落正确分隔
  const formatContent = (content: string): string => {
    let formatted = content.trim();
    formatted = formatted.replace(/\r\n/g, '\n');
    if (formatted.includes('\n\n')) {
      formatted = formatted.replace(/\n{3,}/g, '\n\n');
      return formatted;
    }
    formatted = formatted.replace(/\n/g, '\n\n');
    return formatted;
  };

  const paragraphs = useMemo(() =>
    formatContent(text).split('\n\n').filter(p => p.trim()),
    [text]
  );

  useEffect(() => {
    setVisibleCount(0);
    const interval = setInterval(() => {
      setVisibleCount(prev => {
        if (prev < paragraphs.length) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 400); // 稍微放慢节奏，更优雅

    return () => clearInterval(interval);
  }, [paragraphs.length]);

  return (
    <div className="font-serif text-gray-800 leading-loose tracking-wide text-[1.1rem] space-y-6">
      <AnimatePresence mode="popLayout">
        {paragraphs.slice(0, visibleCount).map((paragraph, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="text-justify indent-[2em] mb-4 leading-loose">{children}</p>,
                strong: ({ children }) => <strong className="font-bold text-purple-800 bg-purple-50 px-1 rounded mx-0.5">{children}</strong>,
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
      </AnimatePresence>
      
      {visibleCount < paragraphs.length && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center py-4"
        >
          <span className="flex gap-1">
            {[0, 1, 2].map(i => (
              <span 
                key={i} 
                className="w-1.5 h-1.5 bg-purple-300 rounded-full animate-bounce" 
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
        </motion.div>
      )}
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
      <div className="glass rounded-ios-2xl p-8 md:p-12 shadow-ios-float border border-white/60 relative overflow-hidden">
        {/* 顶部装饰线 */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-200/50 to-transparent opacity-50" />
        
        {/* 章节序号装饰 (Optional) */}
        <div className="absolute top-6 right-8 text-[10rem] font-serif font-bold text-gray-50/80 -z-10 select-none pointer-events-none transform translate-x-10 -translate-y-10">
          “
        </div>

        <TypewriterText text={content} />
      </div>
    </motion.div>
  );
}

