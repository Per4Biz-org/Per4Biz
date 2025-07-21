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

interface ParamGeneraux {
  id: string;
  date_debut: string;
  date_fin: string | null;
  taux_ss_patronale: number | null;
  taux_ss_salariale: number | null;
  ticket_resto_journalier: number | null;
  commentaire: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

const ParamGeneraux: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [parametres, setParametres] = useState<ParamGeneraux[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParam, setSelectedParam] = useState<ParamGeneraux | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    date_debut: '',
    date_fin: '',
    taux_ss_patronale: '',
    taux_ss_salariale: '',
    ticket_resto_journalier: '',
    commentaire: '',
    actif: true,
    mat_prefixe: '',
    mat_chrono: '',
    mat_nb_position: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMenuItems(menuItemsParamGestionRH);
    if (!profilLoading) {
      fetchParametres();
    }
  }, [setMenuItems, profilLoading, profil?.com_contrat_client_id]);

  const fetchParametres = async () => {
    try {
      if (!profil?.com_contrat_client_id) {
        setParametres([]);
        return;
      }

      const { data, error } = await supabase
        .from('rh_param_generaux')
        .select('*')
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('date_debut', { ascending: false });

      if (error) throw error;
      setParametres(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres généraux:', error);
      addToast({
        label: 'Erreur lors de la récupération des paramètres généraux',
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

  const handleToggleChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      actif: checked
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.date_debut) {
      errors.date_debut = 'La date de début est requise';
    }
    
   // Validation des champs de matricule
   if (formData.mat_prefixe && formData.mat_prefixe.length > 6) {
     errors.mat_prefixe = 'Le préfixe ne doit pas dépasser 6 caractères';
   }
   
   if (formData.mat_chrono && isNaN(parseInt(formData.mat_chrono))) {
     errors.mat_chrono = 'Le compteur doit être un nombre entier';
   }
   
   if (formData.mat_nb_position && (isNaN(parseInt(formData.mat_nb_position)) || parseInt(formData.mat_nb_position) < 1)) {
     errors.mat_nb_position = 'Le nombre de positions doit être un entier positif';
   }
   
    // Validation des valeurs numériques
    if (formData.taux_ss_patronale && isNaN(parseFloat(formData.taux_ss_patronale))) {
      errors.taux_ss_patronale = 'Le taux doit être un nombre valide';
    }
    
    if (formData.taux_ss_salariale && isNaN(parseFloat(formData.taux_ss_salariale))) {
      errors.taux_ss_salariale = 'Le taux doit être un nombre valide';
    }
    
    if (formData.ticket_resto_journalier && isNaN(parseFloat(formData.ticket_resto_journalier))) {
      errors.ticket_resto_journalier = 'Le montant doit être un nombre valide';
    }
    
    // Vérifier que la date de fin est postérieure à la date de début
    if (formData.date_fin && formData.date_debut && formData.date_fin < formData.date_debut) {
      errors.date_fin = 'La date de fin doit être postérieure à la date de début';
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
        date_debut: formData.date_debut,
        date_fin: formData.date_fin || null,
        taux_ss_patronale: formData.taux_ss_patronale ? parseFloat(formData.taux_ss_patronale) : null,
        taux_ss_salariale: formData.taux_ss_salariale ? parseFloat(formData.taux_ss_salariale) : null,
        ticket_resto_journalier: formData.ticket_resto_journalier ? parseFloat(formData.ticket_resto_journalier) : null,
        commentaire: formData.commentaire || null,
        actif: formData.actif,
       mat_prefixe: formData.mat_prefixe || null,
       mat_chrono: formData.mat_chrono ? parseInt(formData.mat_chrono) : 1,
       mat_nb_position: formData.mat_nb_position ? parseInt(formData.mat_nb_position) : 3,
        com_contrat_client_id: profil.com_contrat_client_id
      };

      let error;
      
      if (selectedParam) {
        // Mode édition
        const { error: updateError } = await supabase
          .from('rh_param_generaux')
          .update(paramData)
          .eq('id', selectedParam.id);
        error = updateError;
      } else {
        // Mode création
        const { error: insertError } = await supabase
          .from('rh_param_generaux')
          .insert([paramData]);
        error = insertError;
      }

      if (error) throw error;

      await fetchParametres();
      setIsModalOpen(false);
      setSelectedParam(null);
      setFormData({
        date_debut: '',
        date_fin: '',
        taux_ss_patronale: '',
        taux_ss_salariale: '',
        ticket_resto_journalier: '',
        commentaire: '',
        actif: true,
        mat_prefixe: '',
        mat_chrono: '1',
        mat_nb_position: '3'
      });
      addToast({
        label: `Paramètre général ${selectedParam ? 'modifié' : 'créé'} avec succès`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      
      let errorMessage = `Erreur lors de la ${selectedParam ? 'modification' : 'création'} du paramètre général`;
      
      // Gestion des erreurs de contrainte d'unicité
      if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        errorMessage = 'Un paramètre existe déjà pour cette date de début';
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

  const handleEdit = (param: ParamGeneraux) => {
    setSelectedParam(param);
    setFormData({
      date_debut: param.date_debut,
      date_fin: param.date_fin || '',
      taux_ss_patronale: param.taux_ss_patronale?.toString() || '',
      taux_ss_salariale: param.taux_ss_salariale?.toString() || '',
      ticket_resto_journalier: param.ticket_resto_journalier?.toString() || '',
      commentaire: param.commentaire || '',
      actif: param.actif,
      mat_prefixe: param.mat_prefixe || '',
      mat_chrono: param.mat_chrono?.toString() || '1',
      mat_nb_position: param.mat_nb_position?.toString() || '3'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (param: ParamGeneraux) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ce paramètre général ?`)) {
      try {
        const { error } = await supabase
          .from('rh_param_generaux')
          .delete()
          .eq('id', param.id);

        if (error) throw error;

        await fetchParametres();
        addToast({
          label: `Le paramètre général a été supprimé avec succès`,
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        addToast({
          label: 'Erreur lors de la suppression du paramètre général',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  const columns: Column<ParamGeneraux>[] = [
    {
      label: 'Date de début',
      accessor: 'date_debut',
      sortable: true,
      render: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: fr })
    },
    {
      label: 'Date de fin',
      accessor: 'date_fin',
      render: (value) => value ? format(new Date(value), 'dd/MM/yyyy', { locale: fr }) : 'Indéterminée'
    },
    {
      label: 'Taux SS patronale',
      accessor: 'taux_ss_patronale',
      align: 'right',
      render: (value) => value ? `${value} %` : '-'
    },
    {
      label: 'Taux SS salariale',
      accessor: 'taux_ss_salariale',
      align: 'right',
      render: (value) => value ? `${value} %` : '-'
    },
    {
      label: 'Ticket resto',
      accessor: 'ticket_resto_journalier',
      align: 'right',
      render: (value) => value ? `${value} €` : '-'
    },
   {
     label: 'Préfixe matricule',
     accessor: 'mat_prefixe',
     render: (value) => value || '-'
   },
   {
     label: 'Format matricule',
     accessor: 'mat_nb_position',
     render: (value, row) => {
       if (!row.mat_prefixe) return '-';
       const prefixe = row.mat_prefixe;
       const nbPosition = value || 3;
       const chrono = row.mat_chrono || 1;
       const chronoFormatted = chrono.toString().padStart(nbPosition, '0');
       return `${prefixe}${chronoFormatted} (${nbPosition} chiffres)`;
     }
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
        title={loading || profilLoading ? "Chargement..." : "Paramètres Généraux RH"}
        description="Gérez les paramètres généraux RH comme les taux de charges sociales et les tickets restaurant"
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
                date_debut: '',
                date_fin: '',
                taux_ss_patronale: '',
                taux_ss_salariale: '',
                ticket_resto_journalier: '',
                commentaire: '',
                actif: true,
                mat_prefixe: '',
                mat_chrono: '1',
                mat_nb_position: '3'
              });
              setIsModalOpen(true);
            }}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Chargement des paramètres généraux...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={parametres}
            actions={actions}
            defaultRowsPerPage={10}
            emptyTitle="Aucun paramètre général"
            emptyMessage="Aucun paramètre général n'a été créé pour le moment."
          />
        )}

        <ToastContainer toasts={toasts} onClose={closeToast} />

        <Modal 
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedParam(null);
            setFormData({
              date_debut: '',
              date_fin: '',
              taux_ss_patronale: '',
              taux_ss_salariale: '',
              ticket_resto_journalier: '',
              commentaire: '',
              actif: true
            });
            setFormErrors({});
          }}
          title={selectedParam ? 'Modifier un paramètre général' : 'Ajouter un paramètre général'}
        >
          <Form size={100} onSubmit={handleSubmit}>
            <FormField
              label="Date de début"
              required
              error={formErrors.date_debut}
              description="Date à partir de laquelle ces paramètres s'appliquent"
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
              description="Laissez vide si ces paramètres sont toujours en vigueur"
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
              label="Taux SS patronale (%)"
              error={formErrors.taux_ss_patronale}
              description="Taux de charges sociales patronales en pourcentage"
            >
              <FormInput
                name="taux_ss_patronale"
                type="number"
                step="0.01"
                value={formData.taux_ss_patronale}
                onChange={handleInputChange}
                placeholder="Ex: 23.5"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField
              label="Taux SS salariale (%)"
              error={formErrors.taux_ss_salariale}
              description="Taux de charges sociales salariales en pourcentage"
            >
              <FormInput
                name="taux_ss_salariale"
                type="number"
                step="0.01"
                value={formData.taux_ss_salariale}
                onChange={handleInputChange}
                placeholder="Ex: 11.2"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField
              label="Ticket restaurant journalier (€)"
              error={formErrors.ticket_resto_journalier}
              description="Montant du ticket restaurant journalier en euros"
            >
              <FormInput
                name="ticket_resto_journalier"
                type="number"
                step="0.01"
                value={formData.ticket_resto_journalier}
                onChange={handleInputChange}
                placeholder="Ex: 9.5"
                disabled={isSubmitting}
              />
            </FormField>

           <FormField
             label="Préfixe matricule"
             error={formErrors.mat_prefixe}
             description="Préfixe utilisé pour générer les matricules (max 6 caractères)"
             className="mb-3"
           >
             <FormInput
               name="mat_prefixe"
               value={formData.mat_prefixe}
               onChange={handleInputChange}
               maxLength={6}
               placeholder="Ex: MEL"
               disabled={isSubmitting}
             />
           </FormField>

           <FormField
             label="Compteur matricule"
             error={formErrors.mat_chrono}
             description="Valeur actuelle du compteur pour la génération de matricules"
             className="mb-3"
           >
             <FormInput
               name="mat_chrono"
               type="number"
               value={formData.mat_chrono}
               onChange={handleInputChange}
               min="1"
               placeholder="Ex: 1"
               disabled={isSubmitting}
             />
           </FormField>

           <FormField
             label="Nombre de positions"
             error={formErrors.mat_nb_position}
             description="Nombre de chiffres pour afficher le compteur (ex: 3 pour MEL001)"
             className="mb-3"
           >
             <FormInput
               name="mat_nb_position"
               type="number"
               value={formData.mat_nb_position}
               onChange={handleInputChange}
               min="1"
               max="10"
               placeholder="Ex: 3"
               disabled={isSubmitting}
             />
           </FormField>

           {formData.mat_prefixe && (
             <FormField
               label="Aperçu du prochain matricule"
               className="mb-3"
             >
               <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-blue-700 font-medium">
                 {formData.mat_prefixe}
                 {(parseInt(formData.mat_chrono) || 1).toString().padStart(parseInt(formData.mat_nb_position) || 3, '0')}
               </div>
             </FormField>
           )}

            <FormField
              label="Commentaire"
            >
              <textarea
                name="commentaire"
                value={formData.commentaire}
                onChange={handleInputChange}
                className="w-full p-2 text-sm border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
                rows={3}
                placeholder="Commentaire ou notes sur ces paramètres..."
                disabled={isSubmitting}
              />
            </FormField>

            <FormField
              label="Statut"
              description="Activer ou désactiver ces paramètres"
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
                  setSelectedParam(null);
                  setFormData({
                    date_debut: '',
                    date_fin: '',
                    taux_ss_patronale: '',
                    taux_ss_salariale: '',
                    ticket_resto_journalier: '',
                    commentaire: '',
                    actif: true,
                    mat_prefixe: '',
                    mat_chrono: '1',
                    mat_nb_position: '3'
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

export default ParamGeneraux;