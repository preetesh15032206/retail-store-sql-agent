import React, { useState } from 'react';
import {
  Database,
  Table,
  History,
  Key,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  FileCode2,
  Layers,
  Clock,
  Sparkles
} from 'lucide-react';
import { DatabaseSchema, QueryHistoryItem } from '../../shared/types.ts';

interface SidebarProps {
  schema: DatabaseSchema | null;
  history: QueryHistoryItem[];
  activeEngine: 'builtin-relational' | 'mysql';
  databaseName: string;
  isExternalConnected: boolean;
  onSelectHistoryItem: (item: QueryHistoryItem) => void;
  onOpenConnectModal: () => void;
  onOpenScriptModal: () => void;
  onRefreshSchema: () => void;
  isLoadingSchema: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  schema,
  history,
  activeEngine,
  databaseName,
  isExternalConnected,
  onSelectHistoryItem,
  onOpenConnectModal,
  onOpenScriptModal,
  onRefreshSchema,
  isLoadingSchema
}) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'history'>('schema');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({
    customers: true,
    orders: true,
    products: true
  });
  const [schemaSearch, setSchemaSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');

  const toggleTable = (tableName: string) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }));
  };

  const filteredTables = schema?.tables.filter(t =>
    t.name.toLowerCase().includes(schemaSearch.toLowerCase()) ||
    t.columns.some(c => c.name.toLowerCase().includes(schemaSearch.toLowerCase()))
  ) || [];

  const filteredHistory = history.filter(h =>
    h.question.toLowerCase().includes(historySearch.toLowerCase()) ||
    h.sql.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <aside className="w-80 h-full border-r border-slate-800/80 bg-slate-950 flex flex-col shrink-0 select-none">
      {/* App Branding & Workspaces */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100 tracking-tight leading-none">
                Data Studio
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isExternalConnected ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
                <span>{isExternalConnected ? 'TiDB MySQL Cloud' : 'Local In-Memory'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onRefreshSchema}
            disabled={isLoadingSchema}
            title="Refresh database schema"
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSchema ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Database Quick Info Card */}
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium text-slate-400">DATABASE</span>
            <span className="font-mono text-[11px] text-slate-200">{databaseName}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>TABLES</span>
            <span className="font-mono text-slate-300 tabular-nums">{schema?.tables.length || 0} active</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-3 pb-2 border-b border-slate-800/80 flex items-center gap-2">
        <button
          onClick={() => setActiveTab('schema')}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors text-center cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'schema'
              ? 'bg-slate-800 text-slate-100 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Schema</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/50 text-slate-300 tabular-nums">
            {schema?.tables.length || 0}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors text-center cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'history'
              ? 'bg-slate-800 text-slate-100 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>History</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/50 text-slate-300 tabular-nums">
            {history.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Schema Explorer */}
      {activeTab === 'schema' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-3 border-b border-slate-800/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={schemaSearch}
                onChange={e => setSchemaSearch(e.target.value)}
                placeholder="Search tables or columns..."
                className="w-full bg-slate-900 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-slate-700"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredTables.map(t => {
              const isExpanded = !!expandedTables[t.name];
              return (
                <div
                  key={t.name}
                  className="rounded-lg border border-slate-800/80 bg-slate-900/60 overflow-hidden text-xs"
                >
                  <button
                    onClick={() => toggleTable(t.name)}
                    className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-slate-850/80 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Table className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="font-mono font-medium text-slate-200 truncate">
                        {t.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                        {t.rowCount !== undefined ? `${t.rowCount} rows` : ''}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-800/80 bg-slate-950/40 p-2 space-y-1">
                      {t.columns.map(col => (
                        <div
                          key={col.name}
                          className="px-2 py-1 rounded hover:bg-slate-900 flex items-center justify-between font-mono text-[11px] text-slate-300"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {col.isPrimaryKey ? (
                              <span title="Primary Key" className="inline-flex items-center"><Key className="w-3 h-3 text-amber-400 shrink-0" /></span>
                            ) : col.isForeignKey ? (
                              <span className="text-cyan-400 text-[10px] font-bold" title="Foreign Key">
                                FK
                              </span>
                            ) : (
                              <span className="w-2.5 h-2.5 inline-block text-slate-600 text-center leading-none">
                                ·
                              </span>
                            )}
                            <span className="truncate">{col.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0 lowercase">
                            {col.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <button
              onClick={onOpenScriptModal}
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
            >
              <FileCode2 className="w-3.5 h-3.5 text-slate-500" />
              <span>View Seed SQL DDL</span>
            </button>
            <button
              onClick={onOpenConnectModal}
              className="text-cyan-400 hover:text-cyan-300 text-xs font-medium cursor-pointer"
            >
              Config
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Query History */}
      {activeTab === 'history' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-3 border-b border-slate-800/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                placeholder="Search past queries..."
                className="w-full bg-slate-900 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-slate-700"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredHistory.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No past queries recorded yet.
              </div>
            ) : (
              filteredHistory.map(item => (
                <button
                  key={item.id}
                  onClick={() => onSelectHistoryItem(item)}
                  className="w-full text-left p-3 rounded-lg border border-slate-800/80 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700 transition-all cursor-pointer space-y-1.5"
                >
                  <p className="text-xs font-medium text-slate-200 line-clamp-2 leading-relaxed">
                    {item.question}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono text-emerald-400 tabular-nums">
                      {item.rowCount} rows · {item.executionTimeMs}ms
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
