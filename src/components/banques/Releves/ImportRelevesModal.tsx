import React, { useState, useEffect } from 'react';
import { useProfil } from '../../../context/ProfilContext';
import { supabase } from '../../../lib/supabase';
import { ToastData } from '../../ui/toast';
import {
  FormatImport,
  ImportOptions,
  checkFileExists,
  importExcelFile,
  createImportHeader as createImportHeaderUtil,
  insertImportDetails as insertImportDetailsUtil,
  updateImportStatus as updateImportStatusUtil
} from '../../../utils/excelImportUtils';
import { parseColumnDefinitions } from '../../../utils/columnParsing';
import { FileSelectionPhase } from './ImportRelevesPhases/FileSelectionPhase';
import { PreviewPhase } from './ImportRelevesPhases/PreviewPhase';
import { ImportingPhase } from './ImportRelevesPhases/ImportingPhase';

interface CSVRow {
  [key: string]: string;
}

interface ImportRelevesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  addToast: (toast: Omit<ToastData, 'id'>) => void;
}

export function ImportRelevesModal({
  isOpen,
  onClose,
  onImportSuccess,
  addToast
}: ImportRelevesModalProps) {
  const { profil } = useProfil();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFormatId, setSelectedFormatId] = useState<string>('');
  const [formats, setFormats] = useState<FormatImport[]>([]);
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [fileNameExistsError, setFileNameExistsError] = useState<boolean>(false);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [isImportingData, setIsImportingData] = useState<boolean>(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [currentPhase, setCurrentPhase] = useState<'selection' | 'preview' | 'importing'>('selection');
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
    message: ''
  });

  // Fonction pour créer l'entête d'import
  const createImportHeader = async (
    fileName: string,
    formatId: number,
    contratClientId: string,
    nbLignes: number
  ): Promise<number | null> => {
    return createImportHeaderUtil(fileName, formatId, contratClientId, nbLignes);
  };

  // Fonction pour insérer les détails d'import
  const insertImportDetails = async (
    importId: number,
    contratClientId: string,
    details: any[],
    batchSize: number,
    progressCallback: (current: number, total: number, message: string) => void
  ): Promise<boolean> => {
    return insertImportDetailsUtil(importId, contratClientId, details, batchSize, progressCallback);
  };

  // Fonction pour mettre à jour le statut d'import
  const updateImportStatus = async (
    importId: number,
    statut: 'EN_COURS' | 'TERMINE' | 'ERREUR',
    message: string
  ): Promise<void> => {
    return updateImportStatusUtil(importId, statut, message);
  };

  // Charger les formats d'import disponibles
  useEffect(() => {
    const fetchFormats = async () => {
      if (!profil?.com_contrat_client_id) return;

      try {
        const { data, error } = await supabase
          .from('bq_format_import')
          .select('*')
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('actif', true)
          .order('banque')
          .order('code');

        if (error) throw error;
        setFormats(data || []);
      } catch (error) {
        console.error('Erreur lors de la récupération des formats d\'import:', error);
        addToast({
          label: 'Erreur lors de la récupération des formats d\'import',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    };

    if (isOpen) {
      fetchFormats();
    }
  }, [isOpen, profil?.com_contrat_client_id, addToast]);

  // Réinitialiser l'état du modal à la fermeture
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setSelectedFormatId('');
      setParsedData([]);
      setFileNameExistsError(false);
      setImportErrors([]);
      setCurrentPhase('selection');
    }
  }, [isOpen]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier l'extension du fichier
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !['csv', 'txt', 'tsv', 'xls', 'xlsx'].includes(fileExtension)) {
      addToast({
        label: 'Format de fichier non supporté. Veuillez sélectionner un fichier CSV, TXT, TSV, XLS ou XLSX.',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    setSelectedFile(file);
    setFileNameExistsError(false);
    setImportErrors([]);

    // Vérifier si le nom du fichier existe déjà
    if (profil?.com_contrat_client_id) {
      const fileExists = await checkFileExists(file.name, profil.com_contrat_client_id);
      
      if (fileExists) {
        setFileNameExistsError(true);
        addToast({
          label: 'Un fichier avec ce nom a déjà été importé',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
        return;
      }
    }

    // Si un format est sélectionné, analyser le fichier avec les options du format
    if (selectedFormatId) {
      parseFile(file, selectedFormatId);
    }
  };

  const handleFormatChange = (value: string) => {
    setSelectedFormatId(value);
    
    // Si un fichier est déjà sélectionné, l'analyser avec le nouveau format
    if (selectedFile) {
      parseFile(selectedFile, value);
    }
  };

  const parseFile = async (file: File, formatId: string) => {
    setIsProcessingFile(true);
    setParsedData([]);
    setImportErrors([]);
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isExcelFile = fileExtension === 'xls' || fileExtension === 'xlsx';
    
    try {
      // Récupérer les détails du format sélectionné
      const format = formats.find(f => f.id.toString() === formatId);
      if (!format) {
        throw new Error('Format d\'import non trouvé');
      }
      
      console.log('Format sélectionné:', format);
      console.log('Colonnes définies dans le format:', format.colonnes);
      
      // Parser les définitions de colonnes
      const parsedColumnDefs = format.colonnes ? parseColumnDefinitions(format.colonnes) : [];
      console.log('Définitions de colonnes parsées:', parsedColumnDefs);
      
      // Vérifier les types de colonnes
      const dateColumns = parsedColumnDefs.filter(def => def.type === 'date');
      console.log('Colonnes de type date:', dateColumns.map(def => def.sourceName));
      
      const montantColumns = parsedColumnDefs.filter(def => def.type === 'montant');
      console.log('Colonnes de type montant:', montantColumns.map(def => def.sourceName));
      
      // Extraire les noms de colonnes sources (sans le type)
      // Utiliser les noms de colonnes définis dans le format d'import
      const requiredColumnNames = parsedColumnDefs.map(def => def.sourceName);
      
      console.log('Colonnes requises extraites:', requiredColumnNames);
      
      // Traitement spécial pour les fichiers Excel
      if (isExcelFile) {
        if (!profil?.com_contrat_client_id) {
          throw new Error('Profil utilisateur incomplet');
        }
        
        // Utiliser l'utilitaire d'import Excel
        const importOptions: ImportOptions = {
          formatId: format.id,
          format: format,
          contratClientId: profil.com_contrat_client_id,
          requiredColumns: requiredColumnNames,
          parsedColumnDefs: parsedColumnDefs,
          columnMappings: {
            // Mappings pour standardiser les noms de colonnes
            'DATA_LANCAMENTO': 'data_lancamento',
            'DATA_VALOR': 'data_valor',
            'VALOR': 'valor',
            'SALDO': 'saldo',
            'DESCRICAO': 'descricao',
            'REFERENCIA_DOC': 'referencia_doc',
            'date': 'data_lancamento',
            'date_valeur': 'data_valor',
            'montant': 'valor',
            'solde': 'saldo',
            'libelle': 'descricao',
            'description': 'descricao',
            'reference': 'referencia_doc'
          }
        };
        
        const result = await importExcelFile<CSVRow>(file, importOptions);
        
        if (!result.success) {
          setImportErrors(result.errors);
          console.error('Erreurs d\'import:', result.errors);
          console.error('En-têtes disponibles:', result.rawData && result.rawData.length > 0 ? Object.keys(result.rawData[0]) : 'Aucune donnée');
          if (result.errors.length > 0) {
            addToast({
              label: result.errors[0],
              icon: 'AlertTriangle',
              color: '#ef4444'
            });
          }
          setIsProcessingFile(false);
          return;
        }
        
        console.log('Données parsées:', result.data.slice(0, 2));
        setParsedData(result.data);
        setCurrentPhase('preview');
        addToast({
          label: `Fichier Excel analysé avec succès. ${result.data.length} ligne(s) trouvée(s).`,
          icon: 'Check',
          color: '#22c55e'
        });
        setIsProcessingFile(false);
        return;
      }

      // Traitement pour les fichiers CSV/TSV/TXT via l'utilitaire Papa Parse
      // Utiliser l'utilitaire d'import CSV avec les définitions de colonnes
      const { parseCSVFile } = await import('./ImportRelevesUtils');
      const result = await parseCSVFile(file, format, parsedColumnDefs);
      
      if (!result.success) {
        setImportErrors(result.errors);
        if (result.errors.length > 0) {
          addToast({
            label: result.errors[0],
            icon: 'AlertTriangle',
            color: '#ef4444'
          });
        }
        setIsProcessingFile(false);
        return;
      }
      
      setParsedData(result.data);
      setCurrentPhase('preview');
      addToast({
        label: `Fichier analysé avec succès. ${result.data.length} ligne(s) trouvée(s).`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error: any) {
      console.error('Erreur lors de l\'analyse du fichier:', error);
      addToast({
        label: `Erreur: ${error.message}`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleImportData = async () => {
    if (!selectedFile || !selectedFormatId || parsedData.length === 0 || !profil?.com_contrat_client_id) {
      addToast({
        label: 'Données incomplètes pour l\'import',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    setIsImportingData(true);
    setCurrentPhase('importing');
    setImportProgress({
      current: 0,
      total: parsedData.length,
      message: 'Préparation de l\'import...',
    });

    try {
      const format = formats.find(f => f.id.toString() === selectedFormatId);
      if (!format) {
        throw new Error('Format d\'import non trouvé');
      }

      console.log('Début de l\'import avec le format:', format);

      // 1. Créer l'entête d'import
      setImportProgress({
        ...importProgress,
        message: 'Création de l\'entête d\'import...'
      });

      const importHeaderId = await createImportHeader(
        selectedFile.name.substring(0, 255), // Limiter la longueur du nom de fichier
        format.id,
        profil.com_contrat_client_id,
        parsedData.length
      );

      if (!importHeaderId) {
        throw new Error('Erreur lors de la création de l\'entête d\'import');
      }

      console.log('Entête d\'import créé avec ID:', importHeaderId);

      // 2. Préparer les données pour l'insertion
      setImportProgress({
        ...importProgress,
        message: 'Préparation des données pour l\'import...'
      });

      // Préparer les données pour l'insertion en utilisant les définitions de colonnes
      const detailsToInsert = parsedData.map(row => {
        // Conserver les données originales dans source_row et ajouter le champ traite
        return {
          ...row,
          source_row: row,
          traite: 'A TRAITER'
        };
      });

      // 3. Insérer les détails par lots
      const success = await insertImportDetails(
        importHeaderId,
        profil.com_contrat_client_id,
        detailsToInsert,
        100, // taille des lots
        (current, total, message) => {
          setImportProgress({
            current,
            total,
            message
          });
        }
      );

      if (!success) {
        throw new Error('Erreur lors de l\'insertion des détails');
      }

      console.log('Détails insérés avec succès');

      // 4. Mettre à jour le statut de l'import
      setImportProgress({
        ...importProgress,
        message: 'Finalisation de l\'import...'
      });

      await updateImportStatus(
        importHeaderId,
        'TERMINE',
        `Import terminé avec succès. ${parsedData.length} lignes importées.`
      );

      // 5. Notifier le succès
      addToast({
        label: `Import réussi ! ${parsedData.length} lignes importées.`,
        icon: 'Check',
        color: '#22c55e'
      });

      // 6. Rafraîchir les données et fermer le modal
      onImportSuccess();
      onClose();

    } catch (error: any) {
      console.error('Erreur lors de l\'import des données:', error);
      addToast({
        label: `Erreur lors de l'import: ${error.message}`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsImportingData(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Import de relevés bancaires</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isImportingData}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {currentPhase === 'selection' && (
          <FileSelectionPhase 
            formats={formats}
            selectedFormatId={selectedFormatId}
            selectedFile={selectedFile}
            fileNameExistsError={fileNameExistsError}
            isProcessingFile={isProcessingFile}
            importErrors={importErrors}
            onFormatChange={handleFormatChange}
            onFileSelect={handleFileSelect}
          />
        )}

        {currentPhase === 'preview' && (
          <PreviewPhase 
            parsedData={parsedData}
            isImportingData={isImportingData}
            onBack={() => setCurrentPhase('selection')}
            onConfirm={handleImportData}
          />
        )}

        {currentPhase === 'importing' && (
          <ImportingPhase 
            progress={importProgress}
          />
        )}
      </div>
    </div>
  );
}