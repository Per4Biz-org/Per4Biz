import React, { useEffect } from 'react';
import { useMenu } from '../../../context/MenuContext';
import { menuItemsParametreGlobalImport } from '../../../config/menuConfig';
import { PageSection } from '../../../components/ui/page-section';
import styles from '../styles.module.css';

const Import: React.FC = () => {
  const { setMenuItems } = useMenu();

  useEffect(() => {
    setMenuItems(menuItemsParametreGlobalImport);
  }, [setMenuItems]);

  return (
    <div className={styles.container}>
      <PageSection
        title="Import de Données"
        description="Importez vos données depuis des fichiers externes"
        className={styles.header}
      >
        {/* Contenu à venir */}
      </PageSection>
    </div>
  );
};

export default Import;