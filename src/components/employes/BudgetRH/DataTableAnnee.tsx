import React from 'react';
import styles from './styles.module.css';

export interface ColumnAnnee<T> {
  label: string;
  accessor: keyof T | ((row: T) => any);
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, previousRow?: T | null) => React.ReactNode;
}

interface DataTableAnneeProps<T> {
  data: T[];
  columns: ColumnAnnee<T>[];
  monthColumns: string[];
  totalColumn: string;
  className?: string;
  getRowClassName?: (row: T, index: number) => string;
  footerData?: T | null;
}

export function DataTableAnnee<T>({
  data,
  columns,
  monthColumns,
  totalColumn,
  className = '',
  getRowClassName,
  footerData
}: DataTableAnneeProps<T>) {
  // Fonction pour accéder à la valeur d'une colonne
  const getColumnValue = (row: T, accessor: keyof T | ((row: T) => any)) => {
    if (typeof accessor === 'function') {
      return accessor(row);
    }
    return row[accessor];
  };

  // Fonction pour rendre une cellule
  const renderCell = (row: T, column: ColumnAnnee<T>) => {
    const value = getColumnValue(row, column.accessor);
    return column.render ? column.render(value, row) : value;
  };

  return (
    <div className={`${styles.tableContainer} ${className}`}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th 
                key={index} 
                className={`${styles.headerCell} ${column.align ? styles[column.align] : ''}`}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.label}
              </th>
            ))}
            {monthColumns.map((month) => (
              <th key={month} className={`${styles.headerCell} ${styles.right}`}>
                {month}
              </th>
            ))}
            <th className={`${styles.headerCell} ${styles.right} ${styles.totalColumn}`}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => {
            // Référence à la ligne précédente pour comparer les valeurs
            const previousRow = rowIndex > 0 ? data[rowIndex - 1] : null;
            
            return (
              <tr 
                key={rowIndex} 
                className={`${styles.row} ${getRowClassName ? getRowClassName(row, rowIndex) : ''}`}
              >
                {columns.map((column, colIndex) => (
                  <td 
                    key={colIndex} 
                    className={`${styles.cell} ${column.align ? styles[column.align] : ''}`}
                  >
                    {column.render 
                      ? column.render(getColumnValue(row, column.accessor), row, previousRow)
                      : getColumnValue(row, column.accessor)}
                  </td>
                ))}
                {monthColumns.map((month) => (
                  <td key={month} className={`${styles.cell} ${styles.right}`}>
                    {typeof row[month as keyof T] === 'number' 
                      ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(row[month as keyof T] as number)
                      : row[month as keyof T] || '-'}
                  </td>
                ))}
                <td className={`${styles.cell} ${styles.right} ${styles.totalColumn}`}>
                  {typeof row[totalColumn as keyof T] === 'number'
                    ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(row[totalColumn as keyof T] as number)
                    : row[totalColumn as keyof T] || '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
        {footerData && (
          <tfoot>
            <tr className={styles.footerRow}>
              {columns.map((column, colIndex) => (
                <td 
                  key={colIndex} 
                  className={`${styles.footerCell} ${column.align ? styles[column.align] : ''}`}
                >
                  {colIndex === 0 ? 'TOTAL' : renderCell(footerData, column)}
                </td>
              ))}
              {monthColumns.map((month) => (
                <td key={month} className={`${styles.footerCell} ${styles.right}`}>
                  {typeof footerData[month as keyof T] === 'number' 
                    ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(footerData[month as keyof T] as number)
                    : footerData[month as keyof T] || '-'}
                </td>
              ))}
              <td className={`${styles.footerCell} ${styles.right} ${styles.totalColumn}`}>
                {typeof footerData[totalColumn as keyof T] === 'number'
                  ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(footerData[totalColumn as keyof T] as number)
                  : footerData[totalColumn as keyof T] || '-'}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}