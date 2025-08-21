import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitch: React.FC = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <div className="relative group w-full">
      <button className="flex items-center w-full px-3 py-2 text-white hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition-colors justify-start">
        <Globe size={20} className="min-w-[20px]" />
        <span className="ml-3 text-base font-medium">{currentLanguage.flag} {currentLanguage.name}</span>
      </button>
      
      <div className="absolute left-0 bottom-full mb-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={`w-full text-left px-4 py-2 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg flex items-center ${
              i18n.language === language.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
            }`}
          >
            <span className="mr-3">{language.flag}</span>
            {language.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitch;