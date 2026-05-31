import { NextResponse, type NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { AlertService } from '@/lib/services/alert.service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? undefined;
  const parcelaId = searchParams.get('parcelaId') ?? undefined;

  return withTenantContext(async (ctx) => {
    const service = new AlertService(ctx.supabase, ctx.tenantId);
    const alerts = await service.list({ status, parcelaId });
    return NextResponse.json({ data: alerts, total: alerts.length });
  });
}
