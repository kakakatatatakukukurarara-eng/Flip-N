export interface Card {
  id: number;
  front: string;
  back: string;
  example: string | null;
  category: string;
  is_public: boolean;
  interval: number;
  next_review_at: string;
  user_id?: string;
  deck_id?: string | null;
  efactor?: number;
  repetition?: number;
}

export interface Deck {
  id: string;
  title: string;
  description?: string | null;
  is_public?: boolean;
  user_id?: string;
}

export interface User {
  id: string;
  email?: string;
  display_name?: string;
  displayName?: string;
}

export type PreviewCard = {
  front: string;
  back: string;
  example: string;
  category: string;
};

export type SupabaseClientMinimal = {
  from: (table: string) => any;
  auth?: any;
};

export type ShowToastFn = (message: string, type?: 'success' | 'error' | 'info') => void;
