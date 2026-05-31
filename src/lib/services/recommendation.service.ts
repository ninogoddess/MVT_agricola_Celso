import type { SupabaseClient } from '@supabase/supabase-js';
import { RecommendationRepository } from '@/lib/repositories/recommendation.repository';
import { ClimateRepository } from '@/lib/repositories/climate.repository';
import { CultivoRepository } from '@/lib/repositories/cultivo.repository';
import { ParcelaRepository } from '@/lib/repositories/parcela.repository';
import { CropParametersNotFoundError, ResourceNotFoundError } from '@/lib/utils/errors';
import { generateSiembraRecommendation, generateCosechaRecommendation } from '@/lib/utils/recommendation-engine';
import type { RecommendationType } from '@/types/models';

export class RecommendationService {
  private repo: RecommendationRepository;
  private climateRepo: ClimateRepository;
  private cultivoRepo: CultivoRepository;
  private parcelaRepo: ParcelaRepository;
  private supabase: SupabaseClient;
  private tenantId: string;

  constructor(supabase: SupabaseClient, tenantId: string) {
    this.supabase = supabase;
    this.tenantId = tenantId;
    this.repo = new RecommendationRepository(supabase, tenantId);
    this.climateRepo = new ClimateRepository(supabase, tenantId);
    this.cultivoRepo = new CultivoRepository(supabase, tenantId);
    this.parcelaRepo = new ParcelaRepository(supabase, tenantId);
  }

  async getOrGenerate(parcelaId: string, cultivoId: string, type: RecommendationType) {
    // Buscar cache vigente
    const cached = await this.repo.findCachedFor(parcelaId, cultivoId, type);
    if (cached) {
      return { recommendation: cached, isStale: cached.is_stale };
    }

    // Generar nueva recomendación
    return this.generate(parcelaId, cultivoId, type);
  }

  async generate(parcelaId: string, cultivoId: string, type: RecommendationType) {
    const parcela = await this.parcelaRepo.findById(parcelaId);
    if (!parcela) throw new ResourceNotFoundError('Parcela');

    const cultivo = await this.cultivoRepo.findById(cultivoId);
    if (!cultivo) throw new ResourceNotFoundError('Cultivo');

    // Buscar parámetros del cultivo (tabla pública, sin tenant)
    const cropParams = await this.findCropParameters(cultivo.species, cultivo.variety);
    if (!cropParams) throw new CropParametersNotFoundError();

    // Obtener último dato climático
    const climate = await this.climateRepo.findLatest(parcelaId);
    const isStale = !climate;

    // Si no hay datos climáticos, no podemos generar
    if (!climate) {
      const lastCached = await this.repo.findCachedFor(parcelaId, cultivoId, type);
      if (lastCached) {
        return { recommendation: lastCached, isStale: true };
      }
      // Generar con datos mínimos
    }

    const input = {
      cultivo: {
        ...cultivo,
        plantingDate: new Date(cultivo.planting_date),
        parcelaId: cultivo.parcela_id,
        tenantId: cultivo.tenant_id,
        statusChangedAt: new Date(cultivo.status_changed_at),
        estimatedHarvestDate: cultivo.estimated_harvest_date ? new Date(cultivo.estimated_harvest_date) : null,
        createdAt: new Date(cultivo.created_at),
        updatedAt: new Date(cultivo.updated_at),
      },
      parcela: {
        ...parcela,
        latitude: Number(parcela.latitude),
        longitude: Number(parcela.longitude),
        areaHectares: Number(parcela.area_hectares),
        isActive: parcela.is_active,
        createdAt: new Date(parcela.created_at),
        updatedAt: new Date(parcela.updated_at),
      },
      climate: climate ? {
        ...climate,
        temperatureCelsius: climate.temperature_celsius ? Number(climate.temperature_celsius) : null,
        relativeHumidityPercent: climate.relative_humidity_percent ? Number(climate.relative_humidity_percent) : null,
        windSpeedKmh: climate.wind_speed_kmh ? Number(climate.wind_speed_kmh) : null,
        precipitationProbabilityPercent: climate.precipitation_probability_percent ? Number(climate.precipitation_probability_percent) : null,
        forecast72h: climate.forecast_72h,
        fetchedAt: new Date(climate.fetched_at),
        createdAt: new Date(climate.created_at),
      } : {
        id: '', tenantId: this.tenantId, parcelaId,
        temperatureCelsius: null, relativeHumidityPercent: null,
        windSpeedKmh: null, precipitationProbabilityPercent: null,
        forecast72h: null, fetchedAt: new Date(), createdAt: new Date(),
      },
      cropParams: {
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
    };

    const payload = type === 'siembra'
      ? generateSiembraRecommendation(input)
      : generateCosechaRecommendation(input);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h

    const { data, error } = await this.repo.upsert({
      parcela_id: parcelaId,
      cultivo_id: cultivoId,
      recommendation_type: type,
      payload,
      climate_data_fetched_at: climate?.fetched_at ?? now.toISOString(),
      is_stale: isStale,
      generated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    if (error) throw error;
    return { recommendation: data, isStale };
  }

  async list(filters?: { parcelaId?: string; type?: string; cultivoId?: string }) {
    return this.repo.listByTenant(filters);
  }

  private async findCropParameters(species: string, variety: string | null) {
    // Intentar con especie + variedad
    if (variety) {
      const { data } = await this.supabase
        .from('crop_parameters')
        .select('*')
        .eq('species', species.toLowerCase())
        .eq('variety', variety.toLowerCase())
        .maybeSingle();
      if (data) return data;
    }

    // Fallback: solo especie (variety = null)
    const { data } = await this.supabase
      .from('crop_parameters')
      .select('*')
      .eq('species', species.toLowerCase())
      .is('variety', null)
      .maybeSingle();

    if (data) return data;

    // Último intento: cualquier variedad de esa especie
    const { data: anyVariety } = await this.supabase
      .from('crop_parameters')
      .select('*')
      .eq('species', species.toLowerCase())
      .limit(1)
      .maybeSingle();

    return anyVariety;
  }
}
