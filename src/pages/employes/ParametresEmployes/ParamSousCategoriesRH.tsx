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
import { Form, FormField, FormActions } from '../../../components/ui/form';
import { Toggle } from '../../../components/ui/toggle';
import { Dropdown, DropdownOption } from '../../../components/ui/dropdown';
import { Modal } from '../../../components/ui/modal';
import { Users, Database } from 'lucide-react';
import styles from '../styles.module.css';

interface ParamSousCategorie {
  id: string;
  id_sous_categorie: string;
  soumis_charge_patronale: boolean;
  soumis_charge_salariale: boolean;
  id_sous_categorie_charge_patronale: string | null;
  id_sous_categorie_charge_salariale: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  sous_categorie: {
    code: string;
    libelle: string;
    categorie: {
      code: string;
      libelle: string;
      nature_flux: {
        code: string;
        libelle: string;
        salarie: boolean;
      };
    };
  };
  charge_patronale?: {
    code: string;
    libelle: string;
  };
  charge_salariale?: {
    code: string;
    libelle: string;
  };
}

interface SousCategorie {
  id: string;
  code: string;
  libelle: string;
  id_categorie: string;
  categorie: {
    id: string;
    code: string;
    libelle: string;
    nature_flux_id: string;
    nature_flux: {
      id: string;
      code: string;
      libelle: string;
      salarie: boolean;
    };
  };
}

