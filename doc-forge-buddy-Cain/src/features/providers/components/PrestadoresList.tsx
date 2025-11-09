import React from 'react';
import { Prestador } from '@/types/business';

interface PrestadoresListProps {
  prestadores: Prestador[];
  loading: boolean;
  error: string | null;
  onEdit: (prestador: Prestador) => void;
  onDelete: (id: string) => void;
  onCopy: (prestador: Prestador) => void;
}

export const PrestadoresList: React.FC<PrestadoresListProps> = ({
  prestadores,
  loading,
  error,
  onEdit,
  onDelete,
  onCopy,
}) => {
  if (loading) {
    return <div className="text-center py-8">Carregando prestadores...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Erro: {error}</div>;
  }

  if (prestadores.length === 0) {
    return <div className="text-center py-8 text-neutral-500">Nenhum prestador encontrado</div>;
  }

  return (
    <div className="space-y-4">
      {prestadores.map((prestador) => (
        <div key={prestador.id} className="bg-white rounded-lg p-4 border">
          <h3 className="text-lg font-semibold">{prestador.nome}</h3>
          <p className="text-neutral-600">{prestador.especialidade}</p>
          <div className="mt-2 space-x-2">
            <button
              onClick={() => onEdit(prestador)}
              className="px-3 py-1 bg-blue-500 text-white rounded"
            >
              Editar
            </button>
            <button
              onClick={() => onDelete(prestador.id)}
              className="px-3 py-1 bg-red-500 text-white rounded"
            >
              Excluir
            </button>
            <button
              onClick={() => onCopy(prestador)}
              className="px-3 py-1 bg-gray-500 text-white rounded"
            >
              Copiar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};