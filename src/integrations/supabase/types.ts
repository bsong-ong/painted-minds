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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          art_sharing_enabled: boolean | null
          cbt_assistant_visible: boolean | null
          created_at: string | null
          default_language: string | null
          enable_username_login: boolean | null
          gratitude_drawing_visible: boolean | null
          id: string
          language_switcher_enabled: boolean | null
          story_creation_enabled: boolean | null
          talk_buddy_visible: boolean | null
          updated_at: string | null
          use_openrouter_for_images: boolean | null
        }
        Insert: {
          art_sharing_enabled?: boolean | null
          cbt_assistant_visible?: boolean | null
          created_at?: string | null
          default_language?: string | null
          enable_username_login?: boolean | null
          gratitude_drawing_visible?: boolean | null
          id?: string
          language_switcher_enabled?: boolean | null
          story_creation_enabled?: boolean | null
          talk_buddy_visible?: boolean | null
          updated_at?: string | null
          use_openrouter_for_images?: boolean | null
        }
        Update: {
          art_sharing_enabled?: boolean | null
          cbt_assistant_visible?: boolean | null
          created_at?: string | null
          default_language?: string | null
          enable_username_login?: boolean | null
          gratitude_drawing_visible?: boolean | null
          id?: string
          language_switcher_enabled?: boolean | null
          story_creation_enabled?: boolean | null
          talk_buddy_visible?: boolean | null
          updated_at?: string | null
          use_openrouter_for_images?: boolean | null
        }
        Relationships: []
      }
      admins: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      drawing_stars: {
        Row: {
          created_at: string | null
          drawing_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          drawing_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          drawing_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drawing_stars_drawing_id_fkey"
            columns: ["drawing_id"]
            isOneToOne: false
            referencedRelation: "drawings"
            referencedColumns: ["id"]
          },
        ]
      }
      drawings: {
        Row: {
          created_at: string | null
          enhanced_image_url: string | null
          enhanced_storage_path: string | null
          enhancement_prompt: string | null
          flux_prompt: string | null
          gratitude_prompt: string | null
          id: string
          image_url: string | null
          is_enhanced: boolean | null
          is_gratitude_entry: boolean | null
          is_public: boolean | null
          shared: boolean | null
          star_count: number | null
          storage_path: string | null
          title: string | null
          updated_at: string | null
          user_description: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enhanced_image_url?: string | null
          enhanced_storage_path?: string | null
          enhancement_prompt?: string | null
          flux_prompt?: string | null
          gratitude_prompt?: string | null
          id?: string
          image_url?: string | null
          is_enhanced?: boolean | null
          is_gratitude_entry?: boolean | null
          is_public?: boolean | null
          shared?: boolean | null
          star_count?: number | null
          storage_path?: string | null
          title?: string | null
          updated_at?: string | null
          user_description?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enhanced_image_url?: string | null
          enhanced_storage_path?: string | null
          enhancement_prompt?: string | null
          flux_prompt?: string | null
          gratitude_prompt?: string | null
          id?: string
          image_url?: string | null
          is_enhanced?: boolean | null
          is_gratitude_entry?: boolean | null
          is_public?: boolean | null
          shared?: boolean | null
          star_count?: number | null
          storage_path?: string | null
          title?: string | null
          updated_at?: string | null
          user_description?: string | null
          user_id?: string
        }
        Relationships: []
      }
      line_accounts: {
        Row: {
          display_name: string | null
          id: string
          line_user_id: string
          linked_at: string
          picture_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          display_name?: string | null
          id?: string
          line_user_id: string
          linked_at?: string
          picture_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          display_name?: string | null
          id?: string
          line_user_id?: string
          linked_at?: string
          picture_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      line_link_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          line_user_id: string | null
          token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          line_user_id?: string | null
          token: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          line_user_id?: string | null
          token?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          language: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          language?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          language?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      thought_journal: {
        Row: {
          conversation_data: Json | null
          created_at: string | null
          id: string
          summary: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversation_data?: Json | null
          created_at?: string | null
          id?: string
          summary: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversation_data?: Json | null
          created_at?: string | null
          id?: string
          summary?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string | null
          gratitude_journaling_enabled: boolean | null
          id: string
          talk_buddy_enabled: boolean | null
          thought_buddy_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          gratitude_journaling_enabled?: boolean | null
          id?: string
          talk_buddy_enabled?: boolean | null
          thought_buddy_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          gratitude_journaling_enabled?: boolean | null
          id?: string
          talk_buddy_enabled?: boolean | null
          thought_buddy_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          created_at: string | null
          id: string
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_entry_date: string | null
          longest_streak: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_entry_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_entry_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_email_by_username: {
        Args: { lookup_username: string }
        Returns: string
      }
      is_admin: { Args: never; Returns: boolean }
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
