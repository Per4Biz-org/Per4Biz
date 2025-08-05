import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileUp, Upload, X, ExternalLink } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../ui/button';
import { ToastData } from '../../ui/toast';

interface FactureFileUploadProps {
  factureId?: string;
  contratClientId: string;
  onUploadSuccess: (filePath: string) => void;
  onUploadError: (error: string) => void;
  disabled?: boolean;
  currentFile?: string | null;
}

export function FactureFileUpload({
  factureId,
  contratClientId,
  onUploadSuccess,
  onUploadError,
  disabled = false,
  currentFile = null
}: FactureFileUploadProps) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !contratClientId) return;
    
    console.log('Début de l\'upload du fichier:', selectedFile.name);
    setIsUploading(true);
    try {
      // Créer un nom de fichier unique
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${factureId || 'new'}-${Date.now()}.${fileExt}`;
      const filePath = `${contratClientId}/${fileName}`;
      console.log('Chemin du fichier à uploader:', filePath);
      
      // Uploader le fichier
      const { data: uploadData, error } = await supabase.storage
        .from('factures-achat')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error('Erreur lors de l\'upload:', error);
        throw error;
      }
      
      console.log('Upload réussi:', uploadData);
      
      // Indiquer que l'upload a réussi en passant le chemin du fichier
      console.log('Appel de onUploadSuccess avec le chemin:', filePath);
      onUploadSuccess(filePath); 
      setSelectedFile(null);
      
      // Générer une URL signée pour prévisualisation immédiate
      await generateSignedUrl(filePath);
    } catch (error: any) {
      console.error('Erreur lors de l\'upload:', error);
      onUploadError(error.message || 'Erreur lors de l\'upload du fichier');
    } finally {
      setIsUploading(false);
    }
  };

  // Fonction pour générer une URL signée
  const generateSignedUrl = async (filePath: string) => {
    if (!filePath) return;
    
    setIsGeneratingUrl(true);
    try {
      const { data, error } = await supabase.storage
        .from('factures-achat')
        .createSignedUrl(filePath, 60); // URL valide pendant 60 secondes
      
      if (error) throw error;
      
      setSignedUrl(data.signedUrl);
    } catch (error: any) {
      console.error('Erreur lors de la génération de l\'URL signée:', error);
      // Ne pas afficher d'erreur à l'utilisateur, c'est juste pour la prévisualisation
    } finally {
      setIsGeneratingUrl(false);
    }
  };

  // Générer une URL signée pour le fichier existant au chargement du composant
  useEffect(() => {
    if (currentFile) {
      console.log('Génération d\'une URL signée pour le fichier existant:', currentFile);
      generateSignedUrl(currentFile);
    } else {
      setSignedUrl(null);
    }
  }, [currentFile]);

  const handleRemoveFile = async () => {
    if (!currentFile) return;
    
    console.log('Tentative de suppression du fichier:', currentFile);
    try {
      const { error } = await supabase.storage
        .from('factures-achat')
        .remove([currentFile]);
      
      if (error) {
        console.error('Erreur lors de la suppression du fichier:', error);
        throw error;
      }
      
      console.log('Fichier supprimé avec succès');
      onUploadSuccess('');
      setSignedUrl(null);
    } catch (error: any) {
      console.error('Erreur lors de la suppression du fichier:', error);
      onUploadError(error.message || 'Erreur lors de la suppression du fichier');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        id="file-upload"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      {!currentFile ? (
        <>
          <Button
            label={selectedFile ? selectedFile.name : t('invoices.form.selectFile')}
            icon="FileUp"
            color="var(--color-primary)"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={disabled || isUploading}
            type="button"
            size="sm"
          />
          
          {selectedFile && (
            <Button
              label={isUploading ? "Upload en cours..." : "Uploader"}
              icon="Upload"
              color="#22c55e"
              onClick={handleUpload}
              disabled={disabled || isUploading}
              type="button"
              size="sm"
            />
          )}
        </>
      ) : (
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md border border-blue-200">
          <FileUp size={16} className="text-blue-500" />
          <span className="text-sm text-blue-700 mr-2">Fichier joint</span>
          
          {signedUrl && (
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100"
              title="Prévisualiser le fichier"
             type="button"
            >
              <ExternalLink size={16} />
            </a>
          )}
          
          {isGeneratingUrl && (
            <span className="text-xs text-blue-500 animate-pulse">
              Génération du lien...
            </span>
          )}
          
          <button
            onClick={handleRemoveFile}
            className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 ml-auto"
            disabled={disabled}
            title="Supprimer le fichier"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}