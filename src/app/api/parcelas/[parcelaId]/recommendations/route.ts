import { NextResponse, type NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { RecommendationService } from '@/lib/services/recommendation.service';
import { toErrorResponse } from '@/lib/utils/errors';

export async function GET(request: NextRequest, ctx: RouteContext<'/api/parcelas/[parcelaId]/recommendations'>) {
  const { parcelaId } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? undefined;
  const cultivoId = searchParams.get('cultivoId') ?? undefined;

  return withTenantContext(async (tenantCtx) => {
    try {
      const service = new RecommendationService(tenantCtx.supabase, tenantCtx.tenantId);
      const recommendations = await service.list({ parcelaId, type, cultivoId });
      return NextResponse.json(recommendations);
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}
