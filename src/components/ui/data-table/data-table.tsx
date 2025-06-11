import React, { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, FileX, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../button';
import styles from './data-table.module.css';

export interface Column<T> {
  label: string;
  accessor: keyof T;
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
  }, []);

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
      <table className={`${styles.table} ${compact ? styles.compact : ''}`}>
        <thead className={styles.header}>
          <tr>
            {actions && <th className={styles.headerCell}>Actions</th>}
            {columns.map(column => (
              <th
                key={String(column.accessor)}
                className={`${styles.headerCell} ${
                  sortConfig.key === column.accessor ? styles.sortActive : ''
                } ${column.align ? styles[column.align] : ''}`}
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
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, index) => (
            <tr 
              key={row.id} 
              className={`${styles.row} ${customRowClassName ? customRowClassName(row, index) : ''}`}
            >
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
            </tr>
          ))}
        </tbody>
      </table>

      {shouldShowPagination && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            {displayedRange}
          </div>

          <div className={styles.paginationControls}>
            <Button
              size="sm"
              icon="ChevronsLeft"
              label=""
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            />
            <Button
              size="sm"
              icon="ChevronLeft"
              label=""
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            />
          
            <select
              className="mx-2 px-2 py-1 border rounded"
              value={rowsPerPage === -1 ? 'all' : rowsPerPage}
              onChange={(e) => handleRowsPerPageChange(e.target.value === 'all' ? -1 : Number(e.target.value))}
            >
              {rowsPerPageOptions.map(option => (
                <option key={option} value={option === 'all' ? 'all' : option}>
                  {option === 'all' ? 'Tout afficher' : `${option} par page`}
                </option>
              ))}
            </select>

            <Button
              size="sm"
              icon="ChevronRight"
              label=""
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            />
            <Button
              size="sm"
              icon="ChevronsRight"
              label=""
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            />
          </div>
        </div>
      )}
    </div>
  );
}