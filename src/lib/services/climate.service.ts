import type { SupabaseClient } from '@supabase/supabase-js';
import { ClimateRepository } from '@/lib/repositories/climate.repository';
import { fetchClimateData } from '@/lib/utils/climate-api';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/service-role';

export class ClimateService {
  private repo: ClimateRepository;

  constructor(supabase: SupabaseClient, tenantId: string) {
    this.repo = new ClimateRepository(supabase, tenantId);
  }

  async getLatestForParcela(parcelaId: string) {
    const data = await this.repo.findLatest(parcelaId);

    if (!data) {
      return { data: null, isStale: true, lastSuccessfulFetch: null };
    }

    // Considerar stale si tiene más de 2 horas
    const fetchedAt = new Date(data.fetched_at);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const isStale = fetchedAt < twoHoursAgo;

    return {
      data,
      isStale,
      lastSuccessfulFetch: data.fetched_at,
    };
  }
}

/**
 * Actualiza datos climáticos para TODAS las parcelas activas.
 * Usado por el cron job (service_role, bypass RLS).
 */
export async function updateClimateForAllParcelas() {
  const supabase = createSupabaseServiceRoleClient();

  const { data: activeParcelas, error } = await supabase
    .from('parcelas')
    .select('id, tenant_id, latitude, longitude')
    .eq('is_active', true);

  if (error || !activeParcelas) {
    console.error('[CRON:CLIMATE] Error fetching parcelas:', error);
    return { processed: 0, failed: 0 };
  }

  let processed = 0;
  let failed = 0;

  for (const parcela of activeParcelas) {
    const climateData = await fetchClimateData(
      Number(parcela.latitude),
      Number(parcela.longitude)
    );

    if (!climateData) {
      failed++;
      continue;
    }

    const { error: insertError } = await supabase.from('climate_data').insert({
      tenant_id: parcela.tenant_id,
      parcela_id: parcela.id,
      temperature_celsius: climateData.temperature,
      relative_humidity_percent: climateData.humidity,
      wind_speed_kmh: climateData.windSpeed,
      precipitation_probability_percent: climateData.precipitationProb,
      forecast_72h: climateData.forecast72h,
      fetched_at: new Date().toISOString(),
    });

    if (insertError) {
      failed++;
    } else {
      processed++;
    }
  }

  return { processed, failed, total: activeParcelas.length };
}
