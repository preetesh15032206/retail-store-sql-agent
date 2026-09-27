import React, { useState } from 'react';
import { Menu, Server, ChevronRight, Cpu, LogOut, User as UserIcon, Lock } from 'lucide-react';
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
  onToggleSidebar?: () => void;
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
  onLogout,
  onToggleSidebar
}) => {
  const userEmail = (user?.email || '').trim().toLowerCase();
  const isAdmin = userEmail === ADMIN_EMAIL.toLowerCase();

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between shrink-0 z-10">
      {/* Zone 1: Menu toggle & Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Drawer Button */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-1 text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg lg:hidden transition-colors cursor-pointer shrink-0"
            title="Open schema & history drawer"
            aria-label="Open database drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-400 min-w-0">
          <span className="font-semibold text-slate-100 tracking-tight flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="hidden xs:inline">SQL</span> Studio
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          {isAdmin ? (
            <button
              onClick={onOpenConnectModal}
              className="hover:text-cyan-300 transition-colors text-xs font-mono font-medium text-cyan-400 flex items-center gap-1 cursor-pointer bg-cyan-950/40 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded border border-cyan-800/50 truncate max-w-[120px] sm:max-w-[200px]"
              title="Manage database connection (Admin Only)"
            >
              <Server className="w-3.5 h-3.5 text-cyan-400 shrink-0 hidden sm:inline" />
              <span className="underline decoration-cyan-500/50 underline-offset-2 truncate">{databaseName}</span>
              <span className="text-slate-400 font-sans hidden sm:inline">({tableCount})</span>
            </button>
          ) : (
            <div
              className="text-xs font-mono font-medium text-slate-300 flex items-center gap-1 cursor-default select-none truncate max-w-[120px] sm:max-w-none"
              title="Active Production Database"
            >
              <Server className="w-3.5 h-3.5 text-cyan-400 shrink-0 hidden sm:inline" />
              <span className="truncate">{databaseName}</span>
              <span className="text-slate-500 font-sans hidden sm:inline">({tableCount} tables)</span>
            </div>
          )}
        </div>
      </div>

      {/* Zone 2 & 3: Clean Status & Actions */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Model Spec - Visible on md+ */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Cpu className="w-3.5 h-3.5 text-slate-400" />
          <span>Gemini Flash</span>
          <span className="text-slate-600">·</span>
          <span className="text-emerald-400">Read-Only Active</span>
        </div>

        {/* Auto-execute toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-3 border-l border-slate-800">
          <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none text-xs text-slate-300">
            <input
              type="checkbox"
              checked={autoExecute}
              onChange={onToggleAutoExecute}
              className="sr-only"
            />
            <div
              className={'w-7 sm:w-8 h-4 sm:h-4.5 rounded-full transition-colors relative flex items-center ' + (autoExecute ? 'bg-cyan-500' : 'bg-slate-800 border border-slate-700')}
            >
              <div
                className={'w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-full bg-white transition-transform ' + (autoExecute ? 'translate-x-3.5 sm:translate-x-4 shadow-sm' : 'translate-x-0.5')}
              />
            </div>
            <span className="text-xs text-slate-300 font-medium whitespace-nowrap hidden lg:inline">
              Auto-run SQL
            </span>
          </label>
        </div>

        {/* Database connection button - ONLY FOR ADMIN preetesh4153@gmail.com */}
        {isAdmin ? (
          <button
            onClick={onOpenConnectModal}
            className="text-xs font-semibold px-2 py-1 sm:px-3 sm:py-1.5 rounded-md border border-cyan-500/50 bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm shadow-cyan-900/30 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 sm:gap-1.5"
            title="Configure TiDB / MySQL credentials"
          >
            <Server className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">{activeEngine === 'mysql' ? 'Manage Connection' : 'Connect Cloud DB'}</span>
            <span className="sm:hidden">Connect</span>
          </button>
        ) : (
          <div
            className="text-[10px] sm:text-[11px] font-medium px-2 py-1 rounded-md border border-slate-800 bg-slate-900/60 text-slate-400 flex items-center gap-1 select-none"
            title="Database connections are managed securely by administrator"
          >
            <Lock className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="hidden sm:inline">Connected ({databaseName})</span>
            <span className="sm:hidden">Locked</span>
          </div>
        )}

        {/* User Profile & Clear Logout Button */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-800">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-slate-700 object-cover"
              />
            ) : (
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">
                {user?.displayName?.charAt(0) || userEmail.charAt(0) || <UserIcon className="w-3.5 h-3.5" />}
              </div>
            )}
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-medium text-slate-200 truncate max-w-[130px] flex items-center gap-1">
                {user?.displayName || 'User'}
                {isAdmin && (
                  <span className="px-1.5 py-0.2 text-[9px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded font-semibold uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </span>
              <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                {userEmail}
              </span>
            </div>
          </div>

          {/* Prominent Log Out Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md border border-slate-700 hover:border-red-500/50 bg-slate-900 hover:bg-red-950/40 text-slate-200 hover:text-red-300 transition-colors text-xs font-medium cursor-pointer shadow-xs"
              title="Sign out of your account"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
