"use client";

import { useEffect, useState } from "react";
import { adminApi, AdminStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, FileText, Gamepad2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminApi.getStats();
        setStats(response);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "总用户数",
      value: stats?.total_users,
      subValue: `24h活跃: ${stats?.active_users_24h || 0}`,
      icon: Users,
      color: "text-sketch-text-primary",
      bg: "bg-sticky-blue",
    },
    {
      title: "小说总数",
      value: stats?.total_novels,
      subValue: `${stats?.total_chapters || 0} 章节`,
      icon: BookOpen,
      color: "text-sketch-text-primary",
      bg: "bg-sticky-pink",
    },
    {
      title: "总字数",
      value: stats?.total_words ? (stats.total_words / 10000).toFixed(1) + "万" : 0,
      subValue: "全平台累计",
      icon: FileText,
      color: "text-sketch-text-primary",
      bg: "bg-sticky-yellow",
    },
    {
      title: "冒险模式",
      value: stats?.total_adventures,
      subValue: `24h活跃: ${stats?.active_adventures_24h || 0}`,
      icon: Gamepad2,
      color: "text-sketch-text-primary",
      bg: "bg-sticky-green",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-caveat font-bold tracking-tight text-sketch-text-primary">仪表盘</h2>
        <p className="text-sketch-text-secondary font-patrick mt-2">欢迎回来，管理员。这里是平台的各项核心指标。</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <Card key={index} className="border-2 border-dashed border-sketch-text-secondary/20 bg-white shadow-sketch transition-all hover:shadow-sketch-lg hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-patrick text-sketch-text-secondary">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-xl border-2 border-dashed border-sketch-text-secondary/20 ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-caveat font-bold tracking-tight text-sketch-text-primary">{card.value}</div>
                  <p className="text-xs text-sketch-text-muted font-patrick mt-1">
                    {card.subValue}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* 可以在这里添加更多图表或列表，例如"最近注册用户"或"最新发布小说" */}
    </div>
  );
}
