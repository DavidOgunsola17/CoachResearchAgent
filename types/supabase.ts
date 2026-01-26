/**
 * TypeScript interfaces for Supabase database tables
 * Generated based on the database schema defined in .cursorrules
 */

export interface Coach {
  id: string; // uuid
  user_id: string; // uuid, FK to auth.users
  full_name: string;
  position?: string;
  email?: string;
  phone?: string;
  twitter_handle?: string;
  university_name?: string;
  school_logo_url?: string;
  created_at: string; // timestamptz
}

export interface SearchCache {
  id: number; // SERIAL (auto-incrementing integer)
  school_name: string;
  sport_name: string;
  results: any; // jsonb
  created_at: string; // timestamptz
}

export interface BackgroundJob {
  id: string; // uuid
  user_id: string; // uuid, FK to auth.users
  status: string;
  payload: any; // jsonb
  error_message?: string;
  results?: any; // jsonb
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

