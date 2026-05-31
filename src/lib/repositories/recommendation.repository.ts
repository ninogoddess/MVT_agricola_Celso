import type { SupabaseClient } from '@supabase/supabase-js';
import { TenantScopedRepository } from './base.repository';

export class RecommendationRepository extends TenantScopedRepository {
  constructor(supabase: SupabaseClient, tenantId: string) {
    super(supabase, tenantId, 'recommendations');
  }

  async findCachedFor(parcelaId: string, cultivoId: string | null, type: string) {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', this.tenantId)
      .eq('parcela_id', parcelaId)
      .eq('recommendation_type', type)
      .gte('expires_at', new Date().toISOString())
      .order('generated_at', { ascending: false })
      .limit(1);

    if (cultivoId) {
      query = query.eq('cultivo_id', cultivoId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data;
  }

  async upsert(input: {
    parcela_id: string;
    cultivo_id: string | null;
    recommendation_type: string;
    payload: object;
    climate_data_fetched_at: string;
    is_stale: boolean;
    generated_at: string;
    expires_at: string;
  }) {
    return this.scopedInsert(input);
  }

  async markStale(parcelaId: string) {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({ is_stale: true })
      .eq('tenant_id', this.tenantId)
      .eq('parcela_id', parcelaId)
      .eq('is_stale', false);

    if (error) throw error;
  }

  async listByTenant(filters?: { parcelaId?: string; type?: string; cultivoId?: string }) {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', this.tenantId)
      .order('generated_at', { ascending: false });

    if (filters?.parcelaId) query = query.eq('parcela_id', filters.parcelaId);
    if (filters?.type) query = query.eq('recommendation_type', filters.type);
    if (filters?.cultivoId) query = query.eq('cultivo_id', filters.cultivoId);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
}
