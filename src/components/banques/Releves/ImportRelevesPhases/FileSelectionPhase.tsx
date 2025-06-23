import React from 'react';
import { Form, FormField } from '../../../ui/form';
import { Button } from '../../../ui/button';
import { Dropdown, DropdownOption } from '../../../ui/dropdown';
import { AlertTriangle } from 'lucide-react';
import { FormatImport } from '../../../../utils/excelImportUtils';

interface FileSelectionPhaseProps {
  formats: FormatImport[];
  selectedFormatId: string;
  selectedFile: File | null;
  fileNameExistsError: boolean;
  isProcessingFile: boolean;
  importErrors: string[];
  onFormatChange: (value: string) => void;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FileSelectionPhase({
  formats,
  selectedFormatId,
  selectedFile,
  fileNameExistsError,
  isProcessingFile,
  importErrors,
  onFormatChange,
  onFileSelect
}: FileSelectionPhaseProps) {
  // Formater les options de format pour le dropdown
  const formatOptions: DropdownOption[] = [
    { value: '', label: 'Sélectionner un format d\'import' },
    ...formats.map(format => ({
      value: format.id.toString(),
      label: `${format.code} - ${format.banque} (${format.libelle})`
    }))
  ];

  // Récupérer le format sélectionné
  const selectedFormat = formats.find(f => f.id.toString() === selectedFormatId);
  
  // Formater le séparateur pour l'affichage
  const formatSeparateur = (sep: string) => {
    switch(sep) {
      case '\t': 
      case '\\t': return 'Tabulation';
      case ';': return 'Point-virgule (;)';
      case ',': return 'Virgule (,)';
      case '|': return 'Pipe (|)';
      default: return sep;
    }
  };
  return (
    <div className="space-y-6">
      <Form size={100}>
        <FormField
          label="Format d'import"
          required
          description="Sélectionnez le format correspondant à votre fichier"
        >
          <Dropdown
            options={formatOptions}
            value={selectedFormatId}
            onChange={onFormatChange}
            label="Sélectionner un format"
            size="md"
            disabled={isProcessingFile}
          />
        </FormField>
        {selectedFormat && (
          <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-1">Informations sur le format sélectionné</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li><strong>Séparateur:</strong> {formatSeparateur(selectedFormat.separateur)}</li>
              <li><strong>Encodage:</strong> {selectedFormat.encodage}</li>
              <li><strong>Première ligne de données:</strong> {selectedFormat.premiere_ligne_donnees}</li>
              <li><strong>Colonnes:</strong> {selectedFormat.colonnes?.length || 0} colonnes définies</li>
            </ul>
            <p className="mt-2 text-sm text-blue-800 font-medium">
              Assurez-vous que votre fichier CSV utilise bien le séparateur {formatSeparateur(selectedFormat.separateur)}.
            </p>
          </div>
        )}

        <FormField
          label="Fichier à importer"
          required
          description="Formats acceptés: CSV, TXT, TSV, XLS, XLSX"
          error={fileNameExistsError ? 'Un fichier avec ce nom a déjà été importé' : undefined}
        >
          <div className="flex items-center gap-4">
            <input
              id="file-input"
              type="file"
              accept=".csv,.txt,.tsv,.xls,.xlsx"
              onChange={onFileSelect}
              className="hidden"
              disabled={isProcessingFile || !selectedFormatId}
            />
            <Button
              label={selectedFile ? selectedFile.name : "Sélectionner un fichier"}
              icon={selectedFile ? "FileText" : "Upload"}
              color="var(--color-primary)"
              onClick={() => document.getElementById('file-input')?.click()}
              disabled={isProcessingFile || !selectedFormatId}
            />
            {isProcessingFile && (
              <span className="text-blue-600 flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyse en cours...
              </span>
            )}
          </div>
        </FormField>
      </Form>

      {importErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-900 mb-2">Erreurs détectées</h3>
              <ul className="text-sm text-red-700 space-y-1">
                {importErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-900 mb-2">Informations sur l'import</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Sélectionnez d'abord un format d'import correspondant à votre banque</li>
              <li>• Le fichier doit être au format CSV, TXT, TSV, XLS ou XLSX</li>
              <li>• Le nom du fichier doit être unique pour éviter les doublons</li>
              <li>• <strong>Pour les fichiers CSV</strong>: Assurez-vous que le séparateur de colonnes est bien {selectedFormat ? formatSeparateur(selectedFormat.separateur) : 'celui défini dans le format'}</li>
              <li>• <strong>Les colonnes et leur ordre</strong> doivent correspondre exactement à ceux définis dans le format d'import</li>
              <li>• Chaque colonne a un type défini (date, texte, montant) qui détermine comment elle sera traitée</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}