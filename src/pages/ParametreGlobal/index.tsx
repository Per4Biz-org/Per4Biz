import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../../context/MenuContext';
import { menuItemsParametreGlobal } from '../../config/menuConfig';
import { PageSection } from '../../components/ui/page-section';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import styles from './styles.module.css';

const ParametreGlobal: React.FC = () => {
  const { t } = useTranslation();
  const { setMenuItems } = useMenu();

  useEffect(() => {
    setMenuItems(menuItemsParametreGlobal);
  }, [setMenuItems]);

  return (
    <div className={styles.container}>
      <PageSection
        title={t('pages.globalSettings.title')}
        description={t('pages.globalSettings.subtitle')}
        className={styles.header}
      >
        <div className={styles.form}>
          <Form size={100} columns={2}>
            <FormField
              label={t('forms.establishmentName')}
              required
              description="Le nom qui apparaîtra sur tous les documents"
            >
              <FormInput placeholder="Restaurant Le Gourmet" />
            </FormField>

            <FormField
              label={t('forms.contactEmail')}
              required
            >
              <FormInput type="email" placeholder="contact@legourmet.fr" />
            </FormField>

            <FormField
              label={t('common.phone')}
            >
              <FormInput type="tel" placeholder="+33 1 23 45 67 89" />
            </FormField>

            <FormField
              label={t('forms.address')}
              required
            >
              <FormInput placeholder="123 rue de la Gastronomie" />
            </FormField>

            <FormActions>
              <Button 
                label={t('common.save')} 
                icon="Save" 
                color="var(--color-primary)"
              />
            </FormActions>
          </Form>
        </div>
      </PageSection>
    </div>
  );
}

export default ParametreGlobal ;