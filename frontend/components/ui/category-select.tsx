/**
 * 分类选择器组件 - iOS 毛玻璃风格
 * 自定义下拉选择器，匹配网站整体设计风格
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";

interface CategoryOption {
  value: string;
  label: string;
}

interface CategorySelectProps {
  value: string;
  options: CategoryOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

export function CategorySelect({
  value,
  options,
  onChange,
  placeholder = "请选择",
  icon,
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉框
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className="relative min-w-[180px]">
      {/* 触发按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full input-glass pl-12 pr-10 text-left flex items-center justify-between
          transition-all duration-200
          ${isOpen ? "ring-2 ring-purple-400/50 shadow-lg" : ""}
        `}
      >
        {/* 左侧图标 */}
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        )}

        {/* 选中的文本 */}
        <span className="flex-1 truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        {/* 右侧箭头 */}
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* 下拉选项 */}
      {isOpen && (
        <div
          className="
            absolute z-50 w-full mt-2
            glass rounded-ios-lg shadow-xl
            border border-white/40
            overflow-hidden
            animate-in fade-in-0 zoom-in-95 duration-200
          "
        >
          <div className="max-h-[280px] overflow-y-auto custom-scrollbar py-1">
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full px-4 py-2.5 text-sm text-left
                    flex items-center justify-between
                    transition-colors duration-150
                    ${
                      isSelected
                        ? "bg-purple-100/80 text-purple-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-100/60"
                    }
                  `}
                >
                  <span>{option.label}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-purple-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
