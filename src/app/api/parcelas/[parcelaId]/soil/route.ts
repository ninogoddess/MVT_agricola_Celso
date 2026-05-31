import { NextResponse, type NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { SoilService } from '@/lib/services/soil.service';
import { createSoilDataSchema } from '@/lib/validators/soil.schema';
import { toErrorResponse } from '@/lib/utils/errors';

export async function GET(request: NextRequest, ctx: RouteContext<'/api/parcelas/[parcelaId]/soil'>) {
  const { parcelaId } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit') ?? 20);
  const offset = Number(searchParams.get('offset') ?? 0);

  return withTenantContext(async (tenantCtx) => {
    try {
      const service = new SoilService(tenantCtx.supabase, tenantCtx.tenantId);
      const result = await service.getHistory(parcelaId, limit, offset);
      return NextResponse.json(result);
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}

export async function POST(request: NextRequest, ctx: RouteContext<'/api/parcelas/[parcelaId]/soil'>) {
  const { parcelaId } = await ctx.params;
  return withTenantContext(async (tenantCtx) => {
    try {
      const body = await request.json();
      const parsed = createSoilDataSchema.safeParse(body);

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

      const service = new SoilService(tenantCtx.supabase, tenantCtx.tenantId);
      const data = await service.create(parcelaId, parsed.data);
      return NextResponse.json(data, { status: 201 });
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}
