export interface BirthdayEntity {
  id: string;
  name: string;
  birth_date: string;
  birth_day: number;
  birth_month: number;
  birth_year?: number | null;
  nickname?: string | null;
  relationship?: string | null;
  photo_uri?: string | null;
  photo_thumbnail_uri?: string | null;
  is_favorite: number;
  reminder_days_before: number;
  notes: string | null;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskCategory = 'personal' | 'work' | 'celebration' | 'shopping' | 'health' | 'other';
export type TaskRepeatInterval = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type TaskStatus = 'pending' | 'completed' | 'cancelled';

export interface TaskEntity {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time?: string | null;
  priority: TaskPriority;
  category?: TaskCategory;
  repeat_interval?: TaskRepeatInterval;
  reminder_minutes?: number | null;
  location?: string | null;
  photo_uri?: string | null;
  photo_thumbnail_uri?: string | null;
  status?: TaskStatus;
  is_completed: number;
  completed_at?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type Gender = 'female' | 'male' | 'non_binary' | 'prefer_not_to_say' | 'other';

export interface UserProfileEntity {
  id: string;
  name: string;
  display_name?: string | null;
  date_of_birth: string; // ISO format: YYYY-MM-DD
  gender: Gender;
  photo_uri: string | null;
  photo_thumbnail_uri: string | null;
  email?: string | null;
  theme_preference: 'light' | 'dark' | 'system';
  notifications_enabled: number;
  is_profile_completed: number;
  created_at: string;
  updated_at: string;
}

export interface MediaEntity {
  id: string;
  entity_type: string;
  entity_id: string;
  file_path: string;
  thumbnail_path?: string | null;
  file_size_bytes?: number | null;
  mime_type?: string | null;
  width?: number | null;
  height?: number | null;
  created_at: string;
}

export interface CrudRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: T): Promise<void>;
  update(entity: T): Promise<void>;
  delete(id: ID): Promise<void>;
}
