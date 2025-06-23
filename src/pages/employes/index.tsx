import React, { useEffect } from 'react';
import { useMenu } from '../../context/MenuContext';
import { menuItemsGestionRH } from '../../config/menuConfig';
import { PageSection } from '../../components/ui/page-section';
import styles from './styles.module.css';

const Employes: React.FC = () => {
  const { setMenuItems } = useMenu();

  useEffect(() => {
    setMenuItems(menuItemsGestionRH);
  }, [setMenuItems]);

  return (
    <div className={styles.container}>
      <PageSection
        title="Gestion des Employés"
        description="Gérez vos employés, contrats et affectations"
        className={styles.header}
      >
        {/* Contenu à venir */}
      </PageSection>
    </div>
  );
};

export default Employes;