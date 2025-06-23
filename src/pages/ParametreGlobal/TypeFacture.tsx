import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMenu } from '../../context/MenuContext';
import { useProfil } from '../../context/ProfilContext';
import { supabase } from '../../lib/supabase';
import { menuItemsParametreGlobal } from '../../config/menuConfig';
import { PageSection } from '../../components/ui/page-section';
import { DataTable, Column } from '../../components/ui/data-table';
import { Button } from '../../components/ui/button';
import { ToastContainer, ToastData } from '../../components/ui/toast';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Toggle } from '../../components/ui/toggle';
import styles from './styles.module.css';

interface TypeFacture {
  id: string;
  code: string;
  libelle: string;
  actif: boolean;
  facture_exploitation: boolean;
  facture_rf: boolean;
  facture_autres: boolean;
  created_at: string;
  updated_at: string;
}

const TypeFacture: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [typesFacture, setTypesFacture] = useState<TypeFacture[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTypeFacture, setSelectedTypeFacture] = useState<TypeFacture | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    libelle: '',
    actif: true,
    facture_exploitation: false,
    facture_rh: false, 
    facture_autres: false
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [classificationError, setClassificationError] = useState<string | null>(null);

  const fetchTypesFacture = async () => {
    try {
      if (!profil?.com_contrat_client_id) {
        setTypesFacture([]);
        return;
      }

      const { data, error } = await supabase
        .from('com_param_type_facture')
        .select('*')
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('code');

      if (error) throw error;
      setTypesFacture(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des types de facture:', error);
      addToast({
        label: 'Erreur lors de la récupération des types de facture',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMenuItems(menuItemsParametreGlobal);
    if (!profilLoading) {
      fetchTypesFacture();
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur quand l'utilisateur modifie un champ
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

  const handleClassificationChange = (name: string, checked: boolean) => {
    if (checked) {
      // Si on active une classification, désactiver toutes les autres
      setFormData(prev => ({
        ...prev,
        facture_exploitation: name === 'facture_exploitation',
        facture_rh: name === 'facture_rh',
        facture_autres: name === 'facture_autres'
      }));
    } else {
      // Si on désactive une classification, juste la désactiver
      setFormData(prev => ({
        ...prev,
        [name]: false
      }));
    }
    
    // Effacer l'erreur de classification
    if (classificationError) {
      setClassificationError(null);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.code.trim()) {
      errors.code = 'Le code est requis';
    }
    
    if (!formData.libelle.trim()) {
      errors.libelle = 'Le libellé est requis';
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
      
      if (selectedTypeFacture) {
        // Mode édition
        const updateData = {
          code: formData.code,
          libelle: formData.libelle,
          actif: formData.actif,
          facture_exploitation: formData.facture_exploitation,
          facture_rh: formData.facture_rh,
          facture_autres: formData.facture_autres
        };

        const { error: updateError } = await supabase
          .from('com_param_type_facture')
          .update(updateData)
          .eq('id', selectedTypeFacture.id);
        error = updateError;
      } else {
        // Mode création
        const insertData = {
          code: formData.code,
          libelle: formData.libelle,
          actif: formData.actif,
          facture_exploitation: formData.facture_exploitation,
          facture_rh: formData.facture_rh,
          facture_autres: formData.facture_autres,
          com_contrat_client_id: profil.com_contrat_client_id
        };

        const { error: insertError } = await supabase
          .from('com_param_type_facture')
          .insert([insertData]);
        error = insertError;
      }

      if (error) throw error;

      await fetchTypesFacture();
      setIsModalOpen(false);
      setSelectedTypeFacture(null);
      setFormData({
        code: '',
        libelle: '',
        actif: true,
        facture_exploitation: false,
        facture_rh: false,
        facture_autres: false
      });
      addToast({
        label: `Type de facture ${selectedTypeFacture ? 'modifié' : 'créé'} avec succès`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      
      let errorMessage = `Erreur lors de la ${selectedTypeFacture ? 'modification' : 'création'} du type de facture`;
      
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

  const handleEdit = (typeFacture: TypeFacture) => {
    setSelectedTypeFacture(typeFacture);
    setFormData({
      code: typeFacture.code,
      libelle: typeFacture.libelle,
      actif: typeFacture.actif,
      facture_exploitation: typeFacture.facture_exploitation || false,
      facture_rh: typeFacture.facture_rh || false,
      facture_autres: typeFacture.facture_autres || false
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (typeFacture: TypeFacture) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le type de facture "${typeFacture.libelle}" ?`)) {
      try {
        const { error } = await supabase
          .from('com_param_type_facture')
          .delete()
          .eq('id', typeFacture.id);

        if (error) throw error;

        await fetchTypesFacture();
        addToast({
          label: `Le type de facture "${typeFacture.libelle}" a été supprimé avec succès`,
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        addToast({
          label: 'Erreur lors de la suppression du type de facture',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  const columns: Column<TypeFacture>[] = [
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
      label: 'Exploitation',
      accessor: 'facture_exploitation',
      align: 'center',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Oui' : 'Non'}
        </span>
      )
    },
    {
      label: 'RH',
      accessor: 'facture_rh',
      align: 'center',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Oui' : 'Non'}
        </span>
      )
    },
    {
      label: 'Autres',
      accessor: 'facture_autres',
      align: 'center',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Oui' : 'Non'}
        </span>
      )
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
    },
    {
      label: 'Dernière modification',
      accessor: 'updated_at',
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
        title={loading || profilLoading ? "Chargement..." : "Types de Facture"}
        description="Gérez les types de facture de votre organisation"
        className={styles.header}
      >
        <div className="mb-6">
          <Button
            label="Ajouter un type de facture"
            icon="Plus"
            color="var(--color-primary)"
            onClick={() => {
              setSelectedTypeFacture(null);
              setFormData({
                code: '',
                libelle: '',
                actif: true,
                facture_exploitation: false,
                facture_rh: false,
                facture_autres: false
              });
              setIsModalOpen(true);
            }}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Chargement des types de facture...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={typesFacture}
            actions={actions}
            defaultRowsPerPage={10}
            emptyTitle="Aucun type de facture"
            emptyMessage="Aucun type de facture n'a été créé pour le moment."
          />
        )}

        <ToastContainer toasts={toasts} onClose={closeToast} />

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {selectedTypeFacture ? 'Modifier un type de facture' : 'Ajouter un type de facture'}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedTypeFacture(null);
                    setFormData({
                      code: '',
                      libelle: '',
                      actif: true,
                      facture_exploitation: false,
                      facture_rh: false,
                      facture_autres: false
                    });
                    setFormErrors({});
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <Form size={100} onSubmit={handleSubmit}>
                <FormField
                  label="Code"
                  required
                  error={formErrors.code}
                  description="Code unique du type de facture"
                >
                  <FormInput
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="Ex: FOURNISSEUR, NOTE_FRAIS"
                    disabled={isSubmitting}
                  />
                </FormField>

                <FormField
                  label="Libellé"
                  required
                  error={formErrors.libelle}
                  description="Nom du type de facture"
                >
                  <FormInput
                    name="libelle"
                    value={formData.libelle}
                    onChange={handleInputChange}
                    placeholder="Ex: Facture fournisseur, Note de frais"
                    disabled={isSubmitting}
                  />
                </FormField>

                <FormField
                  label="Classification"
                  description="Type de classification de la facture"
                  error={classificationError}
                >
                  <div className="space-y-3">
                    <Toggle
                      checked={formData.facture_exploitation}
                      onChange={(checked) => handleClassificationChange('facture_exploitation', checked)}
                      label="Facture d'exploitation"
                      icon="Building"
                      disabled={isSubmitting}
                    />
                    
                    <Toggle
                      checked={formData.facture_rh}
                      onChange={(checked) => handleClassificationChange('facture_rh', checked)}
                      label="Facture RH"
                      icon="Users"
                      disabled={isSubmitting}
                    />
                    
                    <Toggle
                      checked={formData.facture_autres}
                      onChange={(checked) => handleClassificationChange('facture_autres', checked)}
                      label="Autres factures"
                      icon="Files"
                      disabled={isSubmitting}
                    />
                    
                    <div className="mt-2 text-xs text-gray-500">
                      <p>Note: Une seule classification peut être activée à la fois.</p>
                      <p>Pour chaque contrat client, il ne peut y avoir qu'un seul type de facture par classification.</p>
                    </div>
                  </div>
                </FormField>

                <FormField
                  label="Statut"
                  description="Activer ou désactiver le type de facture"
                >
                  <Toggle
                    checked={formData.actif}
                    onChange={handleToggleChange}
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
                      setSelectedTypeFacture(null);
                      setFormData({
                        code: '',
                        libelle: '',
                        actif: true,
                        facture_exploitation: false,
                        facture_rh: false, 
                        facture_autres: false
                      });
                      setFormErrors({});
                      setClassificationError(null);
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
            </div>
          </div>
        )}
      </PageSection>
    </div>
  );
};

export default TypeFacture;