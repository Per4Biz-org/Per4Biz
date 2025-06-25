import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../../../../lib/supabase';
import { useProfil } from '../../../../context/ProfilContext';
import { Form, FormField, FormInput, FormActions } from '../../../../components/ui/form';
import { Button } from '../../../../components/ui/button';
import { Dropdown, DropdownOption } from '../../../../components/ui/dropdown';
import { DataTable, Column } from '../../../../components/ui/data-table';
import { Modal } from '../../../../components/ui/modal';
import { ToastData } from '../../../../components/ui/toast';

// Schéma de validation avec Zod
const historiqueFinancierSchema = z.object({
  id_contrat: z.string().min(1, 'Le contrat est requis'),
  id_categorie: z.string().min(1, 'La catégorie est requise'),
  id_sous_categorie: z.string().min(1, 'La sous-catégorie est requise'),
  date_debut: z.string().min(1, 'La date de début est requise'),
  date_fin: z.string().nullable().optional(),
  montant: z.number().min(0, 'Le montant doit être positif'),
  commentaire: z.string().nullable().optional()
});

type HistoriqueFinancierFormData = z.infer<typeof historiqueFinancierSchema>;

interface HistoriqueFinancier {
  id: string;
  id_personnel: string;
  id_contrat: string;
  id_categorie: string;
  id_sous_categorie: string;
  date_debut: string;
  date_fin: string | null;
  montant: number;
  commentaire: string | null;
  created_at: string;
  contrat: {
    type_contrat: {
      code: string;
      libelle: string;
    };
    date_debut: string;
    date_fin: string | null;
  };
  categorie: {
    code: string;
    libelle: string;
  };
  sous_categorie: {
    code: string;
    libelle: string;
  };
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

interface OngletHistoriqueFinancierProps {
  personnelId?: string;
  addToast: (toast: Omit<ToastData, 'id'>) => void;
}

export const OngletHistoriqueFinancier: React.FC<OngletHistoriqueFinancierProps> = ({ 
  personnelId, 
  addToast 
}) => {
  const { profil } = useProfil();
  const [historiqueFinancier, setHistoriqueFinancier] = useState<HistoriqueFinancier[]>([]);
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [sousCategories, setSousCategories] = useState<SousCategorie[]>([]);
  const [filteredSousCategories, setFilteredSousCategories] = useState<SousCategorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedHistorique, setSelectedHistorique] = useState<HistoriqueFinancier | null>(null);

  // Initialiser le formulaire avec react-hook-form
  const { 
    control, 
    handleSubmit, 
    reset,
    watch,
    setValue,
    formState: { errors } 
  } = useForm<HistoriqueFinancierFormData>({
    resolver: zodResolver(historiqueFinancierSchema),
    defaultValues: {
      id_contrat: '',
      id_categorie: '',
      id_sous_categorie: '',
      date_debut: '',
      date_fin: '',
      montant: 0,
      commentaire: ''
    }
  });

  // Surveiller la catégorie sélectionnée pour filtrer les sous-catégories
  const selectedCategorie = watch('id_categorie');

  // Filtrer les sous-catégories en fonction de la catégorie sélectionnée
  useEffect(() => {
    if (selectedCategorie) {
      const filtered = sousCategories.filter(sc => sc.id_categorie === selectedCategorie);
      setFilteredSousCategories(filtered);
      
      // Si la sous-catégorie sélectionnée n'est pas dans la liste filtrée, la réinitialiser
      const currentSousCategorie = watch('id_sous_categorie');
      if (currentSousCategorie && !filtered.some(sc => sc.id === currentSousCategorie)) {
        setValue('id_sous_categorie', '');
      }
    } else {
      setFilteredSousCategories([]);
      setValue('id_sous_categorie', '');
    }
  }, [selectedCategorie, sousCategories, setValue, watch]);

