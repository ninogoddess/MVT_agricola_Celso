import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Always call getUser() to refresh the session cookie if needed
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname, searchParams } = request.nextUrl;

  // Rutas protegidas: redirigir a login si no hay sesión
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/parcelas') ||
    pathname.startsWith('/cultivos') ||
    pathname.startsWith('/alertas') ||
    pathname.startsWith('/recordatorios') ||
    pathname.startsWith('/recomendaciones') ||
    pathname.startsWith('/suelo');

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Si ya está autenticado y va a login/register, redirigir al dashboard.
  // EXCEPCIÓN: no redirigir si hay un ?code= en la URL (OAuth / email confirm callback).
  const isAuthRoute = pathname === '/login' || pathname === '/register';
  const hasCode = searchParams.has('code');

  if (isAuthRoute && user && !hasCode) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Redirigir ?code= en la raíz (/) al handler de confirmación
  const code = searchParams.get('code');
  if (code && pathname === '/') {
    const confirmUrl = new URL('/auth/confirm', request.url);
    confirmUrl.searchParams.set('code', code);
    return NextResponse.redirect(confirmUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
