import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/service-role';
import { ReminderService } from '@/lib/services/reminder.service';
import webpush from 'web-push';

export const runtime = 'nodejs'; // web-push requiere Node.js, no edge runtime

if (process.env.VAPID_EMAIL && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

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

    // ── Notificaciones push en 3 etapas: 24 h, 2 h y 15 min antes ──
    // El cron corre cada 15 min; en cada etapa enviamos en la corrida más cercana
    // al umbral y marcamos la columna correspondiente para no repetir el envío.
    const taskLabels: Record<string, string> = { riego: '💧 Riego', poda: '✂️ Poda', fertilizacion: '🧪 Fertilización' };
    const now = Date.now();

    const stages: Array<{ column: 'notified_24h_at' | 'notified_2h_at' | 'notified_15m_at'; minMs: number; maxMs: number; prefix: string }> = [
      // 24 h antes: falta entre 2 h y 24 h para la tarea.
      { column: 'notified_24h_at', minMs: 2 * 60 * 60 * 1000, maxMs: 24 * 60 * 60 * 1000, prefix: 'Mañana' },
      // 2 h antes: falta entre 15 min y 2 h.
      { column: 'notified_2h_at', minMs: 15 * 60 * 1000, maxMs: 2 * 60 * 60 * 1000, prefix: 'En ~2 h' },
      // 15 min antes: falta hasta 15 min (incluye recién vencidos por 5 min).
      { column: 'notified_15m_at', minMs: -5 * 60 * 1000, maxMs: 15 * 60 * 1000, prefix: 'Ahora' },
    ];

    let totalSent = 0;

    for (const stage of stages) {
      const fromIso = new Date(now + stage.minMs).toISOString();
      const toIso = new Date(now + stage.maxMs).toISOString();

      const { data: due } = await supabase
        .from('reminders')
        .select('id, task_type, scheduled_at, tenant_id, parcelas(name), user_profiles!inner(id)')
        .neq('status', 'completed')
        .is(stage.column, null)
        .gte('scheduled_at', fromIso)
        .lte('scheduled_at', toIso);

      if (!due?.length) continue;

      for (const reminder of due) {
        const profiles = reminder.user_profiles as unknown as Array<{ id: string }>;

        for (const profile of profiles ?? []) {
          const { data: subs } = await supabase
            .from('push_subscriptions')
            .select('endpoint, p256dh, auth')
            .eq('user_id', profile.id);

          if (!subs?.length) continue;

          const parcelaName = (reminder.parcelas as unknown as { name?: string })?.name ?? '';
          const hora = new Date(reminder.scheduled_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
          const title = `${taskLabels[reminder.task_type] ?? 'Recordatorio agrícola'} · ${stage.prefix}`;
          const body = parcelaName ? `En ${parcelaName} a las ${hora}` : `Tarea programada a las ${hora}`;
          const payload = JSON.stringify({ title, body, url: '/recordatorios', icon: '/assets/logo_principal.png' });

          for (const sub of subs) {
            try {
              await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
              totalSent++;
            } catch (err: unknown) {
              const status = (err as { statusCode?: number }).statusCode;
              if (status === 404 || status === 410) {
                await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
              }
            }
          }
        }

        // Marcamos la etapa siempre (aunque no haya dispositivos) para no reintentar
        // indefinidamente etapas que ya pasaron su ventana.
        await supabase.from('reminders').update({ [stage.column]: new Date().toISOString() }).eq('id', reminder.id);
      }
    }

    return NextResponse.json({ message: 'Reminders processed', tenantsProcessed: tenants.length, pushSent: totalSent });
  } catch (error) {
    console.error('[CRON:REMINDERS]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
