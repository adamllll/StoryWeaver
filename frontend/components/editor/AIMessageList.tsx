/**
 * AI 消息列表组件
 */

"use client";

import { RefObject } from "react";
import { Wand2, Loader2 } from "lucide-react";
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
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
          <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-4">
            <Wand2 className="w-8 h-8 text-purple-300" />
          </div>
          <p className="text-sm font-medium mb-1">准备好开始创作了吗？</p>
          <p className="text-xs">选中编辑器中的文字，或使用下方的快捷指令</p>
        </div>
      )}

      <AnimatePresence initial={false}>
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "flex w-full",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] px-4 py-3 text-sm shadow-sm",
                msg.role === "user"
                  ? "bg-purple-600 text-white rounded-2xl rounded-tr-sm"
                  : "glass text-gray-800 rounded-2xl rounded-tl-sm border-white/60"
              )}
            >
              {msg.role === "assistant" ? (
                <div
                  className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.content) }}
                />
              ) : (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-start w-full"
        >
          <div className="glass px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2 text-xs font-medium text-gray-500">
            <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
            <span>AI 正在思考...</span>
          </div>
        </motion.div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
