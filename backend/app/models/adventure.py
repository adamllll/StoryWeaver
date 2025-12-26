"""
Adventure 冒险模型 - 互动式小说游戏的核心数据模型

一个 Adventure 代表一次完整的游戏流程：
- 玩家创建冒险，选择类型、关键词、主角设定
- AI 生成开局和后续剧情
- 玩家做出选择，系统判定成功/失败
- 最终生成一部完整的小说

支持故事分叉：玩家可以从别人的故事任意节点分叉，创造新的分支
"""

from sqlalchemy import Column, Integer, String, JSON, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from ..database import Base


class Adventure(Base):
    """冒险（一次完整的游戏）"""
    __tablename__ = "adventures"

    # ========== 主键 ==========
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # ========== 分叉相关 ==========
    parent_adventure_id = Column(Integer, ForeignKey("adventures.id"), nullable=True)
    fork_from_node_id = Column(Integer, ForeignKey("story_nodes.id"), nullable=True)

    # ========== 初始设定 ==========
    title = Column(String(200), nullable=False)  # 自动生成或用户命名
    category = Column(String(50), nullable=False)  # 玄幻/言情/科幻/悬疑/都市
    keywords = Column(JSON, nullable=False)  # ["修仙", "复仇", "热血"]
    protagonist_name = Column(String(100), nullable=False)
    protagonist_gender = Column(String(20), nullable=False)  # male/female/other
    protagonist_personality = Column(String(200), nullable=True)  # "冷静、果断、善良"

    # ========== 当前状态 ==========
    current_node_id = Column(Integer, ForeignKey("story_nodes.id"), nullable=True)
    player_state = Column(JSON, nullable=False)  # 玩家状态（生命值、灵力、物品等）

    # ========== 游戏状态 ==========
    is_finished = Column(Boolean, default=False)
    final_ending = Column(String(50), nullable=True)  # "happy", "tragic", "game_over", "user_quit"

    # ========== 统计信息 ==========
    total_nodes = Column(Integer, default=0)  # 总章节数
    total_choices = Column(Integer, default=0)  # 总选择次数
    total_words = Column(Integer, default=0)  # 总字数

    # ========== 时间戳 ==========
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    finished_at = Column(DateTime, nullable=True)

    # ========== 关系 ==========
    player = relationship("User", back_populates="adventures")

    # 所有节点关系（明确使用 StoryNode.adventure_id 作为外键）
    nodes = relationship(
        "StoryNode",
        back_populates="adventure",
        cascade="all, delete-orphan",
        foreign_keys="[StoryNode.adventure_id]"
    )

    # 当前节点关系（使用 Adventure.current_node_id 作为外键）
    current_node = relationship(
        "StoryNode",
        foreign_keys=[current_node_id],
        post_update=True  # 允许循环依赖（先创建节点，再更新当前节点ID）
    )

    player_choices = relationship("PlayerChoice", back_populates="adventure", cascade="all, delete-orphan")

    # 自引用关系：父冒险和子冒险（分叉）
    parent_adventure = relationship(
        "Adventure",
        remote_side=[id],
        backref="forks",
        foreign_keys=[parent_adventure_id]
    )

    def __repr__(self):
        return f"<Adventure(id={self.id}, title='{self.title}', player_id={self.player_id}, is_finished={self.is_finished})>"


