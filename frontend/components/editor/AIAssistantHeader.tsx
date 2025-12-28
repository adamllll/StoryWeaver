/**
 * AI 助手头部组件 - Zen-iOS 重构版
 */

"use client";

import Link from "next/link";
import { Sparkles, Users, Eraser } from "lucide-react";

interface AIAssistantHeaderProps {
  novelId: number;
  onClearMessages: () => void;
}

export function AIAssistantHeader({ novelId, onClearMessages }: AIAssistantHeaderProps) {
  return (
    <header className="flex-shrink-0 h-14 flex items-center justify-between px-4 border-b border-white/40 bg-white/40 backdrop-blur-md sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20 ring-1 ring-white/50">
          <Sparkles className="w-4 h-4 text-white animate-pulse-subtle" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 leading-tight">AI 创作助手</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
            </span>
            <span className="text-[10px] text-gray-500 font-medium tracking-wide">Ready to Write</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Link href={`/workspace/${novelId}/characters`}>
          <button
            className="p-2 rounded-lg hover:bg-white/60 hover:shadow-sm text-gray-500 hover:text-purple-600 transition-all active:scale-95"
            title="角色管理"
          >
            <Users className="w-4 h-4" />
          </button>
        </Link>
        <div className="w-px h-4 bg-gray-300/50 mx-1" />
        <button
          className="p-2 rounded-lg hover:bg-white/60 hover:shadow-sm text-gray-500 hover:text-red-500 transition-all active:scale-95"
          onClick={onClearMessages}
          title="清空记录"
        >
          <Eraser className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
