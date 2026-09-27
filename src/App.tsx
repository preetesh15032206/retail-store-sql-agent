import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { QueryInput } from './components/QueryInput.tsx';
import { SqlApprovalCard } from './components/SqlApprovalCard.tsx';
import { DataTable } from './components/DataTable.tsx';
import { ChartViewer } from './components/ChartViewer.tsx';
import { ExplanationCard } from './components/ExplanationCard.tsx';
import { DatabaseModal } from './components/DatabaseModal.tsx';
import { SchemaViewerModal } from './components/SchemaViewerModal.tsx';
import {
  DatabaseSchema,
  QueryPlan,
  ValidationResult,
  ExecutionResult,
  QueryExplanation,
  QueryHistoryItem,
  DatabaseConnectionConfig
} from '../shared/types.ts';
import {
  Wrench,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Terminal,
  Database,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  ShieldCheck
} from 'lucide-react';

export default function App() {
  // State
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(true);
  const [activeEngine, setActiveEngine] = useState<'builtin-relational' | 'mysql'>('builtin-relational');
  const [databaseName, setDatabaseName] = useState('retail_store');
  const [isExternalConnected, setIsExternalConnected] = useState(false);
  const [isAiConfigured, setIsAiConfigured] = useState(true);
  const [autoExecute, setAutoExecute] = useState(false);

  // Active query states
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [queryPlan, setQueryPlan] = useState<QueryPlan | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  // Execution states
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [explanation, setExplanation] = useState<QueryExplanation | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);

  // Error correction states
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [failedSql, setFailedSql] = useState<string | null>(null);
  const [correctionAttempt, setCorrectionAttempt] = useState(0);
  const [isCorrecting, setIsCorrecting] = useState(false);

  // Modals
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);

  // History & conversational context
  const [history, setHistory] = useState<QueryHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('sql_agent_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [conversationContext, setConversationContext] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);

  // Fetch initial schema and status on mount
  useEffect(() => {
    fetchStatusAndSchema();
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sql_agent_history', JSON.stringify(history));
    } catch (e) {
      // storage full / disabled
    }
  }, [history]);

  const fetchStatusAndSchema = async () => {
    setIsLoadingSchema(true);
    try {
      const healthRes = await fetch('/api/health');
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setActiveEngine(healthData.database.activeEngine);
        setDatabaseName(healthData.database.activeDatabase || 'retail_store');
        setIsExternalConnected(healthData.database.isExternalConnected);
        setIsAiConfigured(healthData.aiProvider.isConfigured);
      }

      const schemaRes = await fetch('/api/schema');
      if (schemaRes.ok) {
        const schemaData = await schemaRes.json();
        if (schemaData.success) {
          setSchema(schemaData.schema);
        }
      }
    } catch (err) {
      console.error('Failed to load schema:', err);
    } finally {
      setIsLoadingSchema(false);
    }
  };

  const handleGenerateSql = async (question: string) => {
    setCurrentQuestion(question);
    setIsGenerating(true);
    setExecutionError(null);
    setFailedSql(null);
    setCorrectionAttempt(0);
    setExecutionResult(null);
    setExplanation(null);

    try {
      const res = await fetch('/api/generate-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          conversationHistory: conversationContext.slice(-6)
        })
      });

      const data = await res.json();
      if (!data.success) {
        setExecutionError(data.error || 'Failed to generate query plan');
        return;
      }

      setQueryPlan(data.queryPlan);
      setValidation(data.validation);

      // If auto-execute is enabled and query passed validation, execute immediately
      if (autoExecute && data.validation.isValid) {
        handleExecuteQuery(data.validation.sanitizedSql || data.queryPlan.sql, data.queryPlan, question);
      }
    } catch (err: any) {
      setExecutionError(err.message || 'Request failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExecuteQuery = async (sql: string, plan: QueryPlan, questionText: string) => {
    setIsExecuting(true);
    setExecutionError(null);

    try {
      const res = await fetch('/api/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql })
      });

      const data = await res.json();

      if (!data.success) {
        setExecutionError(data.error || 'Execution failed');
        setFailedSql(sql);
        return;
      }

      const result: ExecutionResult = data.result;
      setExecutionResult(result);

      // Add to conversation context
      setConversationContext(prev => [
        ...prev,
        { role: 'user', text: questionText },
        { role: 'assistant', text: `SQL executed: ${sql}. Result returned ${result.rowCount} rows.` }
      ]);

      // Add to history
      const historyItem: QueryHistoryItem = {
        id: `q_${Date.now()}`,
        timestamp: new Date().toISOString(),
        question: questionText,
        sql,
        success: result.success,
        executionTimeMs: result.executionTimeMs,
        rowCount: result.rowCount,
        tablesUsed: plan.tables_used,
        chartType: plan.visualization_type
      };
      setHistory(prev => [historyItem, ...prev.slice(0, 49)]);

      // Request plain-English explanation
      fetchExplanation(sql, questionText, result);
    } catch (err: any) {
      setExecutionError(err.message || 'Execution request failed');
      setFailedSql(sql);
    } finally {
      setIsExecuting(false);
    }
  };

  const fetchExplanation = async (sql: string, userQuestion: string, result: ExecutionResult) => {
    setIsLoadingExplanation(true);
    try {
      const res = await fetch('/api/explain-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql,
          userQuestion,
          executionSummary: {
            rowCount: result.rowCount,
            columns: result.columns
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        setExplanation(data.explanation);
      }
    } catch (err) {
      console.warn('Failed to get query explanation:', err);
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  const handleAutoCorrect = async () => {
    if (!failedSql || !executionError || !currentQuestion) return;
    setIsCorrecting(true);

    try {
      const res = await fetch('/api/auto-correct-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalQuestion: currentQuestion,
          failedSql,
          errorMessage: executionError
        })
      });

      const data = await res.json();
      if (data.success) {
        setQueryPlan(data.queryPlan);
        setValidation(data.validation);
        setExecutionError(null);
        setCorrectionAttempt(prev => prev + 1);

        if (autoExecute && data.validation.isValid) {
          handleExecuteQuery(data.validation.sanitizedSql || data.queryPlan.sql, data.queryPlan, currentQuestion);
        }
      } else {
        setExecutionError(`Auto-correction failed: ${data.error}`);
      }
    } catch (err: any) {
      setExecutionError(`Auto-correction request error: ${err.message}`);
    } finally {
      setIsCorrecting(false);
    }
  };

  const handleSelectHistoryItem = (item: QueryHistoryItem) => {
    setCurrentQuestion(item.question);
    handleGenerateSql(item.question);
  };

  const handleConnectDatabase = async (mode: 'builtin' | 'mysql', config?: DatabaseConnectionConfig) => {
    const res = await fetch('/api/connect-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, config })
    });

    const data = await res.json();
    if (data.success) {
      await fetchStatusAndSchema();
    }
    return data;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        schema={schema}
        history={history}
        activeEngine={activeEngine}
        databaseName={databaseName}
        isExternalConnected={isExternalConnected}
        onSelectHistoryItem={handleSelectHistoryItem}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        onOpenScriptModal={() => setIsScriptModalOpen(true)}
        onRefreshSchema={fetchStatusAndSchema}
        isLoadingSchema={isLoadingSchema}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          activeEngine={activeEngine}
          databaseName={databaseName}
          isAiConfigured={isAiConfigured}
          autoExecute={autoExecute}
          onToggleAutoExecute={() => setAutoExecute(!autoExecute)}
          onOpenConnectModal={() => setIsConnectModalOpen(true)}
          tableCount={schema?.tables.length || 0}
        />

        {/* Scrollable Studio Workspace */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full">
          {/* Query Input Section */}
          <div className="space-y-3">
            <QueryInput
              onSubmit={handleGenerateSql}
              isLoading={isGenerating}
              disabled={isExecuting}
            />
          </div>

          {/* Error Banner with AI Auto-Correction */}
          {executionError && (
            <div className="p-4 rounded-xl border border-rose-900/60 bg-rose-950/40 text-rose-200 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-300">
                    Execution Error
                  </h4>
                  <p className="text-xs font-mono text-rose-200 mt-0.5 break-all">
                    {executionError}
                  </p>
                </div>
              </div>

              {failedSql && correctionAttempt < 2 && (
                <button
                  onClick={handleAutoCorrect}
                  disabled={isCorrecting}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  <Wrench className={`w-3.5 h-3.5 ${isCorrecting ? 'animate-spin' : ''}`} />
                  <span>Fix with AI ({2 - correctionAttempt} attempts left)</span>
                </button>
              )}
            </div>
          )}

          {/* SQL Approval & Preview Card */}
          {queryPlan && validation && (
            <SqlApprovalCard
              queryPlan={queryPlan}
              validation={validation}
              onExecute={sql => handleExecuteQuery(sql, queryPlan, currentQuestion)}
              isExecuting={isExecuting}
            />
          )}

          {/* Results Visualizer & Data Table */}
          {executionResult && executionResult.success && (
            <div className="space-y-6">
              {/* Chart Viewer */}
              {executionResult.rows.length > 0 && (
                <ChartViewer
                  result={executionResult}
                  initialChartType={queryPlan?.visualization_type}
                />
              )}

              {/* Data Table */}
              <DataTable result={executionResult} />

              {/* AI Query Explanation */}
              {explanation && (
                <ExplanationCard explanation={explanation} />
              )}
            </div>
          )}

          {/* Empty / Welcome State when no query executed */}
          {!queryPlan && !executionResult && !isGenerating && (
            <div className="py-12 px-6 rounded-xl border border-slate-800 bg-slate-900/50 space-y-6">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Enterprise Natural Language SQL Agent</span>
                </div>
                <h2 className="text-xl font-bold text-slate-100 tracking-tight">
                  Query your database with zero SQL required.
                </h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Enter questions in natural language. The agent inspects your tables, validates against 7 strict security guardrails (read-only enforcement, comment stripping, AST validation), and renders instant visualizations.
                </p>
              </div>

              {/* Quick Feature Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Safe Read-Only Guard</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Mutations, drops, alters, comments, and injection vectors are strictly blocked before reaching the database.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Live Cloud & Schema Sync</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Introspects tables, types, and foreign key relationships directly from TiDB MySQL Cloud in real time.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <span>Auto-Visualization</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Automatically selects the best chart type (bars, donut, sortable table) based on query result data types.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Database Connection Modal */}
      <DatabaseModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        activeEngine={activeEngine}
        currentDatabase={databaseName}
        onConnect={handleConnectDatabase}
      />

      {/* Schema Script Modal */}
      <SchemaViewerModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
      />
    </div>
  );
}
