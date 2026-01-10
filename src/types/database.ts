
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Type-safe definitions for JSON columns
export interface RichAnswer {
  questionId: string;
  subjectId?: string;
  selectedOption: string | null;
  isCorrect: boolean;
  isSkipped?: boolean;
  answeredAt?: string;
}

export interface QuizSubjectConfig {
  subjectId: string;
  count: number;
}

export interface QuizRuleConfig {
  subject_id: string;
  question_count: number;
}

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          is_featured: boolean;
          home_banner_url: string | null; // NEW
          inner_banner_url: string | null; // NEW
          is_new: boolean; // NEW
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string | null;
          is_featured?: boolean;
          home_banner_url?: string | null;
          inner_banner_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          is_featured?: boolean;
          home_banner_url?: string | null;
          inner_banner_url?: string | null;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          role: string | null;
          onboarding_completed: boolean;
          // Gamification
          streak_current: number; // NEW
          streak_max: number;     // NEW
          last_active_at: string | null; // NEW
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          onboarding_completed?: boolean;
          streak_current?: number;
          streak_max?: number;
          last_active_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          onboarding_completed?: boolean;
          streak_current?: number;
          streak_max?: number;
          last_active_at?: string | null;
          updated_at?: string;
        };
      };
      roles: {
        Row: {
          id: string;
          category_id: string;
          slug: string;
          title: string;
          order_index: number;
          description: string | null;
          available_positions: string | null; // NEW
          share_bank_link: string | null; // NEW
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          slug: string;
          title: string;
          order_index?: number;
          description?: string | null;
          available_positions?: string | null;
          share_bank_link?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          slug?: string;
          title?: string;
          order_index?: number;
          description?: string | null;
          available_positions?: string | null;
          share_bank_link?: string | null;
          created_at?: string;
        };
      };
      role_resources: {
        Row: {
          id: string;
          role_id: string;
          title: string;
          url: string;
          type: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          role_id: string;
          title: string;
          url: string;
          type?: string;
          order_index?: number;
          created_at?: string;
        };
        Update: any;
      };
      quizzes: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string | null;
          time_limit: number | null;
          points_correct: number | null;
          points_wrong: number | null;
          points_blank: number | null;
          total_questions: number | null;
          year: number | null;
          is_archived: boolean;
          official_non_navigable: boolean;
          // New fields
          role_id: string | null;
          slug: string | null;
          is_official: boolean;
          rule_id: string | null;
          use_custom_pass_threshold: boolean; // NEW
          min_correct_for_pass: number | null; // NEW
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          role_id?: string | null;
          slug?: string | null;

          rule_id?: string | null;
          use_custom_pass_threshold?: boolean; // NEW
          min_correct_for_pass?: number | null; // NEW
          year?: number | null;
          [key: string]: any; // Allow other optional fields
        };
        Update: {
          [key: string]: any;
        };
      };
      simulation_rules: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          time_minutes: number;
          total_questions: number;
          points_correct: number;
          points_wrong: number;
          points_blank: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          time_minutes?: number;
          total_questions?: number;
          points_correct?: number;
          points_wrong?: number;
          points_blank?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          time_minutes?: number;
          total_questions?: number;
          points_correct?: number;
          points_wrong?: number;
          points_blank?: number;
          created_at?: string;
        };
      };
      subjects: {
        Row: {
          id: string;
          quiz_id: string | null;
          name: string;
          code: string | null;
          description: string | null;
          is_archived: boolean;
          created_at: string;
        };
        Insert: any;
        Update: any;
      };
      questions: {
        Row: {
          id: string;
          quiz_id: string;
          subject_id: string;
          text: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_option: string;
          explanation: string | null;
          image_url: string | null;
          difficulty: number | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          subject_id: string;
          text: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_option: string;
          explanation?: string | null;
          image_url?: string | null;
          difficulty?: number | null;
          is_archived?: boolean;
          created_at?: string;
        };
        Update: {
          text?: string;
          option_a?: string;
          option_b?: string;
          option_c?: string;
          option_d?: string;
          correct_option?: string;
          explanation?: string | null;
          image_url?: string | null;
          difficulty?: number | null;
          is_archived?: boolean;
        };
      };
      quiz_subject_rules: {
        Row: {
          id: string;
          quiz_id: string;
          subject_id: string;
          question_count: number;
          created_at: string;
        };
        Insert: any;
        Update: any;
      };
      quiz_attempts: {
        Row: {
          id: string;
          quiz_id: string;
          user_id: string;
          score: number;
          answers: Json;
          started_at: string | null;
          finished_at: string | null;
          duration_seconds: number | null;
          total_questions: number | null;
          correct: number | null;
          wrong: number | null;
          blank: number | null;
          is_idoneo: boolean | null; // NEW
          pass_threshold: number | null; // NEW
          season_id: string | null;
          xp: number | null;
          xp_awarded: boolean | null; // NEW
          created_at: string;
          updated_at: string | null;
        };
        Insert: any;
        Update: {
          id?: string;
          user_id?: string;
          season_id?: string | null;
          xp?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      xp_events: {
        Row: {
          id: string;
          user_id: string;
          xp_amount: number;
          source_type: string;
          attempt_id: string | null;
          question_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          xp_amount?: number;
          source_type: string;
          attempt_id?: string | null;
          question_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          xp_amount?: number;
          source_type?: string;
          attempt_id?: string | null;
          question_id?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
