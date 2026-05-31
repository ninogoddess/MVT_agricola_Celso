import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/service-role';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const registerSchema = z.object({
  tenantName: z.string().min(1, 'Nombre de organización requerido').max(255),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

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

    const { tenantName, email, password } = parsed.data;
    const supabase = await createSupabaseServerClient();
    const serviceRole = createSupabaseServiceRoleClient();

    // 1. Registrar usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'No se pudo crear la cuenta', code: 'AUTH_FAILED' },
        { status: 400 }
      );
    }

    // 2. Crear tenant
    const { data: tenant, error: tenantError } = await serviceRole
      .from('tenants')
      .insert({ name: tenantName })
      .select()
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Error al crear organización', code: 'TENANT_CREATE_FAILED' },
        { status: 500 }
      );
    }

    // 3. Crear user_profile
    await serviceRole.from('user_profiles').insert({
      id: authData.user.id,
      tenant_id: tenant.id,
      role: 'admin',
    });

    // 4. Actualizar app_metadata con tenant_id
    await serviceRole.auth.admin.updateUserById(authData.user.id, {
      app_metadata: { tenant_id: tenant.id },
    });

    return NextResponse.json(
      {
        tenant: { id: tenant.id, name: tenant.name, plan: tenant.plan },
        user: { id: authData.user.id, email, role: 'admin', tenantId: tenant.id },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
