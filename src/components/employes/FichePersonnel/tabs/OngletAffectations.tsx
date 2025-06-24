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
const affectationSchema = z.object({
  id_entite: z.string().min(1, 'L\'entité est requise'),
  id_fonction: z.string().min(1, 'La fonction est requise'),
  id_contrat: z.string().min(1, 'Le contrat est requis'),
  date_debut: z.string().min(1, 'La date de début est requise'),
  date_fin: z.string().nullable().optional(),
  tx_presence: z.number().nullable().default(1),
  commentaire: z.string().nullable().optional()
});

type AffectationFormData = z.infer<typeof affectationSchema>;

interface Affectation {
  id: string;
  id_personnel: string;
  id_entite: string;
  id_fonction: string;
  id_contrat: string;
  date_debut: string;
  date_fin: string | null;
  tx_presence: number;
  actif: boolean;
  commentaire: string | null;
  created_at: string;
  entite: {
    code: string;
    libelle: string;
  };
  fonction: {
    code: string;
    libelle: string;
  };
  contrat: {
    type_contrat: {
      code: string;
      libelle: string;
    };
    date_debut: string;
    date_fin: string | null;
  };
}

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

interface Fonction {
  id: string;
  code: string;
  libelle: string;
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

interface OngletAffectationsProps {
  personnelId?: string;
  addToast: (toast: Omit<ToastData, 'id'>) => void;
}

export const OngletAffectations: React.FC<OngletAffectationsProps> = ({ personnelId, addToast }) => {
  const { profil } = useProfil();
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [fonctions, setFonctions] = useState<Fonction[]>([]);
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAffectation, setSelectedAffectation] = useState<Affectation | null>(null);

  // Initialiser le formulaire avec react-hook-form
  const { 
    control, 
    handleSubmit, 
    reset,
    setValue,
    watch,
    formState: { errors } 
  } = useForm<AffectationFormData>({
    resolver: zodResolver(affectationSchema),
    defaultValues: {
      id_entite: '',
      id_fonction: '',
      id_contrat: '',
      date_debut: '',
      date_fin: '',
      tx_presence: 1,
      commentaire: ''
    }
  });

  // Surveiller le taux de présence pour le formater
  const txPresenceValue = watch('tx_presence');

