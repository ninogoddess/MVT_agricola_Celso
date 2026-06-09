import type { SupabaseClient } from '@supabase/supabase-js';
import { CultivoRepository } from '@/lib/repositories/cultivo.repository';
import { ParcelaRepository } from '@/lib/repositories/parcela.repository';
import { ResourceNotFoundError, TenantAccessError } from '@/lib/utils/errors';
import type { CreateCultivoInput, UpdateCultivoStatusInput } from '@/lib/validators/cultivo.schema';

export class CultivoService {
  private repo: CultivoRepository;
  private parcelaRepo: ParcelaRepository;

  constructor(supabase: SupabaseClient, tenantId: string) {
    this.repo = new CultivoRepository(supabase, tenantId);
    this.parcelaRepo = new ParcelaRepository(supabase, tenantId);
  }

  async listByParcela(parcelaId: string) {
    const parcelaExists = await this.parcelaRepo.verifyOwnership(parcelaId);
    if (!parcelaExists) throw new ResourceNotFoundError('Parcela');

    return this.repo.findByParcela(parcelaId);
  }

  async create(parcelaId: string, input: CreateCultivoInput) {
    const parcelaExists = await this.parcelaRepo.verifyOwnership(parcelaId);
    if (!parcelaExists) throw new TenantAccessError();

    const { data, error } = await this.repo.create({
      parcela_id: parcelaId,
      name: input.name,
      species: input.species,
      variety: input.variety,
      planting_date: input.plantingDate,
      estimated_harvest_date: input.estimatedHarvestDate,
    });

    if (error) throw error;
    return data;
  }

  async updateStatus(id: string, input: UpdateCultivoStatusInput) {
    const exists = await this.repo.verifyOwnership(id);
    if (!exists) throw new ResourceNotFoundError('Cultivo');

    const { data, error } = await this.repo.updateStatus(id, input.status);
    if (error) throw error;
    return data;
  }
}
