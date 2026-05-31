import { NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { toErrorResponse } from '@/lib/utils/errors';

export async function GET() {
  return withTenantContext(async (ctx) => {
    try {
      const { supabase, tenantId } = ctx;

      // Conteos
      const [parcelasRes, cultivosRes, alertsRes, remindersRes] = await Promise.all([
        supabase.from('parcelas').select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId).eq('is_active', true),
        supabase.from('cultivos').select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId).eq('status', 'active'),
        supabase.from('alerts').select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId).eq('status', 'pending'),
        supabase.from('reminders').select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId).in('status', ['pending', 'upcoming']),
      ]);

      // Parcelas con último clima
      const { data: parcelas } = await supabase
        .from('parcelas')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      // Alertas recientes
      const { data: recentAlerts } = await supabase
        .from('alerts')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      // Recordatorios próximos
      const { data: upcomingReminders } = await supabase
        .from('reminders')
        .select('*')
        .eq('tenant_id', tenantId)
        .in('status', ['pending', 'upcoming'])
        .order('scheduled_at', { ascending: true })
        .limit(5);

      return NextResponse.json({
        summary: {
          activeParcelas: parcelasRes.count ?? 0,
          activeCultivos: cultivosRes.count ?? 0,
          pendingAlerts: alertsRes.count ?? 0,
          upcomingReminders: remindersRes.count ?? 0,
        },
        parcelas: parcelas ?? [],
        recentAlerts: recentAlerts ?? [],
        upcomingReminders: upcomingReminders ?? [],
      });
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}
