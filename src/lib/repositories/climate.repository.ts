import type { SupabaseClient } from '@supabase/supabase-js';
import { TenantScopedRepository } from './base.repository';

export class ClimateRepository extends TenantScopedRepository {
  constructor(supabase: SupabaseClient, tenantId: string) {
    super(supabase, tenantId, 'climate_data');
  }

  async findLatest(parcelaId: string) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', this.tenantId)
      .eq('parcela_id', parcelaId)
      .order('fetched_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async create(input: {
    parcela_id: string;
    temperature_celsius: number | null;
    relative_humidity_percent: number | null;
    wind_speed_kmh: number | null;
    precipitation_probability_percent: number | null;
    forecast_72h: object | null;
    fetched_at: string;
  }) {
    return this.scopedInsert(input);
  }
}
