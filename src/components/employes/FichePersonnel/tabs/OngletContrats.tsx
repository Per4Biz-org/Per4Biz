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
const contratSchema = z.object({
  id_type_contrat: z.string().min(1, 'Le type de contrat est requis'),
  date_debut: z.string().min(1, 'La date de début est requise'),
  date_fin: z.string().nullable().optional(),
  commentaire: z.string().nullable().optional(),
  id_entite_payeur: z.string().nullable().optional()
});

type ContratFormData = z.infer<typeof contratSchema>;

interface Contrat {
  id: string;
  id_personnel: string;
  id_type_contrat: string;
  date_debut: string;
  date_fin: string | null;
  commentaire: string | null;
  id_entite_payeur: string | null;
  created_at: string;
  type_contrat: {
    code: string;
    libelle: string;
  };
  entite_payeur: {
    code: string;
    libelle: string;
  } | null;
}

interface TypeContrat {
  id: string;
  code: string;
  libelle: string;
}

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

interface OngletContratsProps {
  personnelId?: string;
  addToast: (toast: Omit<ToastData, 'id'>) => void;
}

export const OngletContrats: React.FC<OngletContratsProps> = ({ personnelId, addToast }) => {
  const { profil } = useProfil();
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [typesContrat, setTypesContrat] = useState<TypeContrat[]>([]);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedContrat, setSelectedContrat] = useState<Contrat | null>(null);

  // Initialiser le formulaire avec react-hook-form
  const { 
    control, 
    handleSubmit, 
    reset,
    formState: { errors } 
  } = useForm<ContratFormData>({
    resolver: zodResolver(contratSchema),
    defaultValues: {
      id_type_contrat: '',
      date_debut: '',
      date_fin: '',
      commentaire: '',
      id_entite_payeur: ''
    }
  });

  // Charger les données de référence
  useEffect(() => {
    const fetchReferenceData = async () => {
      if (!profil?.com_contrat_client_id) return;

      try {
        // Charger les types de contrat
        const { data: typesContratData, error: typesContratError } = await supabase
          .from('rh_type_contrat')
          .select('id, code, libelle')
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('actif', true)
          .order('libelle');

        if (typesContratError) throw typesContratError;
        setTypesContrat(typesContratData || []);

        // Charger les entités
        const { data: entitesData, error: entitesError } = await supabase
          .from('com_entite')
          .select('id, code, libelle')
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('actif', true)
          .order('libelle');

        if (entitesError) throw entitesError;
        setEntites(entitesData || []);
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
  }, [profil?.com_contrat_client_id, addToast]);

  // Charger les contrats du personnel
  useEffect(() => {
    const fetchContrats = async () => {
      if (!personnelId || !profil?.com_contrat_client_id) {
        setContrats([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('rh_historique_contrat')
          .select(`
            *,
            type_contrat:id_type_contrat (
              code,
              libelle
            ),
            entite_payeur:id_entite_payeur (
              code,
              libelle
            )
          `)
          .eq('id_personnel', personnelId)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .order('date_debut', { ascending: false });

        if (error) throw error;
        setContrats(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des contrats:', error);
        addToast({
          label: 'Erreur lors du chargement des contrats',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContrats();
  }, [personnelId, profil?.com_contrat_client_id, addToast]);

  // Ouvrir la modale pour ajouter un contrat
  const handleAddContrat = () => {
    setSelectedContrat(null);
    reset({
      id_type_contrat: '',
      date_debut: '',
      date_fin: '',
      commentaire: '',
      id_entite_payeur: ''
    });
    setIsModalOpen(true);
  };

  // Ouvrir la modale pour éditer un contrat
  const handleEditContrat = (contrat: Contrat) => {
    setSelectedContrat(contrat);
    reset({
      id_type_contrat: contrat.id_type_contrat,
      date_debut: contrat.date_debut,
      date_fin: contrat.date_fin || '',
      commentaire: contrat.commentaire || '',
      id_entite_payeur: contrat.id_entite_payeur || ''
    });
    setIsModalOpen(true);
  };

  // Supprimer un contrat
  const handleDeleteContrat = async (contrat: Contrat) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ce contrat ?`)) return;

    try {
      const { error } = await supabase
        .from('rh_historique_contrat')
        .delete()
        .eq('id', contrat.id);

      if (error) throw error;

      // Mettre à jour la liste des contrats
      setContrats(prev => prev.filter(c => c.id !== contrat.id));
      
      addToast({
        label: 'Contrat supprimé avec succès',
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du contrat:', error);
      addToast({
        label: 'Erreur lors de la suppression du contrat',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  // Soumettre le formulaire
  const onSubmit = async (data: ContratFormData) => {
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
      if (selectedContrat) {
        // Mode édition
        const { error } = await supabase
          .from('rh_historique_contrat')
          .update({
            id_type_contrat: data.id_type_contrat,
            date_debut: data.date_debut,
            date_fin: data.date_fin || null,
            commentaire: data.commentaire || null,
            id_entite_payeur: data.id_entite_payeur
          })
          .eq('id', selectedContrat.id);

        if (error) throw error;
        
        addToast({
          label: 'Contrat mis à jour avec succès',
          icon: 'Check',
          color: '#22c55e'
        });
      } else {
        // Mode création
        const { error } = await supabase
          .from('rh_historique_contrat')
          .insert({
            id_personnel: personnelId,
            id_type_contrat: data.id_type_contrat,
            date_debut: data.date_debut,
            date_fin: data.date_fin || null,
            commentaire: data.commentaire || null,
            id_entite_payeur: data.id_entite_payeur,
            com_contrat_client_id: profil.com_contrat_client_id
          });

        if (error) throw error;
        
        addToast({
          label: 'Contrat créé avec succès',
          icon: 'Check',
          color: '#22c55e'
        });
      }

      // Recharger les contrats
      const { data: updatedContrats, error: fetchError } = await supabase
        .from('rh_historique_contrat')
        .select(`
          *,
          type_contrat:id_type_contrat (
            code,
            libelle
          ),
          entite_payeur:id_entite_payeur (
            code,
            libelle
          )
        `)
        .eq('id_personnel', personnelId)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('date_debut', { ascending: false });

      if (fetchError) throw fetchError;
      setContrats(updatedContrats || []);
      
      // Fermer la modale
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du contrat:', error);
      addToast({
        label: 'Erreur lors de la sauvegarde du contrat',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Options pour les listes déroulantes
  const typeContratOptions: DropdownOption[] = [
    { value: '', label: 'Sélectionner un type de contrat' },
    ...typesContrat.map(type => ({
      value: type.id,
      label: `${type.code} - ${type.libelle}`
    }))
  ];

  const entiteOptions: DropdownOption[] = [
    { value: '', label: 'Sélectionner une entité' },
    ...entites.map(entite => ({
      value: entite.id,
      label: `${entite.code} - ${entite.libelle}`
    }))
  ];

  // Colonnes pour le tableau des contrats
  const columns: Column<Contrat>[] = [
    {
      label: 'Type de contrat',
      accessor: 'type_contrat',
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
      label: 'Entité payeuse',
      accessor: 'entite_payeur',
      render: (value) => value ? `${value.code} - ${value.libelle}` : '-'
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
      onClick: handleEditContrat
    },
    {
      label: 'Supprimer',
      icon: 'delete',
      color: '#ef4444',
      onClick: handleDeleteContrat
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
        <h2 className="text-xl font-semibold">Contrats</h2>
        <Button
          label="Ajouter un contrat"
          icon="Plus"
          color="var(--color-primary)"
          onClick={handleAddContrat}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Chargement des contrats...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={contrats}
          actions={actions}
          emptyTitle="Aucun contrat"
          emptyMessage="Aucun contrat n'a été créé pour ce personnel."
        />
      )}

      {/* Modale pour ajouter/éditer un contrat */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedContrat ? 'Modifier un contrat' : 'Ajouter un contrat'}
        size="md"
      >
        <Form size={100} onSubmit={handleSubmit(onSubmit)}>
          <FormField
            label="Type de contrat"
            required
            error={errors.id_type_contrat?.message}
          >
            <Controller
              name="id_type_contrat"
              control={control}
              render={({ field }) => (
                <Dropdown
                  options={typeContratOptions}
                  value={field.value}
                  onChange={field.onChange}
                  label="Sélectionner un type de contrat"
                  disabled={isSubmitting}
                />
              )}
            />
          </FormField>

          <FormField
            label="Entité payeuse"
            required
            error={errors.id_entite_payeur?.message}
          >
            <Controller
              name="id_entite_payeur"
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
            description="Laissez vide pour un contrat à durée indéterminée"
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
                  placeholder="Commentaire sur le contrat..."
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