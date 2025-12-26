/**
 * AI 助手头部组件
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
    <header className="flex-shrink-0 h-14 flex items-center justify-between px-4 border-b border-white/40 bg-white/30 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-ios-md bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-ios-purple">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900">AI 创作助手</h2>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-gray-500 font-medium">Online</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Link href={`/workspace/${novelId}/characters`}>
          <button
            className="p-2 rounded-ios-md hover:bg-white/50 text-gray-500 hover:text-purple-600 transition-colors"
            title="角色管理"
          >
            <Users className="w-4 h-4" />
          </button>
        </Link>
        <button
          className="p-2 rounded-ios-md hover:bg-white/50 text-gray-500 hover:text-red-500 transition-colors"
          onClick={onClearMessages}
          title="清空记录"
        >
          <Eraser className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
