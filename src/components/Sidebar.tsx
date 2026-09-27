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
  Sparkles,
  X
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
  isAdmin?: boolean;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
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
  isLoadingSchema,
  isAdmin = false,
  isOpenMobile = false,
  onCloseMobile
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
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={"fixed inset-y-0 left-0 z-50 w-80 lg:w-72 xl:w-80 h-full border-r border-slate-800/80 bg-slate-950 flex flex-col shrink-0 select-none transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 " + (isOpenMobile ? "translate-x-0 shadow-2xl ring-1 ring-slate-800" : "-translate-x-full")}
      >
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
                  <span className={'w-1.5 h-1.5 rounded-full ' + (isExternalConnected ? 'bg-emerald-400' : 'bg-cyan-400')} />
                  <span>{isExternalConnected ? 'TiDB MySQL Cloud' : 'Local In-Memory'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onRefreshSchema}
                disabled={isLoadingSchema}
                title="Refresh database schema"
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={'w-3.5 h-3.5 ' + (isLoadingSchema ? 'animate-spin' : '')} />
              </button>

              {/* Close button for mobile drawers */}
              {onCloseMobile && (
                <button
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer lg:hidden"
                  title="Close sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Database Quick Info Card */}
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium text-slate-400">DATABASE</span>
              <span className="font-mono text-[11px] text-slate-200 truncate max-w-[150px]">{databaseName}</span>
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
            className={'flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ' + (
              activeTab === 'schema'
                ? 'bg-slate-800 text-slate-100 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Schema</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700/60 font-mono text-slate-300">
              {schema?.tables.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={'flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ' + (
              activeTab === 'history'
                ? 'bg-slate-800 text-slate-100 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>History</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700/60 font-mono text-slate-300">
              {history.length}
            </span>
          </button>
        </div>

        {/* Search Bar for Tab Content */}
        <div className="px-3 py-2 border-b border-slate-800/50">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
            <input
              type="text"
              value={activeTab === 'schema' ? schemaSearch : historySearch}
              onChange={e =>
                activeTab === 'schema'
                  ? setSchemaSearch(e.target.value)
                  : setHistorySearch(e.target.value)
              }
              placeholder={activeTab === 'schema' ? 'Search tables & columns...' : 'Filter past queries...'}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-slate-700"
            />
          </div>
        </div>

        {/* Tab 1: Database Schema Tree */}
        {activeTab === 'schema' && (
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredTables.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                {schemaSearch ? 'No tables or columns match search.' : 'No tables discovered.'}
              </div>
            ) : (
              filteredTables.map(tbl => {
                const isExpanded = !!expandedTables[tbl.name];
                return (
                  <div key={tbl.name} className="rounded-lg border border-slate-800/60 bg-slate-900/40 overflow-hidden">
                    <button
                      onClick={() => toggleTable(tbl.name)}
                      className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Table className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="font-mono text-xs font-medium text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                          {tbl.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                        <span className="text-[10px] font-mono tabular-nums">
                          {tbl.rowCount ? tbl.rowCount + "r" : tbl.columns.length + "c"}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-2 pb-2 pt-0.5 space-y-0.5 border-t border-slate-800/40 bg-slate-950/60">
                        {tbl.columns.map(col => (
                          <div
                            key={col.name}
                            className="flex items-center justify-between px-2 py-1 rounded text-[11px] font-mono hover:bg-slate-900/60 transition-colors group"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              {col.isPrimaryKey ? (
                                <Key className="w-3 h-3 text-amber-400 shrink-0" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-700 shrink-0" />
                              )}
                              <span className={'truncate ' + (col.isPrimaryKey ? 'text-amber-200 font-medium' : 'text-slate-300')}>
                                {col.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 truncate ml-2 uppercase font-sans">
                              {col.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Schema Footer Actions */}
            <div className="pt-3 px-2 flex items-center justify-between text-xs text-slate-400">
              <button
                onClick={() => {
                  onOpenScriptModal();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="hover:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-cyan-300"
              >
                <FileCode2 className="w-3.5 h-3.5 text-slate-500" />
                <span>View Seed SQL DDL</span>
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    onOpenConnectModal();
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="text-cyan-400 hover:text-cyan-300 text-xs font-medium cursor-pointer"
                >
                  Config
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Query History */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredHistory.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                {historySearch ? 'No history matches search.' : 'No queries executed yet.'}
              </div>
            ) : (
              filteredHistory.map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectHistoryItem(item);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700 cursor-pointer transition-all space-y-1.5 group"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-200 font-medium truncate max-w-[180px] group-hover:text-cyan-300 transition-colors">
                      {item.question}
                    </span>
                    <span className={'text-[10px] font-mono ' + (item.success ? 'text-emerald-400' : 'text-rose-400')}>
                      {item.success ? item.rowCount + "r" : "err"}
                    </span>
                  </div>
                  <pre className="text-[10px] font-mono text-cyan-400/80 bg-slate-950 p-1.5 rounded truncate">
                    {item.sql}
                  </pre>
                  <div className="text-[10px] text-slate-500 flex items-center justify-between">
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-mono">{item.executionTimeMs}ms</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {/* Creator Info Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950 text-[11px] text-slate-400">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-300">Preetesh Kumar Chaudhary</span>
            <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 font-mono text-[10px] font-semibold">
              GenAI
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
            <span>Roll ID: <strong className="text-cyan-400 font-mono">2306209</strong></span>
            <span>Retail SQL Agent</span>
          </div>
        </div>
      </aside>
    </>
  );
};
