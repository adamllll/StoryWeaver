"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, AdminNovel } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { MoreHorizontal, Search, Trash2, Eye, EyeOff, BookOpen } from "lucide-react";

export default function NovelsPage() {
  const [novels, setNovels] = useState<AdminNovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [novelToDelete, setNovelToDelete] = useState<AdminNovel | null>(null);
  const { toast } = useToast();
  const PAGE_SIZE = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchNovels = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.listNovels({
        page,
        page_size: PAGE_SIZE,
        q: debouncedSearch,
      });
      setNovels(response.novels);
      setTotal(response.total);
    } catch (error) {
      toast({
        title: "获取小说列表失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, toast]);

  useEffect(() => {
    fetchNovels();
  }, [fetchNovels]);

  const handleUpdateStatus = async (novel: AdminNovel) => {
    try {
      const newStatus = novel.status === "published" ? "draft" : "published";
      await adminApi.updateNovelStatus(novel.id, newStatus);
      toast({
        title: newStatus === "published" ? "小说已发布" : "小说已下架",
        description: `《${novel.title}》状态已更新`,
      });
      fetchNovels();
    } catch (error) {
      toast({
        title: "操作失败",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNovel = async () => {
    if (!novelToDelete) return;
    try {
      await adminApi.deleteNovel(novelToDelete.id);
      toast({
        title: "小说已删除",
        description: `《${novelToDelete.title}》已移至回收站`,
      });
      setNovelToDelete(null);
      fetchNovels();
    } catch (error) {
      toast({
        title: "删除失败",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">内容管理</h2>
          <p className="text-sm text-gray-500">管理平台上的所有小说作品</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="搜索小说标题..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-white/50 backdrop-blur-sm border-gray-200"
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white/60 backdrop-blur-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="w-[300px]">作品信息</TableHead>
              <TableHead>作者</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>数据</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                  加载中...
                </TableCell>
              </TableRow>
            ) : novels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                  没有找到相关作品
                </TableCell>
              </TableRow>
            ) : (
              novels.map((novel) => (
                <TableRow key={novel.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-8 flex-shrink-0 overflow-hidden rounded bg-gray-100 flex items-center justify-center text-gray-400">
                        {novel.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={novel.cover_url} alt={novel.title} className="h-full w-full object-cover" />
                        ) : (
                          <BookOpen className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 truncate max-w-[200px]" title={novel.title}>
                          {novel.title}
                        </span>
                        <Badge variant="outline" className="w-fit text-[10px] px-1 py-0 h-4 mt-1 font-normal text-gray-500">
                          {novel.category}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-700">{novel.author_username}</span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={novel.status === "published" ? "default" : "secondary"}
                      className={novel.status === "published" ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600"}
                    >
                      {novel.status === "published" ? "已发布" : "草稿"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs text-gray-500">
                      <span>{novel.chapter_count} 章</span>
                      <span>{(novel.word_count / 10000).toFixed(1)}万 字</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {new Date(novel.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">打开菜单</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>操作</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(novel)}>
                          {novel.status === "published" ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" /> 下架作品
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" /> 发布作品
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setNovelToDelete(novel)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> 删除作品
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

         {/* Pagination */}
         <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100 bg-gray-50/30">
          <div className="text-sm text-gray-500">
            显示 {(page - 1) * PAGE_SIZE + 1} 到 {Math.min(page * PAGE_SIZE, total)} 条，共 {total} 条
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page * PAGE_SIZE >= total}
            >
              下一页
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={!!novelToDelete} onOpenChange={(open) => !open && setNovelToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除作品？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将把小说 <strong>《{novelToDelete?.title}》</strong> 移至回收站。
              作者将无法访问该作品，但管理员可以稍后恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteNovel}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
