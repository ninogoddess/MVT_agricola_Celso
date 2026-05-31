import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/service-role';
import { RecommendationService } from '@/lib/services/recommendation.service';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseServiceRoleClient();

    // Obtener todos los cultivos activos agrupados por tenant
    const { data: cultivos, error } = await supabase
      .from('cultivos')
      .select('id, tenant_id, parcela_id, species, variety')
      .eq('status', 'active');

    if (error || !cultivos) {
      return NextResponse.json({ error: 'Error fetching cultivos' }, { status: 500 });
    }

    let generated = 0;
    let skipped = 0;

    for (const cultivo of cultivos) {
      try {
        const service = new RecommendationService(supabase, cultivo.tenant_id);
        await service.generate(cultivo.parcela_id, cultivo.id, 'siembra');
        await service.generate(cultivo.parcela_id, cultivo.id, 'cosecha');
        generated += 2;
      } catch {
        // Si no hay crop_parameters, omitir
        skipped++;
      }
    }

    return NextResponse.json({
      message: 'Recommendations refreshed',
      generated,
      skipped,
      totalCultivos: cultivos.length,
    });
  } catch (error) {
    console.error('[CRON:RECOMMENDATIONS] Error:', error);
    return NextResponse.json(
      { error: 'Error refreshing recommendations' },
      { status: 500 }
    );
  }
}
