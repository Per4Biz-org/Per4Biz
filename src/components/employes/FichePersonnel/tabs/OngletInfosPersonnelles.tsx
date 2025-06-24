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
import { User, Upload, X, Plus } from 'lucide-react';

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
  const [showTiersModal, setShowTiersModal] = useState(false);
  const [showTiersForm, setShowTiersForm] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<PersonnelFormData>({
    resolver: zodResolver(personnelSchema),
    defaultValues: {
      nom: '',
      prenom: '',
      civilite: null,
      sexe: null,
      date_naissance: null,
      adresse: null,
      code_postal: null,
      ville: null,
      pays: null,
      numero_securite_sociale: null,
      nif: null,
      email_perso: null,
      telephone: null,
      lien_photo: null,
      id_tiers: '',
      actif: true,
      code_court: '',
      matricule: ''
    }
  });

  // Options pour les dropdowns
  const civiliteOptions: DropdownOption[] = [
    { value: 'Monsieur', label: 'Monsieur' },
    { value: 'Madame', label: 'Madame' },
    { value: 'Mademoiselle', label: 'Mademoiselle' }
  ];

  const sexeOptions: DropdownOption[] = [
    { value: 'Homme', label: 'Homme' },
    { value: 'Femme', label: 'Femme' }
  ];

  // Charger les données en mode édition
  useEffect(() => {
    if (mode === 'edit' && personnelId) {
      loadPersonnelData();
    }
  }, [mode, personnelId]);

  const loadPersonnelData = async () => {
    if (!personnelId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rh_personnel')
        .select('*')
        .eq('id', personnelId)
        .single();

      if (error) throw error;

      if (data) {
        reset({
          nom: data.nom || '',
          prenom: data.prenom || '',
          civilite: data.civilite,
          sexe: data.sexe,
          date_naissance: data.date_naissance,
          adresse: data.adresse,
          code_postal: data.code_postal,
          ville: data.ville,
          pays: data.pays,
          numero_securite_sociale: data.numero_securite_sociale,
          nif: data.nif,
          email_perso: data.email_perso,
          telephone: data.telephone,
          lien_photo: data.lien_photo,
          id_tiers: data.id_tiers,
          actif: data.actif,
          code_court: data.code_court,
          matricule: data.matricule
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger les données du personnel'
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: PersonnelFormData) => {
    if (!profil?.com_contrat_client_id) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Profil non trouvé'
      });
      return;
    }

    try {
      const personnelData = {
        ...data,
        com_contrat_client_id: profil.com_contrat_client_id,
        // Convertir les chaînes vides en null pour les champs optionnels
        civilite: data.civilite || null,
        sexe: data.sexe || null,
        date_naissance: data.date_naissance || null,
        adresse: data.adresse || null,
        code_postal: data.code_postal || null,
        ville: data.ville || null,
        pays: data.pays || null,
        numero_securite_sociale: data.numero_securite_sociale || null,
        nif: data.nif || null,
        email_perso: data.email_perso || null,
        telephone: data.telephone || null,
        lien_photo: data.lien_photo || null
      };

      let result;
      if (mode === 'create') {
        result = await supabase
          .from('rh_personnel')
          .insert([personnelData])
          .select()
          .single();
      } else {
        result = await supabase
          .from('rh_personnel')
          .update(personnelData)
          .eq('id', personnelId)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      addToast({
        type: 'success',
        title: 'Succès',
        message: mode === 'create' 
          ? 'Personnel créé avec succès' 
          : 'Personnel mis à jour avec succès'
      });

      if (result.data) {
        onSave(result.data.id);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de sauvegarder les données'
      });
    }
  };

  const handleTiersSelect = (tiersId: string) => {
    setValue('id_tiers', tiersId);
    setShowTiersModal(false);
  };

  const handleTiersCreate = (tiersId: string) => {
    setValue('id_tiers', tiersId);
    setShowTiersForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informations de base</h3>
            
            <FormField label="Nom *" error={errors.nom?.message}>
              <Controller
                name="nom"
                control={control}
                render={({ field }) => (
                  <FormInput
                    {...field}
                    placeholder="Nom de famille"
                  />
                )}
              />
            </FormField>

            <FormField label="Prénom *" error={errors.prenom?.message}>
              <Controller
                name="prenom"
                control={control}
                render={({ field }) => (
                  <FormInput
                    {...field}
                    placeholder="Prénom"
                  />
                )}
              />
            </FormField>

            <FormField label="Civilité" error={errors.civilite?.message}>
              <Controller
                name="civilite"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    options={civiliteOptions}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Sélectionner une civilité"
                  />
                )}
              />
            </FormField>

            <FormField label="Sexe" error={errors.sexe?.message}>
              <Controller
                name="sexe"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    options={sexeOptions}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Sélectionner le sexe"
                  />
                )}
              />
            </FormField>

            <FormField label="Date de naissance" error={errors.date_naissance?.message}>
              <Controller
                name="date_naissance"
                control={control}
                render={({ field }) => (
                  <FormInput
                    {...field}
                    type="date"
                    value={field.value || ''}
                  />
                )}
              />
            </FormField>
          </div>

          {/* Informations administratives */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informations administratives</h3>
            
            <FormField label="Code court *" error={errors.code_court?.message}>
              <Controller
                name="code_court"
                control={control}
                render={({ field }) => (
                  <FormInput
                    {...field}
                    placeholder="Code court (max 12 caractères)"
                    maxLength={12}
                  />
                )}
              />
            </FormField>

            <FormField label="Matricule *" error={errors.matricule?.message}>
              <Controller
                name="matricule"
                control={control}
                render={({ field }) => (
                  <FormInput
                    {...field}
                    placeholder="Matricule (max 12 caractères)"
                    maxLength={12}
                  />
                )}
              />
            </FormField>

            <FormField label="NIF" error={errors.nif?.message}>
              <Controller
                name="nif"
                control={control}
                render={({ field }) => (
                  <FormInput
                    {...field}
                    placeholder="Numéro d'identification fiscale"
                    value={field.value || ''}
                  />
                )}
              />
            </FormField>

            <FormField label="Numéro de sécurité sociale" error={errors.numero_securite_sociale?.message}>
              <Controller
                name="numero_securite_sociale"
                control={control}
                render={({ field }) => (
                  <FormInput
                    {...field}
                    placeholder="Numéro de sécurité sociale"
                    value={field.value || ''}
                  />
                )}
              />
            </FormField>

            <FormField label="Tiers associé *" error={errors.id_tiers?.message}>
              <div className="flex gap-2">
                <div className="flex-1">
                  <TiersSelector
                    value={watch('id_tiers')}
                    onChange={(value) => setValue('id_tiers', value)}
                    placeholder="Sélectionner un tiers"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTiersModal(true)}
                >
                  <User className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTiersForm(true)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </FormField>
          </div>
        </div>

        {/* Coordonnées */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Coordonnées</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Adresse" error={errors.adresse?.message}>
              <Controller
                name="adresse"
                control={control}
                render={({ field }) => (
                  <FormInput
                    {...field}
                    placeholder="Adresse complète"
                    value={field.value || ''}
                  />
                )}
              />
            </FormField>

            <FormField label="Code postal" error={errors.code_postal?.message}>
              <Controller
                name="code_postal"
                control={control}
                render={({ field }) => (
                  <FormInput
                    {...field}
                    placeholder="Code postal"
                    value={field.value || ''}
                  />
                )}
              />
            </FormField>

            <FormField label="Ville" error={errors.ville?.message}>
              <Controller
                name="ville"
                control={control}
                render={({ field }) => (
                  <FormInput
                    {...field}
                    placeholder="Ville"
                    value={field.value || ''}
                  />
                )}
              />
            </FormField>

            <FormField label="Pays" error={errors.pays?.message}>
              <Controller
                name="pays"
                control={control}
                render={({ field }) => (
                  <FormInput
                    {...field}
                    placeholder="Pays"
                    value={field.value || ''}
                  />
                )}
              />
            </FormField>

            <FormField label="Email personnel" error={errors.email_perso?.message}>
              <Controller
                name="email_perso"
                control={control}
                render={({ field }) => (
                  <FormInput
                    {...field}
                    type="email"
                    placeholder="email@exemple.com"
                    value={field.value || ''}
                  />
                )}
              />
            </FormField>

            <FormField label="Téléphone" error={errors.telephone?.message}>
              <Controller
                name="telephone"
                control={control}
                render={({ field }) => (
                  <FormInput
                    {...field}
                    placeholder="Numéro de téléphone"
                    value={field.value || ''}
                  />
                )}
              />
            </FormField>
          </div>
        </div>

        <FormActions>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </FormActions>
      </Form>

      {/* Modals */}
      {showTiersModal && (
        <TiersSelectModal
          onSelect={handleTiersSelect}
          onClose={() => setShowTiersModal(false)}
        />
      )}

      {showTiersForm && (
        <TiersFormModal
          mode="create"
          onSave={handleTiersCreate}
          onClose={() => setShowTiersForm(false)}
          addToast={addToast}
        />
      )}
    </div>
  );
};