import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useProfil } from '../../../../context/ProfilContext';
import { DataTable, Column } from '../../../ui/data-table';
import { Button } from '../../../ui/button';
import { Form, FormField, FormInput, FormActions } from '../../../ui/form';
import { Dropdown, DropdownOption } from '../../../ui/dropdown';
import { Modal } from '../../../ui/modal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface HistoriqueFinancier {
  id: string;
  date_debut: string;
  date_fin: string | null;
  montant: number;
  commentaire: string | null;
  created_at: string;
  categorie: {
    id: string;
    code: string;
    libelle: string;
  };
  sous_categorie: {
    id: string;
    code: string;
    libelle: string;
  };
  contrat: {
    id: string;
    date_debut: string;
    date_fin: string | null;
    type_contrat: {
      code: string;
      libelle: string;
    };
  };
}

interface Categorie {
  id: string;
  code: string;
  libelle: string;
}

interface SousCategorie {
  id: string;
  code: string;
  libelle: string;
  id_categorie: string;
}

interface Contrat {
  id: string;
  date_debut: string;
  date_fin: string | null;
  type_contrat: {
    code: string;
    libelle: string;
  };
}

interface HistoriqueFinancierTabProps {
  personnelId: string | undefined;
  addToast: (toast: any) => void;
}

