import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import InformationsPersonnellesTab from './tabs/InformationsPersonnellesTab';
import ContratsTab from './tabs/ContratsTab';
import AffectationsTab from './tabs/AffectationsTab';
import HistoriqueFinancierTab from './tabs/HistoriqueFinancierTab';
import CoutsMensuelsTab from './tabs/CoutsMensuelsTab';
import PiecesJointesTab from './tabs/PiecesJointesTab';

interface PersonnelTabsProps {
  personnelId: string | undefined;
  isCreationMode: boolean;
  onSavePersonnel: (personnelData: any) => Promise<string | undefined>;
  onUpdatePersonnel: (personnelId: string, personnelData: any) => Promise<void>;
  onCancel: () => void;
  personnelData: any;
  setPersonnelData: React.Dispatch<React.SetStateAction<any>>;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isSubmitting: boolean;
  addToast: (toast: any) => void;
}

const PersonnelTabs: React.FC<PersonnelTabsProps> = ({
  personnelId,
  isCreationMode,
  onSavePersonnel,
  onUpdatePersonnel,
  onCancel,
  personnelData,
  setPersonnelData,
  formErrors,
  setFormErrors,
  isSubmitting,
  addToast
}) => {
  const [activeTab, setActiveTab] = useState('informations');

  // Déterminer quels onglets sont actifs
  const isTabsEnabled = !isCreationMode || !!personnelId;

  return (
    <Tabs
      defaultValue="informations"
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full"
    >
      <TabsList className="mb-6 flex space-x-2 bg-gray-100 p-1 rounded-lg">
        <TabsTrigger value="informations" className="flex-1">
          Informations personnelles
        </TabsTrigger>
        <TabsTrigger value="contrats" className="flex-1" disabled={!isTabsEnabled}>
          Contrats
        </TabsTrigger>
        <TabsTrigger value="affectations" className="flex-1" disabled={!isTabsEnabled}>
          Affectations
        </TabsTrigger>
        <TabsTrigger value="historique-financier" className="flex-1" disabled={!isTabsEnabled}>
          Historique financier
        </TabsTrigger>
        <TabsTrigger value="couts-mensuels" className="flex-1" disabled={!isTabsEnabled}>
          Coûts mensuels
        </TabsTrigger>
        <TabsTrigger value="pieces-jointes" className="flex-1" disabled={!isTabsEnabled}>
          Pièces jointes
        </TabsTrigger>
      </TabsList>

      <TabsContent value="informations">
        <InformationsPersonnellesTab
          personnelId={personnelId}
          isCreationMode={isCreationMode}
          personnelData={personnelData}
          setPersonnelData={setPersonnelData}
          formErrors={formErrors}
          setFormErrors={setFormErrors}
          isSubmitting={isSubmitting}
          onSavePersonnel={onSavePersonnel}
          onUpdatePersonnel={onUpdatePersonnel}
          onCancel={onCancel}
        />
      </TabsContent>

      <TabsContent value="contrats">
        <ContratsTab
          personnelId={personnelId}
          addToast={addToast}
        />
      </TabsContent>

      <TabsContent value="affectations">
        <AffectationsTab
          personnelId={personnelId}
          addToast={addToast}
        />
      </TabsContent>

      <TabsContent value="historique-financier">
        <HistoriqueFinancierTab
          personnelId={personnelId}
          addToast={addToast}
        />
      </TabsContent>

      <TabsContent value="couts-mensuels">
        <CoutsMensuelsTab
          personnelId={personnelId}
          addToast={addToast}
        />
      </TabsContent>

      <TabsContent value="pieces-jointes">
        <PiecesJointesTab
          personnelId={personnelId}
          addToast={addToast}
        />
      </TabsContent>
    </Tabs>
  );
};

export default PersonnelTabs;