import React, { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, FileX, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../button';
import styles from './data-table.module.css';

export interface Column<T> {
  label: string;
  accessor: keyof T;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

interface Action<T> {
  label: string;
  icon: 'edit' | 'delete';
  onClick: (row: T) => void;
  color?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  actions?: Action<T>[];
  compact?: boolean;
  rowsPerPageOptions?: (number | 'all')[];
  defaultRowsPerPage?: number;
  className?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  customRowClassName?: (row: T, index: number) => string;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  actions,
  compact = false,
  rowsPerPageOptions = [10, 25, 50, 'all'],
  defaultRowsPerPage = 10,
  className = '',
  emptyTitle = 'Aucune donnée',
  emptyMessage = 'Aucune donnée à afficher pour le moment',
  customRowClassName,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(-1);
  const [isKeyboardNavActive, setIsKeyboardNavActive] = useState(false);

  // Tri des données
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue === bValue) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  // Pagination
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return rowsPerPage === -1 ? sortedData : sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const totalPages = rowsPerPage === -1 ? 1 : Math.ceil(data.length / rowsPerPage);

  // Gestionnaires d'événements
  const handleSort = useCallback((column: Column<T>) => {
    if (!column.sortable) return;

    setSortConfig(current => ({
      key: column.accessor,
      direction: current.key === column.accessor && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleRowsPerPageChange = useCallback((newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
    setSelectedRowIndex(-1);
  }, []);

  // Navegação por teclado
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isKeyboardNavActive || paginatedData.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedRowIndex(prev => 
          prev < paginatedData.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedRowIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (currentPage > 1) {
          handlePageChange(currentPage - 1);
          setSelectedRowIndex(0);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (currentPage < totalPages) {
          handlePageChange(currentPage + 1);
          setSelectedRowIndex(0);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedRowIndex >= 0 && actions && actions.length > 0) {
          actions[0].onClick(paginatedData[selectedRowIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setSelectedRowIndex(-1);
        setIsKeyboardNavActive(false);
        break;
    }
  }, [isKeyboardNavActive, paginatedData, selectedRowIndex, currentPage, totalPages, handlePageChange, actions]);

  // Event listeners para navegação por teclado
  React.useEffect(() => {
    if (isKeyboardNavActive) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, isKeyboardNavActive]);

  // Reset selection quando dados mudam
  React.useEffect(() => {
    setSelectedRowIndex(-1);
  }, [data, currentPage, rowsPerPage]);

  const handleTableClick = useCallback(() => {
    setIsKeyboardNavActive(true);
    if (selectedRowIndex === -1 && paginatedData.length > 0) {
      setSelectedRowIndex(0);
    }
  }, [selectedRowIndex, paginatedData.length]);

  const displayedRange = useMemo(() => {
    if (rowsPerPage === -1) {
      return `Tous les ${data.length} résultats`;
    }
    const start = (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(currentPage * rowsPerPage, data.length);
    return `${start} - ${end} sur ${data.length} résultats`;
  }, [currentPage, rowsPerPage, data.length]);

  const shouldShowPagination = data.length > 10;

  if (data.length === 0) {
    return (
      <div className={styles.empty}>
        <FileX size={48} className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>{emptyTitle}</h3>
        <p className={styles.emptyMessage}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className={styles.dataCount}>
        {data.length} {data.length > 1 ? 'éléments' : 'élément'}
      </div>
      <div 
        className="relative focus:outline-none"
        tabIndex={0}
        onClick={handleTableClick}
        onFocus={handleTableClick}
      >
        {isKeyboardNavActive && (
          <div className="absolute top-2 right-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded z-10">
            ↑↓ navegar • ←→ páginas • Enter ação • Esc sair
          </div>
        )}
        <table className={`${styles.table} ${compact ? styles.compact : ''}`}>
        <thead className={styles.header}>
          <tr>
            {columns.map(column => (
              <th
                key={String(column.accessor)}
                className={`${styles.headerCell} ${
                  sortConfig.key === column.accessor ? styles.sortActive : ''
                } ${column.align ? styles[column.align] : ''}`}
                style={column.width ? { width: column.width } : undefined}
                onClick={() => handleSort(column)}
              >
                {column.label}
                {column.sortable && (
                  <span className={styles.sortIcon}>
                    {sortConfig.key === column.accessor ? (
                      sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </span>
                )}
              </th>
            ))}
            {actions && <th className={styles.headerCell}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, index) => (
            <tr 
              key={row.id} 
              className={`${styles.row} ${customRowClassName ? customRowClassName(row, index) : ''} ${
                selectedRowIndex === index && isKeyboardNavActive ? styles.selectedRow : ''
              }`}
              onClick={() => {
                setSelectedRowIndex(index);
                setIsKeyboardNavActive(true);
              }}
            >
              {columns.map(column => (
                <td
                  key={`${row.id}-${String(column.accessor)}`}
                  className={`${styles.cell} ${column.align ? styles[column.align] : ''}`}
                >
                  {column.render
                    ? column.render(row[column.accessor], row)
                    : row[column.accessor]?.toString()}
                </td>
              ))}
              {actions && (
                <td className={styles.actionsCell}>
                  <div className="flex gap-2">
                    {actions.map((action, actionIndex) => {
                      const IconComponent = action.icon === 'edit' ? Pencil : Trash2;
                      return (
                        <div
                          key={actionIndex}
                          className={styles.actionIcon}
                          onClick={() => action.onClick(row)}
                          style={{ color: action.color }}
                          title={action.label}
                        >
                          <IconComponent size={18} />
                        </div>
                      );
                    })}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
        </table>
      </div>

      {shouldShowPagination && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            <span className="text-sm text-gray-600">
              {displayedRange}
            </span>
          </div>

          <div className={styles.paginationControls}>
            <select
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:border-blue-500"
              value={rowsPerPage === -1 ? 'all' : rowsPerPage}
              onChange={(e) => handleRowsPerPageChange(e.target.value === 'all' ? -1 : Number(e.target.value))}
            >
              {rowsPerPageOptions.map(option => (
                <option key={option} value={option === 'all' ? 'all' : option}>
                  {option === 'all' ? 'Todos' : option.toString()}
                </option>
              ))}
            </select>

            <div className="flex items-center">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="mx-3 text-sm text-gray-700">
                {currentPage} / {totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}