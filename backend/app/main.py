"""
织梦者 (StoryWeaver) - AI 小说创作平台

FastAPI 应用入口文件
"""
import os
import warnings
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .config import settings
from .database import engine, Base, init_db
from .utils.rate_limit import limiter as rate_limiter
from .routers import (
    auth_router,
    novels_router,
    chapters_router,
    ai_router,
    characters_router,
    reading_progress_router,
    adventures_router,
    conversations_router,
    dev_router,
    admin_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理器 - 处理启动和关闭事件"""
    # 启动时：创建数据库表
    # 确保数据目录存在
    data_dir = os.path.dirname(settings.DATABASE_URL.replace("sqlite:///", ""))
    if data_dir and not os.path.exists(data_dir):
        os.makedirs(data_dir, exist_ok=True)

    # 创建所有数据表（使用统一的 init_db 函数）
    init_db()
    print("[OK] Database tables created")

    # 本小姐的安全检查：JWT 密钥安全验证 (￣ω￣)ノ
    DEFAULT_JWT_KEY = "your-secret-key-change-in-production"
    if settings.JWT_SECRET_KEY == DEFAULT_JWT_KEY:
        if not settings.DEBUG:
            # 生产环境使用默认密钥 - 严重安全问题！
            error_msg = (
                "⚠️ 致命安全错误：生产环境使用默认 JWT 密钥！\n"
                "请在 .env 文件中设置 JWT_SECRET_KEY 环境变量\n"
                "应用将拒绝启动以保护数据安全"
            )
            print(f"\n{'='*60}\n{error_msg}\n{'='*60}\n")
            raise RuntimeError(error_msg)
        else:
            # 开发环境使用默认密钥 - 发出警告
            warnings.warn(
                "\n⚠️ 警告：正在使用默认 JWT 密钥！\n"
                "这在开发环境中可以接受，但生产环境必须修改！\n"
                "请在 .env 文件中设置 JWT_SECRET_KEY",
                UserWarning,
                stacklevel=2
            )
            print("[WARN] Using default JWT secret key (OK for development)")

    yield

    # 关闭时：执行清理操作
    print("[BYE] Application shutting down")


# 创建 FastAPI 应用实例
app = FastAPI(
    title="织梦者 API",
    description="AI 小说创作平台 - 支持 AI 辅助创作和互动式阅读",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# 配置速率限制 (Rate Limiting)
# 本小姐的安全防护：防止暴力破解和 DDoS 攻击！(￣▽￣)ノ
app.state.limiter = rate_limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 配置跨域资源共享 (CORS)
# 本小姐的安全配置 - 加固版 (￣▽￣)ノ
if settings.DEBUG:
    # 开发环境：只允许本地开发地址
    # 比之前的 r"https?://.*" 更安全！
    _allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    _allow_origin_regex = None
    print("[CORS] 开发模式：只允许 localhost 访问")
else:
    # 生产环境：严格限制 Origin
    if not settings.FRONTEND_URL or settings.FRONTEND_URL == "http://localhost:3000":
        warnings.warn(
            "⚠️ 警告：生产环境未配置 FRONTEND_URL！\n"
            "请在 .env 中设置正确的前端域名",
            UserWarning,
        )
    _allowed_origins = list(filter(None, set([
        settings.FRONTEND_URL,
    ])))
    _allow_origin_regex = None
    print(f"[CORS] 生产模式：只允许 {_allowed_origins} 访问")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=_allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由模块
app.include_router(auth_router, prefix="/api")
app.include_router(novels_router, prefix="/api")
app.include_router(chapters_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(characters_router, prefix="/api")
app.include_router(reading_progress_router, prefix="/api")
app.include_router(adventures_router, prefix="/api")  # 新增：冒险游戏 API
app.include_router(conversations_router, prefix="/api")  # 新增：对话历史 API
app.include_router(admin_router, prefix="/api")  # 新增：管理员 API

# 开发调试路由（仅在DEBUG模式下可用）
if settings.DEBUG:
    app.include_router(dev_router, prefix="/api")
    print("[DEV] Development endpoints enabled at /api/dev/*")


@app.get("/")
async def root():
    """根端点 - API 健康检查"""
    return {
        "name": "织梦者 API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health")
async def health_check():
    """健康检查端点 - 用于服务监控"""
    return {
        "status": "healthy",
        "database": "connected",
        "ai_service": "configured" if settings.OPENAI_API_KEY else "not_configured",
    }
