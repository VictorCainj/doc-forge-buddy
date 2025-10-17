/**
 * Componente para exibir força da senha em tempo real
 */

import React, { useState, useEffect, useMemo } from 'react';
import { validatePassword, estimateCrackTime } from '@/utils/passwordPolicy';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  showDetails?: boolean;
  className?: string;
  onStrengthChange?: (strength: string, score: number) => void;
}

export default function PasswordStrengthIndicator({
  password,
  showDetails = true,
  className,
  onStrengthChange,
}: PasswordStrengthIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);

  const validation = useMemo(() => {
    if (!password) {
      return {
        isValid: false,
        errors: [],
        strength: 'weak' as const,
        score: 0,
      };
    }
    return validatePassword(password);
  }, [password]);

  const crackTime = useMemo(() => {
    if (!password) return '';
    return estimateCrackTime(password);
  }, [password]);

  useEffect(() => {
    if (onStrengthChange) {
      onStrengthChange(validation.strength, validation.score);
    }
  }, [validation.strength, validation.score, onStrengthChange]);

  if (!password) {
    return null;
  }

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak':
        return 'bg-error-500';
      case 'medium':
        return 'bg-warning-500';
      case 'strong':
        return 'bg-success-500';
      case 'very-strong':
        return 'bg-primary-500';
      default:
        return 'bg-neutral-300';
    }
  };

  const getStrengthText = (strength: string) => {
    switch (strength) {
      case 'weak':
        return 'Fraca';
      case 'medium':
        return 'Média';
      case 'strong':
        return 'Forte';
      case 'very-strong':
        return 'Muito Forte';
      default:
        return '';
    }
  };

  const getStrengthIcon = (strength: string) => {
    switch (strength) {
      case 'weak':
        return '⚠️';
      case 'medium':
        return '⚡';
      case 'strong':
        return '🔒';
      case 'very-strong':
        return '🛡️';
      default:
        return '';
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Barra de força */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-700">
            Força da senha
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {getStrengthText(validation.strength)}
            </span>
            <span className="text-lg">
              {getStrengthIcon(validation.strength)}
            </span>
          </div>
        </div>

        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all duration-300 ease-in-out',
              getStrengthColor(validation.strength)
            )}
            style={{ width: `${validation.score}%` }}
          />
        </div>

        <div className="text-xs text-neutral-600">
          {validation.score}/100 pontos
        </div>
      </div>

      {/* Detalhes da validação */}
      {showDetails && (
        <div className="space-y-2">
          {/* Tempo para quebrar */}
          {crackTime && (
            <div className="text-xs text-neutral-600">
              <span className="font-medium">Tempo para quebrar:</span>{' '}
              {crackTime}
            </div>
          )}

          {/* Lista de erros */}
          {validation.errors.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-error-700">
                Requisitos não atendidos:
              </div>
              <ul className="text-xs text-error-600 space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-error-500 mt-0.5">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requisitos atendidos */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-success-700">
              Requisitos atendidos:
            </div>
            <div className="grid grid-cols-1 gap-1 text-xs">
              {password.length >= 12 && (
                <div className="flex items-center gap-2 text-success-600">
                  <span className="text-success-500">✓</span>
                  <span>Pelo menos 12 caracteres</span>
                </div>
              )}
              {/[A-Z]/.test(password) && (
                <div className="flex items-center gap-2 text-success-600">
                  <span className="text-success-500">✓</span>
                  <span>Letra maiúscula</span>
                </div>
              )}
              {/[a-z]/.test(password) && (
                <div className="flex items-center gap-2 text-success-600">
                  <span className="text-success-500">✓</span>
                  <span>Letra minúscula</span>
                </div>
              )}
              {/[0-9]/.test(password) && (
                <div className="flex items-center gap-2 text-success-600">
                  <span className="text-success-500">✓</span>
                  <span>Número</span>
                </div>
              )}
              {/[!@#$%^&*(),.?":{}|<>]/.test(password) && (
                <div className="flex items-center gap-2 text-success-600">
                  <span className="text-success-500">✓</span>
                  <span>Caractere especial</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Botão para mostrar/ocultar detalhes */}
      {!showDetails && (
        <button
          type="button"
          onClick={() => setIsVisible(!isVisible)}
          className="text-xs text-primary-600 hover:text-primary-700 transition-colors"
        >
          {isVisible ? 'Ocultar detalhes' : 'Mostrar detalhes'}
        </button>
      )}

      {/* Detalhes expandidos */}
      {!showDetails && isVisible && (
        <div className="mt-3 p-3 bg-neutral-50 rounded-lg space-y-2">
          <div className="text-xs text-neutral-600">
            <span className="font-medium">Tempo para quebrar:</span> {crackTime}
          </div>

          {validation.errors.length > 0 && (
            <div className="text-xs text-error-600">
              <div className="font-medium mb-1">Melhorias sugeridas:</div>
              <ul className="space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-error-500 mt-0.5">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Hook para usar o indicador de força de senha
 */
export function usePasswordStrength(password: string) {
  const [strength, setStrength] = useState<string>('weak');
  const [score, setScore] = useState<number>(0);

  useEffect(() => {
    if (!password) {
      setStrength('weak');
      setScore(0);
      return;
    }

    const validation = validatePassword(password);
    setStrength(validation.strength);
    setScore(validation.score);
  }, [password]);

  return {
    strength,
    score,
    isValid: score >= 60, // Considera válida se score >= 60 (strong ou very-strong)
    validation: password ? validatePassword(password) : null,
  };
}
