import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * Handles both email confirmation AND OAuth callbacks.
 * Supabase redirects here with ?code=xxx in both cases.
 * For new OAuth users (Google), creates tenant + user_profile if missing.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const user = data.user;
      const serviceRole = createSupabaseServiceRoleClient();

      // Check if user_profile exists (may be missing for new OAuth users)
      const { data: existingProfile } = await serviceRole
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!existingProfile) {
        // New OAuth user — derive a tenant name from their display name or email
        const displayName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'Mi Campo';

        // Create tenant
        const { data: tenant, error: tenantError } = await serviceRole
          .from('tenants')
          .insert({ name: displayName })
          .select()
          .single();

        if (!tenantError && tenant) {
          // Create user_profile
          await serviceRole.from('user_profiles').insert({
            id: user.id,
            tenant_id: tenant.id,
            role: 'admin',
          });

          // Update app_metadata with tenant_id
          await serviceRole.auth.admin.updateUserById(user.id, {
            app_metadata: { tenant_id: tenant.id },
          });
        }
      }
    }
  }

  // Redirect to dashboard after confirmation / OAuth callback
  const redirectUrl = new URL('/dashboard', request.url);
  return NextResponse.redirect(redirectUrl);
}
