import type { SupabaseClient } from '@supabase/supabase-js';
import { TenantAccessError } from '@/lib/utils/errors';

/**
 * Repositorio base con scope de tenant.
 * Doble capa de aislamiento:
 *   1. Aplicación: .eq('tenant_id', this.tenantId)
 *   2. Base de datos: políticas RLS sobre auth.tenant_id()
 */
export abstract class TenantScopedRepository {
  constructor(
    protected supabase: SupabaseClient,
    protected tenantId: string,
    protected tableName: string
  ) {
    if (!tenantId) {
      throw new TenantAccessError();
    }
  }

  /** Query con filtro de tenant aplicado */
  protected scoped() {
    return this.supabase.from(this.tableName).select().eq('tenant_id', this.tenantId);
  }

  /** Insertar con tenant_id incluido automáticamente */
  protected scopedInsert(data: Record<string, unknown>) {
    return this.supabase
      .from(this.tableName)
      .insert({ ...data, tenant_id: this.tenantId })
      .select()
      .single();
  }

  /** Update SIN incluir tenant_id en el payload (inmutabilidad) */
  protected scopedUpdate(id: string, data: Record<string, unknown>) {
    // Eliminar tenant_id del payload por seguridad
    const { tenant_id: _, ...safeData } = data as Record<string, unknown> & { tenant_id?: unknown };
    return this.supabase
      .from(this.tableName)
      .update(safeData)
      .eq('id', id)
      .eq('tenant_id', this.tenantId)
      .select()
      .single();
  }

  /** Verificar que un recurso pertenece al tenant */
  async verifyOwnership(resourceId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from(this.tableName)
      .select('id')
      .eq('id', resourceId)
      .eq('tenant_id', this.tenantId)
      .maybeSingle();
    return data !== null;
  }
}
