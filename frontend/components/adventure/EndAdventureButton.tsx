"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAdventureStore } from "@/lib/adventure-store";
import { Sparkles, Skull, LogOut } from "lucide-react";

interface EndAdventureButtonProps {
  adventureId: number;
  disabled?: boolean;
}

export function EndAdventureButton({
  adventureId,
  disabled,
}: EndAdventureButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { finishAdventure, isLoading } = useAdventureStore();
  const { toast } = useToast();

  const endingOptions = [
    {
      type: "happy" as const,
      label: "完美结局",
      description: "AI为你创作完美的结局章节",
      icon: Sparkles,
      variant: "default" as const,
    },
    {
      type: "tragic" as const,
      label: "悲剧结局",
      description: "AI为你创作悲剧的结局章节",
      icon: Skull,
      variant: "destructive" as const,
    },
    {
      type: "user_quit" as const,
      label: "暂时离开",
      description: "保存进度，稍后可继续冒险",
      icon: LogOut,
      variant: "outline" as const,
    },
  ];

  const handleEndGame = async (
    endingType: "happy" | "tragic" | "user_quit"
  ) => {
    try {
      // 为完美结局和悲剧结局显示 AI 生成提示
      if (endingType === "happy" || endingType === "tragic") {
        toast({
          title: "AI 正在创作结局...",
          description: "这可能需要10-20秒，请稍候",
        });
      }

      await finishAdventure(adventureId, endingType);
      setShowConfirm(false);
    } catch (error) {
      // Error is already handled in the store with toast
      console.error("Failed to finish adventure:", error);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowConfirm(true)}
        disabled={disabled || isLoading}
        className="w-full mt-4"
      >
        结束冒险
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>选择结束方式</DialogTitle>
            <DialogDescription>
              你可以选择以下方式结束本次冒险
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {endingOptions.map((option) => (
              <Button
                key={option.type}
                variant={option.variant}
                className="w-full justify-start"
                onClick={() => handleEndGame(option.type)}
                disabled={isLoading}
              >
                <option.icon className="mr-2 h-4 w-4" />
                <div className="text-left flex-1">
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-xs opacity-80">{option.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
