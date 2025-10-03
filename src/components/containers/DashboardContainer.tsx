/**
 * Container para Dashboard - Lógica de Negócio
 * Separa lógica de dados da apresentação
 */

import React from 'react';
import { DashboardPresentation } from '../presentation/DashboardPresentation';
import { EnhancedDashboardPresentation } from '../presentation/EnhancedDashboardPresentation';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useUserPreferences } from '@/contexts/AppStateContext';

export const DashboardContainer: React.FC = () => {
  // ✅ Lógica de dados
  const { contracts, metrics, loading, refetch } = useDashboardData();
  const { preferences, updatePreferences } = useUserPreferences();

  // ✅ Lógica de negócio - Decidir qual dashboard usar
  const shouldUseEnhanced = contracts.length > 50 || preferences.contractsPerPage > 6;

  // ✅ Lógica de negócio - Processar dados para apresentação
  const dashboardData = React.useMemo(() => {
    if (loading || !contracts.length) {
      return {
        totalContracts: 0,
        contractsThisMonth: 0,
        contractsOver30Days: 0,
        chartData: [],
        recentContracts: [],
      };
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const contractsThisMonth = contracts.filter(
      contract => new Date(contract.created_at) >= startOfMonth
    ).length;

    const contractsOver30Days = contracts.filter(
      contract => new Date(contract.created_at) < thirtyDaysAgo
    ).length;

    // Dados para gráfico
    const chartData = contracts.slice(0, 10).map((contract, index) => ({
      name: `Contrato ${contract.form_data.numeroContrato || index + 1}`,
      value: Math.floor(Math.random() * 100) + 1, // Placeholder - substituir por dados reais
      date: contract.created_at,
    }));

    // Contratos recentes
    const recentContracts = contracts.slice(0, 5).map(contract => ({
      id: contract.id,
      number: contract.form_data.numeroContrato || 'N/A',
      tenant: contract.form_data.nomeLocatario || 'N/A',
      address: contract.form_data.enderecoImovel || 'N/A',
      date: contract.created_at,
    }));

    return {
      totalContracts: contracts.length,
      contractsThisMonth,
      contractsOver30Days,
      chartData,
      recentContracts,
    };
  }, [contracts, loading]);

  // ✅ Callbacks para ações
  const handleRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const handlePreferenceChange = React.useCallback((key: string, value: any) => {
    updatePreferences({ [key]: value });
  }, [updatePreferences]);

  const handleExportData = React.useCallback(() => {
    try {
      const dataToExport = {
        contracts: contracts.map(c => ({
          numero: c.form_data.numeroContrato,
          locatario: c.form_data.nomeLocatario,
          endereco: c.form_data.enderecoImovel,
          data: c.created_at,
        })),
        metrics: dashboardData,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json',
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard-data-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
    }
  }, [contracts, dashboardData]);

  // ✅ Props para apresentação
  const presentationProps = {
    // Dados processados
    ...dashboardData,
    
    // Estados
    loading,
    
    // Configurações
    preferences,
    
    // Callbacks
    onRefresh: handleRefresh,
    onExport: handleExportData,
    onPreferenceChange: handlePreferenceChange,
  };

  // ✅ Renderização condicional baseada em lógica de negócio
  if (shouldUseEnhanced) {
    return <EnhancedDashboardPresentation {...presentationProps} />;
  }

  return <DashboardPresentation {...presentationProps} />;
};
