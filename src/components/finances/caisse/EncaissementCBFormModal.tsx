import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Form, FormField, FormInput, FormActions } from '../../ui/form';
import { Button } from '../../ui/button';
import { EncaissementCB } from './FermetureCaisseDrawer';

interface EncaissementCBFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (encaissement: EncaissementCB) => void;
  initialData?: EncaissementCB | null;
}

export function EncaissementCBFormModal({
  isOpen,
  onClose,
  onSave,
  initialData
}: EncaissementCBFormModalProps) {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState<EncaissementCB>({
    periode: '',
    montant_brut: 0,
    montant_reel: 0,
    commentaire: ''
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        periode: '',
        montant_brut: 0,
        montant_reel: 0,
        commentaire: ''
      });
    }
    setFormErrors({});
  }, [initialData, isOpen]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Traitement spécial pour les champs numériques
    if (['montant_brut', 'montant_reel'].includes(name)) {
      const numValue = value === '' ? 0 : parseFloat(value);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Effacer l'erreur quand l'utilisateur modifie un champ
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.periode.trim()) {
      errors.periode = 'La période est requise';
    }
    
    if (formData.montant_brut <= 0) {
      errors.montant_brut = 'Le montant brut doit être supérieur à 0';
    }
    
    if (formData.montant_reel <= 0) {
      errors.montant_reel = 'Le montant réel doit être supérieur à 0';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    // Préserver l'ID si on modifie un encaissement existant
    const dataToSave: EncaissementCB = {
      ...formData,
      id: initialData?.id
    };
    
    onSave(dataToSave);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">
            {initialData ? t('cashRegister.closure.cardPaymentModal.editCardPayment') : t('cashRegister.closure.cardPaymentModal.newCardPayment')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <Form size={100} onSubmit={handleSubmit}>
            <FormField
              label={t('cashRegister.closure.cardPaymentModal.period')}
              required
              error={formErrors.periode}
              description={t('cashRegister.closure.cardPaymentModal.periodDescription')}
            >
              <FormInput
                name="periode"
                value={formData.periode}
                onChange={handleInputChange}
                placeholder={t('cashRegister.closure.cardPaymentModal.periodPlaceholder')}
              />
            </FormField>
            
            <FormField
              label={t('cashRegister.closure.cardPaymentModal.grossAmount')}
              required
              error={formErrors.montant_brut}
            >
              <FormInput
                type="number"
                name="montant_brut"
                value={formData.montant_brut.toString()}
                onChange={handleInputChange}
                step="0.01"
                min="0"
              />
            </FormField>
            
            <FormField
              label={t('cashRegister.closure.cardPaymentModal.realAmount')}
              required
              error={formErrors.montant_reel}
            >
              <FormInput
                type="number"
                name="montant_reel"
                value={formData.montant_reel.toString()}
                onChange={handleInputChange}
                step="0.01"
                min="0"
              />
            </FormField>
            
            <FormField
              label={t('cashRegister.closure.cardPaymentModal.comment')}
            >
              <textarea
                name="commentaire"
                value={formData.commentaire || ''}
                onChange={handleInputChange}
                className="w-full p-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
                rows={2}
                placeholder={t('cashRegister.closure.cardPaymentModal.commentPlaceholder')}
              />
            </FormField>
            
            <FormActions>
              <Button
                label={t('cashRegister.closure.cardPaymentModal.cancel')}
                color="#6B7280"
                onClick={onClose}
                type="button"
              />
              <Button
                label={t('cashRegister.closure.cardPaymentModal.save')}
                icon="Save"
                color="var(--color-primary)"
                type="submit"
              />
            </FormActions>
          </Form>
        </div>
      </div>
    </div>
  );
}