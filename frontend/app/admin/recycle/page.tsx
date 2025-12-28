"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, AdminUser, AdminNovel } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { RotateCcw, Trash2, Users, BookOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function RecycleBinPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [novels, setNovels] = useState<AdminNovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [userToRestore, setUserToRestore] = useState<AdminUser | null>(null);
  const [novelToRestore, setNovelToRestore] = useState<AdminNovel | null>(null);
  const { toast } = useToast();

  const fetchDeletedUsers = useCallback(async () => {
    try {
      const response = await adminApi.listUsers({
        page: 1,
        page_size: 100, 
        include_deleted: true,
      });
      // Client-side filtering as per backend logic
      setUsers(response.users.filter(u => u.deleted_at));
    } catch (error) {
      console.error(error);
      toast({
        title: "获取已删除用户失败",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchDeletedNovels = useCallback(async () => {
    try {
      const response = await adminApi.listNovels({
        page: 1,
        page_size: 100,
        include_deleted: true,
      });
      setNovels(response.novels.filter(n => n.deleted_at));
    } catch (error) {
       console.error(error);
      toast({
        title: "获取已删除作品失败",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      if (activeTab === "users") {
        await fetchDeletedUsers();
      } else {
        await fetchDeletedNovels();
      }
      setLoading(false);
    };
    fetchData();
  }, [activeTab, fetchDeletedUsers, fetchDeletedNovels]);

  const handleRestoreUser = async () => {
    if (!userToRestore) return;
    try {
      await adminApi.restoreUser(userToRestore.id);
      toast({
        title: "用户已恢复",
        description: `${userToRestore.username} 已恢复正常状态`,
      });
      setUserToRestore(null);
      fetchDeletedUsers();
    } catch (error) {
      toast({
        title: "恢复失败",
        variant: "destructive",
      });
    }
  };

  const handleRestoreNovel = async () => {
    if (!novelToRestore) return;
    try {
      await adminApi.restoreNovel(novelToRestore.id);
      toast({
        title: "作品已恢复",
        description: `《${novelToRestore.title}》已恢复`,
      });
      setNovelToRestore(null);
      fetchDeletedNovels();
    } catch (error) {
      toast({
        title: "恢复失败",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">回收站</h2>
          <p className="text-sm text-gray-500">查看并恢复已删除的用户和作品</p>
        </div>
      </div>

      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-100/50 p-1 rounded-xl">
          <TabsTrigger 
            value="users"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
          >
            <Users className="mr-2 h-4 w-4" />
            已删除用户
          </TabsTrigger>
          <TabsTrigger 
            value="novels"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            已删除作品
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6 rounded-xl border border-gray-200 bg-white/60 backdrop-blur-xl shadow-sm overflow-hidden">
          <TabsContent value="users" className="m-0 focus-visible:ring-0 focus-visible:outline-none">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent border-b border-gray-100">
                  <TableHead className="w-[300px]">用户</TableHead>
                  <TableHead>删除时间</TableHead>
                  <TableHead>原有角色</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Trash2 className="h-8 w-8 text-gray-300" />
                        <p>回收站里很干净</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50/50 border-gray-100">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-gray-200">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{user.username}</span>
                            <span className="text-xs text-gray-500">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {user.deleted_at && formatDistanceToNow(new Date(user.deleted_at.endsWith("Z") ? user.deleted_at : user.deleted_at + "Z"), { addSuffix: true, locale: zhCN })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-600 font-normal">
                          {user.is_admin ? "管理员" : "普通用户"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg"
                          onClick={() => setUserToRestore(user)}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          恢复
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="novels" className="m-0 focus-visible:ring-0 focus-visible:outline-none">
             <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent border-b border-gray-100">
                  <TableHead className="w-[300px]">作品</TableHead>
                  <TableHead>作者</TableHead>
                  <TableHead>删除时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : novels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Trash2 className="h-8 w-8 text-gray-300" />
                        <p>回收站里很干净</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  novels.map((novel) => (
                    <TableRow key={novel.id} className="hover:bg-gray-50/50 border-gray-100">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{novel.title}</span>
                          <span className="text-xs text-gray-500">{novel.category} · {novel.word_count}字</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {novel.author_username}
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {novel.deleted_at && formatDistanceToNow(new Date(novel.deleted_at.endsWith("Z") ? novel.deleted_at : novel.deleted_at + "Z"), { addSuffix: true, locale: zhCN })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-red-50 text-red-600 hover:bg-red-50 border-red-100">已删除</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg"
                          onClick={() => setNovelToRestore(novel)}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          恢复
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </div>
      </Tabs>

      <AlertDialog open={!!userToRestore} onOpenChange={(open) => !open && setUserToRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认恢复用户？</AlertDialogTitle>
            <AlertDialogDescription>
              将恢复用户 <strong>{userToRestore?.username}</strong> 的访问权限。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRestoreUser}
              className="bg-green-600 hover:bg-green-700"
            >
              确认恢复
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!novelToRestore} onOpenChange={(open) => !open && setNovelToRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认恢复作品？</AlertDialogTitle>
            <AlertDialogDescription>
              将恢复作品 <strong>《{novelToRestore?.title}》</strong>。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRestoreNovel}
              className="bg-green-600 hover:bg-green-700"
            >
              确认恢复
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
