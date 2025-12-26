"use client";

import { motion } from "framer-motion";
import {
  MessageCircle,
  Dices,
  Package,
  AlertTriangle,
  Lock,
  ChevronRight
} from "lucide-react";
import { Choice, PlayerState } from "@/lib/adventure-types";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChoiceCardsProps {
  choices: Choice[];
  onSelect: (choice: Choice) => void;
  playerState: PlayerState | null; // Null if initially loading
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
  if (!state) return false; // Can't fulfill requirements without state

  for (const [key, condition] of Object.entries(requirements)) {
    // Check key presence
    if (!(key in state.关键属性) && !(key in state)) return false;

    // Get value (prioritize direct keys then '关键属性')
    // @ts-ignore
    const value = state[key] ?? state.关键属性[key];

    // Simple numeric comparison (parsing ">=", "<=", ">", "<")
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

  // Difficulty color mapping
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
    <motion.div
      layout
      whileHover={canSelect ? { y: -4, scale: 1.01 } : {}}
      whileTap={canSelect ? { scale: 0.98 } : {}}
      onClick={() => canSelect && onSelect(choice)}
      className={cn(
        "relative group p-5 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden",
        canSelect 
          ? "bg-white/80 border-gray-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/10 backdrop-blur-md" 
          : "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed grayscale-[0.5]"
      )}
    >
      {/* Background Gradient on Hover */}
      {canSelect && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}

      <div className="relative z-10 flex flex-col gap-3">
        {/* Header: Index & Difficulty */}
        <div className="flex justify-between items-center">
          <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold font-mono">
            {choice.index + 1}
          </div>
          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider", difficultyColors[choice.difficulty])}>
            {choice.difficulty}
          </span>
        </div>

        {/* Text */}
        <h3 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-purple-900 transition-colors">
          {choice.text}
        </h3>

        {/* Monologue */}
        <div className="flex gap-2 items-start p-2.5 rounded-lg bg-gray-50/80 border border-gray-100/50">
          <MessageCircle className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
          <p className="text-xs text-gray-500 italic leading-relaxed">"{choice.inner_monologue}"</p>
        </div>

        {/* Footer Stats */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1 pt-3 border-t border-gray-100">
          <div className={cn("flex items-center gap-1.5 text-xs font-bold", successRateColor)}>
            <Dices className="w-3.5 h-3.5" />
            <span>成功率 {(choice.success_rate * 100).toFixed(0)}%</span>
          </div>
          
          {choice.potential_reward && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 cursor-help">
                    <Package className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[150px]">{choice.potential_reward}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">{choice.potential_reward}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {choice.potential_risk && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-red-500 cursor-help">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[150px]">{choice.potential_risk}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">{choice.potential_risk}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Lock Overlay */}
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
      
      {/* Right Arrow Interaction */}
      {canSelect && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          <ChevronRight className="w-6 h-6 text-purple-300" />
        </div>
      )}
    </motion.div>
  );
}

// ------------------------------------------------------------------
// Main Container
// ------------------------------------------------------------------
export function ChoiceCards({ choices, onSelect, playerState, disabled = false }: ChoiceCardsProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      },
    }),
  };

  return (
    <motion.div 
      className="grid grid-cols-1 gap-4 w-full max-w-3xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {choices.map((choice, i) => (
        <motion.div key={choice.index} variants={itemVariants} custom={i}>
          <ChoiceCard 
            choice={choice} 
            onSelect={onSelect} 
            playerState={playerState}
            disabled={disabled}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
