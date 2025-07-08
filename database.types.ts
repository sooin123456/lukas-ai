export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: string
          content: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: string
          content: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: string
          content?: string
          metadata?: Json | null
          created_at?: string
        }
      }
      assistant_settings: {
        Row: {
          id: string
          user_id: string
          model: string
          language: string
          context: string
          max_tokens: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          model?: string
          language?: string
          context?: string
          max_tokens?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          model?: string
          language?: string
          context?: string
          max_tokens?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          profile_id: string
          name: string
          avatar_url: string | null
          marketing_consent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          profile_id: string
          name: string
          avatar_url?: string | null
          marketing_consent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          profile_id?: string
          name?: string
          avatar_url?: string | null
          marketing_consent?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
