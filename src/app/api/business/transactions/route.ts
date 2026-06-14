import { NextResponse, type NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { BusinessService } from '@/lib/services/business.service';
import { createTransactionSchema } from '@/lib/validators/business.schema';
import { toErrorResponse } from '@/lib/utils/errors';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parcelaId = searchParams.get('parcelaId') ?? undefined;

  return withTenantContext(async (ctx) => {
    const service = new BusinessService(ctx.supabase, ctx.tenantId);
    const data = await service.listTransactions(parcelaId);
    return NextResponse.json({ data });
  });
}

export async function POST(request: NextRequest) {
  return withTenantContext(async (ctx) => {
    try {
      const body = await request.json();
      const parsed = createTransactionSchema.safeParse(body);
      if (!parsed.success) {
        const fields = parsed.error.issues.map((e) => ({ field: e.path.join('.'), message: e.message }));
        return NextResponse.json({ error: 'Error de validación', code: 'VALIDATION_ERROR', fields }, { status: 400 });
      }
      const service = new BusinessService(ctx.supabase, ctx.tenantId);
      const tx = await service.createTransaction(parsed.data);
      return NextResponse.json(tx, { status: 201 });
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}
