import type { SupabaseClient } from '@supabase/supabase-js';
import { TenantScopedRepository } from './base.repository';

export class ParcelaRepository extends TenantScopedRepository {
  constructor(supabase: SupabaseClient, tenantId: string) {
    super(supabase, tenantId, 'parcelas');
  }

  async findAll(activeOnly = true) {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', this.tenantId)
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
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

  async create(input: {
    name: string;
    latitude: number;
    longitude: number;
    area_hectares: number;
  }) {
    return this.scopedInsert(input);
  }

  async update(id: string, input: Record<string, unknown>) {
    return this.scopedUpdate(id, {
      ...input,
      updated_at: new Date().toISOString(),
    });
  }

  async softDelete(id: string) {
    return this.scopedUpdate(id, {
      is_active: false,
      updated_at: new Date().toISOString(),
    });
  }
}
