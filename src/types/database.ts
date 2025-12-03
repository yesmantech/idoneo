// src/types/database.ts

/** QUIZ BASE */

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  time_limit_minutes: number | null;
  is_published: boolean;
  is_archived: boolean;
  created_at: string;
}

/** CONCORSI (competitions) */

export interface Competition {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  year: number | null;
  official_total_questions: number | null;
  official_time_limit_minutes: number | null;
  official_score_correct: number | null;
  official_score_wrong: number | null;
  official_score_blank: number | null;
  created_at: string;
}

/** MATERIE (subjects) */

export interface Subject {
  id: string;
  competition_id: string;
  name: string;
  slug: string | null;
  description: string | null;
  created_at: string;
}

/** OPZIONI DOMANDA – per compatibilità se usi ancora JSONB */

export interface QuestionOption {
  id: string;
  text: string;
}

/** DOMANDE */

export interface Question {
  id: string;
  quiz_id: string;
  text: string;

  // Nuova struttura a colonne (usata per il CSV)
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_option: string | null;

  // Vecchia struttura JSONB (se ancora presente in DB)
  options?: QuestionOption[];     // JSONB opzionale
  correct_option_id?: string;     // opzionale

  explanation: string | null;
  image_url?: string | null;

  // Collegamenti a concorso e materia
  competition_id?: string | null;
  subject_id?: string | null;
}

/** TENTATIVI QUIZ */

export interface Attempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number | null;
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
}

/** RISPOSTE DEI TENTATIVI */

export interface AttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id: string | null; // può essere l'id dell'opzione o la lettera (A/B/C/D) in base a come lo userai
  is_correct: boolean | null;
}
