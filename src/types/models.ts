// types/models.ts — Tipos del modelo de datos

export interface Tenant {
  id: string;
  name: string;
  plan: 'free' | 'basic' | 'premium';
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  role: 'admin' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
}

export interface Parcela {
  id: string;
  tenantId: string;
  name: string;
  latitude: number;
  longitude: number;
  areaHectares: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CultivoStatus = 'active' | 'harvested' | 'lost';

export interface Cultivo {
  id: string;
  tenantId: string;
  parcelaId: string;
  name: string | null;
  species: string;
  variety: string | null;
  plantingDate: Date;
  estimatedHarvestDate: Date | null;
  status: CultivoStatus;
  statusChangedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClimateData {
  id: string;
  tenantId: string;
  parcelaId: string;
  temperatureCelsius: number | null;
  relativeHumidityPercent: number | null;
  windSpeedKmh: number | null;
  precipitationProbabilityPercent: number | null;
  forecast72h: object | null;
  fetchedAt: Date;
  createdAt: Date;
}

export interface SoilData {
  id: string;
  tenantId: string;
  parcelaId: string;
  measurementDate: Date;
  ph: number;
  humidityPercent: number;
  nitrogenLevel: number | null;
  phosphorusLevel: number | null;
  potassiumLevel: number | null;
  createdAt: Date;
}

export type AlertType = 'temp_min' | 'temp_max' | 'soil_humidity_min' | 'precipitation_high';
export type AlertStatus = 'pending' | 'read';

export interface Alert {
  id: string;
  tenantId: string;
  parcelaId: string;
  alertType: AlertType;
  detectedValue: number;
  thresholdValue: number;
  status: AlertStatus;
  groupedCount: number;
  firstTriggeredAt: Date;
  lastTriggeredAt: Date;
  readAt: Date | null;
  createdAt: Date;
}

export interface AlertThreshold {
  id: string;
  tenantId: string;
  parcelaId: string | null;
  thresholdType: AlertType;
  minValue: number | null;
  maxValue: number | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CropParameters {
  id: string;
  species: string;
  variety: string | null;
  tempMinGerminacion: number;
  tempMaxGerminacion: number;
  tempOptimaMin: number | null;
  tempOptimaMax: number | null;
  diasACosecha: number;
  hemisferioSurMesesSiembra: number[];
  hemisferioNorteMesesSiembra: number[];
  ventanaPodaMeses: number[] | null;
  calendarioFertilizacion: { dap: number; tipo: string }[] | null;
  humedadSueloOptimaMin: number | null;
  humedadSueloOptimaMax: number | null;
  notes: string | null;
}

export type RecommendationType = 'siembra' | 'cosecha';

export interface RecommendationPayload {
  windowStart: string;
  windowEnd: string;
  estimatedHarvestDate?: string;
  reasoning: string;
  climateSnapshot: {
    temperature: number;
    humidity: number;
    precipitationProb: number;
  };
}

export interface Recommendation {
  id: string;
  tenantId: string;
  parcelaId: string;
  cultivoId: string | null;
  recommendationType: RecommendationType;
  payload: RecommendationPayload;
  climateDataFetchedAt: Date;
  isStale: boolean;
  generatedAt: Date;
  expiresAt: Date;
}

export type ReminderTaskType = 'riego' | 'poda' | 'fertilizacion';
export type ReminderStatus = 'pending' | 'upcoming' | 'completed';

export interface Reminder {
  id: string;
  tenantId: string;
  parcelaId: string;
  cultivoId: string | null;
  taskType: ReminderTaskType;
  scheduledAt: Date;
  status: ReminderStatus;
  source: 'auto' | 'manual';
  reasoning: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
