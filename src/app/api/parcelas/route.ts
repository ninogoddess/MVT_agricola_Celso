import { NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { ParcelaService } from '@/lib/services/parcela.service';
import { createParcelaSchema } from '@/lib/validators/parcela.schema';
import { toErrorResponse } from '@/lib/utils/errors';

export async function GET() {
  return withTenantContext(async (ctx) => {
    const service = new ParcelaService(ctx.supabase, ctx.tenantId);
    const parcelas = await service.list();
    return NextResponse.json(parcelas);
  });
}

export async function POST(request: Request) {
  return withTenantContext(async (ctx) => {
    try {
      const body = await request.json();
      const parsed = createParcelaSchema.safeParse(body);

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

      const service = new ParcelaService(ctx.supabase, ctx.tenantId);
      const parcela = await service.create(parsed.data);
      return NextResponse.json(parcela, { status: 201 });
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}
