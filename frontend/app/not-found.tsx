"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Search, BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* 404 数字动画 */}
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mb-8"
        >
          <h1 className="text-9xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            404
          </h1>
        </motion.div>

        {/* 图标 */}
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
            y: [0, -5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="mb-6"
        >
          <BookOpen className="w-16 h-16 mx-auto text-purple-400" />
        </motion.div>

        {/* 标题和描述 */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          页面走丢了
        </h2>
        <p className="text-gray-500 mb-8">
          抱歉，您访问的页面不存在或已被移动。
          <br />
          也许这个故事还没有被书写...
        </p>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            asChild
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="border-purple-200 hover:bg-purple-50"
          >
            <Link href="/novels">
              <Search className="w-4 h-4 mr-2" />
              浏览小说
            </Link>
          </Button>
        </div>

        {/* 返回上一页 */}
        <motion.button
          whileHover={{ x: -5 }}
          onClick={() => window.history.back()}
          className="mt-6 text-sm text-gray-400 hover:text-purple-600 flex items-center justify-center mx-auto transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回上一页
        </motion.button>
      </motion.div>
    </div>
  );
}
