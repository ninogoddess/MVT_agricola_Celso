import { NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { fetchClimateHistory } from '@/lib/utils/climate-api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/parcelas/[parcelaId]/climate/history
 *
 * Devuelve 7 días pasados + 7 de pronóstico (datos diarios reales de Open-Meteo)
 * para la ubicación geográfica de la parcela, para graficar en el detalle.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ parcelaId: string }> }
) {
  const { parcelaId } = await params;

  return withTenantContext(async (ctx) => {
    const { data: parcela, error } = await ctx.supabase
      .from('parcelas')
      .select('id, latitude, longitude')
      .eq('tenant_id', ctx.tenantId)
      .eq('id', parcelaId)
      .single();

    if (error || !parcela) {
      return NextResponse.json({ error: 'Parcela no encontrada' }, { status: 404 });
    }

    const history = await fetchClimateHistory(Number(parcela.latitude), Number(parcela.longitude));

    if (!history) {
      return NextResponse.json({ error: 'No se pudo obtener el histórico climático' }, { status: 502 });
    }

    return NextResponse.json({ data: history });
  });
}
