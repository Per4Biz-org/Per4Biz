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
import { User, Upload, X } from 'lucide-react';

// Schéma de validation avec Zod
const personnelSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  civilite: z.string().nullable().optional(),
  sexe: z.string().nullable().optional(),
  date_naissance: z.string().nullable().optional(),
  adresse: z.string().nullable().optional(),
  code_postal: z.string().nullable().optional(),
  ville: z.string().nullable().optional(),
  pays: z.string().nullable().optional(),
  numero_securite_sociale: z.string().nullable().optional(),
  nif: z.string().nullable().optional(),
  email_perso: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  lien_photo: z.string().nullable().optional(),
  id_tiers: z.string().min(1, 'Le tiers est requis'),
  actif: z.boolean().default(true),
  code_court: z.string().min(1, 'Le code court est requis').max(12, 'Maximum 12 caractères'),
  matricule: z.string().min(1, 'Le matricule est requis').max(12, 'Maximum 12 caractères')
});

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
  const [isTiersModalOpen, setIsTiersModalOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Initialiser le formulaire avec react-hook-form
  const { 
    control, 
    handleSubmit, 
    reset, 
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
            loadPhotoPreview(data.lien_photo);
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

  // Charger l'aperçu de la photo
  const loadPhotoPreview = async (photoPath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('personnel-photos')
        .createSignedUrl(photoPath, 60);
      
      if (error) throw error;
      setPhotoPreview(data.signedUrl);
    } catch (error) {
      console.error('Erreur lors du chargement de la photo:', error);
    }
  };

  // Gérer l'upload de la photo
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profil?.com_contrat_client_id) return;

    setIsUploadingPhoto(true);
    try {
      // Créer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${profil.com_contrat_client_id}/${fileName}`;

      // Uploader le fichier
      const { error: uploadError } = await supabase.storage
        .from('personnel-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Mettre à jour le formulaire avec le chemin du fichier
      setValue('lien_photo', filePath);
      console.log('Chemin de la photo mis à jour dans le formulaire:', filePath);
      
      // Charger l'aperçu
      loadPhotoPreview(filePath);
      
      addToast({
        label: 'Photo téléversée avec succès',
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors du téléversement de la photo:', error);
      addToast({
        label: 'Erreur lors du téléversement de la photo',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Supprimer la photo
  const handleRemovePhoto = async () => {
    const photoPath = control._formValues.lien_photo;
    if (!photoPath) {
      console.log('Aucun chemin de photo fourni');
      return;
    }
    
    console.log('Chargement de l\'aperçu de la photo:', photoPath);

    console.log('Suppression de la photo:', photoPath);
    try {
      const { error } = await supabase.storage
        .from('personnel-photos')
        .remove([photoPath]);

      if (error) throw error;

      console.log('Photo supprimée avec succès');
      setValue('lien_photo', '');
      setPhotoPreview(null);
      
      addToast({
        label: 'Photo supprimée avec succès',
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la photo:', error);
      addToast({
        label: 'Erreur lors de la suppression de la photo',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  // Soumettre le formulaire
  const onSubmit = async (data: PersonnelFormData) => {
    if (!profil?.com_contrat_client_id) {
      addToast({
        label: 'Erreur: Profil utilisateur incomplet',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    setIsSubmitting(true);
    try {
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
        lien_photo: data.lien_photo || null
      };
      
      console.log('Données nettoyées avant envoi:', cleanedData);
      console.log('Valeur de lien_photo après nettoyage:', cleanedData.lien_photo);

      let result;
      
      if (mode === 'edit' && personnelId) {
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

        if (error) throw error;
        console.log('Personnel mis à jour avec succès:', updatedData);
        result = updatedData;
      } else {
        // Mode création
        const { data: newData, error } = await supabase
          .from('rh_personnel')
          .insert({
            ...cleanedData,
            com_contrat_client_id: profil.com_contrat_client_id
          })
          .select()
          .single();

        if (error) throw error;
        console.log('Personnel créé avec succès:', newData);
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

  // Gérer la création d'un nouveau tiers
  const handleTiersSubmit = async (tiersData: any) => {
    try {
      // Vérifier si un tiers avec ce code existe déjà
      const { data: existingTiers, error: checkError } = await supabase
        .from('com_tiers')
        .select('id, code, nom')
        .eq('code', tiersData.code)
        .eq('com_contrat_client_id', profil?.com_contrat_client_id)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      // Si un tiers avec ce code existe déjà, afficher un message et proposer de l'utiliser
      if (existingTiers) {
        if (window.confirm(`Un tiers avec le code "${tiersData.code}" existe déjà (${existingTiers.nom}). Voulez-vous l'utiliser ?`)) {
          // Utiliser le tiers existant
          setValue('id_tiers', existingTiers.id);
          
          addToast({
            label: `Tiers existant "${existingTiers.nom}" sélectionné`,
            icon: 'Check',
            color: '#22c55e'
          });
          
          setIsTiersModalOpen(false);
          return;
        } else {
          // L'utilisateur ne veut pas utiliser le tiers existant
          addToast({
            label: 'Veuillez utiliser un code différent pour créer un nouveau tiers',
            icon: 'AlertTriangle',
            color: '#f59e0b'
          });
          return;
        }
      }

      // Vérifier si un type de tiers "salarié" existe
      const { data: typeTiersSalarie, error: typeTiersError } = await supabase
        .from('com_param_type_tiers')
        .select('id')
        .eq('com_contrat_client_id', profil?.com_contrat_client_id)
        .eq('salarie', true)
        .eq('actif', true)
        .limit(1);

      if (typeTiersError) {
        throw typeTiersError;
      }

      // Si aucun type de tiers salarié n'est trouvé, utiliser le type fourni
      // Sinon, utiliser le type salarié
      const id_type_tiers = (typeTiersSalarie && typeTiersSalarie.length > 0) 
        ? typeTiersSalarie[0].id 
        : tiersData.id_type_tiers;

      const { data, error } = await supabase
        .from('com_tiers') 
        .insert({
          ...tiersData,
          id_type_tiers,
          com_contrat_client_id: profil?.com_contrat_client_id,
          // code_user n'est plus nécessaire, remplacé par created_by
        })
        .select()
        .single();

      if (error) throw error;
      
      // Mettre à jour le formulaire avec le nouveau tiers
      setValue('id_tiers', data.id);
      
      addToast({
        label: 'Tiers créé avec succès',
        icon: 'Check',
        color: '#22c55e'
      });
      
      setIsTiersModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la création du tiers:', error);
      
      // Gestion spécifique des erreurs de contrainte d'unicité
      let errorMessage = 'Erreur lors de la création du tiers';
      
      if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        if (error.message.includes('com_tiers_code_unique')) {
          errorMessage = 'Un tiers avec ce code existe déjà. Veuillez utiliser un code différent.';
        }
      }
      
      addToast({
        label: errorMessage,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Section photo de profil */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mb-4">
            {photoPreview ? (
              <img 
                src={photoPreview} 
                alt="Photo de profil" 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-16 h-16 text-gray-400" />
            )}
          </div>
          <div className="absolute bottom-0 right-0 flex">
            <input
              type="file"
              id="photo-upload"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={isUploadingPhoto}
            />
            <label
              htmlFor="photo-upload"
              className="bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors flex items-center justify-center"
              title="Ajouter une photo"
            >
              <Upload size={16} />
            </label>
            {photoPreview && (
              <button
                onClick={handleRemovePhoto}
                className="bg-red-500 text-white p-2 rounded-full ml-2 hover:bg-red-600 transition-colors flex items-center justify-center"
                title="Supprimer la photo"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500">
          {isUploadingPhoto ? 'Téléversement en cours...' : 'Cliquez pour ajouter une photo'}
        </p>
      </div>

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
                value={field.value || ''}
                onChange={field.onChange}
                label="Sélectionner une civilité"
                size="sm"
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
          label="Sexe"
          error={errors.sexe?.message}
        >
          <Controller
            name="sexe"
            control={control}
            render={({ field }) => (
              <Dropdown
                options={sexeOptions}
                value={field.value || ''}
                onChange={field.onChange}
                label="Sélectionner un sexe"
                size="sm"
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