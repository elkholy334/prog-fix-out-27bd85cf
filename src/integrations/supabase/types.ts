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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          technician_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          technician_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          technician_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          address: string | null
          assigned_technicians: string[] | null
          client_name: string
          completion_time: string | null
          created_at: string
          expected_amount: number | null
          id: number
          is_archived: boolean
          is_favorite: boolean | null
          money_delivered_to_shop: boolean | null
          paid_amount: number | null
          phone: string
          problem: string | null
          repair_date: string | null
          required_technician: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          shop_net: number | null
          sort_order: number | null
          start_time: string | null
          status: string
          technician_commission: number | null
          technician_id: string | null
          technician_notes: string | null
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_technicians?: string[] | null
          client_name: string
          completion_time?: string | null
          created_at?: string
          expected_amount?: number | null
          id?: number
          is_archived?: boolean
          is_favorite?: boolean | null
          money_delivered_to_shop?: boolean | null
          paid_amount?: number | null
          phone: string
          problem?: string | null
          repair_date?: string | null
          required_technician?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          shop_net?: number | null
          sort_order?: number | null
          start_time?: string | null
          status?: string
          technician_commission?: number | null
          technician_id?: string | null
          technician_notes?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_technicians?: string[] | null
          client_name?: string
          completion_time?: string | null
          created_at?: string
          expected_amount?: number | null
          id?: number
          is_archived?: boolean
          is_favorite?: boolean | null
          money_delivered_to_shop?: boolean | null
          paid_amount?: number | null
          phone?: string
          problem?: string | null
          repair_date?: string | null
          required_technician?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          shop_net?: number | null
          sort_order?: number | null
          start_time?: string | null
          status?: string
          technician_commission?: number | null
          technician_id?: string | null
          technician_notes?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_required_technician_fkey"
            columns: ["required_technician"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_required_technician_fkey"
            columns: ["required_technician"]
            isOneToOne: false
            referencedRelation: "technicians_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians_public"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_transactions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          task_id: number | null
          technician_id: string
          type: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          task_id?: number | null
          technician_id: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          task_id?: number | null
          technician_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_transactions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_transactions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_transactions_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_transactions_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians_public"
            referencedColumns: ["id"]
          },
        ]
      }
      technicians: {
        Row: {
          color: string
          commission_rate: number | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          is_admin: boolean | null
          name: string
          phone: string | null
          tasks_count: number
          updated_at: string
        }
        Insert: {
          color?: string
          commission_rate?: number | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_admin?: boolean | null
          name: string
          phone?: string | null
          tasks_count?: number
          updated_at?: string
        }
        Update: {
          color?: string
          commission_rate?: number | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_admin?: boolean | null
          name?: string
          phone?: string | null
          tasks_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_text: string
          message_type: string
          recipient_name: string
          recipient_phone: string
          status: string
          task_id: number | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_text: string
          message_type?: string
          recipient_name?: string
          recipient_phone: string
          status?: string
          task_id?: number | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_text?: string
          message_type?: string
          recipient_name?: string
          recipient_phone?: string
          status?: string
          task_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      tasks_view: {
        Row: {
          address: string | null
          assigned_technicians: string[] | null
          client_name: string | null
          completion_time: string | null
          created_at: string | null
          expected_amount: number | null
          id: number | null
          is_archived: boolean | null
          is_favorite: boolean | null
          money_delivered_to_shop: boolean | null
          paid_amount: number | null
          phone: string | null
          problem: string | null
          repair_date: string | null
          required_technician: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          shop_net: number | null
          sort_order: number | null
          start_time: string | null
          status: string | null
          technician_commission: number | null
          technician_id: string | null
          technician_notes: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          assigned_technicians?: string[] | null
          client_name?: string | null
          completion_time?: string | null
          created_at?: string | null
          expected_amount?: never
          id?: number | null
          is_archived?: boolean | null
          is_favorite?: boolean | null
          money_delivered_to_shop?: never
          paid_amount?: never
          phone?: never
          problem?: string | null
          repair_date?: string | null
          required_technician?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          shop_net?: never
          sort_order?: number | null
          start_time?: string | null
          status?: string | null
          technician_commission?: never
          technician_id?: string | null
          technician_notes?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          assigned_technicians?: string[] | null
          client_name?: string | null
          completion_time?: string | null
          created_at?: string | null
          expected_amount?: never
          id?: number | null
          is_archived?: boolean | null
          is_favorite?: boolean | null
          money_delivered_to_shop?: never
          paid_amount?: never
          phone?: never
          problem?: string | null
          repair_date?: string | null
          required_technician?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          shop_net?: never
          sort_order?: number | null
          start_time?: string | null
          status?: string | null
          technician_commission?: never
          technician_id?: string | null
          technician_notes?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_required_technician_fkey"
            columns: ["required_technician"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_required_technician_fkey"
            columns: ["required_technician"]
            isOneToOne: false
            referencedRelation: "technicians_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians_public"
            referencedColumns: ["id"]
          },
        ]
      }
      technicians_public: {
        Row: {
          color: string | null
          id: string | null
          is_active: boolean | null
          is_admin: boolean | null
          name: string | null
          tasks_count: number | null
        }
        Insert: {
          color?: string | null
          id?: string | null
          is_active?: boolean | null
          is_admin?: boolean | null
          name?: string | null
          tasks_count?: number | null
        }
        Update: {
          color?: string | null
          id?: string | null
          is_active?: boolean | null
          is_admin?: boolean | null
          name?: string | null
          tasks_count?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_login_users: {
        Args: never
        Returns: {
          color: string
          email: string
          id: string
          is_admin: boolean
          name: string
        }[]
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
      app_role: "admin" | "technician"
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
      app_role: ["admin", "technician"],
    },
  },
} as const
