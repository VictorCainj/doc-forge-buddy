import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { log } from '@/utils/logger';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Trash2, AlertTriangle, FileText } from '@/utils/iconMapper';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Contract } from '@/types/contract';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ContractsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(
    null
  );
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Buscar contratos
  const { data: contracts, isLoading } = useQuery({
    queryKey: ['admin-contracts', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('saved_terms')
        .select('*')
        .eq('document_type', 'contrato')
        .order('created_at', { ascending: false });

      // Aplicar busca se houver termo
      if (searchTerm.trim()) {
        query = query.or(
          `title.ilike.%${searchTerm}%,form_data->>numeroContrato.ilike.%${searchTerm}%,form_data->>nomeLocatario.ilike.%${searchTerm}%,form_data->>nomeProprietario.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      // Processar dados dos contratos
      return (data || []).map((contract) => ({
        ...contract,
        form_data:
          typeof contract.form_data === 'string'
            ? JSON.parse(contract.form_data)
            : contract.form_data || {},
      })) as Contract[];
    },
  });

  // Mutation para deletar contrato
  const deleteMutation = useMutation({
    mutationFn: async (contractId: string) => {
      // Deletar também as contas de consumo relacionadas
      const { error: billsError } = await supabase
        .from('contract_bills')
        .delete()
        .eq('contract_id', contractId);

      if (billsError) {
        log.warn('Erro ao deletar contas de consumo:', billsError);
        // Continua mesmo se não conseguir deletar as bills
      }

      // Deletar o contrato
      const { error } = await supabase
        .from('saved_terms')
        .delete()
        .eq('id', contractId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contrato excluído com sucesso');
      setConfirmDialogOpen(false);
      setContractToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir contrato: ${error.message}`);
    },
  });

  const handleDeleteClick = (contract: Contract) => {
    setContractToDelete(contract);
    setConfirmDialogOpen(true);
  };

  const confirmDelete = () => {
    if (contractToDelete) {
      deleteMutation.mutate(contractToDelete.id);
    }
  };

  const getContractNumber = (contract: Contract) => {
    return contract.form_data?.numeroContrato || '[NÚMERO NÃO DEFINIDO]';
  };

  const getLocatario = (contract: Contract) => {
    return contract.form_data?.nomeLocatario || 'N/A';
  };

  const getProprietario = (contract: Contract) => {
    return contract.form_data?.nomeProprietario || 'N/A';
  };

  const getEndereco = (contract: Contract) => {
    return (
      contract.form_data?.enderecoImovel ||
      contract.form_data?.endereco ||
      'N/A'
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Busca */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-neutral-900">
            Gestão de Contratos
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Visualize e exclua contratos do sistema
          </p>
        </div>

        {/* Busca */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por número, locatário, proprietário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      {/* Tabela de Contratos */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-neutral-600 mt-4">Carregando contratos...</p>
          </div>
        ) : !contracts || contracts.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600">
              {searchTerm
                ? 'Nenhum contrato encontrado com os termos de busca'
                : 'Nenhum contrato cadastrado'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50">
                  <TableHead className="font-semibold text-neutral-900">
                    Número do Contrato
                  </TableHead>
                  <TableHead className="font-semibold text-neutral-900">
                    Locatário
                  </TableHead>
                  <TableHead className="font-semibold text-neutral-900">
                    Proprietário
                  </TableHead>
                  <TableHead className="font-semibold text-neutral-900">
                    Endereço
                  </TableHead>
                  <TableHead className="font-semibold text-neutral-900">
                    Data de Criação
                  </TableHead>
                  <TableHead className="font-semibold text-neutral-900 text-right">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow
                    key={contract.id}
                    className="hover:bg-neutral-50 transition-colors"
                  >
                    <TableCell className="font-mono font-semibold text-neutral-900">
                      {getContractNumber(contract)}
                    </TableCell>
                    <TableCell className="text-neutral-700">
                      {getLocatario(contract)}
                    </TableCell>
                    <TableCell className="text-neutral-700">
                      {getProprietario(contract)}
                    </TableCell>
                    <TableCell className="text-neutral-600 text-sm max-w-xs truncate">
                      {getEndereco(contract)}
                    </TableCell>
                    <TableCell className="text-neutral-600 text-sm">
                      {contract.created_at
                        ? format(
                            new Date(contract.created_at),
                            "dd/MM/yyyy 'às' HH:mm",
                            { locale: ptBR }
                          )
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(contract)}
                        className="text-error-600 hover:text-error-700 hover:bg-error-50"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Dialog de Confirmação */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-error-100">
                <AlertTriangle className="h-5 w-5 text-error-600" />
              </div>
              <AlertDialogTitle className="text-xl">
                Confirmar Exclusão
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base pt-2">
              Tem certeza que deseja excluir o contrato{' '}
              <span className="font-semibold text-neutral-900">
                {contractToDelete && getContractNumber(contractToDelete)}
              </span>
              ?
              <br />
              <br />
              Esta ação não pode ser desfeita. Todos os dados relacionados a
              este contrato, incluindo contas de consumo, serão permanentemente
              excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-error-600 hover:bg-error-700 text-white"
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir Contrato'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
