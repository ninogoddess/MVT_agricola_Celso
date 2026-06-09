import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Asegurar persistencia de sesión por 30 días si no se especifica
              const maxAge = options.maxAge ?? 60 * 60 * 24 * 30;
              cookieStore.set(name, value, { ...options, maxAge });
            });
          } catch {
            // setAll puede fallar en Server Components (read-only)
            // Es seguro ignorar en ese contexto
          }
        },
      },
    }
  );
}
