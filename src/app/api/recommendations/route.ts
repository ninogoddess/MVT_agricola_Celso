import { NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';

/**
 * GET /api/recommendations
 * Retorna recomendaciones globales de riego y cultivo basadas en:
 * - El clima más reciente de todas las parcelas del tenant
 * - Los cultivos activos
 * - La temporada actual (hemisferio sur)
 */
export async function GET() {
  return withTenantContext(async (ctx) => {
    const { supabase, tenantId } = ctx;

    // Obtener parcelas activas con último clima
    const { data: parcelas } = await supabase
      .from('parcelas')
      .select('id, name, latitude, longitude')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (!parcelas?.length) {
      return NextResponse.json({ recommendations: [], summary: null });
    }

    // Obtener último clima de cada parcela
    const climatePromises = parcelas.map(async (p) => {
      const { data } = await supabase
        .from('climate_data')
        .select('temperature_celsius, relative_humidity_percent, precipitation_probability_percent, wind_speed_kmh, forecast_72h, fetched_at')
        .eq('parcela_id', p.id)
        .eq('tenant_id', tenantId)
        .order('fetched_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return { parcela: p, climate: data };
    });

    const climateResults = await Promise.all(climatePromises);

    // Obtener cultivos activos
    const { data: cultivos } = await supabase
      .from('cultivos')
      .select('id, species, variety, planting_date, parcela_id')
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    // Obtener último suelo de cada parcela
    const soilPromises = parcelas.map(async (p) => {
      const { data } = await supabase
        .from('soil_data')
        .select('humidity_percent, ph, nitrogen_level, measurement_date')
        .eq('parcela_id', p.id)
        .eq('tenant_id', tenantId)
        .order('measurement_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      return { parcelaId: p.id, soil: data };
    });

    const soilResults = await Promise.all(soilPromises);
    const soilMap = Object.fromEntries(soilResults.map((s) => [s.parcelaId, s.soil]));

    // Generar recomendaciones para cada parcela
    const recommendations = [];

    for (const { parcela, climate } of climateResults) {
      if (!climate) continue;

      const temp = Number(climate.temperature_celsius);
      const humidity = Number(climate.relative_humidity_percent);
      const precipProb = Number(climate.precipitation_probability_percent);
      const wind = Number(climate.wind_speed_kmh);
      const soil = soilMap[parcela.id];
      const soilHumidity = soil ? Number(soil.humidity_percent) : null;

      const parcelaCultivos = (cultivos ?? []).filter((c) => c.parcela_id === parcela.id);
      const isSouthernHemisphere = Number(parcela.latitude) < 0;
      const month = new Date().getMonth() + 1; // 1-12

      // ── RIEGO ──────────────────────────────────────────────────────
      if (precipProb < 40 && (soilHumidity === null || soilHumidity < 50)) {
        const urgency = soilHumidity !== null && soilHumidity < 30 ? 'alta' : 'media';
        recommendations.push({
          id: `riego-${parcela.id}`,
          parcelaId: parcela.id,
          parcelaName: parcela.name,
          type: 'riego',
          priority: urgency === 'alta' ? 'high' : 'medium',
          title: 'Momento oportuno para regar',
          description: urgency === 'alta'
            ? `La humedad del suelo está baja (${soilHumidity?.toFixed(0) ?? 'desconocida'}%) y la probabilidad de lluvia es ${precipProb}%. Se recomienda regar lo antes posible.`
            : `Probabilidad de lluvia baja (${precipProb}%). Considera regar en las próximas 24–48 horas.`,
          climate: { temp, humidity, precipProb, wind },
          icon: 'droplets',
        });
      }

      // ── HELADAS ─────────────────────────────────────────────────────
      if (temp < 4) {
        recommendations.push({
          id: `helada-${parcela.id}`,
          parcelaId: parcela.id,
          parcelaName: parcela.name,
          type: 'alerta',
          priority: 'high',
          title: 'Riesgo de helada',
          description: `Temperatura actual de ${temp}°C. Protege cultivos sensibles al frío, especialmente plántulas y cultivos de hoja.`,
          climate: { temp, humidity, precipProb, wind },
          icon: 'thermometer',
        });
      }

      // ── CALOR EXTREMO ───────────────────────────────────────────────
      if (temp > 32) {
        recommendations.push({
          id: `calor-${parcela.id}`,
          parcelaId: parcela.id,
          parcelaName: parcela.name,
          type: 'alerta',
          priority: temp > 38 ? 'high' : 'medium',
          title: 'Calor elevado: hidratación urgente',
          description: `Con ${temp}°C, aumenta la transpiración. Riega en la mañana temprano o al atardecer. Evita riego en horario de sol directo.`,
          climate: { temp, humidity, precipProb, wind },
          icon: 'sun',
        });
      }

      // ── LLUVIA PRÓXIMA ──────────────────────────────────────────────
      if (precipProb >= 70) {
        recommendations.push({
          id: `lluvia-${parcela.id}`,
          parcelaId: parcela.id,
          parcelaName: parcela.name,
          type: 'info',
          priority: 'low',
          title: 'Lluvia probable: posterga el riego',
          description: `${precipProb}% de probabilidad de precipitación. No es necesario regar hoy. Aprovecha para revisar drenaje.`,
          climate: { temp, humidity, precipProb, wind },
          icon: 'cloud-rain',
        });
      }

      // ── VIENTO FUERTE ───────────────────────────────────────────────
      if (wind > 45) {
        recommendations.push({
          id: `viento-${parcela.id}`,
          parcelaId: parcela.id,
          parcelaName: parcela.name,
          type: 'alerta',
          priority: 'medium',
          title: 'Viento fuerte: evita aplicaciones',
          description: `Viento de ${wind} km/h. No apliques pesticidas ni fertilizantes foliares. Revisa tutores y coberturas.`,
          climate: { temp, humidity, precipProb, wind },
          icon: 'wind',
        });
      }

      // ── TEMPORADA DE SIEMBRA ────────────────────────────────────────
      // Hemisferio sur: primavera = sep-nov, otoño = mar-may
      const isSpring = isSouthernHemisphere && [9, 10, 11].includes(month);
      const isAutumn = isSouthernHemisphere && [3, 4, 5].includes(month);

      if (isSpring && temp >= 10 && temp <= 28) {
        recommendations.push({
          id: `siembra-primavera-${parcela.id}`,
          parcelaId: parcela.id,
          parcelaName: parcela.name,
          type: 'siembra',
          priority: 'medium',
          title: 'Temporada de siembra de primavera',
          description: `Las condiciones son óptimas para sembrar cultivos de primavera-verano: tomate, pimiento, zapallo, choclo, frijol. Temperatura: ${temp}°C.`,
          climate: { temp, humidity, precipProb, wind },
          icon: 'sprout',
          suggestedCrops: ['tomate', 'pimiento', 'zapallo', 'choclo', 'poroto'],
        });
      }

      if (isAutumn && temp >= 8 && temp <= 20) {
        recommendations.push({
          id: `siembra-otono-${parcela.id}`,
          parcelaId: parcela.id,
          parcelaName: parcela.name,
          type: 'siembra',
          priority: 'medium',
          title: 'Temporada de cultivos de otoño-invierno',
          description: `Buen momento para sembrar cultivos resistentes al frío: ajo, cebolla, lechuga, espinaca, zanahoria. Temperatura: ${temp}°C.`,
          climate: { temp, humidity, precipProb, wind },
          icon: 'wheat',
          suggestedCrops: ['ajo', 'cebolla', 'lechuga', 'espinaca', 'zanahoria', 'acelga'],
        });
      }

      // ── FERTILIZACIÓN ───────────────────────────────────────────────
      if (soil && soil.nitrogen_level !== null && Number(soil.nitrogen_level) < 15) {
        recommendations.push({
          id: `fertilizacion-${parcela.id}`,
          parcelaId: parcela.id,
          parcelaName: parcela.name,
          type: 'fertilizacion',
          priority: 'medium',
          title: 'Nivel de nitrógeno bajo',
          description: `El último análisis de suelo muestra nitrógeno en ${Number(soil.nitrogen_level).toFixed(1)} mg/kg. Considera aplicar fertilizante nitrogenado en los próximos días.`,
          climate: { temp, humidity, precipProb, wind },
          icon: 'flask',
          soilData: { nitrogen: soil.nitrogen_level },
        });
      }

      // ── CULTIVOS PRÓXIMOS A COSECHA ─────────────────────────────────
      for (const cultivo of parcelaCultivos) {
        const { data: cropParams } = await supabase
          .from('crop_parameters')
          .select('dias_a_cosecha')
          .eq('species', cultivo.species.toLowerCase())
          .limit(1)
          .maybeSingle();

        if (!cropParams) continue;

        const plantingDate = new Date(cultivo.planting_date);
        const harvestDate = new Date(plantingDate);
        harvestDate.setDate(harvestDate.getDate() + cropParams.dias_a_cosecha);
        const daysToHarvest = Math.ceil((harvestDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        if (daysToHarvest >= 0 && daysToHarvest <= 21) {
          recommendations.push({
            id: `cosecha-${cultivo.id}`,
            parcelaId: parcela.id,
            parcelaName: parcela.name,
            type: 'cosecha',
            priority: daysToHarvest <= 7 ? 'high' : 'medium',
            title: `Cosecha próxima: ${cultivo.species}`,
            description: `Tu ${cultivo.species}${cultivo.variety ? ` (${cultivo.variety})` : ''} está a ${daysToHarvest} días de la cosecha estimada (${harvestDate.toLocaleDateString('es-CL')}). Prepara los equipos y revisa el punto de madurez.`,
            climate: { temp, humidity, precipProb, wind },
            icon: 'wheat',
            daysToHarvest,
          });
        }
      }
    }

    // Ordenar: high > medium > low
    const order = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => order[a.priority as keyof typeof order] - order[b.priority as keyof typeof order]);

    // Resumen general
    const avgTemp = climateResults
      .filter((r) => r.climate)
      .reduce((s, r) => s + Number(r.climate!.temperature_celsius), 0) / (climateResults.filter((r) => r.climate).length || 1);

    return NextResponse.json({
      recommendations,
      summary: {
        totalParcelas: parcelas.length,
        parcelasWithClimate: climateResults.filter((r) => r.climate).length,
        avgTemperature: Math.round(avgTemp * 10) / 10,
        highPriority: recommendations.filter((r) => r.priority === 'high').length,
      },
    });
  });
}
