"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import { AdventureTreeNode } from "@/lib/api";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface AdventureBranchTreeProps {
  tree: AdventureTreeNode;
  onNodeClick?: (id: number) => void;
  height?: number;
}

interface TreeChartNode {
  name: string;
  children?: TreeChartNode[];
  itemStyle?: { color: string };
  lineStyle?: { color: string };
  meta: {
    id: number;
    player_name: string;
    category: string;
    total_nodes: number;
    total_words: number;
    is_finished: boolean;
    fork_count: number;
    fork_from_chapter?: number | null;
  };
}

const buildTreeNode = (node: AdventureTreeNode): TreeChartNode => {
  const color = node.is_finished ? "#10b981" : "#6366f1";
  const edgeColor = node.is_finished ? "#6ee7b7" : "#c7d2fe";

  return {
    name: node.title,
    itemStyle: { color },
    lineStyle: { color: edgeColor },
    meta: {
      id: node.id,
      player_name: node.player_name,
      category: node.category,
      total_nodes: node.total_nodes,
      total_words: node.total_words,
      is_finished: node.is_finished,
      fork_count: node.fork_count,
      fork_from_chapter: node.fork_from_chapter,
    },
    children: node.children?.map(buildTreeNode) ?? [],
  };
};

export function AdventureBranchTree({ tree, onNodeClick, height = 520 }: AdventureBranchTreeProps) {
  const seriesData = useMemo(() => buildTreeNode(tree), [tree]);

  const option = useMemo<EChartsOption>(() => ({
    tooltip: {
      trigger: "item",
      triggerOn: "mousemove",
      backgroundColor: "rgba(15, 23, 42, 0.92)",
      borderColor: "rgba(148, 163, 184, 0.3)",
      textStyle: {
        color: "#f8fafc",
        fontSize: 12,
      },
      formatter: (params: { data?: TreeChartNode }) => {
        const data = params.data;
        if (!data?.meta) return "";
        const meta = data.meta;
        const forkInfo = meta.fork_from_chapter
          ? `从第 ${meta.fork_from_chapter} 章分叉`
          : "原始冒险";
        const status = meta.is_finished ? "已完结" : "进行中";
        return `
          <div style="min-width: 180px; line-height: 1.6;">
            <div style="font-weight: 700; margin-bottom: 6px;">${data.name}</div>
            <div>玩家：${meta.player_name}</div>
            <div>类型：${meta.category}</div>
            <div>章节：${meta.total_nodes} 章</div>
            <div>字数：${meta.total_words.toLocaleString()} 字</div>
            <div>分叉：${meta.fork_count} 条</div>
            <div>状态：${status}</div>
            <div style="margin-top: 6px; color: rgba(226, 232, 240, 0.8);">${forkInfo}</div>
          </div>
        `;
      },
    },
    series: [
      {
        type: "tree",
        data: [seriesData],
        top: "6%",
        left: "8%",
        bottom: "6%",
        right: "24%",
        symbol: "circle",
        symbolSize: 18,
        label: {
          position: "left",
          verticalAlign: "middle",
          align: "right",
          fontSize: 12,
          color: "#0f172a",
          overflow: "truncate",
          width: 160,
        },
        leaves: {
          label: {
            position: "right",
            align: "left",
          },
        },
        lineStyle: {
          width: 2,
          curveness: 0.45,
        },
        expandAndCollapse: true,
        initialTreeDepth: 3,
        animationDuration: 550,
        animationDurationUpdate: 650,
        emphasis: {
          focus: "descendant",
        },
      },
    ],
  }), [seriesData]);

  const onEvents = useMemo(() => {
    if (!onNodeClick) return undefined;
    return {
      click: (params: { data?: TreeChartNode }) => {
        if (params.data?.meta?.id) {
          onNodeClick(params.data.meta.id);
        }
      },
    };
  }, [onNodeClick]);

  return (
    <ReactECharts
      option={option}
      style={{ height: `${height}px`, width: "100%" }}
      onEvents={onEvents}
      notMerge
      lazyUpdate
    />
  );
}
