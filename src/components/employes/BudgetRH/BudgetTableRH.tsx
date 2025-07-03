import React from 'react';
import { ColumnAnnee } from './DataTableAnnee';
import { BudgetData } from '../../../hooks/employes/useBudgetRHCalculations';
import { BudgetRHLine } from './BudgetRHLine';
import { BudgetRHFooter } from './BudgetRHFooter';
import { useBudgetRHCollapse } from '../../../hooks/employes/useBudgetRHCollapse';
import { CollapseToggle } from './CollapseToggle';
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
              <th className={`${styles.headerCell} ${styles.restaurantColumn}`}>Restaurant</th>
              <th className={`${styles.headerCell} ${styles.fonctionColumn}`}>Fonction</th>
              <th className={`${styles.headerCell} ${styles.employeColumn}`}>Employé</th>
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
              const isEntiteRow = row.type === 'entite';
              const isFonctionRow = row.type === 'fonction';
              const isPersonnelRow = row.type === 'personnel';
              const isSousCategorieRow = row.type === 'sous_categorie';
              
              // Déterminer la classe CSS pour la ligne
              const rowClassName = isEntiteRow 
                ? `${styles.row} ${styles.categoryRow} ${styles.entiteRow}`
                : isFonctionRow 
                  ? `${styles.row} ${styles.fonctionRow}`
                  : isPersonnelRow 
                    ? `${styles.row} ${styles.personnelRow}`
                    : `${styles.row} ${styles.sousCategorieRow}`;
              
              // Déterminer si on doit afficher le nom du restaurant
              const showEntite = () => {
                if (index === 0) return true;
                if (isEntiteRow) return true;
                const prevRow = visibleRows[index - 1];
                return row.entite_id !== prevRow.entite_id;
              };
              
              // Déterminer si on doit afficher la fonction
              const showFonction = () => {
                if (index === 0) return true;
                if (isEntiteRow) return false;
                if (isFonctionRow) return true;
                const prevRow = visibleRows[index - 1];
                if (row.entite_id !== prevRow.entite_id) return true;
                return row.fonction_id !== prevRow.fonction_id;
              };
              
              // Déterminer si on doit afficher le nom de l'employé
              const showPersonnel = () => {
                if (index === 0) return true;
                if (isEntiteRow || isFonctionRow) return false;
                if (isPersonnelRow) return true;
                const prevRow = visibleRows[index - 1];
                if (row.entite_id !== prevRow.entite_id) return true;
                if (row.fonction_id !== prevRow.fonction_id) return true;
                return row.personnel_id !== prevRow.personnel_id;
              };
              
              return (
              isEntiteRow ? (
                <tr key={getLineId(row)} className={rowClassName}>
                  <td
                    colSpan={4}
                    className={`${styles.cell} ${styles.mergedEntiteCell}`}
                    onClick={() => toggleCollapse(getLineId(row))}
                  >
                    <div className="flex items-center">
                      <CollapseToggle 
                        isExpanded={isExpanded(getLineId(row), true)} 
                        onToggle={() => toggleCollapse(getLineId(row))} 
                        className="mr-2"
                      />
                      {row.entite_libelle}
                    </div>
                  </td>
                  {months.map(month => (
                    <td key={month} className={`${styles.cell} ${styles.right}`}>
                      {row[month] ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(row[month]) : '-'}
                    </td>
                  ))}
                  <td className={`${styles.cell} ${styles.right} ${styles.totalColumn}`}>
                    {row.total ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(row.total) : '-'}
                  </td>
                </tr>
              ) : (
                isFonctionRow ? (
                  <tr key={getLineId(row)} className={rowClassName}>
                    <td className={`${styles.cell}`} style={{ opacity: showEntite() ? 1 : 0 }}>
                      {showEntite() ? row.entite_libelle : ''}
                    </td>
                    <td 
                      colSpan={3} 
                      className={`${styles.cell} ${styles.mergedFonctionCell}`}
                      onClick={() => toggleCollapse(getLineId(row))}
                    >
                      <div className="flex items-center">
                        <CollapseToggle 
                          isExpanded={isExpanded(getLineId(row), true)} 
                          onToggle={() => toggleCollapse(getLineId(row))} 
                          className="mr-2"
                        />
                        {row.fonction_libelle}
                      </div>
                    </td>
                    {months.map(month => (
                      <td key={month} className={`${styles.cell} ${styles.right}`}>
                        {row[month] ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(row[month]) : '-'}
                      </td>
                    ))}
                    <td className={`${styles.cell} ${styles.right} ${styles.totalColumn}`}>
                      {row.total ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(row.total) : '-'}
                    </td>
                  </tr>
                ) : (
                  isPersonnelRow ? (
                    <tr key={getLineId(row)} className={rowClassName}>
                      <td className={`${styles.cell}`} style={{ opacity: showEntite() ? 1 : 0 }}>
                        {showEntite() ? row.entite_libelle : ''}
                      </td>
                      <td className={`${styles.cell}`} style={{ opacity: showFonction() ? 1 : 0 }}>
                        {showFonction() ? row.fonction_libelle : ''}
                      </td>
                      <td 
                        colSpan={2} 
                        className={`${styles.cell} ${styles.mergedPersonnelCell}`}
                        onClick={() => toggleCollapse(getLineId(row))}
                      >
                        <div className="flex items-center">
                          <CollapseToggle 
                            isExpanded={isExpanded(getLineId(row), false)} 
                            onToggle={() => toggleCollapse(getLineId(row))} 
                            className="mr-2"
                          />
                          {`${row.prenom || ''} ${row.nom || ''}`.trim()}
                        </div>
                      </td>
                      {months.map(month => (
                        <td key={month} className={`${styles.cell} ${styles.right}`}>
                          {row[month] ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(row[month]) : '-'}
                        </td>
                      ))}
                      <td className={`${styles.cell} ${styles.right} ${styles.totalColumn}`}>
                        {row.total ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(row.total) : '-'}
                      </td>
                    </tr>
                  ) : (
                    <tr key={getLineId(row)} className={rowClassName}>
                      <td className={`${styles.cell}`} style={{ opacity: showEntite() ? 1 : 0 }}>
                        {showEntite() ? row.entite_libelle : ''}
                      </td>
                      <td className={`${styles.cell}`} style={{ opacity: showFonction() ? 1 : 0 }}>
                        {showFonction() ? row.fonction_libelle : ''}
                      </td>
                      <td className={`${styles.cell}`} style={{ opacity: showPersonnel() ? 1 : 0 }}>
                        {showPersonnel() ? `${row.prenom || ''} ${row.nom || ''}`.trim() : ''}
                      </td>
                      <td className={`${styles.cell}`}>
                        {row.sous_categorie_libelle}
                      </td>
                      {months.map(month => (
                        <td key={month} className={`${styles.cell} ${styles.right}`}>
                          {row[month] ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(row[month]) : '-'}
                        </td>
                      ))}
                      <td className={`${styles.cell} ${styles.right} ${styles.totalColumn}`}>
                        {row.total ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(row.total) : '-'}
                      </td>
                    </tr>
                  )
                )
              )
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