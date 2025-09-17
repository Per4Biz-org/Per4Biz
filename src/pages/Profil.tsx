import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../context/MenuContext';
import { menuItemsAccueil } from '../config/menuConfig';
import { PageSection } from '../components/ui/page-section';
import { useProfil } from '../context/ProfilContext';
import { Button } from '../components/ui/button';
import { Form, FormField, FormInput, FormActions } from '../components/ui/form';
import { ToastContainer, ToastData } from '../components/ui/toast';
import { User, Mail, Calendar, Phone, Hash, Edit, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';

const Profil: React.FC = () => {
  const { t } = useTranslation();
  const { setMenuItems } = useMenu();
  const { profil, loading, error, updateProfil } = useProfil();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    code_user: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    setMenuItems(menuItemsAccueil);
  }, [setMenuItems]);

  React.useEffect(() => {
    if (profil) {
      setFormData({
        nom: profil.nom || '',
        prenom: profil.prenom || '',
        telephone: profil.telephone || '',
        code_user: profil.code_user || ''
      });
    }
  }, [profil]);

  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const newToast: ToastData = {
      ...toast,
      id: Date.now().toString(),
    };
    setToasts(prev => [...prev, newToast]);
  };

  const closeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.nom.trim()) {
      errors.nom = t('pages.profile.validation.lastNameRequired');
    }

    if (!formData.prenom.trim()) {
      errors.prenom = t('pages.profile.validation.firstNameRequired');
    }

    if (!formData.code_user.trim()) {
      errors.code_user = t('pages.profile.validation.userCodeRequired');
    } else if (formData.code_user.length < 3) {
      errors.code_user = t('pages.profile.validation.userCodeMinLength');
    }

    // Validation du téléphone si fourni
    if (formData.telephone && formData.telephone.trim()) {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)\.]{10,}$/;
      if (!phoneRegex.test(formData.telephone.trim())) {
        errors.telephone = t('pages.profile.validation.phoneInvalid');
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await updateProfil({
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        telephone: formData.telephone.trim() || null,
        code_user: formData.code_user.trim()
      });

      setIsEditing(false);
      addToast({
        label: t('pages.profile.profileUpdated'),
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      
      // Gestion des erreurs spécifiques
      let errorMessage = t('pages.profile.errors.updateFailed');
      if (error.message?.includes('duplicate key') || error.message?.includes('unique')) {
        errorMessage = t('pages.profile.errors.userCodeExists');
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

  const handleCancel = () => {
    if (profil) {
      setFormData({
        nom: profil.nom || '',
        prenom: profil.prenom || '',
        telephone: profil.telephone || '',
        code_user: profil.code_user || ''
      });
    }
    setFormErrors({});
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <PageSection>
          <div className="flex items-center justify-center h-64">
            <p className="text-lg text-gray-600">{t('common.loading')}</p>
          </div>
        </PageSection>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <PageSection>
          <div className="flex items-center justify-center h-64">
            <p className="text-lg text-red-600">{error}</p>
          </div>
        </PageSection>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header empresarial */}
        <div className="mb-8">
          <div className="flex items-center justify-between bg-white rounded-lg px-8 py-6 shadow-sm border border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">
              {t('pages.profile.title')}
            </h1>
          </div>
          <p className="text-lg text-gray-600 mt-3">
            {t('pages.profile.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card do usuário */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-col items-center p-8">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                  <User className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                {profil?.prenom} {profil?.nom}
              </h2>
              <div className="flex items-center gap-2 mb-1">
                <Hash className="w-4 h-4 text-gray-500" />
                <p className="text-gray-600 font-medium">{profil?.code_user}</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 mb-6">
                Utilizador
              </span>
            
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  {t('pages.profile.editProfile')}
                </button>
              ) : (
                <div className="flex gap-3 w-full">
                  <button
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-md shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-md shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? t('pages.profile.saving') : t('common.save')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card de informações detalhadas */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {t('pages.profile.personalInfo')}
                </h2>
              </div>
            </div>
            <div className="p-6">

            {!isEditing ? (
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center gap-3">
                    <Hash className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('pages.profile.userCode')}</p>
                      <p className="text-lg font-semibold text-gray-900">{profil?.code_user}</p>
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('pages.profile.fullName')}</p>
                      <p className="text-lg font-semibold text-gray-900">{profil?.prenom} {profil?.nom}</p>
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('pages.profile.phone')}</p>
                      <p className="text-lg font-semibold text-gray-900">{profil?.telephone || t('pages.profile.notSpecified')}</p>
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('pages.profile.memberSince')}</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {profil?.created_at && format(new Date(profil.created_at), 
                          'd MMMM yyyy', 
                          { locale: fr })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Form size={100} onSubmit={handleSubmit}>
                <FormField
                  label={t('pages.profile.userCode')}
                  required
                  error={formErrors.code_user}
                  description={t('pages.profile.form.userCodeDescription')}
                >
                  <FormInput
                    name="code_user"
                    value={formData.code_user}
                    onChange={handleInputChange}
                    placeholder={t('pages.profile.form.userCodePlaceholder')}
                    disabled={isSubmitting}
                    error={!!formErrors.code_user}
                  />
                </FormField>

                <FormField
                  label={t('pages.profile.form.firstName')}
                  required
                  error={formErrors.prenom}
                >
                  <FormInput
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleInputChange}
                    placeholder={t('pages.profile.form.firstNamePlaceholder')}
                    disabled={isSubmitting}
                    error={!!formErrors.prenom}
                  />
                </FormField>

                <FormField
                  label={t('pages.profile.form.lastName')}
                  required
                  error={formErrors.nom}
                >
                  <FormInput
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange}
                    placeholder={t('pages.profile.form.lastNamePlaceholder')}
                    disabled={isSubmitting}
                    error={!!formErrors.nom}
                  />
                </FormField>

                <FormField
                  label={t('pages.profile.phone')}
                  error={formErrors.telephone}
                >
                  <FormInput
                    name="telephone"
                    type="tel"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    placeholder={t('pages.profile.form.phonePlaceholder')}
                    disabled={isSubmitting}
                    error={!!formErrors.telephone}
                  />
                </FormField>
              </Form>
            )}
            </div>
          </div>
        </div>

        <ToastContainer toasts={toasts} onClose={closeToast} />
      </div>
    </div>
  );
};

export default Profil;