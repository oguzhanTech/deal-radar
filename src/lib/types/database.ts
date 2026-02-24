export type DealStatus = "pending" | "approved" | "rejected";
export type UserRole = "user" | "admin";
export type VoteValue = 1 | -1;

export interface Profile {
  user_id: string;
  display_name: string | null;
  country: string | null;
  role: UserRole;
  trust_score: number;
  created_at: string;
}

export interface Deal {
  id: string;
  title: string;
  description: string | null;
  provider: string;
  category: string | null;
  country: string;
  start_at: string | null;
  end_at: string;
  original_price: number | null;
  deal_price: number | null;
  currency: string;
  discount_percent: number | null;
  image_url: string | null;
  storage_path: string | null;
  external_url: string | null;
  created_by: string;
  status: DealStatus;
  heat_score: number;
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
