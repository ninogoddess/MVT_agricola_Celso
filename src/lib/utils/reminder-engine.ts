import type { CropParameters } from '@/types/models';

export interface IrrigationInput {
  lastSoilHumidityPercent: number;
  forecastPrecipitation72hPercent: number;
  optimalHumidityMin: number;
  now: Date;
}

/**
 * Calcula fecha sugerida de riego.
 * Cuanto mayor el déficit hídrico, más cercana la fecha.
 */
export function computeIrrigationDate(input: IrrigationInput): Date {
  const deficit = Math.max(0, input.optimalHumidityMin - input.lastSoilHumidityPercent);
  // Si hay alta probabilidad de lluvia, diferir
  const reliefFactor = input.forecastPrecipitation72hPercent / 100;
  const urgencyHours = Math.max(2, 48 - deficit * 1.5 - reliefFactor * 24);

  const scheduled = new Date(input.now);
  scheduled.setHours(scheduled.getHours() + Math.round(urgencyHours));
  return scheduled;
}

/**
 * Calcula fecha sugerida de poda según ventana del cultivo.
 */
export function computePruningDate(
  ventanaPodaMeses: number[] | null,
  now: Date
): Date | null {
  if (!ventanaPodaMeses?.length) return null;

  const nextMonth = nextMonthInWindow(ventanaPodaMeses, now);
  return nextMonth;
}

/**
 * Calcula fecha sugerida de fertilización.
 * Cruza calendario de fertilización (DAP) con niveles de nutrientes.
 */
export function computeFertilizationDate(
  plantingDate: Date,
  cropParams: CropParameters,
  lastSoilNitrogen: number | null,
  now: Date
): Date | null {
  const calendario = cropParams.calendarioFertilizacion;
  if (!calendario?.length) return null;

  const daysSincePlanting = Math.floor(
    (now.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Encontrar la próxima fertilización según DAP
  const nextFert = calendario.find((f) => f.dap > daysSincePlanting);
  if (!nextFert) return null;

  const daysUntilFert = nextFert.dap - daysSincePlanting;

  // Si hay déficit de nutrientes, adelantar un poco
  let adjustment = 0;
  if (lastSoilNitrogen !== null && lastSoilNitrogen < 20) {
    adjustment = -Math.min(3, daysUntilFert - 1); // Adelantar hasta 3 días
  }

  const scheduled = new Date(now);
  scheduled.setDate(scheduled.getDate() + daysUntilFert + adjustment);
  return scheduled;
}

/**
 * Encuentra el próximo mes en la ventana >= ahora.
 */
export function nextMonthInWindow(months: number[], now: Date): Date {
  const currentMonth = now.getMonth() + 1;
  const year = now.getFullYear();

  const sorted = [...months].sort((a, b) => a - b);
  const future = sorted.find((m) => m >= currentMonth);

  if (future) {
    return new Date(year, future - 1, 15); // Mitad del mes
  }

  // Próximo año, primer mes de la ventana
  return new Date(year + 1, sorted[0] - 1, 15);
}
