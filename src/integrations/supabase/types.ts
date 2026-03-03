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
      bank_accounts: {
        Row: {
          account: string | null
          agency: string | null
          bank: string | null
          created_at: string
          id: string
          name: string
          org_id: string
          type: string | null
          updated_at: string
        }
        Insert: {
          account?: string | null
          agency?: string | null
          bank?: string | null
          created_at?: string
          id?: string
          name: string
          org_id: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          account?: string | null
          agency?: string | null
          bank?: string | null
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          bank_account_id: string
          created_at: string
          date: string
          description: string
          id: string
          linked_title_id: string | null
          org_id: string
          reconciled: boolean
          type: string
          value: number
        }
        Insert: {
          bank_account_id: string
          created_at?: string
          date: string
          description?: string
          id?: string
          linked_title_id?: string | null
          org_id: string
          reconciled?: boolean
          type: string
          value?: number
        }
        Update: {
          bank_account_id?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          linked_title_id?: string | null
          org_id?: string
          reconciled?: boolean
          type?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_linked_title_id_fkey"
            columns: ["linked_title_id"]
            isOneToOne: false
            referencedRelation: "financial_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          accountant_email: string | null
          accountant_name: string | null
          accountant_office: string | null
          accountant_phone: string | null
          cert_expires_at: string | null
          cert_file_path: string | null
          cert_issuer: string | null
          cert_recognition_date: string | null
          cert_serial: string | null
          city: string | null
          contract_signed_at: string | null
          created_at: string
          document: string | null
          email: string | null
          external_client_id: string | null
          id: string
          monthly_value_base: number
          monthly_value_final: number
          name: string
          org_id: string
          phone: string | null
          plan_id: string | null
          recurrence_active: boolean
          status: string
          updated_at: string
        }
        Insert: {
          accountant_email?: string | null
          accountant_name?: string | null
          accountant_office?: string | null
          accountant_phone?: string | null
          cert_expires_at?: string | null
          cert_file_path?: string | null
          cert_issuer?: string | null
          cert_recognition_date?: string | null
          cert_serial?: string | null
          city?: string | null
          contract_signed_at?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          external_client_id?: string | null
          id?: string
          monthly_value_base?: number
          monthly_value_final?: number
          name: string
          org_id: string
          phone?: string | null
          plan_id?: string | null
          recurrence_active?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          accountant_email?: string | null
          accountant_name?: string | null
          accountant_office?: string | null
          accountant_phone?: string | null
          cert_expires_at?: string | null
          cert_file_path?: string | null
          cert_issuer?: string | null
          cert_recognition_date?: string | null
          cert_serial?: string | null
          city?: string | null
          contract_signed_at?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          external_client_id?: string | null
          id?: string
          monthly_value_base?: number
          monthly_value_final?: number
          name?: string
          org_id?: string
          phone?: string | null
          plan_id?: string | null
          recurrence_active?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_statuses: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          org_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          org_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          org_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_statuses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_titles: {
        Row: {
          bank_account_id: string | null
          client_id: string | null
          competency: string | null
          created_at: string
          description: string
          discount: number
          due_at: string | null
          fine: number
          id: string
          interest: number
          issued_at: string | null
          org_id: string
          origin: string | null
          payment_method_id: string | null
          plan_account_code: string | null
          status: string
          type: string
          updated_at: string
          value_final: number
          value_original: number
        }
        Insert: {
          bank_account_id?: string | null
          client_id?: string | null
          competency?: string | null
          created_at?: string
          description?: string
          discount?: number
          due_at?: string | null
          fine?: number
          id?: string
          interest?: number
          issued_at?: string | null
          org_id: string
          origin?: string | null
          payment_method_id?: string | null
          plan_account_code?: string | null
          status?: string
          type: string
          updated_at?: string
          value_final?: number
          value_original?: number
        }
        Update: {
          bank_account_id?: string | null
          client_id?: string | null
          competency?: string | null
          created_at?: string
          description?: string
          discount?: number
          due_at?: string | null
          fine?: number
          id?: string
          interest?: number
          issued_at?: string | null
          org_id?: string
          origin?: string | null
          payment_method_id?: string | null
          plan_account_code?: string | null
          status?: string
          type?: string
          updated_at?: string
          value_final?: number
          value_original?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_titles_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_titles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_titles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_titles_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          notes: string | null
          org_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          org_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          created_at: string
          discount_percent: number
          id: string
          months_validity: number
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          discount_percent?: number
          id?: string
          months_validity?: number
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          discount_percent?: number
          id?: string
          months_validity?: number
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          org_id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          is_active?: boolean
          org_id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          org_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_items: {
        Row: {
          created_at: string
          description: string
          id: string
          org_id: string
          proposal_id: string
          quantity: number
          unit_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          org_id: string
          proposal_id: string
          quantity?: number
          unit_value?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          org_id?: string
          proposal_id?: string
          quantity?: number
          unit_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_settings: {
        Row: {
          additional_info_default: string | null
          alert_days_before_expiry: number
          company_name: string | null
          created_at: string
          default_message_template: string | null
          default_send_method: string
          default_valid_days: number
          id: string
          logo_path: string | null
          org_id: string
          pdf_footer: string | null
          updated_at: string
        }
        Insert: {
          additional_info_default?: string | null
          alert_days_before_expiry?: number
          company_name?: string | null
          created_at?: string
          default_message_template?: string | null
          default_send_method?: string
          default_valid_days?: number
          id?: string
          logo_path?: string | null
          org_id: string
          pdf_footer?: string | null
          updated_at?: string
        }
        Update: {
          additional_info_default?: string | null
          alert_days_before_expiry?: number
          company_name?: string | null
          created_at?: string
          default_message_template?: string | null
          default_send_method?: string
          default_valid_days?: number
          id?: string
          logo_path?: string | null
          org_id?: string
          pdf_footer?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          acceptance_link: string | null
          acceptance_status: string
          additional_info: string | null
          client_id: string | null
          client_name_snapshot: string | null
          created_at: string
          crm_status: string | null
          id: string
          implementation_flow: string | null
          implementation_installments: number | null
          implementation_value: number
          monthly_value: number
          notes_internal: string | null
          org_id: string
          pdf_generated_at: string | null
          plan_name: string | null
          proposal_number: string
          sent_at: string | null
          system_name: string | null
          updated_at: string
          valid_days: number
          valid_until: string | null
          view_status: string
        }
        Insert: {
          acceptance_link?: string | null
          acceptance_status?: string
          additional_info?: string | null
          client_id?: string | null
          client_name_snapshot?: string | null
          created_at?: string
          crm_status?: string | null
          id?: string
          implementation_flow?: string | null
          implementation_installments?: number | null
          implementation_value?: number
          monthly_value?: number
          notes_internal?: string | null
          org_id: string
          pdf_generated_at?: string | null
          plan_name?: string | null
          proposal_number: string
          sent_at?: string | null
          system_name?: string | null
          updated_at?: string
          valid_days?: number
          valid_until?: string | null
          view_status?: string
        }
        Update: {
          acceptance_link?: string | null
          acceptance_status?: string
          additional_info?: string | null
          client_id?: string | null
          client_name_snapshot?: string | null
          created_at?: string
          crm_status?: string | null
          id?: string
          implementation_flow?: string | null
          implementation_installments?: number | null
          implementation_value?: number
          monthly_value?: number
          notes_internal?: string | null
          org_id?: string
          pdf_generated_at?: string | null
          plan_name?: string | null
          proposal_number?: string
          sent_at?: string | null
          system_name?: string | null
          updated_at?: string
          valid_days?: number
          valid_until?: string | null
          view_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_events: {
        Row: {
          client_id: string
          created_at: string
          duration_minutes: number
          id: string
          org_id: string
          resolved: boolean
          type: string
        }
        Insert: {
          client_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          org_id: string
          resolved?: boolean
          type?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          org_id?: string
          resolved?: boolean
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_modules: {
        Row: {
          active: boolean
          cost_value: number
          created_at: string
          description: string | null
          id: string
          name: string
          org_id: string
          sale_value: number
          system_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          cost_value?: number
          created_at?: string
          description?: string | null
          id?: string
          name: string
          org_id: string
          sale_value?: number
          system_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          cost_value?: number
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          sale_value?: number
          system_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_modules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_modules_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      systems_catalog: {
        Row: {
          active: boolean
          cost_value: number
          created_at: string
          description: string | null
          id: string
          name: string
          org_id: string
          sale_value: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          cost_value?: number
          created_at?: string
          description?: string | null
          id?: string
          name: string
          org_id: string
          sale_value?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          cost_value?: number
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          sale_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "systems_catalog_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_profile_id: string
          created_at: string
          id: string
          org_id: string
          task_id: string
          text: string
          updated_at: string
        }
        Insert: {
          author_profile_id: string
          created_at?: string
          id?: string
          org_id: string
          task_id: string
          text: string
          updated_at?: string
        }
        Update: {
          author_profile_id?: string
          created_at?: string
          id?: string
          org_id?: string
          task_id?: string
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_history: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          org_id: string
          task_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          org_id: string
          task_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          org_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_profile_id: string | null
          client_id: string | null
          created_at: string
          description: string
          due_at: string | null
          id: string
          org_id: string
          priority: string
          sistema_relacionado: string | null
          status: string
          tags: string[] | null
          timer_running: boolean
          timer_started_at: string | null
          tipo_operacional: string
          title: string
          total_seconds: number
          updated_at: string
        }
        Insert: {
          assignee_profile_id?: string | null
          client_id?: string | null
          created_at?: string
          description?: string
          due_at?: string | null
          id?: string
          org_id: string
          priority?: string
          sistema_relacionado?: string | null
          status?: string
          tags?: string[] | null
          timer_running?: boolean
          timer_started_at?: string | null
          tipo_operacional?: string
          title: string
          total_seconds?: number
          updated_at?: string
        }
        Update: {
          assignee_profile_id?: string | null
          client_id?: string | null
          created_at?: string
          description?: string
          due_at?: string | null
          id?: string
          org_id?: string
          priority?: string
          sistema_relacionado?: string | null
          status?: string
          tags?: string[] | null
          timer_running?: boolean
          timer_started_at?: string | null
          tipo_operacional?: string
          title?: string
          total_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_profile_id_fkey"
            columns: ["assignee_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_org_id: { Args: never; Returns: string }
      current_role: { Args: never; Returns: string }
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
