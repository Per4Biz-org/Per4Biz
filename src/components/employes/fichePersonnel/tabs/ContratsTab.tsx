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

interface Contrat {
  id: string;
  date_debut: string;
  date_fin: string | null;
  commentaire: string | null;
  created_at: string;
  type_contrat: {
    code: string;
    libelle: string;
  };
  entite_payeur?: {
    code: string;
    libelle: string;
  };
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

interface ContratsTabProps {
  personnelId: string | undefined;
  addToast: (toast: any) => void;
}

const ContratsTab: React.FC<ContratsTabProps> = ({ personnelId, addToast }) => {
  const { profil } = useProfil();
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [typesContrat, setTypesContrat] = useState<TypeContrat[]>([]);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContrat, setSelectedContrat] = useState<Contrat | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id_type_contrat: '',
    date_debut: '',
    date_fin: '',
    commentaire: '',
    id_entite_payeur: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Chargement des contrats
  useEffect(() => {
    const fetchContrats = async () => {
      if (!personnelId || !profil?.com_contrat_client_id) return;

      try {
        setLoading(true);
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

  // Chargement des types de contrat et entités
  useEffect(() => {
    const fetchReferenceData = async () => {
      if (!profil?.com_contrat_client_id) return;

      try {
        // Charger les types de contrat
        const { data: typesData, error: typesError } = await supabase
          .from('rh_type_contrat')
          .select('id, code, libelle')
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('actif', true)
          .order('libelle');

        if (typesError) throw typesError;
        setTypesContrat(typesData || []);

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
    
    if (!formData.id_type_contrat) errors.id_type_contrat = 'Le type de contrat est requis';
    if (!formData.date_debut) errors.date_debut = 'La date de début est requise';
    if (formData.date_fin && new Date(formData.date_fin) < new Date(formData.date_debut)) {
      errors.date_fin = 'La date de fin doit être postérieure à la date de début';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !personnelId || !profil?.com_contrat_client_id) return;
    
    setIsSubmitting(true);
    try {
      const contratData = {
        ...formData,
        id_personnel: personnelId,
        com_contrat_client_id: profil.com_contrat_client_id,
        date_fin: formData.date_fin || null,
        commentaire: formData.commentaire || null,
        id_entite_payeur: formData.id_entite_payeur || null
      };
      
      let error;
      
      if (selectedContrat) {
        // Mode édition
        const { error: updateError } = await supabase
          .from('rh_historique_contrat')
          .update(contratData)
          .eq('id', selectedContrat.id);
          
        error = updateError;
      } else {
        // Mode création
        const { error: insertError } = await supabase
          .from('rh_historique_contrat')
          .insert([contratData]);
          
        error = insertError;
      }
      
      if (error) throw error;
      
      // Rafraîchir la liste des contrats
      const { data, error: fetchError } = await supabase
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
      setContrats(data || []);
      
      // Fermer la modale et réinitialiser le formulaire
      setIsModalOpen(false);
      setSelectedContrat(null);
      setFormData({
        id_type_contrat: '',
        date_debut: '',
        date_fin: '',
        commentaire: '',
        id_entite_payeur: ''
      });
      
      addToast({
        label: `Contrat ${selectedContrat ? 'modifié' : 'créé'} avec succès`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du contrat:', error);
      addToast({
        label: `Erreur lors de la ${selectedContrat ? 'modification' : 'création'} du contrat`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (contrat: Contrat) => {
    setSelectedContrat(contrat);
    setFormData({
      id_type_contrat: contrat.type_contrat.id,
      date_debut: contrat.date_debut,
      date_fin: contrat.date_fin || '',
      commentaire: contrat.commentaire || '',
      id_entite_payeur: contrat.entite_payeur?.id || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (contrat: Contrat) => {
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

  const typeContratOptions: DropdownOption[] = [
    { value: '', label: 'Sélectionner un type de contrat' },
    ...typesContrat.map(type => ({
      value: type.id,
      label: `${type.code} - ${type.libelle}`
    }))
  ];

  const entiteOptions: DropdownOption[] = [
    { value: '', label: 'Sélectionner une entité payeuse (optionnel)' },
    ...entites.map(entite => ({
      value: entite.id,
      label: `${entite.code} - ${entite.libelle}`
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
        <h2 className="text-xl font-semibold">Contrats</h2>
        <Button
          label="Ajouter un contrat"
          icon="Plus"
          color="var(--color-primary)"
          onClick={() => {
            setSelectedContrat(null);
            setFormData({
              id_type_contrat: '',
              date_debut: '',
              date_fin: '',
              commentaire: '',
              id_entite_payeur: ''
            });
            setIsModalOpen(true);
          }}
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
          defaultRowsPerPage={5}
          emptyTitle="Aucun contrat"
          emptyMessage="Aucun contrat n'a été créé pour cet employé."
        />
      )}

      {/* Modale d'ajout/édition de contrat */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedContrat(null);
          setFormData({
            id_type_contrat: '',
            date_debut: '',
            date_fin: '',
            commentaire: '',
            id_entite_payeur: ''
          });
          setFormErrors({});
        }}
        title={selectedContrat ? 'Modifier un contrat' : 'Ajouter un contrat'}
      >
        <Form size={100} onSubmit={handleSubmit}>
          <FormField
            label="Type de contrat"
            required
            error={formErrors.id_type_contrat}
          >
            <Dropdown
              options={typeContratOptions}
              value={formData.id_type_contrat}
              onChange={handleDropdownChange('id_type_contrat')}
              label="Sélectionner un type de contrat"
              disabled={isSubmitting}
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
            description="Laisser vide pour un contrat à durée indéterminée"
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
            label="Entité payeuse"
            error={formErrors.id_entite_payeur}
          >
            <Dropdown
              options={entiteOptions}
              value={formData.id_entite_payeur}
              onChange={handleDropdownChange('id_entite_payeur')}
              label="Sélectionner une entité payeuse"
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
                setSelectedContrat(null);
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

export default ContratsTab;