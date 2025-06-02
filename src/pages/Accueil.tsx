import React, { useEffect } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { useMenu } from '../context/MenuContext';
import { menuItemsAccueil } from '../config/menuConfig';

const Accueil: React.FC = () => {
  const { setMenuItems } = useMenu();

  useEffect(() => {
    setMenuItems(menuItemsAccueil);
  }, [setMenuItems]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex justify-center mb-8">
          <UtensilsCrossed className="h-12 w-12 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Bienvenue sur notre application de gestion de restauration !
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          Simplifiez la gestion de votre établissement avec notre solution complète.
          Gérez vos commandes, votre inventaire et votre personnel en toute simplicité.
        </p>
      </div>
    </div>
  );
};

export default Accueil;