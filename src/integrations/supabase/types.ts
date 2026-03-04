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
          created_at: string
          description: string
          discount: number
          due_at: string | null
          external_reference: string | null
          fine: number
          generated_at: string | null
          id: string
          interest: number
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
          created_at?: string
          description?: string
          discount?: number
          due_at?: string | null
          external_reference?: string | null
          fine?: number
          generated_at?: string | null
          id?: string
          interest?: number
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
          created_at?: string
          description?: string
          discount?: number
          due_at?: string | null
          external_reference?: string | null
          fine?: number
          generated_at?: string | null
          id?: string
          interest?: number
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
          sent_at: string | null
          system_name: string | null
          updated_at: string
          valid_days: number
          valid_until: string | null
          view_status: string
          views_count: number
          whatsapp_clicked_at: string | null
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
          sent_at?: string | null
          system_name?: string | null
          updated_at?: string
          valid_days?: number
          valid_until?: string | null
          view_status?: string
          views_count?: number
          whatsapp_clicked_at?: string | null
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
          sent_at?: string | null
          system_name?: string | null
          updated_at?: string
          valid_days?: number
          valid_until?: string | null
          view_status?: string
          views_count?: number
          whatsapp_clicked_at?: string | null
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
          metadata: Json | null
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
          metadata?: Json | null
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
          metadata?: Json | null
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
