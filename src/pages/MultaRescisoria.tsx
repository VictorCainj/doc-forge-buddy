import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CalculationResult {
  multa: number;
  anosRestantes: number;
  mesesRestantes: number;
  diasRestantes: number;
  isValid: boolean;
  errorMessage?: string;
}

const MultaRescisoria = () => {
  const [valorAluguel, setValorAluguel] = useState<string>('2.700,00');
  const [periodoTotal, setPeriodoTotal] = useState<string>('30');
  const [dataInicio, setDataInicio] = useState<string>('2024-12-27');
  const [dataFim, setDataFim] = useState<string>('2027-06-27');
  const [dataRescisao, setDataRescisao] = useState<string>('2025-09-12');
  const [mesesMulta, setMesesMulta] = useState<string>('3');
  const [resultado, setResultado] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Função para calcular diferença entre datas
  const calcularDiferencaDatas = (dataInicio: string, dataFim: string) => {
    if (!dataInicio || !dataFim) return { anos: 0, meses: 0, dias: 0 };

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    if (fim <= inicio) return { anos: 0, meses: 0, dias: 0 };

    const diffTime = fim.getTime() - inicio.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const anos = Math.floor(diffDays / 365);
    const meses = Math.floor((diffDays % 365) / 30);
    const dias = diffDays % 30;

    return { anos, meses, dias };
  };

  // Função para converter valor brasileiro para número
  const parseBrazilianCurrency = (value: string): number => {
    if (!value) return 0;
    // Remove pontos de milhares e substitui vírgula por ponto
    const cleanValue = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  };

  // Função para validar entrada
  const validateInput = (): { isValid: boolean; errorMessage?: string } => {
    if (
      !valorAluguel ||
      !periodoTotal ||
      !dataInicio ||
      !dataFim ||
      !dataRescisao ||
      !mesesMulta
    ) {
      return {
        isValid: false,
        errorMessage: 'Todos os campos são obrigatórios',
      };
    }

    const aluguelValue = parseBrazilianCurrency(valorAluguel);
    const periodoValue = parseInt(periodoTotal);
    const mesesMultaValue = parseInt(mesesMulta);

    if (isNaN(aluguelValue) || aluguelValue <= 0) {
      return {
        isValid: false,
        errorMessage: 'O valor do aluguel deve ser um número positivo',
      };
    }

    if (isNaN(periodoValue) || periodoValue <= 0) {
      return {
        isValid: false,
        errorMessage: 'O período total deve ser um número positivo',
      };
    }

    if (isNaN(mesesMultaValue) || mesesMultaValue <= 0) {
      return {
        isValid: false,
        errorMessage: 'Os meses de multa devem ser um número positivo',
      };
    }

    const dataInicioObj = new Date(dataInicio);
    const dataFimObj = new Date(dataFim);
    const dataRescisaoObj = new Date(dataRescisao);

    if (
      isNaN(dataInicioObj.getTime()) ||
      isNaN(dataFimObj.getTime()) ||
      isNaN(dataRescisaoObj.getTime())
    ) {
      return {
        isValid: false,
        errorMessage: 'Datas inválidas fornecidas',
      };
    }

    if (dataRescisaoObj <= dataInicioObj) {
      return {
        isValid: false,
        errorMessage: 'A data de rescisão deve ser posterior à data de início',
      };
    }

    if (dataRescisaoObj >= dataFimObj) {
      return {
        isValid: false,
        errorMessage:
          'A data de rescisão deve ser anterior à data de fim do contrato',
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
        anosRestantes: 0,
        mesesRestantes: 0,
        diasRestantes: 0,
        isValid: false,
        errorMessage: validation.errorMessage,
      };
    }

    const aluguelValue = parseBrazilianCurrency(valorAluguel);
    const mesesMultaValue = parseInt(mesesMulta);

    // Calcular tempo restante até o fim do contrato
    const { anos, meses, dias } = calcularDiferencaDatas(dataRescisao, dataFim);

    // Calcular a multa (simples: aluguel * meses de multa)
    const multa = aluguelValue * mesesMultaValue;

    return {
      multa,
      anosRestantes: anos,
      mesesRestantes: meses,
      diasRestantes: dias,
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
    setValorAluguel('2.700,00');
    setPeriodoTotal('30');
    setDataInicio('2024-12-27');
    setDataFim('2027-06-27');
    setDataRescisao('2025-09-12');
    setMesesMulta('3');
    setResultado(null);
    toast.info('Formulário limpo');
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Cálculo para Rescisão de Contrato de Aluguel
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário - Lado Esquerdo */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-6">
              {/* Valor do Aluguel mensal */}
              <div className="space-y-2">
                <Label
                  htmlFor="valorAluguel"
                  className="text-sm font-medium text-gray-700"
                >
                  Valor do Aluguel mensal
                </Label>
                <div className="relative">
                  <Input
                    id="valorAluguel"
                    type="text"
                    value={valorAluguel}
                    onChange={(e) => setValorAluguel(e.target.value)}
                    className="w-full pr-10"
                    placeholder="2.700,00"
                  />
                  {valorAluguel && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-600" />
                  )}
                </div>
              </div>

              {/* Período total do contrato em meses */}
              <div className="space-y-2">
                <Label
                  htmlFor="periodoTotal"
                  className="text-sm font-medium text-gray-700"
                >
                  Período total do contrato em meses
                </Label>
                <div className="relative">
                  <Input
                    id="periodoTotal"
                    type="number"
                    min="1"
                    value={periodoTotal}
                    onChange={(e) => setPeriodoTotal(e.target.value)}
                    className="w-full pr-10"
                  />
                  {periodoTotal && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-600" />
                  )}
                </div>
              </div>

              {/* Data de início do contrato */}
              <div className="space-y-2">
                <Label
                  htmlFor="dataInicio"
                  className="text-sm font-medium text-gray-700"
                >
                  Data de início do contrato
                </Label>
                <div className="relative">
                  <Input
                    id="dataInicio"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full pr-10"
                  />
                  {dataInicio && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-600" />
                  )}
                </div>
              </div>

              {/* Data fim do contrato */}
              <div className="space-y-2">
                <Label
                  htmlFor="dataFim"
                  className="text-sm font-medium text-gray-700"
                >
                  Data fim do contrato
                </Label>
                <div className="relative">
                  <Input
                    id="dataFim"
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="w-full pr-10"
                  />
                  {dataFim && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-600" />
                  )}
                </div>
              </div>

              {/* Data de Rescisão do contrato */}
              <div className="space-y-2">
                <Label
                  htmlFor="dataRescisao"
                  className="text-sm font-medium text-gray-700"
                >
                  Data de Rescisão do contrato
                </Label>
                <div className="relative">
                  <Input
                    id="dataRescisao"
                    type="date"
                    value={dataRescisao}
                    onChange={(e) => setDataRescisao(e.target.value)}
                    className="w-full pr-10"
                  />
                  {dataRescisao && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-600" />
                  )}
                </div>
              </div>

              {/* A multa será calculada em quantos meses de aluguel? */}
              <div className="space-y-2">
                <Label
                  htmlFor="mesesMulta"
                  className="text-sm font-medium text-gray-700"
                >
                  A multa será calculada em quantos meses de aluguel?
                </Label>
                <div className="relative">
                  <Input
                    id="mesesMulta"
                    type="number"
                    min="1"
                    value={mesesMulta}
                    onChange={(e) => setMesesMulta(e.target.value)}
                    className="w-full pr-10"
                  />
                  {mesesMulta && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-600" />
                  )}
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCalculate}
                  disabled={isCalculating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  {isCalculating ? 'Calculando...' : 'Calcular'}
                </Button>
                <Button
                  onClick={handleClear}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Limpar Formulário
                </Button>
              </div>
            </div>
          </div>

          {/* Resultado - Lado Direito */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-blue-600 mb-6">
              Informações sobre Multa Rescisória do Aluguel
            </h3>

            {resultado && resultado.isValid ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">
                    Total de anos restantes para o término do contrato
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {resultado.anosRestantes}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">
                    Total de meses restantes para o término do contrato
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {resultado.mesesRestantes}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">
                    Total de dias restantes para o término do contrato
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {resultado.diasRestantes}
                  </span>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Valor da Multa Rescisória
                    </span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(resultado.multa)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>
                  Preencha os dados e clique em "Calcular" para ver os
                  resultados.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultaRescisoria;
