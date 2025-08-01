import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../../context/MenuContext';
import { menuItemsGestionBancaire } from '../../config/menuConfig';
import { PageSection } from '../../components/ui/page-section';
import styles from './styles.module.css';

const Banques: React.FC = () => {
  const { t } = useTranslation();
  const { setMenuItems } = useMenu();

  useEffect(() => {
    setMenuItems(menuItemsGestionBancaire);
  }, [setMenuItems]);

  return (
    <div className={styles.container}>
      <PageSection
        title={t('pages.banking.title')}
        description={t('pages.banking.subtitle')}
        className={styles.header}
      >
        {/* Contenu à venir */}
      </PageSection>
    </div>
  );
};

export default Banques;