import React, { useState, useEffect } from 'react';
import { useProfil } from '../../../context/ProfilContext';
import { supabase } from '../../../lib/supabase';
import { Form, FormField, FormInput, FormActions } from '../../ui/form';
import { Dropdown, DropdownOption } from '../../ui/dropdown'; 
import { Button } from '../../ui/button';
import { useNavigate } from 'react-router-dom'; 
import { TiersSelector } from '../../ParametreGlobal/Tiers/TiersSelector';
import { FactureFileUpload } from './FactureFileUpload';

interface Tiers {
  id: string;
  code: string;
  nom: string;
}

interface ModePaiement {
  id: string;
  code: string;
  libelle: string;
}

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

interface FactureAchatFormProps {
  facture: {
    id?: string;
    id_entite: string;
    id_tiers: string;
    date_facture: string;
    num_document: string | null;
    id_mode_paiement: string;
    montant_ht: number;
    montant_tva: number | null;
    montant_ttc: number;
    id_type_facture?: string;
    commentaire?: string | null;
  };
  onSave: (facture: any) => void;
  entites: Entite[];
  isSaving?: boolean;
  entiteId?: string;
  exploitationTypeFacture?: {id: string, libelle: string} | null;
  currentFile?: string | null;
  contratClientId: string;
  onUploadSuccess: (filePath: string) => void;
  onUploadError: (error: string) => void;
  onFormChange?: (updatedFacture: any) => void;
}

