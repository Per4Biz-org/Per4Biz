import React from 'react';
import styles from './styles.module.css';
import { BudgetData } from '../../../hooks/employes/useBudgetRHCalculations';

interface BudgetRHFooterProps {
  data: BudgetData[];
  months: string[];
}

export function BudgetRHFooter({ data, months }: BudgetRHFooterProps) {
  // Calculer les totaux
  const totals = {
    ...months.reduce((acc, month) => ({
      ...acc,
      [month]: data.reduce((sum, row) => sum + (row[month] || 0), 0)
    }), {}),
    total: data.reduce((sum, row) => sum + (row.total || 0), 0)
  };

  return (
    <tr className={styles.footerRow}>
      <td className={styles.footerCell} colSpan={4}>
        <strong>TOTAL</strong>
      </td>
      
      {months.map(month => (
        <td key={month} className={`${styles.footerCell} ${styles.right}`}>
          {totals[month] ? `${totals[month].toFixed(2)} €` : '-'}
        </td>
      ))}
      
      <td className={`${styles.footerCell} ${styles.right} ${styles.totalColumn}`}>
        {totals.total ? `${totals.total.toFixed(2)} €` : '-'}
      </td>
    </tr>
  );
}