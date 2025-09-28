import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Filter,
  X,
  Calendar,
  MapPin,
  User,
  FileText,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'date' | 'text' | 'multiselect';
  options?: Array<{ value: string; label: string }>;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface FilterValue {
  [key: string]: string | string[] | Date | null;
}

interface SmartFiltersProps {
  filters: FilterOption[];
  values: FilterValue;
  onChange: (values: FilterValue) => void;
  onReset: () => void;
  className?: string;
  showActiveCount?: boolean;
}

export const SmartFilters = ({
  filters,
  values,
  onChange,
  onReset,
  className,
  showActiveCount = true,
}: SmartFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getActiveFilterCount = () => {
    return Object.values(values).filter(
      (value) =>
        value !== null &&
        value !== undefined &&
        value !== '' &&
        (Array.isArray(value) ? value.length > 0 : true)
    ).length;
  };

  const handleFilterChange = (key: string, value: string | string[]) => {
    onChange({
      ...values,
      [key]: value,
    });
  };

  const removeFilter = (key: string) => {
    const newValues = { ...values };
    delete newValues[key];
    onChange(newValues);
  };

  const getIcon = (iconName?: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      Calendar,
      MapPin,
      User,
      FileText,
      Clock,
    };
    return icons[iconName || 'Filter'];
  };

  const renderFilter = (filter: FilterOption) => {
    const Icon = getIcon(filter.icon?.name);
    const currentValue = values[filter.key];

    switch (filter.type) {
      case 'select':
        return (
          <div key={filter.key} className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Icon className="h-4 w-4 mr-2" />
              {filter.label}
            </label>
            <Select
              value={(currentValue as string) || ''}
              onValueChange={(value) => handleFilterChange(filter.key, value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={`Selecionar ${filter.label.toLowerCase()}`}
                />
              </SelectTrigger>
              <SelectContent>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'multiselect':
        return (
          <div key={filter.key} className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Icon className="h-4 w-4 mr-2" />
              {filter.label}
            </label>
            <Select
              value=""
              onValueChange={(value) => {
                const currentValues = (currentValue as string[]) || [];
                if (!currentValues.includes(value)) {
                  handleFilterChange(filter.key, [...currentValues, value]);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={`Adicionar ${filter.label.toLowerCase()}`}
                />
              </SelectTrigger>
              <SelectContent>
                {filter.options
                  ?.filter(
                    (option) =>
                      !((currentValue as string[]) || []).includes(option.value)
                  )
                  .map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {currentValue &&
              Array.isArray(currentValue) &&
              currentValue.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {currentValue.map((value) => (
                    <Badge
                      key={value}
                      variant="secondary"
                      className="flex items-center space-x-1"
                    >
                      <span>
                        {filter.options?.find((opt) => opt.value === value)
                          ?.label || value}
                      </span>
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          const newValues = (currentValue as string[]).filter(
                            (v) => v !== value
                          );
                          handleFilterChange(
                            filter.key,
                            newValues.length > 0 ? newValues : null
                          );
                        }}
                      />
                    </Badge>
                  ))}
                </div>
              )}
          </div>
        );

      case 'date':
        return (
          <div key={filter.key} className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Icon className="h-4 w-4 mr-2" />
              {filter.label}
            </label>
            <Input
              type="date"
              value={
                currentValue
                  ? (currentValue as Date).toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) =>
                handleFilterChange(
                  filter.key,
                  e.target.value ? new Date(e.target.value) : null
                )
              }
              className="w-full"
            />
          </div>
        );

      case 'text':
        return (
          <div key={filter.key} className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Icon className="h-4 w-4 mr-2" />
              {filter.label}
            </label>
            <Input
              type="text"
              value={(currentValue as string) || ''}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              placeholder={`Buscar ${filter.label.toLowerCase()}`}
              className="w-full"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const activeFilters = Object.entries(values).filter(
    ([_, value]) =>
      value !== null &&
      value !== undefined &&
      value !== '' &&
      (Array.isArray(value) ? value.length > 0 : true)
  );

  return (
    <Card className={cn('shadow-sm border', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
            {showActiveCount && getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFilterCount()}
              </Badge>
            )}
          </CardTitle>
          <div className="flex space-x-2">
            {getActiveFilterCount() > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Recolher' : 'Expandir'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Active filters summary */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
              {activeFilters.map(([key, value]) => {
                const filter = filters.find((f) => f.key === key);
                const displayValue = Array.isArray(value)
                  ? value
                      .map(
                        (v) =>
                          filter?.options?.find((opt) => opt.value === v)
                            ?.label || v
                      )
                      .join(', ')
                  : filter?.options?.find((opt) => opt.value === value)
                      ?.label || value;

                return (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="flex items-center space-x-1"
                  >
                    <span>
                      {filter?.label}: {displayValue}
                    </span>
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFilter(key)}
                    />
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Filter controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map(renderFilter)}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