export function FactureAchatForm({
  facture,
  onSave,
  entites,
  exploitationTypeFacture,
  isSaving = false,
  currentFile,
  contratClientId,
  onUploadSuccess,
  onUploadError,
  entiteId,
  onFormChange
}: FactureAchatFormProps) {
  const { profil } = useProfil();
  const navigate = useNavigate();
  const [tiers, setTiers] = useState<Tiers[]>([]);
  const [modesPaiement, setModesPaiement] = useState<ModePaiement[]>([]);
  const [selectedModePaiement, setSelectedModePaiement] = useState<string>(facture.id_mode_paiement || '');
  const [selectedEntite, setSelectedEntite] = useState<string>(facture.id_entite || '');
  const [selectedTiers, setSelectedTiers] = useState<string>(facture.id_tiers || '');
  const [montantHT, setMontantHT] = useState<string>(facture.montant_ht?.toString() || '');
  const [montantTVA, setMontantTVA] = useState<string>(facture.montant_tva?.toString() || '');
  const [montantTTC, setMontantTTC] = useState<string>(facture.montant_ttc?.toString() || '');
  const [typeFactureLibelle, setTypeFactureLibelle] = useState<string>(exploitationTypeFacture?.libelle || 'Facture d\'exploitation');
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Chargement des tiers et modes de paiement
  useEffect(() => {
    const fetchData = async () => {
      if (!profil?.com_contrat_client_id) return;

      setLoading(true);
      try {
        // Récupérer les tiers
        const { data: tiersData, error: tiersError } = await supabase
          .from('com_tiers')
          .select('id, code, nom')
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('actif', true)
          .order('nom');

        if (tiersError) throw tiersError;
        setTiers(tiersData || []);

        // Récupérer les modes de paiement
        const { data: modesData, error: modesError } = await supabase
          .from('bq_param_mode_paiement')
          .select('id, code, libelle')
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('actif', true)
          .order('libelle');

        if (modesError) throw modesError;
        setModesPaiement(modesData || []);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profil?.com_contrat_client_id]);

  // Mise à jour du formulaire si les props changent
  useEffect(() => {
    // Mettre à jour les valeurs sélectionnées
    setSelectedModePaiement(facture.id_mode_paiement || selectedModePaiement);
    setSelectedEntite(facture.id_entite || selectedEntite);
    setSelectedTiers(facture.id_tiers || selectedTiers);
    setMontantHT(facture.montant_ht?.toString() || '');
    setMontantTVA(facture.montant_tva?.toString() || '');
    setMontantTTC(facture.montant_ttc?.toString() || '');
    
    // Mettre à jour le libellé du type de facture
    if (exploitationTypeFacture) {
      setTypeFactureLibelle(exploitationTypeFacture.libelle);
    }

    console.log("Formulaire mis à jour depuis les props:", {
      id_mode_paiement: facture.id_mode_paiement,
      id_entite: facture.id_entite,
      id_tiers: facture.id_tiers
    });
  }, [facture]);

  // Initialisation de l'entité si entiteId est fourni
  useEffect(() => {
    if (entiteId && !facture.id_entite) {
      console.log("Initialisation de l'entité avec entiteId fourni:", entiteId);
      setSelectedEntite(entiteId); 
      if (onFormChange) {
        onFormChange({ ...facture, id_entite: entiteId });
      }
    }
  }, [entiteId, facture.id_entite]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let updatedFacture = { ...facture };

    // Gestion spéciale pour les champs de montants
    if (name === 'montant_ht') {
      setMontantHT(value);
      // Recalculer le TTC si la TVA est déjà définie
      const tva = parseFloat(montantTVA) || 0;
      const ht = parseFloat(value) || 0;
      setMontantTTC((ht + tva).toString());
      updatedFacture = {
        ...updatedFacture,
        [name]: value,
        montant_ht: ht,
        montant_ttc: ht + tva
      };
    } else if (name === 'montant_tva') {
      setMontantTVA(value);
      // Recalculer le TTC
      const ht = parseFloat(montantHT) || 0;
      const tva = parseFloat(value) || 0;
      setMontantTTC((ht + tva).toString());
      updatedFacture = {
        ...updatedFacture,
        [name]: value,
        montant_tva: tva,
        montant_ttc: ht + tva
      };
    } else if (name === 'montant_ttc') {
      setMontantTTC(value);
      updatedFacture = {
        ...updatedFacture,
        [name]: value,
        montant_ttc: parseFloat(value) || 0
      };
    } else {
      updatedFacture = { ...updatedFacture, [name]: value };
    }
    
    // Notifier le parent des changements
    if (onFormChange) {
      onFormChange(updatedFacture);
    }
    
    // Effacer l'erreur quand l'utilisateur modifie un champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDropdownChange = (name: string) => (value: string) => {
    console.log(`Changement de ${name}:`, value);

    // Conserver les valeurs sélectionnées séparément pour éviter leur réinitialisation
    switch (name) {
      case 'id_mode_paiement':
        setSelectedModePaiement(value);
        break;
      case 'id_entite':
        setSelectedEntite(value);
        break;
      case 'id_tiers':
        setSelectedTiers(value);
        break;
      default:
        break;
    }

    // Mettre à jour l'état du formulaire après avoir mis à jour les valeurs sélectionnées
    const updatedFacture = { ...facture, [name]: value };
    
    // Notifier le parent des changements
    if (onFormChange) {
      onFormChange(updatedFacture);
    }
    
    // Effacer l'erreur quand l'utilisateur modifie un champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!facture.id_entite) { 
      newErrors.id_entite = "L'entité est requise";
    }
    
    if (!facture.id_tiers) {
      newErrors.id_tiers = "Le tiers est requis";
    }
    
    if (!facture.date_facture) {
      newErrors.date_facture = "La date de facture est requise";
    }
    
    const currentMontantHT = parseFloat(montantHT) || 0;
    if (currentMontantHT <= 0) {
      newErrors.montant_ht = "Le montant HT doit être supérieur à 0";
    }
    
    const currentMontantTVA = parseFloat(montantTVA);
    if (isNaN(currentMontantTVA)) { 
      newErrors.montant_tva = "Le montant TVA est requis";
    }
    
    const currentMontantTTC = parseFloat(montantTTC) || 0;
    if (currentMontantTTC <= 0) {
      newErrors.montant_ttc = "Le montant TTC doit être supérieur à 0";
    }

    if (!selectedModePaiement) {
      newErrors.id_mode_paiement = "Le mode de paiement est requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    // Utiliser les valeurs conservées
    const dataToSave = {
      ...facture,
      id_type_facture: exploitationTypeFacture?.id || facture.id_type_facture,
      montant_ht: parseFloat(montantHT) || 0,
      montant_tva: parseFloat(montantTVA) || 0,
      montant_ttc: parseFloat(montantTTC) || 0,
      id_entite: selectedEntite,
      id_mode_paiement: selectedModePaiement,
      id_tiers: selectedTiers
    };
    
    onSave(dataToSave);
  };

  const handleCancel = () => {
    navigate('/finances/mes-factures');
  };

  // Options pour les dropdowns
  const entiteOptions: DropdownOption[] = entites.map(entite => ({
    value: entite.id,
    label: `${entite.code} - ${entite.libelle}`
  }));

  const tiersOptions: DropdownOption[] = tiers.map(tier => ({
    value: tier.id,
    label: `${tier.code} - ${tier.nom}`
  }));

  const modePaiementOptions: DropdownOption[] = modesPaiement.map(mode => ({
    value: mode.id,
    label: `${mode.code} - ${mode.libelle}`
  }));

  return (
    <Form size={100} columns={3} onSubmit={handleSubmit} className="text-sm">
      {/* Première ligne: Entité, Tiers, Mode de paiement */}
      <FormField
        label="Entité"
        required
        description={entiteId ? "Entité verrouillée selon la sélection précédente" : ""}
        error={errors.id_entite}
      >
        {entiteId ? (
          <div className="flex items-center p-2 border-2 border-gray-300 bg-gray-100 rounded-md">
            <span className="text-gray-700">
              {entiteOptions.find(opt => opt.value === selectedEntite)?.label || 'Entité sélectionnée'}
            </span>
            <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
              Verrouillé
            </span>
          </div>
        ) : (
          <Dropdown
            options={entiteOptions}
            value={selectedEntite}
            onChange={handleDropdownChange('id_entite')} 
            label="Sélectionner une entité"
            disabled={loading || isSaving}
          />
        )}
      </FormField>

      <FormField
        label="Tiers"
        required
        error={errors.id_tiers}
      >
        <TiersSelector
          value={selectedTiers}
          onChange={handleDropdownChange('id_tiers')}
          disabled={loading || isSaving}
        />
      </FormField>
      
      <FormField
        label="Mode de paiement"
        required
        error={errors.id_mode_paiement} 
      >
        <Dropdown
          options={modePaiementOptions}
          value={selectedModePaiement}
          onChange={handleDropdownChange('id_mode_paiement')}
          label="Sélectionner un mode de paiement"
          disabled={isSaving}
        />
      </FormField>
      
      {/* Deuxième ligne: Date de facture, N° Document, Commentaire */}
      <FormField
        label="Date de facture"
        required
        error={errors.date_facture}
      >
        <FormInput
          type="date"
          name="date_facture"
          value={facture.date_facture}
          onChange={handleInputChange}
          disabled={isSaving}
        />
      </FormField>

      <FormField
        label="N° Document"
        error={errors.num_document}
      >
        <FormInput
          name="num_document"
          value={facture.num_document || ''}
          onChange={handleInputChange}
          placeholder="Numéro de facture (optionnel)"
          disabled={isSaving}
        />
      </FormField>
      
      <FormField
        label="Commentaire" 
        className=""
      >
        <textarea
          name="commentaire"
          value={facture.commentaire || ''}
          onChange={handleInputChange}
          className="w-full p-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
          rows={2}
          placeholder="Commentaire optionnel"
          disabled={isSaving}
        />
      </FormField>
      
      <FormField
        label="Montant HT"
        required
        error={errors.montant_ht}
      >
        <FormInput
          type="number"
          name="montant_ht"
          value={montantHT}
          onChange={handleInputChange}
          step="0.01"
          min="0"
          placeholder="Montant HT"
          disabled={isSaving}
        />
      </FormField>
      
      <FormField
        label="Montant TVA"
        required
        error={errors.montant_tva}
      >
        <FormInput
          type="number"
          name="montant_tva"
          value={montantTVA}
          onChange={handleInputChange}
          step="0.01"
          min="0"
          placeholder="Montant TVA"
          disabled={isSaving}
        />
      </FormField>
      
      <FormField
        label="Montant TTC"
        required
        error={errors.montant_ttc}
      >
        <FormInput
          type="number"
          name="montant_ttc"
          value={montantTTC}
          onChange={handleInputChange}
          step="0.01"
          min="0"
          placeholder="Montant TTC"
          disabled={isSaving}
        />
      </FormField>

      {/* Quatrième ligne: Type de facture et Pièce jointe */}
      <FormField
        label="Type de facture"
        className="col-span-1"
      >
        <div className="flex items-center p-2 border-2 border-gray-300 bg-gray-100 rounded-md">
          <span className="text-gray-700">{typeFactureLibelle}</span>
          <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
            Exploitation
          </span>
        </div>
      </FormField>
      
      <FormField
        label="Pièce jointe"
        className="col-span-2"
      >
        <FactureFileUpload
          factureId={facture.id}
          contratClientId={contratClientId}
          onUploadSuccess={onUploadSuccess}
          onUploadError={onUploadError}
          disabled={isSaving}
          currentFile={currentFile}
        />
      </FormField>
    </Form>
  );
}