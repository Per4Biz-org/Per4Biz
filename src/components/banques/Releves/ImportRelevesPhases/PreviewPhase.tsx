import React, { useState } from 'react';
import { Button } from '../../../ui/button';
import { Check, ChevronDown, ChevronUp, Calculator } from 'lucide-react';

interface PreviewPhaseProps {
  parsedData: any[];
  isImportingData: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

export function PreviewPhase({
  parsedData,
  isImportingData,
  onBack,
  onConfirm
}: PreviewPhaseProps) {
  // Pas de tri par défaut pour conserver l'ordre du fichier
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); 
  
  const headers = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];
  
  // Calculer les totaux pour les colonnes valor et saldo
  const totals = React.useMemo(() => {
    if (parsedData.length === 0) return {};
    
    const result: Record<string, number> = {};
    
    // Identifier les colonnes numériques (valor et saldo)
    const numericColumns = ['valor', 'VALOR', 'saldo', 'SALDO', 'montant', 'MONTANT', 'solde', 'SOLDE'];
    
    // Pour chaque ligne de données
    parsedData.forEach(row => {
      // Pour chaque colonne de la ligne
      Object.entries(row).forEach(([key, value]) => {
        // Si c'est une colonne numérique (valor ou saldo)
        if (numericColumns.some(col => key.toLowerCase().includes(col.toLowerCase()))) {
          // Convertir en nombre si nécessaire
          const numValue = typeof value === 'number' ? value : parseFloat(value as string);
          
          // Si c'est un nombre valide, l'ajouter au total
          if (!isNaN(numValue)) {
            if (!result[key]) result[key] = 0;
            result[key] += numValue;
          }
        }
      });
    });
    
    return result;
  }, [parsedData]);
  
  // Tri des données
  const sortedData = React.useMemo(() => {
    // Si aucun tri n'est spécifié, retourner les données dans l'ordre original
    if (!sortColumn) return parsedData;
    
    return [...parsedData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      // Gestion des valeurs null/undefined
      if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? -1 : 1;
      if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? 1 : -1;
      
      // Tri selon le type de données
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Conversion en chaîne pour le tri
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      
      return sortDirection === 'asc' 
        ? aString.localeCompare(bString)
        : bString.localeCompare(aString);
    });
  }, [parsedData, sortColumn, sortDirection]);
  
  // Gestion du tri
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Inverser la direction si on clique sur la même colonne
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Nouvelle colonne, tri ascendant par défaut
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  // Fonction pour formater les valeurs numériques au format 0000,00
  const formatNumber = (value: any): string => {
    if (value === null || value === undefined || value === '') return '-';
    
    // Si c'est déjà un nombre
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
    
    // Vérifier si c'est un nombre valide
    if (isNaN(num)) return String(value);
    
    // Formater avec une virgule comme séparateur décimal et sans séparateur de milliers
    return num.toFixed(2).replace('.', ',');
  };
  
  // Fonction pour formater les numéros de compte en supprimant les zéros non significatifs
  const formatAccountNumber = (value: any): string => {
    if (value === null || value === undefined || value === '') return '-';
    
    // Convertir en chaîne
    const valueStr = String(value);
    
    // Supprimer les zéros non significatifs à gauche
    const normalized = valueStr.replace(/^0+/, '');
    
    return normalized || '0'; // Retourner '0' si la chaîne est vide après normalisation
  };
  
  // Vérifier si une colonne est une colonne de date
  const isDateColumn = (header: string): boolean => {
    const dateColumns = ['data_lancamento', 'data_valor', 'date', 'date_valeur'];
    return dateColumns.some(col => header.toLowerCase().includes(col.toLowerCase()));
  };
  
  // Vérifier si une colonne est une colonne numérique
  const isNumericColumn = (header: string): boolean => {
    const numericColumns = ['valor', 'saldo', 'montant', 'solde'];
    return numericColumns.some(col => header.toLowerCase() === col.toLowerCase() || 
                                      header.toLowerCase().includes(col.toLowerCase()));
  };
  
  // Vérifier si une colonne est une colonne de compte bancaire
  const isAccountColumn = (header: string): boolean => {
    const accountColumns = ['conta', 'compte', 'account', 'iban'];
    return accountColumns.some(col => header.toLowerCase() === col.toLowerCase() || 
                                      header.toLowerCase().includes(col.toLowerCase()));
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-900 mb-2">Fichier analysé avec succès</h3>
            <p className="text-sm text-green-700">
              {parsedData.length} ligne(s) trouvée(s) dans le fichier.
              Vérifiez que les colonnes ont été correctement mappées avant de confirmer l'import.
            </p>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-medium text-gray-700">
            Aperçu des données ({parsedData.length} lignes)
          </h3>
        </div>
        <div className="overflow-x-auto max-h-[50vh]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort(header)}
                  >
                    <div className="flex items-center">
                      {header}
                      {sortColumn === header && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 relative">
              {sortedData.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {headers.map((header, cellIndex) => {
                    // Déterminer comment afficher la valeur selon le type de colonne
                    let displayValue: string;
                    
                    if (isDateColumn(header) && row[header]) {
                      // Pour les dates, utiliser toLocaleDateString
                      try {
                        const date = new Date(row[header]);
                        if (!isNaN(date.getTime())) {
                          displayValue = date.toLocaleDateString('fr-FR');
                        } else {
                          displayValue = row[header] || '-';
                        }
                      } catch (e) {
                        displayValue = row[header] || '-';
                      }
                    } else if (isNumericColumn(header)) {
                      // Formater les nombres avec virgule comme séparateur décimal
                      displayValue = formatNumber(row[header]);
                    } else if (isAccountColumn(header)) {
                      // Formater les numéros de compte en supprimant les zéros non significatifs
                      displayValue = formatAccountNumber(row[header]);
                    } else {
                      // Pour les autres colonnes, afficher la valeur telle quelle
                      displayValue = typeof row[header] === 'object' 
                        ? JSON.stringify(row[header]) 
                        : (row[header] || '-');
                    }
                    
                    return (
                      <td
                        key={`${rowIndex}-${cellIndex}`}
                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${
                          isNumericColumn(header) ? 'text-right' : ''
                        }`}
                      >
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
              
              {/* Ligne de total */}
              {parsedData.length > 0 && (
                <tr className="bg-blue-50 font-semibold sticky bottom-0">
                  {headers.map((header, cellIndex) => {
                    // Pour la première colonne, afficher "TOTAL"
                    if (cellIndex === 0) {
                      return (
                        <td key={`total-${cellIndex}`} className="px-6 py-4 whitespace-nowrap text-sm text-blue-700 font-bold">
                          <div className="flex items-center">
                            <Calculator size={16} className="mr-2" />
                            TOTAL
                          </div>
                        </td>
                      );
                    }
                    
                    // Pour les colonnes numériques (valor et saldo), afficher le total
                    if (isNumericColumn(header) && totals[header] !== undefined) {
                      return (
                        <td 
                          key={`total-${cellIndex}`} 
                          className="px-6 py-4 whitespace-nowrap text-sm text-blue-700 font-bold text-right"
                        >
                          {formatNumber(totals[header])}
                        </td>
                      );
                    }
                    
                    // Pour les colonnes de date, ne pas afficher de total
                    if (isDateColumn(header)) {
                      return (
                        <td key={`total-${cellIndex}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          -
                        </td>
                      );
                    }
                    
                    // Pour les autres colonnes non-numériques, afficher un tiret
                    return (
                      <td key={`total-${cellIndex}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        -
                      </td>
                    );
                  })}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          label="Retour"
          color="#6B7280"
          onClick={onBack}
          disabled={isImportingData}
        />
        <Button
          label="Confirmer l'import"
          icon="Database"
          color="var(--color-primary)"
          onClick={onConfirm}
          disabled={isImportingData || parsedData.length === 0}
        />
      </div>
    </div>
  );
}