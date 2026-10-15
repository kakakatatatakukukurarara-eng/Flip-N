import { createClient } from '@supabase/supabase-js';

type ApiAuthResult =
  | { authenticated: true; userId: string }
  | { authenticated: false; status: 401 | 503 };

export async function authenticateApiRequest(request: Request): Promise<ApiAuthResult> {
  const authorization = request.headers.get('authorization');
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!accessToken) return { authenticated: false, status: 401 };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return { authenticated: false, status: 503 };

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) return { authenticated: false, status: 401 };
    return { authenticated: true, userId: data.user.id };
  } catch (error) {
    console.error('API authentication check failed:', error);
    return { authenticated: false, status: 503 };
  }
}