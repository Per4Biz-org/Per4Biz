import { useState } from 'react';
import { supabase } from '../../../../../lib/supabase';
import { useProfil } from '../../../../../context/ProfilContext';
import { ToastData } from '../../../../../components/ui/toast';

interface UsePhotoManagementProps {
  setValue?: (name: string, value: any, options?: any) => void;
  getValues?: () => Record<string, any>;
  addToast?: (toast: Omit<ToastData, 'id'>) => void;
}

export const usePhotoManagement = (props?: UsePhotoManagementProps) => {
  const { profil } = useProfil();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  // Fonction pour charger l'aperçu de la photo
  const loadPhotoPreview = async (photoPath: string, setPreview: (url: string | null) => void) => {
    try {
      console.log('Génération de l\'URL signée pour la photo:', photoPath);
      const { data, error } = await supabase
        .storage
        .from('personnel-photos')
        .createSignedUrl(photoPath, 60);
      
      if (error) {
        console.error('Erreur lors de la création de l\'URL signée:', error);
        throw error;
      }

      console.log('URL signée créée avec succès, longueur:', data.signedUrl.length);
      setPreview(data.signedUrl);
    } catch (error) {
      console.error('Erreur lors du chargement de la photo:', error);
    }
  };

  // Gérer l'upload de la photo
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profil?.com_contrat_client_id) return;
    
    console.log('Début du téléversement de la photo:', file.name);

    setIsUploadingPhoto(true);
    try {
      // Créer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${profil.com_contrat_client_id}/${fileName}`;
      
      console.log('Chemin du fichier à téléverser:', filePath);

      // Uploader le fichier
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('personnel-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Erreur lors du téléversement:', uploadError);
        throw uploadError;
      }
      
      console.log('Photo téléversée avec succès. Chemin:', filePath);

      // Mettre à jour le formulaire avec le chemin du fichier
      if (props?.setValue) {
        props.setValue('lien_photo', filePath, { shouldDirty: true });
        console.log('Chemin de la photo mis à jour dans le formulaire:', props?.getValues ? props.getValues('lien_photo') : filePath, 'Type:', typeof filePath);
        
        // Vérifier si la valeur a bien été définie
        setTimeout(() => {
          const currentValue = props?.getValues ? props.getValues('lien_photo') : undefined;
          console.log('Vérification après setValue - lien_photo:', currentValue, 'Type:', typeof currentValue);
        }, 100);
      }
      
      // Charger l'aperçu
      loadPhotoPreview(filePath, setPhotoPreview);
      
      if (props?.addToast) {
        props.addToast({
          label: 'Photo téléversée avec succès',
          icon: 'Check',
          color: '#22c55e'
        });
      }
    } catch (error) {
      console.error('Erreur lors du téléversement de la photo:', error);
      if (props?.addToast) {
        props.addToast({
          label: 'Erreur lors du téléversement de la photo',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Supprimer la photo
  const handleRemovePhoto = async () => {
    const photoPath = props?.getValues ? props.getValues().lien_photo : null;
    if (!photoPath) return;

    console.log('Suppression de la photo:', photoPath);
    try {
      const { error } = await supabase.storage
        .from('personnel-photos')
        .remove([photoPath]);

      if (error) throw error;

      console.log('Photo supprimée avec succès');
      if (props?.setValue) {
        props.setValue('lien_photo', null, { shouldDirty: true });
        console.log('Valeur du champ lien_photo après suppression:', props?.getValues ? props.getValues('lien_photo') : null);
        
        // Vérifier si la valeur a bien été définie à null
        setTimeout(() => {
          const currentValue = props?.getValues ? props.getValues('lien_photo') : undefined;
          console.log('Vérification après suppression - lien_photo:', currentValue, 'Type:', typeof currentValue);
        }, 100);
      }
      setPhotoPreview(null);
      
      if (props?.addToast) {
        props.addToast({
          label: 'Photo supprimée avec succès',
          icon: 'Check',
          color: '#22c55e'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la photo:', error);
      if (props?.addToast) {
        props.addToast({
          label: 'Erreur lors de la suppression de la photo',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  return {
    photoPreview,
    setPhotoPreview,
    isUploadingPhoto,
    loadPhotoPreview,
    handlePhotoUpload,
    handleRemovePhoto
  };
};