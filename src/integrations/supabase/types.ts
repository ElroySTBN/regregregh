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
      conversation_state: {
        Row: {
          current_step: string
          navigation_stack: Json | null
          order_draft: Json | null
          telegram_user_id: string
          updated_at: string | null
        }
        Insert: {
          current_step: string
          navigation_stack?: Json | null
          order_draft?: Json | null
          telegram_user_id: string
          updated_at?: string | null
        }
        Update: {
          current_step?: string
          navigation_stack?: Json | null
          order_draft?: Json | null
          telegram_user_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          academic_level: Database["public"]["Enums"]["academic_level"]
          base_price: number
          created_at: string | null
          final_price: number
          id: string
          length_pages: number
          order_number: string
          payment_address: string | null
          payment_crypto_type: string | null
          payment_proof_url: string | null
          session_token: string
          status: Database["public"]["Enums"]["order_status"] | null
          subject: string
          telegram_user_id: string
          telegram_username: string | null
          updated_at: string | null
          urgency: Database["public"]["Enums"]["urgency_level"]
          urgency_multiplier: number
        }
        Insert: {
          academic_level: Database["public"]["Enums"]["academic_level"]
          base_price: number
          created_at?: string | null
          final_price: number
          id?: string
          length_pages: number
          order_number: string
          payment_address?: string | null
          payment_crypto_type?: string | null
          payment_proof_url?: string | null
          session_token: string
          status?: Database["public"]["Enums"]["order_status"] | null
          subject: string
          telegram_user_id: string
          telegram_username?: string | null
          updated_at?: string | null
          urgency: Database["public"]["Enums"]["urgency_level"]
          urgency_multiplier: number
        }
        Update: {
          academic_level?: Database["public"]["Enums"]["academic_level"]
          base_price?: number
          created_at?: string | null
          final_price?: number
          id?: string
          length_pages?: number
          order_number?: string
          payment_address?: string | null
          payment_crypto_type?: string | null
          payment_proof_url?: string | null
          session_token?: string
          status?: Database["public"]["Enums"]["order_status"] | null
          subject?: string
          telegram_user_id?: string
          telegram_username?: string | null
          updated_at?: string | null
          urgency?: Database["public"]["Enums"]["urgency_level"]
          urgency_multiplier?: number
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          admin_name: string | null
          created_at: string | null
          id: string
          is_from_admin: boolean | null
          message_text: string
          telegram_user_id: string
          telegram_username: string | null
          thread_date: string | null
        }
        Insert: {
          admin_name?: string | null
          created_at?: string | null
          id?: string
          is_from_admin?: boolean | null
          message_text: string
          telegram_user_id: string
          telegram_username?: string | null
          thread_date?: string | null
        }
        Update: {
          admin_name?: string | null
          created_at?: string | null
          id?: string
          is_from_admin?: boolean | null
          message_text?: string
          telegram_user_id?: string
          telegram_username?: string | null
          thread_date?: string | null
        }
        Relationships: []
      }
      telegram_users: {
        Row: {
          first_name: string | null
          first_seen_at: string | null
          last_interaction_at: string | null
          last_name: string | null
          telegram_user_id: string
          username: string | null
        }
        Insert: {
          first_name?: string | null
          first_seen_at?: string | null
          last_interaction_at?: string | null
          last_name?: string | null
          telegram_user_id: string
          username?: string | null
        }
        Update: {
          first_name?: string | null
          first_seen_at?: string | null
          last_interaction_at?: string | null
          last_name?: string | null
          telegram_user_id?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      academic_level: "college" | "highschool" | "university" | "master" | "phd"
      order_status:
        | "pending"
        | "paid"
        | "in_progress"
        | "review"
        | "completed"
        | "cancelled"
      urgency_level:
        | "ultra_express"
        | "express"
        | "urgent"
        | "rapid"
        | "standard"
        | "economic"
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
    Enums: {
      academic_level: ["college", "highschool", "university", "master", "phd"],
      order_status: [
        "pending",
        "paid",
        "in_progress",
        "review",
        "completed",
        "cancelled",
      ],
      urgency_level: [
        "ultra_express",
        "express",
        "urgent",
        "rapid",
        "standard",
        "economic",
      ],
    },
  },
} as const
