import { NextResponse, type NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { toErrorResponse } from '@/lib/utils/errors';

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/parcelas/[parcelaId]/thresholds'>) {
  const { parcelaId } = await ctx.params;
  return withTenantContext(async (tenantCtx) => {
    try {
      const { data, error } = await tenantCtx.supabase
        .from('alert_thresholds')
        .select('*')
        .eq('tenant_id', tenantCtx.tenantId)
        .eq('parcela_id', parcelaId);

      if (error) throw error;
      return NextResponse.json(data);
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/parcelas/[parcelaId]/thresholds'>) {
  const { parcelaId } = await ctx.params;
  return withTenantContext(async (tenantCtx) => {
    try {
      const body = await request.json();
      const { thresholds } = body as {
        thresholds: { thresholdType: string; minValue?: number; maxValue?: number }[];
      };

      // Eliminar umbrales existentes para esta parcela
      await tenantCtx.supabase
        .from('alert_thresholds')
        .delete()
        .eq('tenant_id', tenantCtx.tenantId)
        .eq('parcela_id', parcelaId);

      // Insertar nuevos
      const inserts = thresholds.map((t) => ({
        tenant_id: tenantCtx.tenantId,
        parcela_id: parcelaId,
        threshold_type: t.thresholdType,
        min_value: t.minValue ?? null,
        max_value: t.maxValue ?? null,
        is_default: false,
      }));

      const { data, error } = await tenantCtx.supabase
        .from('alert_thresholds')
        .insert(inserts)
        .select();

      if (error) throw error;
      return NextResponse.json(data);
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}
