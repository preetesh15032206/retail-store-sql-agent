import React from 'react';
import { ShieldCheck, Server, ChevronRight, Cpu, LogOut, User as UserIcon, Lock } from 'lucide-react';
import { User } from '../firebase.ts';

export const ADMIN_EMAIL = 'preetesh4153@gmail.com';

interface HeaderProps {
  activeEngine: 'builtin-relational' | 'mysql';
  databaseName: string;
  isAiConfigured: boolean;
  autoExecute: boolean;
  onToggleAutoExecute: () => void;
  onOpenConnectModal: () => void;
  tableCount: number;
  user?: User | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeEngine,
  databaseName,
  isAiConfigured,
  autoExecute,
  onToggleAutoExecute,
  onOpenConnectModal,
  tableCount,
  user,
  onLogout
}) => {
  const isAdmin = (user?.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();

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
          {isAdmin ? (
            <button
              onClick={onOpenConnectModal}
              className="hover:text-slate-200 transition-colors text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5 cursor-pointer"
              title="Manage database connection (Admin Only)"
            >
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span>{databaseName}</span>
              <span className="text-slate-500 font-sans">({tableCount} tables)</span>
            </button>
          ) : (
            <div
              className="text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5 cursor-default select-none"
              title="Active Production Database"
            >
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span>{databaseName}</span>
              <span className="text-slate-500 font-sans">({tableCount} tables)</span>
            </div>
          )}
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
              className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center autoExecute ? 'bg-cyan-500' : 'bg-slate-800 border border-slate-700'`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform autoExecute ? 'translate-x-4 shadow-sm' : 'translate-x-0.5'`}
              />
            </div>
            <span className="text-xs text-slate-300 font-medium whitespace-nowrap">
              Auto-run verified SQL
            </span>
          </label>
        </div>

        {/* Database switcher action - ONLY VISIBLE TO ADMIN preetesh4153@gmail.com */}
        {isAdmin ? (
          <button
            onClick={onOpenConnectModal}
            className="text-xs font-medium px-3 py-1.5 rounded-md border border-cyan-500/40 bg-cyan-950/30 hover:bg-cyan-900/50 text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            title="Administrator Connection Management"
          >
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span>{activeEngine === 'mysql' ? 'Manage Connection' : 'Connect Cloud DB'}</span>
          </button>
        ) : (
          <div
            className="text-[11pX] font-medium px-2.5 py-1 rounded-md border border-slate-800 bg-slate-900/50 text-slate-400 flex items-center gap-1.5 select-none"
            title="Database connection is managed by system administrator"
          >
            <Lock className="w-3 h-3 text-slate-500" />
            <span>Connected ({databaseName})</span>
          </div>
        )}

        {/* User Profile / Logout */}
        {user && onLogout && (
          <div className="flex items-center gap-2.5 pl-4 border-l border-slate-800">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-7 h-7 rounded-full border border-slate-700 object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || <UserIcon className="w-3.5 h-3.5" />}
              </div>
            )}
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-medium text-slate-200 truncate max-w-[120px] flex items-center gap-1">
                {user.displayName || 'Authorized User'}
                {isAdmin && (
                  <span className="px-1.5 py-0.2 text-[9px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded font-semibold uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </span>
              <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                {user.email}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-md transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
