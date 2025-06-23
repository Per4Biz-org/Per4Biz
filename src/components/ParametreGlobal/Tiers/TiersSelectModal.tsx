import React, { useState, useEffect } from 'react';
import { X, Search, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useProfil } from '../../../context/ProfilContext';
import { Button } from '../../ui/button';
import { FormInput } from '../../ui/form';

interface Tiers {
  id: string;
  code: string;
  nom: string;
  type_tiers?: {
    code: string;
    libelle: string;
  };
}

interface TiersSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tiers: Tiers) => void;
  selectedTiersId?: string;
}

export function TiersSelectModal({
  isOpen,
  onClose,
  onSelect,
  selectedTiersId
}: TiersSelectModalProps) {
  const { profil } = useProfil();
  const [tiers, setTiers] = useState<Tiers[]>([]);
  const [filteredTiers, setFilteredTiers] = useState<Tiers[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Chargement des tiers
  useEffect(() => {
    const fetchTiers = async () => {
      if (!profil?.com_contrat_client_id) return;
      
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
          .eq('actif', true)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .order('nom');
          
        if (error) throw error;
        setTiers(data || []);
        setFilteredTiers(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des tiers:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen) {
      fetchTiers();
    }
  }, [isOpen, profil?.com_contrat_client_id]);

  // Filtrage des tiers en fonction du terme de recherche
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTiers(tiers);
      return;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    const filtered = tiers.filter(
      t => t.code.toLowerCase().includes(searchTermLower) || 
           t.nom.toLowerCase().includes(searchTermLower)
    );
    
    setFilteredTiers(filtered);
  }, [searchTerm, tiers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSelectTiers = (tiers: Tiers) => {
    onSelect(tiers);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Sélectionner un tiers</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Barre de recherche */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <FormInput
              type="text"
              className="pl-10 pr-3 py-2"
              placeholder="Rechercher par code ou nom..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        {/* Liste des tiers */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredTiers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Aucun tiers ne correspond à votre recherche
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTiers.map((t) => (
                    <tr 
                      key={t.id} 
                      className={`hover:bg-gray-50 cursor-pointer ${t.id === selectedTiersId ? 'bg-blue-50' : ''}`}
                      onClick={() => handleSelectTiers(t)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {t.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {t.nom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {t.type_tiers ? `${t.type_tiers.code} - ${t.type_tiers.libelle}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        <Button
                          label="Sélectionner"
                          icon="Check"
                          color="var(--color-primary)"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTiers(t);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}