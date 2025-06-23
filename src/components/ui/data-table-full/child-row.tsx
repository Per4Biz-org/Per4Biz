import React from 'react';
import { Pencil, Trash2, Calculator } from 'lucide-react';
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

interface ChildRowProps<T, U> {
  motherRow: T;
  childRow: U;
  motherColumns: Column<T>[];
  childColumns: Column<U>[];
  actions?: Action<T>[];
  childActions?: Action<U>[];
  showMotherRow: boolean;
}

export function ChildRow<T extends { id: string | number }, U extends { id: string | number }>({
  motherRow,
  childRow,
  motherColumns,
  childColumns,
  actions,
  childActions,
  showMotherRow
}: ChildRowProps<T, U>) {
  const isSubtotalRow = (childRow as any).isSubtotalRow;

  if (showMotherRow) {
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
            key={`mother-${motherRow.id}-child-${childRow.id}-${String(column.accessor)}`}
            className={`${styles.cell} ${styles.motherCell} ${column.align ? styles[column.align] : ''}`}
          >
            {column.render
              ? column.render(motherRow[column.accessor], motherRow)
              : motherRow[column.accessor]?.toString()}
          </td>
        ))}
        {childActions && (
          <td className={styles.childActionsCell}>
            <div className="flex gap-2">
              {!isSubtotalRow && childActions.map((action, actionIndex) => {
                const IconComponent = action.icon === 'edit' ? Pencil : Trash2;
                return (
                  <div
                    key={actionIndex}
                    className={styles.actionIcon}
                    onClick={() => action.onClick(childRow)}
                    style={{ color: action.color }}
                    title={action.label}
                  >
                    <IconComponent size={16} />
                  </div>
                );
              })}
            </div>
          </td>
        )}
        {childColumns.map(column => (
          <td
            key={`child-${childRow.id}-${String(column.accessor)}`}
            className={`${styles.cell} ${styles.childCell} ${column.align ? styles[column.align] : ''}`}
            style={isSubtotalRow ? { fontWeight: 'bold', backgroundColor: 'rgba(59, 130, 246, 0.1)' } : {}}
          >
            {isSubtotalRow && column.accessor === childColumns[0].accessor ? (
              <div className="flex items-center">
                <Calculator size={14} className="mr-2 text-blue-500" />
                <span>Total</span>
              </div>
            ) : (
              column.render
                ? column.render(childRow[column.accessor], childRow)
                : childRow[column.accessor]?.toString()
            )}
          </td>
        ))}
      </tr>
    );
  }

  return (
    <tr className={styles.row}>
      {actions && <td className={styles.actionsCell} rowSpan={1}></td>}
      {motherColumns.map((column, colIndex) => (
        <td 
          key={`empty-mother-${colIndex}`} 
          className={`${styles.cell} ${styles.motherCell}`} 
          rowSpan={1}
        >
          {/* Cellule intentionnellement vide */}
        </td>
      ))}
      {childActions && (
        <td className={styles.childActionsCell}>
          <div className="flex gap-2">
            {!isSubtotalRow && childActions.map((action, actionIndex) => {
              const IconComponent = action.icon === 'edit' ? Pencil : Trash2;
              return (
                <div
                  key={actionIndex}
                  className={styles.actionIcon}
                  onClick={() => action.onClick(childRow)}
                  style={{ color: action.color }}
                  title={action.label}
                >
                  <IconComponent size={16} />
                </div>
              );
            })}
          </div>
        </td>
      )}
      {childColumns.map(column => (
        <td
          key={`child-${childRow.id}-${String(column.accessor)}`}
          className={`${styles.cell} ${styles.childCell} ${column.align ? styles[column.align] : ''}`}
          style={isSubtotalRow ? { fontWeight: 'bold', backgroundColor: 'rgba(59, 130, 246, 0.1)' } : {}}
        >
          {isSubtotalRow && column.accessor === childColumns[0].accessor ? (
            <div className="flex items-center">
              <Calculator size={14} className="mr-2 text-blue-500" />
              <span>Total</span>
            </div>
          ) : (
            column.render
              ? column.render(childRow[column.accessor], childRow)
              : childRow[column.accessor]?.toString()
          )}
        </td>
      ))}
    </tr>
  );
}