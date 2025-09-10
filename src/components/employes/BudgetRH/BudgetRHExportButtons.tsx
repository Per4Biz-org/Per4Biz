import { FileText, FileSpreadsheet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './styles.module.css';
import { BudgetData } from '../../../hooks/employes/useBudgetRHCalculations';
import * as XLSX from 'xlsx';

interface BudgetRHExportButtonsProps {
  data: BudgetData[];
  year: string;
  entiteName: string;
}

export function BudgetRHExportButtons({ data, year, entiteName }: BudgetRHExportButtonsProps) {
  const { t } = useTranslation();

  // Exporter en Excel
  const handleExportExcel = () => {
    // Préparer les données pour l'export
    const exportData = data.map(row => ({
      [t('hrBudget.table.restaurant')]: row.entite_libelle,
      [t('hrBudget.table.function')]: row.fonction_libelle,
      [t('hrBudget.table.employee')]: `${row.prenom} ${row.nom}`,
      [t('hrBudget.table.subcategory')]: row.sous_categorie_libelle,
      [t('hrBudget.months.january')]: row.janvier || 0,
      [t('hrBudget.months.february')]: row.fevrier || 0,
      [t('hrBudget.months.march')]: row.mars || 0,
      [t('hrBudget.months.april')]: row.avril || 0,
      [t('hrBudget.months.may')]: row.mai || 0,
      [t('hrBudget.months.june')]: row.juin || 0,
      [t('hrBudget.months.july')]: row.juillet || 0,
      [t('hrBudget.months.august')]: row.aout || 0,
      [t('hrBudget.months.september')]: row.septembre || 0,
      [t('hrBudget.months.october')]: row.octobre || 0,
      [t('hrBudget.months.november')]: row.novembre || 0,
      [t('hrBudget.months.december')]: row.decembre || 0,
      [t('hrBudget.table.total')]: row.total || 0
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
    alert(t('hrBudget.export.pdfNotImplemented'));
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
        title={t('hrBudget.export.excel')}
      >
        <FileSpreadsheet size={18} />
        {t('hrBudget.export.excel')}
      </button>
      
      <button
        onClick={handleExportPDF}
        className={`${styles.exportButton} ${styles.pdfButton}`}
        title={t('hrBudget.export.pdf')}
      >
        <FileText size={18} />
        {t('hrBudget.export.pdf')}
      </button>
    </div>
  );
}