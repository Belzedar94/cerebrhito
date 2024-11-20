export type UserRole = 'parent' | 'professional';
export type SubscriptionType = 'free' | 'premium' | 'enterprise';
export type MediaType = 'photo' | 'video';
export type ActivityStatus = 'pending' | 'completed' | 'skipped';

export interface User {
  id: string;
  email: string;
  encrypted_password: string;
  full_name: string;
  role: UserRole;
  subscription_type: SubscriptionType;
  subscription_expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Child {
  id: string;
  user_id: string;
  name: string;
  date_of_birth: Date;
  gender: string | null;
  profile_data: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  min_age_months: number;
  max_age_months: number;
  duration_minutes: number;
  category: string;
  tags: string[];
  ai_generated: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  min_age_months: number;
  max_age_months: number;
  category: string;
  importance: number;
  created_at: Date;
  updated_at: Date;
}

export interface ActivityLog {
  id: string;
  child_id: string;
  activity_id: string;
  status: ActivityStatus;
  scheduled_for: Date;
  completed_at: Date | null;
  notes: string | null;
  duration_minutes: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface MilestoneTracking {
  id: string;
  child_id: string;
  milestone_id: string;
  achieved_at: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Media {
  id: string;
  child_id: string;
  type: MediaType;
  file_path: string;
  file_size: number;
  mime_type: string;
  analysis_data: Record<string, any> | null;
  embedding: number[] | null;
  created_at: Date;
  updated_at: Date;
}

export interface AIChatHistory {
  id: string;
  user_id: string;
  child_id: string | null;
  message: string;
  response: string;
  embedding: number[] | null;
  created_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read_at: Date | null;
  created_at: Date;
}