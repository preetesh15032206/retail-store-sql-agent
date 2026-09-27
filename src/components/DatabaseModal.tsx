import React, { useState } from 'react';
import { X, Server, Database, ShieldCheck, Check, AlertCircle, Loader2 } from 'lucide-react';
import { DatabaseConnectionConfig } from '../../shared/types.ts';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeEngine: 'builtin-relational' | 'mysql';
  currentDatabase: string;
  onConnect: (mode: 'builtin' | 'mysql', config?: DatabaseConnectionConfig) => Promise<{ success: boolean; message: string }>;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({
  isOpen,
  onClose,
  activeEngine,
  currentDatabase,
  onConnect
}) => {
  const [selectedMode, setSelectedMode] = useState<'builtin' | 'mysql'>(activeEngine === 'mysql' ? 'mysql' : 'builtin');
  const [host, setHost] = useState('gateway01.ap-southeast-1.prod.aws.tidbcloud.com');
  const [port, setPort] = useState('4000');
  const [database, setDatabase] = useState('retail_store');
  const [user, setUser] = useState('4Uc51YGQYK1P3PP.root');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    try {
      let res;
      if (selectedMode === 'builtin') {
        res = await onConnect('builtin');
      } else {
        res = await onConnect('mysql', {
          host: host.trim(),
          port: Number(port) || 3306,
          database: database.trim(),
          user: user.trim(),
          password
        });
      }

      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Connection failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden text-slate-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Database Connection Setup
              </h3>
              <p className="text-[11px] text-slate-400">
                Connect external TiDB or switch to the built-in relational engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto">
          {/* Engine Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedMode('mysql')}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                selectedMode === 'mysql'
                  ? 'border-cyan-500 bg-cyan-950/20 text-slate-100 ring-1 ring-cyan-500/30'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-slate-200">External MySQL / TiDB</div>
              <div className="text-[11px] text-slate-400 mt-0.5">TiDB Serverless, AWS RDS, local</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode('builtin')}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                selectedMode === 'builtin'
                  ? 'border-cyan-500 bg-cyan-950/20 text-slate-100 ring-1 ring-cyan-500/30'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-slate-200">Built-in In-Memory DB</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Fast zero-config relational store</div>
            </button>
          </div>

          {/* Form fields for MySQL */}
          {selectedMode === 'mysql' ? (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">Host</label>
                  <input
                    type="text"
                    required
                    value={host}
                    onChange={e => setHost(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 font-mono text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">Port</label>
                  <input
                    type="number"
                    required
                    value={port}
                    onChange={e => setPort(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 font-mono text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">Database Name</label>
                  <input
                    type="text"
                    required
                    value={database}
                    onChange={e => setDatabase(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 font-mono text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">Username</label>
                  <input
                    type="text"
                    required
                    value={user}
                    onChange={e => setUser(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 font-mono text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">Password</label>
                <input
                  type="password"
                  placeholder="Enter database password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 font-mono text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  SSL/TLS encryption is automatically active for cloud endpoints (e.g. TiDB Cloud).
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 space-y-2">
              <p className="text-xs">
                The built-in engine simulates a full SQL database in memory with 3 seeded tables: <code className="text-cyan-300 font-mono">customers</code>, <code className="text-cyan-300 font-mono">products</code>, and <code className="text-cyan-300 font-mono">orders</code>.
              </p>
            </div>
          )}

          {/* Status feedback */}
          {statusMessage && (
            <div
              className={`p-3 rounded-md text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
                  : 'bg-rose-950/60 border border-rose-800 text-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-medium text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{selectedMode === 'mysql' ? 'Connect MySQL' : 'Use Built-in'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
