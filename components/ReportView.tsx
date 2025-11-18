import React from 'react';
import { ReconciliationSummary, Transaction, TransactionSource, MatchStatus } from '../types';
import { PrinterIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';

interface ReportViewProps {
  summary: ReconciliationSummary;
  unmatchedLedger: Transaction[];
  unmatchedBank: Transaction[];
  onReset: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ summary, unmatchedLedger, unmatchedBank, onReset }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Informe de Conciliación Bancaria</h2>
          <p className="text-slate-500">Generado automáticamente el {new Date().toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
          >
            <PrinterIcon className="w-5 h-5" />
            Imprimir PDF
          </button>
          <button 
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 font-medium transition-colors"
          >
            <ArchiveBoxIcon className="w-5 h-5" />
            Archivar y Cerrar
          </button>
        </div>
      </div>

      {/* Main Summary Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-700">Resumen de Saldos</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Ledger Side */}
          <div className="space-y-4">
            <h4 className="text-sm uppercase tracking-wide text-slate-500 font-bold border-b pb-2">Libros de la Empresa</h4>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Saldo Final en Libros</span>
              <span className="font-mono font-bold text-lg text-slate-800">{formatCurrency(summary.ledgerEndBalance)}</span>
            </div>
            <div className="space-y-2 pl-4 border-l-2 border-slate-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">(-) Cargos Bancarios no reg.</span>
                <span className="font-mono text-red-600">{formatCurrency(unmatchedBank.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0))}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">(+) Abonos Bancarios no reg.</span>
                <span className="font-mono text-green-600">{formatCurrency(unmatchedBank.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0))}</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <span className="text-slate-800 font-semibold">Saldo Ajustado Empresa</span>
              <span className="font-mono font-bold text-xl text-blue-700">{formatCurrency(summary.adjustedLedgerBalance)}</span>
            </div>
          </div>

          {/* Bank Side */}
          <div className="space-y-4">
            <h4 className="text-sm uppercase tracking-wide text-slate-500 font-bold border-b pb-2">Extracto Bancario</h4>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Saldo Final Banco</span>
              <span className="font-mono font-bold text-lg text-slate-800">{formatCurrency(summary.bankEndBalance)}</span>
            </div>
            <div className="space-y-2 pl-4 border-l-2 border-slate-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">(+) Depósitos en Tránsito</span>
                <span className="font-mono text-green-600">{formatCurrency(unmatchedLedger.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0))}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">(-) Cheques en Circulación</span>
                <span className="font-mono text-red-600">{formatCurrency(unmatchedLedger.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0))}</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <span className="text-slate-800 font-semibold">Saldo Ajustado Banco</span>
              <span className="font-mono font-bold text-xl text-blue-700">{formatCurrency(summary.adjustedBankBalance)}</span>
            </div>
          </div>
        </div>
        
        <div className={`p-4 text-center border-t font-medium ${summary.adjustedBankBalance === summary.adjustedLedgerBalance ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {summary.adjustedBankBalance === summary.adjustedLedgerBalance 
            ? "✓ CONCILIACIÓN CUADRADA EXITOSAMENTE" 
            : "⚠ DIFERENCIA DETECTADA - REVISAR PARTIDAS PENDIENTES"}
        </div>
      </div>

      {/* Suggestion Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-700 mb-4">Asientos de Ajuste Sugeridos</h3>
        <p className="text-sm text-slate-500 mb-4">Basado en las partidas del banco no registradas en libros.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
             <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Cuenta Debe</th>
                  <th className="px-4 py-2">Cuenta Haber</th>
                  <th className="px-4 py-2">Concepto</th>
                  <th className="px-4 py-2 text-right">Monto</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {unmatchedBank.map(t => (
                  <tr key={t.id}>
                    <td className="px-4 py-2">{t.date}</td>
                    <td className="px-4 py-2 font-medium">{t.type === 'DEBIT' ? 'Gastos Bancarios / Otros' : 'Banco X'}</td>
                    <td className="px-4 py-2 font-medium">{t.type === 'DEBIT' ? 'Banco X' : 'Ingresos Financieros / Otros'}</td>
                    <td className="px-4 py-2">{t.description}</td>
                    <td className="px-4 py-2 text-right font-mono">{formatCurrency(t.amount)}</td>
                  </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};