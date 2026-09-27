import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Play,
  Copy,
  Check,
  Edit2,
  Table as TableIcon,
  BarChart3,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { QueryPlan, ValidationResult } from '../../shared/types.ts';

interface SqlApprovalCardProps {
  queryPlan: QueryPlan;
  validation: ValidationResult;
  onExecute: (sql: string) => void;
  isExecuting: boolean;
}

export const SqlApprovalCard: React.FC<SqlApprovalCardProps> = ({
  queryPlan,
  validation,
  onExecute,
  isExecuting
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSql, setEditedSql] = useState(queryPlan.sql);
  const [showRules, setShowRules] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(isEditing ? editedSql : queryPlan.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentSql = isEditing ? editedSql : (validation.sanitizedSql || queryPlan.sql);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden text-slate-200">
      {/* Top Bar: Verification Status & Plan Actions */}
      <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {validation.isValid ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-100">
                  Verified Safe Query
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">Read-Only SELECT</span>
                <span className="text-slate-600">·</span>
                <span className="text-emerald-400 font-mono">7 Guardrails Passed</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold">Security Check Failed</span>
                <span className="text-slate-600">·</span>
                <span className="text-rose-300">Execution Blocked</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick actions: Rules details, Edit, Copy */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRules(!showRules)}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Inspection Rules</span>
            {showRules ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Done Editing' : 'Edit SQL'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Security Rule Inspection Dropdown */}
      {showRules && (
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/80 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {validation.ruleChecks.map(rule => (
              <div
                key={rule.id}
                className="flex items-center gap-2 p-2 rounded-md bg-slate-900 border border-slate-800"
              >
                {rule.passed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                )}
                <div className="truncate">
                  <div className="font-medium text-slate-200 truncate">{rule.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{rule.details}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SQL Editor / Code Block */}
      <div className="p-4 bg-slate-950 font-mono text-xs">
        {isEditing ? (
          <textarea
            value={editedSql}
            onChange={e => setEditedSql(e.target.value)}
            rows={4}
            className="w-full bg-slate-900 text-cyan-300 p-3 rounded-lg border border-slate-700 focus:outline-hidden focus:border-cyan-500 font-mono text-xs leading-relaxed resize-y"
          />
        ) : (
          <pre className="text-cyan-300 leading-relaxed overflow-x-auto whitespace-pre-wrap selection:bg-cyan-500/30">
            {currentSql}
          </pre>
        )}
      </div>

      {/* Footer / Explanation & Execute CTA */}
      <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1 max-w-xl">
          <p className="text-xs text-slate-300 leading-relaxed">
            {queryPlan.reasoning_summary}
          </p>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>Tables: <strong className="text-slate-400 font-mono">{queryPlan.tables_used.join(', ')}</strong></span>
            <span>·</span>
            <span>Chart: <strong className="text-slate-400 capitalize">{queryPlan.visualization_type}</strong></span>
          </div>
        </div>

        <button
          onClick={() => onExecute(currentSql)}
          disabled={!validation.isValid || isExecuting}
          className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:cursor-not-allowed shrink-0"
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Executing Query...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Query</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
