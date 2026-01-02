"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Dices,
  Package,
  AlertTriangle,
  Lock,
  ChevronRight,
  X
} from "lucide-react";
import { Choice, PlayerState } from "@/lib/adventure-types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  choices: Choice[];
  onSelect: (choice: Choice) => void;
  playerState: PlayerState | null;
  disabled?: boolean;
}

interface ChoiceCardProps {
  choice: Choice;
  onSelect: (choice: Choice) => void;
  playerState: PlayerState | null;
  disabled?: boolean;
}

// ------------------------------------------------------------------
// Utility: Check Requirements
// ------------------------------------------------------------------
function checkRequirements(
  requirements: Record<string, string> | null,
  state: PlayerState | null
): boolean {
  if (!requirements) return true;
  if (!state) return false;

  for (const [key, condition] of Object.entries(requirements)) {
    // @ts-ignore
    const value = state[key] ?? state.关键属性?.[key];

    // 确保 condition 是字符串类型
    if (typeof condition !== 'string') continue;

    if (typeof value === 'number') {
      if (condition.includes(">=")) {
        const threshold = parseInt(condition.split(">=")[1].trim());
        if (value < threshold) return false;
      } else if (condition.includes("<=")) {
        const threshold = parseInt(condition.split("<=")[1].trim());
        if (value > threshold) return false;
      } else if (condition.includes(">")) {
        const threshold = parseInt(condition.split(">")[1].trim());
        if (value <= threshold) return false;
      } else if (condition.includes("<")) {
        const threshold = parseInt(condition.split("<")[1].trim());
        if (value >= threshold) return false;
      }
    }
  }
  return true;
}

function formatRequirements(requirements: Record<string, string> | null) {
  if (!requirements) return "";
  return Object.entries(requirements)
    .map(([k, v]) => `${k} ${v}`)
    .join(", ");
}

// ------------------------------------------------------------------
// Choice Card Component
// ------------------------------------------------------------------
function ChoiceCard({ choice, onSelect, playerState, disabled }: ChoiceCardProps) {
  const canSelect = !disabled && checkRequirements(choice.state_requirements, playerState);

  const difficultyColors = {
    "简单": "text-green-600 bg-green-50 border-green-200",
    "普通": "text-blue-600 bg-blue-50 border-blue-200",
    "困难": "text-orange-600 bg-orange-50 border-orange-200",
    "极限": "text-red-600 bg-red-50 border-red-200",
  };

  const successRateColor = 
    choice.success_rate >= 0.8 ? "text-green-600" :
    choice.success_rate >= 0.5 ? "text-amber-600" :
    "text-red-600";

  return (
    <motion.button
      whileHover={canSelect ? { y: -2, scale: 1.01 } : {}}
      whileTap={canSelect ? { scale: 0.98 } : {}}
      onClick={() => canSelect && onSelect(choice)}
      className={cn(
        "w-full text-left relative group p-5 rounded-2xl border-2 transition-all overflow-hidden mb-6 last:mb-0",
        canSelect 
          ? "bg-white/90 border-gray-100 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/10 backdrop-blur-md" 
          : "bg-gray-50/80 border-gray-200 opacity-60 cursor-not-allowed grayscale-[0.5]"
      )}
    >
      {canSelect && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-50/30 to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}

      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold font-mono shadow-sm">
            {choice.index + 1}
          </div>
          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider", difficultyColors[choice.difficulty])}>
            {choice.difficulty}
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-purple-900 transition-colors">
          {choice.text}
        </h3>

        <div className="flex gap-2 items-start p-2.5 rounded-lg bg-gray-50/80 border border-gray-100/50">
          <MessageCircle className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
          <p className="text-xs text-gray-500 italic leading-relaxed">"{choice.inner_monologue}"</p>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1 pt-3 border-t border-gray-100">
          <div className={cn("flex items-center gap-1.5 text-xs font-bold", successRateColor)}>
            <Dices className="w-3.5 h-3.5 flex-shrink-0" />
            <span>成功率 {(choice.success_rate * 100).toFixed(0)}%</span>
          </div>
          
          {choice.potential_reward && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <Package className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="break-words">{choice.potential_reward}</span>
            </div>
          )}

          {choice.potential_risk && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-red-500">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="break-words">{choice.potential_risk}</span>
            </div>
          )}
        </div>

        {!canSelect && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-100/50 backdrop-blur-[1px]">
            <div className="px-4 py-2 bg-white/90 rounded-xl shadow-lg border border-gray-200 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-bold text-gray-600">
                需要: {formatRequirements(choice.state_requirements)}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {canSelect && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          <ChevronRight className="w-6 h-6 text-purple-300" />
        </div>
      )}
    </motion.button>
  );
}

// ------------------------------------------------------------------
// Modal Container
// ------------------------------------------------------------------
export function ChoiceModal({ isOpen, onClose, choices, onSelect, playerState, disabled = false }: ChoiceModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-ios-bg/90 backdrop-blur-2xl rounded-ios-2xl shadow-2xl border border-white/40 overflow-hidden max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-white/50 backdrop-blur-md sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">命运的抉择</h2>
                <p className="text-sm text-gray-500">每一个选择都将通向不同的未来</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-200/50">
                <X className="w-5 h-5 text-gray-500" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {choices.map((choice, i) => (
                <motion.div
                  key={choice.index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <ChoiceCard 
                    choice={choice} 
                    onSelect={onSelect} 
                    playerState={playerState}
                    disabled={disabled}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
