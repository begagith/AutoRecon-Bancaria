import { Transaction, TransactionSource, MatchStatus } from '../types';

// Helper to create ID
const uid = () => Math.random().toString(36).substring(2, 9);

// Scenario: 
// Company Book Balance Start: $10,000
// Bank Balance Start: $10,000
// Transactions occur during October 2023.

export const MOCK_LEDGER: Transaction[] = [
  { id: uid(), date: '2023-10-01', description: 'Saldo Inicial', reference: 'INIT', amount: 0, type: 'DEBIT', source: TransactionSource.LEDGER, status: MatchStatus.MATCHED },
  { id: uid(), date: '2023-10-02', description: 'Pago Proveedor ABC', reference: 'CHK-1001', amount: 1500.00, type: 'CREDIT', source: TransactionSource.LEDGER, status: MatchStatus.UNMATCHED },
  { id: uid(), date: '2023-10-05', description: 'Cobro Factura 500', reference: 'DEP-998', amount: 5000.00, type: 'DEBIT', source: TransactionSource.LEDGER, status: MatchStatus.UNMATCHED },
  { id: uid(), date: '2023-10-10', description: 'Pago Alquiler', reference: 'TRF-202', amount: 2000.00, type: 'CREDIT', source: TransactionSource.LEDGER, status: MatchStatus.UNMATCHED },
  { id: uid(), date: '2023-10-12', description: 'Cobro Cliente XYZ', reference: 'DEP-1002', amount: 1200.00, type: 'DEBIT', source: TransactionSource.LEDGER, status: MatchStatus.UNMATCHED }, // Ledger Error: Recorded as 1200, Bank shows 1250
  { id: uid(), date: '2023-10-25', description: 'Pago Servicios', reference: 'CHK-1003', amount: 300.00, type: 'CREDIT', source: TransactionSource.LEDGER, status: MatchStatus.UNMATCHED }, // Outstanding check
];

export const MOCK_BANK: Transaction[] = [
  { id: uid(), date: '2023-10-01', description: 'SALDO ANTERIOR', reference: 'INIT', amount: 0, type: 'CREDIT', source: TransactionSource.BANK, status: MatchStatus.MATCHED },
  { id: uid(), date: '2023-10-03', description: 'CHEQUE PAGADO CAMARA', reference: 'CHK-1001', amount: 1500.00, type: 'DEBIT', source: TransactionSource.BANK, status: MatchStatus.UNMATCHED },
  { id: uid(), date: '2023-10-05', description: 'DEPOSITO EFECTIVO', reference: 'DEP-998', amount: 5000.00, type: 'CREDIT', source: TransactionSource.BANK, status: MatchStatus.UNMATCHED },
  { id: uid(), date: '2023-10-10', description: 'TRANSFERENCIA ENVIADA', reference: 'TRF-202', amount: 2000.00, type: 'DEBIT', source: TransactionSource.BANK, status: MatchStatus.UNMATCHED },
  { id: uid(), date: '2023-10-12', description: 'DEPOSITO CHEQUE', reference: 'DEP-1002', amount: 1250.00, type: 'CREDIT', source: TransactionSource.BANK, status: MatchStatus.UNMATCHED }, // Correct amount
  { id: uid(), date: '2023-10-30', description: 'COMISION MANTENIMIENTO', reference: 'COM-OCT', amount: 50.00, type: 'DEBIT', source: TransactionSource.BANK, status: MatchStatus.UNMATCHED }, // Not in books (Bank Fee)
  { id: uid(), date: '2023-10-31', description: 'INTERESES GANADOS', reference: 'INT-OCT', amount: 15.00, type: 'CREDIT', source: TransactionSource.BANK, status: MatchStatus.UNMATCHED }, // Not in books (Interest)
];