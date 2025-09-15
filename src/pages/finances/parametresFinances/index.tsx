import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../../../context/MenuContext';
import { menuItemsParamGestionFinanciere } from '../../../config/menuConfig';
import { PageSection } from '../../../components/ui/page-section';
import styles from './styles.module.css';

const ParametresFinances: React.FC = () => {
  const { t } = useTranslation();
  const { setMenuItems } = useMenu();

  useEffect(() => {
    setMenuItems(menuItemsParamGestionFinanciere);
  }, [setMenuItems]);

  return (
    <div className={styles.container}>
      <PageSection
        title={t('financial.parametersTitle', 'Paramètres Financiers')}
        description={t('financial.parametersDescription', 'Configuration des paramètres de gestion financière')}
        className={styles.header}
      >
        {/* {t('common.contentComing', 'Contenu à venir')} */}
      </PageSection>
    </div>
  );
};

export default ParametresFinances;