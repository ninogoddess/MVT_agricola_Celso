import { NextResponse } from 'next/server';

/**
 * GET /api/business/indicators
 *
 * Indicadores económicos de mercado relevantes para agrofinanzas en Chile,
 * obtenidos de mindicador.cl (API pública y gratuita, sin API key).
 * Se cachean 1 hora para no consultar en cada visita.
 */
export const revalidate = 3600;

interface MindicadorValue {
  nombre: string;
  unidad_medida: string;
  fecha: string;
  valor: number;
}

const SELECTED: Array<{ key: string; label: string; help: string }> = [
  { key: 'dolar', label: 'Dólar', help: 'Muchos insumos (fertilizantes, maquinaria) y la exportación de fruta se cotizan en dólares.' },
  { key: 'euro', label: 'Euro', help: 'Referencia para exportaciones al mercado europeo.' },
  { key: 'uf', label: 'UF', help: 'Unidad de Fomento: se usa en créditos y arriendos de tierra indexados.' },
  { key: 'utm', label: 'UTM', help: 'Unidad Tributaria Mensual: trámites, multas e impuestos.' },
  { key: 'ipc', label: 'IPC (mensual)', help: 'Inflación del mes: cuánto suben los precios, incluidos tus insumos.' },
  { key: 'tpm', label: 'Tasa de política (TPM)', help: 'Tasa de referencia del Banco Central: influye en el costo de los créditos.' },
];

export async function GET() {
  try {
    const res = await fetch('https://mindicador.cl/api', { next: { revalidate: 3600 } });
    if (!res.ok) {
      return NextResponse.json({ available: false }, { status: 200 });
    }
    const data = await res.json();

    const indicators = SELECTED.map(({ key, label, help }) => {
      const item = data[key] as MindicadorValue | undefined;
      if (!item) return null;
      return {
        key,
        label,
        help,
        value: item.valor,
        unit: item.unidad_medida, // "Pesos" o "Porcentaje"
        fecha: item.fecha,
      };
    }).filter(Boolean);

    return NextResponse.json({ available: true, indicators, fecha: data.fecha ?? null });
  } catch {
    return NextResponse.json({ available: false }, { status: 200 });
  }
}
