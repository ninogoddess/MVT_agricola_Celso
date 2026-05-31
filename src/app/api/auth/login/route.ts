import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const fields = parsed.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return NextResponse.json(
        { error: 'Error de validación', code: 'VALIDATION_ERROR', fields },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      // Mensaje genérico: no revelar si el email existe
      return NextResponse.json(
        { error: 'Credenciales inválidas', code: 'AUTH_FAILED' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        tenantId: data.user.app_metadata?.tenant_id,
      },
      session: {
        accessToken: data.session.access_token,
        expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
