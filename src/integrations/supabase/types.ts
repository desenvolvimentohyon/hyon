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
      asaas_settings: {
        Row: {
          created_at: string
          default_billing_type: string
          default_due_days: number
          description_template: string | null
          enabled: boolean
          environment: string
          fine_percent: number | null
          id: string
          interest_percent_month: number | null
          org_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_billing_type?: string
          default_due_days?: number
          description_template?: string | null
          enabled?: boolean
          environment?: string
          fine_percent?: number | null
          id?: string
          interest_percent_month?: number | null
          org_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_billing_type?: string
          default_due_days?: number
          description_template?: string | null
          enabled?: boolean
          environment?: string
          fine_percent?: number | null
          id?: string
          interest_percent_month?: number | null
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asaas_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_webhook_events: {
        Row: {
          created_at: string
          error: string | null
          event_id: string | null
          event_type: string
          id: string
          org_id: string
          payload: Json
          payment_id: string
          processed: boolean
          processed_at: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_id?: string | null
          event_type: string
          id?: string
          org_id: string
          payload?: Json
          payment_id: string
          processed?: boolean
          processed_at?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          event_id?: string | null
          event_type?: string
          id?: string
          org_id?: string
          payload?: Json
          payment_id?: string
          processed?: boolean
          processed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asaas_webhook_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
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
      billing_notifications: {
        Row: {
          channel: string
          client_id: string
          created_at: string
          id: string
          org_id: string
          sent_at: string | null
          title_id: string | null
          type: string
        }
        Insert: {
          channel?: string
          client_id: string
          created_at?: string
          id?: string
          org_id: string
          sent_at?: string | null
          title_id?: string | null
          type: string
        }
        Update: {
          channel?: string
          client_id?: string
          created_at?: string
          id?: string
          org_id?: string
          sent_at?: string | null
          title_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_notifications_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "financial_titles"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_rules: {
        Row: {
          auto_email: boolean | null
          auto_task: boolean | null
          auto_whatsapp: boolean | null
          created_at: string
          days_after: number[] | null
          days_before: number[] | null
          id: string
          on_due_day: boolean | null
          org_id: string
          updated_at: string
        }
        Insert: {
          auto_email?: boolean | null
          auto_task?: boolean | null
          auto_whatsapp?: boolean | null
          created_at?: string
          days_after?: number[] | null
          days_before?: number[] | null
          id?: string
          on_due_day?: boolean | null
          org_id: string
          updated_at?: string
        }
        Update: {
          auto_email?: boolean | null
          auto_task?: boolean | null
          auto_whatsapp?: boolean | null
          created_at?: string
          days_after?: number[] | null
          days_before?: number[] | null
          id?: string
          on_due_day?: boolean | null
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      card_clients: {
        Row: {
          card_machine_type: Database["public"]["Enums"]["card_machine_type"]
          city: string | null
          cnpj: string | null
          company_name: string | null
          created_at: string
          email: string | null
          id: string
          linked_client_id: string | null
          name: string
          notes: string | null
          org_id: string
          phone: string
          status: Database["public"]["Enums"]["card_client_status"]
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          card_machine_type?: Database["public"]["Enums"]["card_machine_type"]
          city?: string | null
          cnpj?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          linked_client_id?: string | null
          name: string
          notes?: string | null
          org_id: string
          phone?: string
          status?: Database["public"]["Enums"]["card_client_status"]
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          card_machine_type?: Database["public"]["Enums"]["card_machine_type"]
          city?: string | null
          cnpj?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          linked_client_id?: string | null
          name?: string
          notes?: string | null
          org_id?: string
          phone?: string
          status?: Database["public"]["Enums"]["card_client_status"]
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_clients_linked_client_id_fkey"
            columns: ["linked_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_clients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      card_commissions: {
        Row: {
          card_client_id: string
          commission_percent: number
          commission_value: number
          competency: string
          created_at: string
          gross_volume: number
          id: string
          org_id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["card_commission_status"]
        }
        Insert: {
          card_client_id: string
          commission_percent?: number
          commission_value?: number
          competency: string
          created_at?: string
          gross_volume?: number
          id?: string
          org_id: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["card_commission_status"]
        }
        Update: {
          card_client_id?: string
          commission_percent?: number
          commission_value?: number
          competency?: string
          created_at?: string
          gross_volume?: number
          id?: string
          org_id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["card_commission_status"]
        }
        Relationships: [
          {
            foreignKeyName: "card_commissions_card_client_id_fkey"
            columns: ["card_client_id"]
            isOneToOne: false
            referencedRelation: "card_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_commissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      card_fee_profiles: {
        Row: {
          active: boolean
          aluguel_mensal: number | null
          antecipacao_percent: number
          card_client_id: string
          created_at: string
          id: string
          mdr_credito_1x_percent: number
          mdr_credito_2a6_percent: number
          mdr_credito_7a12_percent: number
          mdr_debito_percent: number
          observacoes: string | null
          org_id: string
          prazo_repasse: number
        }
        Insert: {
          active?: boolean
          aluguel_mensal?: number | null
          antecipacao_percent?: number
          card_client_id: string
          created_at?: string
          id?: string
          mdr_credito_1x_percent?: number
          mdr_credito_2a6_percent?: number
          mdr_credito_7a12_percent?: number
          mdr_debito_percent?: number
          observacoes?: string | null
          org_id: string
          prazo_repasse?: number
        }
        Update: {
          active?: boolean
          aluguel_mensal?: number | null
          antecipacao_percent?: number
          card_client_id?: string
          created_at?: string
          id?: string
          mdr_credito_1x_percent?: number
          mdr_credito_2a6_percent?: number
          mdr_credito_7a12_percent?: number
          mdr_debito_percent?: number
          observacoes?: string | null
          org_id?: string
          prazo_repasse?: number
        }
        Relationships: [
          {
            foreignKeyName: "card_fee_profiles_card_client_id_fkey"
            columns: ["card_client_id"]
            isOneToOne: false
            referencedRelation: "card_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_fee_profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      card_proposal_onboarding: {
        Row: {
          card_client_id: string
          card_proposal_id: string
          completed_at: string | null
          created_at: string
          data_payload: Json | null
          id: string
          org_id: string
          requested_at: string | null
          status: Database["public"]["Enums"]["card_onboarding_status"]
        }
        Insert: {
          card_client_id: string
          card_proposal_id: string
          completed_at?: string | null
          created_at?: string
          data_payload?: Json | null
          id?: string
          org_id: string
          requested_at?: string | null
          status?: Database["public"]["Enums"]["card_onboarding_status"]
        }
        Update: {
          card_client_id?: string
          card_proposal_id?: string
          completed_at?: string | null
          created_at?: string
          data_payload?: Json | null
          id?: string
          org_id?: string
          requested_at?: string | null
          status?: Database["public"]["Enums"]["card_onboarding_status"]
        }
        Relationships: [
          {
            foreignKeyName: "card_proposal_onboarding_card_client_id_fkey"
            columns: ["card_client_id"]
            isOneToOne: false
            referencedRelation: "card_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_proposal_onboarding_card_proposal_id_fkey"
            columns: ["card_proposal_id"]
            isOneToOne: false
            referencedRelation: "card_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_proposal_onboarding_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      card_proposals: {
        Row: {
          accepted_at: string | null
          accepted_by_name: string | null
          card_client_id: string
          commission_percent: number
          created_at: string
          fee_profile_snapshot: Json | null
          first_viewed_at: string | null
          id: string
          machine_type: Database["public"]["Enums"]["card_machine_type"]
          org_id: string
          public_token: string
          refused_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["card_proposal_status"]
          title: string
          updated_at: string
          validity_days: number
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_name?: string | null
          card_client_id: string
          commission_percent?: number
          created_at?: string
          fee_profile_snapshot?: Json | null
          first_viewed_at?: string | null
          id?: string
          machine_type?: Database["public"]["Enums"]["card_machine_type"]
          org_id: string
          public_token?: string
          refused_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["card_proposal_status"]
          title?: string
          updated_at?: string
          validity_days?: number
        }
        Update: {
          accepted_at?: string | null
          accepted_by_name?: string | null
          card_client_id?: string
          commission_percent?: number
          created_at?: string
          fee_profile_snapshot?: Json | null
          first_viewed_at?: string | null
          id?: string
          machine_type?: Database["public"]["Enums"]["card_machine_type"]
          org_id?: string
          public_token?: string
          refused_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["card_proposal_status"]
          title?: string
          updated_at?: string
          validity_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "card_proposals_card_client_id_fkey"
            columns: ["card_client_id"]
            isOneToOne: false
            referencedRelation: "card_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_proposals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      card_revenue_monthly: {
        Row: {
          card_client_id: string
          competency: string
          created_at: string
          gross_volume: number
          id: string
          notes: string | null
          org_id: string
        }
        Insert: {
          card_client_id: string
          competency: string
          created_at?: string
          gross_volume?: number
          id?: string
          notes?: string | null
          org_id: string
        }
        Update: {
          card_client_id?: string
          competency?: string
          created_at?: string
          gross_volume?: number
          id?: string
          notes?: string | null
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_revenue_monthly_card_client_id_fkey"
            columns: ["card_client_id"]
            isOneToOne: false
            referencedRelation: "card_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_revenue_monthly_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_attachments: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          file_path: string
          file_type: string
          id: string
          org_id: string
          uploaded_by: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          file_path: string
          file_type?: string
          id?: string
          org_id: string
          uploaded_by?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          file_path?: string
          file_type?: string
          id?: string
          org_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_attachments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_attachments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          client_id: string
          created_at: string
          email: string | null
          id: string
          is_billing_preferred: boolean | null
          is_support_preferred: boolean | null
          name: string
          org_id: string
          phone: string | null
          roles: string[] | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_billing_preferred?: boolean | null
          is_support_preferred?: boolean | null
          name: string
          org_id: string
          phone?: string | null
          roles?: string[] | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_billing_preferred?: boolean | null
          is_support_preferred?: boolean | null
          name?: string
          org_id?: string
          phone?: string | null
          roles?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_contacts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_modules: {
        Row: {
          client_id: string
          created_at: string
          id: string
          module_id: string
          org_id: string
          quantity: number
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          module_id: string
          org_id: string
          quantity?: number
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          module_id?: string
          org_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_modules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "system_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_modules_org_id_fkey"
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
          address_cep: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_reference: string | null
          address_street: string | null
          address_uf: string | null
          adjustment_base_date: string | null
          adjustment_percent: number | null
          adjustment_type: string | null
          asaas_customer_id: string | null
          billing_address_json: Json | null
          billing_document: string | null
          billing_email: string | null
          billing_phone: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cert_expires_at: string | null
          cert_file_path: string | null
          cert_issuer: string | null
          cert_recognition_date: string | null
          cert_serial: string | null
          city: string | null
          cnae_principal: string | null
          company_branch_type: string | null
          contract_signed_at: string | null
          contract_start_at: string | null
          cost_active: boolean
          cost_system_name: string | null
          created_at: string
          default_due_day: number | null
          document: string | null
          email: string | null
          environment_notes: string | null
          external_client_id: string | null
          fiscal_notes: string | null
          health_score: number | null
          health_status: string | null
          id: string
          legal_name: string | null
          metadata: Json | null
          monthly_cost_value: number
          monthly_value_base: number
          monthly_value_final: number
          name: string
          notes: string | null
          onboarding_completed_steps: string[]
          org_id: string
          phone: string | null
          plan_id: string | null
          portal_token: string | null
          preferred_channel: string | null
          primary_contact_best_time: string | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          primary_contact_role: string | null
          recurrence_active: boolean
          ref_partner_end_at: string | null
          ref_partner_id: string | null
          ref_partner_recur_apply_on: string | null
          ref_partner_recur_months: number | null
          ref_partner_recur_percent: number | null
          ref_partner_start_at: string | null
          risk_reason: string | null
          state_registration: string | null
          status: string
          support_type: string | null
          system_name: string | null
          tags: string[] | null
          tax_regime: string | null
          technical_notes: string | null
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          accountant_email?: string | null
          accountant_name?: string | null
          accountant_office?: string | null
          accountant_phone?: string | null
          address_cep?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_reference?: string | null
          address_street?: string | null
          address_uf?: string | null
          adjustment_base_date?: string | null
          adjustment_percent?: number | null
          adjustment_type?: string | null
          asaas_customer_id?: string | null
          billing_address_json?: Json | null
          billing_document?: string | null
          billing_email?: string | null
          billing_phone?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cert_expires_at?: string | null
          cert_file_path?: string | null
          cert_issuer?: string | null
          cert_recognition_date?: string | null
          cert_serial?: string | null
          city?: string | null
          cnae_principal?: string | null
          company_branch_type?: string | null
          contract_signed_at?: string | null
          contract_start_at?: string | null
          cost_active?: boolean
          cost_system_name?: string | null
          created_at?: string
          default_due_day?: number | null
          document?: string | null
          email?: string | null
          environment_notes?: string | null
          external_client_id?: string | null
          fiscal_notes?: string | null
          health_score?: number | null
          health_status?: string | null
          id?: string
          legal_name?: string | null
          metadata?: Json | null
          monthly_cost_value?: number
          monthly_value_base?: number
          monthly_value_final?: number
          name: string
          notes?: string | null
          onboarding_completed_steps?: string[]
          org_id: string
          phone?: string | null
          plan_id?: string | null
          portal_token?: string | null
          preferred_channel?: string | null
          primary_contact_best_time?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          primary_contact_role?: string | null
          recurrence_active?: boolean
          ref_partner_end_at?: string | null
          ref_partner_id?: string | null
          ref_partner_recur_apply_on?: string | null
          ref_partner_recur_months?: number | null
          ref_partner_recur_percent?: number | null
          ref_partner_start_at?: string | null
          risk_reason?: string | null
          state_registration?: string | null
          status?: string
          support_type?: string | null
          system_name?: string | null
          tags?: string[] | null
          tax_regime?: string | null
          technical_notes?: string | null
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          accountant_email?: string | null
          accountant_name?: string | null
          accountant_office?: string | null
          accountant_phone?: string | null
          address_cep?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_reference?: string | null
          address_street?: string | null
          address_uf?: string | null
          adjustment_base_date?: string | null
          adjustment_percent?: number | null
          adjustment_type?: string | null
          asaas_customer_id?: string | null
          billing_address_json?: Json | null
          billing_document?: string | null
          billing_email?: string | null
          billing_phone?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cert_expires_at?: string | null
          cert_file_path?: string | null
          cert_issuer?: string | null
          cert_recognition_date?: string | null
          cert_serial?: string | null
          city?: string | null
          cnae_principal?: string | null
          company_branch_type?: string | null
          contract_signed_at?: string | null
          contract_start_at?: string | null
          cost_active?: boolean
          cost_system_name?: string | null
          created_at?: string
          default_due_day?: number | null
          document?: string | null
          email?: string | null
          environment_notes?: string | null
          external_client_id?: string | null
          fiscal_notes?: string | null
          health_score?: number | null
          health_status?: string | null
          id?: string
          legal_name?: string | null
          metadata?: Json | null
          monthly_cost_value?: number
          monthly_value_base?: number
          monthly_value_final?: number
          name?: string
          notes?: string | null
          onboarding_completed_steps?: string[]
          org_id?: string
          phone?: string | null
          plan_id?: string | null
          portal_token?: string | null
          preferred_channel?: string | null
          primary_contact_best_time?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          primary_contact_role?: string | null
          recurrence_active?: boolean
          ref_partner_end_at?: string | null
          ref_partner_id?: string | null
          ref_partner_recur_apply_on?: string | null
          ref_partner_recur_months?: number | null
          ref_partner_recur_percent?: number | null
          ref_partner_start_at?: string | null
          risk_reason?: string | null
          state_registration?: string | null
          status?: string
          support_type?: string | null
          system_name?: string | null
          tags?: string[] | null
          tax_regime?: string | null
          technical_notes?: string | null
          trade_name?: string | null
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
      company_bank_accounts: {
        Row: {
          account: string | null
          account_type: string | null
          agency: string | null
          bank_code: string | null
          bank_name: string
          created_at: string
          holder_document: string | null
          holder_name: string | null
          id: string
          is_default: boolean | null
          org_id: string
          pix_key: string | null
          updated_at: string
        }
        Insert: {
          account?: string | null
          account_type?: string | null
          agency?: string | null
          bank_code?: string | null
          bank_name?: string
          created_at?: string
          holder_document?: string | null
          holder_name?: string | null
          id?: string
          is_default?: boolean | null
          org_id: string
          pix_key?: string | null
          updated_at?: string
        }
        Update: {
          account?: string | null
          account_type?: string | null
          agency?: string | null
          bank_code?: string | null
          bank_name?: string
          created_at?: string
          holder_document?: string | null
          holder_name?: string | null
          id?: string
          is_default?: boolean | null
          org_id?: string
          pix_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_bank_accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      company_profile: {
        Row: {
          address_cep: string | null
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_street: string | null
          address_uf: string | null
          cert_cn: string | null
          cert_cnpj: string | null
          cert_file_path: string | null
          cert_issuer: string | null
          cert_valid_from: string | null
          cert_valid_to: string | null
          certificate_expiration: string | null
          certificate_number: string | null
          cnae: string | null
          cnpj: string | null
          created_at: string
          csc_code: string | null
          default_billing_message: string | null
          default_due_day: number | null
          default_interest_percent: number | null
          default_late_fee_percent: number | null
          default_proposal_message: string | null
          email: string | null
          fiscal_notes: string | null
          footer_text: string | null
          id: string
          impl_cost_per_km: number
          impl_daily_rate: number
          impl_default_days: number
          institutional_text: string | null
          legal_name: string | null
          logo_dark_path: string | null
          logo_path: string | null
          municipal_registration: string | null
          org_id: string
          partner_commission_days: number | null
          phone: string | null
          primary_color: string | null
          proposal_validity_days: number | null
          renewal_alert_days: number | null
          renewal_alert_enabled: boolean | null
          renewal_auto_proposal: boolean | null
          renewal_email: boolean | null
          renewal_email_template: string | null
          renewal_same_plan: boolean | null
          renewal_template: string | null
          renewal_validity_days: number | null
          renewal_whatsapp: boolean | null
          renewal_whatsapp_template: string | null
          secondary_color: string | null
          state_registration: string | null
          tax_regime: string | null
          trade_name: string | null
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address_cep?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_street?: string | null
          address_uf?: string | null
          cert_cn?: string | null
          cert_cnpj?: string | null
          cert_file_path?: string | null
          cert_issuer?: string | null
          cert_valid_from?: string | null
          cert_valid_to?: string | null
          certificate_expiration?: string | null
          certificate_number?: string | null
          cnae?: string | null
          cnpj?: string | null
          created_at?: string
          csc_code?: string | null
          default_billing_message?: string | null
          default_due_day?: number | null
          default_interest_percent?: number | null
          default_late_fee_percent?: number | null
          default_proposal_message?: string | null
          email?: string | null
          fiscal_notes?: string | null
          footer_text?: string | null
          id?: string
          impl_cost_per_km?: number
          impl_daily_rate?: number
          impl_default_days?: number
          institutional_text?: string | null
          legal_name?: string | null
          logo_dark_path?: string | null
          logo_path?: string | null
          municipal_registration?: string | null
          org_id: string
          partner_commission_days?: number | null
          phone?: string | null
          primary_color?: string | null
          proposal_validity_days?: number | null
          renewal_alert_days?: number | null
          renewal_alert_enabled?: boolean | null
          renewal_auto_proposal?: boolean | null
          renewal_email?: boolean | null
          renewal_email_template?: string | null
          renewal_same_plan?: boolean | null
          renewal_template?: string | null
          renewal_validity_days?: number | null
          renewal_whatsapp?: boolean | null
          renewal_whatsapp_template?: string | null
          secondary_color?: string | null
          state_registration?: string | null
          tax_regime?: string | null
          trade_name?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address_cep?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_street?: string | null
          address_uf?: string | null
          cert_cn?: string | null
          cert_cnpj?: string | null
          cert_file_path?: string | null
          cert_issuer?: string | null
          cert_valid_from?: string | null
          cert_valid_to?: string | null
          certificate_expiration?: string | null
          certificate_number?: string | null
          cnae?: string | null
          cnpj?: string | null
          created_at?: string
          csc_code?: string | null
          default_billing_message?: string | null
          default_due_day?: number | null
          default_interest_percent?: number | null
          default_late_fee_percent?: number | null
          default_proposal_message?: string | null
          email?: string | null
          fiscal_notes?: string | null
          footer_text?: string | null
          id?: string
          impl_cost_per_km?: number
          impl_daily_rate?: number
          impl_default_days?: number
          institutional_text?: string | null
          legal_name?: string | null
          logo_dark_path?: string | null
          logo_path?: string | null
          municipal_registration?: string | null
          org_id?: string
          partner_commission_days?: number | null
          phone?: string | null
          primary_color?: string | null
          proposal_validity_days?: number | null
          renewal_alert_days?: number | null
          renewal_alert_enabled?: boolean | null
          renewal_auto_proposal?: boolean | null
          renewal_email?: boolean | null
          renewal_email_template?: string | null
          renewal_same_plan?: boolean | null
          renewal_template?: string | null
          renewal_validity_days?: number | null
          renewal_whatsapp?: boolean | null
          renewal_whatsapp_template?: string | null
          secondary_color?: string | null
          state_registration?: string | null
          tax_regime?: string | null
          trade_name?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_profile_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_adjustments: {
        Row: {
          applied_at: string
          client_id: string
          created_at: string
          id: string
          new_value: number
          old_value: number
          org_id: string
          percent_applied: number
        }
        Insert: {
          applied_at?: string
          client_id: string
          created_at?: string
          id?: string
          new_value?: number
          old_value?: number
          org_id: string
          percent_applied?: number
        }
        Update: {
          applied_at?: string
          client_id?: string
          created_at?: string
          id?: string
          new_value?: number
          old_value?: number
          org_id?: string
          percent_applied?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_adjustments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_adjustments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      custom_roles: {
        Row: {
          created_at: string
          description: string
          id: string
          is_system: boolean
          name: string
          org_id: string
          permissions: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_system?: boolean
          name: string
          org_id: string
          permissions?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_system?: boolean
          name?: string
          org_id?: string
          permissions?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deployment_regions: {
        Row: {
          active: boolean
          additional_fee: number
          base_value: number
          created_at: string
          id: string
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          additional_fee?: number
          base_value?: number
          created_at?: string
          id?: string
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          additional_fee?: number
          base_value?: number
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deployment_regions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_project_checklist: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          org_id: string
          project_id: string
          sort_order: number
          stage_id: string | null
          title: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          org_id: string
          project_id: string
          sort_order?: number
          stage_id?: string | null
          title: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          org_id?: string
          project_id?: string
          sort_order?: number
          stage_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_project_checklist_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_project_checklist_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "dev_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_project_checklist_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "dev_project_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_project_stages: {
        Row: {
          completed_at: string | null
          created_at: string
          deadline_at: string | null
          id: string
          notes: string | null
          org_id: string
          project_id: string
          sort_order: number
          status: string
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deadline_at?: string | null
          id?: string
          notes?: string | null
          org_id: string
          project_id: string
          sort_order?: number
          status?: string
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deadline_at?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          project_id?: string
          sort_order?: number
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_project_stages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_project_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "dev_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_projects: {
        Row: {
          client_id: string | null
          completed_at: string | null
          created_at: string
          deadline_at: string | null
          description: string | null
          id: string
          monthly_value: number
          notes: string | null
          org_id: string
          plan_type: string
          project_value: number
          setup_value: number
          started_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          deadline_at?: string | null
          description?: string | null
          id?: string
          monthly_value?: number
          notes?: string | null
          org_id: string
          plan_type?: string
          project_value?: number
          setup_value?: number
          started_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          deadline_at?: string | null
          description?: string | null
          id?: string
          monthly_value?: number
          notes?: string | null
          org_id?: string
          plan_type?: string
          project_value?: number
          setup_value?: number
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_templates: {
        Row: {
          checklist: Json
          created_at: string
          description: string | null
          id: string
          name: string
          org_id: string
          stages: Json
          updated_at: string
        }
        Insert: {
          checklist?: Json
          created_at?: string
          description?: string | null
          id?: string
          name: string
          org_id: string
          stages?: Json
          updated_at?: string
        }
        Update: {
          checklist?: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          stages?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_titles: {
        Row: {
          asaas_bank_slip_url: string | null
          asaas_invoice_url: string | null
          asaas_payment_id: string | null
          asaas_pix_payload: string | null
          asaas_pix_qr_code: string | null
          asaas_status: string | null
          bank_account_id: string | null
          client_id: string | null
          commission_type: string | null
          competency: string | null
          courtesy_reason: string | null
          created_at: string
          description: string
          discount: number
          due_at: string | null
          external_reference: string | null
          fine: number
          generated_at: string | null
          id: string
          interest: number
          is_courtesy: boolean
          issued_at: string | null
          metadata: Json | null
          notes: string | null
          org_id: string
          origin: string | null
          partner_id: string | null
          payment_method_id: string | null
          plan_account_code: string | null
          reference_proposal_id: string | null
          reference_title_id: string | null
          status: string
          supplier_name: string | null
          type: string
          updated_at: string
          value_final: number
          value_original: number
        }
        Insert: {
          asaas_bank_slip_url?: string | null
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          asaas_pix_payload?: string | null
          asaas_pix_qr_code?: string | null
          asaas_status?: string | null
          bank_account_id?: string | null
          client_id?: string | null
          commission_type?: string | null
          competency?: string | null
          courtesy_reason?: string | null
          created_at?: string
          description?: string
          discount?: number
          due_at?: string | null
          external_reference?: string | null
          fine?: number
          generated_at?: string | null
          id?: string
          interest?: number
          is_courtesy?: boolean
          issued_at?: string | null
          metadata?: Json | null
          notes?: string | null
          org_id: string
          origin?: string | null
          partner_id?: string | null
          payment_method_id?: string | null
          plan_account_code?: string | null
          reference_proposal_id?: string | null
          reference_title_id?: string | null
          status?: string
          supplier_name?: string | null
          type: string
          updated_at?: string
          value_final?: number
          value_original?: number
        }
        Update: {
          asaas_bank_slip_url?: string | null
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          asaas_pix_payload?: string | null
          asaas_pix_qr_code?: string | null
          asaas_status?: string | null
          bank_account_id?: string | null
          client_id?: string | null
          commission_type?: string | null
          competency?: string | null
          courtesy_reason?: string | null
          created_at?: string
          description?: string
          discount?: number
          due_at?: string | null
          external_reference?: string | null
          fine?: number
          generated_at?: string | null
          id?: string
          interest?: number
          is_courtesy?: boolean
          issued_at?: string | null
          metadata?: Json | null
          notes?: string | null
          org_id?: string
          origin?: string | null
          partner_id?: string | null
          payment_method_id?: string | null
          plan_account_code?: string | null
          reference_proposal_id?: string | null
          reference_title_id?: string | null
          status?: string
          supplier_name?: string | null
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
            referencedRelation: "company_bank_accounts"
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
      monthly_adjustments: {
        Row: {
          adjustment_date: string
          client_id: string
          created_at: string
          id: string
          new_value: number
          org_id: string
          previous_value: number
          reason: string
        }
        Insert: {
          adjustment_date?: string
          client_id: string
          created_at?: string
          id?: string
          new_value?: number
          org_id: string
          previous_value?: number
          reason?: string
        }
        Update: {
          adjustment_date?: string
          client_id?: string
          created_at?: string
          id?: string
          new_value?: number
          org_id?: string
          previous_value?: number
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_adjustments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_adjustments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          channel: string
          client_id: string
          created_at: string
          error_message: string | null
          id: string
          org_id: string
          plan_end_date: string
          status: string
          target: string | null
          type: string
        }
        Insert: {
          channel: string
          client_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          org_id: string
          plan_end_date: string
          status?: string
          target?: string | null
          type: string
        }
        Update: {
          channel?: string
          client_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          org_id?: string
          plan_end_date?: string
          status?: string
          target?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      partners: {
        Row: {
          active: boolean
          commission_implant_percent: number
          commission_percent: number
          commission_recur_apply_on: string
          commission_recur_months: number
          commission_recur_percent: number
          commission_type: string
          created_at: string
          document: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          org_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          commission_implant_percent?: number
          commission_percent?: number
          commission_recur_apply_on?: string
          commission_recur_months?: number
          commission_recur_percent?: number
          commission_type?: string
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          commission_implant_percent?: number
          commission_percent?: number
          commission_recur_apply_on?: string
          commission_recur_months?: number
          commission_recur_percent?: number
          commission_type?: string
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partners_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      payment_receipts: {
        Row: {
          amount: number
          client_id: string
          competency: string | null
          created_at: string
          file_name: string | null
          file_path: string | null
          file_size: number | null
          id: string
          method: string
          mime_type: string | null
          notes: string | null
          org_id: string
          paid_at: string
          payment_id: string | null
          payment_type: string
          period_end: string | null
          period_start: string | null
          plan_type: string | null
        }
        Insert: {
          amount?: number
          client_id: string
          competency?: string | null
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          method?: string
          mime_type?: string | null
          notes?: string | null
          org_id: string
          paid_at?: string
          payment_id?: string | null
          payment_type?: string
          period_end?: string | null
          period_start?: string | null
          plan_type?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          competency?: string | null
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          method?: string
          mime_type?: string | null
          notes?: string | null
          org_id?: string
          paid_at?: string
          payment_id?: string | null
          payment_type?: string
          period_end?: string | null
          period_start?: string | null
          plan_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_receipts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_receipts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_accounts: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          org_id: string
          parent_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          org_id: string
          parent_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          parent_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "plan_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_renewal_requests: {
        Row: {
          auto_generated: boolean
          client_id: string
          created_at: string
          email_sent_at: string | null
          generated_proposal_id: string | null
          id: string
          org_id: string
          proposal_public_token: string | null
          renewal_for_end_date: string
          status: string
          updated_at: string
          whatsapp_sent_at: string | null
        }
        Insert: {
          auto_generated?: boolean
          client_id: string
          created_at?: string
          email_sent_at?: string | null
          generated_proposal_id?: string | null
          id?: string
          org_id: string
          proposal_public_token?: string | null
          renewal_for_end_date: string
          status?: string
          updated_at?: string
          whatsapp_sent_at?: string | null
        }
        Update: {
          auto_generated?: boolean
          client_id?: string
          created_at?: string
          email_sent_at?: string | null
          generated_proposal_id?: string | null
          id?: string
          org_id?: string
          proposal_public_token?: string | null
          renewal_for_end_date?: string
          status?: string
          updated_at?: string
          whatsapp_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_renewal_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_renewal_requests_generated_proposal_id_fkey"
            columns: ["generated_proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_renewal_requests_org_id_fkey"
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
      portal_referrals: {
        Row: {
          city: string
          client_id: string
          company_name: string
          contact_name: string
          created_at: string
          id: string
          notes: string | null
          org_id: string
          phone: string
          status: string
        }
        Insert: {
          city?: string
          client_id: string
          company_name: string
          contact_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          org_id: string
          phone?: string
          status?: string
        }
        Update: {
          city?: string
          client_id?: string
          company_name?: string
          contact_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string
          phone?: string
          status?: string
        }
        Relationships: []
      }
      portal_suggestions: {
        Row: {
          client_id: string
          created_at: string
          description: string
          id: string
          org_id: string
          status: string
          title: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string
          id?: string
          org_id: string
          status?: string
          title: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string
          id?: string
          org_id?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      portal_ticket_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          org_id: string
          sender_name: string
          sender_type: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string
          org_id: string
          sender_name?: string
          sender_type?: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          org_id?: string
          sender_name?: string
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "portal_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_tickets: {
        Row: {
          client_id: string
          created_at: string
          description: string
          id: string
          linked_task_id: string | null
          org_id: string
          protocol_number: string | null
          status: string
          title: string
          tracking_token: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string
          id?: string
          linked_task_id?: string | null
          org_id: string
          protocol_number?: string | null
          status?: string
          title: string
          tracking_token?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string
          id?: string
          linked_task_id?: string | null
          org_id?: string
          protocol_number?: string | null
          status?: string
          title?: string
          tracking_token?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_tickets_linked_task_id_fkey"
            columns: ["linked_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          custom_role_id: string | null
          full_name: string
          id: string
          is_active: boolean
          org_id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_role_id?: string | null
          full_name?: string
          id: string
          is_active?: boolean
          org_id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_role_id?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          org_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_custom_role_id_fkey"
            columns: ["custom_role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
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
          accepted_at: string | null
          accepted_by_name: string | null
          additional_info: string | null
          client_id: string | null
          client_name_snapshot: string | null
          commission_generated: boolean
          commission_implant_generated: boolean
          created_at: string
          crm_status: string | null
          first_viewed_at: string | null
          id: string
          implementation_flow: string | null
          implementation_installments: number | null
          implementation_value: number
          monthly_value: number
          notes_internal: string | null
          org_id: string
          partner_commission_implant_percent: number | null
          partner_commission_implant_value: number | null
          partner_commission_percent: number | null
          partner_commission_recur_apply_on: string | null
          partner_commission_recur_months: number | null
          partner_commission_recur_percent: number | null
          partner_commission_value: number | null
          partner_id: string | null
          pdf_downloaded_at: string | null
          pdf_generated_at: string | null
          plan_name: string | null
          proposal_number: string
          proposal_type: string
          reference_end_date: string | null
          sent_at: string | null
          system_name: string | null
          updated_at: string
          valid_days: number
          valid_until: string | null
          view_status: string
          views_count: number
          whatsapp_clicked_at: string | null
          whatsapp_send_count: number
          whatsapp_sent_at: string | null
        }
        Insert: {
          acceptance_link?: string | null
          acceptance_status?: string
          accepted_at?: string | null
          accepted_by_name?: string | null
          additional_info?: string | null
          client_id?: string | null
          client_name_snapshot?: string | null
          commission_generated?: boolean
          commission_implant_generated?: boolean
          created_at?: string
          crm_status?: string | null
          first_viewed_at?: string | null
          id?: string
          implementation_flow?: string | null
          implementation_installments?: number | null
          implementation_value?: number
          monthly_value?: number
          notes_internal?: string | null
          org_id: string
          partner_commission_implant_percent?: number | null
          partner_commission_implant_value?: number | null
          partner_commission_percent?: number | null
          partner_commission_recur_apply_on?: string | null
          partner_commission_recur_months?: number | null
          partner_commission_recur_percent?: number | null
          partner_commission_value?: number | null
          partner_id?: string | null
          pdf_downloaded_at?: string | null
          pdf_generated_at?: string | null
          plan_name?: string | null
          proposal_number: string
          proposal_type?: string
          reference_end_date?: string | null
          sent_at?: string | null
          system_name?: string | null
          updated_at?: string
          valid_days?: number
          valid_until?: string | null
          view_status?: string
          views_count?: number
          whatsapp_clicked_at?: string | null
          whatsapp_send_count?: number
          whatsapp_sent_at?: string | null
        }
        Update: {
          acceptance_link?: string | null
          acceptance_status?: string
          accepted_at?: string | null
          accepted_by_name?: string | null
          additional_info?: string | null
          client_id?: string | null
          client_name_snapshot?: string | null
          commission_generated?: boolean
          commission_implant_generated?: boolean
          created_at?: string
          crm_status?: string | null
          first_viewed_at?: string | null
          id?: string
          implementation_flow?: string | null
          implementation_installments?: number | null
          implementation_value?: number
          monthly_value?: number
          notes_internal?: string | null
          org_id?: string
          partner_commission_implant_percent?: number | null
          partner_commission_implant_value?: number | null
          partner_commission_percent?: number | null
          partner_commission_recur_apply_on?: string | null
          partner_commission_recur_months?: number | null
          partner_commission_recur_percent?: number | null
          partner_commission_value?: number | null
          partner_id?: string | null
          pdf_downloaded_at?: string | null
          pdf_generated_at?: string | null
          plan_name?: string | null
          proposal_number?: string
          proposal_type?: string
          reference_end_date?: string | null
          sent_at?: string | null
          system_name?: string | null
          updated_at?: string
          valid_days?: number
          valid_until?: string | null
          view_status?: string
          views_count?: number
          whatsapp_clicked_at?: string | null
          whatsapp_send_count?: number
          whatsapp_sent_at?: string | null
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
          {
            foreignKeyName: "proposals_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          device_name: string | null
          endpoint: string
          id: string
          is_active: boolean
          org_id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          device_name?: string | null
          endpoint: string
          id?: string
          is_active?: boolean
          org_id: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          device_name?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean
          org_id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
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
          is_global: boolean
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
          is_global?: boolean
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
          is_global?: boolean
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
          linked_ticket_id: string | null
          metadata: Json | null
          org_id: string
          priority: string
          sistema_relacionado: string | null
          source: string
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
          linked_ticket_id?: string | null
          metadata?: Json | null
          org_id: string
          priority?: string
          sistema_relacionado?: string | null
          source?: string
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
          linked_ticket_id?: string | null
          metadata?: Json | null
          org_id?: string
          priority?: string
          sistema_relacionado?: string | null
          source?: string
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
            foreignKeyName: "tasks_linked_ticket_id_fkey"
            columns: ["linked_ticket_id"]
            isOneToOne: false
            referencedRelation: "portal_tickets"
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
      upsell_suggestions: {
        Row: {
          client_id: string
          created_at: string
          id: string
          org_id: string
          status: string
          suggested_module_id: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          org_id: string
          status?: string
          suggested_module_id?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          org_id?: string
          status?: string
          suggested_module_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "upsell_suggestions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_suggestions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_suggestions_suggested_module_id_fkey"
            columns: ["suggested_module_id"]
            isOneToOne: false
            referencedRelation: "system_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          org_id: string
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_org_id_fkey"
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
      get_user_permissions: { Args: { _user_id: string }; Returns: string[] }
      has_permission: { Args: { _permission: string }; Returns: boolean }
    }
    Enums: {
      card_client_status:
        | "lead"
        | "proposta_enviada"
        | "em_negociacao"
        | "ativo"
        | "recusado"
        | "inativo"
      card_commission_status: "previsto" | "confirmado" | "pago"
      card_machine_type: "fiscal" | "nao_fiscal"
      card_onboarding_status:
        | "pendente"
        | "solicitado"
        | "recebido"
        | "concluido"
      card_proposal_status:
        | "draft"
        | "enviada"
        | "visualizada"
        | "aceita"
        | "recusada"
        | "expirada"
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
      card_client_status: [
        "lead",
        "proposta_enviada",
        "em_negociacao",
        "ativo",
        "recusado",
        "inativo",
      ],
      card_commission_status: ["previsto", "confirmado", "pago"],
      card_machine_type: ["fiscal", "nao_fiscal"],
      card_onboarding_status: [
        "pendente",
        "solicitado",
        "recebido",
        "concluido",
      ],
      card_proposal_status: [
        "draft",
        "enviada",
        "visualizada",
        "aceita",
        "recusada",
        "expirada",
      ],
    },
  },
} as const
