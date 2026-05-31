import { NextResponse, type NextRequest } from 'next/server';
import { updateClimateForAllParcelas } from '@/lib/services/climate.service';

export async function GET(request: NextRequest) {
  // Validar CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await updateClimateForAllParcelas();
    return NextResponse.json({
      message: 'Climate data updated',
      ...result,
    });
  } catch (error) {
    console.error('[CRON:CLIMATE] Error:', error);
    return NextResponse.json(
      { error: 'Error updating climate data' },
      { status: 500 }
    );
  }
}
