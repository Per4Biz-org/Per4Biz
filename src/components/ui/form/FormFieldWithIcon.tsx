import React from 'react';
import { Tooltip } from '../tooltip/index';

interface FormFieldWithIconProps {
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
  fieldType?: 'entity' | 'code' | 'label' | 'category' | 'subcategory' | 'flowType' | 'flowNature' | 'time' | 'order' | 'status' | 'description' | 'color' | 'employee';
  className?: string;
  children: React.ReactNode;
}

const getFieldIcon = (fieldType: string) => {
  const iconProps = { 
    width: 18, 
    height: 18, 
    className: "text-blue-500 hover:text-blue-700 cursor-help transition-colors duration-200" 
  };
  
  // Usando ícone de informação para todos os tipos de campo
  return (
    <svg {...iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
};

export const FormFieldWithIcon: React.FC<FormFieldWithIconProps> = ({
  label,
  required = false,
  error,
  description,
  fieldType = 'default',
  className = '',
  children
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center space-x-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {description && (
          <Tooltip content={description} position="top">
            {getFieldIcon(fieldType)}
          </Tooltip>
        )}
      </div>
      
      {children}
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};