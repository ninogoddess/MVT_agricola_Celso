import type { SupabaseClient } from '@supabase/supabase-js';
import { SoilRepository } from '@/lib/repositories/soil.repository';
import { ParcelaRepository } from '@/lib/repositories/parcela.repository';
import { ResourceNotFoundError, TenantAccessError } from '@/lib/utils/errors';
import type { CreateSoilDataInput } from '@/lib/validators/soil.schema';

export class SoilService {
  private repo: SoilRepository;
  private parcelaRepo: ParcelaRepository;

  constructor(supabase: SupabaseClient, tenantId: string) {
    this.repo = new SoilRepository(supabase, tenantId);
    this.parcelaRepo = new ParcelaRepository(supabase, tenantId);
  }

  async getHistory(parcelaId: string, limit = 20, offset = 0) {
    const parcelaExists = await this.parcelaRepo.verifyOwnership(parcelaId);
    if (!parcelaExists) throw new ResourceNotFoundError('Parcela');

    return this.repo.findByParcela(parcelaId, limit, offset);
  }

  async getLatest(parcelaId: string) {
    return this.repo.findLatest(parcelaId);
  }

  async create(parcelaId: string, input: CreateSoilDataInput) {
    const parcelaExists = await this.parcelaRepo.verifyOwnership(parcelaId);
    if (!parcelaExists) throw new TenantAccessError();

    const { data, error } = await this.repo.create({
      parcela_id: parcelaId,
      measurement_date: input.measurementDate,
      ph: input.ph,
      humidity_percent: input.humidityPercent,
      nitrogen_level: input.nitrogenLevel,
      phosphorus_level: input.phosphorusLevel,
      potassium_level: input.potassiumLevel,
    });

    if (error) throw error;
    return data;
  }
}
