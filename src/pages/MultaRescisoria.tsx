import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Calculator, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CalculationResult {
  multa: number;
  mesesRestantes: number;
  isValid: boolean;
  errorMessage?: string;
}

const MultaRescisoria = () => {
  const [aluguel, setAluguel] = useState<string>('');
  const [multaContrato, setMultaContrato] = useState<string>('');
  const [prazoTotal, setPrazoTotal] = useState<string>('');
  const [mesesCumpridos, setMesesCumpridos] = useState<string>('');
  const [dataEntrada, setDataEntrada] = useState<string>('');
  const [dataNotificacao, setDataNotificacao] = useState<string>('');
  const [usarCalculoAutomatico, setUsarCalculoAutomatico] =
    useState<boolean>(false);
  const [resultado, setResultado] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Função para calcular meses entre duas datas
  const calcularMesesEntreDatas = (
    dataInicio: string,
    dataFim: string
  ): number => {
    if (!dataInicio || !dataFim) return 0;

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    if (fim <= inicio) return 0;

    const diffTime = fim.getTime() - inicio.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Calcular meses considerando dias parciais
    const mesesCompletos = Math.floor(diffDays / 30);
    const diasRestantes = diffDays % 30;

    // Se restam mais de 15 dias, considerar como mês completo
    if (diasRestantes > 15) {
      return mesesCompletos + 1;
    }

    return mesesCompletos;
  };

  // Função para validar entrada
  const validateInput = (): { isValid: boolean; errorMessage?: string } => {
    const aluguelValue = parseFloat(aluguel);
    const multaValue = parseFloat(multaContrato);
    const prazoValue = parseInt(prazoTotal);

    // Validar campos básicos
    if (!aluguel || !multaContrato || !prazoTotal) {
      return {
        isValid: false,
        errorMessage:
          'Aluguel, multa contratual e prazo total são obrigatórios',
      };
    }

    // Validar cálculo automático vs manual
    if (usarCalculoAutomatico) {
      if (!dataEntrada || !dataNotificacao) {
        return {
          isValid: false,
          errorMessage:
            'Data de entrada e data de notificação são obrigatórias para cálculo automático',
        };
      }

      const dataEntradaObj = new Date(dataEntrada);
      const dataNotificacaoObj = new Date(dataNotificacao);

      if (
        isNaN(dataEntradaObj.getTime()) ||
        isNaN(dataNotificacaoObj.getTime())
      ) {
        return {
          isValid: false,
          errorMessage: 'Datas inválidas fornecidas',
        };
      }

      if (dataNotificacaoObj <= dataEntradaObj) {
        return {
          isValid: false,
          errorMessage:
            'A data de notificação deve ser posterior à data de entrada',
        };
      }
    } else {
      if (!mesesCumpridos) {
        return {
          isValid: false,
          errorMessage: 'Meses cumpridos são obrigatórios',
        };
      }
    }

    if (isNaN(aluguelValue) || aluguelValue <= 0) {
      return {
        isValid: false,
        errorMessage: 'O valor do aluguel deve ser um número positivo',
      };
    }

    if (isNaN(multaValue) || multaValue <= 0) {
      return {
        isValid: false,
        errorMessage:
          'A multa deve ser um número positivo (quantidade de aluguéis)',
      };
    }

    if (isNaN(prazoValue) || prazoValue <= 0) {
      return {
        isValid: false,
        errorMessage: 'O prazo total deve ser um número positivo (meses)',
      };
    }

    // Calcular meses cumpridos
    let cumpridosValue: number;
    if (usarCalculoAutomatico) {
      cumpridosValue = calcularMesesEntreDatas(dataEntrada, dataNotificacao);
    } else {
      cumpridosValue = parseInt(mesesCumpridos);
    }

    if (isNaN(cumpridosValue) || cumpridosValue < 0) {
      return {
        isValid: false,
        errorMessage: 'Os meses cumpridos devem ser um número não negativo',
      };
    }

    if (cumpridosValue >= prazoValue) {
      return {
        isValid: false,
        errorMessage:
          'Os meses cumpridos devem ser menores que o prazo total do contrato',
      };
    }

    return { isValid: true };
  };

  // Função para calcular a multa
  const calcularMulta = (): CalculationResult => {
    const validation = validateInput();
    if (!validation.isValid) {
      return {
        multa: 0,
        mesesRestantes: 0,
        isValid: false,
        errorMessage: validation.errorMessage,
      };
    }

    const aluguelValue = parseFloat(aluguel);
    const multaValue = parseFloat(multaContrato);
    const prazoValue = parseInt(prazoTotal);

    // Calcular meses cumpridos
    const cumpridosValue = usarCalculoAutomatico
      ? calcularMesesEntreDatas(dataEntrada, dataNotificacao)
      : parseInt(mesesCumpridos);

    const mesesRestantes = prazoValue - cumpridosValue;
    const multa = aluguelValue * multaValue * (mesesRestantes / prazoValue);

    return {
      multa: Math.max(0, multa), // Garantir que não seja negativo
      mesesRestantes,
      isValid: true,
    };
  };

  const handleCalculate = () => {
    setIsCalculating(true);

    // Simular um pequeno delay para melhor UX
    setTimeout(() => {
      const result = calcularMulta();
      setResultado(result);
      setIsCalculating(false);

      if (result.isValid) {
        toast.success('Cálculo realizado com sucesso!');
      } else {
        toast.error(result.errorMessage || 'Erro no cálculo');
      }
    }, 500);
  };

  const handleClear = () => {
    setAluguel('');
    setMultaContrato('');
    setPrazoTotal('');
    setMesesCumpridos('');
    setDataEntrada('');
    setDataNotificacao('');
    setUsarCalculoAutomatico(false);
    setResultado(null);
    toast.info('Campos limpos');
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
          <Calculator className="h-8 w-8 text-blue-600" />
          Calculadora de Multa Rescisória
        </h1>
        <p className="text-gray-600">
          Calcule o valor da multa rescisória para contratos de locação baseado
          na fórmula legal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Dados do Contrato
            </CardTitle>
            <CardDescription>
              Preencha as informações do contrato para calcular a multa
              rescisória.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Valor do Aluguel */}
            <div className="space-y-2">
              <Label
                htmlFor="aluguel"
                className="text-sm font-medium text-gray-700"
              >
                Valor do Aluguel Mensal (R$)
              </Label>
              <Input
                id="aluguel"
                type="number"
                step="0.01"
                min="0"
                value={aluguel}
                onChange={(e) => setAluguel(e.target.value)}
                placeholder="Ex: 1500.00"
                className="w-full"
              />
            </div>

            {/* Multa prevista no contrato */}
            <div className="space-y-2">
              <Label
                htmlFor="multa"
                className="text-sm font-medium text-gray-700"
              >
                Multa Prevista no Contrato (quantidade de aluguéis)
              </Label>
              <Input
                id="multa"
                type="number"
                step="0.1"
                min="0"
                value={multaContrato}
                onChange={(e) => setMultaContrato(e.target.value)}
                placeholder="Ex: 3 (para 3 aluguéis)"
                className="w-full"
              />
            </div>

            {/* Prazo total do contrato */}
            <div className="space-y-2">
              <Label
                htmlFor="prazo"
                className="text-sm font-medium text-gray-700"
              >
                Prazo Total do Contrato (meses)
              </Label>
              <Input
                id="prazo"
                type="number"
                min="1"
                value={prazoTotal}
                onChange={(e) => setPrazoTotal(e.target.value)}
                placeholder="Ex: 30 (para 30 meses)"
                className="w-full"
              />
            </div>

            {/* Tempo já cumprido */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="calculoAutomatico"
                  checked={usarCalculoAutomatico}
                  onCheckedChange={(checked) =>
                    setUsarCalculoAutomatico(checked as boolean)
                  }
                />
                <Label
                  htmlFor="calculoAutomatico"
                  className="text-sm font-medium text-gray-700"
                >
                  Calcular automaticamente baseado nas datas
                </Label>
              </div>

              {usarCalculoAutomatico ? (
                <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                  <div className="space-y-2">
                    <Label
                      htmlFor="dataEntrada"
                      className="text-sm font-medium text-gray-700"
                    >
                      Data de Entrada no Imóvel
                    </Label>
                    <Input
                      id="dataEntrada"
                      type="date"
                      value={dataEntrada}
                      onChange={(e) => setDataEntrada(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="dataNotificacao"
                      className="text-sm font-medium text-gray-700"
                    >
                      Data de Notificação de Rescisão
                    </Label>
                    <Input
                      id="dataNotificacao"
                      type="date"
                      value={dataNotificacao}
                      onChange={(e) => setDataNotificacao(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  {dataEntrada && dataNotificacao && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>Tempo cumprido calculado:</strong>{' '}
                        {calcularMesesEntreDatas(dataEntrada, dataNotificacao)}{' '}
                        meses
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label
                    htmlFor="cumpridos"
                    className="text-sm font-medium text-gray-700"
                  >
                    Tempo Já Cumprido pelo Inquilino (meses)
                  </Label>
                  <Input
                    id="cumpridos"
                    type="number"
                    min="0"
                    value={mesesCumpridos}
                    onChange={(e) => setMesesCumpridos(e.target.value)}
                    placeholder="Ex: 12 (para 1 ano)"
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCalculate}
                disabled={isCalculating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isCalculating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Calculando...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    Calcular Multa
                  </>
                )}
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                className="flex-1"
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultado */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Resultado do Cálculo
            </CardTitle>
            <CardDescription>
              Valor da multa rescisória calculado conforme a fórmula legal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resultado ? (
              <div className="space-y-6">
                {resultado.isValid ? (
                  <>
                    {/* Resultado Principal */}
                    <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-green-900 mb-2">
                        Multa Rescisória
                      </h3>
                      <p className="text-4xl font-bold text-green-700">
                        {formatCurrency(resultado.multa)}
                      </p>
                    </div>

                    {/* Detalhes do Cálculo */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">
                        Detalhes do Cálculo:
                      </h4>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-600">Meses Cumpridos:</p>
                          <p className="font-semibold text-gray-900">
                            {usarCalculoAutomatico
                              ? `${calcularMesesEntreDatas(dataEntrada, dataNotificacao)} meses`
                              : `${mesesCumpridos} meses`}
                            {usarCalculoAutomatico && (
                              <span className="text-xs text-blue-600 block">
                                (calculado automaticamente)
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-600">Meses Restantes:</p>
                          <p className="font-semibold text-gray-900">
                            {resultado.mesesRestantes} meses
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-600">Aluguel Mensal:</p>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(parseFloat(aluguel))}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-600">Multa Contratual:</p>
                          <p className="font-semibold text-gray-900">
                            {multaContrato} aluguéis
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-600">Prazo Total:</p>
                          <p className="font-semibold text-gray-900">
                            {prazoTotal} meses
                          </p>
                        </div>
                        {usarCalculoAutomatico && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-600">Período:</p>
                            <p className="font-semibold text-gray-900 text-xs">
                              {dataEntrada} até {dataNotificacao}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fórmula - Ícone de Ajuda */}
                    <div className="flex items-center justify-center pt-4">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                              <HelpCircle className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-md p-4">
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900">
                                Fórmula Aplicada:
                              </h4>
                              <p className="text-sm text-gray-800">
                                <strong>
                                  Multa = (Aluguel × Nº de aluguéis de multa) ×
                                  (Meses restantes / Prazo total)
                                </strong>
                              </p>
                              <div className="space-y-2 text-sm text-gray-700">
                                <p>
                                  Multa = ({formatCurrency(parseFloat(aluguel))}{' '}
                                  × {multaContrato}) × (
                                  {resultado.mesesRestantes} / {prazoTotal})
                                </p>
                                <p>
                                  Multa ={' '}
                                  {formatCurrency(
                                    parseFloat(aluguel) *
                                      parseFloat(multaContrato)
                                  )}{' '}
                                  ×{' '}
                                  {(
                                    resultado.mesesRestantes /
                                    parseInt(prazoTotal)
                                  ).toFixed(4)}
                                </p>
                              </div>
                              {usarCalculoAutomatico && (
                                <p className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                                  * Meses cumpridos calculados automaticamente:{' '}
                                  {calcularMesesEntreDatas(
                                    dataEntrada,
                                    dataNotificacao
                                  )}{' '}
                                  meses
                                  <br />
                                  (Período: {dataEntrada} até {dataNotificacao})
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-red-900 mb-2">
                      Erro no Cálculo
                    </h3>
                    <p className="text-red-700">{resultado.errorMessage}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500">
                <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>
                  Preencha os dados do contrato e clique em "Calcular Multa"
                  para ver o resultado.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MultaRescisoria;
