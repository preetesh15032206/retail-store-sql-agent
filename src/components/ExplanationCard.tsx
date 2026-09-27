import React, { useState } from 'react';
import {
  Lightbulb,
  Table,
  GitFork,
  Filter,
  Sigma,
  ChevronDown,
  ChevronUp,
  BookOpen
} from 'lucide-react';
import { QueryExplanation } from '../../shared/types.ts';

interface ExplanationCardProps {
  explanation: QueryExplanation;
}

export const ExplanationCard: React.FC<ExplanationCardProps> = ({ explanation }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Query Breakdown & Business Interpretation
            </h3>
            <p className="text-[11px] text-slate-400">
              Plain-English explanation of the underlying SQL mechanics
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-5 space-y-4 text-xs font-sans">
          {/* Executive Summary */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80">
            <div className="flex items-start gap-2.5">
              <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-200 text-xs uppercase tracking-wider block mb-1">
                  Business Interpretation:
                </span>
                <p className="text-slate-300 leading-relaxed text-xs">
                  {explanation.businessInsight || explanation.plainEnglishSummary}
                </p>
              </div>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Tables Used */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-1.5 font-medium text-slate-200 mb-2">
                <Table className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tables & Scope</span>
              </div>
              <ul className="space-y-1 text-slate-400 pl-4 list-disc text-xs">
                {explanation.tablesUsed.map((t, idx) => (
                  <li key={idx}>
                    <strong className="text-slate-300 font-mono">{t.table}</strong>: {t.purpose}
                  </li>
                ))}
              </ul>
            </div>

            {/* Joins Applied */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-1.5 font-medium text-slate-200 mb-2">
                <GitFork className="w-3.5 h-3.5 text-emerald-400" />
                <span>Join Relationships</span>
              </div>
              <ul className="space-y-1 text-slate-400 pl-4 list-disc text-xs">
                {explanation.joinsApplied.length > 0 ? (
                  explanation.joinsApplied.map((join, idx) => (
                    <li key={idx}>{join}</li>
                  ))
                ) : (
                  <li className="text-slate-500 italic">No multi-table joins required for this query.</li>
                )}
              </ul>
            </div>

            {/* Filters */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-1.5 font-medium text-slate-200 mb-2">
                <Filter className="w-3.5 h-3.5 text-blue-400" />
                <span>Filters & Criteria (WHERE / HAVING)</span>
              </div>
              <ul className="space-y-1 text-slate-400 pl-4 list-disc text-xs">
                {explanation.filtersApplied.length > 0 ? (
                  explanation.filtersApplied.map((filter, idx) => (
                    <li key={idx}>{filter}</li>
                  ))
                ) : (
                  <li className="text-slate-500 italic">No restrictive filters applied.</li>
                )}
              </ul>
            </div>

            {/* Aggregations & Sorting */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-1.5 font-medium text-slate-200 mb-2">
                <Sigma className="w-3.5 h-3.5 text-amber-400" />
                <span>Aggregation & Ordering</span>
              </div>
              <ul className="space-y-1 text-slate-400 pl-4 list-disc text-xs">
                {[...explanation.aggregations, ...explanation.groupingAndSorting].length > 0 ? (
                  [...explanation.aggregations, ...explanation.groupingAndSorting].map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))
                ) : (
                  <li className="text-slate-500 italic">Direct row retrieval.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
