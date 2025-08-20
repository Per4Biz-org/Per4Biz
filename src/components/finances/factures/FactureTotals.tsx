import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface FactureTotalsProps {
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  totalLignesHT: number;
  isTotalMismatch: boolean;
}

export function FactureTotals({
  montantHT,
  montantTVA,
  montantTTC,
  totalLignesHT,
  isTotalMismatch
}: FactureTotalsProps) {
  const { t } = useTranslation();
  
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="flex justify-between">
        {/* Total des lignes analytiques */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 w-64 flex flex-col">
          <div className="text-sm font-medium text-gray-700 mb-2">{t('invoices.form.analyticalLinesTotal')}</div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">{t('invoices.form.totalHT')}</span>
            <span className="text-sm font-bold">
              {totalLignesHT.toFixed(2)} €
            </span>
          </div>
        </div>
        
        {/* Totaux de la facture */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 w-64">
          <div className="text-sm font-medium text-gray-700 mb-2">{t('invoices.form.invoiceTotals')}</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium text-gray-500">{t('invoices.form.totalHT')}</div>
            <div className="text-sm text-right font-bold">
              {montantHT.toFixed(2)} €
            </div>
            
            <div className="text-sm font-medium text-gray-500">{t('invoices.form.totalVAT')}</div>
            <div className="text-sm text-right font-bold">
              {montantTVA.toFixed(2)} €
            </div>
            
            <div className="text-sm font-medium text-gray-500 border-t pt-1">{t('invoices.form.totalTTC')}</div>
            <div className="text-sm text-right font-bold border-t pt-1">
              {montantTTC.toFixed(2)} €
            </div>
          </div>
        </div>
      </div>
      
      {/* Alerte si incohérence dans les totaux */}
      {isTotalMismatch && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <span>
              Le montant HT saisi : {montantHT.toFixed(2)} €, diffère du total des lignes : {totalLignesHT.toFixed(2)} €. 
              La différence est de : {Math.abs(montantHT - totalLignesHT).toFixed(2)} €
            </span>
          </div>
          <p className="mt-1 ml-7 text-xs text-red-600 font-medium">
            Cette différence n'autorise pas l'enregistrement de la facture.
          </p>
        </div>
      )}
    </div>
  );
}