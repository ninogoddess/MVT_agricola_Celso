import { NextResponse, type NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { BusinessService } from '@/lib/services/business.service';
import { toErrorResponse } from '@/lib/utils/errors';

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/business/transactions/[id]'>) {
  const { id } = await ctx.params;
  return withTenantContext(async (tenantCtx) => {
    try {
      const service = new BusinessService(tenantCtx.supabase, tenantCtx.tenantId);
      await service.deleteTransaction(id);
      return NextResponse.json({ message: 'Transacción eliminada' });
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}
