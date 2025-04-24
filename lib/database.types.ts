export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      activities: {
        Row: {
          id: string
          user_id: string
          action_type: string
          description: string
          entity_type: string | null
          entity_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action_type: string
          description: string
          entity_type?: string | null
          entity_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action_type?: string
          description?: string
          entity_type?: string | null
          entity_id?: string | null
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          status: string
          priority: string | null
          due_date: string | null
          case_id: string | null
          assigned_to: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: string
          priority?: string | null
          due_date?: string | null
          case_id?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: string
          priority?: string | null
          due_date?: string | null
          case_id?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      cases: {
        Row: {
          id: string
          case_number: string
          title: string
          description: string | null
          client_id: string
          status: string
          court_id: string
          created_at: string
          updated_at: string | null
          next_session_date: string | null
          case_type: string
          case_value: number | null
          fee_type: string | null
          priority: string
        }
        Insert: {
          id?: string
          case_number: string
          title: string
          description?: string | null
          client_id: string
          status: string
          court_id: string
          created_at?: string
          updated_at?: string | null
          next_session_date?: string | null
          case_type: string
          case_value?: number | null
          fee_type?: string | null
          priority: string
        }
        Update: {
          id?: string
          case_number?: string
          title?: string
          description?: string | null
          client_id?: string
          status?: string
          court_id?: string
          created_at?: string
          updated_at?: string | null
          next_session_date?: string | null
          case_type?: string
          case_value?: number | null
          fee_type?: string | null
          priority?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          }
        ]
      }
      clients: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          address: string | null
          company_name: string | null
          notes: string | null
          client_type: string
          city: string | null
          postal_code: string | null
          national_id: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          company_name?: string | null
          notes?: string | null
          client_type: string
          city?: string | null
          postal_code?: string | null
          national_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          company_name?: string | null
          notes?: string | null
          client_type?: string
          city?: string | null
          postal_code?: string | null
          national_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      court_sessions: {
        Row: {
          id: string
          case_id: string
          session_date: string
          session_time: string | null
          notes: string | null
          location: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          case_id: string
          session_date: string
          session_time?: string | null
          notes?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          case_id?: string
          session_date?: string
          session_time?: string | null
          notes?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      courts: {
        Row: {
          id: string
          name: string
          location: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          location?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          location?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      team_members: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          role: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          role?: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          role?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      case_parties: {
        Row: {
          id: string
          case_id: string
          name: string
          role: string
          type: string
          contact: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          case_id: string
          name: string
          role: string
          type: string
          contact?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          case_id?: string
          name?: string
          role?: string
          type?: string
          contact?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_parties_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          }
        ]
      }
      case_documents: {
        Row: {
          id: string
          case_id: string
          name: string
          description: string | null
          document_date: string | null
          file_path: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          case_id: string
          name: string
          description?: string | null
          document_date?: string | null
          file_path?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          case_id?: string
          name?: string
          description?: string | null
          document_date?: string | null
          file_path?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          }
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 