const HistoriqueFinancierTab: React.FC<HistoriqueFinancierTabProps> = ({ personnelId, addToast }) => {
  const { profil } = useProfil();
  const [historiques, setHistoriques] = useState<HistoriqueFinancier[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [sousCategories, setSousCategories] = useState<SousCategorie[]>([]);
  const [filteredSousCategories, setFilteredSousCategories] = useState<SousCategorie[]>([]);
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHistorique, setSelectedHistorique] = useState<HistoriqueFinancier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id_contrat: '',
    id_categorie: '',
    id_sous_categorie: '',
    date_debut: '',
    date_fin: '',
    montant: '',
    commentaire: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Chargement des historiques financiers
  useEffect(() => {
    const fetchHistoriques = async () => {
      if (!personnelId || !profil?.com_contrat_client_id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('rh_historique_financier')
          .select(`
            *,
            categorie:id_categorie (
              id,
              code,
              libelle
            ),
            sous_categorie:id_sous_categorie (
              id,
              code,
              libelle
            ),
            contrat:id_contrat (
              id,
              date_debut,
              date_fin,
              type_contrat:id_type_contrat (
                code,
                libelle
              )
            )
          `)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('contrat.id_personnel', personnelId)
          .order('date_debut', { ascending: false });

        if (error) throw error;
        setHistoriques(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des historiques financiers:', error);
        addToast({
          label: 'Erreur lors du chargement des historiques financiers',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHistoriques();
  }, [personnelId, profil?.com_contrat_client_id, addToast]);

  // Chargement des données de référence
  useEffect(() => {
    const fetchReferenceData = async () => {
      if (!profil?.com_contrat_client_id || !personnelId) return;

      try {
        // Charger les catégories de flux
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('fin_flux_categorie')
          .select('id, code, libelle')
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('actif', true)
          .order('libelle');

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Charger les sous-catégories de flux
        const { data: sousCategoriesData, error: sousCategoriesError } = await supabase
          .from('fin_flux_sous_categorie')
          .select('id, code, libelle, id_categorie')
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('actif', true)
          .order('libelle');

        if (sousCategoriesError) throw sousCategoriesError;
        setSousCategories(sousCategoriesData || []);

        // Charger les contrats de l'employé
        const { data: contratsData, error: contratsError } = await supabase
          .from('rh_historique_contrat')
          .select(`
            id,
            date_debut,
            date_fin,
            type_contrat:id_type_contrat (
              code,
              libelle
            )
          `)
          .eq('id_personnel', personnelId)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .order('date_debut', { ascending: false });

        if (contratsError) throw contratsError;
        setContrats(contratsData || []);
      } catch (error) {
        console.error('Erreur lors du chargement des données de référence:', error);
        addToast({
          label: 'Erreur lors du chargement des données de référence',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    };

    fetchReferenceData();
  }, [profil?.com_contrat_client_id, personnelId, addToast]);

  // Filtrer les sous-catégories en fonction de la catégorie sélectionnée
  useEffect(() => {
    if (formData.id_categorie) {
      const filtered = sousCategories.filter(sc => sc.id_categorie === formData.id_categorie);
      setFilteredSousCategories(filtered);
      
      // Si la sous-catégorie sélectionnée n'est pas dans la liste filtrée, la réinitialiser
      if (formData.id_sous_categorie && !filtered.some(sc => sc.id === formData.id_sous_categorie)) {
        setFormData(prev => ({
          ...prev,
          id_sous_categorie: ''
        }));
      }
    } else {
      setFilteredSousCategories([]);
    }
  }, [formData.id_categorie, sousCategories, formData.id_sous_categorie]);

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

  const handleDropdownChange = (name: string) => (value: string) => {
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
    
    if (!formData.id_contrat) errors.id_contrat = 'Le contrat est requis';
    if (!formData.id_categorie) errors.id_categorie = 'La catégorie est requise';
    if (!formData.id_sous_categorie) errors.id_sous_categorie = 'La sous-catégorie est requise';
    if (!formData.date_debut) errors.date_debut = 'La date de début est requise';
    if (formData.date_fin && new Date(formData.date_fin) < new Date(formData.date_debut)) {
      errors.date_fin = 'La date de fin doit être postérieure à la date de début';
    }
    if (!formData.montant) {
      errors.montant = 'Le montant est requis';
    } else if (isNaN(parseFloat(formData.montant))) {
      errors.montant = 'Le montant doit être un nombre';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !personnelId || !profil?.com_contrat_client_id) return;
    
    setIsSubmitting(true);
    try {
      const historiqueData = {
        id_contrat: formData.id_contrat,
        id_categorie: formData.id_categorie,
        id_sous_categorie: formData.id_sous_categorie,
        date_debut: formData.date_debut,
        date_fin: formData.date_fin || null,
        montant: parseFloat(formData.montant),
        commentaire: formData.commentaire || null,
        com_contrat_client_id: profil.com_contrat_client_id
      };
      
      let error;
      
      if (selectedHistorique) {
        // Mode édition
        const { error: updateError } = await supabase
          .from('rh_historique_financier')
          .update(historiqueData)
          .eq('id', selectedHistorique.id);
          
        error = updateError;
      } else {
        // Mode création
        const { error: insertError } = await supabase
          .from('rh_historique_financier')
          .insert([historiqueData]);
          
        error = insertError;
      }
      
      if (error) throw error;
      
      // Rafraîchir la liste des historiques
      const { data, error: fetchError } = await supabase
        .from('rh_historique_financier')
        .select(`
          *,
          categorie:id_categorie (
            id,
            code,
            libelle
          ),
          sous_categorie:id_sous_categorie (
            id,
            code,
            libelle
          ),
          contrat:id_contrat (
            id,
            date_debut,
            date_fin,
            type_contrat:id_type_contrat (
              code,
              libelle
            )
          )
        `)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .eq('contrat.id_personnel', personnelId)
        .order('date_debut', { ascending: false });
        
      if (fetchError) throw fetchError;
      setHistoriques(data || []);
      
      // Fermer la modale et réinitialiser le formulaire
      setIsModalOpen(false);
      setSelectedHistorique(null);
      setFormData({
        id_contrat: '',
        id_categorie: '',
        id_sous_categorie: '',
        date_debut: '',
        date_fin: '',
        montant: '',
        commentaire: ''
      });
      
      addToast({
        label: `Historique financier ${selectedHistorique ? 'modifié' : 'créé'} avec succès`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'historique financier:', error);
      addToast({
        label: `Erreur lors de la ${selectedHistorique ? 'modification' : 'création'} de l'historique financier`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (historique: HistoriqueFinancier) => {
    setSelectedHistorique(historique);
    setFormData({
      id_contrat: historique.contrat.id,
      id_categorie: historique.categorie.id,
      id_sous_categorie: historique.sous_categorie.id,
      date_debut: historique.date_debut,
      date_fin: historique.date_fin || '',
      montant: historique.montant.toString(),
      commentaire: historique.commentaire || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (historique: HistoriqueFinancier) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer cet historique financier ?`)) return;
    
    try {
      const { error } = await supabase
        .from('rh_historique_financier')
        .delete()
        .eq('id', historique.id);
        
      if (error) throw error;
      
      // Mettre à jour la liste des historiques
      setHistoriques(prev => prev.filter(h => h.id !== historique.id));
      
      addToast({
        label: 'Historique financier supprimé avec succès',
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'historique financier:', error);
      addToast({
        label: 'Erreur lors de la suppression de l\'historique financier',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const columns: Column<HistoriqueFinancier>[] = [
    {
      label: 'Contrat',
      accessor: 'contrat',
      render: (value) => `${value.type_contrat.code} (${format(new Date(value.date_debut), 'dd/MM/yyyy', { locale: fr })})`
    },
    {
      label: 'Catégorie',
      accessor: 'categorie',
      render: (value) => `${value.code} - ${value.libelle}`
    },
    {
      label: 'Sous-catégorie',
      accessor: 'sous_categorie',
      render: (value) => `${value.code} - ${value.libelle}`
    },
    {
      label: 'Date de début',
      accessor: 'date_debut',
      render: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: fr })
    },
    {
      label: 'Date de fin',
      accessor: 'date_fin',
      render: (value) => value ? format(new Date(value), 'dd/MM/yyyy', { locale: fr }) : 'Indéterminée'
    },
    {
      label: 'Montant',
      accessor: 'montant',
      align: 'right',
      render: (value) => `${value.toFixed(2)} €`
    },
    {
      label: 'Commentaire',
      accessor: 'commentaire',
      render: (value) => value || '-'
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

  const contratOptions: DropdownOption[] = [
    { value: '', label: 'Sélectionner un contrat' },
    ...contrats.map(contrat => ({
      value: contrat.id,
      label: `${contrat.type_contrat.code} - ${format(new Date(contrat.date_debut), 'dd/MM/yyyy', { locale: fr })}`
    }))
  ];

  const categorieOptions: DropdownOption[] = [
    { value: '', label: 'Sélectionner une catégorie' },
    ...categories.map(categorie => ({
      value: categorie.id,
      label: `${categorie.code} - ${categorie.libelle}`
    }))
  ];

  const sousCategorieOptions: DropdownOption[] = [
    { value: '', label: formData.id_categorie ? 'Sélectionner une sous-catégorie' : 'Sélectionner d\'abord une catégorie' },
    ...filteredSousCategories.map(sousCategorie => ({
      value: sousCategorie.id,
      label: `${sousCategorie.code} - ${sousCategorie.libelle}`
    }))
  ];

  if (!personnelId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <p className="text-yellow-700">Veuillez d'abord enregistrer les informations personnelles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Historique financier</h2>
        <Button
          label="Ajouter un historique financier"
          icon="Plus"
          color="var(--color-primary)"
          onClick={() => {
            setSelectedHistorique(null);
            setFormData({
              id_contrat: '',
              id_categorie: '',
              id_sous_categorie: '',
              date_debut: '',
              date_fin: '',
              montant: '',
              commentaire: ''
            });
            setIsModalOpen(true);
          }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Chargement des historiques financiers...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={historiques}
          actions={actions}
          defaultRowsPerPage={5}
          emptyTitle="Aucun historique financier"
          emptyMessage="Aucun historique financier n'a été créé pour cet employé."
        />
      )}

      {/* Modale d'ajout/édition d'historique financier */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedHistorique(null);
          setFormData({
            id_contrat: '',
            id_categorie: '',
            id_sous_categorie: '',
            date_debut: '',
            date_fin: '',
            montant: '',
            commentaire: ''
          });
          setFormErrors({});
        }}
        title={selectedHistorique ? 'Modifier un historique financier' : 'Ajouter un historique financier'}
      >
        <Form size={100} onSubmit={handleSubmit}>
          <FormField
            label="Contrat"
            required
            error={formErrors.id_contrat}
          >
            <Dropdown
              options={contratOptions}
              value={formData.id_contrat}
              onChange={handleDropdownChange('id_contrat')}
              label="Sélectionner un contrat"
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label="Catégorie"
            required
            error={formErrors.id_categorie}
          >
            <Dropdown
              options={categorieOptions}
              value={formData.id_categorie}
              onChange={handleDropdownChange('id_categorie')}
              label="Sélectionner une catégorie"
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label="Sous-catégorie"
            required
            error={formErrors.id_sous_categorie}
          >
            <Dropdown
              options={sousCategorieOptions}
              value={formData.id_sous_categorie}
              onChange={handleDropdownChange('id_sous_categorie')}
              label={formData.id_categorie ? "Sélectionner une sous-catégorie" : "Sélectionner d'abord une catégorie"}
              disabled={isSubmitting || !formData.id_categorie}
            />
          </FormField>

          <FormField
            label="Date de début"
            required
            error={formErrors.date_debut}
          >
            <FormInput
              name="date_debut"
              type="date"
              value={formData.date_debut}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label="Date de fin"
            error={formErrors.date_fin}
            description="Laisser vide pour une période indéterminée"
          >
            <FormInput
              name="date_fin"
              type="date"
              value={formData.date_fin}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label="Montant"
            required
            error={formErrors.montant}
          >
            <FormInput
              name="montant"
              type="number"
              step="0.01"
              value={formData.montant}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label="Commentaire"
            error={formErrors.commentaire}
          >
            <textarea
              name="commentaire"
              value={formData.commentaire}
              onChange={handleInputChange}
              className="w-full p-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
              rows={3}
              disabled={isSubmitting}
            />
          </FormField>

          <FormActions>
            <Button
              label="Annuler"
              color="#6B7280"
              onClick={() => {
                setIsModalOpen(false);
                setSelectedHistorique(null);
              }}
              type="button"
              disabled={isSubmitting}
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
    </div>
  );
};

export default HistoriqueFinancierTab;