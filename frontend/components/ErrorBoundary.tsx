/**
 * 错误边界组件
 * 捕获组件树中的 JavaScript 错误，记录错误并显示友好的备用 UI
 * 防止整个应用崩溃
 */

"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 更新 state，下次渲染将显示备用 UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // 记录错误到错误报告服务（如 Sentry）
    console.error("ErrorBoundary 捕获到错误:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // TODO: 可以在这里上报错误到后端或第三方服务
    // 例如: errorReportingService.log(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 否则显示默认的错误 UI
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-2xl w-full glass rounded-ios-2xl p-8">
            {/* 图标 */}
            <div className="w-20 h-20 rounded-ios-xl bg-red-100 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>

            {/* 标题 */}
            <h1 className="text-3xl font-bold text-center mb-4 text-gray-900">
              哎呀，出错了！
            </h1>

            {/* 描述 */}
            <p className="text-center text-gray-600 mb-8">
              应用遇到了一个意外错误。别担心，你的数据是安全的。
              <br />
              你可以尝试刷新页面或返回首页。
            </p>

            {/* 错误详情（开发环境） */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mb-6">
                <summary className="cursor-pointer text-sm font-semibold text-gray-700 mb-2 hover:text-purple-600">
                  查看错误详情（开发模式）
                </summary>
                <div className="bg-gray-50 rounded-ios-lg p-4 border border-gray-200 overflow-auto">
                  <p className="text-sm font-mono text-red-600 mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="btn-secondary inline-flex items-center"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                重试
              </button>

              <Link href="/" className="btn-primary inline-flex items-center">
                <Home className="w-5 h-5 mr-2" />
                返回首页
              </Link>
            </div>

            {/* 帮助文本 */}
            <p className="text-center text-xs text-gray-400 mt-8">
              如果问题持续存在，请联系技术支持或在 GitHub 上提交 issue
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 函数式错误边界包装器（简化版）
 * 用于快速包装可能出错的组件
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.ComponentType<P> {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
