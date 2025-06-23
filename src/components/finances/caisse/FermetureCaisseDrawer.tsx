import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '../../../lib/supabase';
import { useProfil } from '../../../context/ProfilContext';
import { Form, FormField, FormInput, FormActions } from '../../ui/form';
import { Dropdown, DropdownOption } from '../../ui/dropdown';
import { Button } from '../../ui/button';
import { ToastData } from '../../ui/toast';
import { EncaissementCBTable } from './EncaissementCBTable';
import { FactureDepenseTable } from './FactureDepenseTable';
import { EncaissementCBFormModal } from './EncaissementCBFormModal';
import { FactureDepenseSelectionModal } from './FactureDepenseSelectionModal';
import { Calculator, X } from 'lucide-react';
import { useFermetureCaisseForm } from './hooks/useFermetureCaisseForm';
import { FermetureCaisseInfosGenerales } from './FermetureCaisseInfosGenerales';
import { FermetureCaisseResume } from './FermetureCaisseResume';

// Types
export interface EncaissementCB {
  id?: number;
  fin_ferm_caisse_id?: number;
  periode: string;
  montant_brut: number;
  montant_reel: number;
  commentaire?: string;
}

export interface FactureDepense {
  id?: number;
  fin_ferm_caisse_id?: number;
  fin_facture_achat_id: string;
  montant_ttc: number;
  commentaire?: string;
  facture?: {
    num_document: string;
    date_facture: string;
    tiers: {
      nom: string;
    };
  };
}

export interface FermetureCaisse {
  id?: number;
  id_entite: string;
  date_fermeture: string;
  ca_ht: number | null;
  ca_ttc: number | null;
  fond_caisse_espece_debut: number | null;
  fond_caisse_espece_fin: number | null;
  depot_banque_theorique: number | null;
  depot_banque_reel: number | null;
  total_cb_brut: number | null;
  total_cb_reel: number | null;
  total_facture_depenses_ttc: number | null;
  est_valide: boolean;
  commentaire?: string;
}

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

interface FermetureCaisseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  fermetureToEdit?: FermetureCaisse | null;
  selectedEntityId?: string;
  onSuccess: () => void; 
  addToast: (toast: Omit<ToastData, 'id'>) => void;
}

/**
 * Composant principal pour la création/modification d'une fermeture de caisse
 */
