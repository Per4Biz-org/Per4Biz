import React from 'react';
import styles from './styles.module.css';
import { BudgetData } from '../../../hooks/employes/useBudgetRHCalculations';
import { CollapseToggle } from './CollapseToggle';

interface BudgetRHLineProps {
  data: BudgetData;
  months: string[];
  isExpanded: boolean;
  onToggle: () => void;
  showToggle: boolean;
}

export function BudgetRHLine({ 
  data, 
  months, 
  isExpanded, 
  onToggle,
  showToggle = true
}: BudgetRHLineProps) {
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

  // Générer un ID unique pour cette ligne
  const getLineId = () => {
    if (data.type === 'entite') {
      return `entite-${data.entite_id}`;
    } else if (data.type === 'fonction') {
      return `fonction-${data.entite_id}-${data.fonction_id}`;
    } else if (data.type === 'personnel') {
      return `personnel-${data.entite_id}-${data.fonction_id}-${data.personnel_id}`;
    } else {
      return `sous-categorie-${data.entite_id}-${data.fonction_id}-${data.personnel_id}-${data.sous_categorie_id}`;
    }
  };

  return (
    <tr className={`${styles.row} ${getRowClass()}`}>
      <td className={styles.cell}>
        <div className="flex items-center">
          {showToggle && (
            <CollapseToggle 
              isExpanded={isExpanded} 
              onToggle={onToggle} 
              className="mr-2"
            />
          )}
          {data.entite_libelle}
        </div>
      </td>
      <td className={styles.cell}>
        {data.fonction_libelle}
      </td>
      <td className={styles.cell}>
        {data.prenom} {data.nom}
      </td>
      <td className={styles.cell}>
        {data.sous_categorie_libelle}
      </td>
      
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