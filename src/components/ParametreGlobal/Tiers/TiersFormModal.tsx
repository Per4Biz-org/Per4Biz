import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useProfil } from '../../../context/ProfilContext';
import { Form, FormField, FormInput, FormActions } from '../../ui/form';
import { Toggle } from '../../ui/toggle';
import { Dropdown, DropdownOption } from '../../ui/dropdown';
import { Button } from '../../ui/button';

interface TypeTiers {
  id: string;
  code: string;
  libelle: string;
}

interface TiersFormData {
  code: string;
  nom: string;
  nif?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  actif: boolean;
  id_type_tiers: string;
}

interface TiersFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TiersFormData) => Promise<void>;
  initialData?: TiersFormData | null;
  isSubmitting?: boolean;
}

export function TiersFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false
}: TiersFormModalProps) {
  const [formData, setFormData] = useState<TiersFormData>({
    code: '',
    nom: '',
    nif: '',
    email: '',
    telephone: '',
    adresse: '',
    code_postal: '',
    ville: '',
    actif: true,
    id_type_tiers: ''
  });
  const [typesTiers, setTypesTiers] = useState<TypeTiers[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof TiersFormData, string>>>({});
  const { profil } = useProfil();

  // Charger les types de tiers
  useEffect(() => {
    const fetchTypesTiers = async () => {
      if (!profil?.com_contrat_client_id) return;

      const { data } = await supabase
        .from('com_param_type_tiers')
        .select('id, code, libelle')
        .eq('actif', true)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('libelle');

      if (data) {
        setTypesTiers(data);
      }
    };

    if (isOpen) {
      fetchTypesTiers();
    }
  }, [isOpen, profil?.com_contrat_client_id]);

  // Réinitialiser le formulaire quand la modale s'ouvre/ferme ou que les données initiales changent
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          code: initialData.code,
          nom: initialData.nom,
          nif: initialData.nif || '',
          email: initialData.email || '',
          telephone: initialData.telephone || '',
          adresse: initialData.adresse || '',
          code_postal: initialData.code_postal || '',
          ville: initialData.ville || '',
          actif: initialData.actif,
          id_type_tiers: initialData.id_type_tiers
        });
      } else {
        setFormData({
          code: '',
          nom: '',
          nif: '',
          email: '',
          telephone: '',
          adresse: '',
          code_postal: '',
          ville: '',
          actif: true,
          id_type_tiers: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors[name as keyof TiersFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleToggleChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      actif: checked
    }));
  };

  const handleTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      id_type_tiers: value
    }));
    if (errors.id_type_tiers) {
      setErrors(prev => ({
        ...prev,
        id_type_tiers: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TiersFormData, string>> = {};

    if (!formData.code.trim()) newErrors.code = 'Le code est requis';
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.id_type_tiers) newErrors.id_type_tiers = 'Le type de tiers est requis';

    // Validation email si fourni
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Format d\'email invalide';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    await onSubmit({
      code: formData.code.trim(),
      nom: formData.nom.trim(),
      nif: formData.nif?.trim() || undefined,
      email: formData.email?.trim() || undefined,
      telephone: formData.telephone?.trim() || undefined,
      adresse: formData.adresse?.trim() || undefined,
      code_postal: formData.code_postal?.trim() || undefined,
      ville: formData.ville?.trim() || undefined,
      actif: formData.actif,
      id_type_tiers: formData.id_type_tiers
    });
  };

  const handleCancel = () => {
    setFormData({
      code: '',
      nom: '',
      nif: '',
      email: '',
      telephone: '',
      adresse: '',
      code_postal: '',
      ville: '',
      actif: true,
      id_type_tiers: ''
    });
    setErrors({});
    onClose();
  };

  const typesTiersOptions: DropdownOption[] = typesTiers.map(type => ({
    value: type.id,
    label: `${type.code} - ${type.libelle}`
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {initialData ? 'Modifier un tiers' : 'Ajouter un tiers'}
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <Form size={100} columns={3} onSubmit={handleSubmit} className="text-sm">
          <FormField
            label="Code"
            required
            error={errors.code}
            className="mb-1"
          >
            <FormInput
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              placeholder="Ex: CLI001, FOUR001"
              disabled={isSubmitting}
              className="h-7"
            />
          </FormField>

          <FormField
            label="Nom"
            required
            error={errors.nom}
            className="mb-1"
          >
            <FormInput
              name="nom"
              value={formData.nom}
              onChange={handleInputChange}
              placeholder="Ex: Société ABC, Jean Dupont"
              disabled={isSubmitting}
              className="h-7"
            />
          </FormField>

          <FormField
            label="Type de tiers"
            required
            error={errors.id_type_tiers}
            className="mb-1"
          >
            <Dropdown
              options={typesTiersOptions}
              value={formData.id_type_tiers}
              onChange={handleTypeChange}
              label="Sélectionner un type"
              size="sm"
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label="NIF"
            className="mb-1"
          >
            <FormInput
              name="nif"
              value={formData.nif}
              onChange={handleInputChange}
              placeholder="Ex: 123456789"
              disabled={isSubmitting}
              className="h-7"
            />
          </FormField>

          <FormField
            label="Email"
            error={errors.email}
            className="mb-1"
          >
            <FormInput
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Ex: contact@exemple.com"
              disabled={isSubmitting}
              className="h-7"
            />
          </FormField>

          <FormField
            label="Téléphone"
            className="mb-1"
          >
            <FormInput
              name="telephone"
              type="tel"
              value={formData.telephone}
              onChange={handleInputChange}
              placeholder="Ex: +33 1 23 45 67 89"
              disabled={isSubmitting}
              className="h-7"
            />
          </FormField>

          <FormField
            label="Adresse"
            className="mb-1 col-span-2"
          >
            <FormInput
              name="adresse"
              value={formData.adresse}
              onChange={handleInputChange}
              placeholder="Ex: 123 rue de la République"
              disabled={isSubmitting}
              className="h-7"
            />
          </FormField>

          <FormField
            label="Code postal"
            className="mb-1"
          >
            <FormInput
              name="code_postal"
              value={formData.code_postal}
              onChange={handleInputChange}
              placeholder="Ex: 75001"
              disabled={isSubmitting}
              className="h-7"
            />
          </FormField>

          <FormField
            label="Ville"
            className="mb-1"
          >
            <FormInput
              name="ville"
              value={formData.ville}
              onChange={handleInputChange}
              placeholder="Ex: Paris"
              disabled={isSubmitting}
              className="h-7"
            />
          </FormField>

          <FormField
            label="Statut"
            className="mb-2"
          >
            <Toggle
              checked={formData.actif}
              onChange={handleToggleChange}
              label={formData.actif ? 'Actif' : 'Inactif'}
              icon="Check"
              disabled={isSubmitting}
              size="sm"
            />
          </FormField>

          <FormActions>
            <Button
              label="Annuler"
              color="#6B7280"
              onClick={handleCancel}
              type="button"
              disabled={isSubmitting}
              size="sm"
            />
            <Button
              label={isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              icon="Save"
              color="var(--color-primary)"
              type="submit"
              disabled={isSubmitting}
              size="sm"
            />
          </FormActions>
        </Form>
      </div>
    </div>
  );
}