/**
 * Análisis derivado de los datos diarios de Open-Meteo (sin costo).
 * Se usa en las vistas de alertas de heladas/golpe de calor y de grados-día (GDD).
 */

export interface DailyPoint {
  date: string;
  tempMax: number | null;
  tempMin: number | null;
  precipitationProb: number | null;
  precipitationSum: number | null;
  isPast: boolean;
}

// Umbrales de referencia (°C).
export const FROST_RISK = 3;      // riesgo de helada
export const FROST_SEVERE = 0;    // helada
export const HEAT_RISK = 34;      // riesgo de golpe de calor
export const HEAT_SEVERE = 38;    // golpe de calor severo
export const GDD_BASE = 10;       // temperatura base para grados-día
export const CHILL_THRESHOLD = 7; // umbral de horas-frío (aprox. diaria)

export type RiskLevel = "none" | "risk" | "severe";

export function frostLevel(tempMin: number | null): RiskLevel {
  if (tempMin === null) return "none";
  if (tempMin <= FROST_SEVERE) return "severe";
  if (tempMin <= FROST_RISK) return "risk";
  return "none";
}

export function heatLevel(tempMax: number | null): RiskLevel {
  if (tempMax === null) return "none";
  if (tempMax >= HEAT_SEVERE) return "severe";
  if (tempMax >= HEAT_RISK) return "risk";
  return "none";
}

/** Grados-día de crecimiento de un día: max(0, (Tmax+Tmin)/2 - base). */
export function gddForDay(tempMax: number | null, tempMin: number | null, base = GDD_BASE): number {
  if (tempMax === null || tempMin === null) return 0;
  const mean = (tempMax + tempMin) / 2;
  return Math.max(0, mean - base);
}

export interface ClimateAnalysis {
  // Pronóstico (días futuros)
  frostDays: DailyPoint[];
  heatDays: DailyPoint[];
  worstFrost: number | null;  // mínima más baja del pronóstico
  worstHeat: number | null;   // máxima más alta del pronóstico
  // Térmico
  gddWindow: number;          // GDD acumulado en la ventana (14 días)
  gddForecast: number;        // GDD acumulado solo del pronóstico
  chillDays: number;          // días con mínima < umbral (proxy horas-frío)
}

export function analyzeClimate(data: DailyPoint[]): ClimateAnalysis {
  const forecast = data.filter((d) => !d.isPast);

  const frostDays = forecast.filter((d) => frostLevel(d.tempMin) !== "none");
  const heatDays = forecast.filter((d) => heatLevel(d.tempMax) !== "none");

  const mins = forecast.map((d) => d.tempMin).filter((v): v is number => v != null);
  const maxs = forecast.map((d) => d.tempMax).filter((v): v is number => v != null);

  const gddWindow = data.reduce((sum, d) => sum + gddForDay(d.tempMax, d.tempMin), 0);
  const gddForecast = forecast.reduce((sum, d) => sum + gddForDay(d.tempMax, d.tempMin), 0);
  const chillDays = data.filter((d) => d.tempMin != null && d.tempMin < CHILL_THRESHOLD).length;

  return {
    frostDays,
    heatDays,
    worstFrost: mins.length ? Math.min(...mins) : null,
    worstHeat: maxs.length ? Math.max(...maxs) : null,
    gddWindow: Math.round(gddWindow),
    gddForecast: Math.round(gddForecast),
    chillDays,
  };
}
