import React from 'react';
import { DataTableAnnee, ColumnAnnee } from './DataTableAnnee';
import { BudgetRHTableHeader } from './BudgetRHTableHeader';
import { BudgetRHFooter } from './BudgetRHFooter';
import { BudgetRHLine } from './BudgetRHLine';
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
      width: '150px'
    },
    {
      label: 'Fonction',
      accessor: 'fonction_libelle',
      width: '150px'
    },
    {
      label: 'Employé',
      accessor: row => `${row.prenom} ${row.nom}`,
      width: '180px'
    },
    {
      label: 'Sous-catégorie',
      accessor: 'sous_categorie_libelle',
      width: '180px'
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
    if (row.type === 'fonction') return 'bg-gray-100';
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