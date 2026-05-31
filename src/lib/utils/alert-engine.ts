import type { AlertType } from '@/types/models';

export interface ThresholdConfig {
  thresholdType: AlertType;
  minValue: number | null;
  maxValue: number | null;
}

export interface AlertTrigger {
  parcelaId: string;
  alertType: AlertType;
  detectedValue: number;
  thresholdValue: number;
}

interface ClimateInput {
  temperatureCelsius: number | null;
  precipitationProbabilityPercent: number | null;
}

interface SoilInput {
  humidityPercent: number | null;
}

const DEFAULT_THRESHOLDS: ThresholdConfig[] = [
  { thresholdType: 'temp_min', minValue: 0, maxValue: null },
  { thresholdType: 'temp_max', minValue: null, maxValue: 40 },
  { thresholdType: 'soil_humidity_min', minValue: 20, maxValue: null },
  { thresholdType: 'precipitation_high', minValue: null, maxValue: 80 },
];

export function mergeThresholds(
  defaults: ThresholdConfig[],
  custom: ThresholdConfig[]
): ThresholdConfig[] {
  const customMap = new Map(custom.map((t) => [t.thresholdType, t]));
  return defaults.map((d) => customMap.get(d.thresholdType) ?? d);
}

function getValueForType(
  type: AlertType,
  climate: ClimateInput | null,
  soil: SoilInput | null
): number | null {
  switch (type) {
    case 'temp_min':
    case 'temp_max':
      return climate?.temperatureCelsius ?? null;
    case 'soil_humidity_min':
      return soil?.humidityPercent ?? null;
    case 'precipitation_high':
      return climate?.precipitationProbabilityPercent ?? null;
    default:
      return null;
  }
}

export function evaluateAlerts(
  climateData: ClimateInput | null,
  soilData: SoilInput | null,
  customThresholds: ThresholdConfig[],
  parcelaId: string
): AlertTrigger[] {
  const thresholds = mergeThresholds(DEFAULT_THRESHOLDS, customThresholds);
  const triggers: AlertTrigger[] = [];

  for (const threshold of thresholds) {
    const value = getValueForType(threshold.thresholdType, climateData, soilData);
    if (value === null) continue;

    if (threshold.minValue !== null && value < threshold.minValue) {
      triggers.push({
        parcelaId,
        alertType: threshold.thresholdType,
        detectedValue: value,
        thresholdValue: threshold.minValue,
      });
    }
    if (threshold.maxValue !== null && value > threshold.maxValue) {
      triggers.push({
        parcelaId,
        alertType: threshold.thresholdType,
        detectedValue: value,
        thresholdValue: threshold.maxValue,
      });
    }
  }

  return triggers;
}
