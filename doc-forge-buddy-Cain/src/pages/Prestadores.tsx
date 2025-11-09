import { useState } from 'react';
import { usePrestadores } from '@/hooks/usePrestadores';
import { PrestadoresHeader } from '@/features/providers/components/PrestadoresHeader';
import { PrestadoresList } from '@/features/providers/components/PrestadoresList';
import { PrestadoresForm } from '@/features/providers/components/PrestadoresForm';
import { PrestadoresFilters } from '@/features/providers/components/PrestadoresFilters';

const Prestadores: React.FC = () => {
  const {
    prestadores,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    selectedSpecialty,
    setSelectedSpecialty,
    createPrestador,
    updatePrestador,
    deletePrestador,
    copyPrestador,
  } = usePrestadores();

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <PrestadoresHeader />
      
      {/* Main Content */}
      <div className="px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Filters */}
          <PrestadoresFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedSpecialty={selectedSpecialty}
            setSelectedSpecialty={setSelectedSpecialty}
            prestadores={prestadores}
          />

          {/* List */}
          <PrestadoresList
            prestadores={prestadores}
            loading={loading}
            error={error}
            onEdit={updatePrestador}
            onDelete={deletePrestador}
            onCopy={copyPrestador}
          />
        </div>
      </div>

      {/* Floating Action Button for new prestador */}
      <PrestadoresForm
        onSubmit={createPrestador}
      />
    </div>
  );
};

export default Prestadores;
