import type { SupabaseClient } from '@supabase/supabase-js';
import { TenantScopedRepository } from './base.repository';

export class FieldLogRepository extends TenantScopedRepository {
  constructor(supabase: SupabaseClient, tenantId: string) {
    super(supabase, tenantId, 'field_logs');
  }

  async findByTenant(parcelaId?: string) {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', this.tenantId)
      .order('log_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (parcelaId) query = query.eq('parcela_id', parcelaId);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async create(input: Record<string, unknown>) {
    return this.scopedInsert(input);
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .eq('tenant_id', this.tenantId);
    if (error) throw error;
  }
}

export class TransactionRepository extends TenantScopedRepository {
  constructor(supabase: SupabaseClient, tenantId: string) {
    super(supabase, tenantId, 'transactions');
  }

  async findByTenant(parcelaId?: string) {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', this.tenantId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (parcelaId) query = query.eq('parcela_id', parcelaId);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async create(input: Record<string, unknown>) {
    return this.scopedInsert(input);
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .eq('tenant_id', this.tenantId);
    if (error) throw error;
  }
}
