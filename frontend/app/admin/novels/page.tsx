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
          <h2 className="text-2xl font-caveat font-bold tracking-tight text-sketch-text-primary">内容管理</h2>
          <p className="text-sm font-patrick text-sketch-text-secondary">管理平台上的所有小说作品</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-sketch-text-muted" />
          <Input
            placeholder="搜索小说标题..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            variant="sketch"
          />
        </div>
      </div>

      <div className="rounded-xl border-2 border-dashed border-sketch-text-secondary/20 bg-white shadow-sketch overflow-hidden">
        <Table>
          <TableHeader className="bg-sticky-pink-light/30">
            <TableRow>
              <TableHead className="w-[300px] font-patrick">作品信息</TableHead>
              <TableHead className="font-patrick">作者</TableHead>
              <TableHead className="font-patrick">状态</TableHead>
              <TableHead className="font-patrick">数据</TableHead>
              <TableHead className="font-patrick">更新时间</TableHead>
              <TableHead className="text-right font-patrick">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-sketch-text-secondary font-patrick">
                  加载中...
                </TableCell>
              </TableRow>
            ) : novels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-sketch-text-secondary font-patrick">
                  没有找到相关作品
                </TableCell>
              </TableRow>
            ) : (
              novels.map((novel) => (
                <TableRow key={novel.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-8 flex-shrink-0 overflow-hidden rounded-lg border-2 border-dashed border-sketch-text-secondary/20 bg-sticky-yellow-light flex items-center justify-center text-sketch-text-muted">
                        {novel.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={novel.cover_url} alt={novel.title} className="h-full w-full object-cover" />
                        ) : (
                          <BookOpen className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-patrick font-medium text-sketch-text-primary truncate max-w-[200px]" title={novel.title}>
                          {novel.title}
                        </span>
                        <Badge variant="sticky-yellow" className="w-fit text-[10px] px-1 py-0 h-4 mt-1">
                          {novel.category}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-sketch-text-primary font-patrick">{novel.author_username}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={novel.status === "published" ? "sticky-green" : "secondary"}>
                      {novel.status === "published" ? "已发布" : "草稿"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs text-sketch-text-secondary font-patrick">
                      <span>{novel.chapter_count} 章</span>
                      <span>{(novel.word_count / 10000).toFixed(1)}万 字</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sketch-text-secondary text-sm font-patrick">
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
         <div className="flex items-center justify-between px-4 py-4 border-t-2 border-dashed border-sketch-text-secondary/20 bg-sticky-pink-light/20">
          <div className="text-sm text-sketch-text-secondary font-patrick">
            显示 {(page - 1) * PAGE_SIZE + 1} 到 {Math.min(page * PAGE_SIZE, total)} 条，共 {total} 条
          </div>
          <div className="flex gap-2">
            <Button
              variant="sketch-secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              上一页
            </Button>
            <Button
              variant="sketch-secondary"
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
