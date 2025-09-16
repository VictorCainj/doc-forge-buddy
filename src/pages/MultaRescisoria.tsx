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
  const [valorAluguel, setValorAluguel] = useState<string>('2700.00');
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

    const aluguelValue = parseFloat(valorAluguel);
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

    const aluguelValue = parseFloat(valorAluguel);
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
    setValorAluguel('');
    setPeriodoTotal('');
    setDataInicio('');
    setDataFim('');
    setDataRescisao('');
    setMesesMulta('');
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
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Cálculo para Rescisão de Contrato de Aluguel
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário - Lado Esquerdo */}
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
                type="number"
                step="0.01"
                min="0"
                value={valorAluguel}
                onChange={(e) => setValorAluguel(e.target.value)}
                className="w-full pr-10"
              />
              {valorAluguel && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
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
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
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
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
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
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
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
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
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
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleCalculate}
              disabled={isCalculating}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCalculating ? 'Calculando...' : 'Calcular'}
            </Button>
            <Button onClick={handleClear} variant="outline" className="flex-1">
              Limpar Formulário
            </Button>
          </div>
        </div>

        {/* Resultado - Lado Direito */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">
            Informações sobre Multa Rescisória do Aluguel
          </h3>

          {resultado && resultado.isValid ? (
            <div className="space-y-4">
              <div className="bg-white p-3 rounded border">
                <p className="text-sm text-gray-600">
                  Total de anos restantes para o término do contrato
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {resultado.anosRestantes}
                </p>
              </div>

              <div className="bg-white p-3 rounded border">
                <p className="text-sm text-gray-600">
                  Total de meses restantes para o término do contrato
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {resultado.mesesRestantes}
                </p>
              </div>

              <div className="bg-white p-3 rounded border">
                <p className="text-sm text-gray-600">
                  Total de dias restantes para o término do contrato
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {resultado.diasRestantes}
                </p>
              </div>

              <div className="bg-white p-3 rounded border">
                <p className="text-sm text-gray-600">
                  Valor da Multa Rescisória
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(resultado.multa)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>
                Preencha os dados e clique em "Calcular" para ver os resultados.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultaRescisoria;
