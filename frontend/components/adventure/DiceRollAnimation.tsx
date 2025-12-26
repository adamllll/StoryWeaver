"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dices, CheckCircle, XCircle, Sparkles, Skull } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiceRollAnimationProps {
  rollValue: number;     // 1-100
  target: number;
  success: boolean;
  onComplete: () => void;
}

export function DiceRollAnimation({ rollValue, target, success, onComplete }: DiceRollAnimationProps) {
  const [randomValue, setRandomValue] = useState(1);
  const [isRolling, setIsRolling] = useState(true);
  const [showTarget, setShowTarget] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Determine Critical Success/Failure
  const isCriticalSuccess = rollValue <= 5; // D100 system often treats low as good, or check game rules. 
                                            // Assuming "roll under target" usually. 
                                            // The plan said "rollValue <= 5 ? 大成功".
  const isCriticalFailure = rollValue >= 96;

  useEffect(() => {
    // Phase 1: Rolling (1.0s)
    const rollInterval = setInterval(() => {
      setRandomValue(Math.floor(Math.random() * 100) + 1);
    }, 40);

    const timer1 = setTimeout(() => {
      clearInterval(rollInterval);
      setIsRolling(false);
    }, 1000);

    // Phase 2: Show Target (1.5s)
    const timer2 = setTimeout(() => {
      setShowTarget(true);
    }, 1500);

    // Phase 3: Show Result (2.0s)
    const timer3 = setTimeout(() => {
      setShowResult(true);
    }, 2000);

    // Phase 4: Complete (3.5s)
    const timer4 = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => {
      clearInterval(rollInterval);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [rollValue, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-md"
    >
      <div className="relative w-full max-w-md mx-4">
        
        {/* Main Card */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            "bg-white rounded-[40px] shadow-2xl p-12 text-center border overflow-hidden relative",
            showResult && success && "border-green-200 shadow-[0_20px_50px_rgba(16,185,129,0.3)]",
            showResult && !success && "border-red-200 shadow-[0_20px_50px_rgba(239,68,68,0.3)]",
            !showResult && "border-gray-200"
          )}
        >
          {/* Background Effects */}
          {showResult && isCriticalSuccess && (
            <div className="absolute inset-0 bg-gradient-to-tr from-yellow-100/50 to-green-100/50 animate-pulse" />
          )}
          
          <div className="relative z-10 flex flex-col items-center">
            
            {/* Dice Icon */}
            <motion.div
              animate={isRolling ? { rotate: 360 } : { rotate: 0 }}
              transition={isRolling ? { repeat: Infinity, duration: 0.5, ease: "linear" } : { type: "spring" }}
              className="mb-8"
            >
               <Dices className={cn(
                 "w-16 h-16",
                 isRolling ? "text-gray-400" :
                 showResult && success ? "text-green-500" :
                 showResult && !success ? "text-red-500" : "text-gray-800"
               )} />
            </motion.div>

            {/* Roll Value */}
            <div className="relative mb-6">
              <motion.div 
                className={cn(
                  "text-8xl font-black font-mono tracking-tighter",
                  isRolling ? "text-gray-300 blur-sm" : 
                  showResult && success ? "text-green-600 drop-shadow-sm" :
                  showResult && !success ? "text-red-600 drop-shadow-sm" : "text-gray-900"
                )}
                key={isRolling ? randomValue : rollValue}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {isRolling ? randomValue : rollValue}
              </motion.div>
              
              {!isRolling && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -right-8 top-0 text-xs font-bold text-gray-400 uppercase tracking-widest"
                >
                  ROLL
                </motion.div>
              )}
            </div>

            {/* Target Value */}
            <div className="h-12">
              <AnimatePresence>
                {showTarget && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-gray-500 font-medium"
                  >
                    <span>目标值</span>
                    <span className="text-xl font-bold text-gray-800">{target}</span>
                    <span className="text-xs text-gray-400">(需要 ≤ {target})</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Result Banner */}
            <div className="h-16 mt-4">
              <AnimatePresence>
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 rounded-full border-2",
                      success 
                        ? "bg-green-50 border-green-200 text-green-700" 
                        : "bg-red-50 border-red-200 text-red-700"
                    )}
                  >
                    {success ? (
                      isCriticalSuccess ? <Sparkles className="w-5 h-5 text-yellow-500" /> : <CheckCircle className="w-5 h-5" />
                    ) : (
                      isCriticalFailure ? <Skull className="w-5 h-5" /> : <XCircle className="w-5 h-5" />
                    )}
                    <span className="text-lg font-bold">
                      {isCriticalSuccess ? "大成功！🎉" :
                       isCriticalFailure ? "大失败！💀" :
                       success ? "判定成功" : "判定失败"}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
