import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../../../lib/supabase';
import { useProfil } from '../../../../context/ProfilContext';
import { Form, FormField, FormInput, FormActions } from '../../../../components/ui/form';
import { Button } from '../../../../components/ui/button';
import { Dropdown, DropdownOption } from '../../../../components/ui/dropdown';
import { TiersSelector } from '../../../../components/ParametreGlobal/Tiers/TiersSelector';
import { TiersFormModal } from '../../../../components/ParametreGlobal/Tiers/TiersFormModal';
import { ToastData } from '../../../../components/ui/toast';
import { User } from 'lucide-react';
import { ProfilePhotoUploader } from './components/ProfilePhotoUploader';
import { personnelSchema } from './schemas/personnelSchema';
import { usePhotoManagement } from './hooks/usePhotoManagement';
import { useTiersManagement } from './hooks/useTiersManagement';

// Fonction pour vérifier si un code existe déjà et créer un tiers si nécessaire
const useCodeCourtHandler = (
  setValue: (name: string, value: any, options?: any) => void,
  addToast: (toast: Omit<ToastData, 'id'>) => void
) => {
  const { profil } = useProfil();
  const [isCheckingCode, setIsCheckingCode] = useState(false);

  const checkAndCreateTiers = async (codeValue: string) => {
    if (!codeValue || !profil?.com_contrat_client_id) return;

    setIsCheckingCode(true);
    try {
      // 1. Rechercher un type de tiers avec salarie=TRUE
      const { data: typeTiersSalarie, error: typeTiersError } = await supabase
        .from('com_param_type_tiers')
        .select('id')
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .eq('salarie', true)
        .eq('actif', true)
        .limit(1);

      if (typeTiersError) throw typeTiersError;
      
      if (!typeTiersSalarie || typeTiersSalarie.length === 0) {
        addToast({
          label: 'Aucun type de tiers pour salarié trouvé. Veuillez en créer un avec l\'option "salarié" activée.',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
        return;
      }
      
      const typeTiersId = typeTiersSalarie[0].id;

      // 2. Vérifier si un tiers avec ce code existe déjà pour ce type
      const { data: existingTiers, error: checkError } = await supabase
        .from('com_tiers')
        .select('id, code, nom')
        .eq('code', codeValue)
        .eq('id_type_tiers', typeTiersId)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .maybeSingle();

      if (checkError) throw checkError;

      // Si un tiers existe déjà avec ce code et ce type
      if (existingTiers) {
        addToast({
          label: `Le code "${codeValue}" est déjà utilisé pour un tiers. Veuillez utiliser un code différent.`,
          icon: 'AlertTriangle',
          color: '#f59e0b'
        });
        return false; // Code déjà utilisé
      }

      return {
        success: true,
        typeTiersId
      };
    } catch (error) {
      console.error('Erreur lors de la vérification du code:', error);
      addToast({
        label: 'Erreur lors de la vérification du code',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return false;
    } finally {
      setIsCheckingCode(false);
    }
  };

  return {
    checkAndCreateTiers,
    isCheckingCode
  };
};

type PersonnelFormData = z.infer<typeof personnelSchema>;

interface OngletInfosPersonnellesProps {
  mode: 'create' | 'edit';
  personnelId?: string;
  onSave: (id: string) => void;
  onClose?: () => void;
  addToast: (toast: Omit<ToastData, 'id'>) => void;
}

export const OngletInfosPersonnelles: React.FC<OngletInfosPersonnellesProps> = ({
  mode,
  personnelId,
  onSave,
  onClose,
  addToast
}) => {
  const { profil } = useProfil();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Référence pour le champ nom et prénom
  const nomRef = React.useRef<string>('');
  const prenomRef = React.useRef<string>('');
  
  // Initialiser le formulaire avec react-hook-form AVANT les autres hooks
  const { 
    control, 
    handleSubmit, 
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors } 
  } = useForm<PersonnelFormData>({
    resolver: zodResolver(personnelSchema),
    defaultValues: {
      nom: '',
      prenom: '',
      civilite: '',
      sexe: '',
      date_naissance: '',
      adresse: '',
      code_postal: '',
      ville: '',
      pays: '',
      numero_securite_sociale: '',
      nif: '',
      email_perso: '',
      telephone: '',
      lien_photo: '',
      id_tiers: '',
      actif: true,
      code_court: '',
      matricule: ''
    }
  });

  // Hooks personnalisés
  const { 
    photoPreview, 
    isUploadingPhoto, 
    setPhotoPreview,
    loadPhotoPreview, 
    handlePhotoUpload, 
    handleRemovePhoto 
  } = usePhotoManagement();
  
  const {
    isTiersModalOpen,
    setIsTiersModalOpen,
    handleTiersSubmit
  } = useTiersManagement(setValue, addToast);

  // Gestionnaire pour le code court
  const { checkAndCreateTiers, isCheckingCode } = useCodeCourtHandler(setValue, addToast);
  
  // Observer les changements de nom et prénom
  const nom = watch('nom');
  const prenom = watch('prenom');
  const codeCourt = watch('code_court');
  
  // Mettre à jour les références
  useEffect(() => {
    nomRef.current = nom;
  }, [nom]);
  
  useEffect(() => {
    prenomRef.current = prenom;
  }, [prenom]);
  
  // Gérer la sortie du champ code_court
  const handleCodeCourtBlur = async () => {
    if (!codeCourt) return;
    
    const result = await checkAndCreateTiers(codeCourt);
    
    if (result && result.success) {
      // Créer automatiquement un tiers avec ce code
      try {
        const tiersData = {
          code: codeCourt,
          nom: `${prenomRef.current} ${nomRef.current}`,
          id_type_tiers: result.typeTiersId,
          com_contrat_client_id: profil?.com_contrat_client_id
        };
        
        const { data, error } = await supabase
          .from('com_tiers')
          .insert(tiersData)
          .select()
          .single();
          
        if (error) throw error;
        
        // Mettre à jour le champ id_tiers avec l'ID du tiers créé
        setValue('id_tiers', data.id);
        
        addToast({
          label: 'Tiers créé automatiquement',
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la création automatique du tiers:', error);
        addToast({
          label: 'Erreur lors de la création automatique du tiers',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
        
        // Réinitialiser le code court en cas d'erreur
        setValue('code_court', '');
      }
    } else if (result === false) {
      // Code déjà utilisé, réinitialiser le champ
      setValue('code_court', '');
    }
  };

  // Charger les données du personnel en mode édition
  useEffect(() => {
    const fetchPersonnel = async () => {
      if (mode === 'edit' && personnelId) {
        setLoading(true);
        try {
          console.log('Chargement du personnel avec ID:', personnelId);
          const { data, error } = await supabase
            .from('rh_personnel')
            .select('*')
            .eq('id', personnelId)
            .single();

          if (error) throw error;
          console.log('Personnel chargé:', data);
          console.log('Lien photo:', data.lien_photo);
          
          // Formater la date de naissance pour l'input date
          let formattedData = { ...data };
          if (data.date_naissance) {
            formattedData.date_naissance = new Date(data.date_naissance).toISOString().split('T')[0];
          }
          
          // Mettre à jour le formulaire avec les données
          reset(formattedData);
          
          // Charger l'aperçu de la photo si disponible
          if (data.lien_photo) {
            console.log('Chargement de l\'aperçu de la photo:', data.lien_photo);
            loadPhotoPreview(data.lien_photo, setPhotoPreview);
          }
        } catch (error) {
          console.error('Erreur lors du chargement du personnel:', error);
          addToast({
            label: 'Erreur lors du chargement des données',
            icon: 'AlertTriangle',
            color: '#ef4444'
          });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPersonnel();
  }, [mode, personnelId, reset, addToast]);

  // Soumettre le formulaire
  const onSubmit = async (data: PersonnelFormData) => {
    if (!profil?.com_contrat_client_id) {
      console.log('Erreur: Profil utilisateur incomplet');
      addToast({
        label: 'Erreur: Profil utilisateur incomplet',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Récupérer la valeur la plus récente du champ lien_photo
      const currentPhotoPath = getValues('lien_photo');
      console.log('Valeur actuelle du champ lien_photo lors de la soumission:', currentPhotoPath);
      
      console.log('Données du formulaire avant nettoyage:', data);
      console.log('Valeur de lien_photo avant nettoyage:', data.lien_photo);
      // Nettoyer les données avant envoi - convertir les chaînes vides en null pour les champs optionnels
      const cleanedData = {
        ...data,
        date_naissance: data.date_naissance === '' ? null : data.date_naissance,
        civilite: data.civilite === '' ? null : data.civilite,
        sexe: data.sexe === '' ? null : data.sexe,
        adresse: data.adresse === '' ? null : data.adresse,
        code_postal: data.code_postal === '' ? null : data.code_postal,
        ville: data.ville === '' ? null : data.ville,
        pays: data.pays === '' ? null : data.pays,
        numero_securite_sociale: data.numero_securite_sociale === '' ? null : data.numero_securite_sociale,
        nif: data.nif === '' ? null : data.nif,
        email_perso: data.email_perso === '' ? null : data.email_perso,
        telephone: data.telephone === '' ? null : data.telephone,
        lien_photo: currentPhotoPath === '' ? null : currentPhotoPath
      };
      
      console.log('Données nettoyées avant envoi:', cleanedData);
      console.log('Valeur de lien_photo après nettoyage:', cleanedData.lien_photo);

      let result;
      
      if (mode === 'edit' && personnelId) {
        console.log('Mode édition - Mise à jour du personnel avec ID:', personnelId);
        console.log('Données à envoyer pour la mise à jour:', {
          ...cleanedData,
          com_contrat_client_id: profil.com_contrat_client_id
        });
        
        // Mode édition
        const { data: updatedData, error } = await supabase
          .from('rh_personnel')
          .update({
            ...cleanedData,
            com_contrat_client_id: profil.com_contrat_client_id
          })
          .eq('id', personnelId)
          .select()
          .single();

        if (error) {
          console.error('Erreur Supabase lors de la mise à jour du personnel:', error);
          throw error;
        }
        
        console.log('Personnel mis à jour avec succès:', updatedData);
        console.log('Lien photo après mise à jour:', updatedData.lien_photo);
        result = updatedData;
      } else {
        console.log('Mode création - Création d\'un nouveau personnel');
        console.log('Données à envoyer pour la création:', {
          ...cleanedData,
          com_contrat_client_id: profil.com_contrat_client_id
        });
        
        // Mode création
        const { data: newData, error } = await supabase
          .from('rh_personnel')
          .insert({
            ...cleanedData,
            com_contrat_client_id: profil.com_contrat_client_id
          })
          .select()
          .single();

        if (error) {
          console.error('Erreur Supabase lors de la création du personnel:', error);
          throw error;
        }
        
        console.log('Personnel créé avec succès:', newData);
        console.log('Lien photo après création:', newData.lien_photo);
        result = newData;
      }

      addToast({
        label: mode === 'create' ? 'Personnel créé avec succès' : 'Personnel mis à jour avec succès',
        icon: 'Check',
        color: '#22c55e'
      });
      
      // Appeler le callback avec l'ID du personnel
      onSave(result.id);
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde du personnel:', error);
      
      let errorMessage = 'Erreur lors de la sauvegarde';
      
      // Gestion des erreurs de contrainte d'unicité
      if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        if (error.message.includes('code_court')) {
          errorMessage = 'Ce code court est déjà utilisé';
        } else if (error.message.includes('matricule')) {
          errorMessage = 'Ce matricule est déjà utilisé';
        }
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

  if (loading) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>;
  }

  // Options pour les listes déroulantes
  const civiliteOptions: DropdownOption[] = [
    { value: '', label: 'Sélectionner une civilité' },
    { value: 'Monsieur', label: 'Monsieur' },
    { value: 'Madame', label: 'Madame' },
    { value: 'Mademoiselle', label: 'Mademoiselle' }
  ];

  const sexeOptions: DropdownOption[] = [
    { value: '', label: 'Sélectionner un sexe' },
    { value: 'Homme', label: 'Homme' },
    { value: 'Femme', label: 'Femme' }
  ];
  return (
    <div className="space-y-6">
      {/* Section photo de profil */}
      <ProfilePhotoUploader 
        photoPreview={photoPreview}
        isUploadingPhoto={isUploadingPhoto}
        onPhotoUpload={handlePhotoUpload}
        onPhotoRemove={handleRemovePhoto}
      />

      <Form size={100} columns={3} onSubmit={handleSubmit(onSubmit)}>
        {/* Première ligne */}
        <FormField
          label="Civilité"
          error={errors.civilite?.message}
        >
          <Controller
            name="civilite"
            control={control}
            render={({ field }) => (
              <Dropdown
                options={civiliteOptions}
                value={field.value}
                onChange={field.onChange}
                label="Sélectionner une civilité"
                disabled={isSubmitting}
              />
            )}
          />
        </FormField>

        <FormField
          label="Nom"
          required
          error={errors.nom?.message}
        >
          <Controller
            name="nom"
            control={control}
            render={({ field }) => (
              <FormInput
                {...field}
                placeholder="Nom"
                error={!!errors.nom}
              />
            )}
          />
        </FormField>

        <FormField
          label="Prénom"
          required
          error={errors.prenom?.message}
        >
          <Controller
            name="prenom"
            control={control}
            render={({ field }) => (
              <FormInput
                {...field}
                placeholder="Prénom"
                error={!!errors.prenom}
              />
            )}
          />
        </FormField>

        {/* Deuxième ligne */}  
       <FormField
          label="Code court"
          required
          error={errors.code_court?.message}
          description="Code unique pour identifier le salarié (max 12 caractères)"
        >
          <Controller
            name="code_court"
            control={control}
            render={({ field: { onChange, onBlur, ...field } }) => (
              <FormInput
                {...field}
                onChange={(e) => {
                  onChange(e);
                }}
                onBlur={(e) => {
                  onBlur();
                  if (mode === 'create') {
                    handleCodeCourtBlur();
                  }
                }}
                placeholder="Code court"
                maxLength={12}
                error={!!errors.code_court}
                disabled={isSubmitting || isCheckingCode}
              />
            )}
          />
        </FormField>

        <FormField
          label="Matricule"
          required
          error={errors.matricule?.message}
          description="Matricule unique pour identifier le salarié (max 12 caractères)"
        >
          <Controller
            name="matricule"
            control={control}
            render={({ field }) => (
              <FormInput
                {...field}
                placeholder="Matricule"
                maxLength={12}
                error={!!errors.matricule}
              />
            )}
          />
        </FormField>

        <FormField
          label="Tiers associé"
          required
          error={errors.id_tiers?.message}
          description="Tiers associé au salarié"
        >
          <div className="flex gap-2">
            <div className="flex-1">
              <Controller
                name="id_tiers"
                control={control}
                render={({ field }) => (
                  <TiersSelector
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>
            <Button
              label="Nouveau tiers"
              icon="Plus"
              color="var(--color-primary)"
              onClick={() => setIsTiersModalOpen(true)}
              disabled={isSubmitting}
              size="sm"
            />
          </div>
        </FormField>
        
        {/* Troisième ligne */}
        <FormField
          label="Sexe"
          error={errors.sexe?.message}
        >
          <Controller
            name="sexe"
            control={control}
            render={({ field }) => (
              <Dropdown
                options={sexeOptions}
                value={field.value}
                onChange={field.onChange}
                label="Sélectionner un sexe"
                disabled={isSubmitting}
              />
            )}
          />
        </FormField>

        <FormField
          label="Date de naissance"
          error={errors.date_naissance?.message}
        >
          <Controller
            name="date_naissance"
            control={control}
            render={({ field }) => (
              <FormInput
                type="date"
                {...field}
                error={!!errors.date_naissance}
              />
            )}
          />
        </FormField>

        <FormField
          label="Numéro de sécurité sociale"
          error={errors.numero_securite_sociale?.message}
        >
          <Controller
            name="numero_securite_sociale"
            control={control}
            render={({ field }) => (
              <FormInput
                {...field}
                placeholder="Numéro de sécurité sociale"
                error={!!errors.numero_securite_sociale}
              />
            )}
          />
        </FormField>

        {/* Quatrième ligne */}
        <FormField
          label="Adresse"
          error={errors.adresse?.message}
          className="col-span-3"
        >
          <Controller
            name="adresse"
            control={control}
            render={({ field }) => (
              <FormInput
                {...field}
                placeholder="Adresse"
                error={!!errors.adresse}
              />
            )}
          />
        </FormField>
        

        {/* Cinquième ligne */}
        <FormField
          label="Code postal"
          error={errors.code_postal?.message}
        >
          <Controller
            name="code_postal"
            control={control}
            render={({ field }) => (
              <FormInput
                {...field}
                placeholder="Code postal"
                error={!!errors.code_postal}
              />
            )}
          />
        </FormField>

        <FormField
          label="Ville"
          error={errors.ville?.message}
        >
          <Controller
            name="ville"
            control={control}
            render={({ field }) => (
              <FormInput
                {...field}
                placeholder="Ville"
                error={!!errors.ville}
              />
            )}
          />
        </FormField>

        <FormField
          label="Pays"
          error={errors.pays?.message}
        >
          <Controller
            name="pays"
            control={control}
            render={({ field }) => (
              <FormInput
                {...field}
                placeholder="Pays"
                error={!!errors.pays}
              />
            )}
          />
        </FormField>
        

        {/* Sixième ligne */}
<FormField
          label="Email personnel"
          error={errors.email_perso?.message}
        >
          <Controller
            name="email_perso"
            control={control}
            render={({ field }) => (
              <FormInput
                type="email"
                {...field}
                placeholder="Email personnel"
                error={!!errors.email_perso}
              />
            )}
          />
        </FormField>

        <FormField
          label="Téléphone"
          error={errors.telephone?.message}
        >
          <Controller
            name="telephone"
            control={control}
            render={({ field }) => (
              <FormInput
                {...field}
                placeholder="Téléphone"
                error={!!errors.telephone}
              />
            )}
          />
        </FormField>

        <FormField
          label="NIF"
          error={errors.nif?.message}
        >
          <Controller
            name="nif"
            control={control}
            render={({ field }) => (
              <FormInput
                {...field}
                placeholder="NIF"
                error={!!errors.nif}
              />
            )}
          />
        </FormField>

        <FormActions>
          <Button
            label="Annuler"
            color="#6B7280"
            onClick={() => onClose ? onClose() : reset()}
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

      {/* Modale pour créer un nouveau tiers */}
      <TiersFormModal
        isOpen={isTiersModalOpen}
        onClose={() => setIsTiersModalOpen(false)}
        onSubmit={handleTiersSubmit}
        isSubmitting={false}
      />
    </div>
  );
};