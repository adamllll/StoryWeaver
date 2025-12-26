"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { StoryNode } from "@/lib/adventure-types";
import { BookOpen, MapPin, Clock } from "lucide-react";

interface ChapterSidebarProps {
  nodes: StoryNode[];
  currentNodeId: number | null;
  onSelect: (node: StoryNode) => void;
  className?: string;
}

export function ChapterSidebar({ nodes, currentNodeId, onSelect, className }: ChapterSidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to active chapter
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentNodeId, nodes]);

  return (
    <div className={cn("flex flex-col h-full bg-white/50 backdrop-blur-xl border-l border-white/60", className)}>
      <div className="p-4 border-b border-white/60 bg-white/30">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-600" />
          章节目录
        </h2>
        <p className="text-xs text-gray-500 mt-1 pl-7">
          共 {nodes.length} 章
        </p>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3 pr-3">
          {nodes.map((node, index) => {
            const isActive = node.id === currentNodeId;
            return (
              <motion.button
                key={node.id}
                ref={isActive ? activeRef : null}
                onClick={() => onSelect(node)}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all duration-200 group relative overflow-hidden",
                  isActive 
                    ? "bg-white border-purple-200 shadow-lg shadow-purple-500/10 ring-1 ring-purple-100" 
                    : "bg-white/40 border-transparent hover:bg-white/80 hover:border-gray-200 hover:shadow-sm"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
                )}
                
                <div className="flex justify-between items-start mb-1">
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-widest",
                    isActive ? "text-purple-600" : "text-gray-500 group-hover:text-gray-700"
                  )}>
                    第 {node.chapter_num} 章
                  </span>
                  {isActive && (
                    <span className="flex items-center gap-1 text-[10px] text-purple-600 font-medium bg-purple-50 px-1.5 py-0.5 rounded-full">
                      <MapPin className="w-3 h-3" /> 当前
                    </span>
                  )}
                </div>

                <h3 className={cn(
                  "text-sm font-medium line-clamp-2 leading-snug transition-colors",
                  isActive ? "text-gray-900" : "text-gray-600 group-hover:text-gray-900"
                )}>
                  {node.title || node.content.slice(0, 20) + "..."}
                </h3>
                
                <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-400">
                  <Clock className="w-3 h-3" />
                  {new Date(node.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </motion.button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