  // Charger les données de référence
  useEffect(() => {
    const fetchReferenceData = async () => {
      if (!profil?.com_contrat_client_id) return;

      try {
        // Charger les entités
        const { data: entitesData, error: entitesError } = await supabase
          .from('com_entite')
          .select('id, code, libelle')
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('actif', true)
          .order('libelle');

        if (entitesError) throw entitesError;
        setEntites(entitesData || []);

        // Charger les fonctions
        const { data: fonctionsData, error: fonctionsError } = await supabase
          .from('rh_fonction')
          .select('id, code, libelle')
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('actif', true)
          .order('libelle');

        if (fonctionsError) throw fonctionsError;
        setFonctions(fonctionsData || []);

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

  // Charger les affectations du personnel
  useEffect(() => {
    const fetchAffectations = async () => {
      if (!personnelId || !profil?.com_contrat_client_id) {
        setAffectations([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('rh_affectation')
          .select(`
            *,
            entite:id_entite (
              code,
              libelle
            ),
            fonction:id_fonction (
              code,
              libelle
            ),
            contrat:id_contrat (
              type_contrat:id_type_contrat (
                code,
                libelle
              ),
              date_debut,
              date_fin
            )
          `)
          .eq('id_personnel', personnelId)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .order('date_debut', { ascending: false });

        if (error) throw error;
        setAffectations(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des affectations:', error);
        addToast({
          label: 'Erreur lors du chargement des affectations',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAffectations();
  }, [personnelId, profil?.com_contrat_client_id, addToast]);

  // Ouvrir la modale pour ajouter une affectation
  const handleAddAffectation = () => {
    setSelectedAffectation(null);
    reset({
      id_entite: '',
      id_fonction: '',
      id_contrat: '',
      date_debut: '',
      date_fin: '',
      tx_presence: 1,
      commentaire: ''
    });
    setIsModalOpen(true);
  };

  // Ouvrir la modale pour éditer une affectation
  const handleEditAffectation = (affectation: Affectation) => {
    setSelectedAffectation(affectation);
    reset({
      id_entite: affectation.id_entite,
      id_fonction: affectation.id_fonction,
      id_contrat: affectation.id_contrat,
      date_debut: affectation.date_debut,
      date_fin: affectation.date_fin || '',
      tx_presence: affectation.tx_presence,
      commentaire: affectation.commentaire || ''
    });
    setIsModalOpen(true);
  };

  // Supprimer une affectation
  const handleDeleteAffectation = async (affectation: Affectation) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer cette affectation ?`)) return;

    try {
      const { error } = await supabase
        .from('rh_affectation')
        .delete()
        .eq('id', affectation.id);

      if (error) throw error;

      // Mettre à jour la liste des affectations
      setAffectations(prev => prev.filter(a => a.id !== affectation.id));
      
      addToast({
        label: 'Affectation supprimée avec succès',
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'affectation:', error);
      addToast({
        label: 'Erreur lors de la suppression de l\'affectation',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  // Soumettre le formulaire
  const onSubmit = async (data: AffectationFormData) => {
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
      if (selectedAffectation) {
        // Mode édition
        const { error } = await supabase
          .from('rh_affectation')
          .update({
            id_entite: data.id_entite,
            id_fonction: data.id_fonction,
            id_contrat: data.id_contrat,
            date_debut: data.date_debut,
            date_fin: data.date_fin || null,
            tx_presence: data.tx_presence,
            commentaire: data.commentaire || null
          })
          .eq('id', selectedAffectation.id);

        if (error) throw error;
        
        addToast({
          label: 'Affectation mise à jour avec succès',
          icon: 'Check',
          color: '#22c55e'
        });
      } else {
        // Mode création
        const { error } = await supabase
          .from('rh_affectation')
          .insert({
            id_personnel: personnelId,
            id_entite: data.id_entite,
            id_fonction: data.id_fonction,
            id_contrat: data.id_contrat,
            date_debut: data.date_debut,
            date_fin: data.date_fin || null,
            tx_presence: data.tx_presence,
            commentaire: data.commentaire || null,
            actif: true,
            com_contrat_client_id: profil.com_contrat_client_id
          });

        if (error) throw error;
        
        addToast({
          label: 'Affectation créée avec succès',
          icon: 'Check',
          color: '#22c55e'
        });
      }

      // Recharger les affectations
      const { data: updatedAffectations, error: fetchError } = await supabase
        .from('rh_affectation')
        .select(`
          *,
          entite:id_entite (
            code,
            libelle
          ),
          fonction:id_fonction (
            code,
            libelle
          ),
          contrat:id_contrat (
            type_contrat:id_type_contrat (
              code,
              libelle
            ),
            date_debut,
            date_fin
          )
        `)
        .eq('id_personnel', personnelId)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('date_debut', { ascending: false });

      if (fetchError) throw fetchError;
      setAffectations(updatedAffectations || []);
      
      // Fermer la modale
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'affectation:', error);
      addToast({
        label: 'Erreur lors de la sauvegarde de l\'affectation',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Options pour les listes déroulantes
  const entiteOptions: DropdownOption[] = [
    { value: '', label: 'Sélectionner une entité' },
    ...entites.map(entite => ({
      value: entite.id,
      label: `${entite.code} - ${entite.libelle}`
    }))
  ];

  const fonctionOptions: DropdownOption[] = [
    { value: '', label: 'Sélectionner une fonction' },
    ...fonctions.map(fonction => ({
      value: fonction.id,
      label: `${fonction.code} - ${fonction.libelle}`
    }))
  ];

  const contratOptions: DropdownOption[] = [
    { value: '', label: 'Sélectionner un contrat' },
    ...contrats.map(contrat => ({
      value: contrat.id,
      label: `${contrat.type_contrat.code} - ${format(new Date(contrat.date_debut), 'dd/MM/yyyy', { locale: fr })}`
    }))
  ];

  // Colonnes pour le tableau des affectations
  const columns: Column<Affectation>[] = [
    {
      label: 'Entité',
      accessor: 'entite',
      render: (value) => `${value.code} - ${value.libelle}`
    },
    {
      label: 'Fonction',
      accessor: 'fonction',
      render: (value) => `${value.code} - ${value.libelle}`
    },
    {
      label: 'Contrat',
      accessor: 'contrat',
      render: (value) => `${value.type_contrat.code} (${format(new Date(value.date_debut), 'dd/MM/yyyy', { locale: fr })})`
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
      label: 'Taux présence',
      accessor: 'tx_presence',
      render: (value) => `${(value * 100).toFixed(0)}%`
    },
    {
      label: 'Actif',
      accessor: 'actif',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Oui' : 'Non'}
        </span>
      )
    }
  ];

  // Actions pour le tableau
  const actions = [
    {
      label: 'Éditer',
      icon: 'edit',
      color: 'var(--color-primary)',
      onClick: handleEditAffectation
    },
    {
      label: 'Supprimer',
      icon: 'delete',
      color: '#ef4444',
      onClick: handleDeleteAffectation
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
        <h2 className="text-xl font-semibold">Affectations</h2>
        <Button
          label="Ajouter une affectation"
          icon="Plus"
          color="var(--color-primary)"
          onClick={handleAddAffectation}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Chargement des affectations...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={affectations}
          actions={actions}
          emptyTitle="Aucune affectation"
          emptyMessage="Aucune affectation n'a été créée pour ce personnel."
        />
      )}

      {/* Modale pour ajouter/éditer une affectation */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedAffectation ? 'Modifier une affectation' : 'Ajouter une affectation'}
        size="md"
      >
        <Form size={100} onSubmit={handleSubmit(onSubmit)}>
          <FormField
            label="Entité"
            required
            error={errors.id_entite?.message}
          >
            <Controller
              name="id_entite"
              control={control}
              render={({ field }) => (
                <Dropdown
                  options={entiteOptions}
                  value={field.value}
                  onChange={field.onChange}
                  label="Sélectionner une entité"
                  disabled={isSubmitting}
                />
              )}
            />
          </FormField>

          <FormField
            label="Fonction"
            required
            error={errors.id_fonction?.message}
          >
            <Controller
              name="id_fonction"
              control={control}
              render={({ field }) => (
                <Dropdown
                  options={fonctionOptions}
                  value={field.value}
                  onChange={field.onChange}
                  label="Sélectionner une fonction"
                  disabled={isSubmitting}
                />
              )}
            />
          </FormField>

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
            description="Laissez vide pour une affectation sans date de fin"
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
            label="Taux de présence"
            error={errors.tx_presence?.message}
            description="Valeur entre 0 et 1 (ex: 0.5 pour 50%)"
          >
            <Controller
              name="tx_presence"
              control={control}
              render={({ field }) => (
                <div className="flex items-center">
                  <FormInput
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    error={!!errors.tx_presence}
                    disabled={isSubmitting}
                    className="flex-1 mr-2"
                  />
                  <span className="w-16 text-center font-medium">
                    {(txPresenceValue * 100).toFixed(0)}%
                  </span>
                </div>
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
                  placeholder="Commentaire sur l'affectation..."
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