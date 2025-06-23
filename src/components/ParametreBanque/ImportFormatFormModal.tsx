import React, { useState, useEffect } from 'react';
import { Form, FormField, FormInput, FormActions } from '../ui/form';
import { Toggle } from '../ui/toggle';
import { Button } from '../ui/button';

interface ImportFormatFormData {
  code: string;
  libelle: string;
  banque: string;
  extension?: string;
  encodage: string;
  separateur: string;
  premiere_ligne_donnees: number;
  colonnes: string[];
  actif: boolean;
}

interface ImportFormatFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ImportFormatFormData) => Promise<void>;
  initialData?: ImportFormatFormData | null;
  isSubmitting?: boolean;
}

export function ImportFormatFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false
}: ImportFormatFormModalProps) {
  const [formData, setFormData] = useState<ImportFormatFormData>({
    code: '',
    libelle: '',
    banque: '',
    extension: '',
    encodage: 'utf-8',
    separateur: '\t',
    premiere_ligne_donnees: 1,
    colonnes: [],
    actif: true
  });
  const [colonnesText, setColonnesText] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof ImportFormatFormData, string>>>({});

  // Réinitialiser le formulaire quand la modale s'ouvre/ferme ou que les données initiales changent
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          code: initialData.code,
          libelle: initialData.libelle,
          banque: initialData.banque,
          extension: initialData.extension || '',
          encodage: initialData.encodage,
          separateur: initialData.separateur,
          premiere_ligne_donnees: initialData.premiere_ligne_donnees,
          colonnes: initialData.colonnes || [],
          actif: initialData.actif
        });
        setColonnesText(initialData.colonnes ? initialData.colonnes.join('\n') : '');
      } else {
        setFormData({
          code: '',
          libelle: '',
          banque: '',
          extension: '',
          encodage: 'utf-8',
          separateur: '\t',
          premiere_ligne_donnees: 1,
          colonnes: [],
          actif: true
        });
        setColonnesText('');
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Traitement spécial pour les champs numériques
    if (name === 'premiere_ligne_donnees') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 1 : parseInt(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors[name as keyof ImportFormatFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleColonnesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setColonnesText(value);
    
    // Convertir le texte en tableau de colonnes
    const colonnesArray = value
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '');
    
    setFormData(prev => ({
      ...prev,
      colonnes: colonnesArray
    }));
    
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors.colonnes) {
      setErrors(prev => ({
        ...prev,
        colonnes: undefined
      }));
    }
  };

  const handleToggleChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      actif: checked
    }));
  };

  const handleSeparateurChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      separateur: value
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ImportFormatFormData, string>> = {};

    if (!formData.code.trim()) newErrors.code = 'Le code est requis';
    if (!formData.libelle.trim()) newErrors.libelle = 'Le libellé est requis';
    if (!formData.banque.trim()) newErrors.banque = 'La banque est requise';
    
    if (formData.premiere_ligne_donnees < 0) {
      newErrors.premiere_ligne_donnees = 'La valeur doit être positive';
    }
    
    if (formData.colonnes.length === 0) {
      newErrors.colonnes = 'Au moins une colonne est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    await onSubmit({
      code: formData.code.trim(),
      libelle: formData.libelle.trim(),
      banque: formData.banque.trim(),
      extension: formData.extension?.trim() || undefined,
      encodage: formData.encodage,
      separateur: formData.separateur,
      premiere_ligne_donnees: formData.premiere_ligne_donnees,
      colonnes: formData.colonnes,
      actif: formData.actif
    });
  };

  const handleCancel = () => {
    setFormData({
      code: '',
      libelle: '',
      banque: '',
      extension: '',
      encodage: 'utf-8',
      separateur: '\t',
      premiere_ligne_donnees: 1,
      colonnes: [],
      actif: true
    });
    setColonnesText('');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {initialData ? 'Modifier un format d\'import' : 'Ajouter un format d\'import'}
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

        <Form size={100} columns={2} onSubmit={handleSubmit} className="text-sm">
          <FormField
            label="Code"
            required
            error={errors.code}
            description="Code unique du format d'import"
            className="mb-4"
          >
            <FormInput
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              placeholder="Ex: BNP_CSV, SG_XLS"
              disabled={isSubmitting}
              className="h-9"
            />
          </FormField>

          <FormField
            label="Libellé"
            required
            error={errors.libelle}
            description="Nom descriptif du format"
            className="mb-4"
          >
            <FormInput
              name="libelle"
              value={formData.libelle}
              onChange={handleInputChange}
              placeholder="Ex: BNP Paribas - Format CSV"
              disabled={isSubmitting}
              className="h-9"
            />
          </FormField>

          <FormField
            label="Banque"
            required
            error={errors.banque}
            description="Nom de la banque"
            className="mb-4"
          >
            <FormInput
              name="banque"
              value={formData.banque}
              onChange={handleInputChange}
              placeholder="Ex: BNP, Société Générale"
              disabled={isSubmitting}
              className="h-9"
            />
          </FormField>

          <FormField
            label="Extension"
            error={errors.extension}
            description="Extension du fichier (sans le point)"
            className="mb-4"
          >
            <FormInput
              name="extension"
              value={formData.extension}
              onChange={handleInputChange}
              placeholder="Ex: csv, xls, txt"
              disabled={isSubmitting}
              className="h-9"
            />
          </FormField>

          <FormField
            label="Encodage"
            error={errors.encodage}
            description="Encodage du fichier"
            className="mb-4"
          >
            <select
              name="encodage"
              value={formData.encodage}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="w-full p-2 text-sm border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none h-9"
            >
              <option value="utf-8">UTF-8</option>
              <option value="latin1">Latin-1 (ISO-8859-1)</option>
              <option value="windows-1252">Windows-1252</option>
              <option value="ascii">ASCII</option>
            </select>
          </FormField>

          <FormField
            label="Séparateur"
            error={errors.separateur}
            description="Caractère séparateur des colonnes"
            className="mb-4"
          >
            <select
              name="separateur"
              value={formData.separateur}
              onChange={handleSeparateurChange}
              disabled={isSubmitting}
              className="w-full p-2 text-sm border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none h-9"
            >
              <option value="\t">Tabulation</option>
              <option value=";">Point-virgule (;)</option>
              <option value=",">Virgule (,)</option>
              <option value="|">Pipe (|)</option>
            </select>
          </FormField>

          <FormField
            label="Première ligne de données"
            error={errors.premiere_ligne_donnees}
            description="Numéro de la première ligne contenant des données"
            className="mb-4"
          >
            <FormInput
              name="premiere_ligne_donnees"
              type="number"
              value={formData.premiere_ligne_donnees.toString()}
              onChange={handleInputChange}
              min="0"
              disabled={isSubmitting}
              className="h-9"
            />
          </FormField>

          <FormField
            label="Statut"
            description="Activer ou désactiver ce format d'import"
            className="mb-4"
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

          <FormField
            label="Colonnes"
            required
            error={errors.colonnes}
            description="Liste des colonnes au format 'nom : type' dans l'ordre EXACT du fichier (une par ligne)"
            className="mb-6 col-span-2"
          >
            <div className="mb-2 text-xs text-gray-600">
              <p>Exemple pour un relevé bancaire standard (format 'nom : type') - <strong>L'ordre est important</strong>:</p>
              <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                companhia : texte
                produto : texte
                conta : texte
                moeda : texte
                data_lancamento : date
                data_valor : date
                descricao : texte
                valor : montant
                saldo : montant
                referencia_doc : texte
              </pre>
              <p className="mt-2 text-red-600 font-medium">IMPORTANT: L'ordre des colonnes doit correspondre EXACTEMENT à l'ordre des colonnes dans le fichier CSV.</p>
              <p className="mt-1">Types supportés: <code>texte</code>, <code>date</code>, <code>montant</code>. Le type permet de traiter correctement les données lors de l'import.</p>
            </div>
            <textarea
              name="colonnes"
              value={colonnesText}
              onChange={handleColonnesChange}
              className="w-full p-2 text-sm border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
              rows={6}
              placeholder="companhia : texte\nproduto : texte\nconta : texte\nmoeda : texte\ndata_lancamento : date\ndata_valor : date\ndescricao : texte\nvalor : montant\nsaldo : montant\nreferencia_doc : texte"
              disabled={isSubmitting}
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