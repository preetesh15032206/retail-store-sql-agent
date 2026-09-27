import React, { useState } from 'react';
import { Sparkles, CornerDownLeft, Loader2, ArrowUpRight, Search, Terminal } from 'lucide-react';

interface QueryInputProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const EXAMPLE_QUERIES = [
  'Top 5 customers by total spending',
  'Total revenue by product category',
  'Average order value and order count',
  'Products with price above ₹15,000',
  'Customers in Pune and Mumbai',
  'Highest spending order with customer name'
];

export const QueryInput: React.FC<QueryInputProps> = ({ onSubmit, isLoading, disabled }) => {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading || disabled) return;
    onSubmit(question.trim());
  };

  const handleSelectExample = (example: string) => {
    setQuestion(example);
    onSubmit(example);
  };

  return (
    <div className="space-y-3">
      {/* Studio Search Bar */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/30 transition-all overflow-hidden p-1.5 sm:pl-4 gap-2 sm:gap-0">
          <div className="flex items-center pl-2 sm:pl-0 flex-1 min-w-0">
            <div className="text-cyan-400 shrink-0 mr-2">
              <Terminal className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              disabled={isLoading || disabled}
              placeholder="Ask in plain English (e.g. 'Top 5 customers by revenue')..."
              className="w-full bg-transparent py-2 sm:py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-hidden disabled:opacity-50 min-w-0"
            />
          </div>
          <div className="flex items-center justify-end shrink-0">
            <button
              type="submit"
              disabled={!question.trim() || isLoading || disabled}
              className="w-full sm:w-auto px-4 py-2 sm:py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating SQL...</span>
                </>
              ) : (
                <>
                  <span>Generate SQL</span>
                  <CornerDownLeft className="w-3 h-3 text-cyan-200 hidden sm:inline" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Suggested Quick Prompts with touch-scrollable row on mobile */}
      <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-800">
        <span className="text-slate-400 text-xs font-medium shrink-0 hidden sm:inline mr-1">
          Suggested:
        </span>
        {EXAMPLE_QUERIES.map((query, i) => (
          <button
            key={i}
            onClick={() => handleSelectExample(query)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs whitespace-nowrap shrink-0 active:scale-95"
          >
            <span>{query}</span>
            <ArrowUpRight className="w-3 h-3 text-slate-500 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};
