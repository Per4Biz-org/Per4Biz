import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useProfil } from '../../../../context/ProfilContext';
import { Button } from '../../../ui/button';
import { FileText, Download, Trash2, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PieceJointe {
  id: string;
  nom_fichier: string;
  chemin_fichier: string;
  type_fichier: string;
  taille_fichier: number;
  created_at: string;
  created_by: string;
}

interface PiecesJointesTabProps {
  personnelId: string | undefined;
  addToast: (toast: any) => void;
}

const PiecesJointesTab: React.FC<PiecesJointesTabProps> = ({ personnelId, addToast }) => {
  const { profil } = useProfil();
  const [piecesJointes, setPiecesJointes] = useState<PieceJointe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Chargement des pièces jointes
  useEffect(() => {
    const fetchPiecesJointes = async () => {
      if (!personnelId || !profil?.com_contrat_client_id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('rh_piece_jointe')
          .select('*')
          .eq('id_personnel', personnelId)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPiecesJointes(data || []);
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

    // Vérifier si la table rh_piece_jointe existe
    const checkTableExists = async () => {
      try {
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', 'rh_piece_jointe')
          .single();

        if (error || !data) {
          // La table n'existe pas, créer la table
          await createPieceJointeTable();
        } else {
          // La table existe, charger les pièces jointes
          fetchPiecesJointes();
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de la table:', error);
        addToast({
          label: 'Erreur lors de la vérification de la table des pièces jointes',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
        setLoading(false);
      }
    };

    checkTableExists();
  }, [personnelId, profil?.com_contrat_client_id, addToast]);

  // Création de la table rh_piece_jointe si elle n'existe pas
  const createPieceJointeTable = async () => {
    try {
      // Vérifier si on a les droits pour créer une table
      const { error } = await supabase.rpc('create_rh_piece_jointe_table');
      
      if (error) {
        console.error('Erreur lors de la création de la table:', error);
        addToast({
          label: 'Erreur lors de la création de la table des pièces jointes',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      } else {
        addToast({
          label: 'Table des pièces jointes créée avec succès',
          icon: 'Check',
          color: '#22c55e'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la création de la table:', error);
      addToast({
        label: 'Erreur lors de la création de la table des pièces jointes',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !personnelId || !profil?.com_contrat_client_id) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Créer le bucket s'il n'existe pas
      const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('personnel-documents');
      
      if (bucketError && bucketError.message.includes('does not exist')) {
        await supabase.storage.createBucket('personnel-documents', {
          public: false
        });
      }
      
      // Uploader chaque fichier
      const totalFiles = selectedFiles.length;
      let uploadedFiles = 0;
      const uploadedPieces: PieceJointe[] = [];
      
      for (const file of selectedFiles) {
        // Créer un nom de fichier unique
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `${profil.com_contrat_client_id}/${personnelId}/${fileName}`;
        
        // Uploader le fichier
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('personnel-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (uploadError) throw uploadError;
        
        // Enregistrer les métadonnées dans la table rh_piece_jointe
        const { data: pieceData, error: pieceError } = await supabase
          .from('rh_piece_jointe')
          .insert([{
            id_personnel: personnelId,
            com_contrat_client_id: profil.com_contrat_client_id,
            nom_fichier: file.name,
            chemin_fichier: filePath,
            type_fichier: file.type,
            taille_fichier: file.size
          }])
          .select()
          .single();
          
        if (pieceError) throw pieceError;
        
        if (pieceData) {
          uploadedPieces.push(pieceData);
        }
        
        uploadedFiles++;
        setUploadProgress(Math.round((uploadedFiles / totalFiles) * 100));
      }
      
      // Mettre à jour la liste des pièces jointes
      setPiecesJointes(prev => [...uploadedPieces, ...prev]);
      
      // Réinitialiser la sélection de fichiers
      setSelectedFiles([]);
      
      addToast({
        label: `${uploadedFiles} fichier(s) uploadé(s) avec succès`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de l\'upload des fichiers:', error);
      addToast({
        label: 'Erreur lors de l\'upload des fichiers',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (pieceJointe: PieceJointe) => {
    try {
      const { data, error } = await supabase.storage
        .from('personnel-documents')
        .createSignedUrl(pieceJointe.chemin_fichier, 60);
        
      if (error) throw error;
      
      if (data) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
      addToast({
        label: 'Erreur lors du téléchargement du fichier',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const handleDelete = async (pieceJointe: PieceJointe) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le fichier "${pieceJointe.nom_fichier}" ?`)) return;
    
    try {
      // Supprimer le fichier du stockage
      const { error: storageError } = await supabase.storage
        .from('personnel-documents')
        .remove([pieceJointe.chemin_fichier]);
        
      if (storageError) throw storageError;
      
      // Supprimer l'entrée de la base de données
      const { error: dbError } = await supabase
        .from('rh_piece_jointe')
        .delete()
        .eq('id', pieceJointe.id);
        
      if (dbError) throw dbError;
      
      // Mettre à jour la liste des pièces jointes
      setPiecesJointes(prev => prev.filter(p => p.id !== pieceJointe.id));
      
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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.includes('pdf')) return 'FileText';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'FileText';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'FileSpreadsheet';
    return 'File';
  };

  if (!personnelId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <p className="text-yellow-700">Veuillez d'abord enregistrer les informations personnelles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Pièces jointes</h2>
        <div className="flex items-center gap-2">
          <input
            id="file-upload"
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            label={selectedFiles.length > 0 ? `${selectedFiles.length} fichier(s) sélectionné(s)` : "Sélectionner des fichiers"}
            icon="FileUp"
            color="var(--color-primary)"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={isUploading}
          />
          {selectedFiles.length > 0 && (
            <Button
              label={isUploading ? `Upload en cours (${uploadProgress}%)` : "Uploader"}
              icon="Upload"
              color="#22c55e"
              onClick={handleUpload}
              disabled={isUploading}
            />
          )}
        </div>
      </div>

      {/* Liste des fichiers sélectionnés */}
      {selectedFiles.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Fichiers sélectionnés</h3>
          <ul className="space-y-2">
            {selectedFiles.map((file, index) => (
              <li key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                <div className="flex items-center">
                  <FileText className="text-blue-500 mr-2" size={18} />
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-gray-500 ml-2">({formatFileSize(file.size)})</span>
                </div>
                <button
                  onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={18} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Barre de progression */}
      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}

      {/* Liste des pièces jointes */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Chargement des pièces jointes...</p>
        </div>
      ) : piecesJointes.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune pièce jointe</h3>
          <p className="mt-1 text-sm text-gray-500">
            Commencez par ajouter des documents en cliquant sur "Sélectionner des fichiers".
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {piecesJointes.map((piece) => (
              <li key={piece.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="text-blue-500 mr-3" size={24} />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{piece.nom_fichier}</h4>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <span>{formatFileSize(piece.taille_fichier)}</span>
                        <span className="mx-2">•</span>
                        <span>{format(new Date(piece.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownload(piece)}
                      className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
                      title="Télécharger"
                    >
                      <Download size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(piece)}
                      className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PiecesJointesTab;