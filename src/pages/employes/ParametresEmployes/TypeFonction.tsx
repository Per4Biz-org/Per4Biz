import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr, enUS, pt } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../../../context/MenuContext';
import { useProfil } from '../../../context/ProfilContext';
import { supabase } from '../../../lib/supabase';
import { menuItemsParamGestionRH } from '../../../config/menuConfig';
import { PageSection } from '../../../components/ui/page-section';
import { DataTable, Column } from '../../../components/ui/data-table';
import { Button } from '../../../components/ui/button';
import { ToastContainer, ToastData } from '../../../components/ui/toast';
import { Form, FormField, FormInput, FormActions } from '../../../components/ui/form';
import { Modal } from '../../../components/ui/modal';
import { Toggle } from '../../../components/ui/toggle';
import styles from '../styles.module.css';

interface TypeFonction {
  id: string;
  code: string;
  libelle: string;
  commentaire: string | null;
  ordre_affichage: number | null;
  actif: boolean;
  created_at: string;
}

const TypeFonction: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [fonctions, setFonctions] = useState<TypeFonction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFonction, setSelectedFonction] = useState<TypeFonction | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    libelle: '',
    commentaire: '',
    ordre_affichage: 0,
    actif: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Função para obter o locale de data baseado no idioma actual
  const getDateLocale = () => {
    switch (i18n.language) {
      case 'en': return enUS;
      case 'pt': return pt;
      case 'fr':
      default: return fr;
    }
  };

  useEffect(() => {
    setMenuItems(menuItemsParamGestionRH);
    if (!profilLoading) {
      fetchFonctions();
    }
  }, [setMenuItems, profilLoading, profil?.com_contrat_client_id]);

  const fetchFonctions = async () => {
    try {
      if (!profil?.com_contrat_client_id) {
        setFonctions([]);
        return;
      }

      const { data, error } = await supabase
        .from('rh_fonction')
        .select('*')
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('ordre_affichage', { ascending: true })
        .order('libelle');

      if (error) throw error;
      setFonctions(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des types de fonctions:', error);
      addToast({
        label: t('employeeParams.functionTypes.messages.loadError'),
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Traitement spécial pour les champs numériques
    if (name === 'ordre_affichage') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : parseInt(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleToggleChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      actif: checked
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.code.trim()) {
      errors.code = t('employeeParams.functionTypes.validation.codeRequired');
    } else if (formData.code.length > 10) {
      errors.code = 'Le code ne doit pas dépasser 10 caractères';
    }
    
    if (!formData.libelle.trim()) {
      errors.libelle = t('employeeParams.functionTypes.validation.labelRequired');
    } else if (formData.libelle.length > 50) {
      errors.libelle = 'Le libellé ne doit pas dépasser 50 caractères';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      if (!profil?.com_contrat_client_id) {
        throw new Error('Aucun contrat client associé au profil');
      }

      let error;
      
      if (selectedFonction) {
        // Mode édition
        const updateData = {
          code: formData.code,
          libelle: formData.libelle,
          commentaire: formData.commentaire || null,
          ordre_affichage: formData.ordre_affichage,
          actif: formData.actif
        };

        const { error: updateError } = await supabase
          .from('rh_fonction')
          .update(updateData)
          .eq('id', selectedFonction.id);
        error = updateError;
      } else {
        // Mode création
        const insertData = {
          code: formData.code,
          libelle: formData.libelle,
          commentaire: formData.commentaire || null,
          ordre_affichage: formData.ordre_affichage,
          actif: formData.actif,
          com_contrat_client_id: profil.com_contrat_client_id
        };

        const { error: insertError } = await supabase
          .from('rh_fonction')
          .insert([insertData]);
        error = insertError;
      }

      if (error) throw error;

      await fetchFonctions();
      setIsModalOpen(false);
      setSelectedFonction(null);
      setFormData({
        code: '',
        libelle: '',
        commentaire: '',
        ordre_affichage: 0,
        actif: true
      });
      addToast({
        label: t('employeeParams.functionTypes.messages.saveSuccess'),
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      
      addToast({
        label: t('employeeParams.functionTypes.messages.saveError'),
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (fonction: TypeFonction) => {
    setSelectedFonction(fonction);
    setFormData({
      code: fonction.code,
      libelle: fonction.libelle,
      commentaire: fonction.commentaire || '',
      ordre_affichage: fonction.ordre_affichage || 0,
      actif: fonction.actif
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (fonction: TypeFonction) => {
    if (window.confirm(t('employeeParams.functionTypes.messages.deleteConfirm'))) {
      try {
        const { error } = await supabase
          .from('rh_fonction')
          .delete()
          .eq('id', fonction.id);

        if (error) throw error;

        await fetchFonctions();
        addToast({
          label: t('employeeParams.functionTypes.messages.deleteSuccess'),
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        addToast({
          label: t('employeeParams.functionTypes.messages.deleteError'),
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  const columns: Column<TypeFonction>[] = [
    {
      label: t('employeeParams.functionTypes.columns.code'),
      accessor: 'code',
      sortable: true
    },
    {
      label: t('employeeParams.functionTypes.columns.label'),
      accessor: 'libelle',
      sortable: true
    },
    {
      label: t('employeeParams.functionTypes.columns.comment'),
      accessor: 'commentaire',
      render: (value) => value || '-'
    },
    {
      label: t('employeeParams.functionTypes.columns.displayOrder'),
      accessor: 'ordre_affichage',
      align: 'center',
      render: (value) => value?.toString() || '0'
    },
    {
      label: t('employeeParams.functionTypes.columns.active'),
      accessor: 'actif',
      align: 'center',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? t('employeeParams.common.yes') : t('employeeParams.common.no')}
        </span>
      )
    },
    {
      label: t('employeeParams.functionTypes.columns.createdAt'),
      accessor: 'created_at',
      render: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: getDateLocale() })
    }
  ];

  const actions = [
    {
      label: t('employeeParams.common.edit'),
      icon: 'edit' as const,
      color: 'var(--color-primary)',
      onClick: handleEdit
    },
    {
      label: t('employeeParams.common.delete'),
      icon: 'delete' as const,
      color: '#ef4444',
      onClick: handleDelete
    }
  ];

  return (
    <div className={styles.container}>
      <PageSection
        title={loading || profilLoading ? t('employeeParams.common.loading') : t('employeeParams.functionTypes.pageTitle')}
        description={t('employeeParams.functionTypes.pageDescription')}
        className={styles.header}
      >
        <div className="mb-6">
          <Button
            label={t('employeeParams.functionTypes.addNew')}
            icon="Plus"
            color="var(--color-primary)"
            onClick={() => {
              setSelectedFonction(null);
              setFormData({
                code: '',
                libelle: '',
                commentaire: '',
                ordre_affichage: 0,
                actif: true
              });
              setIsModalOpen(true);
            }}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">{t('employeeParams.common.loading')}</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={fonctions}
            actions={actions}
            defaultRowsPerPage={10}
            emptyTitle={t('employeeParams.functionTypes.pageTitle')}
            emptyMessage={t('employeeParams.common.noData')}
          />
        )}

        <ToastContainer toasts={toasts} onClose={closeToast} />

        <Modal 
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedFonction(null);
            setFormData({
              code: '',
              libelle: '',
              commentaire: '',
              ordre_affichage: 0,
              actif: true
            });
            setFormErrors({});
          }}
          title={selectedFonction ? t('employeeParams.functionTypes.editTitle') : t('employeeParams.functionTypes.createTitle')}
        >
              <Form size={100} onSubmit={handleSubmit}>
                <FormField
                  label={t('employeeParams.functionTypes.form.code')}
                  required
                  error={formErrors.code}
                  description="Code unique du type de fonction (10 caractères max)"
                >
                  <FormInput
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder={t('employeeParams.functionTypes.form.codePlaceholder')}
                    disabled={isSubmitting}
                    maxLength={10}
                  />
                </FormField>

                <FormField
                  label={t('employeeParams.functionTypes.form.label')}
                  required
                  error={formErrors.libelle}
                  description="Nom du type de fonction (50 caractères max)"
                >
                  <FormInput
                    name="libelle"
                    value={formData.libelle}
                    onChange={handleInputChange}
                    placeholder={t('employeeParams.functionTypes.form.labelPlaceholder')}
                    disabled={isSubmitting}
                    maxLength={50}
                  />
                </FormField>

                <FormField
                  label={t('employeeParams.functionTypes.form.displayOrder')}
                  description="Position dans la liste (0 = premier)"
                >
                  <FormInput
                    name="ordre_affichage"
                    type="number"
                    value={formData.ordre_affichage.toString()}
                    onChange={handleInputChange}
                    min="0"
                    step="1"
                    disabled={isSubmitting}
                  />
                </FormField>

                <FormField
                  label={t('employeeParams.functionTypes.form.comment')}
                  description="Description optionnelle du type de fonction"
                >
                  <textarea
                    name="commentaire"
                    value={formData.commentaire}
                    onChange={handleInputChange}
                    className="w-full p-2 text-sm border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
                    rows={3}
                    placeholder={t('employeeParams.functionTypes.form.commentPlaceholder')}
                    disabled={isSubmitting}
                  />
                </FormField>

                <FormField
                  label="Statut"
                  description="Activer ou désactiver le type de fonction"
                >
                  <Toggle
                    checked={formData.actif}
                    onChange={handleToggleChange}
                    label={formData.actif ? t('employeeParams.functionTypes.form.active') : 'Inactif'}
                    icon="Check"
                    disabled={isSubmitting}
                  />
                </FormField>

                <FormActions>
                  <Button
                    label={t('employeeParams.common.cancel')}
                    color="#6B7280"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedFonction(null);
                      setFormData({
                        code: '',
                        libelle: '',
                        commentaire: '',
                        ordre_affichage: 0,
                        actif: true
                      });
                      setFormErrors({});
                    }}
                    type="button"
                  />
                  <Button
                    label={isSubmitting ? 'Enregistrement...' : t('employeeParams.common.save')}
                    icon="Save"
                    color="var(--color-primary)"
                    type="submit"
                    disabled={isSubmitting}
                  />
                </FormActions>
              </Form>
        </Modal>
      </PageSection>
    </div>
  );
};

export default TypeFonction;