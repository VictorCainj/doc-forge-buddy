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
          .filter((l) => l.name);
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
          .filter((l) => l.name);
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
          .filter((f) => f.name);
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
      if (locadores.length > 0) {
        const nomesLocadoresArray = locadores.map((l) => l.name);
        const nomesLocadores =
          nomesLocadoresArray.length > 1
            ? nomesLocadoresArray.slice(0, -1).join(', ') +
              ' e ' +
              nomesLocadoresArray[nomesLocadoresArray.length - 1]
            : nomesLocadoresArray[0];

        updateField('nomeProprietario', nomesLocadores);
      } else {
        updateField('nomeProprietario', '');
      }

      // Atualizar dados dos locatários
      if (locatarios.length > 0) {
        const nomesLocatariosArray = locatarios.map((l) => l.name);
        const nomesLocatarios =
          nomesLocatariosArray.length > 1
            ? nomesLocatariosArray.slice(0, -1).join(', ') +
              ' e ' +
              nomesLocatariosArray[nomesLocatariosArray.length - 1]
            : nomesLocatariosArray[0];

        updateField('nomeLocatario', nomesLocatarios);

        // Definir primeiro, segundo, terceiro e quarto locatário
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
      if (fiadores.length > 0) {
        const nomesFiadoresArray = fiadores.map((f) => f.name);
        const nomesFiadores =
          nomesFiadoresArray.length > 1
            ? nomesFiadoresArray.slice(0, -1).join(', ') +
              ' e ' +
              nomesFiadoresArray[nomesFiadoresArray.length - 1]
            : nomesFiadoresArray[0];

        updateField('nomeFiador', nomesFiadores);
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
