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

type PersonnelFormData = z.infer<typeof personnelSchema>;

interface OngletInfosPersonnellesProps {
  mode: 'create' | 'edit';
  personnelId?: string;
  onSave: (id: string) => void;
  addToast: (toast: Omit<ToastData, 'id'>) => void;
}

export const OngletInfosPersonnelles: React.FC<OngletInfosPersonnellesProps> = ({
  mode,
  personnelId,
  onSave,
  addToast
}) => {
  const { profil } = useProfil();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Hooks personnalisés
  const { 
    photoPreview, 
    isUploadingPhoto, 
    loadPhotoPreview, 
    handlePhotoUpload, 
    handleRemovePhoto 
  } = usePhotoManagement();
  
  const {
    isTiersModalOpen,
    setIsTiersModalOpen,
    handleTiersSubmit
  } = useTiersManagement(setValue, addToast);

  // Initialiser le formulaire avec react-hook-form
  const { 
    control, 
    handleSubmit, 
    reset,
    getValues,
    setValue,
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
            )
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
          label="Sexe"
          error={errors.sexe?.message}
        >
          <Controller
            name="sexe"
            control={control}
            render={({ field }) => (
              <Dropdown
                options={sexeOptions}
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

        {/* Troisième ligne */}
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

        {/* Quatrième ligne */}
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

        {/* Cinquième ligne */}
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

        {/* Sixième ligne */}
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

        <FormActions>
          <Button
            label="Annuler"
            color="#6B7280"
            onClick={() => reset()}
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