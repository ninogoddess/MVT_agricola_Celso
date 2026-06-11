import type { SupabaseClient } from '@supabase/supabase-js';
import { ReminderRepository } from '@/lib/repositories/reminder.repository';
import { ParcelaRepository } from '@/lib/repositories/parcela.repository';
import { TenantAccessError, ResourceNotFoundError } from '@/lib/utils/errors';
import { computeIrrigationDate, computePruningDate, computeFertilizationDate } from '@/lib/utils/reminder-engine';
import type { CreateReminderInput } from '@/lib/validators/reminder.schema';

import { SubscriptionService } from '@/lib/services/subscription.service';

export class ReminderService {
  private repo: ReminderRepository;
  private parcelaRepo: ParcelaRepository;
  private subscriptionService: SubscriptionService;
  private supabase: SupabaseClient;
  private tenantId: string;

  constructor(supabase: SupabaseClient, tenantId: string) {
    this.supabase = supabase;
    this.tenantId = tenantId;
    this.repo = new ReminderRepository(supabase, tenantId);
    this.parcelaRepo = new ParcelaRepository(supabase, tenantId);
    this.subscriptionService = new SubscriptionService(supabase, tenantId);
  }

  async list(filters?: { status?: string; parcelaId?: string; from?: string; to?: string }) {
    return this.repo.findByTenant(filters);
  }

  async createManual(input: CreateReminderInput) {
    await this.subscriptionService.checkReminderLimit();

    // Verificar ownership de parcela
    const parcelaExists = await this.parcelaRepo.verifyOwnership(input.parcelaId);
    if (!parcelaExists) throw new TenantAccessError();

    // Verificar ownership de cultivo si se proporciona
    if (input.cultivoId) {
      const { data } = await this.supabase
        .from('cultivos')
        .select('id')
        .eq('id', input.cultivoId)
        .eq('tenant_id', this.tenantId)
        .maybeSingle();
      if (!data) throw new TenantAccessError();
    }

    const { data, error } = await this.repo.create({
      parcela_id: input.parcelaId,
      cultivo_id: input.cultivoId,
      task_type: input.taskType,
      scheduled_at: input.scheduledAt,
      source: 'manual',
    });

    if (error) throw error;
    return data;
  }

  async markCompleted(id: string) {
    const exists = await this.repo.verifyOwnership(id);
    if (!exists) throw new ResourceNotFoundError('Recordatorio');

    return this.repo.markCompleted(id);
  }

  async update(id: string, input: Record<string, unknown>) {
    const exists = await this.repo.verifyOwnership(id);
    if (!exists) throw new ResourceNotFoundError('Recordatorio');

    return this.repo.update(id, input);
  }

  async delete(id: string) {
    const exists = await this.repo.verifyOwnership(id);
    if (!exists) throw new ResourceNotFoundError('Recordatorio');

    return this.repo.delete(id);
  }

  async promoteUpcoming() {
    return this.repo.promoteUpcoming();
  }