export function FermetureCaisseDrawer({
  isOpen,
  onClose,
  fermetureToEdit,
  selectedEntityId,
  onSuccess,
  addToast
}: FermetureCaisseDrawerProps) {
  const { profil } = useProfil();
  
  const {
    fermeture,
    encaissementsCB,
    facturesDepense,
    formErrors,
    entites,
    isSubmitting,
    gardeEnCaisse,
    handleInputChange,
    handleEntiteChange,
    handleAddEncaissement,
    handleEditEncaissement,
    handleDeleteEncaissement,
    handleSaveEncaissement,
    handleAddFacture,
    handleDeleteFacture,
    handleSaveFactures,
    handleSubmit
  } = useFermetureCaisseForm({
    isOpen,
    fermetureToEdit,
    onSuccess,
    onClose,
    addToast,
    profil,
    selectedEntityId
  });
  
  const [isEncaissementModalOpen, setIsEncaissementModalOpen] = useState(false);
  const [isFactureModalOpen, setIsFactureModalOpen] = useState(false);
  const [selectedEncaissement, setSelectedEncaissement] = useState<EncaissementCB | null>(null);
  
  // Gestionnaires pour les modales
  const openEncaissementModal = () => {
    setSelectedEncaissement(null);
    setIsEncaissementModalOpen(true);
  };
  
  const openEncaissementModalForEdit = (encaissement: EncaissementCB) => {
    setSelectedEncaissement(encaissement);
    setIsEncaissementModalOpen(true);
  };
  
  const openFactureModal = () => {
    setIsFactureModalOpen(true);
  };
  
  // Rendu conditionnel
  if (!isOpen) return null;
  
  // Rendu du composant
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {fermeture.id ? 'Modifier la fermeture de caisse' : 'Nouvelle fermeture de caisse'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6">
          <Form size={100} columns={2}>
            {/* Section 1: Informations générales - Extrait dans un composant séparé */}
            <FermetureCaisseInfosGenerales
              fermeture={fermeture}
              entites={entites}
              formErrors={formErrors}
              isSubmitting={isSubmitting}
              handleInputChange={handleInputChange} 
              handleEntiteChange={selectedEntityId ? undefined : handleEntiteChange}
            />
            
            <div className="col-span-2">
              <hr className="my-4" />
            </div>
            
            {/* Section 2: Encaissements CB */}
            <div className="col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Encaissements CB</h3>
                <Button
                  label="Ajouter un encaissement"
                  icon="Plus"
                  color="var(--color-primary)"
                  onClick={openEncaissementModal}
                  disabled={isSubmitting || fermeture.est_valide}
                  size="sm"
                />
              </div>
              
              <EncaissementCBTable
                encaissements={encaissementsCB}
                onEdit={openEncaissementModalForEdit}
                onDelete={handleDeleteEncaissement}
                disabled={isSubmitting || fermeture.est_valide}
              />
              
              <div className="flex justify-end mt-2 text-sm">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div className="text-right font-medium">Total brut:</div>
                  <div className="text-right">{fermeture.total_cb_brut?.toFixed(2) || '0.00'} €</div>
                  <div className="text-right font-medium">Total réel:</div>
                  <div className="text-right">{fermeture.total_cb_reel?.toFixed(2) || '0.00'} €</div>
                </div>
              </div>
            </div>
            
            <div className="col-span-2">
              <hr className="my-4" />
            </div>
            
            {/* Section 3: Factures de dépense */}
            <div className="col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Factures de dépense</h3>
                <Button
                  label="Ajouter une facture"
                  icon="Plus"
                  color="var(--color-primary)"
                  onClick={openFactureModal}
                  disabled={isSubmitting || fermeture.est_valide || !fermeture.id_entite}
                  size="sm"
                />
              </div>
              
              <FactureDepenseTable
                factures={facturesDepense}
                onDelete={handleDeleteFacture}
                disabled={isSubmitting || fermeture.est_valide}
              />
              
              <div className="flex justify-end mt-2 text-sm">
                <div className="grid grid-cols-2 gap-x-4">
                  <div className="text-right font-medium">Total factures:</div>
                  <div className="text-right">{fermeture.total_facture_depenses_ttc?.toFixed(2) || '0.00'} €</div>
                </div>
              </div>
            </div>
            
            <div className="col-span-2">
              <hr className="my-4" />
            </div>
            
            {/* Section 4: Résumé calculé */}
            <FermetureCaisseResume
              fermeture={fermeture}
              gardeEnCaisse={gardeEnCaisse}
              formErrors={formErrors}
              isSubmitting={isSubmitting}
              handleInputChange={handleInputChange}
            />
            
            {/* Section 5: Boutons de bas de page */}
            <FormActions>
              <Button
                label="Annuler"
                color="#6B7280"
                onClick={onClose}
                type="button"
                disabled={isSubmitting}
              />
              
              <div className="flex gap-2">
                <Button
                  label="Enregistrer"
                  icon="Save"
                  color="var(--color-primary)"
                  onClick={() => handleSubmit(false)}
                  type="button"
                  disabled={isSubmitting || fermeture.est_valide}
                />
                
                <Button
                  label="Valider"
                  icon="CheckSquare"
                  color="#22c55e"
                  onClick={() => handleSubmit(true)}
                  type="button"
                  disabled={isSubmitting || fermeture.est_valide}
                />
              </div>
            </FormActions>
          </Form>
        </div>
      </div>
      
      {/* Modales */}
      <EncaissementCBFormModal
        isOpen={isEncaissementModalOpen}
        onClose={() => setIsEncaissementModalOpen(false)}
        onSave={(encaissement) => {
          handleSaveEncaissement(encaissement, selectedEncaissement);
          setIsEncaissementModalOpen(false);
        }}
        initialData={selectedEncaissement}
      />
      
      <FactureDepenseSelectionModal
        isOpen={isFactureModalOpen}
        onClose={() => setIsFactureModalOpen(false)}
        onSave={(factures) => { 
          handleSaveFactures(factures);
          setIsFactureModalOpen(false);
        }}
        entiteId={fermeture.id_entite}
        addToast={addToast}
        fermetureCaisseId={fermeture.id}
      />
    </div>
  );
}