import React, { useState, useEffect } from 'react';
import { Form, FormField, FormInput, FormActions } from '../../ui/form';
import { Toggle } from '../../ui/toggle';
import { Button } from '../../ui/button';

interface TypeTiersFormData {
  code: string;
  libelle: string;
  actif: boolean;
  mp: boolean;
  salarie: boolean;
}

interface TypeTiersFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TypeTiersFormData) => Promise<void>;
  initialData?: TypeTiersFormData | null;
  isSubmitting?: boolean;
}

export function TypeTiersFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false
}: TypeTiersFormModalProps) {
  const [formData, setFormData] = useState<TypeTiersFormData>({
    code: '',
    libelle: '',
    actif: true,
    mp: false,
    salarie: false
  });
  const [errors, setErrors] = useState<Partial<Record<keyof TypeTiersFormData, string>>>({});

  // Réinitialiser le formulaire quand la modale s'ouvre/ferme ou que les données initiales changent
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          code: initialData.code,
          libelle: initialData.libelle,
          actif: initialData.actif,
          mp: initialData.mp || false,
          salarie: initialData.salarie || false
        });
      } else {
        setFormData({
          code: '',
          libelle: '',
          actif: true,
          mp: false,
          salarie: false
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors[name as keyof TypeTiersFormData]) {
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

  const handleMpToggleChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      mp: checked
    }));
  };

  const handleSalarieToggleChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      salarie: checked
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TypeTiersFormData, string>> = {};

    if (!formData.code.trim()) newErrors.code = 'Le code est requis';
    if (!formData.libelle.trim()) newErrors.libelle = 'Le libellé est requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    await onSubmit({
      code: formData.code.trim(),
      libelle: formData.libelle.trim(),
      actif: formData.actif,
      mp: formData.mp,
      salarie: formData.salarie
    });
  };

  const handleCancel = () => {
    setFormData({
      code: '',
      libelle: '',
      actif: true,
      mp: false,
      salarie: false
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {initialData ? 'Modifier un type de tiers' : 'Ajouter un type de tiers'}
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

        <Form size={100} onSubmit={handleSubmit} className="text-sm">
          <FormField
            label="Code"
            required
            error={errors.code}
            description="Code unique du type de tiers"
            className="mb-4"
          >
            <FormInput
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              placeholder="Ex: CLIENT, FOURNISSEUR"
              disabled={isSubmitting}
              className="h-9"
            />
          </FormField>

          <FormField
            label="Libellé"
            required
            error={errors.libelle}
            description="Nom du type de tiers"
            className="mb-4"
          >
            <FormInput
              name="libelle"
              value={formData.libelle}
              onChange={handleInputChange}
              placeholder="Ex: Client, Fournisseur"
              disabled={isSubmitting}
              className="h-9"
            />
          </FormField>

          <FormField
            label="Matière Première"
            description="Cocher si ce type de tiers concerne des matières premières"
            className="mb-4"
          >
            <Toggle
              checked={formData.mp}
              onChange={handleMpToggleChange}
              label={formData.mp ? 'Matière première' : 'Pas une matière première'}
              icon="Package"
              disabled={isSubmitting}
              size="sm"
            />
          </FormField>

          <FormField
            label="Salarié"
            description="Cocher si ce type de tiers correspond à un salarié"
            className="mb-4"
          >
            <Toggle
              checked={formData.salarie}
              onChange={handleSalarieToggleChange}
              label={formData.salarie ? 'Salarié' : 'Non salarié'}
              icon="Users"
              disabled={isSubmitting}
              size="sm"
            />
          </FormField>

          <FormField
            label="Statut"
            description="Activer ou désactiver le type de tiers"
            className="mb-6"
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