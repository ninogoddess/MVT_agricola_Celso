import { NextResponse, type NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { RecommendationService } from '@/lib/services/recommendation.service';
import { refreshRecommendationSchema } from '@/lib/validators/recommendation.schema';
import { toErrorResponse } from '@/lib/utils/errors';

export async function POST(request: NextRequest, ctx: RouteContext<'/api/parcelas/[parcelaId]/recommendations/refresh'>) {
  const { parcelaId } = await ctx.params;
  return withTenantContext(async (tenantCtx) => {
    try {
      const body = await request.json();
      const parsed = refreshRecommendationSchema.safeParse(body);

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

      const service = new RecommendationService(tenantCtx.supabase, tenantCtx.tenantId);
      const result = await service.generate(
        parcelaId,
        parsed.data.cultivoId ?? '',
        parsed.data.type
      );
      return NextResponse.json(result);
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}
