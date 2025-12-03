import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import ChartsContainer from './components/ChartsContainer';
import DataGrid from './components/DataGrid';
import { parseFile, generateAutomaticKPIs, prepareChartData } from './services/dataProcessing';
import { saveSession, loadSession, clearSession } from './services/storageService';
import { Dataset, KPI } from './types';
import { BarChart3, PieChart, Activity } from 'lucide-react';

const App: React.FC = () => {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [charts, setCharts] = useState<any[]>([]);

  // 1. Load data from IndexedDB on mount
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const session = await loadSession();
        if (session && session.dataset) {
          // Restore state
          setDataset(session.dataset);
          setKpis(session.kpis || []);
          setCharts(session.charts || []);
        }
      } catch (err) {
        console.error("Error loading persisted data:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    loadPersistedData();
  }, []);

  // 2. Handle File Upload and Save to DB
  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    setDataset(null);
    setKpis([]);
    setCharts([]);

    try {
      // Parse Data
      const data = await parseFile(file);
      
      // Generate Statistics (KPIs & Charts)
      const calculatedKpis = generateAutomaticKPIs(data);
      const calculatedCharts = prepareChartData(data);

      // Save to IndexedDB
      await saveSession(data, calculatedKpis, calculatedCharts);

      // Update State
      setDataset(data);
      setKpis(calculatedKpis);
      setCharts(calculatedCharts);

      setLoading(false);

    } catch (err: any) {
      console.error(err);
      setError("Falha ao processar arquivo. Certifique-se de que é um Excel ou CSV válido com os cabeçalhos corretos.");
      setLoading(false);
    }
  };

  // 3. Handle "Nova Análise" (Reset)
  const handleReset = async () => {
    try {
      setLoading(true);
      await clearSession(); // Clear IndexedDB
      setDataset(null);
      setKpis([]);
      setCharts([]);
      setError(null);
      // Optional: reload page to ensure clean state, but state reset is usually enough
      // window.location.reload(); 
    } catch (err) {
      console.error("Error clearing session:", err);
    } finally {
      setLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="bg-indigo-600 p-2 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">DataMind <span className="text-indigo-600">Analytics</span></h1>
            </div>
            {dataset && (
                <button 
                  onClick={handleReset} 
                  className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-md"
                >
                    Nova Análise
                </button>
            )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Intro / Upload Section */}
        {!dataset && !loading && (
          <div className="max-w-2xl mx-auto mt-12">
            <div className="text-center mb-10">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Seu Analista de Dados Sênior</h2>
                <p className="text-lg text-gray-600">
                    Envie sua planilha (Excel ou CSV) e geraremos a dashboard automaticamente.
                </p>
            </div>
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-center border border-red-100">
                    {error}
                </div>
            )}
            <FileUpload onFileUpload={handleFileUpload} isLoading={loading} />
          </div>
        )}

        {/* Loading State */}
        {loading && (
             <div className="flex flex-col items-center justify-center h-64 mt-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-lg font-medium text-gray-700">Processando dados...</p>
                <p className="text-sm text-gray-500">Limpando registros e gerando gráficos.</p>
             </div>
        )}

        {/* Dashboard */}
        {dataset && !loading && (
            <>
                {/* 1. KPIs */}
                <section>
                    <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5"/> KPIs Principais
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {kpis.map((kpi, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-sm font-medium text-gray-500 mb-1">{kpi.label}</p>
                                <p className={`text-2xl font-bold ${
                                    kpi.color === 'green' ? 'text-emerald-600' : 
                                    kpi.color === 'blue' ? 'text-indigo-600' : 'text-gray-900'
                                }`}>
                                    {kpi.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 2. Charts */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                         <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                            <PieChart className="w-5 h-5"/> Análise Visual
                        </h3>
                    </div>
                   <ChartsContainer charts={charts} />
                </section>

                {/* 3. Data Grid */}
                <section>
                    <DataGrid dataset={dataset} />
                </section>
            </>
        )}
      </main>
    </div>
  );
};

export default App;