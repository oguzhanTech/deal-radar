export type DealStatus = "pending" | "approved" | "rejected" | "review_needed";
export type UserRole = "user" | "admin";
export type VoteValue = 1 | -1;

export type BadgeId =
  | "early_hunter"
  | "trending_hunter"
  | "community_builder"
  | "trusted_submitter"
  | "first_commenter"
  | "conversation_starter"
  | "first_share"
  | "active_submitter"
  | "community_master"
  | "comment_legend"
  | "share_legend"
  | "trend_master"
  | "elite_hunter"
  | "radar_immortal";

export type ActivityType = "deal_created" | "vote" | "comment" | "save";

export interface ActivityPayload {
  display_name?: string | null;
  deal_title?: string;
  deal_price?: number | null;
  original_price?: number | null;
  currency?: string | null;
  vote?: number;
  comment_snippet?: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  user_id: string;
  deal_id: string;
  comment_id: string | null;
  payload: ActivityPayload;
  created_at: string;
}

export interface Profile {
  user_id: string;
  display_name: string | null;
  profile_image_url?: string | null;
  profile_image_path?: string | null;
  role: UserRole;
  trust_score: number;
  points: number;
  level: number;
  badges: BadgeId[];
  created_at: string;
}

export interface Deal {
  id: string;
  title: string;
  description: string | null;
  provider: string;
  category: string | null;
  start_at: string | null;
  end_at: string;
  original_price: number | null;
  deal_price: number | null;
  currency: string;
  discount_percent: number | null;
  image_url: string | null;
  storage_path: string | null;
  external_url: string | null;
  coupon_code: string | null;
  coupon_description: string | null;
  coupon_expiry: string | null;
  created_by: string;
  status: DealStatus;
  end_date_unknown?: boolean;
  is_editor_pick?: boolean;
  editor_pick_quote?: string | null;
  editor_pick_set_by?: string | null;
  heat_score: number;
  is_trending?: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface DealVote {
  user_id: string;
  deal_id: string;
  vote: VoteValue;
}

export interface DealComment {
  id: string;
  deal_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface DealSave {
  user_id: string;
  deal_id: string;
  reminder_settings: ReminderSettings;
  created_at: string;
}

export interface ReminderSettings {
  "3d": boolean;
  "1d": boolean;
  "6h": boolean;
  "1h": boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  payload: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

export interface DealReport {
  id: string;
  deal_id: string;
  user_id: string;
  reason: string;
  created_at: string;
}

export interface DealWithMeta extends Deal {
  vote_count?: number;
  comment_count?: number;
  save_count?: number;
  user_vote?: VoteValue | null;
  user_saved?: boolean;
  profile?: Profile;
}
