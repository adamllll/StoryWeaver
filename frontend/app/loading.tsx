import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 mx-auto text-purple-600 animate-spin mb-4" />
        <p className="text-gray-500 text-sm">加载中...</p>
      </div>
    </div>
  );
}
