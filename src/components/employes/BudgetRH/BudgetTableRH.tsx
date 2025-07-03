import React from 'react';
import { DataTableAnnee, ColumnAnnee } from './DataTableAnnee';
import { BudgetData } from '../../../hooks/employes/useBudgetRHCalculations';

interface BudgetTableRHProps {
  data: BudgetData[];
  year: number;
}

export function BudgetTableRH({ data, year }: BudgetTableRHProps) {
  // Mois de l'année
  const months = [
    'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'
  ];
  
  // Colonnes fixes (avant les mois)
  const fixedColumns: ColumnAnnee<BudgetData>[] = [
    {
      label: 'Restaurant',
      accessor: 'entite_libelle',
      width: '150px',
      render: (value, row, previousRow) => {
        // Afficher le restaurant uniquement s'il est différent du précédent
        // ou si c'est une ligne de type 'entite'
        if (row.type === 'entite' || !previousRow || previousRow.entite_id !== row.entite_id) {
          return <span className="font-medium">{value}</span>;
        }
        return null; // Ne rien afficher si c'est le même restaurant
      }
    },
    {
      label: 'Fonction',
      accessor: 'fonction_libelle',
      width: '150px',
      render: (value, row, previousRow) => {
        // Afficher la fonction uniquement s'il s'agit d'une nouvelle fonction
        // ou si c'est une ligne de type 'fonction'
        if (row.type === 'fonction' || 
            !previousRow || 
            previousRow.fonction_id !== row.fonction_id ||
            previousRow.entite_id !== row.entite_id) {
          return value;
        }
        return null; // Ne rien afficher si c'est la même fonction
      }
    },
    {
      label: 'Employé',
      accessor: row => row.prenom && row.nom ? `${row.prenom} ${row.nom}` : '',
      width: '180px',
      render: (value, row, previousRow) => {
        // Afficher l'employé uniquement s'il s'agit d'un nouvel employé
        // ou si c'est une ligne de type 'personnel'
        if (row.type === 'personnel' || 
            !previousRow || 
            previousRow.personnel_id !== row.personnel_id ||
            previousRow.fonction_id !== row.fonction_id ||
            previousRow.entite_id !== row.entite_id) {
          return value;
        }
        return null; // Ne rien afficher si c'est le même employé
      }
    },
    {
      label: 'Sous-catégorie',
      accessor: 'sous_categorie_libelle',
      width: '180px',
      render: (value, row, previousRow) => {
        // Toujours afficher la sous-catégorie car c'est l'information la plus détaillée
        return value;
      }
    }
  ];
  
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
  
  // Déterminer la classe CSS pour chaque ligne
  const getRowClassName = (row: BudgetData, index: number): string => {
    if (row.type === 'entite') return 'bg-blue-50 font-semibold';
    if (row.type === 'fonction') return 'bg-gray-100 font-medium';
    if (row.type === 'personnel') return '';
    if (row.type === 'sous_categorie') return 'bg-gray-50 italic';
    return '';
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <DataTableAnnee
        data={data}
        columns={fixedColumns}
        monthColumns={months}
        totalColumn="total"
        getRowClassName={getRowClassName}
        footerData={calculateFooterData()}
      />
    </div>
  );
}