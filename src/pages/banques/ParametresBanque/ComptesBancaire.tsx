import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useProfil } from '../../../context/ProfilContext';
import { useMenu } from '../../../context/MenuContext';
import { supabase } from '../../../lib/supabase';
import { menuItemsParamGestionBancaire } from '../../../config/menuConfig';
import { PageSection } from '../../../components/ui/page-section';
import { DataTable, Column } from '../../../components/ui/data-table';
import { Button } from '../../../components/ui/button';
import { ToastContainer, ToastData } from '../../../components/ui/toast';
import { CompteBancaireForm } from '../../../components/ParametreBanque/CompteBancaireForm';
import styles from './styles.module.css';

interface CompteBancaire {
  id: string;
  code: string;
  id_entite: string;
  nom: string;
  banque: string;
  iban: string;
  bic: string | null;
  actif: boolean;
  commentaire: string | null;
  date_creation: string;
  created_at: string;
  entite: {
    code: string;
  };
}

const ComptesBancaire: React.FC = () => {
  const { t } = useTranslation();
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [comptes, setComptes] = useState<CompteBancaire[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompte, setSelectedCompte] = useState<CompteBancaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComptes = async () => {
    try {
      if (!profil?.com_contrat_client_id) {
        setComptes([]);
        return;
      }

      const { data, error } = await supabase
        .from('bq_compte_bancaire')
        .select(`
          *,
          entite:id_entite (
            code
          )
        `)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('code');

      if (error) throw error;
      setComptes(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des comptes:', error);
      addToast({
        label: t('messages.errorLoadingBankAccounts'),
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMenuItems(menuItemsParamGestionBancaire);
    if (!profilLoading) {
      fetchComptes();
    }
  }, [setMenuItems, profilLoading, profil?.com_contrat_client_id]);

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

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      if (!profil?.com_contrat_client_id) {
        throw new Error(t('messages.noClientContract'));
      }

      let error;
      
      if (selectedCompte) {
        // Préparer les données pour la mise à jour en excluant l'objet entite
        const updateData = {
          com_contrat_client_id: profil.com_contrat_client_id,
          id_entite: formData.id_entite,
          code: formData.code,
          nom: formData.nom,
          banque: formData.banque,
          iban: formData.iban,
          bic: formData.bic || '',
          actif: formData.actif,
          commentaire: formData.commentaire || ''
        };

        const { error: updateError } = await supabase
          .from('bq_compte_bancaire')
          .update(updateData)
          .eq('id', selectedCompte.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('bq_compte_bancaire')
          .insert([{
            ...formData,
            com_contrat_client_id: profil.com_contrat_client_id
          }]);
        error = insertError;
      }

      if (error) throw error;

      await fetchComptes();
      setIsModalOpen(false);
      setSelectedCompte(null);
      addToast({
        label: t('messages.bankAccountSavedSuccess', { 
          action: selectedCompte ? t('messages.bankAccountModified') : t('messages.bankAccountCreated') 
        }),
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      addToast({
        label: t('messages.errorSavingBankAccount', { 
          action: selectedCompte ? t('messages.modification') : t('messages.creation') 
        }),
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (compte: CompteBancaire) => {
    setSelectedCompte(compte);
    setIsModalOpen(true);
  };

  const handleDelete = async (compte: CompteBancaire) => {
    if (window.confirm(t('messages.confirmDeleteBankAccount', { name: compte.nom }))) {
      try {
        const { error } = await supabase
          .from('bq_compte_bancaire')
          .delete()
          .eq('id', compte.id);

        if (error) throw error;

        await fetchComptes();
        addToast({
          label: t('messages.bankAccountDeletedSuccess', { name: compte.nom }),
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        addToast({
          label: t('messages.errorDeletingBankAccount'),
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  const columns: Column<CompteBancaire>[] = [
    {
      label: t('banking.bankAccounts.columns.entity'),
      accessor: 'entite',
      render: (value) => value.code
    },
    {
      label: t('banking.bankAccounts.columns.code'),
      accessor: 'code',
      sortable: true
    },
    {
      label: t('banking.bankAccounts.columns.name'),
      accessor: 'nom',
      sortable: true
    },
    {
      label: t('banking.bankAccounts.columns.bank'),
      accessor: 'banque',
      sortable: true
    },
    {
      label: t('banking.bankAccounts.columns.iban'),
      accessor: 'iban'
    },
    {
      label: t('banking.bankAccounts.columns.active'),
      accessor: 'actif',
      align: 'center',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? t('banking.bankAccounts.columns.yes') : t('banking.bankAccounts.columns.no')}
        </span>
      )
    },
    {
      label: t('banking.bankAccounts.columns.creationDate'),
      accessor: 'created_at',
      render: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: fr })
    }
  ];

  const actions = [
    {
      label: t('banking.bankAccounts.actions.edit'),
      icon: 'edit',
      color: 'var(--color-primary)',
      onClick: handleEdit
    },
    {
      label: t('banking.bankAccounts.actions.delete'),
      icon: 'delete',
      color: '#ef4444',
      onClick: handleDelete
    }
  ];

  return (
    <div className={styles.container}>
      <PageSection
        title={loading || profilLoading ? t('common.loading') : t('banking.bankAccounts.title')}
        description={t('banking.bankAccounts.description')}
        className={styles.header}
      >
        <div className="mb-6">
          <Button
            label={t('banking.bankAccounts.createAccount')}
            icon="Plus"
            color="var(--color-primary)"
            onClick={() => setIsModalOpen(true)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">{t('messages.loadingBankAccounts')}</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={comptes}
            actions={actions}
            defaultRowsPerPage={10}
            emptyTitle={t('banking.bankAccounts.noBankAccounts')}
            emptyMessage={t('banking.bankAccounts.noBankAccountsMessage')}
          />
        )}

        <ToastContainer toasts={toasts} onClose={closeToast} />

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {selectedCompte ? t('banking.bankAccounts.editAccount') : t('banking.bankAccounts.createAccount')}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedCompte(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <CompteBancaireForm
                initialData={selectedCompte ? {
                  id: selectedCompte.id,
                  id_entite: selectedCompte.id_entite,
                  code: selectedCompte.code,
                  nom: selectedCompte.nom,
                  banque: selectedCompte.banque,
                  iban: selectedCompte.iban,
                  bic: selectedCompte.bic || '',
                  actif: selectedCompte.actif,
                  commentaire: selectedCompte.commentaire || '',
                  date_creation: selectedCompte.date_creation,
                  created_at: selectedCompte.created_at
                } : undefined}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setIsModalOpen(false);
                  setSelectedCompte(null);
                }}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        )}
      </PageSection>
    </div>
  );
};

export default ComptesBancaire;