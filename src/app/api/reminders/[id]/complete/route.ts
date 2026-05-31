import { NextResponse, type NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { ReminderService } from '@/lib/services/reminder.service';
import { toErrorResponse } from '@/lib/utils/errors';

export async function PATCH(_req: NextRequest, ctx: RouteContext<'/api/reminders/[id]/complete'>) {
  const { id } = await ctx.params;
  return withTenantContext(async (tenantCtx) => {
    try {
      const service = new ReminderService(tenantCtx.supabase, tenantCtx.tenantId);
      await service.markCompleted(id);
      return NextResponse.json({ message: 'Recordatorio completado' });
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}
