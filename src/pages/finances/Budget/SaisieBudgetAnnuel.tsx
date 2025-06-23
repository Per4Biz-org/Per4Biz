import React, { useEffect } from 'react';
import { useMenu } from '../../../context/MenuContext';
import { menuItemsGestionFinanciere } from '../../../config/menuConfig';
import { PageSection } from '../../../components/ui/page-section';
import styles from '../styles.module.css';

const SaisieBudgetAnnuel: React.FC = () => {
  const { setMenuItems } = useMenu();

  useEffect(() => {
    setMenuItems(menuItemsGestionFinanciere);
  }, [setMenuItems]);

  return (
    <div className={styles.container}>
      <PageSection
        title="Saisie Budget Annuel"
        description="Saisissez et gérez vos budgets annuels par entité et catégorie"
        className={styles.header}
      >
        {/* Contenu à venir */}
      </PageSection>
    </div>
  );
};

export default SaisieBudgetAnnuel;