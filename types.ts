export enum TransactionSource {
  LEDGER = 'MAYOR_CONTABLE',
  BANK = 'EXTRACTO_BANCARIO'
}

export enum MatchStatus {
  UNMATCHED = 'PENDIENTE',
  MATCHED = 'CONCILIADO',
  SUGGESTED = 'SUGERIDO'
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  reference: string;
  amount: number; // Absolute value
  type: 'DEBIT' | 'CREDIT'; // DEBIT (Debe/Cargo), CREDIT (Haber/Abono)
  source: TransactionSource;
  status: MatchStatus;
  matchedWithId?: string;
  notes?: string;
}

export interface ReconciliationSummary {
  ledgerStartBalance: number;
  bankStartBalance: number;
  ledgerEndBalance: number;
  bankEndBalance: number;
  unmatchedLedgerTotal: number;
  unmatchedBankTotal: number;
  adjustedLedgerBalance: number;
  adjustedBankBalance: number;
}

export interface AdjustmentEntry {
  id: string;
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
}