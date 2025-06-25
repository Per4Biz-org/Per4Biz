import React from 'react';
import { User, Upload, X } from 'lucide-react';

interface ProfilePhotoUploaderProps {
  photoPreview: string | null;
  isUploadingPhoto: boolean;
  onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoRemove: () => void;
}

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  photoPreview,
  isUploadingPhoto,
  onPhotoUpload,
  onPhotoRemove
}) => {
  return (
    <div className="flex flex-col items-center mb-8">
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mb-4">
          {photoPreview ? (
            <img 
              src={photoPreview} 
              alt="Photo de profil" 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-16 h-16 text-gray-400" />
          )}
        </div>
        <div className="absolute bottom-0 right-0 flex">
          <input
            type="file"
            id="photo-upload"
            accept="image/*"
            className="hidden"
            onChange={onPhotoUpload}
            disabled={isUploadingPhoto}
          />
          <label
            htmlFor="photo-upload"
            className="bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors flex items-center justify-center"
            title="Ajouter une photo"
          >
            <Upload size={16} />
          </label>
          {photoPreview && (
            <button
              onClick={onPhotoRemove}
              className="bg-red-500 text-white p-2 rounded-full ml-2 hover:bg-red-600 transition-colors flex items-center justify-center"
              title="Supprimer la photo"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-500">
        {isUploadingPhoto ? 'Téléversement en cours...' : 'Cliquez pour ajouter une photo'}
      </p>
    </div>
  );
};