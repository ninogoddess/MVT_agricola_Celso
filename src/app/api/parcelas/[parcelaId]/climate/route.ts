import { NextResponse, type NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { ClimateService } from '@/lib/services/climate.service';
import { toErrorResponse } from '@/lib/utils/errors';

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/parcelas/[parcelaId]/climate'>) {
  const { parcelaId } = await ctx.params;
  return withTenantContext(async (tenantCtx) => {
    try {
      const service = new ClimateService(tenantCtx.supabase, tenantCtx.tenantId);
      const result = await service.getLatestForParcela(parcelaId);
      return NextResponse.json(result);
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}
