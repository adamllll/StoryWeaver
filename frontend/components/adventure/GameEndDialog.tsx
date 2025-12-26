"use client";

import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Adventure } from "@/lib/adventure-types";
import { Trophy, Heart, Zap, Package, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameEndDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adventure: Adventure;
  trigger: "auto" | "manual"; // 用于视觉区分
  endingContent?: string; // AI生成的结局内容（可选）
}

// 辅助组件：统计卡片
function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="text-center p-3 bg-white/50 rounded-lg border border-gray-100">
      <Icon className="h-5 w-5 mx-auto mb-1 text-primary" />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

// 辅助组件：状态项
function StateItem({
  icon: Icon,
  label,
  value,
  critical,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  critical?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-white/50 rounded border border-gray-100">
      <Icon
        className={cn(
          "h-4 w-4",
          critical ? "text-red-500" : "text-primary"
        )}
      />
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn("font-semibold", critical && "text-red-600")}>
          {value}
        </div>
      </div>
    </div>
  );
}

// 获取结束原因文本
function getEndReason(adventure: Adventure): string {
  const { final_ending, player_state } = adventure;

  if (final_ending === "game_over") {
    // 自动结束：根据玩家状态判断原因
    if (player_state.生命值 <= 0) {
      return "生命值归零，冒险就此终结";
    }
    // 检查理智值（如果存在）
    const sanity = player_state.关键属性?.["理智"];
    if (sanity !== undefined && sanity <= 0) {
      return "理智崩溃，陷入永恒的黑暗";
    }
    return "冒险遭遇了不可抗拒的命运";
  }

  // 主动结束
  if (final_ending === "happy") {
    return "你选择了光明的道路，获得了美好的结局";
  } else if (final_ending === "tragic") {
    return "你选择了接受命运的考验";
  } else if (final_ending === "user_quit") {
    return "旅程暂时告一段落，故事将被保存";
  }

  return "冒险已结束";
}

// 获取标题
function getTitle(trigger: "auto" | "manual", ending?: string | null): string {
  if (trigger === "auto") {
    return "冒险终结";
  }
  if (ending === "happy") {
    return "完美结局";
  } else if (ending === "tragic") {
    return "悲剧落幕";
  } else if (ending === "user_quit") {
    return "旅途暂停";
  }
  return "冒险完成";
}

export function GameEndDialog({
  open,
  onOpenChange,
  adventure,
  trigger,
  endingContent, // 接收AI生成的结局内容
}: GameEndDialogProps) {
  const router = useRouter();

  // 视觉主题：自动结束（红色警告）vs 主动结束（蓝色庆祝）
  const theme =
    trigger === "auto"
      ? {
          titleColor: "text-red-600",
          bgGradient: "from-red-50 to-orange-50",
        }
      : {
          titleColor: "text-blue-600",
          bgGradient: "from-blue-50 to-purple-50",
        };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleBackToList = () => {
    router.push("/adventures");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-2xl bg-gradient-to-br",
          theme.bgGradient
        )}
      >
        <DialogHeader>
          <DialogTitle className={cn("text-2xl", theme.titleColor)}>
            {getTitle(trigger, adventure.final_ending)}
          </DialogTitle>
        </DialogHeader>

        {/* 结束原因 */}
        <div className="text-center py-4">
          <p className="text-lg font-medium text-gray-800">
            {getEndReason(adventure)}
          </p>
        </div>

        {/* AI生成的结局章节（仅当是happy或tragic结局时显示） */}
        {endingContent &&
         (adventure.final_ending === "happy" || adventure.final_ending === "tragic") && (
          <>
            <div className="mt-4 p-4 bg-white/70 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                AI创作的结局
              </h3>
              <div className="prose prose-sm max-w-none text-gray-700 max-h-64 overflow-y-auto">
                <ReactMarkdown>{endingContent}</ReactMarkdown>
              </div>
            </div>
          </>
        )}

        <div className="h-px bg-gray-200 my-4" />

        {/* 游戏统计 */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
            冒险数据统计
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              icon={BookOpen}
              label="探索节点"
              value={adventure.total_nodes}
            />
            <StatCard
              icon={Trophy}
              label="做出选择"
              value={adventure.total_choices}
            />
            <StatCard
              icon={Package}
              label="创造字数"
              value={adventure.total_words}
            />
          </div>
        </div>

        <div className="h-px bg-gray-200 my-4" />

        {/* 最终状态 */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
            最终状态 - {adventure.protagonist_name}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <StateItem
              icon={Heart}
              label="生命值"
              value={`${adventure.player_state.生命值}/${adventure.player_state.最大生命值}`}
              critical={adventure.player_state.生命值 <= 0}
            />
            {adventure.player_state.灵力 !== undefined && (
              <StateItem
                icon={Zap}
                label="灵力"
                value={`${adventure.player_state.灵力}/${adventure.player_state.最大灵力 || 0}`}
              />
            )}
          </div>

          {/* 物品列表 */}
          {adventure.player_state.物品 && adventure.player_state.物品.length > 0 && (
            <div className="mt-3 p-3 bg-white/50 rounded border border-gray-100">
              <p className="text-xs font-semibold text-gray-600 mb-2">
                携带物品:
              </p>
              <div className="flex flex-wrap gap-2">
                {adventure.player_state.物品.map((item, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs"
                  >
                    <Package className="h-3 w-3" />
                    <span>
                      {item.name}
                      {item.count > 1 && ` x${item.count}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            稍后查看
          </Button>
          <Button onClick={handleBackToList} className="flex-1">
            返回冒险列表
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
