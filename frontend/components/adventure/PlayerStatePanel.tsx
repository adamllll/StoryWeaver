"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  Zap, 
  Briefcase, 
  ScrollText, 
  Users, 
  User,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { PlayerState, Item } from "@/lib/adventure-types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PlayerStatePanelProps {
  state: PlayerState;
  protagonist: string;
}

// ------------------------------------------------------------------
// Animated Number Component
// ------------------------------------------------------------------
function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    const start = previousValue.current;
    const end = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      // Easing: easeOutQuart
      const ease = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(start + (end - start) * ease);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
    previousValue.current = value;
  }, [value, duration]);

  return <span>{displayValue}</span>;
}

// ------------------------------------------------------------------
// Stat Bar Component
// ------------------------------------------------------------------
interface StatBarProps {
  label: string;
  value: number;
  max: number;
  color: "red" | "blue" | "green" | "purple";
  icon: React.ReactNode;
}

function StatBar({ label, value, max, color, icon }: StatBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const colorMap = {
    red: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]",
    blue: "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]",
    green: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]",
    purple: "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]",
  };

  const bgColorMap = {
    red: "bg-red-100/50",
    blue: "bg-blue-100/50",
    green: "bg-emerald-100/50",
    purple: "bg-purple-100/50",
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs font-semibold tracking-wide uppercase text-gray-500">
        <div className="flex items-center gap-1.5">
          {icon}
          <span>{label}</span>
        </div>
        <span className="font-mono text-gray-700">
          <AnimatedNumber value={value} /> / {max}
        </span>
      </div>
      <div className={`h-3 w-full rounded-full overflow-hidden ${bgColorMap[color]} shadow-inner`}>
        <motion.div
          className={`h-full rounded-full ${colorMap[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Item Card Component
// ------------------------------------------------------------------
function ItemCard({ item }: { item: Item }) {
  return (
    <motion.div 
      className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-white/60 shadow-sm backdrop-blur-md group hover:bg-white/80 transition-colors cursor-help"
      whileHover={{ scale: 1.02 }}
      layout
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
          📦
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-800">{item.name}</div>
          <div className="text-[10px] text-gray-500 truncate max-w-[120px]">{item.description}</div>
        </div>
      </div>
      <div className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-bold text-gray-600 border border-gray-200 shadow-inner">
        x{item.count}
      </div>
    </motion.div>
  );
}

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------
export function PlayerStatePanel({ state, protagonist }: PlayerStatePanelProps) {
  const [eventsOpen, setEventsOpen] = useState(false);
  const [relationsOpen, setRelationsOpen] = useState(false);

  return (
    <Card className="h-full border-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] bg-[#F9F9FB]/80 backdrop-blur-[40px] overflow-hidden flex flex-col">
      {/* Header */}
      <CardHeader className="pb-4 border-b border-gray-200/50 bg-white/40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-600 shadow-lg flex items-center justify-center text-white">
            <User className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-gray-900 tracking-tight">
              {protagonist}
            </CardTitle>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-0.5">
              冒险者状态
            </div>
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1">
        <CardContent className="space-y-8 p-6">
          
          {/* Status Bars */}
          <div className="space-y-4">
            <StatBar 
              label="生命值" 
              value={state.生命值} 
              max={state.最大生命值} 
              color="red" 
              icon={<Heart className="w-3.5 h-3.5 text-red-500" />}
            />
            
            {(state.灵力 !== undefined && state.最大灵力 !== undefined) && (
              <StatBar 
                label="灵力" 
                value={state.灵力} 
                max={state.最大灵力} 
                color="blue"
                icon={<Zap className="w-3.5 h-3.5 text-blue-500" />}
              />
            )}
          </div>

          {/* Attributes */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-gray-400" /> 关键属性
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(state.关键属性).map(([key, value]) => (
                <div key={key} className="p-3 rounded-xl bg-white border border-gray-100 shadow-sm flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">{key}</span>
                  <span className="text-sm font-bold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Briefcase className="w-3 h-3" /> 物品背包
            </h3>
            <div className="space-y-2 min-h-[60px]">
              <AnimatePresence>
                {state.物品.length > 0 ? (
                  state.物品.map((item) => (
                    <ItemCard key={item.name} item={item} />
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    空空如也
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Collapsible: Relationships */}
          <div className="space-y-1 rounded-xl overflow-hidden border border-gray-200/50 bg-white/30">
            <button 
              onClick={() => setRelationsOpen(!relationsOpen)}
              className="w-full flex items-center justify-between p-3 hover:bg-white/50 transition-colors"
            >
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-3 h-3" /> 人际关系
              </h3>
              {relationsOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            
            <AnimatePresence>
              {relationsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 pt-0 space-y-2">
                    {Object.entries(state.关系网).length > 0 ? (
                      Object.entries(state.关系网).map(([role, rel]) => (
                        <div key={role} className="p-2 rounded-lg bg-gray-50/80 border border-gray-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-gray-700">{role} · {rel.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              rel.favor >= 60 ? "bg-green-100 text-green-700" : 
                              rel.favor <= 40 ? "bg-red-100 text-red-700" : 
                              "bg-gray-100 text-gray-600"
                            }`}>
                              {rel.favor}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 leading-tight">{rel.description}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-400 text-center py-2">暂无关系</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Collapsible: Events */}
          <div className="space-y-1 rounded-xl overflow-hidden border border-gray-200/50 bg-white/30">
            <button 
              onClick={() => setEventsOpen(!eventsOpen)}
              className="w-full flex items-center justify-between p-3 hover:bg-white/50 transition-colors"
            >
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <ScrollText className="w-3 h-3" /> 故事足迹
              </h3>
              {eventsOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            
            <AnimatePresence>
              {eventsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 pt-0 space-y-2">
                    {state.故事事件.length > 0 ? (
                      state.故事事件.slice().reverse().map((event, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                          <p className="text-xs text-gray-600 leading-relaxed">{event}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-400 text-center py-2">冒险刚刚开始...</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </CardContent>
      </ScrollArea>
    </Card>
  );
}
