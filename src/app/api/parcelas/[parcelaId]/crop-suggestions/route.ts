import { NextResponse, type NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { ParcelaRepository } from '@/lib/repositories/parcela.repository';
import { SoilRepository } from '@/lib/repositories/soil.repository';
import { fetchClimateData } from '@/lib/utils/climate-api';
import { suggestCrops, type CropParamRow } from '@/lib/utils/crop-suitability';
import { toErrorResponse, ResourceNotFoundError } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/parcelas/[parcelaId]/crop-suggestions
 *
 * Sugiere qué cultivos plantar según el último registro de suelo de la parcela,
 * su ubicación geográfica (hemisferio/temporada) y el clima actual en vivo.
 *
 * Respuesta: { soil, suggestions } o { error: 'NO_SOIL' } si no hay datos de suelo.
 */
export async function GET(_req: NextRequest, ctx: RouteContext<'/api/parcelas/[parcelaId]/crop-suggestions'>) {
  const { parcelaId } = await ctx.params;

  return withTenantContext(async (tenantCtx) => {
    try {
      const parcelaRepo = new ParcelaRepository(tenantCtx.supabase, tenantCtx.tenantId);
      const parcela = await parcelaRepo.findById(parcelaId);
      if (!parcela) throw new ResourceNotFoundError('Parcela');

      const soilRepo = new SoilRepository(tenantCtx.supabase, tenantCtx.tenantId);
      const latestSoil = await soilRepo.findLatest(parcelaId);

      if (!latestSoil) {
        return NextResponse.json(
          { error: 'NO_SOIL', message: 'Ingresa al menos un registro de suelo para recibir sugerencias.' },
          { status: 200 }
        );
      }

      // Parámetros de cultivos (tabla pública compartida).
      const { data: crops } = await tenantCtx.supabase
        .from('crop_parameters')
        .select(
          'species, variety, temp_optima_min, temp_optima_max, humedad_suelo_optima_min, humedad_suelo_optima_max, hemisferio_sur_meses_siembra, hemisferio_norte_meses_siembra, dias_a_cosecha, notes'
        );

      // Clima en vivo (real, según ubicación de la parcela).
      const climate = await fetchClimateData(Number(parcela.latitude), Number(parcela.longitude));

      const suggestions = suggestCrops({
        crops: (crops ?? []) as CropParamRow[],
        soil: {
          ph: Number(latestSoil.ph),
          humidityPercent: Number(latestSoil.humidity_percent),
          nitrogenLevel: latestSoil.nitrogen_level != null ? Number(latestSoil.nitrogen_level) : null,
        },
        latitude: Number(parcela.latitude),
        currentTemperature: climate?.temperature ?? null,
        now: new Date(),
      });

      return NextResponse.json({
        soil: {
          ph: Number(latestSoil.ph),
          humidityPercent: Number(latestSoil.humidity_percent),
          measurementDate: latestSoil.measurement_date,
        },
        currentTemperature: climate?.temperature ?? null,
        suggestions,
      });
    } catch (error) {
      const { body, status } = toErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  });
}
