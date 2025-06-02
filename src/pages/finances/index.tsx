import React, { useEffect } from 'react';
import { useMenu } from '../../context/MenuContext';
import { menuItemsGestionFinanciere } from '../../config/menuConfig';
import { PageSection } from '../../components/ui/page-section';
import styles from './styles.module.css';

const Finances: React.FC = () => {
  const { setMenuItems } = useMenu();

  useEffect(() => {
    setMenuItems(menuItemsGestionFinanciere);
  }, [setMenuItems]);

  return (
    <div className={styles.container}>
      <PageSection
        title="Gestion Financière"
        description="Gérez vos finances, factures et suivez votre chiffre d'affaires"
        className={styles.header}
      >
        {/* Contenu à venir */}
      </PageSection>
    </div>
  );
};

export default Finances;