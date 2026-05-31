import { NextResponse, type NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { AlertService } from '@/lib/services/alert.service';
import { toErrorResponse } from '@/lib/utils/errors';

export async function PATCH(_req: NextRequest, ctx: RouteContext<'/api/alerts/[id]/read'>) {
  const { id } = await ctx.params;
  return withTenantContext(async (tenantCtx) => {
    try {
      const service = new AlertService(tenantCtx.supabase, tenantCtx.tenantId);
      await service.markAsRead(id);
      return NextResponse.json({ message: 'Alerta marcada como leída' });
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}
