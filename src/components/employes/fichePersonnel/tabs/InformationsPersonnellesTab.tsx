import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useProfil } from '../../../../context/ProfilContext';
import { Form, FormField, FormInput, FormActions } from '../../../ui/form';
import { Dropdown, DropdownOption } from '../../../ui/dropdown';
import { Button } from '../../../ui/button';
import { TiersSelector } from '../../../ParametreGlobal/Tiers/TiersSelector';
import { TiersFormModal } from '../../../ParametreGlobal/Tiers/TiersFormModal';
import { User, Upload, X } from 'lucide-react';

interface InformationsPersonnellesTabProps {
  personnelId: string | undefined;
  isCreationMode: boolean;
  personnelData: any;
  setPersonnelData: React.Dispatch<React.SetStateAction<any>>;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isSubmitting: boolean;
  onSavePersonnel: (personnelData: any) => Promise<string | undefined>;
  onUpdatePersonnel: (personnelId: string, personnelData: any) => Promise<void>;
  onCancel: () => void;
}

const InformationsPersonnellesTab: React.FC<InformationsPersonnellesTabProps> = ({
  personnelId,
  isCreationMode,
  personnelData,
  setPersonnelData,
  formErrors,
  setFormErrors,
  isSubmitting,
  onSavePersonnel,
  onUpdatePersonnel,
  onCancel
}) => {
  const { profil } = useProfil();
  const [isTiersModalOpen, setIsTiersModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Chargement de la photo si elle existe
  useEffect(() => {
    const loadPhoto = async () => {
      if (personnelData.lien_photo) {
        try {
          const { data } = await supabase.storage
            .from('personnel-photos')
            .createSignedUrl(personnelData.lien_photo, 60);
          
          if (data) {
            setPhotoUrl(data.signedUrl);
          }
        } catch (error) {
          console.error('Erreur lors du chargement de la photo:', error);
        }
      }
    };

    loadPhoto();
  }, [personnelData.lien_photo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPersonnelData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleDropdownChange = (name: string) => (value: string) => {
    setPersonnelData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleTiersChange = (value: string) => {
    setPersonnelData(prev => ({
      ...prev,
      id_tiers: value
    }));
    
    if (formErrors.id_tiers) {
      setFormErrors(prev => ({
        ...prev,
        id_tiers: ''
      }));
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile || !profil?.com_contrat_client_id) return;
    
    setIsUploading(true);
    try {
      // Créer un nom de fichier unique
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${personnelId || 'new'}-${Date.now()}.${fileExt}`;
      const filePath = `${profil.com_contrat_client_id}/${fileName}`;
      
      // Uploader le fichier
      const { error } = await supabase.storage
        .from('personnel-photos')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) throw error;
      
      // Mettre à jour le lien dans les données du personnel
      setPersonnelData(prev => ({
        ...prev,
        lien_photo: filePath
      }));
      
      // Générer une URL signée pour prévisualisation
      const { data } = await supabase.storage
        .from('personnel-photos')
        .createSignedUrl(filePath, 60);
      
      if (data) {
        setPhotoUrl(data.signedUrl);
      }
      
      setSelectedFile(null);
    } catch (error) {
      console.error('Erreur lors de l\'upload de la photo:', error);
      alert('Erreur lors de l\'upload de la photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!personnelData.lien_photo) return;
    
    try {
      const { error } = await supabase.storage
        .from('personnel-photos')
        .remove([personnelData.lien_photo]);
      
      if (error) throw error;
      
      setPersonnelData(prev => ({
        ...prev,
        lien_photo: null
      }));
      
      setPhotoUrl(null);
    } catch (error) {
      console.error('Erreur lors de la suppression de la photo:', error);
      alert('Erreur lors de la suppression de la photo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation du formulaire
    const errors: Record<string, string> = {};
    
    if (!personnelData.nom) errors.nom = 'Le nom est requis';
    if (!personnelData.prenom) errors.prenom = 'Le prénom est requis';
    if (!personnelData.code_court) errors.code_court = 'Le code court est requis';
    if (!personnelData.matricule) errors.matricule = 'Le matricule est requis';
    if (!personnelData.id_tiers) errors.id_tiers = 'Le tiers est requis';
    
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) return;
    
    if (isCreationMode) {
      await onSavePersonnel(personnelData);
    } else if (personnelId) {
      await onUpdatePersonnel(personnelId, personnelData);
    }
  };

  const handleCreateTiers = async (tiersData: any) => {
    try {
      if (!profil?.com_contrat_client_id) {
        throw new Error('Aucun contrat client associé au profil');
      }

      const { data, error } = await supabase
        .from('com_tiers')
        .insert([{
          ...tiersData,
          com_contrat_client_id: profil.com_contrat_client_id
        }])
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour le tiers sélectionné
      if (data) {
        setPersonnelData(prev => ({
          ...prev,
          id_tiers: data.id
        }));
      }

      setIsTiersModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la création du tiers:', error);
      alert('Erreur lors de la création du tiers');
    }
  };

  const civiliteOptions: DropdownOption[] = [
    { value: '', label: 'Sélectionner une civilité' },
    { value: 'Monsieur', label: 'Monsieur' },
    { value: 'Madame', label: 'Madame' },
    { value: 'Mademoiselle', label: 'Mademoiselle' }
  ];

  const sexeOptions: DropdownOption[] = [
    { value: '', label: 'Sélectionner un sexe' },
    { value: 'Homme', label: 'Homme' },
    { value: 'Femme', label: 'Femme' }
  ];

  return (
    <div className="space-y-6">
      {/* Section photo de profil */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-4 flex items-center justify-center relative">
          {photoUrl ? (
            <>
              <img 
                src={photoUrl} 
                alt="Photo de profil" 
                className="w-full h-full object-cover"
              />
              <button
                onClick={handleRemovePhoto}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 m-1"
                type="button"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <User size={64} className="text-gray-400" />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            label={selectedFile ? selectedFile.name : "Sélectionner une photo"}
            icon="Image"
            color="var(--color-primary)"
            onClick={() => document.getElementById('photo-upload')?.click()}
            type="button"
            disabled={isSubmitting || isUploading}
            size="sm"
          />
          
          {selectedFile && (
            <Button
              label={isUploading ? "Upload en cours..." : "Uploader"}
              icon="Upload"
              color="#22c55e"
              onClick={handleUploadPhoto}
              disabled={isSubmitting || isUploading}
              type="button"
              size="sm"
            />
          )}
        </div>
      </div>

      <Form size={100} columns={3} onSubmit={handleSubmit}>
        {/* Première ligne */}
        <FormField
          label="Civilité"
          error={formErrors.civilite}
        >
          <Dropdown
            options={civiliteOptions}
            value={personnelData.civilite || ''}
            onChange={handleDropdownChange('civilite')}
            label="Sélectionner une civilité"
            size="sm"
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          label="Nom"
          required
          error={formErrors.nom}
        >
          <FormInput
            name="nom"
            value={personnelData.nom}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          label="Prénom"
          required
          error={formErrors.prenom}
        >
          <FormInput
            name="prenom"
            value={personnelData.prenom}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Deuxième ligne */}
        <FormField
          label="Code court"
          required
          error={formErrors.code_court}
          description="Identifiant court unique (12 car. max)"
        >
          <FormInput
            name="code_court"
            value={personnelData.code_court}
            onChange={handleInputChange}
            disabled={isSubmitting}
            maxLength={12}
          />
        </FormField>

        <FormField
          label="Matricule"
          required
          error={formErrors.matricule}
          description="Matricule unique (12 car. max)"
        >
          <FormInput
            name="matricule"
            value={personnelData.matricule}
            onChange={handleInputChange}
            disabled={isSubmitting}
            maxLength={12}
          />
        </FormField>

        <FormField
          label="Sexe"
          error={formErrors.sexe}
        >
          <Dropdown
            options={sexeOptions}
            value={personnelData.sexe || ''}
            onChange={handleDropdownChange('sexe')}
            label="Sélectionner un sexe"
            size="sm"
            disabled={isSubmitting}
          />
        </FormField>

        {/* Troisième ligne */}
        <FormField
          label="Date de naissance"
          error={formErrors.date_naissance}
        >
          <FormInput
            name="date_naissance"
            type="date"
            value={personnelData.date_naissance || ''}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          label="Numéro de sécurité sociale"
          error={formErrors.numero_securite_sociale}
        >
          <FormInput
            name="numero_securite_sociale"
            value={personnelData.numero_securite_sociale || ''}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          label="NIF"
          error={formErrors.nif}
        >
          <FormInput
            name="nif"
            value={personnelData.nif || ''}
            onChange={handleInputChange}
            disabled={isSubmitting}
            maxLength={20}
          />
        </FormField>

        {/* Quatrième ligne */}
        <FormField
          label="Email personnel"
          error={formErrors.email_perso}
        >
          <FormInput
            name="email_perso"
            type="email"
            value={personnelData.email_perso || ''}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          label="Téléphone"
          error={formErrors.telephone}
        >
          <FormInput
            name="telephone"
            value={personnelData.telephone || ''}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          label="Tiers associé"
          required
          error={formErrors.id_tiers}
        >
          <div className="flex gap-2">
            <div className="flex-1">
              <TiersSelector
                value={personnelData.id_tiers || ''}
                onChange={handleTiersChange}
                disabled={isSubmitting}
              />
            </div>
            <Button
              label="Créer"
              icon="Plus"
              color="#f59e0b"
              onClick={() => setIsTiersModalOpen(true)}
              type="button"
              disabled={isSubmitting}
              size="sm"
            />
          </div>
        </FormField>

        {/* Cinquième ligne - Adresse */}
        <FormField
          label="Adresse"
          error={formErrors.adresse}
          className="col-span-3"
        >
          <FormInput
            name="adresse"
            value={personnelData.adresse || ''}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Sixième ligne */}
        <FormField
          label="Code postal"
          error={formErrors.code_postal}
        >
          <FormInput
            name="code_postal"
            value={personnelData.code_postal || ''}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          label="Ville"
          error={formErrors.ville}
        >
          <FormInput
            name="ville"
            value={personnelData.ville || ''}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          label="Pays"
          error={formErrors.pays}
        >
          <FormInput
            name="pays"
            value={personnelData.pays || ''}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
        </FormField>

        <FormActions>
          <Button
            label="Annuler"
            color="#6B7280"
            onClick={onCancel}
            type="button"
            disabled={isSubmitting}
          />
          <Button
            label={isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            icon="Save"
            color="var(--color-primary)"
            type="submit"
            disabled={isSubmitting}
          />
        </FormActions>
      </Form>

      {/* Modale de création de tiers */}
      <TiersFormModal
        isOpen={isTiersModalOpen}
        onClose={() => setIsTiersModalOpen(false)}
        onSubmit={handleCreateTiers}
        isSubmitting={false}
      />
    </div>
  );
};

export default InformationsPersonnellesTab;