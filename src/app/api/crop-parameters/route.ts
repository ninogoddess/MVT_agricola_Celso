import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('crop_parameters')
    .select('species, variety, hemisferio_sur_meses_siembra, dias_a_cosecha')
    .order('species', { ascending: true });

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data ?? []);
}
