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
  previousRow?: BudgetData | null;
}

export function BudgetRHLine({ 
  data, 
  months, 
  isExpanded, 
  onToggle,
  showToggle = true,
  previousRow = null
}: BudgetRHLineProps) {
  // Déterminer la classe CSS en fonction du type de ligne
  const getRowClass = () => {
    switch (data.type) {
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

  // Déterminer si on doit afficher le nom du restaurant
  const showEntite = () => {
    if (!previousRow) return true;
    return data.entite_id !== previousRow.entite_id;
  };
  
  // Déterminer si on doit afficher la fonction
  const showFonction = () => {
    if (!previousRow) return true;
    if (data.entite_id !== previousRow.entite_id) return true;
    return data.fonction_id !== previousRow.fonction_id;
  };
  
  // Déterminer si on doit afficher le nom de l'employé
  const showPersonnel = () => {
    if (!previousRow) return true;
    if (data.entite_id !== previousRow.entite_id) return true;
    if (data.fonction_id !== previousRow.fonction_id) return true;
    return data.personnel_id !== previousRow.personnel_id;
  };
  
  // Formater le nom de l'employé
  const getEmployeeName = () => {
    if (!showPersonnel()) return '';
    if (!data.prenom && !data.nom) return '';
    return `${data.prenom || ''} ${data.nom || ''}`.trim();
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
          {showEntite() ? data.entite_libelle : ''}
        </div>
      </td>
      <td className={styles.cell}>
        {showFonction() ? data.fonction_libelle : ''}
      </td>
      <td className={styles.cell}>
        {getEmployeeName()}
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