import React from 'react';
import styles from './styles.module.css';
import { BudgetData } from '../../../hooks/employes/useBudgetRHCalculations';

interface BudgetRHLineProps {
  data: BudgetData;
  months: string[];
}

export function BudgetRHLine({ data, months }: BudgetRHLineProps) {
  // Déterminer la classe CSS en fonction du type de ligne
  const getRowClass = () => {
    switch (data.type) {
      case 'entite':
        return styles.categoryRow;
      case 'fonction':
        return styles.categoryRow;
      case 'personnel':
        return styles.personnelRow;
      case 'sous_categorie':
        return styles.sousCategorieRow;
      default:
        return '';
    }
  };

  return (
    <tr className={`${styles.row} ${getRowClass()}`}>
      <td className={styles.cell}>{data.entite_libelle}</td>
      <td className={styles.cell}>{data.fonction_libelle}</td>
      <td className={styles.cell}>{data.prenom} {data.nom}</td>
      <td className={styles.cell}>{data.sous_categorie_libelle}</td>
      
      {months.map(month => (
        <td key={month} className={`${styles.cell} ${styles.right}`}>
          {data[month] ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(data[month]) : '-'}
        </td>
      ))}
      
      <td className={`${styles.cell} ${styles.right} ${styles.totalColumn}`}>
        {data.total ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(data.total) : '-'}
      </td>
    </tr>
  );
}