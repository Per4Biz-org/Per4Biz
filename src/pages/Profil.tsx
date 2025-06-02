import React from 'react';
import { useMenu } from '../context/MenuContext';
import { menuItemsAccueil } from '../config/menuConfig';
import { PageSection } from '../components/ui/page-section';
import { useProfil } from '../context/ProfilContext';
import { Button } from '../components/ui/button';
import { User, Mail, Calendar, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Profil: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading, error } = useProfil();

  React.useEffect(() => {
    setMenuItems(menuItemsAccueil);
  }, [setMenuItems]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <PageSection>
          <div className="flex items-center justify-center h-64">
            <p className="text-lg text-gray-600">Chargement...</p>
          </div>
        </PageSection>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <PageSection>
          <div className="flex items-center justify-center h-64">
            <p className="text-lg text-red-600">{error}</p>
          </div>
        </PageSection>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <PageSection>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Mon Profil</h1>
        <p className="text-lg text-gray-600 mb-12">
          Consultez et modifiez vos informations personnelles
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Colonne de gauche - Avatar et infos principales */}
          <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm">
            <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center mb-6">
              <User className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{profil?.prenom} {profil?.nom}</h2>
            <p className="text-gray-600 mb-6">Utilisateur</p>
            <Button
              label="Modifier le profil"
              icon="Pencil"
              color="var(--color-primary)"
              className="w-full"
            />
          </div>

          {/* Colonne de droite - Informations détaillées */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <User className="text-blue-500" />
              Informations personnelles
            </h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <User className="w-6 h-6 text-gray-400 mt-1" />
                <div>
                  <p className="text-gray-600">Nom complet</p>
                  <p className="text-lg font-medium">{profil?.prenom} {profil?.nom}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-gray-400 mt-1" />
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="text-lg font-medium">{profil?.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-gray-400 mt-1" />
                <div>
                  <p className="text-gray-600">Téléphone</p>
                  <p className="text-lg font-medium">{profil?.telephone || 'Non renseigné'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Calendar className="w-6 h-6 text-gray-400 mt-1" />
                <div>
                  <p className="text-gray-600">Membre depuis</p>
                  <p className="text-lg font-medium">
                    {profil?.created_at && format(new Date(profil.created_at), 
                      'd MMMM yyyy', 
                      { locale: fr })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageSection>
    </div>
  );
};

export default Profil;