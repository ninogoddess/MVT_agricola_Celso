import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/service-role';
import { ReminderService } from '@/lib/services/reminder.service';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseServiceRoleClient();

    // Obtener tenants activos
    const { data: tenants } = await supabase.from('tenants').select('id');

    if (!tenants) {
      return NextResponse.json({ message: 'No tenants found' });
    }

    let promoted = 0;

    for (const tenant of tenants) {
      const service = new ReminderService(supabase, tenant.id);

      // 1. Promover pending → upcoming
      await service.promoteUpcoming();
      promoted++;

      // 2. Generar recordatorios automáticos
      await service.generateAutoReminders();
    }

    return NextResponse.json({
      message: 'Reminders processed',
      tenantsProcessed: tenants.length,
    });
  } catch (error) {
    console.error('[CRON:REMINDERS] Error:', error);
    return NextResponse.json(
      { error: 'Error processing reminders' },
      { status: 500 }
    );
  }
}
