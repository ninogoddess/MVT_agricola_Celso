import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ShieldAlert, Users, Calendar } from 'lucide-react';

export default async function AdminSubscriptionsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select(`
      id,
      status,
      start_date,
      next_billing_date,
      mp_preapproval_id,
      tenant:tenants(id, name),
      plan:plans(id, name, price_clp)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando suscripciones admin:', error);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <ShieldAlert className="text-purple-600" size={32} />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-500">Gestión de suscripciones y pagos automáticos</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                <th className="p-4">Organización</th>
                <th className="p-4">Plan Actual</th>
                <th className="p-4">Estado</th>
                <th className="p-4">ID Mercado Pago</th>
                <th className="p-4">Próximo Cobro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {subscriptions?.map((sub: any) => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-gray-400" />
                      {sub.tenant?.name || 'Desconocido'}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-gray-700">{sub.plan?.name}</span>
                    <span className="block text-xs text-gray-500">${sub.plan?.price_clp} CLP</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      sub.status === 'active' ? 'bg-green-100 text-green-700' : 
                      sub.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {sub.status === 'active' ? 'Activa' : sub.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-xs text-gray-500">
                    {sub.mp_preapproval_id || 'N/A'}
                  </td>
                  <td className="p-4 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-gray-400" />
                      {sub.next_billing_date ? new Date(sub.next_billing_date).toLocaleDateString('es-CL') : 'No definido'}
                    </div>
                  </td>
                </tr>
              ))}
              {!subscriptions?.length && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No hay suscripciones registradas aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
