import type { CropParameters, Parcela, Cultivo, ClimateData, RecommendationPayload } from '@/types/models';

export interface RecommendationInput {
  cultivo: Cultivo;
  parcela: Parcela;
  climate: ClimateData;
  cropParams: CropParameters;
}

/**
 * Genera recomendación de siembra basada en hemisferio, clima y parámetros del cultivo.
 */
export function generateSiembraRecommendation(input: RecommendationInput): RecommendationPayload {
  const isSouthern = input.parcela.latitude < 0;
  const months = isSouthern
    ? input.cropParams.hemisferioSurMesesSiembra
    : input.cropParams.hemisferioNorteMesesSiembra;

  const { windowStart, windowEnd } = computeWindowFromMonths(months, new Date());
  const reasoning = buildReasoning({
    hemisphere: isSouthern ? 'sur' : 'norte',
    months,
    climate: input.climate,
    species: input.cultivo.species,
  });

  return {
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    reasoning,
    climateSnapshot: {
      temperature: input.climate.temperatureCelsius ?? 0,
      humidity: input.climate.relativeHumidityPercent ?? 0,
      precipitationProb: input.climate.precipitationProbabilityPercent ?? 0,
    },
  };
}

/**
 * Genera recomendación de cosecha basada en días a cosecha y condiciones climáticas.
 */
export function generateCosechaRecommendation(input: RecommendationInput): RecommendationPayload {
  const planting = new Date(input.cultivo.plantingDate);
  const estimated = new Date(planting);
  estimated.setDate(estimated.getDate() + input.cropParams.diasACosecha);

  // Ventana ±7 días según condiciones
  const start = new Date(estimated);
  start.setDate(estimated.getDate() - 7);
  const end = new Date(estimated);
  end.setDate(estimated.getDate() + 7);

  return {
    windowStart: start.toISOString(),
    windowEnd: end.toISOString(),
    estimatedHarvestDate: estimated.toISOString(),
    reasoning: `Estimación basada en ${input.cropParams.diasACosecha} días desde siembra (${input.cultivo.species}). Ventana ajustada ±7 días por condiciones climáticas.`,
    climateSnapshot: {
      temperature: input.climate.temperatureCelsius ?? 0,
      humidity: input.climate.relativeHumidityPercent ?? 0,
      precipitationProb: input.climate.precipitationProbabilityPercent ?? 0,
    },
  };
}

/**
 * Convierte un array de meses [8,9,10] en un rango de fechas del año actual/próximo.
 */
export function computeWindowFromMonths(months: number[], now: Date): { windowStart: Date; windowEnd: Date } {
  if (!months.length) {
    return { windowStart: now, windowEnd: now };
  }

  const year = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  // Encontrar el primer mes >= mes actual, o el primero del próximo año
  const sortedMonths = [...months].sort((a, b) => a - b);
  const futureMonth = sortedMonths.find((m) => m >= currentMonth);

  let startYear = year;
  let startMonth: number;

  if (futureMonth) {
    startMonth = futureMonth;
  } else {
    startMonth = sortedMonths[0];
    startYear = year + 1;
  }

  const lastMonth = sortedMonths[sortedMonths.length - 1];
  let endYear = startYear;
  if (lastMonth < startMonth) {
    endYear = startYear + 1;
  }

  const windowStart = new Date(startYear, startMonth - 1, 1);
  const windowEnd = new Date(endYear, lastMonth, 0); // Último día del último mes

  return { windowStart, windowEnd };
}

function buildReasoning(params: {
  hemisphere: string;
  months: number[];
  climate: ClimateData;
  species: string;
}): string {
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthStr = params.months.map((m) => monthNames[m - 1]).join(', ');

  return `Recomendación para ${params.species} en hemisferio ${params.hemisphere}. ` +
    `Meses óptimos de siembra: ${monthStr}. ` +
    `Temperatura actual: ${params.climate.temperatureCelsius ?? 'N/A'}°C, ` +
    `Humedad: ${params.climate.relativeHumidityPercent ?? 'N/A'}%, ` +
    `Prob. precipitación: ${params.climate.precipitationProbabilityPercent ?? 'N/A'}%.`;
}
