"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, AdminAdventure } from "@/lib/api";
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
import { MoreHorizontal, Search, Trash2, Gamepad2 } from "lucide-react";

export default function AdventuresPage() {
  const [adventures, setAdventures] = useState<AdminAdventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [adventureToDelete, setAdventureToDelete] = useState<AdminAdventure | null>(null);
  const { toast } = useToast();
  const PAGE_SIZE = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchAdventures = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.listAdventures({
        page,
        page_size: PAGE_SIZE,
        q: debouncedSearch,
      });
      setAdventures(response.adventures);
      setTotal(response.total);
    } catch (error) {
      toast({
        title: "获取冒险列表失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, toast]);

  useEffect(() => {
    fetchAdventures();
  }, [fetchAdventures]);

  // Note: Currently no API to delete adventure in adminApi, need to add it or use client delete
  // Wait, I added batchDelete but not single delete in adminApi?
  // Let's check api.ts again. I missed adding deleteAdventure to adminApi!
  // I will use `adventureApi.delete` for now as it probably allows admin to delete too.
  // But strictly speaking I should have added `adminApi.deleteAdventure`.
  // I'll use `adminApi.batchDeleteNovels` logic for reference? No.
  // I'll assume `adventureApi.delete` works if user is admin.

  const handleDeleteAdventure = async () => {
    if (!adventureToDelete) return;
    try {
      await adminApi.deleteAdventure(adventureToDelete.id);
      
      toast({
        title: "冒险记录已删除",
        description: `《${adventureToDelete.title}》已彻底删除`,
      });
      setAdventureToDelete(null);
      fetchAdventures();
    } catch (error) {
      toast({
        title: "删除失败",
        description: "权限不足或发生错误",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-caveat font-bold tracking-tight text-sketch-text-primary">冒险管理</h2>
          <p className="text-sm font-patrick text-sketch-text-secondary">管理所有用户的冒险游戏记录</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-sketch-text-muted" />
          <Input
            placeholder="搜索冒险标题..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            variant="sketch"
          />
        </div>
      </div>

      <div className="rounded-xl border-2 border-dashed border-sketch-text-secondary/20 bg-white shadow-sketch overflow-hidden">
        <Table>
          <TableHeader className="bg-sticky-green-light/30">
            <TableRow>
              <TableHead className="w-[300px] font-patrick">冒险标题</TableHead>
              <TableHead className="font-patrick">玩家 ID</TableHead>
              <TableHead className="font-patrick">类型</TableHead>
              <TableHead className="font-patrick">状态</TableHead>
              <TableHead className="font-patrick">进度</TableHead>
              <TableHead className="font-patrick">开始时间</TableHead>
              <TableHead className="text-right font-patrick">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-sketch-text-secondary font-patrick">
                  加载中...
                </TableCell>
              </TableRow>
            ) : adventures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-sketch-text-secondary font-patrick">
                  没有找到冒险记录
                </TableCell>
              </TableRow>
            ) : (
              adventures.map((adventure) => (
                <TableRow key={adventure.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 flex-shrink-0 rounded-lg border-2 border-dashed border-sketch-text-secondary/20 bg-sticky-green flex items-center justify-center text-sketch-text-primary">
                         <Gamepad2 className="h-4 w-4" />
                      </div>
                      <span className="font-patrick font-medium text-sketch-text-primary truncate max-w-[200px]" title={adventure.title}>
                        {adventure.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-patrick font-medium text-sketch-text-primary">{adventure.player_username}</span>
                      <span className="font-mono text-[10px] text-sketch-text-muted">ID: {adventure.player_id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="sticky-yellow">
                      {adventure.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={adventure.is_finished ? "secondary" : "sticky-green"}>
                      {adventure.is_finished ? "已完结" : "进行中"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-sketch-text-secondary font-patrick">
                      <div>{adventure.total_nodes} 节点</div>
                      <div>{adventure.total_words} 字</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sketch-text-secondary text-sm font-patrick">
                    {new Date(adventure.created_at).toLocaleDateString()}
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setAdventureToDelete(adventure)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> 删除记录
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
         <div className="flex items-center justify-between px-4 py-4 border-t-2 border-dashed border-sketch-text-secondary/20 bg-sticky-green-light/20">
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

      <AlertDialog open={!!adventureToDelete} onOpenChange={(open) => !open && setAdventureToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除冒险？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除 <strong>《{adventureToDelete?.title}》</strong> 的所有进度。
              此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteAdventure}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
