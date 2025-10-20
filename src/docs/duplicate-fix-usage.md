# Correção de Duplicatas de Imagens

## Visão Geral

Sistema para detectar e corrigir duplicatas de imagens em análises de vistoria, mantendo apenas as imagens originais (mais antigas).

## Componentes Disponíveis

### 1. FixDuplicatesButton

Botão minimalista para corrigir duplicatas de uma análise específica.

```tsx
import { FixDuplicatesButton } from '@/components/FixDuplicatesButton';

<FixDuplicatesButton
  vistoriaId="vistoria-123"
  onFixed={(stats) => {
    console.log(`${stats.duplicatesRemoved} duplicatas removidas`);
    // Recarregar dados se necessário
  }}
/>;
```

### 2. FixDuplicatesButtonCompact

Versão compacta (apenas ícone) do botão.

```tsx
import { FixDuplicatesButtonCompact } from '@/components/FixDuplicatesButton';

<FixDuplicatesButtonCompact
  vistoriaId="vistoria-123"
  onFixed={(stats) => {
    // Callback após correção
  }}
/>;
```

### 3. BulkFixDuplicatesButton

Botão para correção em lote de múltiplas análises.

```tsx
import { BulkFixDuplicatesButton } from '@/components/BulkFixDuplicatesButton';

<BulkFixDuplicatesButton
  vistoriaIds={['vistoria-1', 'vistoria-2', 'vistoria-3']}
  onFixed={(results) => {
    console.log('Correção em lote concluída');
  }}
/>;
```

## Hook Personalizado

### useFixDuplicates

Hook para controle avançado da correção de duplicatas.

```tsx
import { useFixDuplicates } from '@/hooks/useFixDuplicates';

function MyComponent() {
  const { isFixing, fixAnalysis, checkDuplicates, fixMultiple } =
    useFixDuplicates();

  const handleFix = async () => {
    const result = await fixAnalysis('vistoria-123');
    if (result?.success) {
      console.log('Duplicatas corrigidas!');
    }
  };

  const handleCheck = async () => {
    const { hasDuplicates, count } = await checkDuplicates('vistoria-123');
    console.log(`Tem duplicatas: ${hasDuplicates}, Quantidade: ${count}`);
  };

  return (
    <Button onClick={handleFix} disabled={isFixing}>
      {isFixing ? 'Corrigindo...' : 'Corrigir Duplicatas'}
    </Button>
  );
}
```

## Utilitários Diretos

### FixDuplicatedImages

Classe utilitária para operações diretas.

```tsx
import { FixDuplicatedImages } from '@/utils/fixDuplicatedImages';

// Verificar se tem duplicatas
const hasDuplicates = await FixDuplicatedImages.hasDuplicates('vistoria-123');

// Contar duplicatas
const count = await FixDuplicatedImages.countDuplicates('vistoria-123');

// Corrigir duplicatas
const result = await FixDuplicatedImages.fixAnalysisDuplicates('vistoria-123');
```

## Como Funciona

### 1. Detecção de Duplicatas

As duplicatas são detectadas baseadas em:

- **Apontamento ID** + **Tipo de Vistoria** + **URL da Imagem**
- Imagens com a mesma combinação são consideradas duplicatas

### 2. Correção

- **Mantém**: A imagem mais antiga (menor `created_at`)
- **Remove**: Todas as duplicatas mais recentes
- **Log**: Registra todas as operações para auditoria

### 3. Segurança

- **Backup**: Sempre verifica antes de remover
- **Validação**: Confirma que a imagem existe antes de deletar
- **Rollback**: Em caso de erro, para a operação

## Estatísticas Retornadas

```typescript
interface FixStats {
  totalImages: number; // Total de imagens encontradas
  duplicatesRemoved: number; // Quantas duplicatas foram removidas
  imagesKept: number; // Quantas imagens originais foram mantidas
  errors: number; // Quantos erros ocorreram
}
```

## Exemplos de Uso

### Correção Individual

```tsx
function AnalysisCard({ vistoriaId }: { vistoriaId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Vistoria</CardTitle>
        <FixDuplicatesButton
          vistoriaId={vistoriaId}
          onFixed={(stats) => {
            if (stats.duplicatesRemoved > 0) {
              // Recarregar dados da análise
              loadAnalysisData();
            }
          }}
        />
      </CardHeader>
    </Card>
  );
}
```

### Correção em Lote

```tsx
function AnalysisList({ analyses }: { analyses: Analysis[] }) {
  const vistoriaIds = analyses.map((a) => a.id);

  return (
    <div>
      <BulkFixDuplicatesButton
        vistoriaIds={vistoriaIds}
        onFixed={(results) => {
          const successCount = results.filter((r) => r.success).length;
          console.log(`${successCount} análises corrigidas`);
        }}
      />
    </div>
  );
}
```

### Verificação Antes da Correção

```tsx
function SmartFixButton({ vistoriaId }: { vistoriaId: string }) {
  const { checkDuplicates, fixAnalysis, isFixing } = useFixDuplicates();
  const [duplicatesInfo, setDuplicatesInfo] = useState<{
    hasDuplicates: boolean;
    count: number;
  } | null>(null);

  useEffect(() => {
    checkDuplicates(vistoriaId).then(setDuplicatesInfo);
  }, [vistoriaId, checkDuplicates]);

  if (!duplicatesInfo?.hasDuplicates) {
    return null; // Não mostrar se não tem duplicatas
  }

  return (
    <Button onClick={() => fixAnalysis(vistoriaId)} disabled={isFixing}>
      Corrigir {duplicatesInfo.count} duplicatas
    </Button>
  );
}
```

## Notas Importantes

1. **Backup**: Sempre faça backup antes de executar correções em massa
2. **Teste**: Teste primeiro com análises de desenvolvimento
3. **Monitoramento**: Monitore os logs para verificar se as correções estão funcionando
4. **Performance**: Para muitas análises, use correção em lote para melhor performance

## Logs e Monitoramento

Todos os logs são registrados com prefixo `🔧` para facilitar a identificação:

```
🔧 Iniciando correção de duplicações para vistoria: vistoria-123
🔍 Grupo apontamento-1-inicial-https://...: 3 imagens, mantendo img-1, removendo 2
🗑️ Duplicata removida: img-2 (apontamento-1-inicial-https://...)
✅ Correção de duplicações concluída
```
