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
          <h2 className="text-2xl font-caveat font-bold tracking-tight text-sketch-text-primary">回收站</h2>
          <p className="text-sm font-patrick text-sketch-text-secondary">查看并恢复已删除的用户和作品</p>
        </div>
      </div>

      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList variant="sketch" className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger variant="sketch" value="users">
            <Users className="mr-2 h-4 w-4" />
            已删除用户
          </TabsTrigger>
          <TabsTrigger variant="sketch" value="novels">
            <BookOpen className="mr-2 h-4 w-4" />
            已删除作品
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 rounded-xl border-2 border-dashed border-sketch-text-secondary/20 bg-white shadow-sketch overflow-hidden">
          <TabsContent value="users" className="m-0 focus-visible:ring-0 focus-visible:outline-none">
            <Table>
              <TableHeader className="bg-sticky-blue-light/30">
                <TableRow className="hover:bg-transparent border-b-2 border-dashed border-sketch-text-secondary/20">
                  <TableHead className="w-[300px] font-patrick">用户</TableHead>
                  <TableHead className="font-patrick">删除时间</TableHead>
                  <TableHead className="font-patrick">原有角色</TableHead>
                  <TableHead className="text-right font-patrick">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-sketch-text-secondary font-patrick">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-sketch-text-secondary font-patrick">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Trash2 className="h-8 w-8 text-sketch-text-muted" />
                        <p>回收站里很干净</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-sticky-blue-light/20 border-sketch-text-secondary/10">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border-2 border-dashed border-sketch-text-secondary/20">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-sticky-blue text-sketch-text-primary font-patrick">{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-patrick font-medium text-sketch-text-primary">{user.username}</span>
                            <span className="text-xs text-sketch-text-muted font-patrick">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sketch-text-secondary text-sm font-patrick">
                        {user.deleted_at && formatDistanceToNow(new Date(user.deleted_at.endsWith("Z") ? user.deleted_at : user.deleted_at + "Z"), { addSuffix: true, locale: zhCN })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="sticky-blue">
                          {user.is_admin ? "管理员" : "普通用户"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="sketch-ghost"
                          size="sm"
                          className="text-sticky-green hover:text-sketch-text-primary hover:bg-sticky-green-light rounded-xl"
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
              <TableHeader className="bg-sticky-pink-light/30">
                <TableRow className="hover:bg-transparent border-b-2 border-dashed border-sketch-text-secondary/20">
                  <TableHead className="w-[300px] font-patrick">作品</TableHead>
                  <TableHead className="font-patrick">作者</TableHead>
                  <TableHead className="font-patrick">删除时间</TableHead>
                  <TableHead className="font-patrick">状态</TableHead>
                  <TableHead className="text-right font-patrick">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-sketch-text-secondary font-patrick">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : novels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-sketch-text-secondary font-patrick">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Trash2 className="h-8 w-8 text-sketch-text-muted" />
                        <p>回收站里很干净</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  novels.map((novel) => (
                    <TableRow key={novel.id} className="hover:bg-sticky-pink-light/20 border-sketch-text-secondary/10">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-patrick font-medium text-sketch-text-primary">{novel.title}</span>
                          <span className="text-xs text-sketch-text-muted font-patrick">{novel.category} · {novel.word_count}字</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-sketch-text-primary font-patrick">
                        {novel.author_username}
                      </TableCell>
                      <TableCell className="text-sketch-text-secondary text-sm font-patrick">
                        {novel.deleted_at && formatDistanceToNow(new Date(novel.deleted_at.endsWith("Z") ? novel.deleted_at : novel.deleted_at + "Z"), { addSuffix: true, locale: zhCN })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">已删除</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="sketch-ghost"
                          size="sm"
                          className="text-sticky-green hover:text-sketch-text-primary hover:bg-sticky-green-light rounded-xl"
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
