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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blog_categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          category_id: string | null
          content: string
          created_at: string
          excerpt: string | null
          id: string
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          created_at: string | null
          id: string
          monthly_budget: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          monthly_budget: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          monthly_budget?: number
          user_id?: string | null
        }
        Relationships: []
      }
      emis: {
        Row: {
          amount: number
          created_at: string | null
          emi_day: number | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          emi_day?: number | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          emi_day?: number | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      expense_splits: {
        Row: {
          created_at: string | null
          expense_id: string
          group_id: string
          id: string
          member_id: string | null
          share_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expense_id: string
          group_id: string
          id?: string
          member_id?: string | null
          share_amount: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          expense_id?: string
          group_id?: string
          id?: string
          member_id?: string | null
          share_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_splits_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          expense_date: string | null
          group_id: string | null
          id: string
          note: string | null
          payment_mode: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          expense_date?: string | null
          group_id?: string | null
          id?: string
          note?: string | null
          payment_mode?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          expense_date?: string | null
          group_id?: string | null
          id?: string
          note?: string | null
          payment_mode?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      group_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          group_id: string
          id: string
          notes: string | null
          paid_by: string
          paid_by_member_id: string | null
          split_type: string
          title: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          group_id: string
          id?: string
          notes?: string | null
          paid_by: string
          paid_by_member_id?: string | null
          split_type?: string
          title: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          group_id?: string
          id?: string
          notes?: string | null
          paid_by?: string
          paid_by_member_id?: string | null
          split_type?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_expenses_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_expenses_paid_by_member_id_fkey"
            columns: ["paid_by_member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
        ]
      }
      group_invites: {
        Row: {
          created_at: string
          email: string
          group_id: string
          id: string
          invited_by: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          group_id: string
          id?: string
          invited_by: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          group_id?: string
          id?: string
          invited_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_invites_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          name: string
          role: string
          user_id: string
          upi_id: string | null
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          name: string
          role?: string
          user_id: string
          upi_id?: string | null
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          name?: string
          role?: string
          user_id?: string
          upi_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_group_members_group"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          id: string
          member_count: number
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_count?: number
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          member_count?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          full_name: string | null
          phone: string | null
          upi_id: string | null
          preferred_upi_app: string | null
          upi_verification_state: string | null
          updated_at: string | null
          has_completed_setup: boolean | null
          privacy_completed: boolean | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          full_name?: string | null
          phone?: string | null
          upi_id?: string | null
          preferred_upi_app?: string | null
          upi_verification_state?: string | null
          updated_at?: string | null
          has_completed_setup?: boolean | null
          privacy_completed?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          full_name?: string | null
          phone?: string | null
          upi_id?: string | null
          preferred_upi_app?: string | null
          upi_verification_state?: string | null
          updated_at?: string | null
          has_completed_setup?: boolean | null
          privacy_completed?: boolean | null
        }
        Relationships: []
      }
      salaries: {
        Row: {
          created_at: string | null
          id: string
          monthly_salary: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          monthly_salary?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          monthly_salary?: number
          user_id?: string
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          created_at: string | null
          goal_name: string
          id: string
          saved_amount: number | null
          target_amount: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          goal_name: string
          id?: string
          saved_amount?: number | null
          target_amount: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          goal_name?: string
          id?: string
          saved_amount?: number | null
          target_amount?: number
          user_id?: string | null
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content_json: Json | null
          id: string
          section_name: string
          updated_at: string
        }
        Insert: {
          content_json?: Json | null
          id?: string
          section_name: string
          updated_at?: string
        }
        Update: {
          content_json?: Json | null
          id?: string
          section_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      stats: {
        Row: {
          id: number
          waitlist_count: number
          updated_at: string
        }
        Insert: {
          id?: number
          waitlist_count?: number
          updated_at?: string
        }
        Update: {
          id?: number
          waitlist_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          user_id: string | null
          amount: number
          type: string
          category: string | null
          description: string | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          amount: number
          type: string
          category?: string | null
          description?: string | null
          date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          amount?: number
          type?: string
          category?: string | null
          description?: string | null
          date?: string
          created_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          active_group_id: string | null
          active_group_updated_at: string | null
          created_at: string | null
          id: string
          language: string | null
          country?: string | null
          is_new_user?: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active_group_id?: string | null
          active_group_updated_at?: string | null
          created_at?: string | null
          id?: string
          language?: string | null
          country?: string | null
          is_new_user?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active_group_id?: string | null
          active_group_updated_at?: string | null
          created_at?: string | null
          id?: string
          language?: string | null
          country?: string | null
          is_new_user?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      waitlist_users: {
        Row: {
          id: string
          email: string
          created_at: string
          status: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          status?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: { Args: { invite_token: string }; Returns: Json }
      add_group_member_ghost: {
        Args: { p_group_id: string; p_name: string; p_member_id?: string }
        Returns: Json
      }
      create_group_with_admin: {
        Args: { p_name: string; p_group_id?: string; p_member_id?: string }
        Returns: Json
      }
      finalize_user_onboarding: {
        Args: { p_country: string; p_language: string }
        Returns: undefined
      }
      increment_waitlist_count: { Args: Record<PropertyKey, never>; Returns: number }
      merge_or_insert_member: {
        Args: { p_group_id: string; p_user_id: string; p_name: string }
        Returns: undefined
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
