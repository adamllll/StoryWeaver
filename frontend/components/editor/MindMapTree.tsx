/**
 * 思维导图式章节分支树 - 使用 React Flow
 * 支持拖拽、缩放、节点交互
 */

"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ChapterSummary } from "@/lib/types";
import { GitBranch, FileText } from "lucide-react";

interface MindMapTreeProps {
  chapters: ChapterSummary[];
  currentChapterId: number | null;
  onChapterClick: (chapterId: number) => void;
}

// 自定义章节节点组件
function ChapterNode({ data }: { data: any }) {
  const { chapter, isActive, onClick } = data;
  const isBranch = chapter.is_branch;

  return (
    <div
      onClick={() => onClick(chapter.id)}
      className={`
        group relative px-6 py-5 rounded-2xl cursor-pointer
        transition-all duration-300 min-w-[280px] max-w-[320px]
        hover:shadow-2xl hover:-translate-y-1
        ${
          isActive
            ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-2xl scale-105 ring-4 ring-purple-300/50"
            : isBranch
            ? "bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-400 hover:border-amber-500 shadow-lg"
            : "bg-white border-2 border-gray-200 hover:border-purple-400 shadow-md"
        }
      `}
    >
      {/* 分支标识 */}
      {isBranch && (
        <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
          <GitBranch className="w-5 h-5 text-white" />
        </div>
      )}

      {/* 选择文本 */}
      {chapter.choice_text && (
        <div
          className={`text-sm mb-3 px-3 py-2 rounded-lg font-semibold line-clamp-1 ${
            isActive
              ? "bg-white/20 text-white"
              : "bg-amber-100 text-amber-800 border border-amber-300"
          }`}
        >
          ↳ {chapter.choice_text}
        </div>
      )}

      {/* 章节标题 */}
      <h3
        className={`text-base font-bold line-clamp-2 leading-snug mb-3 ${
          isActive ? "text-white" : "text-gray-900"
        }`}
        title={chapter.title}
      >
        {chapter.title}
      </h3>

      {/* 元数据 */}
      <div
        className={`flex items-center justify-between text-sm pt-3 border-t ${
          isActive
            ? "border-white/30 text-white/90"
            : "border-gray-200 text-gray-600"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <FileText className="w-4 h-4" />
          <span className="font-medium">
            {chapter.word_count.toLocaleString()} 字
          </span>
        </div>
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  chapterNode: ChapterNode,
};

export function MindMapTree({
  chapters,
  currentChapterId,
  onChapterClick,
}: MindMapTreeProps) {
  // 构建节点和边
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    // 按层级组织章节
    const rootChapters = chapters.filter((c) => !c.parent_chapter_id);
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // 递归构建节点
    const buildNodes = (
      chapterList: ChapterSummary[],
      level: number,
      parentX: number,
      parentY: number,
      siblingIndex: number = 0
    ) => {
      chapterList.forEach((chapter, index) => {
        const childChapters = chapters.filter(
          (c) => c.parent_chapter_id === chapter.id
        );
        const hasChildren = childChapters.length > 0;

        // 计算节点位置（水平分布）
        const xOffset = (index - chapterList.length / 2) * 400;
        const x = parentX + xOffset;
        const y = parentY + level * 250;

        // 创建节点
        nodes.push({
          id: String(chapter.id),
          type: "chapterNode",
          position: { x, y },
          data: {
            chapter,
            isActive: chapter.id === currentChapterId,
            onClick: onChapterClick,
          },
        });

        // 创建边（如果有父节点）
        if (chapter.parent_chapter_id) {
          edges.push({
            id: `e${chapter.parent_chapter_id}-${chapter.id}`,
            source: String(chapter.parent_chapter_id),
            target: String(chapter.id),
            type: "smoothstep",
            animated: true,
            style: {
              stroke: chapter.is_branch ? "#f59e0b" : "#a855f7",
              strokeWidth: 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: chapter.is_branch ? "#f59e0b" : "#a855f7",
            },
          });
        }

        // 递归处理子节点
        if (hasChildren) {
          buildNodes(childChapters, level + 1, x, y, index);
        }
      });
    };

    // 从根章节开始构建
    buildNodes(rootChapters, 0, 0, 0);

    return { nodes, edges };
  }, [chapters, currentChapterId, onChapterClick]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 更新节点状态
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // 自动居中到当前章节
  const onInit = useCallback(
    (reactFlowInstance: any) => {
      if (currentChapterId) {
        const node = nodes.find((n) => n.id === String(currentChapterId));
        if (node) {
          reactFlowInstance.setCenter(
            node.position.x + 150,
            node.position.y + 100,
            { zoom: 1, duration: 800 }
          );
        }
      } else {
        reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
      }
    },
    [currentChapterId, nodes]
  );

  if (chapters.length === 0) {
    return (
      <div className="h-[600px] glass rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <GitBranch className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-gray-500 mb-2">暂无章节</p>
          <p className="text-sm text-gray-400">
            创建章节后将在此处显示思维导图
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)] glass rounded-2xl overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.3}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls
          showInteractive={false}
          className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg"
        />
        <MiniMap
          nodeColor={(node: any) => {
            if (node.data.isActive) return "#a855f7";
            if (node.data.chapter.is_branch) return "#f59e0b";
            return "#e5e7eb";
          }}
          className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg"
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}
