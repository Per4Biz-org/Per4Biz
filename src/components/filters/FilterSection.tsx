import React from 'react';
import { FormInput } from '../ui/form';
import { Dropdown, DropdownOption } from '../ui/dropdown';

interface FilterConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  width?: string;
  options?: (string | number)[] | { id?: string; code: string; libelle: string }[];
  isEntityOption?: boolean;
}

interface FilterSectionProps {
  filters: FilterConfig[];
  values: { [key: string]: any };
  onChange: (updatedValues: { [key: string]: any }) => void;
  className?: string;
  requireSelection?: boolean;
}

export function FilterSection({
  filters,
  values,
  onChange,
  requireSelection = false,
  className = ''
}: FilterSectionProps) {
  const handleFilterChange = (name: string, value: any) => {
    const updatedValues = {
      ...values,
      [name]: value
    };
    onChange(updatedValues);
  };

  const renderFilterField = (filter: FilterConfig) => {
    const { name, label, type, options, width } = filter;
    const currentValue = values[name] || '';

    switch (type) {
      case 'select':
        if (!options) {
          console.warn(`Filter "${name}" of type "select" requires options array`);
          return null;
        }

        let dropdownOptions: DropdownOption[];
        
        if (filter.isEntityOption) {
          // Pour les options d'entité (avec code et libellé)
          const entityOptions = options as { id?: string; code: string; libelle: string }[];
          dropdownOptions = requireSelection ? [] : [
            { value: '', label: `Tous les ${label.toLowerCase()}` }
          ];
          
          dropdownOptions = requireSelection ? 
            entityOptions.map(option => ({
              value: option.code,
              label: `${option.code} - ${option.libelle}`
            })) : [
            { value: '', label: `Tous les ${label.toLowerCase()}` },
            ...entityOptions.map(option => ({
              value: option.code,
              label: `${option.code} - ${option.libelle}`
            }))
          ];
        } else {
          // Pour les options simples (string ou number)
          dropdownOptions = [
            { value: '', label: `Tous les ${label.toLowerCase()}` },
            ...options.map(option => ({
              value: option.toString(),
              label: option.toString()
            }))
          ];
        }

        return (
          <div key={name} className="flex flex-col gap-2" style={width ? { width } : { minWidth: '200px' }}>
            <label className="text-sm font-medium text-gray-700">
              {label}
            </label>
            <Dropdown
              options={dropdownOptions}
              value={currentValue.toString()}
              onChange={(value) => handleFilterChange(name, value)}
              label={`Sélectionner ${label.toLowerCase()}`}
              size="sm"
            />
          </div>
        );

      case 'text':
        return (
          <div key={name} className="flex flex-col gap-2" style={width ? { width } : { minWidth: '200px' }}>
            <label className="text-sm font-medium text-gray-700">
              {label}
            </label>
            <FormInput
              type="text"
              value={currentValue}
              onChange={(e) => handleFilterChange(name, e.target.value)}
              placeholder={`Rechercher par ${label.toLowerCase()}...`}
              className="h-8 text-sm"
            />
          </div>
        );

      case 'number':
        return (
          <div key={name} className="flex flex-col gap-2" style={width ? { width } : { minWidth: '150px' }}>
            <label className="text-sm font-medium text-gray-700">
              {label}
            </label>
            <FormInput
              type="number"
              value={currentValue}
              onChange={(e) => handleFilterChange(name, e.target.value)}
              placeholder={`${label}...`}
              className="h-8 text-sm"
            />
          </div>
        );

      case 'date':
        return (
          <div key={name} className="flex flex-col gap-2" style={width ? { width } : { minWidth: '180px' }}>
            <label className="text-sm font-medium text-gray-700">
              {label}
            </label>
            <FormInput
              type="date"
              value={currentValue}
              onChange={(e) => handleFilterChange(name, e.target.value)}
              className="h-8 text-sm"
              style={width ? { width } : undefined}
            />
          </div>
        );

      default:
        console.warn(`Unknown filter type: ${type}`);
        return null;
    }
  };

  return (
    <div className={className}>
      {filters.map(filter => renderFilterField(filter))}
    </div>
  );
}