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
import PTFlag from 'country-flag-icons/react/3x2/PT';
import GBFlag from 'country-flag-icons/react/3x2/GB';
import FRFlag from 'country-flag-icons/react/3x2/FR';

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

  // Lógica para as bandeiras
  const { i18n } = useTranslation();
  const languages = [
    { code: 'pt', component: PTFlag, name: 'Português' },
    { code: 'en', component: GBFlag, name: 'English' },
    { code: 'fr', component: FRFlag, name: 'Français' }
  ];

  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setShowLanguageMenu(false); // Fecha o menu após selecionar
  };

  // Encontra o idioma atual
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  // Fecha o menu quando clica fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showLanguageMenu && !target.closest('.language-dropdown')) {
        setShowLanguageMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLanguageMenu]);


  return (
    <div className="max-w-6xl mx-auto p-8">
      <PageSection>
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-4xl font-bold text-gray-900">{t('pages.profile.title')}</h1>
          
          {/* Seletor de idiomas - dropdown com bandeira */}
          <div className="relative language-dropdown">
            {/* Bandeira atual - clicável */}
            <div
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="cursor-pointer transition-all duration-300 hover:scale-105 flex items-center"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }}
              title={`${currentLanguage.name} - Clique para trocar idioma`}
            >
              <currentLanguage.component 
                style={{ 
                  width: '28px', 
                  height: '21px',
                  borderRadius: '4px'
                }} 
              />
            </div>

            {/* Menu dropdown */}
            {showLanguageMenu && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[120px]">
                {languages.map((language) => {
                  const FlagComponent = language.component;
                  return (
                    <div
                      key={language.code}
                      onClick={() => changeLanguage(language.code)}
                      className={`
                        flex items-center gap-3 px-3 py-2 cursor-pointer transition-all duration-200
                        hover:bg-blue-50 hover:scale-105
                        ${i18n.language === language.code ? 'bg-blue-100' : ''}
                      `}
                      title={language.name}
                    >
                      <FlagComponent 
                        style={{ 
                          width: '20px', 
                          height: '15px',
                          borderRadius: '2px',
                          border: '1px solid rgba(0,0,0,0.1)'
                        }} 
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {language.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <p className="text-lg text-gray-600 mb-12">
          {t('pages.profile.subtitle')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Colonne de gauche - Avatar et infos principales */}
          <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm">
            <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center mb-6">
              <User className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{profil?.prenom} {profil?.nom}</h2>
            <p className="text-gray-600 mb-2">Code: {profil?.code_user}</p>
            <p className="text-gray-600 mb-6">Utilisateur</p>
            
            {!isEditing ? (
              <Button
                label={t('pages.profile.editProfile')}
                icon="Edit"
                color="var(--color-primary)"
                className="w-full"
                onClick={() => setIsEditing(true)}
              />
            ) : (
              <div className="flex gap-2 w-full">
                <Button
                  label={t('common.cancel')}
                  icon="X"
                  color="#6b7280"
                  className="flex-1"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                />
                <Button
                  label={isSubmitting ? t('pages.profile.saving') : t('common.save')}
                  icon="Save"
                  color="var(--color-primary)"
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>

          {/* Colonne de droite - Informations détaillées */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <User className="text-blue-500" />
              {t('pages.profile.personalInfo')}
            </h2>

            {!isEditing ? (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Hash className="w-6 h-6 text-gray-400 mt-1" />
                  <div>
                    <p className="text-gray-600">{t('pages.profile.userCode')}</p>
                    <p className="text-lg font-medium">{profil?.code_user}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <User className="w-6 h-6 text-gray-400 mt-1" />
                  <div>
                    <p className="text-gray-600">{t('pages.profile.fullName')}</p>
                    <p className="text-lg font-medium">{profil?.prenom} {profil?.nom}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-gray-400 mt-1" />
                  <div>
                    <p className="text-gray-600">{t('pages.profile.phone')}</p>
                    <p className="text-lg font-medium">{profil?.telephone || t('pages.profile.notSpecified')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Calendar className="w-6 h-6 text-gray-400 mt-1" />
                  <div>
                    <p className="text-gray-600">{t('pages.profile.memberSince')}</p>
                    <p className="text-lg font-medium">
                      {profil?.created_at && format(new Date(profil.created_at), 
                        'd MMMM yyyy', 
                        { locale: fr })}
                    </p>
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
                  className="mb-4"
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
                  className="mb-4"
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
                  className="mb-4"
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
                  className="mb-6"
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

        <ToastContainer toasts={toasts} onClose={closeToast} />
      </PageSection>
    </div>
  );
};

export default Profil;