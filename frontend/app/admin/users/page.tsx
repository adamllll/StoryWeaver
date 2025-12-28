"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, AdminUser } from "@/lib/api";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { MoreHorizontal, Search, Shield, ShieldAlert, UserX, UserCheck, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const { toast } = useToast();
  const PAGE_SIZE = 10;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.listUsers({
        page,
        page_size: PAGE_SIZE,
        q: debouncedSearch,
      });
      setUsers(response.users);
      setTotal(response.total);
    } catch (error) {
      toast({
        title: "获取用户列表失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user: AdminUser) => {
    try {
      const newStatus = !user.is_active;
      await adminApi.toggleUserStatus(user.id, newStatus);
      toast({
        title: newStatus ? "用户已启用" : "用户已禁用",
        description: `${user.username} 的状态已更新`,
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: "操作失败",
        description: "无法更新用户状态",
        variant: "destructive",
      });
    }
  };

  const handleToggleSuperuser = async (user: AdminUser) => {
    try {
      const newStatus = !user.is_admin;
      await adminApi.toggleSuperuser(user.id, newStatus);
      toast({
        title: newStatus ? "已设为管理员" : "已取消管理员",
        description: `${user.username} 的权限已更新`,
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: "操作失败",
        description: "无法更新用户权限",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await adminApi.deleteUser(userToDelete.id);
      toast({
        title: "用户已删除",
        description: `${userToDelete.username} 已被移至回收站`,
      });
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      toast({
        title: "删除失败",
        description: "无法删除用户",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">用户管理</h2>
          <p className="text-sm text-gray-500">管理所有注册用户及其权限</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="搜索用户..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-white/50 backdrop-blur-sm border-gray-200"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white/60 backdrop-blur-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="w-[250px]">用户</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>最后登录</TableHead>
              <TableHead>注册时间</TableHead>
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
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                  没有找到用户
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{user.username}</span>
                        <span className="text-xs text-gray-500">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "outline" : "destructive"} className={user.is_active ? "bg-green-50 text-green-700 border-green-200" : ""}>
                      {user.is_active ? "正常" : "禁用"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.is_admin ? (
                      <Badge variant="default" className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200">
                        <Shield className="w-3 h-3 mr-1" /> 管理员
                      </Badge>
                    ) : (
                      <span className="text-sm text-gray-500">普通用户</span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {user.last_login_at
                      ? formatDistanceToNow(new Date(user.last_login_at.endsWith("Z") ? user.last_login_at : user.last_login_at + "Z"), { addSuffix: true, locale: zhCN })
                      : "从未登录"}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
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
                        <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                          {user.is_active ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" /> 禁用账户
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" /> 启用账户
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleSuperuser(user)}>
                          {user.is_admin ? (
                            <>
                              <ShieldAlert className="mr-2 h-4 w-4" /> 取消管理员
                            </>
                          ) : (
                            <>
                              <Shield className="mr-2 h-4 w-4" /> 设为管理员
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setUserToDelete(user)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> 删除用户
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

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除用户？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将把用户 <strong>{userToDelete?.username}</strong> 标记为删除状态。
              虽然是软删除，但建议谨慎操作。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteUser}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}