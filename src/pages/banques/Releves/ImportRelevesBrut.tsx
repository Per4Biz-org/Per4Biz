import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMenu } from '../../../context/MenuContext';
import { useProfil } from '../../../context/ProfilContext';
import { supabase } from '../../../lib/supabase';
import { menuItemsGestionBancaire } from '../../../config/menuConfig';
import { processBankEntries, ProcessProgress } from '../../../utils/bankEntryProcessor';
import { PageSection } from '../../../components/ui/page-section';
import { DataTable, Column } from '../../../components/ui/data-table';
import { Button } from '../../../components/ui/button';
import { ToastContainer, ToastData } from '../../../components/ui/toast';
import { ImportRelevesModal } from '../../../components/banques/Releves/ImportRelevesModal';
import { FileText, Database, X, Loader, Play, AlertCircle, Check, AlertTriangle } from 'lucide-react';
import styles from '../styles.module.css';

interface ImportReleve {
  id: number;
  import_id: string;
  nom_fichier: string;
  id_format_import: number | null;
  date_import: string;
  nb_lignes: number | null;
  statut: string | null;
  message: string | null;
  created_at: string;
  format_import?: {
    code: string;
    libelle: string;
    banque: string;
  };
}

interface ImportReleveDetail {
  id: number;
  id_import: number;
  companhia: string | null;
  produto: string | null;
  conta: string | null;
  moeda: string | null;
  data_lancamento: string | null;
  data_valor: string | null;
  descricao: string | null;
  valor: number | null;
  saldo: number | null;
  referencia_doc: string | null;
  created_at: string;
  traite?: string;
  message?: string;
}

