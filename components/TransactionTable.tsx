import React from 'react';
import { Transaction, MatchStatus } from '../types';
import { CheckCircleIcon, ExclamationCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';

interface TransactionTableProps {
  title: string;
  transactions: Transaction[];
  onAnalyze?: (t: Transaction) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ title, transactions, onAnalyze }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden flex flex-col h-[500px]">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-semibold text-slate-700">{title}</h3>
        <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
          {transactions.length} items
        </span>
      </div>
      <div className="overflow-y-auto flex-1 p-0">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3 text-center">Estado</th>
              {onAnalyze && <th className="px-4 py-3 text-center">IA</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((t) => (
              <tr key={t.id} className={`hover:bg-slate-50 ${t.status === MatchStatus.MATCHED ? 'opacity-50 bg-slate-50/50' : 'bg-white'}`}>
                <td className="px-4 py-3 whitespace-nowrap text-slate-600">{t.date}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{t.reference}</td>
                <td className="px-4 py-3 font-medium text-slate-800 truncate max-w-[180px]" title={t.description}>
                  {t.description}
                </td>
                <td className={`px-4 py-3 text-right font-mono font-medium ${
                  t.type === 'DEBIT' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {t.type === 'DEBIT' ? '-' : '+'} {formatCurrency(t.amount)}
                </td>
                <td className="px-4 py-3 text-center">
                  {t.status === MatchStatus.MATCHED ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500 inline" />
                  ) : (
                    <ExclamationCircleIcon className="w-5 h-5 text-amber-500 inline" />
                  )}
                </td>
                {onAnalyze && (
                  <td className="px-4 py-3 text-center">
                    {t.status !== MatchStatus.MATCHED && (
                      <button 
                        onClick={() => onAnalyze(t)}
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition-colors"
                        title="Analizar con Gemini"
                      >
                        <MagnifyingGlassIcon className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};