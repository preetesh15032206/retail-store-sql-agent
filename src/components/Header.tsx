import React from 'react';
import { Database, ShieldCheck, Zap, Server, ChevronRight, Activity, Cpu } from 'lucide-react';

interface HeaderProps {
  activeEngine: 'builtin-relational' | 'mysql';
  databaseName: string;
  isAiConfigured: boolean;
  autoExecute: boolean;
  onToggleAutoExecute: () => void;
  onOpenConnectModal: () => void;
  tableCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeEngine,
  databaseName,
  isAiConfigured,
  autoExecute,
  onToggleAutoExecute,
  onOpenConnectModal,
  tableCount
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-10">
      {/* Zone 1: Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="font-semibold text-slate-100 tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            SQL Studio
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <button
            onClick={onOpenConnectModal}
            className="hover:text-slate-200 transition-colors text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5 cursor-pointer"
            title="Switch database connection"
          >
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span>{databaseName}</span>
            <span className="text-slate-500 font-sans">({tableCount} tables)</span>
          </button>
        </div>
      </div>

      {/* Zone 2 & 3: Clean Status & Actions */}
      <div className="flex items-center gap-5">
        {/* Model Spec */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Cpu className="w-3.5 h-3.5 text-slate-400" />
          <span>Gemini Flash</span>
          <span className="text-slate-600">·</span>
          <span className="text-emerald-400">Read-Only Guard Active</span>
        </div>

        {/* Auto-execute control */}
        <div className="flex items-center gap-2 pl-4 border-l border-slate-800">
          <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-300">
            <input
              type="checkbox"
              checked={autoExecute}
              onChange={onToggleAutoExecute}
              className="sr-only"
            />
            <div
              className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center ${
                autoExecute ? 'bg-cyan-500' : 'bg-slate-800 border border-slate-700'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                  autoExecute ? 'translate-x-4 shadow-sm' : 'translate-x-0.5'
                }`}
              />
            </div>
            <span className="text-xs text-slate-300 font-medium whitespace-nowrap">
              Auto-run verified SQL
            </span>
          </label>
        </div>

        {/* Database switcher action */}
        <button
          onClick={onOpenConnectModal}
          className="text-xs font-medium px-3 py-1.5 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
        >
          {activeEngine === 'mysql' ? 'Manage Connection' : 'Connect Cloud DB'}
        </button>
      </div>
    </header>
  );
};
