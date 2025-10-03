import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  Printer,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePrint } from '@/hooks/usePrint';
import { generateDocx, downloadDocx } from '@/utils/docxGenerator';

interface ItemOrcamento {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

interface DadosPrestador {
  nome: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email: string;
}

interface DadosCliente {
  nome: string;
  cpfCnpj: string;
  endereco: string;
  telefone: string;
  email: string;
}

const CriarOrcamento = () => {
  const navigate = useNavigate();
  const { printContent } = usePrint();

  const [dadosPrestador, setDadosPrestador] = useState<DadosPrestador>({
    nome: '',
    cnpj: '',
    endereco: '',
    telefone: '',
    email: '',
  });

  const [dadosCliente, setDadosCliente] = useState<DadosCliente>({
    nome: '',
    cpfCnpj: '',
    endereco: '',
    telefone: '',
    email: '',
  });

  const [numeroOrcamento, setNumeroOrcamento] = useState('');
  const [dataValidade, setDataValidade] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [itens, setItens] = useState<ItemOrcamento[]>([
    {
      id: '1',
      descricao: '',
      quantidade: 1,
      valorUnitario: 0,
      valorTotal: 0,
    },
  ]);

  const adicionarItem = () => {
    const novoItem: ItemOrcamento = {
      id: Date.now().toString(),
      descricao: '',
      quantidade: 1,
      valorUnitario: 0,
      valorTotal: 0,
    };
    setItens([...itens, novoItem]);
  };

  const removerItem = (id: string) => {
    if (itens.length === 1) {
      toast.error('É necessário ter pelo menos um item no orçamento');
      return;
    }
    setItens(itens.filter((item) => item.id !== id));
    toast.success('Item removido com sucesso');
  };

  const atualizarItem = (
    id: string,
    campo: keyof ItemOrcamento,
    valor: string | number
  ) => {
    setItens(
      itens.map((item) => {
        if (item.id === id) {
          const itemAtualizado = { ...item, [campo]: valor };
          
          // Recalcular valor total
          if (campo === 'quantidade' || campo === 'valorUnitario') {
            itemAtualizado.valorTotal =
              itemAtualizado.quantidade * itemAtualizado.valorUnitario;
          }
          
          return itemAtualizado;
        }
        return item;
      })
    );
  };

  const calcularTotal = () => {
    return itens.reduce((acc, item) => acc + item.valorTotal, 0);
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const gerarHTML = () => {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const total = calcularTotal();

    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
        <!-- Cabeçalho -->
        <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #2563eb;">
          <h1 style="color: #1e40af; margin: 0; font-size: 32px; font-weight: bold;">ORÇAMENTO</h1>
          <p style="color: #64748b; margin: 10px 0 0 0; font-size: 14px;">Nº ${numeroOrcamento || '[Número do Orçamento]'}</p>
          <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Data: ${dataAtual}</p>
          ${dataValidade ? `<p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Válido até: ${new Date(dataValidade).toLocaleDateString('pt-BR')}</p>` : ''}
        </div>

        <!-- Dados do Prestador -->
        <div style="margin-bottom: 30px; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
          <h2 style="color: #1e40af; font-size: 18px; margin: 0 0 15px 0; font-weight: bold;">Prestador de Serviço</h2>
          <div style="line-height: 1.8; color: #334155;">
            <p style="margin: 5px 0;"><strong>Nome/Razão Social:</strong> ${dadosPrestador.nome || '[Nome do Prestador]'}</p>
            <p style="margin: 5px 0;"><strong>CNPJ/CPF:</strong> ${dadosPrestador.cnpj || '[CNPJ]'}</p>
            <p style="margin: 5px 0;"><strong>Endereço:</strong> ${dadosPrestador.endereco || '[Endereço]'}</p>
            <p style="margin: 5px 0;"><strong>Telefone:</strong> ${dadosPrestador.telefone || '[Telefone]'}</p>
            <p style="margin: 5px 0;"><strong>E-mail:</strong> ${dadosPrestador.email || '[E-mail]'}</p>
          </div>
        </div>

        <!-- Dados do Cliente -->
        <div style="margin-bottom: 30px; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
          <h2 style="color: #1e40af; font-size: 18px; margin: 0 0 15px 0; font-weight: bold;">Cliente</h2>
          <div style="line-height: 1.8; color: #334155;">
            <p style="margin: 5px 0;"><strong>Nome/Razão Social:</strong> ${dadosCliente.nome || '[Nome do Cliente]'}</p>
            <p style="margin: 5px 0;"><strong>CPF/CNPJ:</strong> ${dadosCliente.cpfCnpj || '[CPF/CNPJ]'}</p>
            <p style="margin: 5px 0;"><strong>Endereço:</strong> ${dadosCliente.endereco || '[Endereço]'}</p>
            <p style="margin: 5px 0;"><strong>Telefone:</strong> ${dadosCliente.telefone || '[Telefone]'}</p>
            <p style="margin: 5px 0;"><strong>E-mail:</strong> ${dadosCliente.email || '[E-mail]'}</p>
          </div>
        </div>

        <!-- Itens do Orçamento -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1e40af; font-size: 18px; margin: 0 0 15px 0; font-weight: bold;">Itens do Orçamento</h2>
          <table style="width: 100%; border-collapse: collapse; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background-color: #1e40af; color: white;">
                <th style="padding: 12px; text-align: left; font-size: 14px;">Descrição</th>
                <th style="padding: 12px; text-align: center; font-size: 14px; width: 100px;">Qtd.</th>
                <th style="padding: 12px; text-align: right; font-size: 14px; width: 120px;">Valor Unit.</th>
                <th style="padding: 12px; text-align: right; font-size: 14px; width: 120px;">Valor Total</th>
              </tr>
            </thead>
            <tbody>
              ${itens
                .map(
                  (item, index) => `
                <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 12px; color: #334155;">${item.descricao || '[Descrição do item]'}</td>
                  <td style="padding: 12px; text-align: center; color: #334155;">${item.quantidade}</td>
                  <td style="padding: 12px; text-align: right; color: #334155;">${formatarMoeda(item.valorUnitario)}</td>
                  <td style="padding: 12px; text-align: right; color: #334155; font-weight: 600;">${formatarMoeda(item.valorTotal)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
            <tfoot>
              <tr style="background-color: #1e40af; color: white;">
                <td colspan="3" style="padding: 15px; text-align: right; font-size: 16px; font-weight: bold;">TOTAL:</td>
                <td style="padding: 15px; text-align: right; font-size: 18px; font-weight: bold;">${formatarMoeda(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        ${
          observacoes
            ? `
        <!-- Observações -->
        <div style="margin-bottom: 30px; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
          <h2 style="color: #92400e; font-size: 16px; margin: 0 0 10px 0; font-weight: bold;">Observações</h2>
          <p style="color: #78350f; margin: 0; line-height: 1.6; white-space: pre-line;">${observacoes}</p>
        </div>
        `
            : ''
        }

        <!-- Rodapé -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center;">
          <p style="color: #64748b; font-size: 12px; margin: 5px 0;">
            Este orçamento é válido por ${dataValidade ? `até ${new Date(dataValidade).toLocaleDateString('pt-BR')}` : '30 dias'} e não representa compromisso formal até a assinatura do contrato.
          </p>
          <p style="color: #64748b; font-size: 12px; margin: 5px 0;">
            Gerado em ${dataAtual} - DocForge Enterprise Suite
          </p>
        </div>
      </div>
    `;
  };

  const handleImprimir = () => {
    if (!validarFormulario()) return;

    const html = gerarHTML();
    printContent(html, {
      title: `Orçamento ${numeroOrcamento || 'Sem Número'}`,
      fontSize: 12,
    });
    toast.success('Preparando impressão...');
  };

  const handleBaixarDOCX = async () => {
    if (!validarFormulario()) return;

    try {
      const html = gerarHTML();
      const blob = await generateDocx({
        title: `ORÇAMENTO Nº ${numeroOrcamento || '[Número]'}`,
        date: new Date().toLocaleDateString('pt-BR'),
        content: html,
        signatures: {
          name1: dadosPrestador.nome || '[Prestador]',
          name2: dadosCliente.nome || '[Cliente]',
        },
      });

      downloadDocx(blob, `orcamento_${numeroOrcamento || 'sem_numero'}.docx`);
      toast.success('Documento DOCX gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar documento DOCX');
      console.error(error);
    }
  };

  const validarFormulario = () => {
    if (!dadosPrestador.nome || !dadosPrestador.cnpj) {
      toast.error('Preencha os dados básicos do prestador');
      return false;
    }

    if (!dadosCliente.nome) {
      toast.error('Preencha o nome do cliente');
      return false;
    }

    if (!numeroOrcamento) {
      toast.error('Informe o número do orçamento');
      return false;
    }

    const temItemValido = itens.some(
      (item) => item.descricao && item.valorUnitario > 0
    );

    if (!temItemValido) {
      toast.error('Adicione pelo menos um item válido ao orçamento');
      return false;
    }

    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-accent"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                Criar Orçamento
              </h1>
              <p className="text-muted-foreground mt-1">
                Gere orçamentos profissionais de forma rápida e eficiente
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleImprimir} variant="outline" className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button onClick={handleBaixarDOCX} className="gap-2">
              <Download className="h-4 w-4" />
              Baixar DOCX
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="numeroOrcamento">Número do Orçamento *</Label>
                <Input
                  id="numeroOrcamento"
                  value={numeroOrcamento}
                  onChange={(e) => setNumeroOrcamento(e.target.value)}
                  placeholder="Ex: 2024-001"
                />
              </div>
              <div>
                <Label htmlFor="dataValidade">Válido Até</Label>
                <Input
                  id="dataValidade"
                  type="date"
                  value={dataValidade}
                  onChange={(e) => setDataValidade(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dados do Prestador */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Prestador</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prestadorNome">Nome/Razão Social *</Label>
                <Input
                  id="prestadorNome"
                  value={dadosPrestador.nome}
                  onChange={(e) =>
                    setDadosPrestador({ ...dadosPrestador, nome: e.target.value })
                  }
                  placeholder="Nome completo ou razão social"
                />
              </div>
              <div>
                <Label htmlFor="prestadorCNPJ">CNPJ/CPF *</Label>
                <Input
                  id="prestadorCNPJ"
                  value={dadosPrestador.cnpj}
                  onChange={(e) =>
                    setDadosPrestador({ ...dadosPrestador, cnpj: e.target.value })
                  }
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="prestadorEndereco">Endereço</Label>
                <Input
                  id="prestadorEndereco"
                  value={dadosPrestador.endereco}
                  onChange={(e) =>
                    setDadosPrestador({
                      ...dadosPrestador,
                      endereco: e.target.value,
                    })
                  }
                  placeholder="Endereço completo"
                />
              </div>
              <div>
                <Label htmlFor="prestadorTelefone">Telefone</Label>
                <Input
                  id="prestadorTelefone"
                  value={dadosPrestador.telefone}
                  onChange={(e) =>
                    setDadosPrestador({
                      ...dadosPrestador,
                      telefone: e.target.value,
                    })
                  }
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label htmlFor="prestadorEmail">E-mail</Label>
                <Input
                  id="prestadorEmail"
                  type="email"
                  value={dadosPrestador.email}
                  onChange={(e) =>
                    setDadosPrestador({ ...dadosPrestador, email: e.target.value })
                  }
                  placeholder="email@exemplo.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Dados do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clienteNome">Nome/Razão Social *</Label>
                <Input
                  id="clienteNome"
                  value={dadosCliente.nome}
                  onChange={(e) =>
                    setDadosCliente({ ...dadosCliente, nome: e.target.value })
                  }
                  placeholder="Nome do cliente"
                />
              </div>
              <div>
                <Label htmlFor="clienteCPF">CPF/CNPJ</Label>
                <Input
                  id="clienteCPF"
                  value={dadosCliente.cpfCnpj}
                  onChange={(e) =>
                    setDadosCliente({ ...dadosCliente, cpfCnpj: e.target.value })
                  }
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="clienteEndereco">Endereço</Label>
                <Input
                  id="clienteEndereco"
                  value={dadosCliente.endereco}
                  onChange={(e) =>
                    setDadosCliente({ ...dadosCliente, endereco: e.target.value })
                  }
                  placeholder="Endereço completo"
                />
              </div>
              <div>
                <Label htmlFor="clienteTelefone">Telefone</Label>
                <Input
                  id="clienteTelefone"
                  value={dadosCliente.telefone}
                  onChange={(e) =>
                    setDadosCliente({ ...dadosCliente, telefone: e.target.value })
                  }
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label htmlFor="clienteEmail">E-mail</Label>
                <Input
                  id="clienteEmail"
                  type="email"
                  value={dadosCliente.email}
                  onChange={(e) =>
                    setDadosCliente({ ...dadosCliente, email: e.target.value })
                  }
                  placeholder="email@exemplo.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Itens do Orçamento */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Itens do Orçamento</CardTitle>
              <Button onClick={adicionarItem} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {itens.map((item) => (
                <div
                  key={item.id}
                  className="grid md:grid-cols-12 gap-4 p-4 border rounded-lg bg-card"
                >
                  <div className="md:col-span-5">
                    <Label>Descrição</Label>
                    <Input
                      value={item.descricao}
                      onChange={(e) =>
                        atualizarItem(item.id, 'descricao', e.target.value)
                      }
                      placeholder="Descrição do item/serviço"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantidade}
                      onChange={(e) =>
                        atualizarItem(
                          item.id,
                          'quantidade',
                          parseInt(e.target.value) || 1
                        )
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Valor Unitário</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.valorUnitario}
                      onChange={(e) =>
                        atualizarItem(
                          item.id,
                          'valorUnitario',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Valor Total</Label>
                    <Input
                      value={formatarMoeda(item.valorTotal)}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removerItem(item.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">
                    Valor Total do Orçamento
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {formatarMoeda(calcularTotal())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações importantes sobre o orçamento, condições de pagamento, prazos de execução, etc."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CriarOrcamento;
