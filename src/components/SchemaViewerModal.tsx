import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, FileCode, CheckCircle2 } from 'lucide-react';

interface SchemaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchemaViewerModal: React.FC<SchemaViewerModalProps> = ({ isOpen, onClose }) => {
  const [script, setScript] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch('/api/sample-sql-script')
        .then(res => res.text())
        .then(data => {
          setScript(data);
          setIsLoading(false);
        })
        .catch(err => {
          setScript(`-- Failed to load script: ${err.message}`);
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([script], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_database.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-200">
        {/* Header */}
        <div className="px-3.5 sm:px-5 py-3 sm:py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                SQL DDL & Seed Script
              </h3>
              <p className="text-[11px] text-slate-400">
                Tables, schema definitions, constraints, and mock store dataset
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

        {/* Script Viewer */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">Loading SQL script...</div>
          ) : (
            <pre className="overflow-x-auto whitespace-pre-wrap">{script}</pre>
          )}
        </div>

        {/* Action Footer */}
        <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            Compatible with MySQL 5.7+, MySQL 8.0, and TiDB Cloud
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy SQL'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .sql</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
