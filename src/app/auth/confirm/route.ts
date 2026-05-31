import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Maneja el callback de confirmación de email de Supabase.
 * Supabase redirige aquí con ?code=xxx después de que el usuario
 * hace click en el enlace de confirmación.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirigir al dashboard después de confirmar
  const redirectUrl = new URL('/dashboard', request.url);
  return NextResponse.redirect(redirectUrl);
}
