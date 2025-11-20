import { useState } from 'react';
import { usePrestadores } from '@/hooks/usePrestadores';
import { Prestador, CreatePrestadorData } from '@/types/business';
import { PrestadoresHeader } from '@/features/providers/components/PrestadoresHeader';
import { PrestadoresList } from '@/features/providers/components/PrestadoresList';
import { PrestadoresForm } from '@/features/providers/components/PrestadoresForm';
import { PrestadoresFilters } from '@/features/providers/components/PrestadoresFilters';

const Prestadores: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  const {
    prestadores,
    loading,
    createPrestador,
    updatePrestador,
    deletePrestador,
  } = usePrestadores();

  const handleCopyPrestador = async (prestador: Prestador) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, updated_at, user_id, ...dataToCopy } = prestador;

    const cleanData: CreatePrestadorData = {
      nome: `${dataToCopy.nome} (Cópia)`,
      cnpj: dataToCopy.cnpj || undefined,
      telefone: dataToCopy.telefone || undefined,
      email: dataToCopy.email || undefined,
      endereco: dataToCopy.endereco || undefined,
      especialidade: dataToCopy.especialidade || undefined,
      observacoes: dataToCopy.observacoes || undefined,
      ativo: dataToCopy.ativo,
    };

    await createPrestador(cleanData);
  };

  const handleUpdatePrestador = async (prestador: Prestador) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, updated_at, user_id, ...data } = prestador;

    const cleanData: Partial<CreatePrestadorData> = {
      ...data,
      cnpj: data.cnpj || undefined,
      telefone: data.telefone || undefined,
      email: data.email || undefined,
      endereco: data.endereco || undefined,
      especialidade: data.especialidade || undefined,
      observacoes: data.observacoes || undefined,
    };

    await updatePrestador(id, cleanData);
  };

  return (
    <div className='min-h-screen bg-neutral-50'>
      {/* Header */}
      <PrestadoresHeader />

      {/* Main Content */}
      <div className='px-8 py-6'>
        <div className='max-w-7xl mx-auto space-y-6'>
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
            error={null}
            onEdit={handleUpdatePrestador}
            onDelete={deletePrestador}
            onCopy={handleCopyPrestador}
          />
        </div>
      </div>

      {/* Floating Action Button for new prestador */}
      <PrestadoresForm onSubmit={createPrestador} />
    </div>
  );
};

export default Prestadores;
