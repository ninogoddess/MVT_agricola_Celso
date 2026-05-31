import type { SupabaseClient } from '@supabase/supabase-js';
import { AlertRepository } from '@/lib/repositories/alert.repository';
import type { AlertTrigger } from '@/lib/utils/alert-engine';

const GROUPING_WINDOW_MS = 60 * 60 * 1000; // 60 minutos

export class AlertService {
  private repo: AlertRepository;

  constructor(supabase: SupabaseClient, tenantId: string) {
    this.repo = new AlertRepository(supabase, tenantId);
  }

  async list(filters?: { status?: string; parcelaId?: string }) {
    return this.repo.findByTenant(filters);
  }

  async markAsRead(id: string) {
    return this.repo.markAsRead(id);
  }

  async processAlertTrigger(trigger: AlertTrigger) {
    const now = new Date();
    const windowStart = new Date(now.getTime() - GROUPING_WINDOW_MS);

    // Buscar alerta existente del mismo tipo/parcela dentro de la ventana
    const existingAlert = await this.repo.findRecentAlert(
      trigger.parcelaId,
      trigger.alertType,
      windowStart
    );

    if (existingAlert) {
      // Agrupar: incrementar contador
      return this.repo.incrementGroupedAlert(
        existingAlert.id,
        trigger.detectedValue,
        now
      );
    }

    // Crear nueva alerta
    const { data, error } = await this.repo.create({
      parcela_id: trigger.parcelaId,
      alert_type: trigger.alertType,
      detected_value: trigger.detectedValue,
      threshold_value: trigger.thresholdValue,
      status: 'pending',
      grouped_count: 1,
      first_triggered_at: now,
      last_triggered_at: now,
    });

    if (error) throw error;
    return data;
  }
}
