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
      answers: {
        Row: {
          answered_at: string | null
          correct_answer: string
          given_answer: string
          id: string
          is_correct: boolean
          participant_id: string
          question_index: number
          question_text: string
          time_taken_seconds: number | null
        }
        Insert: {
          answered_at?: string | null
          correct_answer: string
          given_answer: string
          id?: string
          is_correct: boolean
          participant_id: string
          question_index: number
          question_text: string
          time_taken_seconds?: number | null
        }
        Update: {
          answered_at?: string | null
          correct_answer?: string
          given_answer?: string
          id?: string
          is_correct?: boolean
          participant_id?: string
          question_index?: number
          question_text?: string
          time_taken_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          finished_at: string | null
          id: string
          joined_at: string | null
          room_id: string
          student_name: string
        }
        Insert: {
          finished_at?: string | null
          id?: string
          joined_at?: string | null
          room_id: string
          student_name: string
        }
        Update: {
          finished_at?: string | null
          id?: string
          joined_at?: string | null
          room_id?: string
          student_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string | null
          description: string | null
          dynamic_subtype:
            | Database["public"]["Enums"]["dynamic_quiz_subtype"]
            | null
          id: string
          question_count: number | null
          quiz_type: Database["public"]["Enums"]["quiz_type"]
          time_limit_seconds: number | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          dynamic_subtype?:
            | Database["public"]["Enums"]["dynamic_quiz_subtype"]
            | null
          id?: string
          question_count?: number | null
          quiz_type?: Database["public"]["Enums"]["quiz_type"]
          time_limit_seconds?: number | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          dynamic_subtype?:
            | Database["public"]["Enums"]["dynamic_quiz_subtype"]
            | null
          id?: string
          question_count?: number | null
          quiz_type?: Database["public"]["Enums"]["quiz_type"]
          time_limit_seconds?: number | null
          title?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          class_name: string | null
          created_at: string | null
          current_question_index: number | null
          ended_at: string | null
          grade_level: number | null
          id: string
          is_active: boolean | null
          question_mode: Database["public"]["Enums"]["question_mode"]
          question_started_at: string | null
          quiz_id: string | null
          randomize_answers: boolean | null
          randomize_questions: boolean | null
          room_code: string
          show_results: boolean | null
          started_at: string | null
          teacher_id: string
          time_limit_per_question: number | null
        }
        Insert: {
          class_name?: string | null
          created_at?: string | null
          current_question_index?: number | null
          ended_at?: string | null
          grade_level?: number | null
          id?: string
          is_active?: boolean | null
          question_mode?: Database["public"]["Enums"]["question_mode"]
          question_started_at?: string | null
          quiz_id?: string | null
          randomize_answers?: boolean | null
          randomize_questions?: boolean | null
          room_code: string
          show_results?: boolean | null
          started_at?: string | null
          teacher_id: string
          time_limit_per_question?: number | null
        }
        Update: {
          class_name?: string | null
          created_at?: string | null
          current_question_index?: number | null
          ended_at?: string | null
          grade_level?: number | null
          id?: string
          is_active?: boolean | null
          question_mode?: Database["public"]["Enums"]["question_mode"]
          question_started_at?: string | null
          quiz_id?: string | null
          randomize_answers?: boolean | null
          randomize_questions?: boolean | null
          room_code?: string
          show_results?: boolean | null
          started_at?: string | null
          teacher_id?: string
          time_limit_per_question?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      static_questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          id: string
          order_index: number
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          quiz_id: string
          wrong_answers: string[]
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          id?: string
          order_index?: number
          question_text: string
          question_type?: Database["public"]["Enums"]["question_type"]
          quiz_id: string
          wrong_answers: string[]
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          id?: string
          order_index?: number
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          quiz_id?: string
          wrong_answers?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "static_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_profiles: {
        Row: {
          created_at: string | null
          display_name: string
          id: string
          school_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name: string
          id?: string
          school_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string
          id?: string
          school_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      dynamic_quiz_subtype:
        | "addition_single"
        | "addition_double"
        | "fractions"
        | "angles"
      question_mode: "automatic" | "manual"
      question_type: "multiple_choice" | "free_text"
      quiz_type: "dynamic" | "static"
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
      dynamic_quiz_subtype: [
        "addition_single",
        "addition_double",
        "fractions",
        "angles",
      ],
      question_mode: ["automatic", "manual"],
      question_type: ["multiple_choice", "free_text"],
      quiz_type: ["dynamic", "static"],
    },
  },
} as const
