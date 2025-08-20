import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../../context/MenuContext';
import { menuItemsGestionRH } from '../../config/menuConfig';
import { PageSection } from '../../components/ui/page-section';
import styles from './styles.module.css';

const Employes: React.FC = () => {
  const { t } = useTranslation();
  const { setMenuItems } = useMenu();

  useEffect(() => {
    setMenuItems(menuItemsGestionRH);
  }, [setMenuItems]);

  return (
    <div className={styles.container}>
      <PageSection
        title={t('pages.employees.title')}
        description={t('pages.employees.subtitle')}
        className={styles.header}
      >
        {/* Contenu à venir */}
      </PageSection>
    </div>
  );
};

export default Employes;