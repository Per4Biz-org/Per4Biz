import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import styles from './styles.module.css';
import { BudgetData } from '../../../hooks/employes/useBudgetRHCalculations';

export interface BudgetRHLineProps {
  data: BudgetData;
  months: string[];
  isCollapsed?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  isCollapsed?: boolean;
  isParentCollapsed?: boolean;
  onToggleCollapse?: () => void;
  showToggle?: boolean;
}

export function BudgetRHLine({ 
  data, 
  months, 
  isCollapsed = false,
  isParentCollapsed = false,
  onToggleCollapse,
  showToggle = false
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
  
  // Déterminer si la ligne peut être pliée/dépliée
  const isToggleable = data.type === 'entite' || data.type === 'fonction' || data.type === 'personnel';
  
  // Icône de pliage/dépliage
  const renderToggleIcon = () => {
    if (!isToggleable) return null;
    
    if (data.type === 'personnel') {
      // Pour le personnel, on utilise l'état d'expansion
      return isExpanded ? 
        <ChevronDown size={16} className={styles.toggleIcon} /> : 
        <ChevronRight size={16} className={styles.toggleIcon} />;
    } else {
      // Pour les entités et fonctions, on utilise l'état de collapse
      return isCollapsed ? 
        <ChevronRight size={16} className={styles.toggleIcon} /> : 
        <ChevronDown size={16} className={styles.toggleIcon} />;
    }
  };
  
  // Déterminer si on doit afficher le toggle pour ce type de ligne
  const shouldShowToggle = showToggle && ['entite', 'fonction', 'personnel'].includes(data.type || '');
  
  // Gérer le clic sur l'icône de toggle
  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleCollapse) {
      onToggleCollapse();
    }
  };

  return (
    <tr className={`${styles.row} ${getRowClass()}`}>
      <td className={styles.cell}>
        <div className="flex items-center">
          {isToggleable && (
            <span 
              className={styles.toggleButton} 
              onClick={(e) => {
                e.stopPropagation();
                onToggle?.();
              }}
            >
              {renderToggleIcon()}
            </span>
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