import type { SupabaseClient } from '@supabase/supabase-js';
import { FieldLogRepository, TransactionRepository } from '@/lib/repositories/business.repository';
import { ParcelaRepository } from '@/lib/repositories/parcela.repository';
import { TenantAccessError } from '@/lib/utils/errors';
import type { CreateFieldLogInput, CreateTransactionInput } from '@/lib/validators/business.schema';

export class BusinessService {
  private logs: FieldLogRepository;
  private tx: TransactionRepository;
  private parcelaRepo: ParcelaRepository;

  constructor(private supabase: SupabaseClient, private tenantId: string) {
    this.logs = new FieldLogRepository(supabase, tenantId);
    this.tx = new TransactionRepository(supabase, tenantId);
    this.parcelaRepo = new ParcelaRepository(supabase, tenantId);
  }

  // ── Bitácora ──
  listLogs(parcelaId?: string) {
    return this.logs.findByTenant(parcelaId);
  }

  async createLog(input: CreateFieldLogInput) {
    const owns = await this.parcelaRepo.verifyOwnership(input.parcelaId);
    if (!owns) throw new TenantAccessError();

    const { data, error } = await this.logs.create({
      parcela_id: input.parcelaId,
      cultivo_id: input.cultivoId ?? null,
      log_date: input.logDate,
      category: input.category,
      title: input.title,
      notes: input.notes ?? null,
    });
    if (error) throw error;
    return data;
  }

  deleteLog(id: string) {
    return this.logs.delete(id);
  }

  // ── Finanzas ──
  listTransactions(parcelaId?: string) {
    return this.tx.findByTenant(parcelaId);
  }

  async createTransaction(input: CreateTransactionInput) {
    const owns = await this.parcelaRepo.verifyOwnership(input.parcelaId);
    if (!owns) throw new TenantAccessError();

    const { data, error } = await this.tx.create({
      parcela_id: input.parcelaId,
      cultivo_id: input.cultivoId ?? null,
      type: input.type,
      category: input.category,
      amount: input.amount,
      description: input.description ?? null,
      transaction_date: input.transactionDate,
    });
    if (error) throw error;
    return data;
  }

  deleteTransaction(id: string) {
    return this.tx.delete(id);
  }

  /**
   * Resumen financiero: totales por cultivo, por parcela y total general.
   */
  async getFinancialSummary() {
    const [{ data: parcelas }, { data: cultivos }, transactions] = await Promise.all([
      this.supabase.from('parcelas').select('id, name').eq('tenant_id', this.tenantId).eq('is_active', true),
      this.supabase.from('cultivos').select('id, name, species, parcela_id').eq('tenant_id', this.tenantId),
      this.tx.findByTenant(),
    ]);

    type Totals = { income: number; expense: number; balance: number };
    const empty = (): Totals => ({ income: 0, expense: 0, balance: 0 });
    const add = (t: Totals, type: string, amount: number) => {
      if (type === 'income') t.income += amount;
      else t.expense += amount;
      t.balance = t.income - t.expense;
    };

    const cultivoName = (c: { name: string | null; species: string }) => c.name || c.species;

    const parcelaTotals = new Map<string, Totals>();
    const cultivoTotals = new Map<string, Totals>();
    const general = empty();

    for (const t of transactions) {
      const amount = Number(t.amount);
      add(general, t.type, amount);

      if (t.parcela_id) {
        if (!parcelaTotals.has(t.parcela_id)) parcelaTotals.set(t.parcela_id, empty());
        add(parcelaTotals.get(t.parcela_id)!, t.type, amount);
      }
      if (t.cultivo_id) {
        if (!cultivoTotals.has(t.cultivo_id)) cultivoTotals.set(t.cultivo_id, empty());
        add(cultivoTotals.get(t.cultivo_id)!, t.type, amount);
      }
    }

    const byParcela = (parcelas ?? []).map((p) => ({
      parcelaId: p.id,
      parcelaName: p.name,
      totals: parcelaTotals.get(p.id) ?? empty(),
      cultivos: (cultivos ?? [])
        .filter((c) => c.parcela_id === p.id)
        .map((c) => ({
          cultivoId: c.id,
          cultivoName: cultivoName(c),
          totals: cultivoTotals.get(c.id) ?? empty(),
        })),
    }));

    return { general, byParcela };
  }
}
