import React, { useState, useCallback } from 'react';
import { 
  Transaction, 
  MatchStatus, 
  ReconciliationSummary 
} from './types';
import { MOCK_LEDGER, MOCK_BANK } from './services/mockData';
import { analyzeDiscrepancy } from './services/geminiService';
import { FileUpload } from './components/FileUpload';
import { TransactionTable } from './components/TransactionTable';
import { ReportView } from './components/ReportView';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  ArrowPathIcon, 
  SparklesIcon, 
  BanknotesIcon
} from '@heroicons/react/24/outline';

// --- Constants & Helpers ---
const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

// Accurate accounting reconciliation calculation
const calculateSummary = (
  ledger: Transaction[], 
  bank: Transaction[]
): ReconciliationSummary => {
  // 1. Establish Starting Balances
  // In a real file parse, we would pull the first row balance. 
  // For demo, we assume 10,000 start.
  const startBalance = 10000;
  
  // 2. Calculate Ending Balance per Ledger (Book Balance)
  // Assets (Cash): Debit increases, Credit decreases
  const ledgerDebits = ledger.filter(t => t.type === 'DEBIT').reduce((acc, t) => acc + t.amount, 0);
  const ledgerCredits = ledger.filter(t => t.type === 'CREDIT').reduce((acc, t) => acc + t.amount, 0);
  const ledgerEnd = startBalance + ledgerDebits - ledgerCredits;

  // 3. Calculate Ending Balance per Bank (Bank Balance)
  // Bank Perspective: Credit is Deposit (Liability up), Debit is Withdrawal (Liability down)
  const bankCredits = bank.filter(t => t.type === 'CREDIT').reduce((acc, t) => acc + t.amount, 0);
  const bankDebits = bank.filter(t => t.type === 'DEBIT').reduce((acc, t) => acc + t.amount, 0);
  const bankEnd = startBalance + bankCredits - bankDebits;

  // 4. Determine Unmatched Items
  const unmatchedLedger = ledger.filter(t => t.status !== MatchStatus.MATCHED);
  const unmatchedBank = bank.filter(t => t.status !== MatchStatus.MATCHED);

  // 5. Adjusted Book Balance Calculation
  // Start with Book Balance
  // (+) Add: Bank Credits not in Books (Notes collected by bank, Interest earned)
  const addToBook = unmatchedBank.filter(t => t.type === 'CREDIT').reduce((acc, t) => acc + t.amount, 0);
  // (-) Subtract: Bank Debits not in Books (Service charges, NSF checks)
  const subFromBook = unmatchedBank.filter(t => t.type === 'DEBIT').reduce((acc, t) => acc + t.amount, 0);
  const adjustedLedger = ledgerEnd + addToBook - subFromBook;

  // 6. Adjusted Bank Balance Calculation
  // Start with Bank Balance
  // (+) Add: Deposits in Transit (Ledger Debits not in Bank)
  const depositsTransit = unmatchedLedger.filter(t => t.type === 'DEBIT').reduce((acc, t) => acc + t.amount, 0);
  // (-) Subtract: Outstanding Checks (Ledger Credits not in Bank)
  const outstandingChecks = unmatchedLedger.filter(t => t.type === 'CREDIT').reduce((acc, t) => acc + t.amount, 0);
  const adjustedBank = bankEnd + depositsTransit - outstandingChecks;

  return {
    ledgerStartBalance: startBalance,
    bankStartBalance: startBalance,
    ledgerEndBalance: ledgerEnd,
    bankEndBalance: bankEnd,
    unmatchedLedgerTotal: depositsTransit + outstandingChecks,
    unmatchedBankTotal: addToBook + subFromBook,
    adjustedLedgerBalance: adjustedLedger,
    adjustedBankBalance: adjustedBank
  };
};

