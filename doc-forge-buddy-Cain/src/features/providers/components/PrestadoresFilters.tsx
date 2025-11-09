import React from 'react';
import { Prestador } from '@/types/business';

interface PrestadoresFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedSpecialty: string;
  setSelectedSpecialty: (specialty: string) => void;
  prestadores: Prestador[];
}

export const PrestadoresFilters: React.FC<PrestadoresFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedSpecialty,
  setSelectedSpecialty,
  prestadores,
}) => {
  const especialidades = Array.from(new Set(prestadores.map(p => p.especialidade))).filter(Boolean);

  return (
    <div className="bg-white rounded-lg p-4 border space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Buscar</label>
          <input
            type="text"
            placeholder="Nome do prestador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="sm:w-48">
          <label className="block text-sm font-medium mb-1">Especialidade</label>
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Todas as especialidades</option>
            {especialidades.map((especialidade) => (
              <option key={especialidade} value={especialidade}>
                {especialidade}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};