import React from 'react';
import styles from './styles.module.css';

interface BudgetRHTableHeaderProps {
  months: string[];
}

export function BudgetRHTableHeader({ months }: BudgetRHTableHeaderProps) {
  return (
    <tr>
      <th className={styles.headerCell}>Restaurant</th>
      <th className={styles.headerCell}>Fonction</th>
      <th className={styles.headerCell}>Employé</th>
      <th className={styles.headerCell}>Sous-catégorie</th>
      {months.map(month => (
        <th key={month} className={`${styles.headerCell} ${styles.right}`}>
          {month.charAt(0).toUpperCase() + month.slice(1)}
        </th>
      ))}
      <th className={`${styles.headerCell} ${styles.right} ${styles.totalColumn}`}>
        Total
      </th>
    </tr>
  );
}