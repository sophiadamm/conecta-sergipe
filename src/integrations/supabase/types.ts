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
      conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          participant_1: string
          participant_2: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_1: string
          participant_2: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_1?: string
          participant_2?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_participant_1_fkey"
            columns: ["participant_1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_fkey"
            columns: ["participant_2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          feedback_ong: string | null
          feedback_voluntario: string | null
          horas_validadas: number | null
          id: string
          opportunity_id: string
          rating: number | null
          rating_voluntario: number | null
          status: Database["public"]["Enums"]["match_status"]
          tags_ong: string[] | null
          tags_voluntario: string[] | null
          updated_at: string
          voluntario_id: string
        }
        Insert: {
          created_at?: string
          feedback_ong?: string | null
          feedback_voluntario?: string | null
          horas_validadas?: number | null
          id?: string
          opportunity_id: string
          rating?: number | null
          rating_voluntario?: number | null
          status?: Database["public"]["Enums"]["match_status"]
          tags_ong?: string[] | null
          tags_voluntario?: string[] | null
          updated_at?: string
          voluntario_id: string
        }
        Update: {
          created_at?: string
          feedback_ong?: string | null
          feedback_voluntario?: string | null
          horas_validadas?: number | null
          id?: string
          opportunity_id?: string
          rating?: number | null
          rating_voluntario?: number | null
          status?: Database["public"]["Enums"]["match_status"]
          tags_ong?: string[] | null
          tags_voluntario?: string[] | null
          updated_at?: string
          voluntario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_voluntario_id_fkey"
            columns: ["voluntario_id"]
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
          created_at: string | null
          id: string
          read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link: string
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      opportunities: {
        Row: {
          ativa: boolean | null
          bairro: string | null
          causas: string[] | null
          cidade: string | null
          created_at: string
          descricao: string
          embedding: string | null
          emite_certificado: boolean | null
          endereco: string | null
          formato: string | null
          horas_estimadas: number
          id: string
          location: string | null
          min_vagas: number | null
          nivel_experiencia: string | null
          oferece_treinamento: boolean | null
          ong_id: string
          recursos_oferecidos: string | null
          skills_required: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          ativa?: boolean | null
          bairro?: string | null
          causas?: string[] | null
          cidade?: string | null
          created_at?: string
          descricao: string
          embedding?: string | null
          emite_certificado?: boolean | null
          endereco?: string | null
          formato?: string | null
          horas_estimadas?: number
          id?: string
          location?: string | null
          min_vagas?: number | null
          nivel_experiencia?: string | null
          oferece_treinamento?: boolean | null
          ong_id: string
          recursos_oferecidos?: string | null
          skills_required?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          ativa?: boolean | null
          bairro?: string | null
          causas?: string[] | null
          cidade?: string | null
          created_at?: string
          descricao?: string
          embedding?: string | null
          emite_certificado?: boolean | null
          endereco?: string | null
          formato?: string | null
          horas_estimadas?: number
          id?: string
          location?: string | null
          min_vagas?: number | null
          nivel_experiencia?: string | null
          oferece_treinamento?: boolean | null
          ong_id?: string
          recursos_oferecidos?: string | null
          skills_required?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_ong_id_fkey"
            columns: ["ong_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cpf: string | null
          created_at: string
          embedding: string | null
          experience_level: string | null
          github_url: string | null
          id: string
          linkedin_url: string | null
          locations: string[] | null
          nome: string
          skills: string | null
          tipo: Database["public"]["Enums"]["user_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cpf?: string | null
          created_at?: string
          embedding?: string | null
          experience_level?: string | null
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          locations?: string[] | null
          nome: string
          skills?: string | null
          tipo: Database["public"]["Enums"]["user_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cpf?: string | null
          created_at?: string
          embedding?: string | null
          experience_level?: string | null
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          locations?: string[] | null
          nome?: string
          skills?: string | null
          tipo?: Database["public"]["Enums"]["user_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          match_id: string | null
          rating: number
          reviewed_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          match_id?: string | null
          rating: number
          reviewed_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          match_id?: string | null
          rating?: number
          reviewed_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_id_fkey"
            columns: ["reviewed_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_sender_profile_id: {
        Row: {
          id: string | null
        }
        Insert: {
          id?: string | null
        }
        Update: {
          id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_new_conversation: {
        Args: { other_user_id: string }
        Returns: string
      }
      mark_messages_as_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      match_opportunities: {
        Args: { p_limit?: number; p_user_embedding?: string; p_user_id: string }
        Returns: {
          descricao: string
          horas_estimadas: number
          id: string
          location: string
          location_bonus: number
          ong_id: string
          ong_nome: string
          score: number
          semantic_score: number
          skills_required: string
          titulo: string
        }[]
      }
      send_message:
        | { Args: { p_content: string; p_recipient_id: string }; Returns: Json }
        | {
            Args: {
              p_content: string
              p_conversation_id?: string
              p_recipient_id: string
            }
            Returns: Json
          }
      send_message_secure: {
        Args: { p_content: string; p_recipient_id: string }
        Returns: Json
      }
    }
    Enums: {
      match_status: "pendente" | "aprovado" | "concluido" | "rejeitado"
      user_type: "voluntario" | "ong"
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
      match_status: ["pendente", "aprovado", "concluido", "rejeitado"],
      user_type: ["voluntario", "ong"],
    },
  },
} as const
