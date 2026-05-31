import type { SupabaseClient } from '@supabase/supabase-js';
import { TenantScopedRepository } from './base.repository';
import type { CultivoStatus } from '@/types/models';

export class CultivoRepository extends TenantScopedRepository {
  constructor(supabase: SupabaseClient, tenantId: string) {
    super(supabase, tenantId, 'cultivos');
  }

  async findByParcela(parcelaId: string) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', this.tenantId)
      .eq('parcela_id', parcelaId)
      .order('planting_date', { ascending: false });

    if (error) throw error;
    return data;
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .eq('tenant_id', this.tenantId)
      .single();

    if (error) return null;
    return data;
  }

  async findActiveByTenant() {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*, parcelas(latitude, longitude, name)')
      .eq('tenant_id', this.tenantId)
      .eq('status', 'active');

    if (error) throw error;
    return data;
  }

  async create(input: {
    parcela_id: string;
    species: string;
    variety?: string;
    planting_date: string;
    estimated_harvest_date?: string;
  }) {
    return this.scopedInsert(input);
  }

  async updateStatus(id: string, status: CultivoStatus) {
    return this.scopedUpdate(id, {
      status,
      status_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}
