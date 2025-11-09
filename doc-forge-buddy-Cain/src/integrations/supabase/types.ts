export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.4';
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: Database['public']['Enums']['audit_action'];
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          ip_address: string | null;
          metadata: Json | null;
          new_data: Json | null;
          old_data: Json | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          action: Database['public']['Enums']['audit_action'];
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          new_data?: Json | null;
          old_data?: Json | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: Database['public']['Enums']['audit_action'];
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          new_data?: Json | null;
          old_data?: Json | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      chat_embeddings: {
        Row: {
          created_at: string | null;
          embedding: string | null;
          id: string;
          message_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          embedding?: string | null;
          id?: string;
          message_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          embedding?: string | null;
          id?: string;
          message_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_embeddings_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'chat_messages';
            referencedColumns: ['id'];
          },
        ];
      };
      chat_feedback: {
        Row: {
          comment: string | null;
          created_at: string | null;
          feedback_type: string | null;
          id: string;
          message_id: string | null;
          rating: number | null;
          user_id: string | null;
        };
        Insert: {
          comment?: string | null;
          created_at?: string | null;
          feedback_type?: string | null;
          id?: string;
          message_id?: string | null;
          rating?: number | null;
          user_id?: string | null;
        };
        Update: {
          comment?: string | null;
          created_at?: string | null;
          feedback_type?: string | null;
          id?: string;
          message_id?: string | null;
          rating?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_feedback_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'chat_messages';
            referencedColumns: ['id'];
          },
        ];
      };
      chat_images: {
        Row: {
          created_at: string | null;
          file_name: string | null;
          file_size: number | null;
          file_type: string | null;
          id: string;
          image_data: string | null;
          image_url: string;
          message_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          image_data?: string | null;
          image_url: string;
          message_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          image_data?: string | null;
          image_url?: string;
          message_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_images_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'chat_messages';
            referencedColumns: ['id'];
          },
        ];
      };
      chat_messages: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          metadata: Json | null;
          role: string;
          session_id: string | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          role: string;
          session_id?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          role?: string;
          session_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_messages_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'chat_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      chat_metrics: {
        Row: {
          created_at: string | null;
          id: string;
          metadata: Json | null;
          metric_name: string;
          metric_value: number;
          session_id: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          metric_name: string;
          metric_value: number;
          session_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          metric_name?: string;
          metric_value?: number;
          session_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_metrics_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'chat_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      chat_sessions: {
        Row: {
          created_at: string | null;
          id: string;
          metadata: Json | null;
          mode: string;
          title: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          mode?: string;
          title?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          mode?: string;
          title?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      contracts: {
        Row: {
          created_at: string;
          data_comunicacao: string;
          data_inicio_desocupacao: string;
          data_termino_desocupacao: string;
          email_proprietario: string;
          endereco_imovel: string;
          id: string;
          nome_locatario: string;
          nome_proprietario: string;
          numero_contrato: string;
          prazo_dias: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          data_comunicacao: string;
          data_inicio_desocupacao: string;
          data_termino_desocupacao: string;
          email_proprietario: string;
          endereco_imovel: string;
          id?: string;
          nome_locatario: string;
          nome_proprietario: string;
          numero_contrato: string;
          prazo_dias: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          data_comunicacao?: string;
          data_inicio_desocupacao?: string;
          data_termino_desocupacao?: string;
          email_proprietario?: string;
          endereco_imovel?: string;
          id?: string;
          nome_locatario?: string;
          nome_proprietario?: string;
          numero_contrato?: string;
          prazo_dias?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      contract_bills: {
        Row: {
          bill_type: string;
          contract_id: string;
          created_at: string;
          delivered: boolean;
          delivered_at: string | null;
          id: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          bill_type: string;
          contract_id: string;
          created_at?: string;
          delivered?: boolean;
          delivered_at?: string | null;
          id?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          bill_type?: string;
          contract_id?: string;
          created_at?: string;
          delivered?: boolean;
          delivered_at?: string | null;
          id?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_contract';
            columns: ['contract_id'];
            isOneToOne: false;
            referencedRelation: 'saved_terms';
            referencedColumns: ['id'];
          },
        ];
      };
      knowledge_entries: {
        Row: {
          content: string;
          created_at: string | null;
          embedding: string | null;
          id: string;
          metadata: Json | null;
          source_type: string | null;
          title: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          embedding?: string | null;
          id?: string;
          metadata?: Json | null;
          source_type?: string | null;
          title: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          embedding?: string | null;
          id?: string;
          metadata?: Json | null;
          source_type?: string | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      login_attempts: {
        Row: {
          created_at: string;
          email: string;
          failure_reason: string | null;
          id: string;
          ip_address: string | null;
          success: boolean;
        };
        Insert: {
          created_at?: string;
          email: string;
          failure_reason?: string | null;
          id?: string;
          ip_address?: string | null;
          success: boolean;
        };
        Update: {
          created_at?: string;
          email?: string;
          failure_reason?: string | null;
          id?: string;
          ip_address?: string | null;
          success?: boolean;
        };
        Relationships: [];
      };
      password_history: {
        Row: {
          created_at: string;
          id: string;
          password_hash: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          password_hash: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          password_hash?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'password_history_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      permissions: {
        Row: {
          action: Database['public']['Enums']['permission_action'];
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          module: Database['public']['Enums']['system_module'];
          name: string;
          updated_at: string;
        };
        Insert: {
          action: Database['public']['Enums']['permission_action'];
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          module: Database['public']['Enums']['system_module'];
          name: string;
          updated_at?: string;
        };
        Update: {
          action?: Database['public']['Enums']['permission_action'];
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          module?: Database['public']['Enums']['system_module'];
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      prestadores: {
        Row: {
          cnpj: string | null;
          created_at: string | null;
          email: string | null;
          endereco: string | null;
          especialidade: string | null;
          id: string;
          nome: string;
          observacoes: string | null;
          telefone: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          cnpj?: string | null;
          created_at?: string | null;
          email?: string | null;
          endereco?: string | null;
          especialidade?: string | null;
          id?: string;
          nome: string;
          observacoes?: string | null;
          telefone?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          cnpj?: string | null;
          created_at?: string | null;
          email?: string | null;
          endereco?: string | null;
          especialidade?: string | null;
          id?: string;
          nome?: string;
          observacoes?: string | null;
          telefone?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          exp: number;
          full_name: string | null;
          id: string;
          is_active: boolean;
          last_password_change: string | null;
          level: number;
          role: Database['public']['Enums']['user_role'];
          two_factor_backup_codes: string[] | null;
          two_factor_enabled: boolean;
          two_factor_secret: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          exp?: number;
          full_name?: string | null;
          id?: string;
          is_active?: boolean;
          last_password_change?: string | null;
          level?: number;
          role?: Database['public']['Enums']['user_role'];
          two_factor_backup_codes?: string[] | null;
          two_factor_enabled?: boolean;
          two_factor_secret?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          exp?: number;
          full_name?: string | null;
          id?: string;
          is_active?: boolean;
          last_password_change?: string | null;
          level?: number;
          role?: Database['public']['Enums']['user_role'];
          two_factor_backup_codes?: string[] | null;
          two_factor_enabled?: boolean;
          two_factor_secret?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      public_documents: {
        Row: {
          contract_id: string | null;
          created_at: string | null;
          created_by: string | null;
          html_content: string;
          id: string;
          title: string | null;
        };
        Insert: {
          contract_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          html_content: string;
          id?: string;
          title?: string | null;
        };
        Update: {
          contract_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          html_content?: string;
          id?: string;
          title?: string | null;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          created_at: string;
          id: string;
          permission_id: string;
          role: Database['public']['Enums']['user_role'];
        };
        Insert: {
          created_at?: string;
          id?: string;
          permission_id: string;
          role: Database['public']['Enums']['user_role'];
        };
        Update: {
          created_at?: string;
          id?: string;
          permission_id?: string;
          role?: Database['public']['Enums']['user_role'];
        };
        Relationships: [
          {
            foreignKeyName: 'role_permissions_permission_id_fkey';
            columns: ['permission_id'];
            isOneToOne: false;
            referencedRelation: 'permissions';
            referencedColumns: ['id'];
          },
        ];
      };
      saved_terms: {
        Row: {
          content: string;
          created_at: string;
          document_type: string;
          form_data: Json;
          id: string;
          title: string;
          updated_at: string;
          user_id: string | null;
          teve_vistoria: boolean | null;
          teve_revistoria: boolean | null;
          data_vistoria: string | null;
          data_revistoria: string | null;
          vistoria_id: string | null;
          revistoria_id: string | null;
        };
        Insert: {
          content: string;
          created_at?: string;
          document_type: string;
          form_data: Json;
          id?: string;
          title: string;
          updated_at?: string;
          user_id?: string | null;
          teve_vistoria?: boolean | null;
          teve_revistoria?: boolean | null;
          data_vistoria?: string | null;
          data_revistoria?: string | null;
          vistoria_id?: string | null;
          revistoria_id?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string;
          document_type?: string;
          form_data?: Json;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id?: string | null;
          teve_vistoria?: boolean | null;
          teve_revistoria?: boolean | null;
          data_vistoria?: string | null;
          data_revistoria?: string | null;
          vistoria_id?: string | null;
          revistoria_id?: string | null;
        };
        Relationships: [];
      };
      eviction_reasons: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string;
          id: string;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description: string;
          id?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string;
          id?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'eviction_reasons_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_permissions: {
        Row: {
          created_at: string;
          expires_at: string | null;
          granted: boolean;
          granted_by: string | null;
          id: string;
          permission_id: string;
          reason: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expires_at?: string | null;
          granted: boolean;
          granted_by?: string | null;
          id?: string;
          permission_id: string;
          reason?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string | null;
          granted?: boolean;
          granted_by?: string | null;
          id?: string;
          permission_id?: string;
          reason?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_permissions_granted_by_fkey';
            columns: ['granted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'user_permissions_permission_id_fkey';
            columns: ['permission_id'];
            isOneToOne: false;
            referencedRelation: 'permissions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_permissions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_sessions: {
        Row: {
          created_at: string;
          device_info: Json | null;
          expires_at: string;
          id: string;
          ip_address: string | null;
          is_active: boolean;
          last_activity: string;
          session_token: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          device_info?: Json | null;
          expires_at: string;
          id?: string;
          ip_address?: string | null;
          is_active?: boolean;
          last_activity?: string;
          session_token: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          device_info?: Json | null;
          expires_at?: string;
          id?: string;
          ip_address?: string | null;
          is_active?: boolean;
          last_activity?: string;
          session_token?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          metadata: Json;
          read: boolean;
          read_at: string | null;
          created_at: string;
          expires_at: string | null;
          priority: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          metadata?: Json;
          read?: boolean;
          read_at?: string | null;
          created_at?: string;
          expires_at?: string | null;
          priority?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          metadata?: Json;
          read?: boolean;
          read_at?: string | null;
          created_at?: string;
          expires_at?: string | null;
          priority?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      vistoria_analises: {
        Row: {
          apontamentos: Json;
          contract_id: string | null;
          created_at: string;
          dados_vistoria: Json;
          id: string;
          public_document_id: string | null;
          title: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          apontamentos?: Json;
          contract_id?: string | null;
          created_at?: string;
          dados_vistoria?: Json;
          id?: string;
          public_document_id?: string | null;
          title: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          apontamentos?: Json;
          contract_id?: string | null;
          created_at?: string;
          dados_vistoria?: Json;
          id?: string;
          public_document_id?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'vistoria_analises_contract_id_fkey';
            columns: ['contract_id'];
            isOneToOne: false;
            referencedRelation: 'saved_terms';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vistoria_analises_public_document_id_fkey';
            columns: ['public_document_id'];
            isOneToOne: false;
            referencedRelation: 'public_documents';
            referencedColumns: ['id'];
          },
        ];
      };
      vistoria_images: {
        Row: {
          apontamento_id: string;
          created_at: string;
          file_name: string;
          file_size: number;
          file_type: string;
          id: string;
          image_url: string;
          image_serial: string | null;
          tipo_vistoria: string;
          user_id: string | null;
          vistoria_id: string | null;
        };
        Insert: {
          apontamento_id: string;
          created_at?: string;
          file_name: string;
          file_size: number;
          file_type: string;
          id?: string;
          image_url: string;
          image_serial?: string | null;
          tipo_vistoria: string;
          user_id?: string | null;
          vistoria_id?: string | null;
        };
        Update: {
          apontamento_id?: string;
          created_at?: string;
          file_name?: string;
          file_size?: number;
          file_type?: string;
          id?: string;
          image_url?: string;
          image_serial?: string | null;
          tipo_vistoria?: string;
          user_id?: string | null;
          vistoria_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'vistoria_images_vistoria_id_fkey';
            columns: ['vistoria_id'];
            isOneToOne: false;
            referencedRelation: 'vistoria_analises';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_password_to_history: {
        Args: {
          p_max_history?: number;
          p_password_hash: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
      binary_quantize: {
        Args: { '': string } | { '': unknown };
        Returns: unknown;
      };
      check_users_without_profile: {
        Args: Record<PropertyKey, never>;
        Returns: {
          created_at: string;
          email: string;
          has_profile: boolean;
          user_id: string;
        }[];
      };
      cleanup_expired_sessions_manual: {
        Args: Record<PropertyKey, never>;
        Returns: {
          newest_deleted: string;
          oldest_deleted: string;
          sessions_deleted: number;
        }[];
      };
      create_user_session: {
        Args: {
          p_device_info?: Json;
          p_expires_hours?: number;
          p_ip_address: string;
          p_session_token: string;
          p_user_agent: string;
          p_user_id: string;
        };
        Returns: string;
      };
      fix_orphan_profiles: {
        Args: Record<PropertyKey, never>;
        Returns: {
          action: string;
          email: string;
          profile_id: string;
          success: boolean;
        }[];
      };
      get_audit_logs: {
        Args: {
          p_action?: Database['public']['Enums']['audit_action'];
          p_end_date?: string;
          p_entity_type?: string;
          p_limit?: number;
          p_offset?: number;
          p_start_date?: string;
          p_user_id?: string;
        };
        Returns: {
          action: Database['public']['Enums']['audit_action'];
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          ip_address: string;
          metadata: Json;
          new_data: Json;
          old_data: Json;
          user_agent: string;
          user_email: string;
          user_id: string;
          user_name: string;
        }[];
      };
      get_audit_stats: {
        Args: { p_end_date?: string; p_start_date?: string };
        Returns: {
          events_by_action: Json;
          events_by_day: Json;
          events_by_entity: Json;
          top_users: Json;
          total_events: number;
        }[];
      };
      get_integrity_stats: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_user_active_sessions: {
        Args: { p_user_id: string };
        Returns: {
          created_at: string;
          device_info: Json;
          id: string;
          ip_address: string;
          is_current: boolean;
          last_activity: string;
          session_token: string;
          user_agent: string;
        }[];
      };
      get_user_permissions: {
        Args: { p_user_id: string };
        Returns: {
          action: Database['public']['Enums']['permission_action'];
          custom_grant: boolean;
          description: string;
          expires_at: string;
          granted_by_role: boolean;
          module: Database['public']['Enums']['system_module'];
          name: string;
        }[];
      };
      get_user_satisfaction_stats: {
        Args: { user_id_param: string };
        Returns: {
          avg_rating: number;
          negative_feedback: number;
          positive_feedback: number;
          total_feedback: number;
        }[];
      };
      grant_all_permissions_to_admin: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      grant_basic_permissions_to_user: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      halfvec_avg: {
        Args: { '': number[] };
        Returns: unknown;
      };
      halfvec_out: {
        Args: { '': unknown };
        Returns: unknown;
      };
      halfvec_send: {
        Args: { '': unknown };
        Returns: string;
      };
      halfvec_typmod_in: {
        Args: { '': unknown[] };
        Returns: number;
      };
      hnsw_bit_support: {
        Args: { '': unknown };
        Returns: unknown;
      };
      hnsw_halfvec_support: {
        Args: { '': unknown };
        Returns: unknown;
      };
      hnsw_sparsevec_support: {
        Args: { '': unknown };
        Returns: unknown;
      };
      hnswhandler: {
        Args: { '': unknown };
        Returns: unknown;
      };
      insert_default_permissions: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      is_password_in_history: {
        Args: { p_password_hash: string; p_user_id: string };
        Returns: boolean;
      };
      is_user_locked_out: {
        Args: {
          p_email: string;
          p_lockout_minutes?: number;
          p_max_attempts?: number;
        };
        Returns: boolean;
      };
      ivfflat_bit_support: {
        Args: { '': unknown };
        Returns: unknown;
      };
      ivfflat_halfvec_support: {
        Args: { '': unknown };
        Returns: unknown;
      };
      ivfflathandler: {
        Args: { '': unknown };
        Returns: unknown;
      };
      l2_norm: {
        Args: { '': unknown } | { '': unknown };
        Returns: number;
      };
      l2_normalize: {
        Args: { '': string } | { '': unknown } | { '': unknown };
        Returns: string;
      };
      log_audit_event: {
        Args: {
          p_action: Database['public']['Enums']['audit_action'];
          p_entity_id: string;
          p_entity_type: string;
          p_ip_address?: string;
          p_metadata?: Json;
          p_new_data?: Json;
          p_old_data?: Json;
          p_user_agent?: string;
          p_user_id: string;
        };
        Returns: string;
      };
      record_login_attempt: {
        Args: {
          p_email: string;
          p_failure_reason?: string;
          p_ip_address: string;
          p_success: boolean;
        };
        Returns: string;
      };
      search_knowledge: {
        Args: {
          match_count?: number;
          match_threshold?: number;
          query_embedding: string;
          source_type_filter?: string;
          user_id_filter?: string;
        };
        Returns: {
          content: string;
          entry_id: string;
          metadata: Json;
          similarity: number;
          source_type: string;
          title: string;
        }[];
      };
      search_similar_messages: {
        Args: {
          match_count?: number;
          match_threshold?: number;
          query_embedding: string;
          user_id_filter?: string;
        };
        Returns: {
          content: string;
          created_at: string;
          message_id: string;
          similarity: number;
        }[];
      };
      sparsevec_out: {
        Args: { '': unknown };
        Returns: unknown;
      };
      sparsevec_send: {
        Args: { '': unknown };
        Returns: string;
      };
      sparsevec_typmod_in: {
        Args: { '': unknown[] };
        Returns: number;
      };
      terminate_session: {
        Args: { p_session_id: string };
        Returns: boolean;
      };
      update_session_activity: {
        Args: { p_session_token: string };
        Returns: boolean;
      };
      user_has_permission: {
        Args: {
          p_action: Database['public']['Enums']['permission_action'];
          p_module: Database['public']['Enums']['system_module'];
          p_user_id: string;
        };
        Returns: boolean;
      };
      vector_avg: {
        Args: { '': number[] };
        Returns: string;
      };
      vector_dims: {
        Args: { '': string } | { '': unknown };
        Returns: number;
      };
      vector_norm: {
        Args: { '': string };
        Returns: number;
      };
      vector_out: {
        Args: { '': string };
        Returns: unknown;
      };
      vector_send: {
        Args: { '': string };
        Returns: string;
      };
      vector_typmod_in: {
        Args: { '': unknown[] };
        Returns: number;
      };
    };
    Enums: {
      audit_action:
        | 'CREATE'
        | 'UPDATE'
        | 'DELETE'
        | 'LOGIN'
        | 'LOGOUT'
        | 'LOGIN_FAILED'
        | 'PASSWORD_RESET'
        | 'BULK_UPDATE'
        | 'BULK_DELETE'
        | 'EXPORT'
        | 'IMPORT'
        | 'PERMISSION_CHANGE'
        | 'ROLE_CHANGE'
        | 'STATUS_CHANGE';
      permission_action:
        | 'view'
        | 'create'
        | 'update'
        | 'delete'
        | 'export'
        | 'import'
        | 'bulk_edit'
        | 'manage_permissions';
      system_module:
        | 'users'
        | 'contracts'
        | 'prestadores'
        | 'vistorias'
        | 'documents'
        | 'reports'
        | 'audit'
        | 'settings'
        | 'admin';
      user_role: 'admin' | 'user';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      audit_action: [
        'CREATE',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'LOGIN_FAILED',
        'PASSWORD_RESET',
        'BULK_UPDATE',
        'BULK_DELETE',
        'EXPORT',
        'IMPORT',
        'PERMISSION_CHANGE',
        'ROLE_CHANGE',
        'STATUS_CHANGE',
      ],
      permission_action: [
        'view',
        'create',
        'update',
        'delete',
        'export',
        'import',
        'bulk_edit',
        'manage_permissions',
      ],
      system_module: [
        'users',
        'contracts',
        'prestadores',
        'vistorias',
        'documents',
        'reports',
        'audit',
        'settings',
        'admin',
      ],
      user_role: ['admin', 'user'],
    },
  },
} as const;
