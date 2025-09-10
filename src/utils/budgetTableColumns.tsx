import React from 'react';
import { Column } from '../components/ui/data-table-full';
import { useTranslation } from 'react-i18next';

// Types pour les données de budget
export interface BudgetMensuel {
  id: number;
  id_entite: string;
  annee: number;
  mois: number;
  id_flux_categorie: string;
  montant_ht: number;
  montant_ttc: number;
  nb_jours_ouverts: number | null;
  nb_couverts: number | null;
  prix_moyen_couvert: number | null;
  commentaire: string | null;
  created_at: string;
  entite: {
    code: string;
    libelle: string;
  };
  categorie: {
    code: string;
    libelle: string;
    type_flux: string;
  };
}

export interface BudgetMensuelDetail {
  id: number;
  id_ca_budget_mensuel: number;
  id_type_service: string;
  id_flux_sous_categorie: string;
  montant_ht: number;
  montant_ttc: number;
  nb_couverts: number | null;
  prix_moyen_couvert: number | null;
  nb_jours_ouverts: number | null;
  commentaire: string | null;
  created_at: string;
  type_service: {
    code: string;
    libelle: string;
  };
  sous_categorie: {
    code: string;
    libelle: string;
  };
}

/**
 * Retourne le nom du mois à partir de son numéro
 * @param monthNumber Numéro du mois (1-12)
 * @param t Função de tradução
 * @returns Nom du mois traduzido
 */
export const getMonthName = (monthNumber: number, t?: any): string => {
  if (!t) {
    // Fallback para francês se não houver tradução
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[monthNumber - 1] || monthNumber.toString();
  }

  const monthKeys = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  
  const monthKey = monthKeys[monthNumber - 1];
  return monthKey ? t(`parametersFinances.budgetTracking.table.months.${monthKey}`) : monthNumber.toString();
};

/**
 * Définition des colonnes pour la table mère (budgets mensuels)
 */
export const getBudgetMotherColumns = (t?: any): Column<BudgetMensuel>[] => [
  {
    label: t ? t('parametersFinances.budgetTracking.table.columns.entity') : 'Entité',
    width: '80px',
    accessor: 'entite',
    sortable: true,
    render: (value) => value.code
  },
  {
    label: t ? t('parametersFinances.budgetTracking.table.columns.year') : 'Année',
    width: '70px',
    accessor: 'annee',
    sortable: true,
    align: 'center'
  },
  {
    label: t ? t('parametersFinances.budgetTracking.table.columns.month') : 'Mois',
    width: '100px',
    accessor: 'mois',
    sortable: true,
    render: (value) => getMonthName(value, t)
  },
  {
    label: t ? t('parametersFinances.budgetTracking.table.columns.category') : 'Catégorie',
    width: '100px',
    accessor: 'categorie',
    sortable: true,
    render: (value) => value.code
  },
  {
    label: t ? t('parametersFinances.budgetTracking.table.columns.type') : 'Type',
    width: '90px',
    accessor: 'categorie',
    render: (value) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        value.type_flux === 'produit' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
      }`}>
        {value.type_flux === 'produit' 
          ? (t ? t('parametersFinances.budgetTracking.table.types.product') : 'Produit')
          : (t ? t('parametersFinances.budgetTracking.table.types.charge') : 'Charge')
        }
      </span>
    )
  },
  {
    label: t ? t('parametersFinances.budgetTracking.table.columns.amountHT') : 'Montant HT',
    width: '120px',
    accessor: 'montant_ht',
    align: 'right',
    render: (value) => `${Number(value).toFixed(2)} €`
  },
  {
    label: t ? t('parametersFinances.budgetTracking.table.columns.amountTTC') : 'Montant TTC',
    width: '120px',
    accessor: 'montant_ttc',
    align: 'right',
    render: (value) => `${Number(value).toFixed(2)} €`
  }
];

/**
 * Définition des colonnes pour la table enfant (détails des budgets mensuels)
 */
export const getBudgetChildColumns = (t?: any): Column<BudgetMensuelDetail>[] => [
  {
    label: t ? t('parametersFinances.budgetTracking.table.columns.serviceType') : 'Type de service',
    width: '120px',
    accessor: 'type_service',
    render: (value) => value.code
  },
  {
    label: t ? t('parametersFinances.budgetTracking.table.columns.subCategory') : 'Sous-catégorie',
    width: '120px',
    accessor: 'sous_categorie',
    render: (value) => value.code
  },
  {
    label: t ? t('parametersFinances.budgetTracking.table.columns.amountHT') : 'Montant HT',
    width: '120px',
    accessor: 'montant_ht',
    align: 'right',
    render: (value) => `${Number(value).toFixed(2)} €`
  },
  {
    label: t ? t('parametersFinances.budgetTracking.table.columns.amountTTC') : 'Montant TTC',
    width: '120px',
    accessor: 'montant_ttc',
    align: 'right',
    render: (value) => `${Number(value).toFixed(2)} €`
  },
  {
    label: t ? t('parametersFinances.budgetTracking.table.columns.openDays') : 'Jours ouverts',
    width: '100px',
    accessor: 'nb_jours_ouverts',
    align: 'center',
    render: (value) => {
      if (!value) return '-';
      if (!t) return `${value} jour${value > 1 ? 's' : ''}`;
      
      const dayUnit = value === 1 
        ? t('parametersFinances.budgetTracking.table.units.day')
        : t('parametersFinances.budgetTracking.table.units.days');
      return `${value} ${dayUnit}`;
    }
  },
  {
    label: t ? t('parametersFinances.budgetTracking.table.columns.covers') : 'Couverts',
    width: '90px',
    accessor: 'nb_couverts',
    align: 'center',
    render: (value) => value ? value.toString() : '-'
  },
  {
    label: t ? t('parametersFinances.budgetTracking.table.columns.averagePrice') : 'Prix moyen',
    width: '100px',
    accessor: 'prix_moyen_couvert',
    align: 'right',
    render: (value) => value ? `${Number(value).toFixed(2)} €` : '-'
  },
];