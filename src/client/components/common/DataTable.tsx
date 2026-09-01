import React, { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';

export interface Column<T> {
  header: string;
  accessor?: keyof T | string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  filtersSlot?: React.ReactNode;
  actionsSlot?: React.ReactNode;
  pageSize?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchPlaceholder = 'Search records...',
  searchFilter,
  filtersSlot,
  actionsSlot,
  pageSize = 10,
  isLoading = false,
  emptyMessage = 'No operational records found',
  onRowClick,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || !searchFilter) return data;
    return data.filter((row) => searchFilter(row, searchQuery.trim()));
  }, [data, searchQuery, searchFilter]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a: any, b: any) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const res = aVal > bVal ? 1 : -1;
      return sortDirection === 'asc' ? res : -res;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !column.accessor) return;
    const colKey = String(column.accessor);
    if (sortColumn === colKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
      }
    } else {
      setSortColumn(colKey);
      setSortDirection('asc');
    }
  };

  return (
    <div className="bg-ops-surface border border-ops-border rounded-lg overflow-hidden shadow-panel">
      {/* Controls Bar */}
      {(searchFilter || filtersSlot || actionsSlot) && (
        <div className="p-3 border-b border-ops-border flex flex-wrap items-center justify-between gap-3 bg-ops-bg/70">
          <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
            {searchFilter && (
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-ops-dim absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-8.5 pr-3 py-1.5 bg-ops-surface border border-ops-border rounded-md text-xs text-ops-text placeholder:text-ops-dim focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition-colors font-sans"
                />
              </div>
            )}
            {filtersSlot}
          </div>
          {actionsSlot && <div className="flex items-center gap-2">{actionsSlot}</div>}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-ops-border bg-ops-bg text-[10px] font-mono font-bold text-ops-dim uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(col)}
                  className={`py-2.5 px-3.5 select-none ${col.sortable ? 'cursor-pointer hover:bg-ops-panel/80 hover:text-ops-text transition-colors' : ''} ${
                    col.className || ''
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-ops-dim">
                        {sortColumn === col.accessor ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ops-border/40 text-xs text-ops-text font-sans">
            {isLoading ? (
              Array.from({ length: Math.min(pageSize, 5) }).map((_, rIdx) => (
                <tr key={rIdx} className="bg-ops-surface">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="py-3 px-3.5">
                      <Skeleton className="h-4 w-3/4 bg-ops-panel" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-ops-dim">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Inbox className="w-8 h-8 text-ops-dim/40 stroke-[1.5]" />
                    <p className="text-xs font-mono text-ops-dim">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors ${
                    onRowClick
                      ? 'cursor-pointer hover:bg-ops-panel/70'
                      : 'hover:bg-ops-panel/40'
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`py-2.5 px-3.5 ${col.className || ''}`}>
                      {col.render
                        ? col.render(row)
                        : col.accessor
                        ? (row as any)[col.accessor]
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && sortedData.length > 0 && (
        <div className="px-4 py-2.5 border-t border-ops-border flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-ops-dim bg-ops-bg/80">
          <div>
            SHOWING <span className="font-bold text-ops-text">{(currentPage - 1) * pageSize + 1}</span> TO{' '}
            <span className="font-bold text-ops-text">{Math.min(currentPage * pageSize, sortedData.length)}</span> OF{' '}
            <span className="font-bold text-cyan-400">{sortedData.length}</span> RECORDS
          </div>
          {totalPages > 1 && (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-md bg-ops-surface border border-ops-border hover:bg-ops-panel disabled:opacity-30 disabled:hover:bg-ops-surface transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 py-0.5 rounded-md bg-ops-surface border border-ops-border font-bold text-ops-text shadow-2xs">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-md bg-ops-surface border border-ops-border hover:bg-ops-panel disabled:opacity-30 disabled:hover:bg-ops-surface transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
