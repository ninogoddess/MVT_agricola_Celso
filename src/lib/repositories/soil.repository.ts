import type { SupabaseClient } from '@supabase/supabase-js';
import { TenantScopedRepository } from './base.repository';

export class SoilRepository extends TenantScopedRepository {
  constructor(supabase: SupabaseClient, tenantId: string) {
    super(supabase, tenantId, 'soil_data');
  }

  async findByParcela(parcelaId: string, limit = 20, offset = 0) {
    const { data, error, count } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('tenant_id', this.tenantId)
      .eq('parcela_id', parcelaId)
      .order('measurement_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data: data ?? [], total: count ?? 0 };
  }

  async findLatest(parcelaId: string) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', this.tenantId)
      .eq('parcela_id', parcelaId)
      .order('measurement_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async create(input: {
    parcela_id: string;
    measurement_date: string;
    ph: number;
    humidity_percent: number;
    nitrogen_level?: number;
    phosphorus_level?: number;
    potassium_level?: number;
  }) {
    return this.scopedInsert(input);
  }
}
