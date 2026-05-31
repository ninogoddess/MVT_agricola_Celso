import { NextResponse, type NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { ReminderService } from '@/lib/services/reminder.service';
import { updateReminderSchema } from '@/lib/validators/reminder.schema';
import { toErrorResponse } from '@/lib/utils/errors';

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/reminders/[id]'>) {
  const { id } = await ctx.params;
  return withTenantContext(async (tenantCtx) => {
    try {
      const body = await request.json();
      const parsed = updateReminderSchema.safeParse(body);

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

      const service = new ReminderService(tenantCtx.supabase, tenantCtx.tenantId);
      const updateData: Record<string, unknown> = {};
      if (parsed.data.scheduledAt) updateData.scheduled_at = parsed.data.scheduledAt;
      if (parsed.data.status) updateData.status = parsed.data.status;

      const result = await service.update(id, updateData);
      return NextResponse.json(result);
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/reminders/[id]'>) {
  const { id } = await ctx.params;
  return withTenantContext(async (tenantCtx) => {
    try {
      const service = new ReminderService(tenantCtx.supabase, tenantCtx.tenantId);
      await service.delete(id);
      return NextResponse.json({ message: 'Recordatorio eliminado' });
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}
