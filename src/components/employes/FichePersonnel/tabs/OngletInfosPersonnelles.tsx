import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../../../lib/supabase';
import { useProfil } from '../../../../context/ProfilContext';
import { Form, FormField, FormInput, FormActions } from '../../../../components/ui/form';
import { Button } from '../../../../components/ui/button';
import { Dropdown, DropdownOption } from '../../../../components/ui/dropdown';
import { ToastData } from '../../../../components/ui/toast';
import { User } from 'lucide-react';
import { RHCalculMatricule } from '../../../../utils/rhUtils';
import { ProfilePhotoUploader } from './components/ProfilePhotoUploader';
import { personnelSchema } from './schemas/personnelSchema';
import { useTiersManagement } from './hooks/useTiersManagement';
import { usePhotoManagement } from './hooks/usePhotoManagement';

type PersonnelFormData = z.infer<typeof personnelSchema>;

interface TypeTiers {
  id: string;
  code: string;
  libelle: string;
  salarie: boolean;
}

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
  const [typesTiersSalarie, setTypesTiersSalarie] = useState<TypeTiers[]>([]);
  const [initialData, setInitialData] = useState<PersonnelFormData | null>(null);
  const [isCheckingCodeCourt, setIsCheckingCodeCourt] = useState(false);
  
  // Initialiser le formulaire avec react-hook-form AVANT les autres hooks
  const { 
    control, 
    handleSubmit, 
    reset,
    getValues,
    setValue,
    setError,
    clearErrors,
    setFocus,
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
  } = usePhotoManagement({
    setValue,
    getValues,
    addToast
  });
  
  // Charger les types de tiers "salarié"
  useEffect(() => {
    const fetchTypesTiersSalarie = async () => {
      if (!profil?.com_contrat_client_id) return;
      
      try {
        const { data, error } = await supabase
          .from('com_param_type_tiers')
          .select('id, code, libelle, salarie')
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('salarie', true)
          .eq('actif', true);
          
        if (error) throw error;
        setTypesTiersSalarie(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des types de tiers salarié:', error);
      }
    };
    
    fetchTypesTiersSalarie();
  }, [profil?.com_contrat_client_id]);

  // Gestionnaire pour la vérification du code court
  const handleCodeCourtBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const codeCourt = e.target.value.trim();
    if (!codeCourt || isCheckingCodeCourt) return;
    
    // Ne pas vérifier en mode édition sauf si le code a changé
    if (mode === 'edit' && personnelId && codeCourt === initialData?.code_court) return;
    
    setIsCheckingCodeCourt(true);
    
    try {
      console.log('Vérification du code court:', codeCourt);
      
      // Vérifier si les types de tiers "salarié" sont disponibles
      if (typesTiersSalarie.length === 0) {
        console.warn('Aucun type de tiers "salarié" trouvé');
        addToast({
          label: 'Aucun type de tiers "salarié" trouvé. Veuillez en créer un avant de continuer.',
          icon: 'AlertTriangle',
          color: '#f59e0b'
        });
        setIsCheckingCodeCourt(false);
        return;
      }
      
      // Vérifier si le code existe déjà dans la table com_tiers
      const { data, error } = await supabase
        .from('com_tiers')
        .select('id, code, nom')
        .eq('code', codeCourt)
        .eq('com_contrat_client_id', profil?.com_contrat_client_id)
        .eq('id_type_tiers', typesTiersSalarie[0].id);
        
      if (error) throw error;
      
      console.log('Résultat de la vérification:', data);
      
      if (data && data.length > 0) {
        // Le code existe déjà
        console.log('Code court déjà utilisé:', codeCourt);
        setError('code_court', {
          type: 'manual', 
          message: 'Ce code court est déjà utilisé. Veuillez en choisir un autre.'
        });
        setValue('code_court', '');
        setFocus('code_court');
      } else {
        // Le code n'existe pas, on peut créer un tiers automatiquement
        if (typesTiersSalarie.length > 0) {
          const nom = getValues('nom');
          const prenom = getValues('prenom');
          console.log('Création automatique de tiers avec:', { codeCourt, nom, prenom });
          
          if (nom && prenom) {
            // Créer un tiers automatiquement
            const tiersData = {
              code: codeCourt,
              nom: `${prenom} ${nom}`,
              id_type_tiers: typesTiersSalarie[0].id
            };
            
            const { data: newTiers, error: createError } = await supabase
              .from('com_tiers')
              .insert({
                ...tiersData,
                com_contrat_client_id: profil?.com_contrat_client_id,
                actif: true
              })
              .select()
              .single();
              
            if (createError) throw createError;
            
            // Mettre à jour le champ id_tiers avec le nouveau tiers
            console.log('Tiers créé avec succès:', newTiers);
            setValue('id_tiers', newTiers.id);
            clearErrors('code_court');
            
            addToast({
              label: `Tiers "${prenom} ${nom}" créé automatiquement avec le code "${codeCourt}"`,
              icon: 'Check',
              color: '#22c55e'
            });
          }
            // Générer un matricule automatiquement si on est en mode création
            if (mode === 'create' && profil?.com_contrat_client_id) {
              try {
                const matricule = await RHCalculMatricule(profil.com_contrat_client_id);
                if (matricule) {
                  setValue('matricule', matricule);
                  console.log('Matricule généré automatiquement:', matricule);
                }
              } catch (error) {
                console.error('Erreur lors de la génération du matricule:', error);
              }
            }
        } else {
          addToast({
            label: 'Aucun type de tiers "salarié" trouvé. Veuillez en créer un avant de continuer.',
            icon: 'AlertTriangle',
            color: '#f59e0b'
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du code court:', error);
      addToast({
        label: 'Erreur lors de la vérification du code court',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsCheckingCodeCourt(false);
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
          
          // Sauvegarder les données initiales pour les comparaisons futures
          setInitialData(formattedData);
          
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

    // fetchPersonnel();
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
      console.log('Valeur actuelle du champ lien_photo lors de la soumission:', currentPhotoPath, typeof currentPhotoPath);
      
      console.log('Données du formulaire avant nettoyage:', data);
      console.log('Valeur de lien_photo avant nettoyage:', data.lien_photo);
      // Nettoyer les données avant envoi - convertir les chaînes vides en null pour les champs optionnels
      const cleanedData = {
        ...data,
        date_naissance: !data.date_naissance || data.date_naissance === '' ? null : data.date_naissance,
        civilite: !data.civilite || data.civilite === '' ? null : data.civilite,
        sexe: !data.sexe || data.sexe === '' ? null : data.sexe,
        adresse: !data.adresse || data.adresse === '' ? null : data.adresse,
        code_postal: !data.code_postal || data.code_postal === '' ? null : data.code_postal,
        ville: !data.ville || data.ville === '' ? null : data.ville,
        pays: !data.pays || data.pays === '' ? null : data.pays,
        numero_securite_sociale: !data.numero_securite_sociale || data.numero_securite_sociale === '' ? null : data.numero_securite_sociale,
        nif: !data.nif || data.nif === '' ? null : data.nif,
        email_perso: !data.email_perso || data.email_perso === '' ? null : data.email_perso,
        telephone: !data.telephone || data.telephone === '' ? null : data.telephone,
        lien_photo: !currentPhotoPath || currentPhotoPath === '' ? null : currentPhotoPath
      };
      
      console.log('Données nettoyées avant envoi:', cleanedData);
      console.log('Valeur de lien_photo après nettoyage:', cleanedData.lien_photo);

      let result;
      
      if (mode === 'edit' && personnelId) {
        console.log('Mode édition - Mise à jour du personnel avec ID:', personnelId, 'et lien_photo:', cleanedData.lien_photo);
        console.log('Données à envoyer pour la mise à jour:', {
          ...cleanedData,
          com_contrat_client_id: profil.com_contrat_client_id
        });
        
        // Mode édition
        const { data: updatedData, error } = await supabase
          .from('rh_personnel')
          .update(cleanedData.lien_photo === null ? {
            ...cleanedData,
            com_contrat_client_id: profil.com_contrat_client_id,
            lien_photo: null
          } : {
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
          com_contrat_client_id: profil.com_contrat_client_id,
          lien_photo: cleanedData.lien_photo
        });
        
        // Mode création
        const { data: newData, error } = await supabase
          .from('rh_personnel')
          .insert(cleanedData.lien_photo === null ? {
            ...cleanedData,
            com_contrat_client_id: profil.com_contrat_client_id,
            lien_photo: null
          } : {
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
        {/* Controller caché pour lien_photo pour s'assurer que react-hook-form le gère correctement */}
        <Controller
          name="lien_photo"
          control={control}
          render={() => <input type="hidden" />}
        />

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
            render={({ field }) => (
              <FormInput
                {...field}
                placeholder="Code court"
                maxLength={12}
                error={!!errors.code_court}
                onBlur={handleCodeCourtBlur}
              />
            )}
          />
        </FormField>

        <FormField
          label="Matricule"
          required
          error={errors.matricule?.message}
          description="Matricule généré automatiquement à partir du code court"
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
                disabled={true}
              />
            )}
          />
        </FormField>

        <FormField
          label="Tiers associé"
          required
          error={errors.id_tiers?.message}
          description="Tiers créé automatiquement à partir du code court"
        >
          <Controller
            name="id_tiers"
            control={control}
            render={({ field }) => (
              <FormInput
                {...field}
                placeholder="Créé automatiquement"
                disabled={true}
              />
            )}
          />
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
    </div>
  );
};