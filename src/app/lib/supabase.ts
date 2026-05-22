import { createClient } from "@supabase/supabase-js";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          country: string | null;
          native_language: string | null;
          english_level: string | null;
          target_test: string | null;
          target_score: number | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          country?: string | null;
          native_language?: string | null;
          english_level?: string | null;
          target_test?: string | null;
          target_score?: number | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          country?: string | null;
          native_language?: string | null;
          english_level?: string | null;
          target_test?: string | null;
          target_score?: number | null;
          avatar_url?: string | null;
          bio?: string | null;
          updated_at?: string;
        };
      };
      english_test_history: {
        Row: {
          id: string;
          user_id: string;
          test_type: string;
          test_date: string;
          overall_score: number | null;
          listening_score: number | null;
          reading_score: number | null;
          writing_score: number | null;
          speaking_score: number | null;
          fluency_score: number | null;
          grammar_score: number | null;
          vocabulary_score: number | null;
          pronunciation_score: number | null;
          transcript: string | null;
          feedback: Json | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          test_type: string;
          test_date?: string;
          overall_score?: number | null;
          listening_score?: number | null;
          reading_score?: number | null;
          writing_score?: number | null;
          speaking_score?: number | null;
          fluency_score?: number | null;
          grammar_score?: number | null;
          vocabulary_score?: number | null;
          pronunciation_score?: number | null;
          transcript?: string | null;
          feedback?: Json | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          test_type?: string;
          test_date?: string;
          overall_score?: number | null;
          listening_score?: number | null;
          reading_score?: number | null;
          writing_score?: number | null;
          speaking_score?: number | null;
          fluency_score?: number | null;
          grammar_score?: number | null;
          vocabulary_score?: number | null;
          pronunciation_score?: number | null;
          transcript?: string | null;
          feedback?: Json | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
    };
  };
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
