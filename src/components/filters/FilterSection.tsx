import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormInput } from '../ui/form';
import { Dropdown, DropdownOption } from '../ui/dropdown';
import { DatePicker } from '../ui/date-picker';

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
  const { t } = useTranslation();
  
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
        
        // Verificar se as opções são objetos com estrutura { id, code, libelle }
        const firstOption = options[0];
        const isObjectOption = typeof firstOption === 'object' && firstOption !== null && 'libelle' in firstOption;

        if (isObjectOption) {
          // Para opções de entidade ou qualquer objeto com código e rótulo
          const entityOptions = options as { id?: string; code: string; libelle: string }[];

          if (filter.isEntityOption) {
            dropdownOptions = requireSelection ?
              entityOptions.map(option => ({
                value: option.code,
                label: `${option.code} - ${option.libelle}`
              })) : [
              { value: '', label: `${t('common.all')} ${label.toLowerCase()}` },
              ...entityOptions.map(option => ({
                value: option.code,
                label: `${option.code} - ${option.libelle}`
              }))
            ];
          } else {
            // Para outras opções de objeto (como status)
            dropdownOptions = [
              { value: '', label: `${t('common.all', 'Todos')} ${label.toLowerCase()}` },
              ...entityOptions.map(option => ({
                value: option.code,
                label: option.libelle
              }))
            ];
          }
        } else {
          // Para as opções simples (string ou number)
          dropdownOptions = [
            { value: '', label: `${t('common.all')} ${label.toLowerCase()}` },
            ...options.map(option => ({
              value: option.toString(),
              label: option.toString()
            }))
          ];
        }

        return (
          <div key={name} className="flex flex-col gap-1" style={width ? { width } : { minWidth: '180px' }}>
            <label className="text-xs font-medium text-gray-700">
              {label}
            </label>
            <Dropdown
              options={dropdownOptions}
              value={currentValue.toString()}
              onChange={(value) => handleFilterChange(name, value)}
              label={t('common.select') + ' ' + label.toLowerCase()}
              size="sm"
            />
          </div>
        );

      case 'text':
        return (
          <div key={name} className="flex flex-col gap-1" style={width ? { width } : { minWidth: '180px' }}>
            <label className="text-xs font-medium text-gray-700">
              {label}
            </label>
            <FormInput
              type="text"
              value={currentValue}
              onChange={(e) => handleFilterChange(name, e.target.value)}
              placeholder={`${t('common.searchBy')} ${label.toLowerCase()}...`}
              className="h-8 text-sm"
            />
          </div>
        );

      case 'number':
        return (
          <div key={name} className="flex flex-col gap-1" style={width ? { width } : { minWidth: '140px' }}>
            <label className="text-xs font-medium text-gray-700">
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
          <div key={name} className="flex flex-col gap-1" style={width ? { width } : { minWidth: '160px' }}>
            <label className="text-xs font-medium text-gray-700">
              {label}
            </label>
            <DatePicker
              value={currentValue}
              onChange={(value) => handleFilterChange(name, value)}
              placeholder={`${t('common.select')} ${label.toLowerCase()}`}
              className="h-9 text-sm"
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