# Feature Contratos

Esta é a feature refatorada para gerenciamento de contratos, seguindo o padrão modular do AnaliseVistoria.

## Estrutura

```
src/features/contratos/
├── components/          # Componentes React
│   ├── ContractList.tsx      # Lista de contratos
│   ├── ContractCard.tsx      # Card individual de contrato
│   ├── ContractFilters.tsx   # Filtros e busca
│   ├── ContractActions.tsx   # Ações por contrato
│   ├── ContractStats.tsx     # Estatísticas
│   └── index.ts              # Barrel exports
├── hooks/               # Custom hooks
│   ├── useContracts.ts       # Data fetching
│   ├── useContractFilters.ts # Gerenciamento de filtros
│   ├── useContractActions.ts # Ações CRUD
│   ├── useContractStats.ts   # Estatísticas
│   └── index.ts              # Barrel exports
├── types/               # Definições de tipos
│   └── index.ts              # Tipos da feature
├── utils/               # Utilitários
└── index.ts             # Barrel exports principal
```

## Componentes

### ContractList
- Lista paginada de contratos
- Loading states com skeletons
- Empty states informativos
- Auto-load com intersection observer
- Integração com busca e filtros

### ContractCard
- Card individual de contrato
- Ações rápidas (editar, favorito)
- Informações das partes envolvidas
- Termos do contrato
- Localização do imóvel
- Contabilidade de consumo
- Ações de documento

### ContractFilters
- Campo de busca otimizado
- Filtro de favoritos
- Filtro de tags
- Filtro de mês/ano
- Botões de limpar
- Exportação para Excel

### ContractStats
- Dashboard de estatísticas
- Total de contratos
- Contratos exibidos
- Favoritos
- Contratos com tags

## Hooks

### useContracts
- Gerencia data fetching de contratos
- Sistema de busca otimizado
- Filtros avançados
- Paginação infinita
- Estados de loading

### useContractFilters
- Gerencia estado dos filtros
- Debounce para performance
- Limpeza de filtros
- Geração de opções (meses, anos)

### useContractActions
- Ações de documento
- Geração de contratos
- Exportação
- Modais de ação
- Handlers de eventos

### useContractStats
- Cálculo de estatísticas
- Contadores dinâmicos
- Métricas de uso

## Benefícios da Refatoração

1. **Modularidade**: Código organizado em features
2. **Reutilização**: Componentes e hooks reutilizáveis
3. **Manutenibilidade**: Separação clara de responsabilidades
4. **Testabilidade**: Componentes e hooks isolados
5. **Performance**: Lazy loading e otimizações
6. **Type Safety**: Tipos bem definidos

## Componente Principal

O `Contratos.tsx` foi reduzido de 1005 linhas para ~230 linhas, utilizando:

- Hooks especializados para cada responsabilidade
- Componentes modulares
- Estado centralizado com reducer
- Lazy loading de modals
- Performance otimizada

## Integração

Esta feature se integra com:
- Sistema de autenticação (`useAuth`)
- Supabase para dados
- Sistema de favoritos
- Tags de contratos
- Templates de documentos
- Notificações automáticas

## Migração do Código Antigo

O código foi migrado do arquivo monolítico `Contratos.tsx` (1005 linhas) para a nova estrutura modular, mantendo toda a funcionalidade original mas com melhor organização e manutenibilidade.