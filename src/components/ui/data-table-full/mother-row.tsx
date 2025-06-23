import React from 'react';
import { Pencil, Trash2, Loader } from 'lucide-react';
import styles from './data-table-full.module.css';

interface Column<T> {
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

interface MotherRowProps<T, U> {
  motherRow: T;
  motherColumns: Column<T>[];
  childColumns: Column<U>[];
  actions?: Action<T>[];
  childActions?: Action<U>[];
  isLoading: boolean;
  hasChildren: boolean;
  children?: React.ReactNode;
}

export function MotherRow<T extends { id: string | number }, U extends { id: string | number }>({
  motherRow,
  motherColumns,
  childColumns,
  actions,
  childActions,
  isLoading,
  hasChildren,
  children
}: MotherRowProps<T, U>) {
  if (!hasChildren && !isLoading) {
    return (
      <tr className={styles.row}>
        {actions && (
          <td className={styles.actionsCell}>
            <div className="flex gap-2">
              {actions.map((action, actionIndex) => {
                const IconComponent = action.icon === 'edit' ? Pencil : Trash2;
                return (
                  <div
                    key={actionIndex}
                    className={styles.actionIcon}
                    onClick={() => action.onClick(motherRow)}
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
        {motherColumns.map(column => (
          <td
            key={`mother-${motherRow.id}-${String(column.accessor)}`}
            className={`${styles.cell} ${styles.motherCell} ${column.align ? styles[column.align] : ''}`}
          >
            {column.render
              ? column.render(motherRow[column.accessor], motherRow)
              : motherRow[column.accessor]?.toString()}
          </td>
        ))}
        <td className={`${styles.cell} ${styles.childCell}`} colSpan={childColumns.length + (childActions ? 1 : 0)}>
          {isLoading ? (
            <div className={styles.loadingChildren}>
              <Loader size={16} className="animate-spin mr-2 inline-block" />
              Chargement...
            </div>
          ) : (
            <div className={styles.noChildData}>
              Aucune donnée associée
            </div>
          )}
        </td>
      </tr>
    );
  }

  if (isLoading) {
    return (
      <tr className={styles.row}>
        {actions && (
          <td className={styles.actionsCell}>
            <div className="flex gap-2">
              {actions.map((action, actionIndex) => {
                const IconComponent = action.icon === 'edit' ? Pencil : Trash2;
                return (
                  <div
                    key={actionIndex}
                    className={styles.actionIcon}
                    onClick={() => action.onClick(motherRow)}
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
        {motherColumns.map(column => (
          <td
            key={`mother-${motherRow.id}-${String(column.accessor)}`}
            className={`${styles.cell} ${styles.motherCell} ${column.align ? styles[column.align] : ''}`}
          >
            {column.render
              ? column.render(motherRow[column.accessor], motherRow)
              : motherRow[column.accessor]?.toString()}
          </td>
        ))}
        <td className={`${styles.cell} ${styles.childCell}`} colSpan={childColumns.length + (childActions ? 1 : 0)}>
          <div className={styles.loadingChildren}>
            <Loader size={16} className="animate-spin mr-2 inline-block" />
            Chargement...
          </div>
        </td>
      </tr>
    );
  }

  return <>{children}</>;
}