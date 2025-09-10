import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr, enUS, pt } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();

  // Debug: verificar se as traduções estão a funcionar
  console.log('Idioma actual:', i18n.language);
  console.log('Tradução título:', t('importStatements.title'));
  console.log('Tradução descrição:', t('importStatements.description'));

  // Função para obter o locale de data baseado no idioma actual
  const getDateLocale = () => {
    switch (i18n.language) {
      case 'pt': return pt;
      case 'en': return enUS;
      case 'fr': return fr;
      default: return pt; // Fallback para português
    }
  };

  // Função para obter o locale de formatação de números/moeda
  const getNumberLocale = () => {
    switch (i18n.language) {
      case 'pt': return 'pt-PT';
      case 'en': return 'en-US';
      case 'fr': return 'fr-FR';
      default: return 'pt-PT'; // Fallback para português
    }
  };
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
        label: t('importStatements.errors.fetchImportsError'),
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
        label: t('importStatements.errors.fetchDetailsError'),
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
    if (window.confirm(t('importStatements.confirmations.deleteImport', { fileName: importItem.nom_fichier }))) {
      try {
        const { error } = await supabase
          .from('bq_import_releves_brut')
          .delete()
          .eq('id', importItem.id);

        if (error) throw error;

        await fetchImports();
        addToast({
          label: t('importStatements.success.importDeleted', { fileName: importItem.nom_fichier }),
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        addToast({
          label: t('importStatements.errors.deleteError'),
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
        label: t('importStatements.errors.incompleteUserProfile'),
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
      label: t('importStatements.columns.fileName'),
      accessor: 'nom_fichier',
      sortable: true
    },
    {
      label: t('importStatements.columns.format'),
      accessor: 'format_import',
      render: (value) => value ? `${value.code} - ${value.banque}` : t('importStatements.status.notSpecified')
    },
    {
      label: t('importStatements.columns.importDate'),
      accessor: 'date_import',
      sortable: true,
      render: (value) => format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: getDateLocale() })
    },
    {
      label: t('importStatements.columns.lines'),
      accessor: 'nb_lignes',
      align: 'center',
      render: (value) => value || '-'
    },
    {
      label: t('importStatements.columns.status'),
      accessor: 'statut',
      align: 'center',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'TERMINE' ? 'bg-green-100 text-green-800' : 
          value === 'ERREUR' ? 'bg-red-100 text-red-800' : 
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value === 'TERMINE' ? t('importStatements.status.finished') :
           value === 'ERREUR' ? t('importStatements.status.error') :
           t('importStatements.status.pending')}
        </span>
      )
    },
    {
      label: t('importStatements.columns.message'),
      accessor: 'message',
      render: (value) => value || '-'
    },
    {
      label: t('importStatements.columns.creationDate'),
      accessor: 'created_at',
      render: (value) => format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: getDateLocale() })
    },
    {
      label: t('importStatements.columns.actions'),
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
          {t('importStatements.actions.viewDetails')}
        </button>
      )
    }
  ];

  // Actions pour le tableau
  const actions = [
    {
      label: t('importStatements.actions.viewDetails'),
      icon: 'edit',
      color: 'var(--color-primary)',
      onClick: handleOpenDetailsModal
    },
    {
      label: t('importStatements.actions.delete'),
      icon: 'delete',
      color: '#ef4444',
      onClick: handleDelete
    }
  ];

  // Colonnes pour le tableau des détails d'import
  const detailColumns: Column<ImportReleveDetail>[] = [
    {
      label: t('importStatements.modal.detailColumns.status'),
      accessor: 'traite',
      align: 'center',
      render: (value, row) => {
        // Déterminer la couleur et le style en fonction du statut
        let bgColor, textColor, icon, displayText;
        
        switch(value) {
          case 'A TRAITER':
            bgColor = 'bg-yellow-100';
            textColor = 'text-yellow-800';
            icon = <Play className="w-3 h-3 mr-1" />;
            displayText = t('importStatements.modal.detailStatus.toProcess');
            break;
          case 'CREER':
            bgColor = 'bg-green-100';
            textColor = 'text-green-800';
            icon = <Check className="w-3 h-3 mr-1" />;
            displayText = t('importStatements.modal.detailStatus.created');
            break;
          case 'DOUBLON':
            bgColor = 'bg-blue-100';
            textColor = 'text-blue-800';
            icon = <Database className="w-3 h-3 mr-1" />;
            displayText = t('importStatements.modal.detailStatus.duplicate');
            break;
          case 'ERREUR':
            bgColor = 'bg-red-100';
            textColor = 'text-red-800';
            icon = <AlertCircle className="w-3 h-3 mr-1" />;
            displayText = t('importStatements.modal.detailStatus.error');
            break;
          default:
            bgColor = 'bg-gray-100';
            textColor = 'text-gray-800';
            icon = null;
            displayText = t('importStatements.modal.detailStatus.toProcess');
        }
        
        return (
          <div className="relative group">
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center justify-center ${bgColor} ${textColor}`}>
              {icon}
              {displayText}
            </span>
            
            {/* Infobulle pour afficher le message d'erreur si présent */}
            {row.message && value === 'ERREUR' && (
              <div className="absolute z-10 invisible group-hover:visible bg-red-50 border border-red-200 text-red-800 text-xs rounded p-2 shadow-lg w-64 left-0 mt-1">
                <div className="font-medium mb-1">{t('importStatements.modal.errorTooltip')}</div>
                <div>{row.message}</div>
              </div>
            )}
          </div>
        );
      }
    },
    {
      label: t('importStatements.modal.detailColumns.id'),
      accessor: 'id',
      width: '60px',
      align: 'center'
    },
    {
      label: t('importStatements.modal.detailColumns.operationDate'),
      accessor: 'data_lancamento',
      sortable: true,
      render: (value) => value ? format(new Date(value), 'dd/MM/yyyy', { locale: getDateLocale() }) : '-'
    },
    {
      label: t('importStatements.modal.detailColumns.valueDate'),
      accessor: 'data_valor',
      render: (value) => value ? format(new Date(value), 'dd/MM/yyyy', { locale: getDateLocale() }) : '-'
    },
    {
      label: t('importStatements.modal.detailColumns.account'),
      accessor: 'conta',
      render: (value) => value || '-'
    },
    {
      label: t('importStatements.modal.detailColumns.description'),
      accessor: 'descricao',
      render: (value) => value || '-'
    },
    {
      label: t('importStatements.modal.detailColumns.amount'),
      accessor: 'valor',
      align: 'right',
      render: (value) => {
        if (value === null) return '-';
        const formattedValue = new Intl.NumberFormat(getNumberLocale(), {
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
      label: t('importStatements.modal.detailColumns.balance'),
      accessor: 'saldo',
      align: 'right',
      render: (value) => {
        if (value === null) return '-';
        return new Intl.NumberFormat(getNumberLocale(), {
          style: 'currency',
          currency: 'EUR'
        }).format(value);
      }
    },
    {
      label: t('importStatements.modal.detailColumns.reference'),
      accessor: 'referencia_doc',
      render: (value) => value || '-'
    }
  ];

  return (
    <div className={styles.container}>
      <PageSection
        title={loading || profilLoading ? (t('importStatements.loading') || 'A carregar...') : (t('importStatements.title') || 'Import de Extractos Bancários')}
        description={t('importStatements.description') || 'Consulte os extractos bancários importados e os seus detalhes'}
        className={styles.header}
      >
        <div className="mb-6">
          <div className="flex gap-3">
            <Button
              label={t('importStatements.newImport') || 'Novo import'}
              icon="FileText"
              onClick={() => setIsImportModalOpen(true)}
              color="var(--color-primary)"
            />
            <Button
              label={isProcessingBankEntries ? (t('importStatements.processingInProgress') || 'Processamento em curso...') : (t('importStatements.processStatements') || 'Processar extractos')}
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
                  <h3 className="font-medium text-blue-900 mb-2">{t('importStatements.processing.title')}</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-blue-800">
                      <span>{t('importStatements.processing.currentPhase')}:</span>
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
                          <span>{processProgress.processed} / {processProgress.total} {t('importStatements.processing.linesProcessed')}</span>
                          <span>{Math.round((processProgress.processed / processProgress.total) * 100)}%</span>
                        </div>
                        
                        {processProgress.currentLine && (
                          <div className="text-sm text-blue-700 mt-1">
                            {processProgress.currentLine}
                          </div>
                        )}
                        
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div className="bg-green-100 p-2 rounded text-center">
                            <div className="text-green-800 text-xs font-medium">{t('importStatements.processing.created')}</div>
                            <div className="text-green-900 font-bold">{processProgress.created || 0}</div>
                          </div>
                          <div className="bg-blue-100 p-2 rounded text-center">
                            <div className="text-blue-800 text-xs font-medium">{t('importStatements.processing.duplicates')}</div>
                            <div className="text-blue-900 font-bold">{processProgress.duplicates || 0}</div>
                          </div>
                          <div className="bg-red-100 p-2 rounded text-center">
                            <div className="text-red-800 text-xs font-medium">{t('importStatements.processing.errors')}</div>
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
                  <h3 className="font-medium text-green-900 mb-2">{t('importStatements.processing.finished')}</h3>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-green-800">
                      <span>{processProgress.processed} {t('importStatements.processing.totalProcessed')}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="bg-green-100 p-2 rounded text-center">
                        <div className="text-green-800 text-xs font-medium">{t('importStatements.processing.created')}</div>
                        <div className="text-green-900 font-bold">{processProgress.created || 0}</div>
                      </div>
                      <div className="bg-blue-100 p-2 rounded text-center">
                        <div className="text-blue-800 text-xs font-medium">{t('importStatements.processing.duplicates')}</div>
                        <div className="text-blue-900 font-bold">{processProgress.duplicates || 0}</div>
                      </div>
                      <div className={`p-2 rounded text-center ${processProgress.errors > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                        <div className={`text-xs font-medium ${processProgress.errors > 0 ? 'text-red-800' : 'text-gray-800'}`}>{t('importStatements.processing.errors')}</div>
                        <div className={`font-bold ${processProgress.errors > 0 ? 'text-red-900' : 'text-gray-900'}`}>{processProgress.errors || 0}</div>
                      </div>
                    </div>
                    
                    {processProgress.errors > 0 && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-red-700">
                        <AlertCircle className="w-4 h-4" />
                        <span>{t('importStatements.processing.errorMessage')}</span>
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
            <h2 className="text-lg font-semibold">{t('importStatements.listTitle')}</h2>
            <div className="flex items-center gap-3">
              {pendingEntriesCount > 0 && (
                <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{t('importStatements.entriesCount', { 
                    count: pendingEntriesCount,
                    plural: pendingEntriesCount > 1 ? 's' : ''
                  })}</span>
                </div>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">{t('importStatements.loadingImports')}</p>
            </div>
          ) : (
            <DataTable
              columns={importColumns}
              data={imports}
              defaultRowsPerPage={10}
              emptyTitle={t('importStatements.empty.title')}
              emptyMessage={t('importStatements.empty.message')}
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
                  {t('importStatements.modal.title')} : {selectedImport.nom_fichier}
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
                    <p className="text-sm text-blue-700 font-medium">{t('importStatements.modal.importFormat')}</p>
                    <p className="text-sm">{selectedImport.format_import ? `${selectedImport.format_import.code} - ${selectedImport.format_import.banque}` : t('importStatements.status.notSpecified')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">{t('importStatements.modal.importDate')}</p>
                    <p className="text-sm">{format(new Date(selectedImport.date_import), 'dd MMMM yyyy à HH:mm', { locale: getDateLocale() })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">{t('importStatements.modal.linesCount')}</p>
                    <p className="text-sm">{selectedImport.nb_lignes || t('importStatements.status.notSpecified')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">{t('importStatements.modal.status')}</p>
                    <p className="text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedImport.statut === 'TERMINE' ? 'bg-green-100 text-green-800' : 
                        selectedImport.statut === 'ERREUR' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedImport.statut === 'TERMINE' ? t('importStatements.status.finished') :
                         selectedImport.statut === 'ERREUR' ? t('importStatements.status.error') :
                         t('importStatements.status.pending')}
                      </span>
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-blue-700 font-medium">{t('importStatements.modal.message')}</p>
                    <p className="text-sm">{selectedImport.message || '-'}</p>
                  </div>
                </div>
              </div>
              
              {loadingDetails ? (
                <div className="flex justify-center items-center h-64">
                  <div className="flex flex-col items-center">
                    <Loader className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                    <p className="text-blue-600">{t('importStatements.modal.loadingDetails')}</p>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-medium mb-3">{t('importStatements.modal.importedEntries')}</h3>
                  <DataTable
                    columns={detailColumns}
                    data={importDetails}
                    defaultRowsPerPage={25}
                    emptyTitle={t('importStatements.modal.emptyDetails.title')}
                    emptyMessage={t('importStatements.modal.emptyDetails.message')}
                  />
                  
                  {importDetails.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium text-gray-700">{t('importStatements.modal.totalEntries')}: </span>
                          <span className="text-sm text-gray-900">{importDetails.length}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">{t('importStatements.modal.totalAmounts')}: </span>
                          <span className="text-sm text-gray-900">
                            {new Intl.NumberFormat(getNumberLocale(), {
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
