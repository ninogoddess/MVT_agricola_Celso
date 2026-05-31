import { NextResponse, type NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { ReminderService } from '@/lib/services/reminder.service';
import { createReminderSchema } from '@/lib/validators/reminder.schema';
import { toErrorResponse } from '@/lib/utils/errors';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? undefined;
  const parcelaId = searchParams.get('parcelaId') ?? undefined;
  const from = searchParams.get('from') ?? undefined;
  const to = searchParams.get('to') ?? undefined;

  return withTenantContext(async (ctx) => {
    const service = new ReminderService(ctx.supabase, ctx.tenantId);
    const reminders = await service.list({ status, parcelaId, from, to });
    return NextResponse.json({ data: reminders, total: reminders.length });
  });
}

export async function POST(request: NextRequest) {
  return withTenantContext(async (ctx) => {
    try {
      const body = await request.json();
      const parsed = createReminderSchema.safeParse(body);

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

      const service = new ReminderService(ctx.supabase, ctx.tenantId);
      const reminder = await service.createManual(parsed.data);
      return NextResponse.json(reminder, { status: 201 });
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}
