export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          chatbot_enabled: boolean | null
          default_language: string | null
          id: string
          language_switcher_enabled: boolean | null
          show_nutritional_ranges: boolean | null
        }
        Insert: {
          chatbot_enabled?: boolean | null
          default_language?: string | null
          id?: string
          language_switcher_enabled?: boolean | null
          show_nutritional_ranges?: boolean | null
        }
        Update: {
          chatbot_enabled?: boolean | null
          default_language?: string | null
          id?: string
          language_switcher_enabled?: boolean | null
          show_nutritional_ranges?: boolean | null
        }
        Relationships: []
      }
      admins: {
        Row: {
          assigned_users: string[] | null
          created_at: string | null
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          assigned_users?: string[] | null
          created_at?: string | null
          id?: string
          role: string
          user_id?: string | null
        }
        Update: {
          assigned_users?: string[] | null
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      drawings: {
        Row: {
          created_at: string
          id: string
          image_url: string
          storage_path: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          storage_path: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          storage_path?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_preferences: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          journal_name: string
          search_terms: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          journal_name: string
          search_terms?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          journal_name?: string
          search_terms?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kept_articles: {
        Row: {
          abstract: string
          ai_summary: string | null
          authors: string[]
          created_at: string
          doi: string | null
          id: string
          journal: string
          kept_at: string
          notes: string | null
          pmid: string
          pub_date: string | null
          relevance_score: number | null
          search_term: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          abstract: string
          ai_summary?: string | null
          authors?: string[]
          created_at?: string
          doi?: string | null
          id?: string
          journal: string
          kept_at?: string
          notes?: string | null
          pmid: string
          pub_date?: string | null
          relevance_score?: number | null
          search_term?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          abstract?: string
          ai_summary?: string | null
          authors?: string[]
          created_at?: string
          doi?: string | null
          id?: string
          journal?: string
          kept_at?: string
          notes?: string | null
          pmid?: string
          pub_date?: string | null
          relevance_score?: number | null
          search_term?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meals: {
        Row: {
          calories: number
          carbs: number
          created_at: string | null
          dish_name_en: string
          dish_name_th: string
          fat: number
          glycemic_load_category: string
          glycemic_load_details_en: string
          glycemic_load_details_th: string
          glycemic_load_value: number
          health_details_en: string
          health_details_th: string
          health_score: number
          id: string
          image_url: string
          protein: number
          spice_level: string
          user_id: string
        }
        Insert: {
          calories: number
          carbs: number
          created_at?: string | null
          dish_name_en: string
          dish_name_th: string
          fat: number
          glycemic_load_category: string
          glycemic_load_details_en: string
          glycemic_load_details_th: string
          glycemic_load_value: number
          health_details_en: string
          health_details_th: string
          health_score: number
          id?: string
          image_url: string
          protein: number
          spice_level: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string | null
          dish_name_en?: string
          dish_name_th?: string
          fat?: number
          glycemic_load_category?: string
          glycemic_load_details_en?: string
          glycemic_load_details_th?: string
          glycemic_load_value?: number
          health_details_en?: string
          health_details_th?: string
          health_score?: number
          id?: string
          image_url?: string
          protein?: number
          spice_level?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_digests: {
        Row: {
          created_at: string
          generated_at: string
          id: string
          journals_tracked: string[]
          key_highlights: Json
          month: string
          summary_content: Json
          total_articles: number
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          generated_at?: string
          id?: string
          journals_tracked?: string[]
          key_highlights?: Json
          month: string
          summary_content?: Json
          total_articles?: number
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          generated_at?: string
          id?: string
          journals_tracked?: string[]
          key_highlights?: Json
          month?: string
          summary_content?: Json
          total_articles?: number
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      nutrition_analyses: {
        Row: {
          analysis_result: Json
          created_at: string | null
          id: string
          image_url: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_result?: Json
          created_at?: string | null
          id?: string
          image_url: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_result?: Json
          created_at?: string | null
          id?: string
          image_url?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rewards: {
        Row: {
          created_at: string | null
          description: string
          id: string
          image_url: string
          name: string
          rarity: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          image_url: string
          name: string
          rarity: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          image_url?: string
          name?: string
          rarity?: string
        }
        Relationships: []
      }
      saved_articles: {
        Row: {
          abstract: string
          authors: string[]
          created_at: string
          doi: string | null
          id: string
          journal: string
          pmid: string
          pub_date: string | null
          relevance_score: number | null
          search_term: string
          title: string
          user_id: string
        }
        Insert: {
          abstract: string
          authors?: string[]
          created_at?: string
          doi?: string | null
          id?: string
          journal: string
          pmid: string
          pub_date?: string | null
          relevance_score?: number | null
          search_term: string
          title: string
          user_id: string
        }
        Update: {
          abstract?: string
          authors?: string[]
          created_at?: string
          doi?: string | null
          id?: string
          journal?: string
          pmid?: string
          pub_date?: string | null
          relevance_score?: number | null
          search_term?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_photos: {
        Row: {
          address: string | null
          content_type: string | null
          created_at: string
          file_size: number | null
          id: string
          latitude: number | null
          location_accuracy: number | null
          longitude: number | null
          original_name: string | null
          public_url: string
          storage_path: string
          user_id: string
        }
        Insert: {
          address?: string | null
          content_type?: string | null
          created_at?: string
          file_size?: number | null
          id?: string
          latitude?: number | null
          location_accuracy?: number | null
          longitude?: number | null
          original_name?: string | null
          public_url: string
          storage_path: string
          user_id: string
        }
        Update: {
          address?: string | null
          content_type?: string | null
          created_at?: string
          file_size?: number | null
          id?: string
          latitude?: number | null
          location_accuracy?: number | null
          longitude?: number | null
          original_name?: string | null
          public_url?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          created_at: string | null
          id: string
          level: number
          next_level_points: number
          total: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          level?: number
          next_level_points?: number
          total?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: number
          next_level_points?: number
          total?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_rewards: {
        Row: {
          id: string
          is_claimed: boolean | null
          obtained_at: string | null
          reward_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_claimed?: boolean | null
          obtained_at?: string | null
          reward_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_claimed?: boolean | null
          obtained_at?: string | null
          reward_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_assigned_users: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_subadmin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
