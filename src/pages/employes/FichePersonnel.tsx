import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMenu } from '../../context/MenuContext';
import { useProfil } from '../../context/ProfilContext';
import { menuItemsGestionRH } from '../../config/menuConfig';
import { PageSection } from '../../components/ui/page-section';
import { ToastContainer, ToastData } from '../../components/ui/toast';
import { Tabs } from '../../components/employes/FichePersonnel/Tabs';
import { OngletInfosPersonnelles } from '../../components/employes/FichePersonnel/tabs/OngletInfosPersonnelles';
import { OngletContrats } from '../../components/employes/FichePersonnel/tabs/OngletContrats';
import { OngletAffectations } from '../../components/employes/FichePersonnel/tabs/OngletAffectations';
import { OngletHistoriqueFinancier } from '../../components/employes/FichePersonnel/tabs/OngletHistoriqueFinancier';
import { OngletCoutsMensuels } from '../../components/employes/FichePersonnel/tabs/OngletCoutsMensuels';
import { OngletPiecesJointes } from '../../components/employes/FichePersonnel/tabs/OngletPiecesJointes';
import { useFichePersonnel } from '../../hooks/employes/useFichePersonnel';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';

interface FichePersonnelProps {
  mode: 'create' | 'edit';
  id?: string;
  onClose: () => void;
}

const FichePersonnel: React.FC<FichePersonnelProps> = ({ mode, id, onClose }) => {
  const { setMenuItems } = useMenu();
  const navigate = useNavigate();
  const { profil } = useProfil();
  const [activeTab, setActiveTab] = useState(0);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [personnelId, setPersonnelId] = useState<string | undefined>(id);
  
  const {
    personnel,
    loading,
    error,
    savePersonnel,
  } = useFichePersonnel(mode, personnelId);

  useEffect(() => {
    setMenuItems(menuItemsGestionRH);
  }, [setMenuItems]);

  // Mise à jour de l'ID du personnel si fourni en prop
  useEffect(() => {
    if (id) {
      setPersonnelId(id);
    }
  }, [id]);

  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const newToast: ToastData = {
      ...toast,
      id: Date.now().toString(),
    };
    setToasts(prev => [...prev, newToast]);
  };

  const closeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Déterminer quels onglets sont actifs
  const getTabsConfig = () => {
    const tabs = [
      {
        label: 'Informations personnelles',
        content: <OngletInfosPersonnelles 
                  mode={mode} 
                  personnelId={personnelId} 
                  onSave={(id) => {
                    setPersonnelId(id);
                    addToast({
                      label: mode === 'create' ? 'Personnel créé avec succès' : 'Informations mises à jour avec succès',
                      icon: 'Check',
                      color: '#22c55e'
                    });
                  }}
                  onClose={onClose}
                  addToast={addToast}
                />,
        disabled: false
      },
      {
        label: 'Contrats',
        content: <OngletContrats personnelId={personnelId} addToast={addToast} />,
        disabled: !personnelId
      },
      {
        label: 'Affectations',
        content: <OngletAffectations personnelId={personnelId} addToast={addToast} />,
        disabled: !personnelId
      },
      {
        label: 'Historique financier',
        content: <OngletHistoriqueFinancier personnelId={personnelId} addToast={addToast} />,
        disabled: !personnelId
      },
      {
        label: 'Coûts mensuels',
        content: <OngletCoutsMensuels personnelId={personnelId} />,
        disabled: !personnelId
      },
      {
        label: 'Pièces jointes',
        content: <OngletPiecesJointes personnelId={personnelId} addToast={addToast} />,
        disabled: !personnelId
      }
    ];
    
    return tabs;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageSection>
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              label=""
              icon="ArrowLeft"
              color="#6B7280"
              onClick={onClose}
              size="sm"
            />
            <h1 className="text-2xl font-bold">
              {mode === 'create' ? 'Créer un nouveau personnel' : 'Modifier un personnel'}
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Chargement...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
        ) : (
          <Tabs 
            tabs={getTabsConfig()} 
            activeTab={activeTab} 
            onChange={setActiveTab} 
          />
        )}

        <ToastContainer toasts={toasts} onClose={closeToast} />
      </PageSection>
    </div>
  );
};

export default FichePersonnel;