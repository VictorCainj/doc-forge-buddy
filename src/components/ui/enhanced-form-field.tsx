/**
 * Componente de campo de formulário aprimorado
 * Centraliza toda a lógica de campos de formulário
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface FormFieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface EnhancedFormFieldProps {
  name: string;
  label: string;
  type?:
    | 'text'
    | 'email'
    | 'tel'
    | 'password'
    | 'number'
    | 'textarea'
    | 'select';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  required?: boolean;
  error?: string | null;
  options?: FormFieldOption[];
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  minLength?: number;
  rows?: number;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  tooltip?: string;
  helperText?: string;
}

export const EnhancedFormField: React.FC<EnhancedFormFieldProps> = ({
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  required = false,
  error,
  options,
  placeholder,
  icon: Icon,
  disabled = false,
  readOnly = false,
  maxLength,
  minLength,
  rows = 3,
  className,
  labelClassName,
  inputClassName,
  tooltip,
  helperText,
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const fieldId = `field-${name}`;
  const hasError = Boolean(error);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const renderInput = () => {
    const baseProps = {
      id: fieldId,
      value,
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => onChange(e.target.value),
      onBlur,
      placeholder,
      disabled,
      readOnly,
      maxLength,
      minLength,
      className: cn(
        hasError && 'border-error-500 focus:border-error-500',
        inputClassName
      ),
    };

    switch (type) {
      case 'textarea':
        return <Textarea {...baseProps} rows={rows} />;

      case 'select':
        return (
          <Select value={value} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger
              id={fieldId}
              className={cn(
                hasError && 'border-error-500 focus:border-error-500',
                inputClassName
              )}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options?.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'password':
        return (
          <div className="relative">
            <Input {...baseProps} type={showPassword ? 'text' : 'password'} />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={togglePasswordVisibility}
              disabled={disabled}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        );

      default:
        return <Input {...baseProps} type={type} />;
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label
        htmlFor={fieldId}
        className={cn(
          'flex items-center gap-2',
          hasError && 'text-error-600',
          labelClassName
        )}
        title={tooltip}
      >
        {Icon && <Icon className="h-4 w-4" />}
        {label}
        {required && <span className="text-error-500">*</span>}
      </Label>

      {renderInput()}

      {hasError && (
        <p className="text-sm text-error-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}

      {helperText && !hasError && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
};

/**
 * Componentes especializados baseados no EnhancedFormField
 */

export const EmailField: React.FC<Omit<EnhancedFormFieldProps, 'type'>> = (
  props
) => (
  <EnhancedFormField type="email" placeholder="exemplo@email.com" {...props} />
);

export const PhoneField: React.FC<Omit<EnhancedFormFieldProps, 'type'>> = (
  props
) => <EnhancedFormField type="tel" placeholder="(11) 99999-9999" {...props} />;

export const PasswordField: React.FC<Omit<EnhancedFormFieldProps, 'type'>> = (
  props
) => (
  <EnhancedFormField
    type="password"
    placeholder="Digite sua senha"
    {...props}
  />
);

export const NumberField: React.FC<Omit<EnhancedFormFieldProps, 'type'>> = (
  props
) => <EnhancedFormField type="number" {...props} />;

export const TextAreaField: React.FC<Omit<EnhancedFormFieldProps, 'type'>> = (
  props
) => <EnhancedFormField type="textarea" {...props} />;

export const SelectField: React.FC<Omit<EnhancedFormFieldProps, 'type'>> = (
  props
) => <EnhancedFormField type="select" {...props} />;

/**
 * Hook para gerenciar múltiplos campos de formulário
 * @internal
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useFormFields = <T extends Record<string, string>>(
  initialValues: T
) => {
  const [values, setValues] = React.useState<T>(initialValues);
  const [errors, setErrors] = React.useState<Partial<Record<keyof T, string>>>(
    {}
  );

  const updateField = React.useCallback(
    (name: keyof T, value: string) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      // Limpar erro quando o campo é alterado
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const setFieldError = React.useCallback((name: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const clearFieldError = React.useCallback((name: keyof T) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const clearAllErrors = React.useCallback(() => {
    setErrors({});
  }, []);

  const resetForm = React.useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  const hasErrors = React.useMemo(() => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  return {
    values,
    errors,
    updateField,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    resetForm,
    hasErrors,
    setValues,
  };
};
