import React, { useEffect } from 'react';
import { useMenu } from '../../context/MenuContext';
import { menuItemsParametreGlobal } from '../../config/menuConfig';
import { PageSection } from '../../components/ui/page-section';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import styles from './styles.module.css';

const ParametreGlobal: React.FC = () => {
  const { setMenuItems } = useMenu();

  useEffect(() => {
    setMenuItems(menuItemsParametreGlobal);
  }, [setMenuItems]);

  return (
    <div className={styles.container}>
      <PageSection
        title="Paramètres Globaux"
        description="Configuration générale de votre établissement"
        className={styles.header}
      >
        <div className={styles.form}>
          <Form size={100} columns={2}>
            <FormField
              label="Nom de l'établissement"
              required
              description="Le nom qui apparaîtra sur tous les documents"
            >
              <FormInput placeholder="Restaurant Le Gourmet" />
            </FormField>

            <FormField
              label="Email de contact"
              required
            >
              <FormInput type="email" placeholder="contact@legourmet.fr" />
            </FormField>

            <FormField
              label="Téléphone"
            >
              <FormInput type="tel" placeholder="+33 1 23 45 67 89" />
            </FormField>

            <FormField
              label="Adresse"
              required
            >
              <FormInput placeholder="123 rue de la Gastronomie" />
            </FormField>

            <FormActions>
              <Button 
                label="Enregistrer" 
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