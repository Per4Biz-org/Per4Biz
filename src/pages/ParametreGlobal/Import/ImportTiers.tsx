import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { useMenu } from '../../../context/MenuContext';
import { useProfil } from '../../../context/ProfilContext';
import { supabase } from '../../../lib/supabase';
import { menuItemsParametreGlobalImport } from '../../../config/menuConfig';
import { PageSection } from '../../../components/ui/page-section';
import { Button } from '../../../components/ui/button';
import { ToastContainer, ToastData } from '../../../components/ui/toast';
import { Upload, FileText, AlertTriangle, Check, Download } from 'lucide-react';
import styles from '../styles.module.css';

interface CSVRow {
  [key: string]: string;
}

interface PreviewData {
  headers: string[];
  rows: CSVRow[];
}

const ImportTiers: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    setMenuItems(menuItemsParametreGlobalImport);
  }, [setMenuItems]);

  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const newToast: ToastData = {
      ...toast,
      id: Date.now().toString(),
    };
    setToasts(prev => [...prev, newToast]);
  };

  const closeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.name.toLowerCase().endsWith('.csv')) {
      addToast({
        label: 'Veuillez sélectionner un fichier CSV',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    setSelectedFile(file);
    setPreviewData(null);
    parseCSVFile(file);
  };

  const parseCSVFile = (file: File) => {
    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        if (results.errors.length > 0) {
          addToast({
            label: `Erreur lors de l'analyse du fichier: ${results.errors[0].message}`,
            icon: 'AlertTriangle',
            color: '#ef4444'
          });
          setIsProcessing(false);
          return;
        }

        const data = results.data as CSVRow[];
        if (data.length === 0) {
          addToast({
            label: 'Le fichier CSV est vide',
            icon: 'AlertTriangle',
            color: '#ef4444'
          });
          setIsProcessing(false);
          return;
        }

        // Prendre les 5 premières lignes pour l'aperçu
        const previewRows = data.slice(0, 5);
        const headers = Object.keys(data[0]);

        setPreviewData({
          headers,
          rows: previewRows
        });

        addToast({
          label: `Fichier analysé avec succès. ${data.length} ligne(s) trouvée(s)`,
          icon: 'Check',
          color: '#22c55e'
        });

        setIsProcessing(false);
      },
      error: (error) => {
        addToast({
          label: `Erreur lors de la lecture du fichier: ${error.message}`,
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
        setIsProcessing(false);
      }
    });
  };

  const validateRequiredData = async (): Promise<{ codeUser: string; contratClientId: string; typeId: string } | null> => {
    // Vérifier le profil
    if (!profil?.com_contrat_client_id) {
      addToast({
        label: 'Profil utilisateur incomplet. Veuillez vérifier vos informations de profil.',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return null;
    }

    // Récupérer le type de tiers 'MP'
    try {
      const { data: typeTiers, error } = await supabase
        .from('com_param_type_tiers')
        .select('id')
        .eq('code', 'MP')
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .single();

      if (error || !typeTiers) {
        addToast({
          label: 'Type de tiers "MP" introuvable. Veuillez créer ce type de tiers avant l\'import.',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
        return null;
      }

      return {
        codeUser: profil.code_user || 'SYSTEM', // Gardé pour compatibilité mais n'est plus utilisé
        contratClientId: profil.com_contrat_client_id,
        typeId: typeTiers.id
      };
    } catch (error) {
      addToast({
        label: 'Erreur lors de la vérification des données requises',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return null;
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !previewData) {
      addToast({
        label: 'Aucun fichier sélectionné',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    setIsImporting(true);

    try {
      // Valider les données requises
      const requiredData = await validateRequiredData();
      if (!requiredData) {
        setIsImporting(false); 
        return;
      }

      // Parser tout le fichier pour l'import
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: async (results) => {
          try {
            const data = results.data as CSVRow[];
            
            if (data.length === 0) {
              addToast({
                label: 'Aucune donnée à importer',
                icon: 'AlertTriangle',
                color: '#ef4444'
              });
              setIsImporting(false);
              return;
            }

            // Préparer les données pour l'insertion
            const tiersToInsert = data.map((row, index) => {
              // Debug : afficher chaque ligne pour comprendre la structure
              console.log(`Ligne ${index + 1}:`, row);
              
              // Nettoyer et valider les données
              const code = row.code?.trim();
              const nom = row.nom?.trim() || row.name?.trim();
              
              if (!code || !nom) {
                console.warn(`Ligne ${index + 1} ignorée - code ou nom manquant:`, { code, nom });
                return null;
              }
              
              return {
                code: code,
                nom: nom,
                nif: row.nif?.trim() || null,
                email: row.email?.trim() || null, 
                telephone: row.telephone?.trim() || row.phone?.trim() || null,
                adresse: row.adresse?.trim() || row.address?.trim() || null,
                code_postal: row.code_postal?.trim() || row.postal_code?.trim() || null,
                ville: row.ville?.trim() || row.city?.trim() || null,
                actif: true,
                id_type_tiers: requiredData.typeId,
                com_contrat_client_id: requiredData.contratClientId
                // code_user n'est plus nécessaire, remplacé par created_by
              };
            }).filter(Boolean); // Supprimer les lignes null

            // Debug : afficher les données préparées
            console.log('Nombre total de lignes CSV:', data.length);
            console.log('Nombre de lignes valides pour insertion:', tiersToInsert.length);
            console.log('Premières lignes CSV:', data.slice(0, 2));
            console.log('Premières lignes préparées:', tiersToInsert.slice(0, 2));
            
            if (tiersToInsert.length === 0) {
              addToast({
                label: 'Aucune donnée valide trouvée dans le fichier. Vérifiez que les colonnes "code" et "nom" sont présentes.',
                icon: 'AlertTriangle',
                color: '#ef4444'
              });
              setIsImporting(false);
              return;
            }

            // Insérer en base de données
            const { data: insertedData, error } = await supabase
              .from('com_tiers')
              .insert(tiersToInsert)
              .select();

            if (error) {
              throw error;
            }

            addToast({
              label: `Import réussi ! ${insertedData?.length || 0} tiers importé(s)`,
              icon: 'Check',
              color: '#22c55e'
            });

            // Réinitialiser le formulaire
            setSelectedFile(null);
            setPreviewData(null);
            const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
            if (fileInput) {
              fileInput.value = '';
            }

          } catch (error: any) {
            console.error('Erreur lors de l\'import:', error);
            
            let errorMessage = 'Erreur lors de l\'import des tiers';
            if (error.message?.includes('duplicate key') || error.message?.includes('unique')) {
              errorMessage = 'Certains codes de tiers existent déjà. Veuillez vérifier les doublons.';
            }
            
            addToast({
              label: errorMessage,
              icon: 'AlertTriangle',
              color: '#ef4444'
            });
          } finally {
            setIsImporting(false);
          }
        },
        error: (error) => {
          addToast({
            label: `Erreur lors de la lecture du fichier: ${error.message}`,
            icon: 'AlertTriangle',
            color: '#ef4444'
          });
          setIsImporting(false);
        }
      });

    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      addToast({
        label: 'Erreur lors de l\'import des tiers',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `code,nom,nif,email,telephone,adresse,code_postal,ville
TIER001,Exemple Tiers 1,123456789,contact@exemple1.com,+33123456789,123 rue de la Paix,75001,Paris
TIER002,Exemple Tiers 2,987654321,info@exemple2.com,+33987654321,456 avenue des Champs,69000,Lyon`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_import_tiers.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (profilLoading) {
    return (
      <div className={styles.container}>
        <PageSection>
          <div className="flex items-center justify-center h-64">
            <p className="text-lg text-gray-600">Chargement...</p>
          </div>
        </PageSection>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageSection
        title="Import de Tiers"
        description="Importez vos tiers depuis un fichier CSV"
        className={styles.header}
      >
        <div className="space-y-6">
          {/* Sélection de fichier */}
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8">
            <div className="text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sélectionner un fichier CSV
              </h3>
              <p className="text-gray-600 mb-4">
                Choisissez un fichier CSV contenant vos données de tiers.
                <br />
                <button
                  onClick={downloadTemplate}
                  className="text-blue-600 hover:text-blue-800 underline text-sm mt-1 inline-flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Télécharger un modèle
                </button>
              </p>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing || isImporting}
              />
              <Button
                label={isProcessing ? 'Analyse en cours...' : 'Choisir un fichier'}
                icon="Upload"
                color="var(--color-primary)"
                onClick={() => document.getElementById('csv-file-input')?.click()}
                disabled={isProcessing || isImporting}
              />
            </div>
          </div>

          {/* Aperçu des données */}
          {previewData && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Aperçu des données (5 premières lignes)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {previewData.headers.map((header, index) => (
                        <th
                          key={index}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {previewData.headers.map((header, colIndex) => (
                          <td
                            key={colIndex}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                          >
                            {row[header] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          {previewData && (
            <div className="flex justify-end gap-4">
              <Button
                label="Annuler"
                color="#6B7280"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewData(null);
                  const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
                  if (fileInput) {
                    fileInput.value = '';
                  }
                }}
                disabled={isImporting}
              />
              <Button
                label={isImporting ? 'Import en cours...' : 'Importer'}
                icon="Upload"
                color="var(--color-primary)"
                onClick={handleImport}
                disabled={isImporting}
              />
            </div>
          )}

          {/* Informations sur l'import */}
          {previewData && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900 mb-2">Informations sur l'import</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Les tiers seront associés au type "MP" (Matière Première)</li>
                    <li>• Votre code utilisateur ({profil?.code_user}) sera automatiquement ajouté</li>
                    <li>• Les tiers seront liés à votre contrat client</li>
                    <li>• Tous les tiers importés seront actifs par défaut</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <ToastContainer toasts={toasts} onClose={closeToast} />
      </PageSection>
    </div>
  );
};

export default ImportTiers;