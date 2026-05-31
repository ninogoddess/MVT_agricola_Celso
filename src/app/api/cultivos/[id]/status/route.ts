import { NextResponse, type NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { CultivoService } from '@/lib/services/cultivo.service';
import { updateCultivoStatusSchema } from '@/lib/validators/cultivo.schema';
import { toErrorResponse } from '@/lib/utils/errors';

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/cultivos/[id]/status'>) {
  const { id } = await ctx.params;
  return withTenantContext(async (tenantCtx) => {
    try {
      const body = await request.json();
      const parsed = updateCultivoStatusSchema.safeParse(body);

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
      const cultivo = await service.updateStatus(id, parsed.data);
      return NextResponse.json(cultivo);
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}
