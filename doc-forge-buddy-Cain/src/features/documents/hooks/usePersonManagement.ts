import { useState, useEffect } from 'react';
import { splitNames } from '@/utils/nameHelpers';

interface Person {
  id: string;
  name: string;
}

interface UsePersonManagementProps {
  initialData?: Record<string, string>;
  hasPersonManagerSteps: boolean;
  updateField: (field: string, value: string) => void;
}

interface UsePersonManagementReturn {
  locadores: Person[];
  locatarios: Person[];
  fiadores: Person[];
  setLocadores: React.Dispatch<React.SetStateAction<Person[]>>;
  setLocatarios: React.Dispatch<React.SetStateAction<Person[]>>;
  setFiadores: React.Dispatch<React.SetStateAction<Person[]>>;
}

/**
 * Hook para gerenciar locadores, locatários e fiadores
 */
export const usePersonManagement = ({
  initialData,
  hasPersonManagerSteps,
  updateField,
}: UsePersonManagementProps): UsePersonManagementReturn => {
  const [locadores, setLocadores] = useState<Person[]>([]);
  const [locatarios, setLocatarios] = useState<Person[]>([]);
  const [fiadores, setFiadores] = useState<Person[]>([]);

  // Inicializar dados das pessoas a partir dos dados existentes do formulário
  useEffect(() => {
    if (hasPersonManagerSteps && initialData) {
      // Inicializar locadores se houver dados
      if (initialData.nomeProprietario && locadores.length === 0) {
        const nomesLocadores = splitNames(initialData.nomeProprietario);
        const locadoresIniciais = nomesLocadores
          .map((nome, index) => ({
            id: `locador-${index}`,
            name: nome,
          }))
          .filter(l => l.name);
        if (locadoresIniciais.length > 0) {
          setLocadores(locadoresIniciais);
        }
      }

      // Inicializar locatários se houver dados
      if (initialData.nomeLocatario && locatarios.length === 0) {
        const nomesLocatarios = splitNames(initialData.nomeLocatario);
        const locatariosIniciais = nomesLocatarios
          .map((nome, index) => ({
            id: `locatario-${index}`,
            name: nome,
          }))
          .filter(l => l.name);
        if (locatariosIniciais.length > 0) {
          setLocatarios(locatariosIniciais);
        }
      }

      // Inicializar fiadores se houver dados
      if (initialData.nomeFiador && fiadores.length === 0) {
        const nomesFiadores = splitNames(initialData.nomeFiador);
        const fiadoresIniciais = nomesFiadores
          .map((nome, index) => ({
            id: `fiador-${index}`,
            name: nome,
          }))
          .filter(f => f.name);
        if (fiadoresIniciais.length > 0) {
          setFiadores(fiadoresIniciais);
        }
      }
    }
  }, [
    initialData,
    hasPersonManagerSteps,
    locadores.length,
    locatarios.length,
    fiadores.length,
  ]);

  // Sincronizar dados das pessoas com o formData
  useEffect(() => {
    if (hasPersonManagerSteps) {
      // Atualizar dados dos locadores
      // Cada locador é tratado individualmente, sem separadores
      if (locadores.length > 0) {
        // Usar apenas o primeiro nome para compatibilidade, mas manter campos individuais
        const primeiroNome = locadores[0]?.name || '';
        updateField('nomeProprietario', primeiroNome);
      } else {
        updateField('nomeProprietario', '');
      }

      // Atualizar dados dos locatários
      // Cada locatário é tratado individualmente, sem separadores
      if (locatarios.length > 0) {
        // Usar apenas o primeiro nome para compatibilidade, mas manter campos individuais
        const primeiroNome = locatarios[0]?.name || '';
        updateField('nomeLocatario', primeiroNome);

        // Definir primeiro, segundo, terceiro e quarto locatário individualmente
        updateField('primeiroLocatario', locatarios[0]?.name || '');
        updateField('segundoLocatario', locatarios[1]?.name || '');
        updateField('terceiroLocatario', locatarios[2]?.name || '');
        updateField('quartoLocatario', locatarios[3]?.name || '');
      } else {
        updateField('nomeLocatario', '');
        updateField('primeiroLocatario', '');
        updateField('segundoLocatario', '');
        updateField('terceiroLocatario', '');
        updateField('quartoLocatario', '');
      }

      // Atualizar dados dos fiadores
      // Cada fiador é tratado individualmente, sem separadores
      if (fiadores.length > 0) {
        // Usar apenas o primeiro nome para compatibilidade, mas manter campos individuais
        const primeiroNome = fiadores[0]?.name || '';
        updateField('nomeFiador', primeiroNome);
      } else {
        updateField('nomeFiador', '');
      }
    }
  }, [locadores, locatarios, fiadores, hasPersonManagerSteps, updateField]);

  return {
    locadores,
    locatarios,
    fiadores,
    setLocadores,
    setLocatarios,
    setFiadores,
  };
};
