import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  // Formater les options de format pour le dropdown
  const formatOptions: DropdownOption[] = [
    { value: '', label: t('importModal.fileSelection.selectFormat') },
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
      case '\\t': return t('importModal.fileSelection.separators.tab');
      case ';': return t('importModal.fileSelection.separators.semicolon');
      case ',': return t('importModal.fileSelection.separators.comma');
      case '|': return t('importModal.fileSelection.separators.pipe');
      default: return sep;
    }
  };
  return (
    <div className="space-y-6">
      <Form size={100}>
        <FormField
          label={t('importModal.fileSelection.formatLabel')}
          required
          description={t('importModal.fileSelection.formatDescription')}
        >
          <Dropdown
            options={formatOptions}
            value={selectedFormatId}
            onChange={onFormatChange}
            label={t('importModal.fileSelection.selectFormat')}
            size="md"
            disabled={isProcessingFile}
          />
        </FormField>
        {selectedFormat && (
          <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-1">{t('importModal.fileSelection.formatInfo.title')}</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li><strong>{t('importModal.fileSelection.formatInfo.separator')}:</strong> {formatSeparateur(selectedFormat.separateur)}</li>
              <li><strong>{t('importModal.fileSelection.formatInfo.encoding')}:</strong> {selectedFormat.encodage}</li>
              <li><strong>{t('importModal.fileSelection.formatInfo.firstDataLine')}:</strong> {selectedFormat.premiere_ligne_donnees}</li>
              <li><strong>{t('importModal.fileSelection.formatInfo.columns')}:</strong> {selectedFormat.colonnes?.length || 0} {t('importModal.fileSelection.formatInfo.columns')}</li>
            </ul>
            <p className="mt-2 text-sm text-blue-800 font-medium">
              {t('importModal.fileSelection.formatInfo.csvNote', { separator: formatSeparateur(selectedFormat.separateur) })}
            </p>
          </div>
        )}

        <FormField
          label={t('importModal.fileSelection.fileLabel')}
          required
          description={t('importModal.fileSelection.fileDescription')}
          error={fileNameExistsError ? t('importModal.fileSelection.errors.fileExists') : undefined}
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
              label={selectedFile ? selectedFile.name : t('importModal.fileSelection.selectFile')}
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
{t('importModal.fileSelection.analyzing')}
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
              <h3 className="font-medium text-red-900 mb-2">{t('importModal.fileSelection.errors.title')}</h3>
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
            <h3 className="font-medium text-yellow-900 mb-2">{t('importModal.fileSelection.info.title')}</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>{t('importModal.fileSelection.info.selectFormat')}</li>
              <li>{t('importModal.fileSelection.info.fileFormat')}</li>
              <li>{t('importModal.fileSelection.info.uniqueName')}</li>
              <li>{t('importModal.fileSelection.info.csvSeparator', { separator: selectedFormat ? formatSeparateur(selectedFormat.separateur) : t('importModal.fileSelection.formatInfo.separator') })}</li>
              <li>{t('importModal.fileSelection.info.columnOrder')}</li>
              <li>{t('importModal.fileSelection.info.columnTypes')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}