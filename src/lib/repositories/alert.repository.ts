import type { SupabaseClient } from '@supabase/supabase-js';
import { TenantScopedRepository } from './base.repository';
import type { AlertType } from '@/types/models';

export class AlertRepository extends TenantScopedRepository {
  constructor(supabase: SupabaseClient, tenantId: string) {
    super(supabase, tenantId, 'alerts');
  }

  async findByTenant(filters?: { status?: string; parcelaId?: string }) {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', this.tenantId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.parcelaId) {
      query = query.eq('parcela_id', filters.parcelaId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async findRecentAlert(parcelaId: string, alertType: AlertType, windowStart: Date) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', this.tenantId)
      .eq('parcela_id', parcelaId)
      .eq('alert_type', alertType)
      .gte('last_triggered_at', windowStart.toISOString())
      .order('last_triggered_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async incrementGroupedAlert(id: string, detectedValue: number, now: Date) {
    // Primero incrementar el contador via RPC
    await this.supabase.rpc('increment_alert_count', { alert_id: id });

    // Luego actualizar los demás campos
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        detected_value: detectedValue,
        last_triggered_at: now.toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', this.tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async create(input: {
    parcela_id: string;
    alert_type: string;
    detected_value: number;
    threshold_value: number;
    status: string;
    grouped_count: number;
    first_triggered_at: Date;
    last_triggered_at: Date;
  }) {
    return this.scopedInsert({
      ...input,
      first_triggered_at: input.first_triggered_at.toISOString(),
      last_triggered_at: input.last_triggered_at.toISOString(),
    });
  }

  async markAsRead(id: string) {
    return this.scopedUpdate(id, {
      status: 'read',
      read_at: new Date().toISOString(),
    });
  }
}
