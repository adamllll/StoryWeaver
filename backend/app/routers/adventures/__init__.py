"""
冒险游戏路由模块入口

将所有子路由组合成一个统一的 router
"""
from fastapi import APIRouter

from .crud import router as crud_router
from .gameplay import router as gameplay_router
from .export import router as export_router
from .fork import router as fork_router

# 创建主路由
router = APIRouter(prefix="/adventures", tags=["adventures"])

# 按功能模块包含子路由
# 注意：顺序很重要！具体路径的路由要在参数化路径之前
# explore 路由需要在 /{adventure_id} 之前注册

# 1. 游戏玩法路由（包含 /explore 这个具体路径）
router.include_router(gameplay_router)

# 2. CRUD 路由
router.include_router(crud_router)

# 3. 导出路由
router.include_router(export_router)

# 4. 分叉系统路由
router.include_router(fork_router)
