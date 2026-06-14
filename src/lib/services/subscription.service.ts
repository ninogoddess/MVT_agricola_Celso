import type { SupabaseClient } from '@supabase/supabase-js';
import { ResourceNotFoundError, LimitExceededError } from '@/lib/utils/errors';

export class SubscriptionService {
  constructor(private supabase: SupabaseClient, private tenantId: string) {}

  async getCurrentSubscription() {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select(`
        id, status, start_date, end_date,
        plan:plans ( id, name, max_plots, max_crops, max_reminders, allow_workers )
      `)
      .eq('tenant_id', this.tenantId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // Si por alguna razón no hay suscripción, asumimos free
      const { data: freePlan } = await this.supabase.from('plans').select('*').eq('id', 'free').single();
      return { plan: freePlan };
    }

    // Aplanar el resultado, ya que Supabase puede devolver plan como un arreglo de un elemento o un objeto dependiendo de RLS/relación.
    // Usualmente con un belongsTo es un objeto.
    const plan = Array.isArray(data.plan) ? data.plan[0] : data.plan;

    return { ...data, plan };
  }

  async checkPlotLimit() {
    const sub = await this.getCurrentSubscription();
    if (!sub.plan) return;
    
    const limit = sub.plan.max_plots;

    const { count, error } = await this.supabase
      .from('parcelas')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', this.tenantId)
      .eq('is_active', true);

    if (error) throw error;
    if (count !== null && count >= limit) {
      throw new LimitExceededError('parcelas');
    }
  }

  async checkCropLimit() {
    const sub = await this.getCurrentSubscription();
    if (!sub.plan) return;

    const limit = sub.plan.max_crops;

    // La tabla `cultivos` usa la columna `status` ('active' | 'harvested' | 'lost'),
    // no `is_active`. Contamos solo los cultivos activos del tenant.
    const { count, error } = await this.supabase
      .from('cultivos')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', this.tenantId)
      .eq('status', 'active');

    if (error) throw error;
    if (count !== null && count >= limit) {
      throw new LimitExceededError('cultivos');
    }
  }

  async checkReminderLimit() {
    const sub = await this.getCurrentSubscription();
    if (!sub.plan) return;

    const limit = sub.plan.max_reminders;

    // La tabla `reminders` tiene `tenant_id` directo. Contamos los recordatorios
    // vigentes (no completados) del tenant.
    const { count, error } = await this.supabase
      .from('reminders')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', this.tenantId)
      .neq('status', 'completed');

    if (error) throw error;
    if (count !== null && count >= limit) {
      throw new LimitExceededError('recordatorios');
    }
  }
}
