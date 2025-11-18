import React from 'react';
import { Transaction, MatchStatus } from '../types';
import { CheckCircleIcon, ExclamationCircleIcon, MagnifyingGlassIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          {title}
        </h3>
        <div className="flex gap-2">
          <span className="text-xs font-medium bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">
            {transactions.filter(t => t.status === MatchStatus.MATCHED).length} Conciliados
          </span>
          <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full">
            {transactions.filter(t => t.status !== MatchStatus.MATCHED).length} Pendientes
          </span>
        </div>
      </div>
      <div className="overflow-y-auto flex-1 p-0 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 w-24">Fecha</th>
              <th className="px-4 py-3 w-24">Ref</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3 text-right w-32">Monto</th>
              <th className="px-4 py-3 text-center w-20">Estado</th>
              {onAnalyze && <th className="px-4 py-3 text-center w-16">IA</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((t) => {
              const isMatched = t.status === MatchStatus.MATCHED;
              return (
                <tr 
                  key={t.id} 
                  className={`transition-colors ${
                    isMatched ? 'bg-slate-50/80 text-slate-400' : 'bg-white hover:bg-blue-50/30'
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">{t.date}</td>
                  <td className="px-4 py-3 text-xs">{t.reference}</td>
                  <td className="px-4 py-3 font-medium truncate max-w-[200px]" title={t.description}>
                    {t.description}
                    {t.matchedWithId && isMatched && <span className="ml-2 text-[10px] px-1 bg-slate-200 rounded text-slate-500">M</span>}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono font-medium ${
                    isMatched 
                      ? 'text-slate-400' 
                      : t.type === 'DEBIT' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {t.type === 'DEBIT' ? '-' : '+'} {formatCurrency(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isMatched ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mx-auto opacity-60" />
                    ) : (
                      <ExclamationCircleIcon className="w-5 h-5 text-amber-500 mx-auto animate-pulse" />
                    )}
                  </td>
                  {onAnalyze && (
                    <td className="px-4 py-3 text-center">
                      {!isMatched && (
                        <button 
                          onClick={() => onAnalyze(t)}
                          className="text-blue-600 hover:text-white hover:bg-blue-600 p-1.5 rounded-lg transition-all shadow-sm border border-blue-100"
                          title="Analizar causa con Gemini AI"
                        >
                          <MagnifyingGlassIcon className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};