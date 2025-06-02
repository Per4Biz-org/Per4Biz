import React, { useEffect } from 'react';
import { useMenu } from '../../../context/MenuContext';
import { menuItemsParamGestionFinanciere } from '../../../config/menuConfig';
import { PageSection } from '../../../components/ui/page-section';
import styles from './styles.module.css';

const ParametresFinances: React.FC = () => {
  const { setMenuItems } = useMenu();

  useEffect(() => {
    setMenuItems(menuItemsParamGestionFinanciere);
  }, [setMenuItems]);

  return (
    <div className={styles.container}>
      <PageSection
        title="Paramètres Financiers"
        description="Configuration des paramètres de gestion financière"
        className={styles.header}
      >
        {/* Contenu à venir */}
      </PageSection>
    </div>
  );
};

export default ParametresFinances;