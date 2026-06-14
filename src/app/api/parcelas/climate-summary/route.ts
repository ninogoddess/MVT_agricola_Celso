import { NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { fetchClimateData } from '@/lib/utils/climate-api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/parcelas/climate-summary
 *
 * Devuelve el clima ACTUAL (en vivo desde Open-Meteo) de todas las parcelas
 * activas del tenant, para mostrarlo en las tarjetas de la lista de parcelas.
 *
 * Se consulta en vivo (no el snapshot del cron) porque en el plan gratuito de
 * Vercel el cron de clima corre solo 1 vez al día, lo que dejaría los datos
 * desactualizados.
 *
 * Respuesta: { [parcelaId]: { temperature, humidity, windSpeed, precipitationProb } }
 */
export async function GET() {
  return withTenantContext(async (ctx) => {
    const { data: parcelas, error } = await ctx.supabase
      .from('parcelas')
      .select('id, latitude, longitude')
      .eq('tenant_id', ctx.tenantId)
      .eq('is_active', true);

    if (error) {
      return NextResponse.json({ error: 'Error al leer parcelas' }, { status: 500 });
    }

    const entries = await Promise.all(
      (parcelas ?? []).map(async (p) => {
        const climate = await fetchClimateData(Number(p.latitude), Number(p.longitude));
        if (!climate) return [p.id, null] as const;
        return [
          p.id,
          {
            temperature: climate.temperature,
            humidity: climate.humidity,
            windSpeed: climate.windSpeed,
            precipitationProb: climate.precipitationProb,
          },
        ] as const;
      })
    );

    const summary: Record<string, unknown> = {};
    for (const [id, value] of entries) summary[id] = value;

    return NextResponse.json(summary);
  });
}
