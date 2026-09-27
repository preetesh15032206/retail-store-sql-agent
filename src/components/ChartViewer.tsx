import React, { useState } from 'react';
import {
  BarChart2,
  PieChart as PieChartIcon,
  TrendingUp
} from 'lucide-react';
import { ExecutionResult, ChartType } from '../../shared/types.ts';

interface ChartViewerProps {
  result: ExecutionResult;
  initialChartType?: ChartType;
}

const PALETTE = [
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#6366f1', // indigo-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#8b5cf6', // violet-500
  '#14b8a6', // teal-500
  '#f97316'  // orange-500
];

export const ChartViewer: React.FC<ChartViewerProps> = ({ result, initialChartType }) => {
  const [chartType, setChartType] = useState<'bar' | 'donut'>(
    initialChartType === 'donut' || initialChartType === 'pie' ? 'donut' : 'bar'
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const analysis = result.analysis;
  const defaultX = analysis?.xColumn || result.columns[0];
  const defaultY = analysis?.yColumn || analysis?.numericColumns.find((c: string) => !/id$/i.test(c)) || analysis?.numericColumns[0] || result.columns[1];

  const [xCol, setXCol] = useState<string>(defaultX || '');
  const [yCol, setYCol] = useState<string>(defaultY || '');

  const data = result.rows;
  if (!data || data.length === 0 || !xCol || !yCol) {
    return null;
  }

  // Extract chart points (limit to top 15 for readability)
  const chartData = data.slice(0, 15).map((row: Record<string, any>, idx: number) => {
    const rawX = row[xCol];
    const rawY = row[yCol];
    return {
      label: rawX !== null && rawX !== undefined ? String(rawX) : ('Row ' + (idx + 1)),
      value: Number(rawY) || 0,
      original: row
    };
  });

  const maxValue = Math.max(...chartData.map((d: any) => d.value), 1);
  const totalValue = chartData.reduce((acc: number, cur: any) => acc + cur.value, 0);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
      {/* Chart Header Bar */}
      <div className="px-3.5 sm:px-5 py-3 border-b border-slate-800/80 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-100">
              Data Visualization
            </h3>
            <p className="text-[11px] text-slate-400">
              Plotting <strong className="text-slate-300 font-mono">{yCol}</strong> by{' '}
              <strong className="text-slate-300 font-mono">{xCol}</strong>
            </p>
          </div>
        </div>

        {/* Chart Configuration Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* Chart Type Selector */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800">
            <button
              onClick={() => setChartType('bar')}
              className={'px-2 sm:px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ' + (
                chartType === 'bar' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Bar</span>
            </button>
            <button
              onClick={() => setChartType('donut')}
              className={'px-2 sm:px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ' + (
                chartType === 'donut' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>Donut</span>
            </button>
          </div>

          {/* Metric Selector */}
          {result.columns.length > 2 && (
            <select
              value={yCol}
              onChange={e => setYCol(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 sm:px-2.5 py-1 text-xs text-slate-300 focus:outline-hidden font-mono cursor-pointer max-w-[130px] sm:max-w-none truncate"
            >
              {result.columns.map((c: string) => (
                <option key={c} value={c}>
                  Value: {c}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="p-4 sm:p-6">
        {chartType === 'bar' ? (
          <div className="space-y-3">
            {chartData.map((item: any, idx: number) => {
              const pct = (item.value / maxValue) * 100;
              const isHovered = hoveredIndex === idx;
              const color = PALETTE[idx % PALETTE.length];

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300 truncate max-w-[200px] sm:max-w-md">
                      {item.label}
                    </span>
                    <span className="font-mono text-cyan-300 tabular-nums font-semibold shrink-0 ml-2">
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-5 sm:h-6 w-full bg-slate-950/80 rounded-md overflow-hidden p-0.5 border border-slate-800/80">
                    <div
                      style={{
                        width: Math.max(pct, 2) + '%',
                        backgroundColor: color
                      }}
                      className={'h-full rounded-sm transition-all duration-300 ' + (isHovered ? 'brightness-125' : '')}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Donut / Pie Breakdown Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Visual SVG Donut */}
            <div className="flex justify-center">
              <svg viewBox="0 0 200 200" className="w-44 h-44 sm:w-52 sm:h-52 -rotate-90">
                {(() => {
                  let accumulated = 0;
                  return chartData.map((item: any, idx: number) => {
                    const ratio = totalValue > 0 ? item.value / totalValue : 0;
                    const strokeDasharray = (ratio * 502.65) + ' 502.65';
                    const strokeDashoffset = -accumulated * 502.65;
                    accumulated += ratio;
                    const color = PALETTE[idx % PALETTE.length];

                    return (
                      <circle
                        key={idx}
                        cx="100"
                        cy="100"
                        r="80"
                        fill="transparent"
                        stroke={color}
                        strokeWidth="24"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    );
                  });
                })()}
              </svg>
            </div>

            {/* Legend Breakdown */}
            <div className="space-y-1.5 sm:space-y-2 max-h-56 overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-slate-800">
              {chartData.map((item: any, idx: number) => {
                const ratio = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
                const color = PALETTE[idx % PALETTE.length];
                const isHovered = hoveredIndex === idx;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={'flex items-center justify-between p-2 rounded-lg border transition-colors text-xs ' + (
                      isHovered
                        ? 'bg-slate-800 border-slate-700'
                        : 'bg-slate-950/60 border-slate-850'
                    )}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-xs shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-slate-300 truncate">{item.label}</span>
                    </div>
                    <div className="font-mono text-right shrink-0">
                      <span className="text-slate-200 tabular-nums font-semibold">
                        {item.value.toLocaleString()}
                      </span>
                      <span className="text-slate-500 text-[10px] ml-1 sm:ml-1.5 tabular-nums">
                        ({ratio.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
