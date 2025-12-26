"""密码哈希工具 - 使用 Argon2 加密"""
from passlib.context import CryptContext

# 密码哈希上下文
# 使用 argon2 方案，这是目前最推荐的密码哈希算法
# 优点：抗 GPU 暴力破解、无长度限制、获得密码哈希比赛冠军
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    使用 Argon2 对明文密码进行哈希处理

    参数:
        password: 需要哈希的明文密码

    返回:
        哈希后的密码字符串
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    验证明文密码是否与哈希值匹配

    参数:
        plain_password: 待验证的明文密码
        hashed_password: 存储的哈希值

    返回:
        密码匹配返回 True，否则返回 False
    """
    return pwd_context.verify(plain_password, hashed_password)
