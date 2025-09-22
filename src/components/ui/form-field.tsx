import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  // CheckCircle2,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface FormFieldProps {
  name: string;
  label: string;
  type?:
    | 'text'
    | 'textarea'
    | 'number'
    | 'email'
    | 'tel'
    | 'select'
    | 'textWithSuggestions'
    | 'arrowDropdown';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  mask?: string;
  className?: string;
  description?: string;
  options?: Array<{ value: string; label: string }>;
  tooltip?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  error,
  touched = false,
  disabled = false,
  mask,
  className,
  description,
  options = [],
  tooltip,
}) => {
  const hasError = touched && error;
  const isValid = touched && !error && value.length > 0;
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const applyMask = (inputValue: string, maskPattern?: string): string => {
    if (!maskPattern) return inputValue;

    // Máscaras predefinidas
    const masks: Record<string, string> = {
      phone: '(99) 99999-9999',
      cpf: '999.999.999-99',
      cnpj: '99.999.999/9999-99',
      cep: '99999-999',
      date: '99/99/9999',
    };

    const actualMask = masks[maskPattern] || maskPattern;
    const digits = inputValue.replace(/\D/g, '');
    let masked = '';
    let digitIndex = 0;

    for (let i = 0; i < actualMask.length && digitIndex < digits.length; i++) {
      if (actualMask[i] === '9') {
        masked += digits[digitIndex];
        digitIndex++;
      } else {
        masked += actualMask[i];
      }
    }

    return masked;
  };

  // Efeito para filtrar opções baseado no valor atual
  useEffect(() => {
    if (type === 'textWithSuggestions' && options.length > 0) {
      const filtered = options.filter(
        (option) =>
          option.label.toLowerCase().includes(value.toLowerCase()) ||
          option.value.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered);
      setShowSuggestions(value.length > 0 && filtered.length > 0);
    }
  }, [value, options, type]);

  // Efeito para fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    if (type === 'textWithSuggestions') {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [type]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    let newValue = e.target.value;

    if (mask) {
      newValue = applyMask(newValue, mask);
    }

    onChange(newValue);
  };

  const handleSuggestionClick = (suggestionValue: string) => {
    onChange(suggestionValue);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const inputClasses = cn(
    'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200',
    hasError && 'border-red-500 focus:ring-red-500',
    isValid && 'border-green-500 focus:ring-green-500',
    className
  );

  // Componente ArrowDropdownField
  const ArrowDropdownField: React.FC<{
    id: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    options: Array<{ value: string; label: string }>;
  }> = ({ value, onChange, placeholder, disabled, className, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [menuPosition, setMenuPosition] = useState<'right' | 'left'>('right');

    // Atualizar o label selecionado quando o valor muda
    useEffect(() => {
      const selectedOption = options.find((option) => option.value === value);
      setSelectedLabel(selectedOption ? selectedOption.label : '');
    }, [value, options]);

    // Calcular posição do menu e fechar dropdown ao clicar fora
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
        }
      };

      const calculatePosition = () => {
        if (dropdownRef.current && isOpen) {
          const rect = dropdownRef.current.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const menuWidth = 250; // Largura estimada do menu

          // Se o menu sair da tela pela direita, posicionar à esquerda
          if (rect.right + menuWidth > viewportWidth) {
            setMenuPosition('left');
          } else {
            setMenuPosition('right');
          }
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        calculatePosition();
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
          document.removeEventListener('keydown', handleEscape);
        };
      }
    }, [isOpen]);

    const handleOptionClick = (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
    };

    return (
      <div
        ref={dropdownRef}
        className="relative"
        style={{ zIndex: isOpen ? 99999 : 'auto' }}
      >
        {/* Botão da seta */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg',
            'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'transition-all duration-200 cursor-pointer',
            hasError && 'border-red-500 focus:ring-red-500',
            isValid && 'border-green-500 focus:ring-green-500',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <span
            className={cn(
              'text-left flex-1',
              !selectedLabel && !value && 'text-gray-500'
            )}
          >
            {selectedLabel || value || placeholder}
          </span>
          <ChevronRight
            className={cn(
              'h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0',
              isOpen && 'rotate-90'
            )}
          />
        </button>

        {/* Menu lateral */}
        {isOpen && (
          <div
            className={cn(
              'absolute top-0 z-[99999] bg-background border border-border rounded-lg shadow-xl min-w-[200px] max-w-[300px] transform translate-x-0',
              menuPosition === 'right' ? 'left-full ml-1' : 'right-full mr-1'
            )}
            style={{ zIndex: 99999 }}
          >
            <div className="py-1 max-h-60 overflow-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOptionClick(option.value);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors cursor-pointer',
                    value === option.value && 'bg-blue-50 text-blue-600'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInput = () => {
    const baseProps = {
      id: name,
      name,
      value,
      onChange: handleChange,
      onBlur,
      placeholder,
      disabled,
      className: inputClasses,
      'aria-describedby': hasError
        ? `${name}-error`
        : description
          ? `${name}-description`
          : undefined,
    };

    if (type === 'select') {
      return (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className={inputClasses}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (type === 'arrowDropdown') {
      return <ArrowDropdownField {...baseProps} options={options} />;
    }

    if (type === 'textWithSuggestions') {
      return (
        <div className="relative">
          <Input
            {...baseProps}
            ref={inputRef}
            aria-invalid={hasError ? 'true' : 'false'}
            type="text"
            onFocus={() => {
              if (options.length > 0 && value.length > 0) {
                setShowSuggestions(true);
              }
            }}
          />
          {showSuggestions && filteredOptions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto"
            >
              {filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                  onClick={() => handleSuggestionClick(option.value)}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (type === 'textarea') {
      return (
        <Textarea
          {...baseProps}
          aria-invalid={hasError ? 'true' : 'false'}
          className={cn(baseProps.className, 'min-h-24 resize-y')}
        />
      );
    }

    return (
      <Input
        {...baseProps}
        aria-invalid={hasError ? 'true' : 'false'}
        type={type}
      />
    );
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Label
          htmlFor={name}
          className={cn(
            'text-sm font-semibold text-foreground transition-colors',
            hasError && 'text-red-600',
            isValid && 'text-green-600'
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>

        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="text-sm whitespace-pre-line">{tooltip}</div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {description && !hasError && (
        <p
          id={`${name}-description`}
          className="text-xs text-muted-foreground font-medium -mt-1"
        >
          {description}
        </p>
      )}

      <div className="relative">{renderInput()}</div>

      {/* Error message */}
      {hasError && (
        <div
          id={`${name}-error`}
          className="flex items-center gap-2 text-sm text-red-600 animate-in slide-in-from-left-1 duration-200"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FormField;
