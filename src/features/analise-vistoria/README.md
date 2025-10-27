# Feature: Analise Vistoria

Esta feature foi refatorada do arquivo `AnaliseVistoria.tsx` (3860 linhas) para uma estrutura modular e manutenível.

## Estrutura de Arquivos

```
src/features/analise-vistoria/
├── context/
│   └── AnaliseVistoriaContext.tsx    # Context API com Provider
├── hooks/
│   ├── useDocumentPreview.ts         # Geração de preview do documento
│   ├── useApontamentosManager.ts     # CRUD de apontamentos
│   └── index.ts                      # Barrel export
├── components/
│   ├── ClassificationWarningBanner.tsx  # Banner de alerta
│   ├── NoContractAlert.tsx              # Alerta sem contrato
│   └── DocumentPreviewContent.tsx       # Preview do documento
├── types/
│   └── index.ts                      # Tipos TypeScript
├── index.ts                          # Barrel export principal
└── README.md                         # Esta documentação
```

## Componentes Criados

### ClassificationWarningBanner
Alerta para apontamentos sem classificação com botão para corrigir automaticamente.

### NoContractAlert  
Mensagem de alerta quando nenhum contrato está carregado.

### DocumentPreviewContent
Componente que renderiza o preview HTML do documento de forma segura.

## Hooks Customizados

### useDocumentPreview
Gerencia a geração e atualização do preview do documento em tempo real.

### useApontamentosManager
Gerencia operações CRUD de apontamentos (adicionar, remover, editar, salvar, cancelar).

## Context API

### AnaliseVistoriaProvider
Provider que centraliza todo o estado da análise de vistoria:
- Apontamentos
- Contrato selecionado
- Dados da vistoria
- Modo do documento (análise/orçamento)
- Estado de edição
- UI state

### useAnaliseVistoriaContext
Hook para acessar o contexto em qualquer componente filho.

## Como Usar

```tsx
import { 
  AnaliseVistoriaProvider, 
  ClassificationWarningBanner,
  NoContractAlert,
  useApontamentosManager,
  useDocumentPreview 
} from '@/features/analise-vistoria';

function AnaliseVistoria() {
  return (
    <AnaliseVistoriaProvider>
      <ClassificationWarningBanner />
      <NoContractAlert />
      {/* ... outros componentes ... */}
    </AnaliseVistoriaProvider>
  );
}
```

## Próximos Passos

A refatoração foi feita de forma gradual. O arquivo original `AnaliseVistoria.tsx` ainda funciona totalmente.
Para continuar a migração:

1. Criar componentes restantes conforme necessário
2. Extrair lógica adicional para hooks
3. Migrar seções do arquivo original para usar a nova estrutura
4. Manter compatibilidade até migração completa

## Benefícios

- ✅ Código mais organizado e manutenível
- ✅ Componentes reutilizáveis
- ✅ Lógica de negócio separada (hooks)
- ✅ Estado centralizado (Context API)
- ✅ TypeScript tipado
- ✅ Sem quebrar funcionalidades existentes
