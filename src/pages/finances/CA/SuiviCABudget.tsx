import React, { useEffect } from 'react';
import { useMenu } from '../../../context/MenuContext';
import { menuItemsGestionFinanciere } from '../../../config/menuConfig';
import { PageSection } from '../../../components/ui/page-section';
import styles from '../styles.module.css';

const SuiviCABudget: React.FC = () => {
  const { setMenuItems } = useMenu();

  useEffect(() => {
    setMenuItems(menuItemsGestionFinanciere);
  }, [setMenuItems]);

  return (
    <div className={styles.container}>
      <PageSection
        title="Suivi CA Budget"
        description="Suivez et analysez vos budgets de chiffre d'affaires par entité et période"
        className={styles.header}
      >
        {/* Contenu à venir */}
      </PageSection>
    </div>
  );
};

export default SuiviCABudget;