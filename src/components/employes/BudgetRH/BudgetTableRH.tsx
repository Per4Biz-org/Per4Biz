import React from 'react';
import { ColumnAnnee } from './DataTableAnnee';
import { BudgetData } from '../../../hooks/employes/useBudgetRHCalculations';
import { BudgetRHLine } from './BudgetRHLine';
import { BudgetRHFooter } from './BudgetRHFooter';
import { useBudgetRHCollapse } from '../../../hooks/employes/useBudgetRHCollapse';
import styles from './styles.module.css';

interface BudgetTableRHProps {
  data: BudgetData[];
  year: number;
}

export function BudgetTableRH({ data, year }: BudgetTableRHProps) {
  // Utiliser le hook de pliage/dépliage
  const { 
    isExpanded, 
    toggleCollapse, 
    initializeCollapseState 
  } = useBudgetRHCollapse();

  // Initialiser l'état de pliage au chargement des données
  React.useEffect(() => {
    initializeCollapseState(data);
  }, [data, initializeCollapseState]);

  // Mois de l'année
  const months = [
    'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'
  ];
  
  // Fonction pour générer un ID unique pour chaque ligne
  const getLineId = (row: BudgetData): string => {
    if (row.type === 'entite') {
      return `entite-${row.entite_id}`;
    } else if (row.type === 'fonction') {
      return `fonction-${row.entite_id}-${row.fonction_id}`;
    } else if (row.type === 'personnel') {
      return `personnel-${row.entite_id}-${row.fonction_id}-${row.personnel_id}`;
    } else {
      return `sous-categorie-${row.entite_id}-${row.fonction_id}-${row.personnel_id}-${row.sous_categorie_id}`;
    }
  };

  // Fonction pour déterminer si une ligne doit être affichée
  const shouldShowRow = (row: BudgetData): boolean => {
    if (row.type === 'entite') {
      // Les entités sont toujours affichées
      return true;
    } else if (row.type === 'fonction') {
      // Les fonctions sont affichées si leur entité est dépliée
      const entiteId = `entite-${row.entite_id}`;
      return isExpanded(entiteId, true);
    } else if (row.type === 'personnel') {
      // Les employés sont affichés si leur fonction est dépliée
      const entiteId = `entite-${row.entite_id}`;
      const fonctionId = `fonction-${row.entite_id}-${row.fonction_id}`;
      return isExpanded(entiteId, true) && isExpanded(fonctionId, true);
    } else if (row.type === 'sous_categorie') {
      // Les sous-catégories sont affichées si leur employé est déplié
      const entiteId = `entite-${row.entite_id}`;
      const fonctionId = `fonction-${row.entite_id}-${row.fonction_id}`;
      const personnelId = `personnel-${row.entite_id}-${row.fonction_id}-${row.personnel_id}`;
      return isExpanded(entiteId, true) && isExpanded(fonctionId, true) && isExpanded(personnelId, false);
    }
    return true;
  };

  // Calculer les totaux pour le pied de tableau
  const calculateFooterData = (): BudgetData => {
    const footerData: any = {
      entite_libelle: 'TOTAL',
      fonction_libelle: '',
      nom: '',
      prenom: '',
      sous_categorie_libelle: '',
      total: 0
    };
    
    // Initialiser les totaux pour chaque mois
    months.forEach(month => {
      footerData[month] = 0;
    });
    
    // Calculer les totaux
    data.forEach(row => {
      // Total annuel
      footerData.total += row.total || 0;
      
      // Totaux mensuels
      months.forEach(month => {
        footerData[month] += row[month] || 0;
      });
    });
    
    return footerData as BudgetData;
  };

  // Filtrer les lignes à afficher
  const visibleRows = data.filter(shouldShowRow);
  
  // Calculer les totaux
  const footerData = calculateFooterData();
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
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
          </thead>
          <tbody>
            {visibleRows.map((row, index) => {
              // Récupérer la ligne précédente pour comparer
              const previousRow = index > 0 ? visibleRows[index - 1] : null;
              
              return (
              <BudgetRHLine
                key={getLineId(row)}
                data={row}
                months={months}
                isExpanded={isExpanded(getLineId(row), row.type === 'entite' || row.type === 'fonction')}
                onToggle={() => toggleCollapse(getLineId(row))}
                showToggle={row.type !== 'sous_categorie'}
                previousRow={previousRow}
              />
            )})}
          </tbody>
          <tfoot>
            <BudgetRHFooter data={data} months={months} />
          </tfoot>
        </table>
      </div>
    </div>
  );
}