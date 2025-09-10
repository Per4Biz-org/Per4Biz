import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../../../context/MenuContext';
import { menuItemsParamGestionRH } from '../../../config/menuConfig';
import { PageSection } from '../../../components/ui/page-section';
import { Card } from '../../../components/ui/card';
import { Briefcase, Users, FileText } from 'lucide-react';
import styles from '../styles.module.css';

const ParametresEmployes: React.FC = () => {
  const { t } = useTranslation();
  const { setMenuItems } = useMenu();

  useEffect(() => {
    setMenuItems(menuItemsParamGestionRH);
  }, [setMenuItems]);

  return (
    <div className={styles.container}>
      <PageSection
        title={t('employeeParams.title')}
        description={t('employeeParams.description')}
        className={styles.header}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">{t('employeeParams.functionTypes.title')}</h3>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              {t('employeeParams.functionTypes.description')}
            </p>
            <a 
              href="/employes/parametres-employes/type-fonction" 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {t('employeeParams.functionTypes.access')}
            </a>
          </Card>
          
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">{t('employeeParams.contractTypes.title')}</h3>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              {t('employeeParams.contractTypes.description')}
            </p>
            <a 
              href="/employes/parametres-employes/type-contrat" 
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              {t('employeeParams.contractTypes.access')}
            </a>
          </Card>
          
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-purple-100 rounded-lg mr-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold">{t('employeeParams.socialSecurityRates.title')}</h3>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              {t('employeeParams.socialSecurityRates.description')}
            </p>
            <a 
              href="/employes/parametres-employes/taux-ss" 
              className="text-purple-600 hover:text-purple-800 text-sm font-medium"
            >
              {t('employeeParams.socialSecurityRates.access')}
            </a>
          </Card>
          
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-amber-100 rounded-lg mr-4">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold">{t('employeeParams.generalParams.title')}</h3>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              {t('employeeParams.generalParams.description')}
            </p>
            <a 
              href="/employes/parametres-employes/param-generaux" 
              className="text-amber-600 hover:text-amber-800 text-sm font-medium"
            >
              {t('employeeParams.generalParams.access')}
            </a>
          </Card>
        </div>
      </PageSection>
    </div>
  );
};

export default ParametresEmployes;