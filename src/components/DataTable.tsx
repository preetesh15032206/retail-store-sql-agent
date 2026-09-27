import React, { useState, useMemo } from 'react';
import {
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Database,
  Check
} from 'lucide-react';
import { ExecutionResult } from '../../shared/types.ts';

interface DataTableProps {
  result: ExecutionResult;
}

export const DataTable: React.FC<DataTableProps> = ({ result }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [copiedCsv, setCopiedCsv] = useState(false);

  // Sorting handler
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filtered and Sorted Rows
  const processedRows = useMemo(() => {
    let rows = [...result.rows];

    // Filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter(row =>
        Object.values(row).some(val =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(q)
        )
      );
    }

    // Sort
    if (sortColumn) {
      rows.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];

        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        const numA = Number(valA);
        const numB = Number(valB);

        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDirection === 'asc' ? numA - numB : numB - numA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
        if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return rows;
  }, [result.rows, searchTerm, sortColumn, sortDirection]);

  // Pagination calculation
  const totalPages = Math.ceil(processedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, currentPage, pageSize]);

  // Export to CSV
  const handleExportCsv = () => {
    if (result.rows.length === 0) return;
    const headers = result.columns.join(',');
    const rows = result.rows.map(row =>
      result.columns
        .map(col => {
          const val = row[col];
          if (val === null || val === undefined) return '""';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query_result_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isNumericValue = (val: any) => {
    if (val === null || val === undefined || val === '') return false;
    return !isNaN(Number(val));
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
      {/* Table Action Bar */}
      <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-100">
              Query Results
            </span>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              ({result.rowCount} rows · {result.executionTimeMs}ms)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter results..."
              className="bg-slate-900 border border-slate-800 rounded-md pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-slate-700 w-36 sm:w-48"
            />
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            className="px-3 py-1 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Data View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
              {result.columns.map(col => {
                const isSorted = sortColumn === col;
                return (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="px-4 py-3 cursor-pointer hover:text-slate-200 hover:bg-slate-800/40 transition-colors select-none font-mono"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col}</span>
                      {isSorted ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-cyan-400" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-cyan-400" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-60" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={result.columns.length}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  {searchTerm ? 'No matching rows found.' : 'Query returned 0 rows.'}
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-slate-800/40 transition-colors text-slate-300"
                >
                  {result.columns.map(col => {
                    const val = row[col];
                    const isNum = isNumericValue(val);
                    return (
                      <td
                        key={col}
                        className={`px-4 py-2.5 truncate max-w-xs ${
                          isNum ? 'font-mono text-cyan-200 tabular-nums' : ''
                        }`}
                      >
                        {val !== null && val !== undefined ? String(val) : (
                          <span className="text-slate-600 italic">null</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <strong className="text-slate-200 tabular-nums">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-slate-200 tabular-nums">
              {Math.min(currentPage * pageSize, processedRows.length)}
            </strong>{' '}
            of <strong className="text-slate-200 tabular-nums">{processedRows.length}</strong> rows
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono tabular-nums text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