const ImportRelevesBrut: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [imports, setImports] = useState<ImportReleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImport, setSelectedImport] = useState<ImportReleve | null>(null);
  const [importDetails, setImportDetails] = useState<ImportReleveDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isProcessingBankEntries, setIsProcessingBankEntries] = useState(false);
  const [processProgress, setProcessProgress] = useState<ProcessProgress | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [pendingEntriesCount, setPendingEntriesCount] = useState<number>(0);

  useEffect(() => {
    setMenuItems(menuItemsGestionBancaire);
  }, [setMenuItems]);

  // Fonction pour récupérer les imports de relevés
  const fetchImports = async () => {
    if (!profil?.com_contrat_client_id) {
      setImports([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bq_import_releves_brut')
        .select(`
          *,
          format_import:id_format_import (
            code,
            libelle,
            banque
          )
        `)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('date_import', { ascending: false });

      if (error) throw error;
      setImports(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des imports de relevés:', error);
      addToast({
        label: 'Erreur lors de la récupération des imports de relevés',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer le nombre d'entrées à traiter
  const fetchPendingEntriesCount = async () => {
    if (!profil?.com_contrat_client_id) {
      return;
    }

    try {
      const { count, error } = await supabase
        .from('bq_import_releves_brut_detail')
        .select('*', { count: 'exact', head: true })
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .in('traite', ['A TRAITER', 'ERREUR']);

      if (error) throw error;
      setPendingEntriesCount(count || 0);
    } catch (error) {
      console.error('Erreur lors de la récupération du nombre d\'entrées à traiter:', error);
    }
  };

  // Récupération des imports de relevés
  useEffect(() => {
    if (!profilLoading) {
      fetchImports();
      fetchPendingEntriesCount();
    }
  }, [profilLoading, profil?.com_contrat_client_id]);

  // Récupération des détails d'un import pour la modale
  const fetchImportDetailsForModal = async (importId: number) => {
    if (!profil?.com_contrat_client_id) return;

    try {
      setLoadingDetails(true);
      const { data, error } = await supabase
        .from('bq_import_releves_brut_detail')
        .select('*')
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .eq('id_import', importId)
        .order('data_lancamento', { ascending: false });

      if (error) throw error;
      setImportDetails(data || []);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de l\'import:', error);
      addToast({
        label: 'Erreur lors de la récupération des détails de l\'import',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoadingDetails(false);
    }
  };

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

  // Fonction pour ouvrir la modale des détails
  const handleOpenDetailsModal = (importItem: ImportReleve) => {
    setSelectedImport(importItem);
    fetchImportDetailsForModal(importItem.id);
  };

  // Fonction pour fermer la modale des détails
  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setImportDetails([]);
    setSelectedImport(null);
  };

  // Fonction pour supprimer un import
  const handleDelete = async (importItem: ImportReleve) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'import "${importItem.nom_fichier}" ?`)) {
      try {
        const { error } = await supabase
          .from('bq_import_releves_brut')
          .delete()
          .eq('id', importItem.id);

        if (error) throw error;

        await fetchImports();
        addToast({
          label: `L'import "${importItem.nom_fichier}" a été supprimé avec succès`,
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        addToast({
          label: 'Erreur lors de la suppression de l\'import',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  // Fonction pour traiter les écritures bancaires
  const handleProcessBankEntries = async () => {
    if (!profil?.com_contrat_client_id) {
      addToast({
        label: 'Profil utilisateur incomplet',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    setIsProcessingBankEntries(true);
    try {
      // Réinitialiser la progression
      setProcessProgress({
        total: 0,
        processed: 0,
        created: 0,
        duplicates: 0,
        errors: 0,
        currentLine: '',
        phase: 'Initialisation'
      });
      
      // Traiter les écritures avec suivi de progression
      await processBankEntries(
        profil.com_contrat_client_id, 
        addToast,
        (progress) => {
          setProcessProgress({...progress});
        }
      );
      
      // Rafraîchir les données après le traitement
      await fetchImports();
      await fetchPendingEntriesCount();
    } catch (error) {
      console.error('Erreur lors du traitement des écritures bancaires:', error);
    } finally {
      // Laisser l'état de progression visible pendant 3 secondes avant de réinitialiser
      setTimeout(() => {
        setIsProcessingBankEntries(false);
        // Ne pas réinitialiser processProgress pour que l'utilisateur puisse voir le résultat final
      }, 3000);
    }
  };

  // Fonction pour formater les nombres avec virgule comme séparateur décimal
  const formatNumber = (value: any): string => {
    if (value === null || value === undefined || value === '') return '-';
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
    if (isNaN(num)) return String(value);
    return num.toFixed(2).replace('.', ',');
  };

  // Colonnes pour le tableau des imports
  const importColumns: Column<ImportReleve>[] = [
    {
      label: 'Nom du fichier',
      accessor: 'nom_fichier',
      sortable: true
    },
    {
      label: 'Format',
      accessor: 'format_import',
      render: (value) => value ? `${value.code} - ${value.banque}` : 'Non spécifié'
    },
    {
      label: 'Date d\'import',
      accessor: 'date_import',
      sortable: true,
      render: (value) => format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: fr })
    },
    {
      label: 'Lignes',
      accessor: 'nb_lignes',
      align: 'center',
      render: (value) => value || '-'
    },
    {
      label: 'Statut',
      accessor: 'statut',
      align: 'center',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'TERMINE' ? 'bg-green-100 text-green-800' : 
          value === 'ERREUR' ? 'bg-red-100 text-red-800' : 
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value || 'En attente'}
        </span>
      )
    },
    {
      label: 'Message',
      accessor: 'message',
      render: (value) => value || '-'
    },
    {
      label: 'Date de création',
      accessor: 'created_at',
      render: (value) => format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: fr })
    },
    {
      label: 'Actions',
      accessor: 'id',
      width: '100px',
      align: 'center',
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenDetailsModal(row);
          }}
          className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-medium"
        >
          Voir détails
        </button>
      )
    }
  ];

  // Actions pour le tableau
  const actions = [
    {
      label: 'Voir détails',
      icon: 'FileText',
      color: 'var(--color-primary)',
      onClick: handleOpenDetailsModal
    },
    {
      label: 'Supprimer',
      icon: 'delete',
      color: '#ef4444',
      onClick: handleDelete
    }
  ];

  // Colonnes pour le tableau des détails d'import
  const detailColumns: Column<ImportReleveDetail>[] = [
    {
      label: 'Statut',
      accessor: 'traite',
      align: 'center',
      render: (value, row) => {
        // Déterminer la couleur et le style en fonction du statut
        let bgColor, textColor, icon;
        
        switch(value) {
          case 'A TRAITER':
            bgColor = 'bg-yellow-100';
            textColor = 'text-yellow-800';
            icon = <Play className="w-3 h-3 mr-1" />;
            break;
          case 'CREER':
            bgColor = 'bg-green-100';
            textColor = 'text-green-800';
            icon = <Check className="w-3 h-3 mr-1" />;
            break;
          case 'DOUBLON':
            bgColor = 'bg-blue-100';
            textColor = 'text-blue-800';
            icon = <Database className="w-3 h-3 mr-1" />;
            break;
          case 'ERREUR':
            bgColor = 'bg-red-100';
            textColor = 'text-red-800';
            icon = <AlertCircle className="w-3 h-3 mr-1" />;
            break;
          default:
            bgColor = 'bg-gray-100';
            textColor = 'text-gray-800';
            icon = null;
        }
        
        return (
          <div className="relative group">
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center justify-center ${bgColor} ${textColor}`}>
              {icon}
              {value || 'A TRAITER'}
            </span>
            
            {/* Infobulle pour afficher le message d'erreur si présent */}
            {row.message && value === 'ERREUR' && (
              <div className="absolute z-10 invisible group-hover:visible bg-red-50 border border-red-200 text-red-800 text-xs rounded p-2 shadow-lg w-64 left-0 mt-1">
                <div className="font-medium mb-1">Détail de l'erreur:</div>
                <div>{row.message}</div>
              </div>
            )}
          </div>
        );
      }
    },
    {
      label: 'ID',
      accessor: 'id',
      width: '60px',
      align: 'center'
    },
    {
      label: 'Date opération',
      accessor: 'data_lancamento',
      sortable: true,
      render: (value) => value ? format(new Date(value), 'dd/MM/yyyy', { locale: fr }) : '-'
    },
    {
      label: 'Date valeur',
      accessor: 'data_valor',
      render: (value) => value ? format(new Date(value), 'dd/MM/yyyy', { locale: fr }) : '-'
    },
    {
      label: 'Compte',
      accessor: 'conta',
      render: (value) => value || '-'
    },
    {
      label: 'Description',
      accessor: 'descricao',
      render: (value) => value || '-'
    },
    {
      label: 'Montant',
      accessor: 'valor',
      align: 'right',
      render: (value) => {
        if (value === null) return '-';
        const formattedValue = new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR'
        }).format(value);
        return (
          <span className={value < 0 ? 'text-red-600' : 'text-green-600'}>
            {formattedValue}
          </span>
        );
      }
    },
    {
      label: 'Solde',
      accessor: 'saldo',
      align: 'right',
      render: (value) => {
        if (value === null) return '-';
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR'
        }).format(value);
      }
    },
    {
      label: 'Référence',
      accessor: 'referencia_doc',
      render: (value) => value || '-'
    }
  ];

  return (
    <div className={styles.container}>
      <PageSection
        title={loading || profilLoading ? "Chargement..." : "Import de Relevés Bancaires"}
        description="Consultez les relevés bancaires importés et leurs détails"
        className={styles.header}
      >
        <div className="mb-6">
          <div className="flex gap-3">
            <Button
              label="Nouvel import"
              icon="FileText"
              onClick={() => setIsImportModalOpen(true)}
              color="var(--color-primary)"
            />
            <Button
              label={isProcessingBankEntries ? "Traitement en cours..." : "Traiter les relevés"}
              icon="Play"
              onClick={handleProcessBankEntries}
              color="#22c55e"
              disabled={isProcessingBankEntries}
            />
          </div>
          
          {/* Affichage de la progression du traitement */}
          {isProcessingBankEntries && processProgress && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Loader className="w-5 h-5 text-blue-600 mt-1 animate-spin" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900 mb-2">Traitement des écritures bancaires</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-blue-800">
                      <span>Phase actuelle:</span>
                      <span className="font-medium">{processProgress.phase}</span>
                    </div>
                    
                    {processProgress.total > 0 && (
                      <>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.round((processProgress.processed / processProgress.total) * 100)}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between text-xs text-blue-700">
                          <span>{processProgress.processed} / {processProgress.total} lignes traitées</span>
                          <span>{Math.round((processProgress.processed / processProgress.total) * 100)}%</span>
                        </div>
                        
                        {processProgress.currentLine && (
                          <div className="text-sm text-blue-700 mt-1">
                            {processProgress.currentLine}
                          </div>
                        )}
                        
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div className="bg-green-100 p-2 rounded text-center">
                            <div className="text-green-800 text-xs font-medium">Créées</div>
                            <div className="text-green-900 font-bold">{processProgress.created || 0}</div>
                          </div>
                          <div className="bg-blue-100 p-2 rounded text-center">
                            <div className="text-blue-800 text-xs font-medium">Doublons</div>
                            <div className="text-blue-900 font-bold">{processProgress.duplicates || 0}</div>
                          </div>
                          <div className="bg-red-100 p-2 rounded text-center">
                            <div className="text-red-800 text-xs font-medium">Erreurs</div>
                            <div className="text-red-900 font-bold">{processProgress.errors || 0}</div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Affichage du résultat final après traitement */}
          {!isProcessingBankEntries && processProgress && processProgress.processed > 0 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-medium text-green-900 mb-2">Traitement terminé</h3>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-green-800">
                      <span>{processProgress.processed} lignes traitées au total</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="bg-green-100 p-2 rounded text-center">
                        <div className="text-green-800 text-xs font-medium">Créées</div>
                        <div className="text-green-900 font-bold">{processProgress.created || 0}</div>
                      </div>
                      <div className="bg-blue-100 p-2 rounded text-center">
                        <div className="text-blue-800 text-xs font-medium">Doublons</div>
                        <div className="text-blue-900 font-bold">{processProgress.duplicates || 0}</div>
                      </div>
                      <div className={`p-2 rounded text-center ${processProgress.errors > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                        <div className={`text-xs font-medium ${processProgress.errors > 0 ? 'text-red-800' : 'text-gray-800'}`}>Erreurs</div>
                        <div className={`font-bold ${processProgress.errors > 0 ? 'text-red-900' : 'text-gray-900'}`}>{processProgress.errors || 0}</div>
                      </div>
                    </div>
                    
                    {processProgress.errors > 0 && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-red-700">
                        <AlertCircle className="w-4 h-4" />
                        <span>Des erreurs sont survenues pendant le traitement. Consultez les détails des imports pour voir les erreurs spécifiques.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tableau des imports */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Liste des imports</h2>
            <div className="flex items-center gap-3">
              {pendingEntriesCount > 0 && (
                <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{pendingEntriesCount} entrée{pendingEntriesCount > 1 ? 's' : ''} à traiter</span>
                </div>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">Chargement des imports de relevés...</p>
            </div>
          ) : (
            <DataTable
              columns={importColumns}
              data={imports}
              actions={actions}
              defaultRowsPerPage={10}
              emptyTitle="Aucun import"
              emptyMessage="Aucun import de relevé bancaire n'a été effectué pour le moment."
            />
          )}
        </div>

        <ToastContainer toasts={toasts} onClose={closeToast} />
        
        {/* Modal d'import de relevés */}
        <ImportRelevesModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={() => {
            fetchImports();
            fetchPendingEntriesCount();
          }}
          addToast={addToast}
        />

        {/* Modal de détails d'import */}
        {isDetailsModalOpen && selectedImport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Database className="mr-2 text-blue-600" size={20} />
                  Détails de l'import : {selectedImport.nom_fichier}
                </h2>
                <button
                  onClick={handleCloseDetailsModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Format d'import</p>
                    <p className="text-sm">{selectedImport.format_import ? `${selectedImport.format_import.code} - ${selectedImport.format_import.banque}` : 'Non spécifié'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Date d'import</p>
                    <p className="text-sm">{format(new Date(selectedImport.date_import), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Nombre de lignes</p>
                    <p className="text-sm">{selectedImport.nb_lignes || 'Non spécifié'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Statut</p>
                    <p className="text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedImport.statut === 'TERMINE' ? 'bg-green-100 text-green-800' : 
                        selectedImport.statut === 'ERREUR' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedImport.statut || 'En attente'}
                      </span>
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-blue-700 font-medium">Message</p>
                    <p className="text-sm">{selectedImport.message || '-'}</p>
                  </div>
                </div>
              </div>
              
              {loadingDetails ? (
                <div className="flex justify-center items-center h-64">
                  <div className="flex flex-col items-center">
                    <Loader className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                    <p className="text-blue-600">Chargement des détails...</p>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-medium mb-3">Écritures importées</h3>
                  <DataTable
                    columns={detailColumns}
                    data={importDetails}
                    defaultRowsPerPage={25}
                    emptyTitle="Aucun détail"
                    emptyMessage="Aucun détail n'a été trouvé pour cet import."
                  />
                  
                  {importDetails.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Total des écritures: </span>
                          <span className="text-sm text-gray-900">{importDetails.length}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Total des montants: </span>
                          <span className="text-sm text-gray-900">
                            {new Intl.NumberFormat('fr-FR', {
                             style: 'currency',
                             currency: 'EUR'
                            }).format(importDetails.reduce((sum, detail) => sum + (detail.valor || 0), 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </PageSection>
    </div>
  );
};

export default ImportRelevesBrut;