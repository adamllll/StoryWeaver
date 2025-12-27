/**
 * Tiptap 富文本编辑器组件
 * 支持格式化、Markdown 快捷键、字数统计、AI 内容插入
 */

"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
} from "lucide-react";
import { TiptapEditorProps } from "@/lib/types";
import { useEffect, useState } from "react";
import { markdownToHtml } from "@/lib/markdown";

/**
 * 全角转半角扩展
 * 自动将中文输入法产生的全角符号（＊ ＃ －）转换为半角（* # -）
 * 解决中文输入法下 Markdown 快捷键不生效的问题
 */
const FullwidthToHalfwidth = Extension.create({
  name: "fullwidthToHalfwidth",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("fullwidthToHalfwidth"),
        props: {
          handleTextInput(view, from, to, text) {
            // 全角符号映射表
            const fullwidthMap: Record<string, string> = {
              "＊": "*",  // 全角星号 → 半角星号（粗体、斜体、列表）
              "＃": "#",  // 全角井号 → 半角井号（标题）
              "－": "-",  // 全角连字符 → 半角连字符（列表、分隔线）
              "＿": "_",  // 全角下划线 → 半角下划线（斜体）
              "｀": "`",  // 全角反引号 → 半角反引号（代码）
              "～": "~",  // 全角波浪号 → 半角波浪号（删除线）
              "＞": ">",  // 全角大于号 → 半角大于号（引用）
            };

            // 检查输入的文本是否包含全角符号
            let convertedText = text;
            let hasFullwidth = false;

            for (const [fullwidth, halfwidth] of Object.entries(fullwidthMap)) {
              if (convertedText.includes(fullwidth)) {
                convertedText = convertedText.replace(
                  new RegExp(fullwidth, "g"),
                  halfwidth
                );
                hasFullwidth = true;
              }
            }

            // 如果有全角符号，替换为半角并插入
            if (hasFullwidth) {
              const { state, dispatch } = view;
              const tr = state.tr.insertText(convertedText, from, to);
              dispatch(tr);
              return true; // 阻止默认插入行为
            }

            return false; // 使用默认插入行为
          },
        },
      }),
    ];
  },
});

export function TiptapEditor({
  content,
  onChange,
  onWordCountChange,
  placeholder = "开始你的创作...",
  className = "",
}: TiptapEditorProps) {
  const [wordCount, setWordCount] = useState(0);

  // 初始化编辑器
  const editor = useEditor({
    immediatelyRender: false, // 避免 SSR 水合错误
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      FullwidthToHalfwidth, // 全角转半角扩展（支持中文输入法）
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[400px] max-w-none font-serif leading-[2] p-6 [&_p]:mb-8 [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:my-4 [&_ol]:my-4 [&_blockquote]:my-6",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);

      // 更新字数统计（纯文本字符数）
      const text = editor.getText();
      const count = text.length;
      setWordCount(count);
      onWordCountChange?.(count);
    },
    onCreate: ({ editor }) => {
      const text = editor.getText();
      const count = text.length;
      setWordCount(count);
      onWordCountChange?.(count);
    },
  });

  // 同步外部 content 变化（用于 AI 插入内容和新章节清空）
  useEffect(() => {
    // 只有当内容真正改变时才更新，避免光标跳动或循环更新
    // 注意：content 可能是空字符串，所以使用 content !== undefined 而不是 content &&
    if (editor && content !== undefined && content !== editor.getHTML()) {
      // 特殊处理：如果 content 是空字符串，直接清空编辑器
      if (content === "") {
        editor.commands.clearContent();
        setWordCount(0);
        onWordCountChange?.(0);
        return;
      }

      // 尝试将内容作为 Markdown 转换 (marked 支持混合 HTML 和 Markdown)
      // 这解决了 AI 生成的 Markdown (如 **粗体**) 拼接到现有 HTML 后无法渲染的问题
      const htmlContent = markdownToHtml(content);

      // 保持光标位置 (如果可能) - setContent 默认会重置光标
      // 这里我们使用 emitUpdate: false 防止触发 onChange 导致循环
      editor.commands.setContent(htmlContent, { emitUpdate: false });

      // 更新字数统计
      const text = editor.getText();
      const count = text.length;
      setWordCount(count);
      onWordCountChange?.(count);
    }
  }, [content, editor, onWordCountChange]);

  // 组件卸载时销毁编辑器
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-96 glass rounded-ios-xl">
        <p className="text-gray-400">加载编辑器中...</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col glass rounded-ios-xl overflow-hidden ${className}`}>
      {/* 工具栏 */}
      <div className="border-b border-white/40 p-3 flex items-center gap-1 flex-wrap">
        {/* 标题组 */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive("heading", { level: 1 })}
            title="一级标题"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive("heading", { level: 2 })}
            title="二级标题"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive("heading", { level: 3 })}
            title="三级标题"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* 格式化组 */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="粗体 (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="斜体 (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            title="引用"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* 列表组 */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="无序列表"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="有序列表"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* 撤销/重做组 */}
        <div className="flex items-center gap-1 pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="撤销 (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="重做 (Ctrl+Shift+Z)"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* 字数统计 */}
        <div className="ml-auto text-xs text-gray-400 px-3">
          {wordCount.toLocaleString()} 字
        </div>
      </div>

      {/* 编辑器内容区域 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <EditorContent editor={editor} />
      </div>

      {/* 底部提示 */}
      <div className="border-t border-white/40 p-2 text-xs text-gray-400 text-center">
        支持 Markdown 快捷键：**粗体** *斜体* # 标题 - 列表
      </div>
    </div>
  );
}

/**
 * 工具栏按钮组件
 */
interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        w-8 h-8 rounded-ios-md flex items-center justify-center
        transition-colors
        ${
          isActive
            ? "bg-purple-100 text-purple-700"
            : "hover:bg-gray-100 text-gray-600"
        }
        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {children}
    </button>
  );
}
