import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/service-role';
import { ReminderService } from '@/lib/services/reminder.service';
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseServiceRoleClient();
    const { data: tenants } = await supabase.from('tenants').select('id');
    if (!tenants?.length) return NextResponse.json({ message: 'No tenants' });

    for (const tenant of tenants) {
      const service = new ReminderService(supabase, tenant.id);
      await service.promoteUpcoming();
      await service.generateAutoReminders();
    }

    // Enviar push a usuarios con recordatorios "upcoming" en las próximas 2h
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const { data: upcoming } = await supabase
      .from('reminders')
      .select('id, task_type, scheduled_at, tenant_id, parcelas(name), user_profiles!inner(id)')
      .eq('status', 'upcoming')
      .lte('scheduled_at', twoHoursFromNow)
      .gte('scheduled_at', new Date().toISOString());

    if (upcoming?.length) {
      const taskLabels: Record<string, string> = { riego: '💧 Riego', poda: '✂️ Poda', fertilizacion: '🧪 Fertilización' };

      for (const reminder of upcoming) {
        const profiles = reminder.user_profiles as unknown as Array<{ id: string }>;
        for (const profile of profiles ?? []) {
          // Obtener suscripciones push del usuario
          const { data: subs } = await supabase
            .from('push_subscriptions')
            .select('endpoint, p256dh, auth')
            .eq('user_id', profile.id);

          if (!subs?.length) continue;

          const parcelaName = (reminder.parcelas as unknown as { name?: string })?.name ?? '';
          const title = taskLabels[reminder.task_type] ?? 'Recordatorio agrícola';
          const body = parcelaName ? `En ${parcelaName} · ${new Date(reminder.scheduled_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}` : 'Tienes una tarea pendiente';
          const payload = JSON.stringify({ title, body, url: '/recordatorios', icon: '/assets/logo_principal.png' });

          for (const sub of subs) {
            try {
              await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
            } catch (err: unknown) {
              const status = (err as { statusCode?: number }).statusCode;
              if (status === 404 || status === 410) {
                await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ message: 'Reminders processed', tenantsProcessed: tenants.length });
  } catch (error) {
    console.error('[CRON:REMINDERS]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
