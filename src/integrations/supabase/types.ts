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
          instruction_file_url: string | null
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
          used_referral_code: string | null
          wallet_amount_used: number | null
        }
        Insert: {
          academic_level: Database["public"]["Enums"]["academic_level"]
          base_price: number
          created_at?: string | null
          final_price: number
          id?: string
          instruction_file_url?: string | null
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
          used_referral_code?: string | null
          wallet_amount_used?: number | null
        }
        Update: {
          academic_level?: Database["public"]["Enums"]["academic_level"]
          base_price?: number
          created_at?: string | null
          final_price?: number
          id?: string
          instruction_file_url?: string | null
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
          used_referral_code?: string | null
          wallet_amount_used?: number | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          available_balance: number | null
          code: string
          created_at: string | null
          referrals_count: number | null
          telegram_user_id: string
          total_earnings: number | null
        }
        Insert: {
          available_balance?: number | null
          code: string
          created_at?: string | null
          referrals_count?: number | null
          telegram_user_id: string
          total_earnings?: number | null
        }
        Update: {
          available_balance?: number | null
          code?: string
          created_at?: string | null
          referrals_count?: number | null
          telegram_user_id?: string
          total_earnings?: number | null
        }
        Relationships: []
      }
      referral_usage: {
        Row: {
          commission_amount: number
          commission_paid: boolean | null
          created_at: string | null
          discount_amount: number
          id: string
          order_id: string | null
          referred_telegram_user_id: string
          referrer_telegram_user_id: string
        }
        Insert: {
          commission_amount: number
          commission_paid?: boolean | null
          created_at?: string | null
          discount_amount: number
          id?: string
          order_id?: string | null
          referred_telegram_user_id: string
          referrer_telegram_user_id: string
        }
        Update: {
          commission_amount?: number
          commission_paid?: boolean | null
          created_at?: string | null
          discount_amount?: number
          id?: string
          order_id?: string | null
          referred_telegram_user_id?: string
          referrer_telegram_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
          user_id: string | null
          username: string | null
        }
        Insert: {
          first_name?: string | null
          first_seen_at?: string | null
          last_interaction_at?: string | null
          last_name?: string | null
          telegram_user_id: string
          user_id?: string | null
          username?: string | null
        }
        Update: {
          first_name?: string | null
          first_seen_at?: string | null
          last_interaction_at?: string | null
          last_name?: string | null
          telegram_user_id?: string
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      trusted_devices: {
        Row: {
          created_at: string
          device_id: string
          id: string
          last_used_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          last_used_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          last_used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      two_factor_codes: {
        Row: {
          code: string
          created_at: string
          device_id: string
          expires_at: string
          id: string
          telegram_user_id: string
          user_id: string
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          device_id: string
          expires_at?: string
          id?: string
          telegram_user_id: string
          user_id: string
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          device_id?: string
          expires_at?: string
          id?: string
          telegram_user_id?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_codes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      academic_level: "college" | "highschool" | "university" | "master" | "phd"
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
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
