import { redirect } from "next/navigation";

/**
 * 重定向页面
 *
 * 原 /adventures/explore 页面已合并到 /adventures?tab=explore
 * 此页面保留用于向后兼容，自动重定向到新的 Tab 结构
 */
export default function ExplorePage() {
  redirect('/adventures?tab=explore');
}
