import type { SupabaseClient } from '@supabase/supabase-js';
import { ParcelaRepository } from '@/lib/repositories/parcela.repository';
import { ResourceNotFoundError, ValidationError } from '@/lib/utils/errors';
import type { CreateParcelaInput, UpdateParcelaInput } from '@/lib/validators/parcela.schema';

export class ParcelaService {
  private repo: ParcelaRepository;

  constructor(supabase: SupabaseClient, tenantId: string) {
    this.repo = new ParcelaRepository(supabase, tenantId);
  }

  async list(activeOnly = true) {
    return this.repo.findAll(activeOnly);
  }

  async getById(id: string) {
    const parcela = await this.repo.findById(id);
    if (!parcela) throw new ResourceNotFoundError('Parcela');
    return parcela;
  }

  async create(input: CreateParcelaInput) {
    const { data, error } = await this.repo.create({
      name: input.name,
      latitude: input.latitude,
      longitude: input.longitude,
      area_hectares: input.areaHectares,
    });

    if (error) {
      // Unique constraint violation
      if (error.code === '23505') {
        throw new ValidationError([
          { field: 'name', message: 'Ya existe una parcela con ese nombre' },
        ]);
      }
      throw error;
    }

    return data;
  }

  async update(id: string, input: UpdateParcelaInput) {
    const exists = await this.repo.verifyOwnership(id);
    if (!exists) throw new ResourceNotFoundError('Parcela');

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.latitude !== undefined) updateData.latitude = input.latitude;
    if (input.longitude !== undefined) updateData.longitude = input.longitude;
    if (input.areaHectares !== undefined) updateData.area_hectares = input.areaHectares;

    const { data, error } = await this.repo.update(id, updateData);

    if (error) {
      if (error.code === '23505') {
        throw new ValidationError([
          { field: 'name', message: 'Ya existe una parcela con ese nombre' },
        ]);
      }
      throw error;
    }

    return data;
  }

  async softDelete(id: string) {
    const exists = await this.repo.verifyOwnership(id);
    if (!exists) throw new ResourceNotFoundError('Parcela');

    const { data, error } = await this.repo.softDelete(id);
    if (error) throw error;
    return data;
  }
}
