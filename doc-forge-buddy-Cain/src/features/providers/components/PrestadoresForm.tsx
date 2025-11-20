import React, { useState } from 'react';
import { CreatePrestadorData } from '@/types/business';

interface PrestadoresFormProps {
  onSubmit: (data: CreatePrestadorData) => void | Promise<any>;
}

export const PrestadoresForm: React.FC<PrestadoresFormProps> = ({ onSubmit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [especialidade, setEspecialidade] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nome && especialidade) {
      onSubmit({
        nome,
        especialidade,
        telefone: '',
        email: '',
        endereco: '',
        ativo: true,
      });
      setNome('');
      setEspecialidade('');
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600"
      >
        +
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">Novo Prestador</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Especialidade</label>
            <input
              type="text"
              value={especialidade}
              onChange={(e) => setEspecialidade(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
