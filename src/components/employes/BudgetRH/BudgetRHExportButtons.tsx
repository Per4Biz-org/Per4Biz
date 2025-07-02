import React from 'react';
import { FileText, FileSpreadsheet } from 'lucide-react';
import styles from './styles.module.css';
import { BudgetData } from '../../../hooks/employes/useBudgetRHCalculations';
import * as XLSX from 'xlsx';

interface BudgetRHExportButtonsProps {
  data: BudgetData[];
  year: string;
  entiteName: string;
}

export function BudgetRHExportButtons({ data, year, entiteName }: BudgetRHExportButtonsProps) {
  // Mois de l'année
  const months = [
    'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'
  ];

  // Exporter en Excel
  const handleExportExcel = () => {
    // Préparer les données pour l'export
    const exportData = data.map(row => ({
      'Restaurant': row.entite_libelle,
      'Fonction': row.fonction_libelle,
      'Employé': `${row.prenom} ${row.nom}`,
      'Sous-catégorie': row.sous_categorie_libelle,
      'Janvier': row.janvier || 0,
      'Février': row.fevrier || 0,
      'Mars': row.mars || 0,
      'Avril': row.avril || 0,
      'Mai': row.mai || 0,
      'Juin': row.juin || 0,
      'Juillet': row.juillet || 0,
      'Août': row.aout || 0,
      'Septembre': row.septembre || 0,
      'Octobre': row.octobre || 0,
      'Novembre': row.novembre || 0,
      'Décembre': row.decembre || 0,
      'Total': row.total || 0
    }));

    // Créer un workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Budget RH');
    
    // Générer le fichier Excel
    XLSX.writeFile(wb, `Budget_RH_${year}_${entiteName.replace(/\s+/g, '_')}.xlsx`);
  };

  // Exporter en PDF (simulé - dans une application réelle, utilisez une bibliothèque comme jsPDF)
  const handleExportPDF = () => {
    alert('Fonctionnalité d\'export PDF à implémenter avec une bibliothèque comme jsPDF');
    // Dans une implémentation réelle:
    // 1. Utiliser jsPDF ou une autre bibliothèque
    // 2. Formater les données pour le PDF
    // 3. Générer et télécharger le PDF
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExportExcel}
        className={`${styles.exportButton} ${styles.excelButton}`}
        title="Exporter en Excel"
      >
        <FileSpreadsheet size={18} />
        Excel
      </button>
      
      <button
        onClick={handleExportPDF}
        className={`${styles.exportButton} ${styles.pdfButton}`}
        title="Exporter en PDF"
      >
        <FileText size={18} />
        PDF
      </button>
    </div>
  );
}