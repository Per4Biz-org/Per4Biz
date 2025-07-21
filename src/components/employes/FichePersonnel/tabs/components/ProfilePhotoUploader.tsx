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
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mb-4 shadow-md border-2 border-gray-300">
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
        <div className="absolute bottom-0 right-0 flex gap-1">
          <input
            type="file"
            id="photo-upload"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={onPhotoUpload}
            disabled={isUploadingPhoto}
          />
          <label
            htmlFor="photo-upload"
            className="bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors flex items-center justify-center shadow-md"
            title="Ajouter une photo"
          >
            <Upload size={16} />
          </label>
          {photoPreview && (
            <button
              onClick={onPhotoRemove}
              className="bg-red-500 text-white p-2 rounded-full ml-2 hover:bg-red-600 transition-colors flex items-center justify-center shadow-md"
              title="Supprimer la photo"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-500">
        {isUploadingPhoto ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Téléversement en cours...
          </span>
        ) : (
          'Cliquez pour ajouter une photo'
        )}
      </p>
    </div>
  );
};