  /**
   * Genera recordatorios automáticos para cultivos activos.
   * Usado por el cron job.
   */
  async generateAutoReminders() {
    // Obtener cultivos activos con datos de parcela
    const { data: cultivos } = await this.supabase
      .from('cultivos')
      .select('*, parcelas(latitude, longitude)')
      .eq('tenant_id', this.tenantId)
      .eq('status', 'active');

    if (!cultivos?.length) return;

    const now = new Date();

    for (const cultivo of cultivos) {
      // Obtener crop_parameters
      const { data: cropParams } = await this.supabase
        .from('crop_parameters')
        .select('*')
        .eq('species', cultivo.species.toLowerCase())
        .limit(1)
        .maybeSingle();

      if (!cropParams) continue;

      // --- Riego ---
      const hasRiegoReminder = await this.repo.findExisting(
        cultivo.parcela_id, cultivo.id, 'riego'
      );
      if (!hasRiegoReminder) {
        const { data: lastSoil } = await this.supabase
          .from('soil_data')
          .select('humidity_percent')
          .eq('parcela_id', cultivo.parcela_id)
          .order('measurement_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: lastClimate } = await this.supabase
          .from('climate_data')
          .select('precipitation_probability_percent')
          .eq('parcela_id', cultivo.parcela_id)
          .order('fetched_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastSoil && cropParams.humedad_suelo_optima_min) {
          const irrigationDate = computeIrrigationDate({
            lastSoilHumidityPercent: Number(lastSoil.humidity_percent),
            forecastPrecipitation72hPercent: lastClimate ? Number(lastClimate.precipitation_probability_percent) : 0,
            optimalHumidityMin: Number(cropParams.humedad_suelo_optima_min),
            now,
          });

          await this.repo.create({
            parcela_id: cultivo.parcela_id,
            cultivo_id: cultivo.id,
            task_type: 'riego',
            scheduled_at: irrigationDate.toISOString(),
            source: 'auto',
            reasoning: `Humedad actual: ${lastSoil.humidity_percent}%, óptima mín: ${cropParams.humedad_suelo_optima_min}%`,
          });
        }
      }

      // --- Poda ---
      if (cropParams.ventana_poda_meses) {
        const hasPodaReminder = await this.repo.findExisting(
          cultivo.parcela_id, cultivo.id, 'poda'
        );
        if (!hasPodaReminder) {
          const podaDate = computePruningDate(cropParams.ventana_poda_meses, now);
          if (podaDate) {
            await this.repo.create({
              parcela_id: cultivo.parcela_id,
              cultivo_id: cultivo.id,
              task_type: 'poda',
              scheduled_at: podaDate.toISOString(),
              source: 'auto',
              reasoning: `Ventana de poda: meses ${cropParams.ventana_poda_meses.join(', ')}`,
            });
          }
        }
      }

      // --- Fertilización ---
      if (cropParams.calendario_fertilizacion) {
        const hasFertReminder = await this.repo.findExisting(
          cultivo.parcela_id, cultivo.id, 'fertilizacion'
        );
        if (!hasFertReminder) {
          const { data: lastSoilForFert } = await this.supabase
            .from('soil_data')
            .select('nitrogen_level')
            .eq('parcela_id', cultivo.parcela_id)
            .order('measurement_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          const fertDate = computeFertilizationDate(
            new Date(cultivo.planting_date),
            {
              ...cropParams,
              tempMinGerminacion: Number(cropParams.temp_min_germinacion),
              tempMaxGerminacion: Number(cropParams.temp_max_germinacion),
              tempOptimaMin: cropParams.temp_optima_min ? Number(cropParams.temp_optima_min) : null,
              tempOptimaMax: cropParams.temp_optima_max ? Number(cropParams.temp_optima_max) : null,
              diasACosecha: cropParams.dias_a_cosecha,
              hemisferioSurMesesSiembra: cropParams.hemisferio_sur_meses_siembra,
              hemisferioNorteMesesSiembra: cropParams.hemisferio_norte_meses_siembra,
              ventanaPodaMeses: cropParams.ventana_poda_meses,
              calendarioFertilizacion: cropParams.calendario_fertilizacion,
              humedadSueloOptimaMin: cropParams.humedad_suelo_optima_min ? Number(cropParams.humedad_suelo_optima_min) : null,
              humedadSueloOptimaMax: cropParams.humedad_suelo_optima_max ? Number(cropParams.humedad_suelo_optima_max) : null,
            },
            lastSoilForFert ? Number(lastSoilForFert.nitrogen_level) : null,
            now
          );

          if (fertDate) {
            await this.repo.create({
              parcela_id: cultivo.parcela_id,
              cultivo_id: cultivo.id,
              task_type: 'fertilizacion',
              scheduled_at: fertDate.toISOString(),
              source: 'auto',
              reasoning: `Calendario de fertilización del cultivo (DAP)`,
            });
          }
        }
      }
    }
  }
}