const App: React.FC = () => {
  const [step, setStep] = useState<'upload' | 'process' | 'report'>('upload');
  const [ledgerFile, setLedgerFile] = useState<File | null>(null);
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [ledgerData, setLedgerData] = useState<Transaction[]>([]);
  const [bankData, setBankData] = useState<Transaction[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<{id: string, text: string} | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);

  // 1. Load Demo Data
  const loadDemoData = () => {
    setLedgerData(JSON.parse(JSON.stringify(MOCK_LEDGER)));
    setBankData(JSON.parse(JSON.stringify(MOCK_BANK)));
    setLedgerFile(new File([""], "mayor_octubre_2023.xlsx"));
    setBankFile(new File([""], "extracto_octubre_2023.pdf"));
  };

  // 2. Auto Reconciliation Logic
  const runReconciliation = useCallback(() => {
    setIsReconciling(true);
    
    // Simulate processing delay for UX
    setTimeout(() => {
      const newLedger = JSON.parse(JSON.stringify(ledgerData));
      const newBank = JSON.parse(JSON.stringify(bankData));

      // Reset statuses
      newLedger.forEach((t: Transaction) => t.status = MatchStatus.UNMATCHED);
      newBank.forEach((t: Transaction) => t.status = MatchStatus.UNMATCHED);

      // --- CORE MATCHING ALGORITHM ---
      newLedger.forEach((lItem: Transaction) => {
        if (lItem.status === MatchStatus.MATCHED) return;

        const matchIndex = newBank.findIndex((bItem: Transaction) => {
          if (bItem.status === MatchStatus.MATCHED) return false;
          
          // Direction Logic:
          // Ledger Debit (Money In) matches Bank Credit (Deposit)
          // Ledger Credit (Money Out) matches Bank Debit (Withdrawal)
          const typeMatch = (lItem.type === 'DEBIT' && bItem.type === 'CREDIT') ||
                            (lItem.type === 'CREDIT' && bItem.type === 'DEBIT');
          
          if (!typeMatch) return false;

          // A. Exact Reference Match (Primary Key)
          const refMatch = lItem.reference && bItem.reference && lItem.reference === bItem.reference;
          
          // B. Amount Match (with slight tolerance for float errors)
          const amountMatch = Math.abs(lItem.amount - bItem.amount) < 0.01;

          // C. Amount Match + Date Proximity (Secondary Heuristic) - skipped for strict demo
          
          // We prioritize Ref + Amount match
          return refMatch && amountMatch;
        });

        if (matchIndex !== -1) {
          lItem.status = MatchStatus.MATCHED;
          newBank[matchIndex].status = MatchStatus.MATCHED;
          lItem.matchedWithId = newBank[matchIndex].id;
          newBank[matchIndex].matchedWithId = lItem.id;
        }
      });

      setLedgerData(newLedger);
      setBankData(newBank);
      setIsReconciling(false);
      setStep('process');
    }, 2000);
  }, [ledgerData, bankData]);

  // 3. Gemini Analysis Handler
  const handleAnalyze = async (transaction: Transaction) => {
    setAiAnalysis({ id: transaction.id, text: "Consultando a Gemini 2.5 Flash..." });
    const result = await analyzeDiscrepancy(transaction);
    setAiAnalysis({ id: transaction.id, text: result });
  };

  // Stats
  const matchedCount = ledgerData.filter(t => t.status === MatchStatus.MATCHED).length + bankData.filter(t => t.status === MatchStatus.MATCHED).length;
  const unmatchedLedgerCount = ledgerData.filter(t => t.status !== MatchStatus.MATCHED).length;
  const unmatchedBankCount = bankData.filter(t => t.status !== MatchStatus.MATCHED).length;
  
  const chartData = [
    { name: 'Conciliado', value: matchedCount },
    { name: 'Pend. Empresa', value: unmatchedLedgerCount },
    { name: 'Pend. Banco', value: unmatchedBankCount },
  ];

  const summary = calculateSummary(ledgerData, bankData);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setStep('upload')}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <BanknotesIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-slate-800 leading-tight">AutoRecon</h1>
              <p className="text-xs text-slate-500 font-medium">Conciliación Bancaria Inteligente</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center text-white font-medium text-xs shadow-md ring-2 ring-white">
              AD
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-10 animate-fade-in-up">
            <div className="text-center max-w-3xl mx-auto mt-8">
              <h2 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">Comience su Conciliación</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Suba sus archivos de Mayor Contable y Extracto Bancario para procesar automáticamente el cruce de datos, identificar errores y generar asientos de ajuste.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <FileUpload 
                title="1. Mayor Contable (Empresa)" 
                accept=".xlsx,.csv,.pdf"
                currentFile={ledgerFile}
                onFileSelect={setLedgerFile}
                onLoadDemo={loadDemoData}
              />
              <FileUpload 
                title="2. Extracto Bancario (Banco)" 
                accept=".xlsx,.csv,.pdf"
                currentFile={bankFile}
                onFileSelect={setBankFile}
                onLoadDemo={loadDemoData}
              />
            </div>

            <div className="flex justify-center pt-8">
              <button
                disabled={!ledgerFile || !bankFile || isReconciling}
                onClick={runReconciliation}
                className={`px-10 py-4 rounded-xl font-bold text-lg text-white transition-all transform hover:scale-105 flex items-center gap-3 ${
                  !ledgerFile || !bankFile 
                  ? 'bg-slate-300 cursor-not-allowed opacity-70' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-xl hover:shadow-blue-500/30'
                }`}
              >
                {isReconciling ? (
                  <>
                    <ArrowPathIcon className="w-6 h-6 animate-spin" />
                    Procesando Algoritmo...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-6 h-6" />
                    Conciliar Automáticamente
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Workspace */}
        {step === 'process' && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 col-span-2 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-6">
                   <div>
                     <h3 className="text-lg font-bold text-slate-800">Estado de la Conciliación</h3>
                     <p className="text-sm text-slate-500">Resumen de partidas procesadas</p>
                   </div>
                   <button 
                    onClick={() => setStep('report')}
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium shadow-lg shadow-blue-200 transition-all"
                   >
                     Ver Informe Final &rarr;
                   </button>
                </div>
                <div className="grid grid-cols-3 gap-6 text-center">
                   <div className="p-5 bg-green-50 border border-green-100 rounded-xl">
                      <div className="text-3xl font-bold text-green-600 mb-1">{matchedCount}</div>
                      <div className="text-xs text-green-800 font-bold uppercase tracking-wide">Transacciones Conciliadas</div>
                   </div>
                   <div className="p-5 bg-amber-50 border border-amber-100 rounded-xl">
                      <div className="text-3xl font-bold text-amber-600 mb-1">{unmatchedLedgerCount}</div>
                      <div className="text-xs text-amber-800 font-bold uppercase tracking-wide">Pendientes en Libros</div>
                   </div>
                   <div className="p-5 bg-red-50 border border-red-100 rounded-xl">
                      <div className="text-3xl font-bold text-red-600 mb-1">{unmatchedBankCount}</div>
                      <div className="text-xs text-red-800 font-bold uppercase tracking-wide">Pendientes en Banco</div>
                   </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center relative">
                 <h4 className="absolute top-6 left-6 font-bold text-slate-700 text-sm">Distribución</h4>
                 <div className="w-full h-48 mt-4">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={chartData}
                         innerRadius={50}
                         outerRadius={70}
                         paddingAngle={5}
                         dataKey="value"
                         stroke="none"
                       >
                         {chartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                       </Pie>
                       <Tooltip wrapperClassName="text-sm rounded-lg shadow-lg border-0" />
                       <Legend verticalAlign="bottom" height={36} iconSize={8} />
                     </PieChart>
                   </ResponsiveContainer>
                 </div>
              </div>
            </div>

            {/* Tables Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <TransactionTable 
                title="Mayor Contable (Empresa)" 
                transactions={ledgerData} 
              />
              <TransactionTable 
                title="Extracto Bancario (Banco)" 
                transactions={bankData} 
                onAnalyze={handleAnalyze}
              />
            </div>

            {/* AI Analysis Panel */}
            {aiAnalysis && (
              <div className="fixed bottom-8 right-8 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden z-50 animate-fade-in-up ring-4 ring-black/5">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <SparklesIcon className="w-5 h-5" />
                    Análisis Gemini AI
                  </div>
                  <button 
                    onClick={() => setAiAnalysis(null)}
                    className="text-white/70 hover:text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="p-6 bg-white max-h-[60vh] overflow-y-auto">
                  <p className="text-slate-700 text-sm whitespace-pre-line leading-relaxed font-medium">
                    {aiAnalysis.text}
                  </p>
                </div>
                <div className="bg-slate-50 px-6 py-3 text-xs text-slate-400 border-t">
                  Generado por Gemini 2.5 Flash • Verificar antes de contabilizar
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Report */}
        {step === 'report' && (
          <ReportView 
            summary={summary}
            unmatchedLedger={ledgerData.filter(t => t.status !== MatchStatus.MATCHED)}
            unmatchedBank={bankData.filter(t => t.status !== MatchStatus.MATCHED)}
            onReset={() => {
              setStep('upload');
              setLedgerFile(null);
              setBankFile(null);
              setLedgerData([]);
              setBankData([]);
            }}
          />
        )}
      </main>
    </div>
  );
};

export default App;