import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { Form, FormField, FormInput, FormActions } from '../components/ui/form';
import { Button } from '../components/ui/button';
import { PageSection } from '../components/ui/page-section';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      navigate(from, { replace: true });
    } catch (err) {
      setError(t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <PageSection>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">{t('auth.login')}</h1>
            <p className="mt-2 text-gray-600">
              {t('auth.welcomeMessage')}
            </p>
          </div>

          <Form size={100} onSubmit={handleSubmit}>
            <FormField
              label={t('common.email')}
              required
              error={error}
            >
              <FormInput
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder={t('auth.emailPlaceholder')}
              />
            </FormField>

            <FormField
              label={t('common.password')}
              required
            >
              <FormInput
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder={t('auth.passwordPlaceholder')}
              />
            </FormField>

            <FormActions>
              <Button
                type="submit"
                label={loading ? t('auth.loggingIn') : t('auth.loginButton')}
                color="var(--color-primary)"
                disabled={loading}
              />
            </FormActions>
          </Form>
        </PageSection>
      </div>
    </div>
  );
};

export default Login;