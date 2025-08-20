import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../context/MenuContext';
import { useProfil } from '../context/ProfilContext';
import { menuItemsAccueil } from '../config/menuConfig';
import { BarChart as ChartBar, Wallet, Users, Calendar } from 'lucide-react';

const Accueil: React.FC = () => {
  const { t } = useTranslation();
  const { setMenuItems } = useMenu();
  const { profil, loading } = useProfil();

  useEffect(() => {
    setMenuItems(menuItemsAccueil);
  }, [setMenuItems]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
          {loading ? t('home.welcome') : t('home.welcomeUser', { name: profil?.prenom || '' })}
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed text-center mb-12">
          {t('home.subtitle')}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <ChartBar className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">{t('home.financial.title')}</h2>
            </div>
            <p className="text-gray-600">
              {t('home.financial.description')}
            </p>
            <div className="mt-4">
              <a href="/finances" className="text-blue-600 hover:text-blue-800 font-medium">
                {t('home.financial.link')}
              </a>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <Wallet className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">{t('home.banking.title')}</h2>
            </div>
            <p className="text-gray-600">
              {t('home.banking.description')}
            </p>
            <div className="mt-4">
              <a href="/banques" className="text-green-600 hover:text-green-800 font-medium">
                {t('home.banking.link')}
              </a>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-purple-100 rounded-lg mr-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">{t('home.hr.title')}</h2>
            </div>
            <p className="text-gray-600">
              {t('home.hr.description')}
            </p>
            <div className="mt-4">
              <a href="/employes" className="text-purple-600 hover:text-purple-800 font-medium">
                {t('home.hr.link')}
              </a>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-amber-100 rounded-lg mr-4">
                <Calendar className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">{t('home.settings.title')}</h2>
            </div>
            <p className="text-gray-600">
              {t('home.settings.description')}
            </p>
            <div className="mt-4">
              <a href="/parametres-global" className="text-amber-600 hover:text-amber-800 font-medium">
                {t('home.settings.link')}
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-12 bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">{t('home.help.title')}</h3>
          <p className="text-blue-700">
            {t('home.help.description')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Accueil;