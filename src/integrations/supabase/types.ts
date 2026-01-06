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
      classification_codes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          final_destination: string | null
          id: string
          is_active: boolean
          level: number
          name: string
          parent_id: string | null
          retention_years: number | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          final_destination?: string | null
          id?: string
          is_active?: boolean
          level?: number
          name: string
          parent_id?: string | null
          retention_years?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          final_destination?: string | null
          id?: string
          is_active?: boolean
          level?: number
          name?: string
          parent_id?: string | null
          retention_years?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "classification_codes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "classification_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_audit_log: {
        Row: {
          action: string
          created_at: string
          description: string | null
          document_id: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          performed_by: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          document_id: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          document_id?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_audit_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_comments: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          document_id: string
          id: string
          is_internal: boolean
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          document_id: string
          id?: string
          is_internal?: boolean
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          document_id?: string
          id?: string
          is_internal?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_comments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_files: {
        Row: {
          created_at: string
          document_id: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          is_main_file: boolean
          mime_type: string
          uploaded_by: string | null
          version: number
        }
        Insert: {
          created_at?: string
          document_id: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          is_main_file?: boolean
          mime_type: string
          uploaded_by?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          document_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          is_main_file?: boolean
          mime_type?: string
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_files_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_movements: {
        Row: {
          action_type: string
          created_at: string
          dispatch_text: string | null
          document_id: string
          from_unit_id: string | null
          from_user_id: string | null
          id: string
          is_read: boolean
          notes: string | null
          read_at: string | null
          to_unit_id: string
          to_user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          dispatch_text?: string | null
          document_id: string
          from_unit_id?: string | null
          from_user_id?: string | null
          id?: string
          is_read?: boolean
          notes?: string | null
          read_at?: string | null
          to_unit_id: string
          to_user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          dispatch_text?: string | null
          document_id?: string
          from_unit_id?: string | null
          from_user_id?: string | null
          id?: string
          is_read?: boolean
          notes?: string | null
          read_at?: string | null
          to_unit_id?: string
          to_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_movements_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_movements_from_unit_id_fkey"
            columns: ["from_unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_movements_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_movements_to_unit_id_fkey"
            columns: ["to_unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_movements_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_signatures: {
        Row: {
          device_info: string | null
          document_id: string
          id: string
          ip_address: string | null
          is_valid: boolean
          signature_data: string | null
          signature_type: string
          signed_at: string
          signer_id: string
        }
        Insert: {
          device_info?: string | null
          document_id: string
          id?: string
          ip_address?: string | null
          is_valid?: boolean
          signature_data?: string | null
          signature_type: string
          signed_at?: string
          signer_id: string
        }
        Update: {
          device_info?: string | null
          document_id?: string
          id?: string
          ip_address?: string | null
          is_valid?: boolean
          signature_data?: string | null
          signature_type?: string
          signed_at?: string
          signer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_signatures_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_signatures_signer_id_fkey"
            columns: ["signer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          code: string
          created_at: string
          default_classification_id: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          requires_signature: boolean
        }
        Insert: {
          code: string
          created_at?: string
          default_classification_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          requires_signature?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          default_classification_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          requires_signature?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "document_types_default_classification_id_fkey"
            columns: ["default_classification_id"]
            isOneToOne: false
            referencedRelation: "classification_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          archived_at: string | null
          classification_id: string | null
          confidentiality: string
          created_at: string
          created_by: string | null
          current_unit_id: string | null
          description: string | null
          document_type_id: string | null
          due_date: string | null
          entry_date: string
          entry_number: string
          external_reference: string | null
          id: string
          is_archived: boolean
          origin: string | null
          origin_unit_id: string | null
          priority: string
          responsible_user_id: string | null
          sender_institution: string | null
          sender_name: string | null
          status: string
          subject: string | null
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          classification_id?: string | null
          confidentiality?: string
          created_at?: string
          created_by?: string | null
          current_unit_id?: string | null
          description?: string | null
          document_type_id?: string | null
          due_date?: string | null
          entry_date?: string
          entry_number: string
          external_reference?: string | null
          id?: string
          is_archived?: boolean
          origin?: string | null
          origin_unit_id?: string | null
          priority?: string
          responsible_user_id?: string | null
          sender_institution?: string | null
          sender_name?: string | null
          status?: string
          subject?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          classification_id?: string | null
          confidentiality?: string
          created_at?: string
          created_by?: string | null
          current_unit_id?: string | null
          description?: string | null
          document_type_id?: string | null
          due_date?: string | null
          entry_date?: string
          entry_number?: string
          external_reference?: string | null
          id?: string
          is_archived?: boolean
          origin?: string | null
          origin_unit_id?: string | null
          priority?: string
          responsible_user_id?: string | null
          sender_institution?: string | null
          sender_name?: string | null
          status?: string
          subject?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "classification_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_current_unit_id_fkey"
            columns: ["current_unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_origin_unit_id_fkey"
            columns: ["origin_unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          id: string
          movement_arquivamento: boolean
          movement_despacho: boolean
          movement_devolucao: boolean
          movement_encaminhamento: boolean
          movement_recebimento: boolean
          play_sound: boolean
          show_toast: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movement_arquivamento?: boolean
          movement_despacho?: boolean
          movement_devolucao?: boolean
          movement_encaminhamento?: boolean
          movement_recebimento?: boolean
          play_sound?: boolean
          show_toast?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movement_arquivamento?: boolean
          movement_despacho?: boolean
          movement_devolucao?: boolean
          movement_encaminhamento?: boolean
          movement_recebimento?: boolean
          play_sound?: boolean
          show_toast?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organizational_units: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          level: number
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          level?: number
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          level?: number
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizational_units_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "organizational_units"
            referencedColumns: ["id"]
          },
        ]
      }
      process_audit_log: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          performed_by: string | null
          process_id: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          process_id: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          process_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_audit_log_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      process_comments: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: string
          is_internal: boolean | null
          process_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          process_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          process_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_comments_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      process_documents: {
        Row: {
          created_at: string
          description: string | null
          document_id: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          process_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_id?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          process_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          document_id?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          process_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_documents_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      process_movements: {
        Row: {
          action_type: string
          created_at: string
          created_by: string | null
          dispatch_text: string | null
          from_unit_id: string | null
          from_user_id: string | null
          id: string
          is_read: boolean | null
          notes: string | null
          process_id: string
          read_at: string | null
          to_unit_id: string | null
          to_user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          created_by?: string | null
          dispatch_text?: string | null
          from_unit_id?: string | null
          from_user_id?: string | null
          id?: string
          is_read?: boolean | null
          notes?: string | null
          process_id: string
          read_at?: string | null
          to_unit_id?: string | null
          to_user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          created_by?: string | null
          dispatch_text?: string | null
          from_unit_id?: string | null
          from_user_id?: string | null
          id?: string
          is_read?: boolean | null
          notes?: string | null
          process_id?: string
          read_at?: string | null
          to_unit_id?: string | null
          to_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_movements_from_unit_id_fkey"
            columns: ["from_unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_movements_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_movements_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_movements_to_unit_id_fkey"
            columns: ["to_unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_movements_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      process_opinions: {
        Row: {
          author_id: string | null
          content: string | null
          created_at: string
          decision: string | null
          id: string
          opinion_number: string
          opinion_type: string
          process_id: string
          summary: string
          unit_id: string | null
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          decision?: string | null
          id?: string
          opinion_number: string
          opinion_type: string
          process_id: string
          summary: string
          unit_id?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          decision?: string | null
          id?: string
          opinion_number?: string
          opinion_type?: string
          process_id?: string
          summary?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_opinions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_opinions_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_opinions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_units"
            referencedColumns: ["id"]
          },
        ]
      }
      process_stages: {
        Row: {
          assigned_user_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          duration_days: number | null
          id: string
          name: string
          notes: string | null
          process_id: string
          stage_order: number
          started_at: string | null
          status: string
          unit_id: string | null
        }
        Insert: {
          assigned_user_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          duration_days?: number | null
          id?: string
          name: string
          notes?: string | null
          process_id: string
          stage_order: number
          started_at?: string | null
          status?: string
          unit_id?: string | null
        }
        Update: {
          assigned_user_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          duration_days?: number | null
          id?: string
          name?: string
          notes?: string | null
          process_id?: string
          stage_order?: number
          started_at?: string | null
          status?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_stages_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_stages_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_stages_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_stages_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_units"
            referencedColumns: ["id"]
          },
        ]
      }
      process_types: {
        Row: {
          code: string
          created_at: string
          default_sla_days: number | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          requires_approval: boolean | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          default_sla_days?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          requires_approval?: boolean | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          default_sla_days?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          requires_approval?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      processes: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          current_unit_id: string | null
          deadline: string | null
          description: string | null
          external_requester_info: Json | null
          id: string
          origin: string | null
          priority: Database["public"]["Enums"]["process_priority"]
          process_number: string
          process_type_id: string | null
          requester_name: string | null
          requester_unit_id: string | null
          responsible_user_id: string | null
          sla_days: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["process_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          current_unit_id?: string | null
          deadline?: string | null
          description?: string | null
          external_requester_info?: Json | null
          id?: string
          origin?: string | null
          priority?: Database["public"]["Enums"]["process_priority"]
          process_number: string
          process_type_id?: string | null
          requester_name?: string | null
          requester_unit_id?: string | null
          responsible_user_id?: string | null
          sla_days?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["process_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          current_unit_id?: string | null
          deadline?: string | null
          description?: string | null
          external_requester_info?: Json | null
          id?: string
          origin?: string | null
          priority?: Database["public"]["Enums"]["process_priority"]
          process_number?: string
          process_type_id?: string | null
          requester_name?: string | null
          requester_unit_id?: string | null
          responsible_user_id?: string | null
          sla_days?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["process_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processes_current_unit_id_fkey"
            columns: ["current_unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_process_type_id_fkey"
            columns: ["process_type_id"]
            isOneToOne: false
            referencedRelation: "process_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_requester_unit_id_fkey"
            columns: ["requester_unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          position: string | null
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          position?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          position?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      process_priority: "baixa" | "normal" | "alta" | "urgente"
      process_status:
        | "rascunho"
        | "em_andamento"
        | "aguardando_aprovacao"
        | "aprovado"
        | "rejeitado"
        | "suspenso"
        | "arquivado"
        | "concluido"
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
      process_priority: ["baixa", "normal", "alta", "urgente"],
      process_status: [
        "rascunho",
        "em_andamento",
        "aguardando_aprovacao",
        "aprovado",
        "rejeitado",
        "suspenso",
        "arquivado",
        "concluido",
      ],
    },
  },
} as const