  // Charger les données de référence
  useEffect(() => {
    const fetchReferenceData = async () => {
      if (!profil?.com_contrat_client_id) return;

      try {
        // Charger les contrats du personnel si personnelId est défini
        if (personnelId) {
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
        }

        // Charger les catégories de flux RH
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('fin_flux_categorie')
          .select('id, code, libelle')
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('actif', true)
          .order('libelle');

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Charger toutes les sous-catégories
        const { data: sousCategoriesData, error: sousCategoriesError } = await supabase
          .from('fin_flux_sous_categorie')
          .select('id, code, libelle, id_categorie')
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('actif', true)
          .order('libelle');

        if (sousCategoriesError) throw sousCategoriesError;
        setSousCategories(sousCategoriesData || []);
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

  // Charger l'historique financier du personnel
  useEffect(() => {
    const fetchHistoriqueFinancier = async () => {
      if (!personnelId || !profil?.com_contrat_client_id) {
        setHistoriqueFinancier([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('rh_historique_financier')
          .select(`
            *,
            contrat:id_contrat (
              type_contrat:id_type_contrat (
                code,
                libelle
              ),
              date_debut,
              date_fin
            ),
            categorie:id_categorie (
              code,
              libelle
            ),
            sous_categorie:id_sous_categorie (
              code,
              libelle
            )
          `)
          .eq('id_personnel', personnelId)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .order('date_debut', { ascending: false });

        if (error) throw error;
        setHistoriqueFinancier(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique financier:', error);
        addToast({
          label: 'Erreur lors du chargement de l\'historique financier',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHistoriqueFinancier();
  }, [personnelId, profil?.com_contrat_client_id, addToast]);

  // Ouvrir la modale pour ajouter un élément d'historique financier
  const handleAddHistorique = () => {
    setSelectedHistorique(null);
    reset({
      id_contrat: '',
      id_categorie: '',
      id_sous_categorie: '',
      date_debut: '',
      date_fin: '',
      montant: 0,
      commentaire: ''
    });
    setIsModalOpen(true);
  };

  // Ouvrir la modale pour éditer un élément d'historique financier
  const handleEditHistorique = (historique: HistoriqueFinancier) => {
    setSelectedHistorique(historique);
    reset({
      id_contrat: historique.id_contrat,
      id_categorie: historique.id_categorie,
      id_sous_categorie: historique.id_sous_categorie,
      date_debut: historique.date_debut,
      date_fin: historique.date_fin || '',
      montant: historique.montant,
      commentaire: historique.commentaire || ''
    });
    setIsModalOpen(true);
  };

  // Supprimer un élément d'historique financier
  const handleDeleteHistorique = async (historique: HistoriqueFinancier) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer cet élément d'historique financier ?`)) return;

    try {
      const { error } = await supabase
        .from('rh_historique_financier')
        .delete()
        .eq('id', historique.id);

      if (error) throw error;

      // Mettre à jour la liste de l'historique financier
      setHistoriqueFinancier(prev => prev.filter(h => h.id !== historique.id));
      
      addToast({
        label: 'Élément d\'historique financier supprimé avec succès',
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

  // Soumettre le formulaire
  const onSubmit = async (data: HistoriqueFinancierFormData) => {
    if (!personnelId || !profil?.com_contrat_client_id) {
      addToast({
        label: 'Erreur: Données incomplètes',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedHistorique) {
        // Mode édition
        const { error } = await supabase
          .from('rh_historique_financier')
          .update({
            id_contrat: data.id_contrat,
            id_categorie: data.id_categorie,
            id_sous_categorie: data.id_sous_categorie,
            date_debut: data.date_debut,
            date_fin: data.date_fin || null,
            montant: data.montant,
            commentaire: data.commentaire || null
          })
          .eq('id', selectedHistorique.id);

        if (error) throw error;
        
        addToast({
          label: 'Historique financier mis à jour avec succès',
          icon: 'Check',
          color: '#22c55e'
        });
      } else {
        // Mode création
        const { error } = await supabase
          .from('rh_historique_financier')
          .insert({
            id_personnel: personnelId,
            id_contrat: data.id_contrat,
            id_categorie: data.id_categorie,
            id_sous_categorie: data.id_sous_categorie,
            date_debut: data.date_debut,
            date_fin: data.date_fin || null,
            montant: data.montant,
            commentaire: data.commentaire || null,
            com_contrat_client_id: profil.com_contrat_client_id
          });

        if (error) throw error;
        
        addToast({
          label: 'Historique financier créé avec succès',
          icon: 'Check',
          color: '#22c55e'
        });
      }

      // Recharger l'historique financier
      const { data: updatedHistorique, error: fetchError } = await supabase
        .from('rh_historique_financier')
        .select(`
          *,
          contrat:id_contrat (
            type_contrat:id_type_contrat (
              code,
              libelle
            ),
            date_debut,
            date_fin
          ),
          categorie:id_categorie (
            code,
            libelle
          ),
          sous_categorie:id_sous_categorie (
            code,
            libelle
          )
        `)
        .eq('id_personnel', personnelId)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('date_debut', { ascending: false });

      if (fetchError) throw fetchError;
      setHistoriqueFinancier(updatedHistorique || []);
      
      // Fermer la modale
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'historique financier:', error);
      addToast({
        label: 'Erreur lors de la sauvegarde de l\'historique financier',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Options pour les listes déroulantes
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
    { value: '', label: selectedCategorie ? 'Sélectionner une sous-catégorie' : 'Sélectionnez d\'abord une catégorie' },
    ...filteredSousCategories.map(sousCategorie => ({
      value: sousCategorie.id,
      label: `${sousCategorie.code} - ${sousCategorie.libelle}`
    }))
  ];

  // Colonnes pour le tableau de l'historique financier
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

  // Actions pour le tableau
  const actions = [
    {
      label: 'Éditer',
      icon: 'edit',
      color: 'var(--color-primary)',
      onClick: handleEditHistorique
    },
    {
      label: 'Supprimer',
      icon: 'delete',
      color: '#ef4444',
      onClick: handleDeleteHistorique
    }
  ];

  if (!personnelId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        Veuillez d'abord enregistrer les informations personnelles.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Historique financier</h2>
        <Button
          label="Ajouter un élément"
          icon="Plus"
          color="var(--color-primary)"
          onClick={handleAddHistorique}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Chargement de l'historique financier...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={historiqueFinancier}
          actions={actions}
          emptyTitle="Aucun historique financier"
          emptyMessage="Aucun élément d'historique financier n'a été créé pour ce personnel."
        />
      )}

      {/* Modale pour ajouter/éditer un élément d'historique financier */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedHistorique ? 'Modifier un élément d\'historique financier' : 'Ajouter un élément d\'historique financier'}
        size="md"
      >
        <Form size={100} onSubmit={handleSubmit(onSubmit)}>
          <FormField
            label="Contrat"
            required
            error={errors.id_contrat?.message}
          >
            <Controller
              name="id_contrat"
              control={control}
              render={({ field }) => (
                <Dropdown
                  options={contratOptions}
                  value={field.value}
                  onChange={field.onChange}
                  label="Sélectionner un contrat"
                  disabled={isSubmitting}
                />
              )}
            />
          </FormField>

          <FormField
            label="Catégorie"
            required
            error={errors.id_categorie?.message}
          >
            <Controller
              name="id_categorie"
              control={control}
              render={({ field }) => (
                <Dropdown
                  options={categorieOptions}
                  value={field.value}
                  onChange={field.onChange}
                  label="Sélectionner une catégorie"
                  disabled={isSubmitting}
                />
              )}
            />
          </FormField>

          <FormField
            label="Sous-catégorie"
            required
            error={errors.id_sous_categorie?.message}
          >
            <Controller
              name="id_sous_categorie"
              control={control}
              render={({ field }) => (
                <Dropdown
                  options={sousCategorieOptions}
                  value={field.value}
                  onChange={field.onChange}
                  label={selectedCategorie ? "Sélectionner une sous-catégorie" : "Sélectionnez d'abord une catégorie"}
                  disabled={isSubmitting || !selectedCategorie}
                />
              )}
            />
          </FormField>

          <FormField
            label="Date de début"
            required
            error={errors.date_debut?.message}
          >
            <Controller
              name="date_debut"
              control={control}
              render={({ field }) => (
                <FormInput
                  type="date"
                  {...field}
                  error={!!errors.date_debut}
                  disabled={isSubmitting}
                />
              )}
            />
          </FormField>

          <FormField
            label="Date de fin"
            error={errors.date_fin?.message}
            description="Laissez vide pour un élément sans date de fin"
          >
            <Controller
              name="date_fin"
              control={control}
              render={({ field }) => (
                <FormInput
                  type="date"
                  {...field}
                  error={!!errors.date_fin}
                  disabled={isSubmitting}
                />
              )}
            />
          </FormField>

          <FormField
            label="Montant"
            required
            error={errors.montant?.message}
          >
            <Controller
              name="montant"
              control={control}
              render={({ field }) => (
                <FormInput
                  type="number"
                  step="0.01"
                  min="0"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  error={!!errors.montant}
                  disabled={isSubmitting}
                />
              )}
            />
          </FormField>

          <FormField
            label="Commentaire"
            error={errors.commentaire?.message}
          >
            <Controller
              name="commentaire"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  className="w-full p-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="Commentaire sur cet élément d'historique financier..."
                  disabled={isSubmitting}
                />
              )}
            />
          </FormField>

          <FormActions>
            <Button
              label="Annuler"
              color="#6B7280"
              onClick={() => setIsModalOpen(false)}
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