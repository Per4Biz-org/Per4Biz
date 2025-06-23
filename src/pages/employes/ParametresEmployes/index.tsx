import React, { useEffect } from 'react';
import { useMenu } from '../../../context/MenuContext';
import { menuItemsParamGestionRH } from '../../../config/menuConfig';
import { PageSection } from '../../../components/ui/page-section';
import styles from '../styles.module.css';

const ParametresEmployes: React.FC = () => {
  const { setMenuItems } = useMenu();

  useEffect(() => {
    setMenuItems(menuItemsParamGestionRH);
  }, [setMenuItems]);

  return (
    <div className={styles.container}>
      <PageSection
        title="Paramètres Employés"
        description="Configuration des paramètres de gestion des employés"
        className={styles.header}
      >
        {/* Contenu à venir */}
      </PageSection>
    </div>
  );
};

export default ParametresEmployes;