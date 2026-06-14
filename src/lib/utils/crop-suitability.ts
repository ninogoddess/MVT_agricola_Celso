/**
 * Motor de aptitud de cultivos.
 *
 * Cruza los datos de suelo ingresados manualmente por el agricultor (pH, humedad,
 * nutrientes) con la ubicación geográfica de la parcela (hemisferio → temporada de
 * siembra), el clima en vivo (temperatura) y los parámetros agronómicos de cada
 * cultivo, para sugerir qué especies conviene plantar ahora.
 *
 * No requiere servicios de pago: usa los parámetros de `crop_parameters` (Supabase)
 * + una tabla local de rangos de pH óptimos por especie.
 */

// Rangos de pH óptimo del suelo por especie (valores agronómicos de referencia).
const PH_OPTIMO_POR_ESPECIE: Record<string, [number, number]> = {
  uva: [5.5, 7.0],
  palta: [5.5, 7.0],
  manzana: [5.8, 7.0],
  cereza: [6.0, 7.5],
  'arándano': [4.5, 5.5],
  arandano: [4.5, 5.5],
  frambuesa: [5.5, 6.5],
  kiwi: [5.5, 7.0],
  durazno: [6.0, 7.0],
  ciruela: [6.0, 7.5],
  tomate: [6.0, 6.8],
  lechuga: [6.0, 7.0],
  papa: [5.0, 6.5],
  cebolla: [6.0, 7.0],
  ajo: [6.0, 7.0],
  zapallo: [6.0, 7.0],
  pimiento: [5.5, 7.0],
  choclo: [5.8, 7.0],
  'maíz': [5.8, 7.0],
  maiz: [5.8, 7.0],
  remolacha: [6.0, 7.5],
  zanahoria: [6.0, 6.8],
  espinaca: [6.5, 7.5],
  acelga: [6.0, 7.0],
  alcachofa: [6.5, 7.5],
  'espárrago': [6.5, 7.5],
  esparrago: [6.5, 7.5],
  poroto: [6.0, 7.0],
  trigo: [6.0, 7.0],
  avena: [5.5, 7.0],
  cebada: [6.0, 7.5],
  raps: [5.5, 7.0],
};

const PH_OPTIMO_DEFAULT: [number, number] = [6.0, 7.0];

/** Parámetros de cultivo tal como vienen de la tabla `crop_parameters`. */
export interface CropParamRow {
  species: string;
  variety: string | null;
  temp_optima_min: number | string | null;
  temp_optima_max: number | string | null;
  humedad_suelo_optima_min: number | string | null;
  humedad_suelo_optima_max: number | string | null;
  hemisferio_sur_meses_siembra: number[];
  hemisferio_norte_meses_siembra: number[];
  dias_a_cosecha: number;
  notes: string | null;
}

export interface SoilSnapshot {
  ph: number;
  humidityPercent: number;
  nitrogenLevel: number | null;
}

export interface SuitabilityInput {
  crops: CropParamRow[];
  soil: SoilSnapshot;
  latitude: number;
  currentTemperature: number | null;
  now: Date;
}

