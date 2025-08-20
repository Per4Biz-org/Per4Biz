import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../../context/MenuContext';
import { menuItemsGestionFinanciere } from '../../config/menuConfig';
import { PageSection } from '../../components/ui/page-section';
import styles from './styles.module.css';

const Finances: React.FC = () => {
  const { t } = useTranslation();
  const { setMenuItems } = useMenu();

  useEffect(() => {
    setMenuItems(menuItemsGestionFinanciere);
  }, [setMenuItems]);

  return (
    <div className={styles.container}>
      <PageSection
        title={t('pages.finances.title')}
        description={t('pages.finances.subtitle')}
        className={styles.header}
      >
        {/* Contenu à venir */}
      </PageSection>
    </div>
  );
};

export default Finances;