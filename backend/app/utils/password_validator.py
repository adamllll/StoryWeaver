"""
密码强度验证器

本小姐的安全要求：密码必须足够强大才能保护账户安全！(￣▽￣)ノ
"""
import re
from typing import List, Tuple


class PasswordValidator:
    """密码强度验证器"""

    # 密码要求配置
    MIN_LENGTH = 8
    REQUIRE_UPPERCASE = True
    REQUIRE_LOWERCASE = True
    REQUIRE_DIGIT = True
    REQUIRE_SPECIAL = False  # 暂时不强制要求特殊字符

    @classmethod
    def validate(cls, password: str) -> Tuple[bool, List[str]]:
        """
        验证密码强度

        参数:
            password: 待验证的密码

        返回:
            (是否通过, 错误信息列表)

        示例:
            >>> is_valid, errors = PasswordValidator.validate("Abc123")
            >>> print(is_valid)  # False
            >>> print(errors)    # ['密码长度至少为 8 位']
        """
        errors = []

        # 检查长度
        if len(password) < cls.MIN_LENGTH:
            errors.append(f"密码长度至少为 {cls.MIN_LENGTH} 位")

        # 检查大写字母
        if cls.REQUIRE_UPPERCASE and not re.search(r'[A-Z]', password):
            errors.append("密码必须包含至少一个大写字母")

        # 检查小写字母
        if cls.REQUIRE_LOWERCASE and not re.search(r'[a-z]', password):
            errors.append("密码必须包含至少一个小写字母")

        # 检查数字
        if cls.REQUIRE_DIGIT and not re.search(r'\d', password):
            errors.append("密码必须包含至少一个数字")

        # 检查特殊字符（可选）
        if cls.REQUIRE_SPECIAL and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("密码必须包含至少一个特殊字符")

        return len(errors) == 0, errors

    @classmethod
    def get_requirements_text(cls) -> str:
        """
        获取密码要求的文本描述

        返回:
            密码要求的描述字符串
        """
        requirements = [f"至少 {cls.MIN_LENGTH} 位"]

        if cls.REQUIRE_UPPERCASE:
            requirements.append("包含大写字母")

        if cls.REQUIRE_LOWERCASE:
            requirements.append("包含小写字母")

        if cls.REQUIRE_DIGIT:
            requirements.append("包含数字")

        if cls.REQUIRE_SPECIAL:
            requirements.append("包含特殊字符")

        return "、".join(requirements)


def validate_password_strength(password: str) -> str:
    """
    验证密码强度（用于 Pydantic validator）

    参数:
        password: 待验证的密码

    返回:
        验证通过的密码

    异常:
        ValueError: 密码不符合要求时抛出

    使用示例:
        class UserCreate(BaseModel):
            password: str = Field(..., min_length=8)

            @validator('password')
            def validate_password(cls, v):
                return validate_password_strength(v)
    """
    is_valid, errors = PasswordValidator.validate(password)

    if not is_valid:
        error_message = "密码不符合要求：" + "；".join(errors)
        raise ValueError(error_message)

    return password
