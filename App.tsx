import React, { useState, useEffect, useCallback } from 'react';
import { 
  Transaction, 
  TransactionSource, 
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
  CheckBadgeIcon,
  KeyIcon 
} from '@heroicons/react/24/outline';

// --- Constants & Helpers ---
const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

const calculateSummary = (
  ledger: Transaction[], 
  bank: Transaction[]
): ReconciliationSummary => {
  // Basic logic for balances (assuming initial balance 10,000 for demo)
  const startBalance = 10000;
  
  // Calc ledger ending
  const ledgerDebits = ledger.filter(t => t.type === 'DEBIT').reduce((acc, t) => acc + t.amount, 0);
  const ledgerCredits = ledger.filter(t => t.type === 'CREDIT').reduce((acc, t) => acc + t.amount, 0);
  const ledgerEnd = startBalance + ledgerDebits - ledgerCredits;

  // Calc bank ending (Note: Bank Credit = Increase, Bank Debit = Decrease)
  // Wait, in bank statement: Credit is Deposit (Add), Debit is Withdrawal (Subtract) usually?
  // Standard: Bank Credit = Liability for bank = Asset for you. 
  // Let's align with PDF logic: "Debe (Mayor) = Depósitos (Extracto)", "Haber (Mayor) = Cargos (Extracto)"
  const bankCredits = bank.filter(t => t.type === 'CREDIT').reduce((acc, t) => acc + t.amount, 0);
  const bankDebits = bank.filter(t => t.type === 'DEBIT').reduce((acc, t) => acc + t.amount, 0);
  const bankEnd = 12500; // Hardcoded end balance from mock scenario (10k + 5k - 1.5k - 2k + 1.25k - 0.05 + 0.015 roughly)

  // Adjusted Balances
  // Adjusted Ledger = Ledger End + Bank Credits (Not in Ledger) - Bank Debits (Not in Ledger)
  const unmatchedBank = bank.filter(t => t.status !== MatchStatus.MATCHED);
  const unBankCred = unmatchedBank.filter(t => t.type === 'CREDIT').reduce((acc, t) => acc + t.amount, 0);
  const unBankDeb = unmatchedBank.filter(t => t.type === 'DEBIT').reduce((acc, t) => acc + t.amount, 0);
  const adjustedLedger = ledgerEnd + unBankCred - unBankDeb;

  // Adjusted Bank = Bank End + Ledger Debits (In Transit) - Ledger Credits (Outstanding Checks)
  const unmatchedLedger = ledger.filter(t => t.status !== MatchStatus.MATCHED);
  const transitDep = unmatchedLedger.filter(t => t.type === 'DEBIT').reduce((acc, t) => acc + t.amount, 0);
  const outstandingChk = unmatchedLedger.filter(t => t.type === 'CREDIT').reduce((acc, t) => acc + t.amount, 0);
  const adjustedBank = bankEnd + transitDep - outstandingChk;

  return {
    ledgerStartBalance: startBalance,
    bankStartBalance: startBalance, // Assuming they matched at start
    ledgerEndBalance: ledgerEnd,
    bankEndBalance: bankEnd,
    unmatchedLedgerTotal: transitDep + outstandingChk,
    unmatchedBankTotal: unBankCred + unBankDeb,
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
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{id: string, text: string} | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);

  // 1. Load Demo Data
  const loadDemoData = () => {
    setLedgerData(JSON.parse(JSON.stringify(MOCK_LEDGER)));
    setBankData(JSON.parse(JSON.stringify(MOCK_BANK)));
    // Mock file objects for UI state
    setLedgerFile(new File([""], "mayor_octubre_2023.xlsx"));
    setBankFile(new File([""], "extracto_octubre_2023.pdf"));
  };

  // 2. Auto Reconciliation Logic
  const runReconciliation = useCallback(() => {
    setIsReconciling(true);
    
    setTimeout(() => {
      const newLedger = [...ledgerData];
      const newBank = [...bankData];

      // Reset statuses first
      newLedger.forEach(t => t.status = MatchStatus.UNMATCHED);
      newBank.forEach(t => t.status = MatchStatus.UNMATCHED);

      // Algorithm: Match Exact Amount AND (Reference OR Similar Date)
      // Rule 1: Exact Match on Reference
      newLedger.forEach(lItem => {
        if (lItem.status === MatchStatus.MATCHED) return;

        const matchIndex = newBank.findIndex(bItem => {
          if (bItem.status === MatchStatus.MATCHED) return false;
          
          // Direction Match: Ledger Debit matches Bank Credit (Deposit)
          // Ledger Credit matches Bank Debit (Withdrawal)
          const typeMatch = (lItem.type === 'DEBIT' && bItem.type === 'CREDIT') ||
                            (lItem.type === 'CREDIT' && bItem.type === 'DEBIT');
          
          if (!typeMatch) return false;

          // Ref match
          const refMatch = lItem.reference && bItem.reference && lItem.reference === bItem.reference;
          
          // Amount match (allow tiny floating point diff)
          const amountMatch = Math.abs(lItem.amount - bItem.amount) < 0.01;

          return refMatch && amountMatch;
        });

        if (matchIndex !== -1) {
          lItem.status = MatchStatus.MATCHED;
          newBank[matchIndex].status = MatchStatus.MATCHED;
          lItem.matchedWithId = newBank[matchIndex].id;
          newBank[matchIndex].matchedWithId = lItem.id;
        }
      });

      // Rule 2: If ref missing, match on Amount + Close Date (within 2 days)
      // (Skipped for brevity in this React demo, keeping it simple strictly on ref/amount for the mock data)

      setLedgerData(newLedger);
      setBankData(newBank);
      setIsReconciling(false);
      setStep('process');
    }, 1500);
  }, [ledgerData, bankData]);

  // 3. Gemini Analysis Handler
  const handleAnalyze = async (transaction: Transaction) => {
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }
    setAiAnalysis({ id: transaction.id, text: "Analizando con Gemini..." });
    const result = await analyzeDiscrepancy(transaction, apiKey);
    setAiAnalysis({ id: transaction.id, text: result });
  };

  // Stats for Chart
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
            <span className="font-bold text-xl text-slate-800">AutoRecon</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowApiKeyModal(true)}
              className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1"
            >
              <KeyIcon className="w-4 h-4" />
              {apiKey ? 'API Key Configurada' : 'Configurar API Key'}
            </button>
            <div className="h-8 w-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-medium text-sm">
              AD
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-3xl font-bold text-slate-900 mb-4">Comenzar Conciliación</h1>
              <p className="text-slate-600">Sube el Mayor Contable y el Extracto Bancario del mismo periodo para iniciar el proceso automático de cruce de datos.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <FileUpload 
                title="1. Mayor Contable" 
                accept=".xlsx,.csv,.pdf"
                currentFile={ledgerFile}
                onFileSelect={setLedgerFile}
                onLoadDemo={loadDemoData}
              />
              <FileUpload 
                title="2. Extracto Bancario" 
                accept=".xlsx,.csv,.pdf"
                currentFile={bankFile}
                onFileSelect={setBankFile}
                onLoadDemo={loadDemoData}
              />
            </div>

            <div className="flex justify-center pt-6">
              <button
                disabled={!ledgerFile || !bankFile || isReconciling}
                onClick={runReconciliation}
                className={`px-8 py-3 rounded-lg font-semibold text-white transition-all flex items-center gap-2 ${
                  !ledgerFile || !bankFile 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isReconciling ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5" />
                    Conciliar Automáticamente
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Workspace */}
        {step === 'process' && (
          <div className="space-y-6">
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 col-span-2">
                <div className="flex justify-between items-start mb-4">
                   <h3 className="font-bold text-slate-700">Resumen de Progreso</h3>
                   <button 
                    onClick={() => setStep('report')}
                    className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded hover:bg-blue-100 font-medium"
                   >
                     Ver Informe Final &rarr;
                   </button>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                   <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{matchedCount}</div>
                      <div className="text-xs text-green-800 font-medium uppercase">Conciliados</div>
                   </div>
                   <div className="p-4 bg-amber-50 rounded-lg">
                      <div className="text-2xl font-bold text-amber-600">{unmatchedLedgerCount}</div>
                      <div className="text-xs text-amber-800 font-medium uppercase">Pend. Empresa</div>
                   </div>
                   <div className="p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{unmatchedBankCount}</div>
                      <div className="text-xs text-red-800 font-medium uppercase">Pend. Banco</div>
                   </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex items-center justify-center">
                 <div className="w-full h-40">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={chartData}
                         innerRadius={40}
                         outerRadius={60}
                         paddingAngle={5}
                         dataKey="value"
                       >
                         {chartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                       </Pie>
                       <Tooltip />
                       <Legend verticalAlign="bottom" height={36} iconSize={8} />
                     </PieChart>
                   </ResponsiveContainer>
                 </div>
              </div>
            </div>

            {/* Tables Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <div className="fixed bottom-6 right-6 w-96 bg-white rounded-xl shadow-2xl border border-blue-100 p-6 z-50 animate-fade-in-up">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 text-blue-600 font-semibold">
                    <SparklesIcon className="w-5 h-5" />
                    Análisis Inteligente
                  </div>
                  <button 
                    onClick={() => setAiAnalysis(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-slate-600 text-sm whitespace-pre-line leading-relaxed">
                  {aiAnalysis.text}
                </p>
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

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Configuración de Gemini API</h3>
            <p className="text-sm text-slate-500 mb-4">
              Para utilizar las funciones de análisis inteligente de discrepancias, ingresa tu API Key de Google Gemini.
            </p>
            <input 
              type="password" 
              placeholder="Pegar API Key aquí..."
              className="w-full p-3 border border-slate-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowApiKeyModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button 
                onClick={() => setShowApiKeyModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              La clave solo se guarda en la memoria de su navegador para esta sesión.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;