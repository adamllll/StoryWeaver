export interface Adventure {
  id: number;
  player_id: number;
  title: string;
  category: "玄幻" | "言情" | "科幻" | "悬疑" | "都市" | "其他";
  keywords: string[];
  protagonist_name: string;
  protagonist_gender: "male" | "female" | "other";
  protagonist_personality: string | null;
  parent_adventure_id?: number | null;
  fork_from_node_id?: number | null;
  current_node_id: number | null;
  player_state: PlayerState;
  is_finished: boolean;
  final_ending: string | null;
  total_nodes: number;
  total_choices: number;
  total_words: number;
  created_at: string;
  updated_at: string;
  finished_at: string | null;
}

export interface ForkPoint {
  node_id: number;
  chapter_num: number;
  title: string;
  preview: string;
  state_after: PlayerState;
  has_choices: boolean;
  word_count: number;
}

export interface ForkPointsResponse {
  adventure_id: number;
  adventure_title: string;
  total_nodes: number;
  fork_points: ForkPoint[];
}

export interface StoryNode {
  id: number;
  adventure_id: number;
  chapter_num: number;
  title: string | null;
  content: string;
  state_before: PlayerState;
  state_after: PlayerState;
  choices: Choice[];
  created_at: string;
  background?: string; // Optional background image hint or description
}

export interface Choice {
  index: number;
  text: string;
  inner_monologue: string;
  success_rate: number;
  difficulty: "简单" | "普通" | "困难" | "极限";
  potential_reward: string;
  potential_risk: string;
  state_requirements: Record<string, string> | null;
}

export interface PlayerState {
  生命值: number;
  最大生命值: number;
  灵力?: number;
  最大灵力?: number;
  物品: Item[];
  关键属性: Record<string, number>;
  故事事件: string[];
  关系网: Record<string, Relationship>;
}

export interface Item {
  name: string;
  count: number;
  description: string;
}

export interface Relationship {
  name: string;
  favor: number;
  description: string;
}

// API Request/Response Types
export interface CreateAdventureRequest {
  category: string;
  keywords: string[];
  protagonist_name: string;
  protagonist_gender: "male" | "female" | "other";
  protagonist_personality?: string;
  random?: boolean;
}

export interface ChoiceRequest {
  choice_index: number;
  choice_text: string;
}

export interface ChoiceResponse {
  roll_value: number;
  target: number;
  success: boolean;
  new_node: StoryNode;
  state_after: PlayerState;
  game_over: boolean;
  game_over_reason: string | null;
}

export interface ListParams {
  page?: number;
  page_size?: number;
  status?: "finished" | "ongoing";
}

export interface AdventureListResponse {
  adventures: Adventure[];
  total: number;
  page: number;
  page_size: number;
}

export interface OpeningGenerationRequest {
  category: string;
  keywords: string[];
  protagonist_name: string;
  protagonist_gender: string;
  protagonist_personality?: string;
}

export interface OpeningGenerationResponse {
  title: string;
  background: string;
  opening_scene: string;
  initial_choices: Choice[];
  initial_state: PlayerState;
}

export interface StoryNodeGenerationRequest {
  adventure_id: number;
  choice: Choice;
  state: PlayerState;
}

export interface StoryNodeGenerationResponse {
  content: string;
  state_update: Partial<PlayerState>;
  new_choices: Choice[];
}
