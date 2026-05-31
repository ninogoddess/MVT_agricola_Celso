import { logExternalCall } from './usage-logger';

/**
 * Respuesta normalizada de la API climática.
 */
export interface ClimateApiResponse {
  temperature: number;       // °C
  humidity: number;          // %
  windSpeed: number;         // km/h
  precipitationProb: number; // %
  forecast72h: object;
  source: 'open-meteo' | 'openweathermap';
}

const PROVIDER = process.env.CLIMATE_API_PROVIDER ?? 'open-meteo';

/**
 * Provider primario: Open-Meteo (gratis, sin API key).
 * ~10,000 calls/día.
 */
async function fetchOpenMeteo(lat: number, lon: number): Promise<ClimateApiResponse | null> {
  const start = Date.now();
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lon));
    url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability');
    url.searchParams.set('hourly', 'temperature_2m,relative_humidity_2m,precipitation_probability');
    url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_probability_max');
    url.searchParams.set('forecast_days', '3');
    url.searchParams.set('timezone', 'auto');

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    logExternalCall('open-meteo', res.ok, Date.now() - start);

    if (!res.ok) return null;
    const data = await res.json();

    return {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      precipitationProb: data.current.precipitation_probability ?? 0,
      forecast72h: { hourly: data.hourly, daily: data.daily },
      source: 'open-meteo',
    };
  } catch {
    logExternalCall('open-meteo', false, Date.now() - start);
    return null;
  }
}

/**
 * Fallback: OpenWeatherMap free tier (requiere OPENWEATHER_API_KEY).
 * 60 calls/min, 1M calls/mes.
 */
async function fetchOpenWeatherMap(lat: number, lon: number): Promise<ClimateApiResponse | null> {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return null;

  const start = Date.now();
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${key}`,
      { signal: AbortSignal.timeout(10000) }
    );
    logExternalCall('openweathermap', res.ok, Date.now() - start);

    if (!res.ok) return null;
    const data = await res.json();

    return {
      temperature: data.list[0].main.temp,
      humidity: data.list[0].main.humidity,
      windSpeed: data.list[0].wind.speed * 3.6, // m/s → km/h
      precipitationProb: (data.list[0].pop ?? 0) * 100,
      forecast72h: { list: data.list.slice(0, 24) }, // 3h x 24 = 72h
      source: 'openweathermap',
    };
  } catch {
    logExternalCall('openweathermap', false, Date.now() - start);
    return null;
  }
}

/**
 * Obtiene datos climáticos para una coordenada.
 * Intenta Open-Meteo primero, luego OpenWeatherMap como fallback.
 * Retorna null si ambos fallan.
 */
export async function fetchClimateData(
  latitude: number,
  longitude: number
): Promise<ClimateApiResponse | null> {
  if (PROVIDER === 'open-meteo') {
    const primary = await fetchOpenMeteo(latitude, longitude);
    return primary ?? (await fetchOpenWeatherMap(latitude, longitude));
  }
  return fetchOpenWeatherMap(latitude, longitude);
}
