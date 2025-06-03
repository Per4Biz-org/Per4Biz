import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Form, FormField, FormInput, FormActions } from '../ui/form';
import { Toggle } from '../ui/toggle';
import { Dropdown, DropdownOption } from '../ui/dropdown';
import { Button } from '../ui/button';

interface Entite {
  id: string;
  libelle: string;
}

interface CompteBancaireFormData {
  id_entite: string;
  code: string;
  nom: string;
  banque: string;
  iban: string;
  bic?: string;
  actif: boolean;
  commentaire?: string;
}

interface CompteBancaireFormProps {
  initialData?: CompteBancaireFormData;
  onSubmit: (data: CompteBancaireFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CompteBancaireForm({
  initialData = {
    id_entite: '',
    code: '',
    nom: '',
    banque: '',
    iban: '',
    bic: '',
    actif: true,
    commentaire: ''
  },
  onSubmit,
  onCancel,
  isSubmitting = false
}: CompteBancaireFormProps) {
  const [formData, setFormData] = useState<CompteBancaireFormData>(initialData);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof CompteBancaireFormData, string>>>({});

  useEffect(() => {
    const fetchEntites = async () => {
      const { data } = await supabase
        .from('com_entite')
        .select('id, code, libelle')
        .eq('actif', true)
        .order('libelle');

      if (data) {
        setEntites(data);
      }
    };

    fetchEntites();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors[name as keyof CompteBancaireFormData]) {
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

  const handleEntiteChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      id_entite: value
    }));
    if (errors.id_entite) {
      setErrors(prev => ({
        ...prev,
        id_entite: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CompteBancaireFormData, string>> = {};

    if (!formData.id_entite) newErrors.id_entite = 'L\'entité est requise';
    if (!formData.code) newErrors.code = 'Le code est requis';
    if (!formData.nom) newErrors.nom = 'Le nom est requis';
    if (!formData.banque) newErrors.banque = 'La banque est requise';
    if (!formData.iban) newErrors.iban = 'L\'IBAN est requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await onSubmit(formData);
  };

  const entiteOptions: DropdownOption[] = entites.map(entite => ({
    value: entite.id,
    label: `${entite.code} - ${entite.libelle}`
  }));

  return (
    <Form size={100} columns={2} onSubmit={handleSubmit} className="text-sm">
      <FormField
        label="Entité"
        required
        error={errors.id_entite}
        className="mb-3"
      >
        <Dropdown
          options={entiteOptions}
          value={formData.id_entite}
          onChange={handleEntiteChange}
          label="Sélectionner une entité"
          size="sm"
        />
      </FormField>

      <FormField
        label="Code"
        required
        error={errors.code}
        className="mb-3"
      >
        <FormInput
          name="code"
          value={formData.code}
          onChange={handleInputChange}
          maxLength={12}
          placeholder="12 caractères max"
          className="h-9"
        />
      </FormField>

      <FormField
        label="Nom"
        required
        error={errors.nom}
        className="mb-3"
      >
        <FormInput
          name="nom"
          value={formData.nom}
          onChange={handleInputChange}
          maxLength={30}
          placeholder="30 caractères max"
          className="h-9"
        />
      </FormField>

      <FormField
        label="Banque"
        required
        error={errors.banque}
        className="mb-3"
      >
        <FormInput
          name="banque"
          value={formData.banque}
          onChange={handleInputChange}
          maxLength={20}
          placeholder="Ex: BNP Paribas"
          className="h-9"
        />
      </FormField>

      <FormField
        label="IBAN"
        required
        error={errors.iban}
        className="mb-3"
      >
        <FormInput
          name="iban"
          value={formData.iban}
          onChange={handleInputChange}
          maxLength={30}
          placeholder="FRXX XXXX XXXX XXXX XXXX XXXX XXX"
          className="h-9"
        />
      </FormField>

      <FormField
        label="BIC"
        className="mb-3"
      >
        <FormInput
          name="bic"
          value={formData.bic}
          onChange={handleInputChange}
          maxLength={11}
          placeholder="11 caractères max"
          className="h-9"
        />
      </FormField>

      <FormField
        label="Statut"
        className="mb-3 col-span-1"
      >
        <Toggle
          checked={formData.actif}
          onChange={handleToggleChange}
          label={formData.actif ? 'Actif' : 'Inactif'}
          size="sm"
        />
      </FormField>

      <FormField
        label="Commentaire"
        className="mb-3 col-span-1"
      >
        <textarea
          name="commentaire"
          value={formData.commentaire}
          onChange={handleInputChange}
          className="w-full p-2 text-sm border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
          rows={1}
          placeholder="Commentaires ou notes sur le compte..."
        />
      </FormField>

      <FormActions>
        <Button
          label="Annuler"
          size="sm"
          color="#6B7280"
          onClick={onCancel}
          type="button"
        />
        <Button
          label={isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          size="sm"
          icon="Save"
          color="var(--color-primary)"
          type="submit"
          disabled={isSubmitting}
        />
      </FormActions>
    </Form>
  );
}