import { NextResponse, type NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { CultivoService } from '@/lib/services/cultivo.service';
import { createCultivoSchema } from '@/lib/validators/cultivo.schema';
import { toErrorResponse } from '@/lib/utils/errors';

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/parcelas/[parcelaId]/cultivos'>) {
  const { parcelaId } = await ctx.params;
  return withTenantContext(async (tenantCtx) => {
    try {
      const service = new CultivoService(tenantCtx.supabase, tenantCtx.tenantId);
      const cultivos = await service.listByParcela(parcelaId);
      return NextResponse.json(cultivos);
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}

export async function POST(request: NextRequest, ctx: RouteContext<'/api/parcelas/[parcelaId]/cultivos'>) {
  const { parcelaId } = await ctx.params;
  return withTenantContext(async (tenantCtx) => {
    try {
      const body = await request.json();
      const parsed = createCultivoSchema.safeParse(body);

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

      const service = new CultivoService(tenantCtx.supabase, tenantCtx.tenantId);
      const cultivo = await service.create(parcelaId, parsed.data);
      return NextResponse.json(cultivo, { status: 201 });
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}
