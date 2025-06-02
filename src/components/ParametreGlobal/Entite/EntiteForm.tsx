import React from 'react';
import { Form, FormField, FormInput, FormActions } from '../../ui/form';
import { Toggle } from '../../ui/toggle';
import { Button } from '../../ui/button';

interface EntiteFormData {
  code: string;
  libelle: string;
  actif: boolean;
}

interface EntiteFormProps {
  initialData?: EntiteFormData;
  onSubmit: (data: EntiteFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function EntiteForm({
  initialData = { code: '', libelle: '', actif: true },
  onSubmit,
  onCancel,
  isSubmitting = false
}: EntiteFormProps) {
  const [formData, setFormData] = React.useState<EntiteFormData>(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      actif: checked
    }));
  };

  return (
    <Form size={100} onSubmit={handleSubmit}>
      <FormField
        label="Code"
        required
        description="Code unique de l'entité"
      >
        <FormInput
          name="code"
          value={formData.code}
          onChange={handleInputChange}
          placeholder="Ex: ENT001"
          required
          maxLength={20}
        />
      </FormField>

      <FormField
        label="Libellé"
        required
        description="Nom de l'entité"
      >
        <FormInput
          name="libelle"
          value={formData.libelle}
          onChange={handleInputChange}
          placeholder="Ex: Entité principale"
          required
          maxLength={100}
        />
      </FormField>

      <FormField
        label="Statut"
        description="Activer ou désactiver l'entité"
      >
        <Toggle
          checked={formData.actif}
          onChange={handleToggleChange}
          label={formData.actif ? 'Actif' : 'Inactif'}
          icon="Check"
        />
      </FormField>

      <FormActions>
        <Button
          label="Annuler"
          color="#6B7280"
          onClick={onCancel}
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
  );
}