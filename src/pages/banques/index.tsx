import React, { useEffect } from 'react';
import { useMenu } from '../../context/MenuContext';
import { menuItemsGestionBancaire } from '../../config/menuConfig';
import { PageSection } from '../../components/ui/page-section';
import styles from './styles.module.css';

const Banques: React.FC = () => {
  const { setMenuItems } = useMenu();

  useEffect(() => {
    setMenuItems(menuItemsGestionBancaire);
  }, [setMenuItems]);

  return (
    <div className={styles.container}>
      <PageSection
        title="Gestion Bancaire"
        description="Gérez vos comptes bancaires et suivez vos mouvements"
        className={styles.header}
      >
        {/* Contenu à venir */}
      </PageSection>
    </div>
  );
};

export default Banques;