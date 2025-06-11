import React from 'react';
import { FormInput } from '../ui/form';
import { Dropdown, DropdownOption } from '../ui/dropdown';

interface FilterConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: (string | number)[];
}

interface FilterSectionProps {
  filters: FilterConfig[];
  values: { [key: string]: any };
  onChange: (updatedValues: { [key: string]: any }) => void;
  className?: string;
}

export function FilterSection({
  filters,
  values,
  onChange,
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
    const { name, label, type, options } = filter;
    const currentValue = values[name] || '';

    switch (type) {
      case 'select':
        if (!options) {
          console.warn(`Filter "${name}" of type "select" requires options array`);
          return null;
        }

        const dropdownOptions: DropdownOption[] = [
          { value: '', label: `Tous les ${label.toLowerCase()}` },
          ...options.map(option => ({
            value: option.toString(),
            label: option.toString()
          }))
        ];

        return (
          <div key={name} className="flex flex-col gap-2 min-w-[200px]">
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
          <div key={name} className="flex flex-col gap-2 min-w-[200px]">
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
          <div key={name} className="flex flex-col gap-2 min-w-[150px]">
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
          <div key={name} className="flex flex-col gap-2 min-w-[180px]">
            <label className="text-sm font-medium text-gray-700">
              {label}
            </label>
            <FormInput
              type="date"
              value={currentValue}
              onChange={(e) => handleFilterChange(name, e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        );

      default:
        console.warn(`Unknown filter type: ${type}`);
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 mb-4 ${className}`}>
      <div className="flex flex-wrap gap-4 items-end">
        {filters.map(filter => renderFilterField(filter))}
      </div>
    </div>
  );
}