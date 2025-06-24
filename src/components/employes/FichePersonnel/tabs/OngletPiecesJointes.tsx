import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../../../../lib/supabase';
import { useProfil } from '../../../../context/ProfilContext';
import { Button } from '../../../../components/ui/button';
import { DataTable, Column } from '../../../../components/ui/data-table';
import { ToastData } from '../../../../components/ui/toast';
import { Upload, FileText, X, Download, ExternalLink } from 'lucide-react';

interface PieceJointe {
  id: string;
  id_personnel: string;
  nom_fichier: string;
  chemin_fichier: string;
  type_fichier: string;
  taille_fichier: number;
  created_at: string;
  created_by: string;
}

interface OngletPiecesJointesProps {
  personnelId?: string;
  addToast: (toast: Omit<ToastData, 'id'>) => void;
}

export const OngletPiecesJointes: React.FC<OngletPiecesJointesProps> = ({ 
  personnelId, 
  addToast 
}) => {
  const { profil } = useProfil();
  const [piecesJointes, setPiecesJointes] = useState<PieceJointe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // Charger les pièces jointes du personnel
  useEffect(() => {
    const fetchPiecesJointes = async () => {
      if (!personnelId || !profil?.com_contrat_client_id) {
        setPiecesJointes([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('rh_piece_jointe')
          .select('*')
          .eq('id_personnel', personnelId)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPiecesJointes(data || []);
        
        // Générer des URL signées pour chaque pièce jointe
        if (data && data.length > 0) {
          const urls: Record<string, string> = {};
          for (const piece of data) {
            const { data: urlData } = await supabase.storage
              .from('personnel-documents')
              .createSignedUrl(piece.chemin_fichier, 60);
            
            if (urlData) {
              urls[piece.id] = urlData.signedUrl;
            }
          }
          setSignedUrls(urls);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des pièces jointes:', error);
        addToast({
          label: 'Erreur lors du chargement des pièces jointes',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPiecesJointes();
  }, [personnelId, profil?.com_contrat_client_id, addToast]);

  // Gérer l'upload de fichiers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !personnelId || !profil?.com_contrat_client_id) return;

    setIsUploading(true);
    try {
      const uploadedFiles: PieceJointe[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Créer un nom de fichier unique
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${i}.${fileExt}`;
        const filePath = `${profil.com_contrat_client_id}/${personnelId}/${fileName}`;

        // Uploader le fichier
        const { error: uploadError } = await supabase.storage
          .from('personnel-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Enregistrer les métadonnées du fichier
        const { data, error } = await supabase
          .from('rh_piece_jointe')
          .insert({
            id_personnel: personnelId,
            nom_fichier: file.name,
            chemin_fichier: filePath,
            type_fichier: file.type,
            taille_fichier: file.size,
            com_contrat_client_id: profil.com_contrat_client_id
          })
          .select()
          .single();

        if (error) throw error;
        
        // Générer une URL signée pour le fichier
        const { data: urlData } = await supabase.storage
          .from('personnel-documents')
          .createSignedUrl(filePath, 60);
        
        if (urlData) {
          setSignedUrls(prev => ({
            ...prev,
            [data.id]: urlData.signedUrl
          }));
        }

        uploadedFiles.push(data);
      }

      // Mettre à jour la liste des pièces jointes
      setPiecesJointes(prev => [...uploadedFiles, ...prev]);
      
      addToast({
        label: `${files.length} fichier(s) téléversé(s) avec succès`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors du téléversement des fichiers:', error);
      addToast({
        label: 'Erreur lors du téléversement des fichiers',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsUploading(false);
      // Réinitialiser l'input file
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  // Supprimer une pièce jointe
  const handleDeletePieceJointe = async (pieceJointe: PieceJointe) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le fichier "${pieceJointe.nom_fichier}" ?`)) return;

    try {
      // Supprimer le fichier du stockage
      const { error: storageError } = await supabase.storage
        .from('personnel-documents')
        .remove([pieceJointe.chemin_fichier]);

      if (storageError) throw storageError;

      // Supprimer l'enregistrement de la base de données
      const { error: dbError } = await supabase
        .from('rh_piece_jointe')
        .delete()
        .eq('id', pieceJointe.id);

      if (dbError) throw dbError;

      // Mettre à jour la liste des pièces jointes
      setPiecesJointes(prev => prev.filter(p => p.id !== pieceJointe.id));
      
      // Supprimer l'URL signée
      setSignedUrls(prev => {
        const newUrls = { ...prev };
        delete newUrls[pieceJointe.id];
        return newUrls;
      });
      
      addToast({
        label: 'Fichier supprimé avec succès',
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      addToast({
        label: 'Erreur lors de la suppression du fichier',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Colonnes pour le tableau des pièces jointes
  const columns: Column<PieceJointe>[] = [
    {
      label: 'Nom du fichier',
      accessor: 'nom_fichier',
      render: (value, row) => (
        <div className="flex items-center">
          <FileText size={16} className="mr-2 text-blue-500" />
          <span>{value}</span>
        </div>
      )
    },
    {
      label: 'Type',
      accessor: 'type_fichier',
      render: (value) => value.split('/')[1]?.toUpperCase() || value
    },
    {
      label: 'Taille',
      accessor: 'taille_fichier',
      render: (value) => formatFileSize(value)
    },
    {
      label: 'Date d\'ajout',
      accessor: 'created_at',
      render: (value) => format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: fr })
    },
    {
      label: 'Actions',
      accessor: 'id',
      render: (_, row) => (
        <div className="flex gap-2">
          {signedUrls[row.id] && (
            <a
              href={signedUrls[row.id]}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100"
              title="Ouvrir le fichier"
            >
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      )
    }
  ];

  // Actions pour le tableau
  const actions = [
    {
      label: 'Supprimer',
      icon: 'delete',
      color: '#ef4444',
      onClick: handleDeletePieceJointe
    }
  ];

  if (!personnelId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        Veuillez d'abord enregistrer les informations personnelles.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Pièces jointes</h2>
        <div>
          <input
            type="file"
            id="file-upload"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <Button
            label={isUploading ? 'Téléversement en cours...' : 'Ajouter des fichiers'}
            icon="Upload"
            color="var(--color-primary)"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={isUploading}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Chargement des pièces jointes...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={piecesJointes}
          actions={actions}
          emptyTitle="Aucune pièce jointe"
          emptyMessage="Aucune pièce jointe n'a été ajoutée pour ce personnel."
        />
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
        <h3 className="font-medium mb-2">Informations sur les pièces jointes</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Formats acceptés : PDF, images (JPG, PNG), documents Office (DOCX, XLSX)</li>
          <li>Taille maximale par fichier : 10 MB</li>
          <li>Les fichiers sont stockés de manière sécurisée et ne sont accessibles qu'aux utilisateurs autorisés</li>
        </ul>
      </div>
    </div>
  );
};