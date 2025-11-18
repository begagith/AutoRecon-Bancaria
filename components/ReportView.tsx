import React from 'react';
import { ReconciliationSummary, Transaction, TransactionSource, MatchStatus } from '../types';
import { PrinterIcon, ArchiveBoxIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

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

  const isBalanced = Math.abs(summary.adjustedBankBalance - summary.adjustedLedgerBalance) < 0.01;

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      <div className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Informe de Conciliación Bancaria</h2>
          <p className="text-slate-500 mt-1">Generado automáticamente el {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors shadow-sm"
          >
            <PrinterIcon className="w-5 h-5" />
            Imprimir PDF
          </button>
          <button 
            onClick={onReset}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 rounded-lg text-white hover:bg-slate-900 font-medium transition-colors shadow-lg"
          >
            <ArchiveBoxIcon className="w-5 h-5" />
            Archivar
          </button>
        </div>
      </div>

      {/* Main Summary Card */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Left: Company Books */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-1 bg-blue-500 rounded-full"></div>
              <h4 className="text-lg font-bold text-slate-800">Libros de la Empresa</h4>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-600 font-medium">Saldo Según Libros</span>
              <span className="font-mono font-bold text-lg text-slate-800">{formatCurrency(summary.ledgerEndBalance)}</span>
            </div>

            <div className="space-y-3 pl-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Partidas de Conciliación</div>
              {/* Bank Credits (Deposits/Interests not in books) ADD to Books */}
              <div className="flex justify-between items-center text-sm group">
                <span className="text-slate-600 group-hover:text-green-700 transition-colors">(+) Notas de Crédito Bancarias</span>
                <span className="font-mono text-green-600 font-medium">
                  {formatCurrency(unmatchedBank.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0))}
                </span>
              </div>
              {/* Bank Debits (Fees/NSF not in books) SUBTRACT from Books */}
              <div className="flex justify-between items-center text-sm group">
                <span className="text-slate-600 group-hover:text-red-700 transition-colors">(-) Notas de Débito Bancarias</span>
                <span className="font-mono text-red-600 font-medium">
                  {formatCurrency(unmatchedBank.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0))}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-slate-200">
              <span className="text-slate-800 font-bold text-lg">Saldo Ajustado Empresa</span>
              <span className="font-mono font-bold text-2xl text-blue-700">{formatCurrency(summary.adjustedLedgerBalance)}</span>
            </div>
          </div>

          {/* Right: Bank Statement */}
          <div className="space-y-6 relative">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-100 -ml-6 hidden md:block"></div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-1 bg-indigo-500 rounded-full"></div>
              <h4 className="text-lg font-bold text-slate-800">Extracto Bancario</h4>
            </div>

            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-600 font-medium">Saldo Según Banco</span>
              <span className="font-mono font-bold text-lg text-slate-800">{formatCurrency(summary.bankEndBalance)}</span>
            </div>

            <div className="space-y-3 pl-2">
               <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Partidas de Conciliación</div>
              {/* Ledger Debits (Deposits) not in Bank ADD to Bank */}
              <div className="flex justify-between items-center text-sm group">
                <span className="text-slate-600 group-hover:text-green-700 transition-colors">(+) Depósitos en Tránsito</span>
                <span className="font-mono text-green-600 font-medium">
                  {formatCurrency(unmatchedLedger.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0))}
                </span>
              </div>
              {/* Ledger Credits (Checks) not in Bank SUBTRACT from Bank */}
              <div className="flex justify-between items-center text-sm group">
                <span className="text-slate-600 group-hover:text-red-700 transition-colors">(-) Cheques en Circulación</span>
                <span className="font-mono text-red-600 font-medium">
                  {formatCurrency(unmatchedLedger.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0))}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-slate-200">
              <span className="text-slate-800 font-bold text-lg">Saldo Ajustado Banco</span>
              <span className="font-mono font-bold text-2xl text-indigo-700">{formatCurrency(summary.adjustedBankBalance)}</span>
            </div>
          </div>
        </div>
        
        <div className={`p-4 text-center border-t flex items-center justify-center gap-3 ${isBalanced ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {isBalanced ? (
            <>
              <CheckBadgeIcon className="w-6 h-6" />
              <span className="font-bold">LA CONCILIACIÓN ESTÁ CUADRADA</span>
            </>
          ) : (
            <span className="font-bold">EXISTE UNA DIFERENCIA DE {formatCurrency(Math.abs(summary.adjustedBankBalance - summary.adjustedLedgerBalance))}</span>
          )}
        </div>
      </div>

      {/* Suggestion Table */}
      {unmatchedBank.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Propuesta de Asientos Contables de Ajuste</h3>
          <p className="text-slate-500 mb-6">Estas transacciones aparecen en el banco pero no en la contabilidad. Se requiere registrarlas para igualar saldos.</p>
          
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm text-left">
               <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-6 py-3">Fecha</th>
                    <th className="px-6 py-3">Causa Probable</th>
                    <th className="px-6 py-3">Cuenta Debe (Cargo)</th>
                    <th className="px-6 py-3">Cuenta Haber (Abono)</th>
                    <th className="px-6 py-3 text-right">Monto</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {unmatchedBank.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-600">{t.date}</td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-800">{t.description}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {t.type === 'DEBIT' ? 'Gastos Bancarios / Otros' : 'Banco Moneda Nacional'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {t.type === 'DEBIT' ? 'Banco Moneda Nacional' : 'Ingresos Financieros / Varios'}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">{formatCurrency(t.amount)}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};