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

interface Affectation {
  id: string;
  date_debut: string;
  date_fin: string | null;
  actif: boolean;
  commentaire: string | null;
  tx_presence: number;
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
    id: string;
    date_debut: string;
    date_fin: string | null;
    type_contrat: {
      code: string;
      libelle: string;
    };
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

interface AffectationsTabProps {
  personnelId: string | undefined;
  addToast: (toast: any) => void;
}

const AffectationsTab: React.FC<AffectationsTabProps> = ({ personnelId, addToast }) => {
  const { profil } = useProfil();
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [fonctions, setFonctions] = useState<Fonction[]>([]);
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAffectation, setSelectedAffectation] = useState<Affectation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id_entite: '',
    id_fonction: '',
    id_contrat: '',
    date_debut: '',
    date_fin: '',
    tx_presence: 1,
    actif: true,
    commentaire: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Chargement des affectations
  useEffect(() => {
    const fetchAffectations = async () => {
      if (!personnelId || !profil?.com_contrat_client_id) return;

      try {
        setLoading(true);
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
              id,
              date_debut,
              date_fin,
              type_contrat:id_type_contrat (
                code,
                libelle
              )
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

  // Chargement des données de référence
  useEffect(() => {
    const fetchReferenceData = async () => {
      if (!profil?.com_contrat_client_id || !personnelId) return;

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Traitement spécial pour tx_presence
    if (name === 'tx_presence') {
      // Convertir en nombre et limiter entre 0 et 1
      const numValue = Math.min(Math.max(parseFloat(value) || 0, 0), 1);
      setFormData(prev => ({
        ...prev,
        [name]: numValue
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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.id_entite) errors.id_entite = 'L\'entité est requise';
    if (!formData.id_fonction) errors.id_fonction = 'La fonction est requise';
    if (!formData.id_contrat) errors.id_contrat = 'Le contrat est requis';
    if (!formData.date_debut) errors.date_debut = 'La date de début est requise';
    if (formData.date_fin && new Date(formData.date_fin) < new Date(formData.date_debut)) {
      errors.date_fin = 'La date de fin doit être postérieure à la date de début';
    }
    
    // Vérifier que le taux de présence est entre 0 et 1
    if (formData.tx_presence < 0 || formData.tx_presence > 1) {
      errors.tx_presence = 'Le taux de présence doit être entre 0 et 1';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !personnelId || !profil?.com_contrat_client_id) return;
    
    setIsSubmitting(true);
    try {
      const affectationData = {
        ...formData,
        id_personnel: personnelId,
        com_contrat_client_id: profil.com_contrat_client_id,
        date_fin: formData.date_fin || null,
        commentaire: formData.commentaire || null
      };
      
      let error;
      
      if (selectedAffectation) {
        // Mode édition
        const { error: updateError } = await supabase
          .from('rh_affectation')
          .update(affectationData)
          .eq('id', selectedAffectation.id);
          
        error = updateError;
      } else {
        // Mode création
        const { error: insertError } = await supabase
          .from('rh_affectation')
          .insert([affectationData]);
          
        error = insertError;
      }
      
      if (error) throw error;
      
      // Rafraîchir la liste des affectations
      const { data, error: fetchError } = await supabase
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
            id,
            date_debut,
            date_fin,
            type_contrat:id_type_contrat (
              code,
              libelle
            )
          )
        `)
        .eq('id_personnel', personnelId)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('date_debut', { ascending: false });
        
      if (fetchError) throw fetchError;
      setAffectations(data || []);
      
      // Fermer la modale et réinitialiser le formulaire
      setIsModalOpen(false);
      setSelectedAffectation(null);
      setFormData({
        id_entite: '',
        id_fonction: '',
        id_contrat: '',
        date_debut: '',
        date_fin: '',
        tx_presence: 1,
        actif: true,
        commentaire: ''
      });
      
      addToast({
        label: `Affectation ${selectedAffectation ? 'modifiée' : 'créée'} avec succès`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'affectation:', error);
      addToast({
        label: `Erreur lors de la ${selectedAffectation ? 'modification' : 'création'} de l'affectation`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (affectation: Affectation) => {
    setSelectedAffectation(affectation);
    setFormData({
      id_entite: affectation.entite.id,
      id_fonction: affectation.fonction.id,
      id_contrat: affectation.contrat.id,
      date_debut: affectation.date_debut,
      date_fin: affectation.date_fin || '',
      tx_presence: affectation.tx_presence,
      actif: affectation.actif,
      commentaire: affectation.commentaire || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (affectation: Affectation) => {
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
      align: 'center',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Oui' : 'Non'}
        </span>
      )
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
        <h2 className="text-xl font-semibold">Affectations</h2>
        <Button
          label="Ajouter une affectation"
          icon="Plus"
          color="var(--color-primary)"
          onClick={() => {
            setSelectedAffectation(null);
            setFormData({
              id_entite: '',
              id_fonction: '',
              id_contrat: '',
              date_debut: '',
              date_fin: '',
              tx_presence: 1,
              actif: true,
              commentaire: ''
            });
            setIsModalOpen(true);
          }}
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
          defaultRowsPerPage={5}
          emptyTitle="Aucune affectation"
          emptyMessage="Aucune affectation n'a été créée pour cet employé."
        />
      )}

      {/* Modale d'ajout/édition d'affectation */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAffectation(null);
          setFormData({
            id_entite: '',
            id_fonction: '',
            id_contrat: '',
            date_debut: '',
            date_fin: '',
            tx_presence: 1,
            actif: true,
            commentaire: ''
          });
          setFormErrors({});
        }}
        title={selectedAffectation ? 'Modifier une affectation' : 'Ajouter une affectation'}
      >
        <Form size={100} onSubmit={handleSubmit}>
          <FormField
            label="Entité"
            required
            error={formErrors.id_entite}
          >
            <Dropdown
              options={entiteOptions}
              value={formData.id_entite}
              onChange={handleDropdownChange('id_entite')}
              label="Sélectionner une entité"
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label="Fonction"
            required
            error={formErrors.id_fonction}
          >
            <Dropdown
              options={fonctionOptions}
              value={formData.id_fonction}
              onChange={handleDropdownChange('id_fonction')}
              label="Sélectionner une fonction"
              disabled={isSubmitting}
            />
          </FormField>

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
            description="Laisser vide pour une affectation à durée indéterminée"
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
            label="Taux de présence"
            error={formErrors.tx_presence}
            description="Valeur entre 0 et 1 (ex: 0.5 pour mi-temps)"
          >
            <FormInput
              name="tx_presence"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={formData.tx_presence.toString()}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label="Actif"
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                name="actif"
                checked={formData.actif}
                onChange={handleCheckboxChange}
                disabled={isSubmitting}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="actif" className="ml-2 block text-sm text-gray-900">
                Affectation active
              </label>
            </div>
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
                setSelectedAffectation(null);
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

export default AffectationsTab;