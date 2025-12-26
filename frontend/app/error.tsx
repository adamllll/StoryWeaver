"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 记录错误到控制台（生产环境可以发送到错误追踪服务）
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* 错误图标 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mb-6"
        >
          <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
        </motion.div>

        {/* 标题和描述 */}
        <h1 className="text-2xl font-semibold text-gray-800 mb-3">
          哎呀，出错了！
        </h1>
        <p className="text-gray-500 mb-2">
          应用程序遇到了一个意外错误。
        </p>
        <p className="text-gray-400 text-sm mb-6">
          别担心，这不是你的问题。请尝试刷新页面或返回首页。
        </p>

        {/* 错误详情（开发环境显示） */}
        {process.env.NODE_ENV === "development" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 p-4 bg-gray-100 rounded-lg text-left"
          >
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Bug className="w-4 h-4" />
              <span className="text-sm font-medium">错误详情</span>
            </div>
            <p className="text-xs text-red-600 font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-gray-400 mt-2">
                错误 ID: {error.digest}
              </p>
            )}
          </motion.div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            重试
          </Button>

          <Button
            asChild
            variant="outline"
            className="border-red-200 hover:bg-red-50"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Link>
          </Button>
        </div>

        {/* 帮助提示 */}
        <p className="mt-8 text-xs text-gray-400">
          如果问题持续存在，请联系技术支持或稍后再试。
        </p>
      </motion.div>
    </div>
  );
}
