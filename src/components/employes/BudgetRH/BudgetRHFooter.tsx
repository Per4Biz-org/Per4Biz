import styles from './styles.module.css';
import { BudgetData } from '../../../hooks/employes/useBudgetRHCalculations';

interface BudgetRHFooterProps {
  data: BudgetData[];
  months: string[];
}

export function BudgetRHFooter({ data, months }: BudgetRHFooterProps) {
  // Calculer les totaux par mois
  const monthlyTotals: { [key: string]: number } = {};
  months.forEach(month => {
    monthlyTotals[month] = data.reduce((sum, row) => sum + ((row as any)[month] || 0), 0);
  });
  
  const totals: { [key: string]: number } = {
    ...monthlyTotals,
    total: data.reduce((sum, row) => sum + (row.total || 0), 0)
  };

  return (
    <tr className={styles.footerRow}>
      <td className={styles.footerCell} colSpan={4}>
        <strong>TOTAL</strong>
      </td>
      
      {months.map(month => (
        <td key={month} className={`${styles.footerCell} ${styles.right}`}>
          {totals[month] ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(totals[month]) : '-'}
        </td>
      ))}
      
      <td className={`${styles.footerCell} ${styles.right} ${styles.totalColumn}`}>
        {totals.total ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(totals.total) : '-'}
      </td>
    </tr>
  );
}