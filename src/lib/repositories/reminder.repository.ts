import type { SupabaseClient } from '@supabase/supabase-js';
import { TenantScopedRepository } from './base.repository';

export class ReminderRepository extends TenantScopedRepository {
  constructor(supabase: SupabaseClient, tenantId: string) {
    super(supabase, tenantId, 'reminders');
  }

  async findByTenant(filters?: {
    status?: string;
    parcelaId?: string;
    from?: string;
    to?: string;
  }) {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', this.tenantId)
      .order('scheduled_at', { ascending: true });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.parcelaId) query = query.eq('parcela_id', filters.parcelaId);
    if (filters?.from) query = query.gte('scheduled_at', filters.from);
    if (filters?.to) query = query.lte('scheduled_at', filters.to);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async create(input: {
    parcela_id: string;
    cultivo_id?: string;
    task_type: string;
    scheduled_at: string;
    source: string;
    reasoning?: string;
  }) {
    return this.scopedInsert(input);
  }

  async update(id: string, input: Record<string, unknown>) {
    return this.scopedUpdate(id, {
      ...input,
      updated_at: new Date().toISOString(),
    });
  }

  async markCompleted(id: string) {
    return this.scopedUpdate(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  async promoteUpcoming() {
    const windowEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error } = await this.supabase
      .from(this.tableName)
      .update({ status: 'upcoming', updated_at: new Date().toISOString() })
      .eq('tenant_id', this.tenantId)
      .eq('status', 'pending')
      .lte('scheduled_at', windowEnd);

    if (error) throw error;
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .eq('tenant_id', this.tenantId)
      .eq('source', 'manual'); // Solo se pueden eliminar los manuales

    if (error) throw error;
  }

  async findExisting(parcelaId: string, cultivoId: string | null, taskType: string) {
    let query = this.supabase
      .from(this.tableName)
      .select('id')
      .eq('tenant_id', this.tenantId)
      .eq('parcela_id', parcelaId)
      .eq('task_type', taskType)
      .eq('status', 'pending');

    if (cultivoId) query = query.eq('cultivo_id', cultivoId);

    const { data } = await query.limit(1).maybeSingle();
    return data !== null;
  }
}
