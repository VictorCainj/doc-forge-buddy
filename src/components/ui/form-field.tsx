import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface FormFieldProps {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "email" | "tel" | "select" | "textWithSuggestions";
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
  type = "text",
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
      phone: "(99) 99999-9999",
      cpf: "999.999.999-99",
      cnpj: "99.999.999/9999-99",
      cep: "99999-999",
      date: "99/99/9999",
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
    if (type === "textWithSuggestions" && options.length > 0) {
      const filtered = options.filter(option => 
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

    if (type === "textWithSuggestions") {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    "transition-all duration-200",
    hasError && "border-destructive focus:border-destructive",
    isValid && "border-green-500 focus:border-green-500",
    className
  );

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
      "aria-describedby": hasError ? `${name}-error` : description ? `${name}-description` : undefined,
    };

    if (type === "select") {
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

    if (type === "textWithSuggestions") {
      return (
        <div className="relative">
          <Input 
            {...baseProps} 
            ref={inputRef}
            aria-invalid={hasError ? "true" : "false"} 
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
              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
            >
              {filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
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

    if (type === "textarea") {
      return (
        <Textarea
          {...baseProps}
          aria-invalid={hasError ? "true" : "false"}
          className={cn(baseProps.className, "min-h-20 resize-y")}
        />
      );
    }

    return <Input {...baseProps} aria-invalid={hasError ? "true" : "false"} type={type} />;
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Label 
          htmlFor={name} 
          className={cn(
            "text-sm font-medium transition-colors",
            hasError && "text-destructive",
            isValid && "text-green-600"
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
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
        
        {/* Status indicator */}
        {touched && (
          <div className="flex items-center">
            {hasError ? (
              <AlertCircle className="h-4 w-4 text-destructive" />
            ) : value.length > 0 ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : null}
          </div>
        )}
      </div>

      {description && !hasError && (
        <p id={`${name}-description`} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}

      <div className="relative">
        {renderInput()}
        
        {/* Loading or validation indicators */}
        {touched && value.length > 0 && !hasError && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <div 
          id={`${name}-error`} 
          className="flex items-center gap-2 text-sm text-destructive animate-in slide-in-from-left-1 duration-200"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FormField;
