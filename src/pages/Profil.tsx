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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header moderno */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {t('pages.profile.title')}
          </h1>
          <p className="text-sm text-slate-600">
            {t('pages.profile.subtitle')}
          </p>
        </div>

        <div className="space-y-6">
          {/* Card principal do perfil */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white">
                  <div className="w-2 h-2 bg-white rounded-full ml-1 mt-1"></div>
                </div>
              </div>

              {/* Informações principais */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 truncate">
                      {profil?.prenom} {profil?.nom}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Hash className="w-4 h-4 text-slate-500" />
                      <p className="text-slate-600 font-medium">{profil?.code_user}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                    Utilizador
                  </span>
                </div>

                {/* Informações de contato */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600">{profil?.telephone || t('pages.profile.notSpecified')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600">
                      {profil?.created_at && format(new Date(profil.created_at), 'd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                </div>

                {/* Botão de edição */}
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105"
                  >
                    <Edit className="w-4 h-4" />
                    {t('pages.profile.editProfile')}
                  </button>
                ) : (
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-500 hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all duration-200"
                    >
                      <Save className="w-4 h-4" />
                      {isSubmitting ? t('pages.profile.saving') : t('common.save')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card de informações detalhadas */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {isEditing ? 'Editar Informações' : 'Informações Detalhadas'}
              </h3>
              <p className="text-sm text-slate-600">
                {isEditing ? 'Atualize os seus dados pessoais' : 'Detalhes da sua conta e informações pessoais'}
              </p>
            </div>

            {!isEditing ? (
              /* Visualização das informações */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Código do Utilizador */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-4 h-4 text-blue-600" />
                      <label className="text-sm font-semibold text-slate-700">{t('pages.profile.userCode')}</label>
                    </div>
                    <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="text-sm font-medium text-slate-900">{profil?.code_user}</p>
                    </div>
                  </div>

                  {/* Nome Completo */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <label className="text-sm font-semibold text-slate-700">{t('pages.profile.fullName')}</label>
                    </div>
                    <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="text-sm font-medium text-slate-900">{profil?.prenom} {profil?.nom}</p>
                    </div>
                  </div>

                  {/* Telefone */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <label className="text-sm font-semibold text-slate-700">{t('pages.profile.phone')}</label>
                    </div>
                    <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="text-sm font-medium text-slate-900">{profil?.telephone || t('pages.profile.notSpecified')}</p>
                    </div>
                  </div>

                  {/* Membro desde */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <label className="text-sm font-semibold text-slate-700">{t('pages.profile.memberSince')}</label>
                    </div>
                    <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="text-sm font-medium text-slate-900">
                        {profil?.created_at && format(new Date(profil.created_at), 'd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Formulário de edição */

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Grid de campos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Código de Utilizador */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      {t('pages.profile.userCode')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="code_user"
                      value={formData.code_user}
                      onChange={handleInputChange}
                      placeholder={t('pages.profile.form.userCodePlaceholder')}
                      disabled={isSubmitting}
                      className={`w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        formErrors.code_user ? 'border-red-500 ring-2 ring-red-200' : ''
                      }`}
                    />
                    {formErrors.code_user && (
                      <p className="text-sm text-red-600">{formErrors.code_user}</p>
                    )}
                  </div>

                  {/* Telefone */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      {t('pages.profile.phone')}
                    </label>
                    <input
                      name="telephone"
                      type="tel"
                      value={formData.telephone}
                      onChange={handleInputChange}
                      placeholder={t('pages.profile.form.phonePlaceholder')}
                      disabled={isSubmitting}
                      className={`w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        formErrors.telephone ? 'border-red-500 ring-2 ring-red-200' : ''
                      }`}
                    />
                    {formErrors.telephone && (
                      <p className="text-sm text-red-600">{formErrors.telephone}</p>
                    )}
                  </div>

                  {/* Primeiro Nome */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      {t('pages.profile.form.firstName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleInputChange}
                      placeholder={t('pages.profile.form.firstNamePlaceholder')}
                      disabled={isSubmitting}
                      className={`w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        formErrors.prenom ? 'border-red-500 ring-2 ring-red-200' : ''
                      }`}
                    />
                    {formErrors.prenom && (
                      <p className="text-sm text-red-600">{formErrors.prenom}</p>
                    )}
                  </div>

                  {/* Último Nome */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      {t('pages.profile.form.lastName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                      placeholder={t('pages.profile.form.lastNamePlaceholder')}
                      disabled={isSubmitting}
                      className={`w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        formErrors.nom ? 'border-red-500 ring-2 ring-red-200' : ''
                      }`}
                    />
                    {formErrors.nom && (
                      <p className="text-sm text-red-600">{formErrors.nom}</p>
                    )}
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        <ToastContainer toasts={toasts} onClose={closeToast} />
      </div>
    </div>
  );
};

export default Profil;