const ParamSousCategoriesRH: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [parametres, setParametres] = useState<ParamSousCategorie[]>([]);
  const [sousCategories, setSousCategories] = useState<SousCategorie[]>([]);
  const [sousCategoriesRH, setSousCategoriesRH] = useState<SousCategorie[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParam, setSelectedParam] = useState<ParamSousCategorie | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id_sous_categorie: '',
    soumis_charge_patronale: false,
    soumis_charge_salariale: false,
    id_sous_categorie_charge_patronale: '',
    id_sous_categorie_charge_salariale: '',
    actif: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMenuItems(menuItemsParamGestionRH);
    if (!profilLoading) {
      fetchParametres();
      fetchSousCategories();
    }
  }, [setMenuItems, profilLoading, profil?.com_contrat_client_id]);

  const fetchParametres = async () => {
    try {
      if (!profil?.com_contrat_client_id) {
        setParametres([]);
        return;
      }

      const { data, error } = await supabase
        .from('rh_param_sous_categorie')
        .select(`
          *,
          sous_categorie:id_sous_categorie (
            code,
            libelle,
            categorie:id_categorie (
              code,
              libelle,
              nature_flux:nature_flux_id (
                code,
                libelle,
                salarie
              )
            )
          ),
          charge_patronale:id_sous_categorie_charge_patronale (
            code,
            libelle
          ),
          charge_salariale:id_sous_categorie_charge_salariale (
            code,
            libelle
          )
        `)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setParametres(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres de sous-catégories RH:', error);
      addToast({
        label: 'Erreur lors de la récupération des paramètres de sous-catégories RH',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSousCategories = async () => {
    try {
      if (!profil?.com_contrat_client_id) {
        setSousCategories([]);
        return;
      }

      // Récupérer toutes les sous-catégories avec leurs catégories et natures de flux
      const { data, error } = await supabase
        .from('fin_flux_sous_categorie')
        .select(`
          id,
          code,
          libelle,
          id_categorie,
          categorie:id_categorie (
            id,
            code,
            libelle,
            nature_flux_id,
            nature_flux:nature_flux_id (
              id,
              code,
              libelle,
              salarie
            )
          )
        `)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .eq('actif', true)
        .order('code');

      if (error) throw error;
      
      // Stocker toutes les sous-catégories
      setSousCategories(data || []);
      
      // Filtrer pour ne garder que les sous-catégories liées à une nature "salarie"
      const rhSousCategories = data?.filter(sc => 
        sc.categorie?.nature_flux?.salarie === true
      ) || [];
      
      setSousCategoriesRH(rhSousCategories);
      
    } catch (error) {
      console.error('Erreur lors de la récupération des sous-catégories:', error);
      addToast({
        label: 'Erreur lors de la récupération des sous-catégories',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
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
    
    // Effacer l'erreur quand l'utilisateur modifie un champ
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
    
    // Si on désactive les charges, réinitialiser les sous-catégories associées
    if (name === 'soumis_charge_patronale' && !checked) {
      setFormData(prev => ({
        ...prev,
        id_sous_categorie_charge_patronale: ''
      }));
    }
    
    if (name === 'soumis_charge_salariale' && !checked) {
      setFormData(prev => ({
        ...prev,
        id_sous_categorie_charge_salariale: ''
      }));
    }
  };

  const handleSousCategorieChange = (name: string) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.id_sous_categorie) {
      errors.id_sous_categorie = 'La sous-catégorie est requise';
    }
    
    if (formData.soumis_charge_patronale && !formData.id_sous_categorie_charge_patronale) {
      errors.id_sous_categorie_charge_patronale = 'La sous-catégorie pour les charges patronales est requise';
    }
    
    if (formData.soumis_charge_salariale && !formData.id_sous_categorie_charge_salariale) {
      errors.id_sous_categorie_charge_salariale = 'La sous-catégorie pour les charges salariales est requise';
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

      // Préparer les données pour l'insertion/mise à jour
      const paramData = {
        id_sous_categorie: formData.id_sous_categorie,
        soumis_charge_patronale: formData.soumis_charge_patronale,
        soumis_charge_salariale: formData.soumis_charge_salariale,
        id_sous_categorie_charge_patronale: formData.id_sous_categorie_charge_patronale || null,
        id_sous_categorie_charge_salariale: formData.id_sous_categorie_charge_salariale || null,
        actif: formData.actif,
        com_contrat_client_id: profil.com_contrat_client_id
      };

      let error;
      
      if (selectedParam) {
        // Mode édition
        const { error: updateError } = await supabase
          .from('rh_param_sous_categorie')
          .update(paramData)
          .eq('id', selectedParam.id);
        error = updateError;
      } else {
        // Mode création
        const { error: insertError } = await supabase
          .from('rh_param_sous_categorie')
          .insert([paramData]);
        error = insertError;
      }

      if (error) throw error;

      await fetchParametres();
      setIsModalOpen(false);
      setSelectedParam(null);
      setFormData({
        id_sous_categorie: '',
        soumis_charge_patronale: false,
        soumis_charge_salariale: false,
        id_sous_categorie_charge_patronale: '',
        id_sous_categorie_charge_salariale: '',
        actif: true
      });
      addToast({
        label: `Paramètre ${selectedParam ? 'modifié' : 'créé'} avec succès`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      
      let errorMessage = `Erreur lors de la ${selectedParam ? 'modification' : 'création'} du paramètre`;
      
      // Gestion des erreurs de contrainte d'unicité
      if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        errorMessage = 'Cette sous-catégorie est déjà paramétrée. Veuillez la modifier plutôt que d\'en créer une nouvelle.';
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

  const handleEdit = (param: ParamSousCategorie) => {
    setSelectedParam(param);
    setFormData({
      id_sous_categorie: param.id_sous_categorie,
      soumis_charge_patronale: param.soumis_charge_patronale,
      soumis_charge_salariale: param.soumis_charge_salariale,
      id_sous_categorie_charge_patronale: param.id_sous_categorie_charge_patronale || '',
      id_sous_categorie_charge_salariale: param.id_sous_categorie_charge_salariale || '',
      actif: param.actif
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (param: ParamSousCategorie) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ce paramètre pour la sous-catégorie "${param.sous_categorie.code} - ${param.sous_categorie.libelle}" ?`)) {
      try {
        const { error } = await supabase
          .from('rh_param_sous_categorie')
          .delete()
          .eq('id', param.id);

        if (error) throw error;

        await fetchParametres();
        addToast({
          label: `Le paramètre a été supprimé avec succès`,
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        addToast({
          label: 'Erreur lors de la suppression du paramètre',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  // Préparation des options pour les listes déroulantes
  const sousCategorieOptions: DropdownOption[] = sousCategoriesRH.map(sc => ({
    value: sc.id,
    label: `${sc.code} - ${sc.libelle} (${sc.categorie?.code})`
  }));

  // Toutes les sous-catégories pour les charges
  const sousCategorieChargeOptions: DropdownOption[] = [
    { value: '', label: 'Sélectionner une sous-catégorie' },
    ...sousCategories.map(sc => ({
      value: sc.id,
      label: `${sc.code} - ${sc.libelle} (${sc.categorie?.code})`
    }))
  ];

  // Colonnes pour le tableau
  const columns: Column<ParamSousCategorie>[] = [
    {
      label: 'Sous-catégorie',
      accessor: 'sous_categorie',
      render: (value) => `${value.code} - ${value.libelle}`
    },
    {
      label: 'Catégorie',
      accessor: 'sous_categorie',
      render: (value) => value.categorie ? `${value.categorie.code} - ${value.categorie.libelle}` : '-'
    },
    {
      label: 'Nature',
      accessor: 'sous_categorie',
      render: (value) => value.categorie?.nature_flux ? `${value.categorie.nature_flux.code}` : '-'
    },
    {
      label: 'Charges patronales',
      accessor: 'soumis_charge_patronale',
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
      label: 'Sous-cat. charges patronales',
      accessor: 'charge_patronale',
      render: (value) => value ? `${value.code} - ${value.libelle}` : '-'
    },
    {
      label: 'Charges salariales',
      accessor: 'soumis_charge_salariale',
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
      label: 'Sous-cat. charges salariales',
      accessor: 'charge_salariale',
      render: (value) => value ? `${value.code} - ${value.libelle}` : '-'
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
      label: 'Date de modification',
      accessor: 'updated_at',
      render: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: fr })
    }
  ];

  // Actions pour le tableau
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
        title={loading || profilLoading ? "Chargement..." : "Paramètres des Sous-Catégories RH"}
        description="Configurez les sous-catégories soumises aux charges patronales et salariales"
        className={styles.header}
      >
        <div className="mb-6">
          <Button
            label="Ajouter un paramètre"
            icon="Plus"
            color="var(--color-primary)"
            onClick={() => {
              setSelectedParam(null);
              setFormData({
                id_sous_categorie: '',
                soumis_charge_patronale: false,
                soumis_charge_salariale: false,
                id_sous_categorie_charge_patronale: '',
                id_sous_categorie_charge_salariale: '',
                actif: true
              });
              setIsModalOpen(true);
            }}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Chargement des paramètres...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={parametres}
            actions={actions}
            defaultRowsPerPage={10}
            emptyTitle="Aucun paramètre"
            emptyMessage="Aucun paramètre de sous-catégorie RH n'a été créé pour le moment."
          />
        )}

        <ToastContainer toasts={toasts} onClose={closeToast} />

        <Modal 
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedParam(null);
            setFormData({
              id_sous_categorie: '',
              soumis_charge_patronale: false,
              soumis_charge_salariale: false,
              id_sous_categorie_charge_patronale: '',
              id_sous_categorie_charge_salariale: '',
              actif: true
            });
            setFormErrors({});
          }}
          title={selectedParam ? 'Modifier un paramètre de sous-catégorie RH' : 'Ajouter un paramètre de sous-catégorie RH'}
        >
          <Form size={100} onSubmit={handleSubmit}>
            <FormField
              label="Sous-catégorie"
              required
              error={formErrors.id_sous_categorie}
              description="Sélectionnez une sous-catégorie liée à une nature de flux 'Salarié'"
            >
              <Dropdown
                options={sousCategorieOptions}
                value={formData.id_sous_categorie}
                onChange={handleSousCategorieChange('id_sous_categorie')}
                label="Sélectionner une sous-catégorie"
                disabled={isSubmitting || !!selectedParam}
              />
            </FormField>

            <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
              <div className="flex items-start mb-2">
                <Database className="text-blue-500 mr-2 mt-1" size={18} />
                <h3 className="text-blue-800 font-medium">Configuration des charges patronales</h3>
              </div>
              
              <FormField
                label="Soumis aux charges patronales"
                description="Indique si cette sous-catégorie est soumise aux charges patronales"
              >
                <Toggle
                  checked={formData.soumis_charge_patronale}
                  onChange={handleToggleChange('soumis_charge_patronale')}
                  label={formData.soumis_charge_patronale ? 'Oui' : 'Non'}
                  icon="Building"
                  disabled={isSubmitting}
                />
              </FormField>

              {formData.soumis_charge_patronale && (
                <FormField
                  label="Sous-catégorie pour les charges patronales"
                  required
                  error={formErrors.id_sous_categorie_charge_patronale}
                  description="Sous-catégorie où seront enregistrées les charges patronales calculées"
                >
                  <Dropdown
                    options={sousCategorieChargeOptions}
                    value={formData.id_sous_categorie_charge_patronale}
                    onChange={handleSousCategorieChange('id_sous_categorie_charge_patronale')}
                    label="Sélectionner une sous-catégorie"
                    disabled={isSubmitting}
                  />
                </FormField>
              )}
            </div>

            <div className="bg-purple-50 p-4 rounded-lg mb-4 border border-purple-200">
              <div className="flex items-start mb-2">
                <Users className="text-purple-500 mr-2 mt-1" size={18} />
                <h3 className="text-purple-800 font-medium">Configuration des charges salariales</h3>
              </div>
              
              <FormField
                label="Soumis aux charges salariales"
                description="Indique si cette sous-catégorie est soumise aux charges salariales"
              >
                <Toggle
                  checked={formData.soumis_charge_salariale}
                  onChange={handleToggleChange('soumis_charge_salariale')}
                  label={formData.soumis_charge_salariale ? 'Oui' : 'Non'}
                  icon="Users"
                  disabled={isSubmitting}
                />
              </FormField>

              {formData.soumis_charge_salariale && (
                <FormField
                  label="Sous-catégorie pour les charges salariales"
                  required
                  error={formErrors.id_sous_categorie_charge_salariale}
                  description="Sous-catégorie où seront enregistrées les charges salariales calculées"
                >
                  <Dropdown
                    options={sousCategorieChargeOptions}
                    value={formData.id_sous_categorie_charge_salariale}
                    onChange={handleSousCategorieChange('id_sous_categorie_charge_salariale')}
                    label="Sélectionner une sous-catégorie"
                    disabled={isSubmitting}
                  />
                </FormField>
              )}
            </div>

            <FormField
              label="Statut"
              description="Activer ou désactiver ce paramètre"
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
                  setSelectedParam(null);
                  setFormData({
                    id_sous_categorie: '',
                    soumis_charge_patronale: false,
                    soumis_charge_salariale: false,
                    id_sous_categorie_charge_patronale: '',
                    id_sous_categorie_charge_salariale: '',
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

export default ParamSousCategoriesRH;