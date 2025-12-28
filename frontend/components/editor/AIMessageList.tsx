/**
 * AI 消息列表组件 - Zen-iOS 重构版
 */

"use client";

import { RefObject } from "react";
import { Wand2, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AIMessage } from "@/lib/types";
import { markdownToHtml } from "@/lib/markdown";
import { cn } from "@/lib/utils";

interface AIMessageListProps {
  messages: AIMessage[];
  isLoading: boolean;
  messagesEndRef: RefObject<HTMLDivElement>;
}

export function AIMessageList({ messages, isLoading, messagesEndRef }: AIMessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
      {/* 空状态 */}
      {messages.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-400"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-purple-200 rounded-full blur-xl opacity-20 animate-pulse" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-white to-purple-50 flex items-center justify-center shadow-ios-float border border-white">
              <Wand2 className="w-10 h-10 text-purple-400" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">AI 创作助手</h3>
          <p className="text-sm leading-relaxed max-w-[240px]">
            选中编辑器中的文字，或使用下方的快捷指令，让我为你寻找灵感。
          </p>
        </motion.div>
      )}

      {/* 消息列表 */}
      <AnimatePresence initial={false} mode="popLayout">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "flex w-full gap-3",
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            )}
          >
            {/* 头像 */}
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-white/50",
              msg.role === "user" 
                ? "bg-gradient-to-br from-purple-100 to-indigo-100" 
                : "bg-gradient-to-br from-teal-50 to-emerald-50"
            )}>
              {msg.role === "user" ? (
                <User className="w-4 h-4 text-purple-600" />
              ) : (
                <Bot className="w-4 h-4 text-emerald-600" />
              )}
            </div>

            {/* 气泡 */}
            <div
              className={cn(
                "max-w-[85%] px-5 py-3.5 text-sm shadow-sm relative group",
                msg.role === "user"
                  ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-purple-500/20"
                  : "bg-white/80 backdrop-blur-xl text-gray-800 rounded-2xl rounded-tl-sm border border-white/60 shadow-ios-elevated"
              )}
            >
              {msg.role === "assistant" ? (
                <div
                  className="prose prose-sm max-w-none prose-p:my-1.5 prose-p:leading-relaxed prose-headings:my-2 prose-headings:font-bold prose-headings:text-gray-800"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.content) }}
                />
              ) : (
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Loading 状态 */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start w-full gap-3"
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center shadow-sm border border-white/50">
            <Bot className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="bg-white/80 backdrop-blur-xl px-5 py-4 rounded-2xl rounded-tl-sm border border-white/60 shadow-ios-elevated flex items-center gap-1.5">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
          </div>
        </motion.div>
      )}
      <div ref={messagesEndRef} className="h-2" />
    </div>
  );
}