class StoryNode(Base):
    """故事节点（一段剧情）"""
    __tablename__ = "story_nodes"

    # ========== 主键 ==========
    id = Column(Integer, primary_key=True, index=True)
    adventure_id = Column(Integer, ForeignKey("adventures.id"), nullable=False)
    parent_node_id = Column(Integer, ForeignKey("story_nodes.id"), nullable=True)

    # ========== 内容 ==========
    chapter_num = Column(Integer, nullable=False)  # 第几章
    title = Column(String(200), nullable=True)  # 章节标题（可选）
    content = Column(Text, nullable=False)  # AI生成的800-1500字故事

    # ========== 状态快照（方便分叉时恢复）==========
    state_before = Column(JSON, nullable=False)  # 执行前的玩家状态
    state_after = Column(JSON, nullable=False)  # 执行后的玩家状态

    # ========== 生成的选项（JSON数组）==========
    choices = Column(JSON, nullable=False)  # 见 Choice 结构说明

    # ========== 时间戳 ==========
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # ========== 关系 ==========
    # 所属冒险关系（明确使用 StoryNode.adventure_id 作为外键）
    adventure = relationship(
        "Adventure",
        back_populates="nodes",
        foreign_keys=[adventure_id]
    )

    # 父节点关系（自引用）
    parent_node = relationship(
        "StoryNode",
        remote_side=[id],
        backref="children",
        foreign_keys=[parent_node_id]
    )

    player_choices = relationship("PlayerChoice", back_populates="story_node", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<StoryNode(id={self.id}, adventure_id={self.adventure_id}, chapter_num={self.chapter_num})>"


class PlayerChoice(Base):
    """玩家选择历史"""
    __tablename__ = "player_choices"

    # ========== 主键 ==========
    id = Column(Integer, primary_key=True, index=True)
    adventure_id = Column(Integer, ForeignKey("adventures.id"), nullable=False)
    story_node_id = Column(Integer, ForeignKey("story_nodes.id"), nullable=False)

    # ========== 选择内容（从 StoryNode.choices 中选择的那个）==========
    choice_index = Column(Integer, nullable=False)
    choice_text = Column(String(500), nullable=False)

    # ========== 判定结果 ==========
    target_success_rate = Column(Integer, nullable=False)  # 目标成功率（0-100）
    roll_value = Column(Integer, nullable=False)  # 投骰结果（1-100）
    success = Column(Boolean, nullable=False)  # 是否成功

    # ========== 状态变化 ==========
    state_delta = Column(JSON, nullable=True)  # {"生命值": -20, "灵力": -30}

    # ========== 时间戳 ==========
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    # ========== 关系 ==========
    adventure = relationship("Adventure", back_populates="player_choices")
    story_node = relationship("StoryNode", back_populates="player_choices")

    def __repr__(self):
        return f"<PlayerChoice(id={self.id}, adventure_id={self.adventure_id}, choice_text='{self.choice_text[:20]}...', success={self.success})>"


class AIConversation(Base):
    """AI对话历史（用于聊天记录持久化）"""
    __tablename__ = "ai_conversations"

    # ========== 主键 ==========
    id = Column(Integer, primary_key=True, index=True)
    adventure_id = Column(Integer, ForeignKey("adventures.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # ========== 对话内容（JSON数组）==========
    messages = Column(JSON, nullable=False)  # [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]

    # ========== 时间戳 ==========
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # ========== 关系 ==========
    user = relationship("User", backref="ai_conversations")
    adventure = relationship("Adventure", backref="ai_conversations")

    def __repr__(self):
        return f"<AIConversation(id={self.id}, user_id={self.user_id}, adventure_id={self.adventure_id}, message_count={len(self.messages)})>"


"""
玩家状态结构（player_state JSON）

{
  "生命值": 100,
  "最大生命值": 100,
  "灵力": 150,
  "最大灵力": 150,
  "物品": [
    {"name": "疗伤丹", "count": 2, "description": "恢复30生命值"},
    {"name": "护身符", "count": 1, "description": "自动抵挡一次致命伤害"}
  ],
  "关键属性": {
    "根骨": 50,
    "悟性": 45,
    "气运": 60
  },
  "故事事件": [
    "路遇黑风寨三当家并结仇",
    "击败妖兽获得灵药",
    "拜入剑宗成为外门弟子"
  ],
  "关系网": {
    "师父": {"name": "剑宗长老", "favor": 70, "description": "对你颇为赏识"},
    "反派": {"name": "黑风寨三当家", "favor": -50, "description": "对你恨之入骨"}
  }
}
"""

"""
选择结构（StoryNode.choices JSON）

[
  {
    "index": 0,
    "text": "探索左侧通道",
    "inner_monologue": "左侧通道传来微弱的药香，应该较为安全...",
    "success_rate": 0.7,
    "difficulty": "简单",
    "potential_reward": "普通灵药",
    "potential_risk": "可能遇到机关",
    "state_requirements": null,  // 无前置条件
    "success_consequence": "你成功找到了一株百年灵药...",
    "failure_consequence": "你触发了机关，受了轻伤..."
  },
  {
    "index": 1,
    "text": "强闯中间通道",
    "inner_monologue": "中间通道灵力波动剧烈，危险与机遇并存...",
    "success_rate": 0.45,
    "difficulty": "困难",
    "potential_reward": "上古功法",
    "potential_risk": "可能遇到妖兽",
    "state_requirements": {"生命值": ">= 80"},  // 需要生命值至少80
    "success_consequence": "你击败了妖兽，获得了上古功法...",
    "failure_consequence": "妖兽将你击伤，生命值大减..."
  }
]
"""
