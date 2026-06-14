import { NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { BusinessService } from '@/lib/services/business.service';
import { toErrorResponse } from '@/lib/utils/errors';

export async function GET() {
  return withTenantContext(async (ctx) => {
    try {
      const service = new BusinessService(ctx.supabase, ctx.tenantId);
      const summary = await service.getFinancialSummary();
      return NextResponse.json(summary);
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}
