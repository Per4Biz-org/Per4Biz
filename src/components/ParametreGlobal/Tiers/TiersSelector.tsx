import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useProfil } from '../../../context/ProfilContext';
import { Button } from '../../ui/button';
import { TiersSelectModal } from './TiersSelectModal';
import { Users } from 'lucide-react';

interface Tiers {
  id: string;
  code: string;
  nom: string;
  type_tiers?: {
    code: string;
    libelle: string;
  };
}

interface TiersSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function TiersSelector({
  value,
  onChange,
  disabled = false,
  label = "Sélectionner un tiers",
  className = ""
}: TiersSelectorProps) {
  const { profil } = useProfil();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTiers, setSelectedTiers] = useState<Tiers | null>(null);
  const [loading, setLoading] = useState(false);

  // Charger les informations du tiers sélectionné
  useEffect(() => {
    const fetchTiers = async () => {
      if (!value || !profil?.com_contrat_client_id) {
        setSelectedTiers(null);
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('com_tiers')
          .select(`
            id, 
            code, 
            nom,
            type_tiers:id_type_tiers (
              code,
              libelle
            )
          `)
          .eq('id', value)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .single();
          
        if (error) throw error;
        setSelectedTiers(data);
      } catch (error) {
        console.error(`Erreur lors du chargement du tiers (ID: ${value}):`, error);
        setSelectedTiers(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTiers();
  }, [value, profil?.com_contrat_client_id]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleSelectTiers = (tiers: Tiers) => {
    setSelectedTiers(tiers);
    onChange(tiers.id);
  };

  return (
    <div className={className}>
      {selectedTiers ? (
        <div className="flex items-center justify-between p-2 border-2 border-gray-300 rounded-md bg-white min-h-[42px]">
          <div className="flex items-center">
            <Users size={18} className="text-gray-500 mr-2" />
            <div>
              <div className="font-medium text-sm">{selectedTiers.code} - {selectedTiers.nom}</div>
              <div className="text-xs text-gray-500">
                {selectedTiers.type_tiers ? selectedTiers.type_tiers.libelle : ''}
              </div>
            </div>
          </div>
          <Button
            label="Changer"
            size="sm"
            color="var(--color-primary)"
            onClick={handleOpenModal}
            disabled={disabled}
          />
        </div>
      ) : (
        <Button
          label={loading ? "Chargement..." : value ? "Tiers non trouvé" : label}
          icon="Users"
          color="var(--color-primary)"
          onClick={handleOpenModal}
          disabled={disabled || loading}
          className="w-full"
        />
      )}

      <TiersSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectTiers}
        selectedTiersId={value}
      />
    </div>
  );
}