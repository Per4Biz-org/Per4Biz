import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import styles from './data-table-full.module.css';

interface Column<T> {
  label: string;
  accessor: keyof T;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

interface TableHeaderProps<T, U> {
  motherColumns: Column<T>[];
  childColumns: Column<U>[];
  sortConfig: {
    key: keyof T | null;
    direction: 'asc' | 'desc';
  };
  handleSort: (column: Column<T>) => void;
  hasActions: boolean;
  hasChildActions: boolean;
}

export function TableHeader<T, U>({
  motherColumns,
  childColumns,
  sortConfig,
  handleSort,
  hasActions,
  hasChildActions
}: TableHeaderProps<T, U>) {
  return (
    <thead className={styles.header}>
      <tr>
        {hasActions && <th className={styles.headerCell}>Actions</th>}
        {motherColumns.map(column => (
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
        {hasChildActions && <th className={styles.headerCell}>Actions</th>}
        {childColumns.map(column => (
          <th
            key={String(column.accessor)}
            className={`${styles.headerCell} ${column.align ? styles[column.align] : ''}`}
            style={column.width ? { width: column.width } : undefined}
          >
            {column.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}