import React, { useEffect } from 'react';
import { useMenu } from '../../../context/MenuContext';
import { menuItemsParamGestionBancaire } from '../../../config/menuConfig';
import { PageSection } from '../../../components/ui/page-section';
import styles from './styles.module.css';

const ParametresBanque: React.FC = () => {
  const { setMenuItems } = useMenu();

  useEffect(() => {
    setMenuItems(menuItemsParamGestionBancaire);
  }, [setMenuItems]);

  return (
    <div className={styles.container}>
      <PageSection
        title="Paramètres Bancaires"
        description="Configuration des paramètres de gestion bancaire"
        className={styles.header}
      >
        {/* Contenu à venir */}
      </PageSection>
    </div>
  );
};

export default ParametresBanque;