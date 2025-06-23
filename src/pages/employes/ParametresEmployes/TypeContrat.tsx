import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
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

interface TypeContrat {
  id: string;
  code: string;
  libelle: string;
  commentaire: string | null;
  is_interne: boolean;
  actif: boolean;
  created_at: string;
}

const TypeContrat: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [contrats, setContrats] = useState<TypeContrat[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContrat, setSelectedContrat] = useState<TypeContrat | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    libelle: '',
    commentaire: '',
    is_interne: true,
    actif: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMenuItems(menuItemsParamGestionRH);
    if (!profilLoading) {
      fetchContrats();
    }
  }, [setMenuItems, profilLoading, profil?.com_contrat_client_id]);

  const fetchContrats = async () => {
    try {
      if (!profil?.com_contrat_client_id) {
        setContrats([]);
        return;
      }

      const { data, error } = await supabase
        .from('rh_type_contrat')
        .select('*')
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('code');

      if (error) throw error;
      setContrats(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des types de contrats:', error);
      addToast({
        label: 'Erreur lors de la récupération des types de contrats',
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleToggleChange = (name: string) => (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.code.trim()) {
      errors.code = 'Le code est requis';
    } else if (formData.code.length > 10) {
      errors.code = 'Le code ne doit pas dépasser 10 caractères';
    }
    
    if (!formData.libelle.trim()) {
      errors.libelle = 'Le libellé est requis';
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
      
      if (selectedContrat) {
        // Mode édition
        const updateData = {
          code: formData.code,
          libelle: formData.libelle,
          commentaire: formData.commentaire || null,
          is_interne: formData.is_interne,
          actif: formData.actif
        };

        const { error: updateError } = await supabase
          .from('rh_type_contrat')
          .update(updateData)
          .eq('id', selectedContrat.id);
        error = updateError;
      } else {
        // Mode création
        const insertData = {
          code: formData.code,
          libelle: formData.libelle,
          commentaire: formData.commentaire || null,
          is_interne: formData.is_interne,
          actif: formData.actif,
          com_contrat_client_id: profil.com_contrat_client_id
        };

        const { error: insertError } = await supabase
          .from('rh_type_contrat')
          .insert([insertData]);
        error = insertError;
      }

      if (error) throw error;

      await fetchContrats();
      setIsModalOpen(false);
      setSelectedContrat(null);
      setFormData({
        code: '',
        libelle: '',
        commentaire: '',
        is_interne: true,
        actif: true
      });
      addToast({
        label: `Type de contrat ${selectedContrat ? 'modifié' : 'créé'} avec succès`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      
      let errorMessage = `Erreur lors de la ${selectedContrat ? 'modification' : 'création'} du type de contrat`;
      
      // Gestion des erreurs de contrainte d'unicité
      if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        errorMessage = 'Ce code existe déjà. Veuillez utiliser un code unique.';
      }
      
      addToast({
        label: errorMessage,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (contrat: TypeContrat) => {
    setSelectedContrat(contrat);
    setFormData({
      code: contrat.code,
      libelle: contrat.libelle,
      commentaire: contrat.commentaire || '',
      is_interne: contrat.is_interne,
      actif: contrat.actif
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (contrat: TypeContrat) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le type de contrat "${contrat.libelle}" ?`)) {
      try {
        const { error } = await supabase
          .from('rh_type_contrat')
          .delete()
          .eq('id', contrat.id);

        if (error) throw error;

        await fetchContrats();
        addToast({
          label: `Le type de contrat "${contrat.libelle}" a été supprimé avec succès`,
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        addToast({
          label: 'Erreur lors de la suppression du type de contrat',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  const columns: Column<TypeContrat>[] = [
    {
      label: 'Code',
      accessor: 'code',
      sortable: true
    },
    {
      label: 'Libellé',
      accessor: 'libelle',
      sortable: true
    },
    {
      label: 'Type',
      accessor: 'is_interne',
      align: 'center',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
        }`}>
          {value ? 'Interne' : 'Externe'}
        </span>
      )
    },
    {
      label: 'Commentaire',
      accessor: 'commentaire',
      render: (value) => value || '-'
    },
    {
      label: 'Actif',
      accessor: 'actif',
      align: 'center',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Oui' : 'Non'}
        </span>
      )
    },
    {
      label: 'Date de création',
      accessor: 'created_at',
      render: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: fr })
    }
  ];

  const actions = [
    {
      label: 'Éditer',
      icon: 'edit',
      color: 'var(--color-primary)',
      onClick: handleEdit
    },
    {
      label: 'Supprimer',
      icon: 'delete',
      color: '#ef4444',
      onClick: handleDelete
    }
  ];

  return (
    <div className={styles.container}>
      <PageSection
        title={loading || profilLoading ? "Chargement..." : "Types de Contrats"}
        description="Gérez les types de contrats pour vos employés"
        className={styles.header}
      >
        <div className="mb-6">
          <Button
            label="Ajouter un type de contrat"
            icon="Plus"
            color="var(--color-primary)"
            onClick={() => {
              setSelectedContrat(null);
              setFormData({
                code: '',
                libelle: '',
                commentaire: '',
                is_interne: true,
                actif: true
              });
              setIsModalOpen(true);
            }}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Chargement des types de contrats...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={contrats}
            actions={actions}
            defaultRowsPerPage={10}
            emptyTitle="Aucun type de contrat"
            emptyMessage="Aucun type de contrat n'a été créé pour le moment."
          />
        )}

        <ToastContainer toasts={toasts} onClose={closeToast} />

        <Modal 
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedContrat(null);
            setFormData({
              code: '',
              libelle: '',
              commentaire: '',
              is_interne: true,
              actif: true
            });
            setFormErrors({});
          }}
          title={selectedContrat ? 'Modifier un type de contrat' : 'Ajouter un type de contrat'}
        >
          <Form size={100} onSubmit={handleSubmit}>
            <FormField
              label="Code"
              required
              error={formErrors.code}
              description="Code unique du type de contrat (10 caractères max)"
            >
              <FormInput
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="Ex: CDI, CDD, STAGE"
                disabled={isSubmitting}
                maxLength={10}
              />
            </FormField>

            <FormField
              label="Libellé"
              required
              error={formErrors.libelle}
              description="Nom du type de contrat (50 caractères max)"
            >
              <FormInput
                name="libelle"
                value={formData.libelle}
                onChange={handleInputChange}
                placeholder="Ex: Contrat à durée indéterminée"
                disabled={isSubmitting}
                maxLength={50}
              />
            </FormField>

            <FormField
              label="Type de contrat"
              description="Indiquez si le contrat est interne ou externe"
            >
              <Toggle
                checked={formData.is_interne}
                onChange={handleToggleChange('is_interne')}
                label={formData.is_interne ? 'Interne' : 'Externe'}
                icon="Users"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField
              label="Commentaire"
              description="Description optionnelle du type de contrat"
            >
              <textarea
                name="commentaire"
                value={formData.commentaire}
                onChange={handleInputChange}
                className="w-full p-2 text-sm border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
                rows={3}
                placeholder="Description ou notes sur ce type de contrat..."
                disabled={isSubmitting}
              />
            </FormField>

            <FormField
              label="Statut"
              description="Activer ou désactiver le type de contrat"
            >
              <Toggle
                checked={formData.actif}
                onChange={handleToggleChange('actif')}
                label={formData.actif ? 'Actif' : 'Inactif'}
                icon="Check"
                disabled={isSubmitting}
              />
            </FormField>

            <FormActions>
              <Button
                label="Annuler"
                color="#6B7280"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedContrat(null);
                  setFormData({
                    code: '',
                    libelle: '',
                    commentaire: '',
                    is_interne: true,
                    actif: true
                  });
                  setFormErrors({});
                }}
                type="button"
              />
              <Button
                label={isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
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

export default TypeContrat;