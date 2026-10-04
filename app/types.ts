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

export interface CardLike {
  id: number;
  front: string;
  back: string;
  example?: string | null;
  category?: string;
  interval?: number;
  repetition?: number;
  is_public?: boolean;
  next_review_at?: string;
  user_id?: string;
  deck_id?: string | null;
  efactor?: number;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseQueryBuilder = any;

export type SupabaseClientMinimal = {
  from: (table: string) => SupabaseQueryBuilder;
  auth?: {
    getSession: () => Promise<{ data: { session: { user?: User } | null }; error: Error | null }>;
    onAuthStateChange: (callback: (event: string, session: { user?: User } | null) => void) => { data: { subscription: { unsubscribe: () => void } } };
    signUp: (payload: {
      email: string;
      password: string;
      options?: { emailRedirectTo?: string };
    }) => Promise<{ error: Error | null }>;
    signInWithPassword: (payload: { email: string; password: string }) => Promise<{ error: Error | null }>;
    signInWithOAuth: (payload: { provider: 'google' | 'github'; options?: { redirectTo?: string } }) => Promise<{ error: Error | null }>;
    signOut: (options?: { scope?: 'local' | 'global' }) => Promise<{ error: Error | null }>;
  };
};

export type ShowToastFn = (message: string, type?: 'success' | 'error' | 'info') => void;
