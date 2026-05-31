import { NextResponse, type NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { ParcelaService } from '@/lib/services/parcela.service';
import { updateParcelaSchema } from '@/lib/validators/parcela.schema';
import { toErrorResponse } from '@/lib/utils/errors';

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/parcelas/[id]'>) {
  const { id } = await ctx.params;
  return withTenantContext(async (tenantCtx) => {
    try {
      const service = new ParcelaService(tenantCtx.supabase, tenantCtx.tenantId);
      const parcela = await service.getById(id);
      return NextResponse.json(parcela);
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/parcelas/[id]'>) {
  const { id } = await ctx.params;
  return withTenantContext(async (tenantCtx) => {
    try {
      const body = await request.json();
      const parsed = updateParcelaSchema.safeParse(body);

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

      const service = new ParcelaService(tenantCtx.supabase, tenantCtx.tenantId);
      const parcela = await service.update(id, parsed.data);
      return NextResponse.json(parcela);
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/parcelas/[id]'>) {
  const { id } = await ctx.params;
  return withTenantContext(async (tenantCtx) => {
    try {
      const service = new ParcelaService(tenantCtx.supabase, tenantCtx.tenantId);
      await service.softDelete(id);
      return NextResponse.json({ message: 'Parcela desactivada' });
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}