export interface CropSuggestion {
  species: string;
  variety: string | null;
  score: number;            // 0-100
  diasACosecha: number;
  reasons: string[];        // razones positivas (en español)
  warnings: string[];       // advertencias (en español)
  inSeason: boolean;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function num(v: number | string | null): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

/**
 * Puntúa una especie/variedad concreta contra el suelo + clima + temporada.
 */
function scoreCrop(crop: CropParamRow, input: SuitabilityInput): CropSuggestion {
  const reasons: string[] = [];
  const warnings: string[] = [];

  // --- pH del suelo (40 pts) ---
  const key = crop.species.toLowerCase();
  const [phMin, phMax] = PH_OPTIMO_POR_ESPECIE[key] ?? PH_OPTIMO_DEFAULT;
  const ph = input.soil.ph;
  let phScore: number;
  if (ph >= phMin && ph <= phMax) {
    phScore = 40;
    reasons.push(`El pH del suelo (${ph}) es ideal para ${crop.species} (${phMin}–${phMax}).`);
  } else {
    const dist = ph < phMin ? phMin - ph : ph - phMax;
    phScore = Math.max(0, 40 - dist * 20); // -20 pts por cada punto de pH de desviación
    if (dist <= 0.5) {
      reasons.push(`El pH del suelo (${ph}) está cerca del óptimo para ${crop.species} (${phMin}–${phMax}).`);
    } else {
      warnings.push(`El pH del suelo (${ph}) está fuera del rango ideal (${phMin}–${phMax}); requiere corrección.`);
    }
  }

  // --- Temporada de siembra según hemisferio (35 pts) ---
  const isSouthern = input.latitude < 0;
  const sowMonths = isSouthern ? crop.hemisferio_sur_meses_siembra : crop.hemisferio_norte_meses_siembra;
  const currentMonth = input.now.getMonth() + 1;
  const nextMonth = (currentMonth % 12) + 1;
  let seasonScore: number;
  let inSeason = false;
  if (sowMonths?.includes(currentMonth)) {
    seasonScore = 35;
    inSeason = true;
    reasons.push(`Es temporada de siembra ahora (${MESES[currentMonth - 1]}).`);
  } else if (sowMonths?.includes(nextMonth)) {
    seasonScore = 20;
    reasons.push(`La temporada de siembra comienza el próximo mes (${MESES[nextMonth - 1]}).`);
  } else {
    seasonScore = 0;
    const ventana = (sowMonths ?? []).map((m) => MESES[m - 1]).join(', ');
    if (ventana) warnings.push(`Fuera de la ventana de siembra (${ventana}).`);
  }

  // --- Temperatura actual vs óptima (15 pts) ---
  const tMin = num(crop.temp_optima_min);
  const tMax = num(crop.temp_optima_max);
  const temp = input.currentTemperature;
  let tempScore: number;
  if (temp === null || tMin === null || tMax === null) {
    tempScore = 7.5; // neutro si falta dato
  } else if (temp >= tMin && temp <= tMax) {
    tempScore = 15;
    reasons.push(`La temperatura actual (${Math.round(temp)}°C) está en el rango óptimo (${tMin}–${tMax}°C).`);
  } else {
    const dist = temp < tMin ? tMin - temp : temp - tMax;
    tempScore = Math.max(0, 15 - dist * 1.5);
    if (dist > 5) warnings.push(`La temperatura actual (${Math.round(temp)}°C) está lejos del óptimo (${tMin}–${tMax}°C).`);
  }

  // --- Humedad de suelo vs óptima (10 pts) ---
  const hMin = num(crop.humedad_suelo_optima_min);
  const hMax = num(crop.humedad_suelo_optima_max);
  const hum = input.soil.humidityPercent;
  let humScore: number;
  if (hMin === null || hMax === null) {
    humScore = 5;
  } else if (hum >= hMin && hum <= hMax) {
    humScore = 10;
    reasons.push(`La humedad del suelo (${hum}%) es adecuada (${hMin}–${hMax}%).`);
  } else {
    const dist = hum < hMin ? hMin - hum : hum - hMax;
    humScore = Math.max(0, 10 - dist * 0.4);
    if (dist > 15) warnings.push(`La humedad del suelo (${hum}%) está fuera del rango ideal (${hMin}–${hMax}%).`);
  }

  const score = Math.round(phScore + seasonScore + tempScore + humScore);

  return {
    species: crop.species,
    variety: crop.variety,
    score,
    diasACosecha: crop.dias_a_cosecha,
    reasons,
    warnings,
    inSeason,
  };
}

/**
 * Devuelve las mejores sugerencias de cultivo ordenadas por aptitud.
 * Agrupa por especie (toma la mejor variedad) para no repetir.
 */
export function suggestCrops(input: SuitabilityInput, limit = 6): CropSuggestion[] {
  const scored = input.crops.map((c) => scoreCrop(c, input));

  // Quedarnos con la mejor entrada por especie.
  const bestBySpecies = new Map<string, CropSuggestion>();
  for (const s of scored) {
    const existing = bestBySpecies.get(s.species);
    if (!existing || s.score > existing.score) bestBySpecies.set(s.species, s);
  }

  return [...bestBySpecies.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
