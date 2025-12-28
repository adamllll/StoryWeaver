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
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "小说总数",
      value: stats?.total_novels,
      subValue: `${stats?.total_chapters || 0} 章节`,
      icon: BookOpen,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      title: "总字数",
      value: stats?.total_words ? (stats.total_words / 10000).toFixed(1) + "万" : 0,
      subValue: "全平台累计",
      icon: FileText,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      title: "冒险模式",
      value: stats?.total_adventures,
      subValue: `24h活跃: ${stats?.active_adventures_24h || 0}`,
      icon: Gamepad2,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">仪表盘</h2>
        <p className="text-gray-500 mt-2">欢迎回来，管理员。这里是平台的各项核心指标。</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <Card key={index} className="border-gray-100 bg-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${card.bg}`}>
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
                  <div className="text-2xl font-bold tracking-tight text-gray-900">{card.value}</div>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
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
