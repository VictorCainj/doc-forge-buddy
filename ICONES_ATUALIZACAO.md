# Atualização do Sistema de Cores dos Ícones

## Objetivo

Implementar um sistema onde todos os ícones tenham cores neutras (cinza/preto) por padrão, EXCETO os ícones exibidos nos cards de contrato, que devem ser coloridos de acordo com suas categorias.

## Mudanças Implementadas

### 1. `src/utils/iconConfig.ts`

#### Cores Neutras (Padrão Global)

- Modificado `iconColors` para usar cinza neutro (#6B7280) em todas as categorias
- Mantém apenas `system` com cinza escuro (#374151) e `loading` com cinza claro (#9CA3AF)

#### Cores Coloridas (Cards de Contrato)

- Criado novo objeto `iconColorsColored` com as cores originais por categoria:
  - `document`: Azul (#3B82F6)
  - `success`: Verde (#10B981)
  - `danger`: Vermelho (#EF4444)
  - `user`: Roxo (#8B5CF6)
  - `communication`: Azul claro (#06B6D4)
  - `time`: Laranja (#F59E0B)
  - `location`: Vermelho escuro (#DC2626)
  - `edit`: Amarelo (#FBBF24)

#### Novas Funções

- `getIconColor(iconName, colored)`: Retorna cor neutra ou colorida conforme parâmetro
- `getIconColorColored(iconName)`: Retorna sempre a cor colorida específica

---

### 2. `src/utils/iconMapper.ts`

#### Função `withColor` (Atualizada)

- Modificada para usar cores neutras por padrão
- Aplica `getIconColor(name, false)` para garantir cor neutra

#### Nova Função `withColorColored`

- Cria ícones com cores específicas por categoria
- Usa `getIconColorColored(name)` para obter cores coloridas
- Adiciona sufixo "Colored" ao displayName para diferenciação

#### Novos Ícones Coloridos Exportados

- `FileTextColored`: Azul (documentos)
- `CalendarColored`: Laranja (tempo/calendário)
- `UserColored`: Roxo (usuário/proprietário)
- `User2Colored`: Roxo (usuário/locatário)
- `MapPinColored`: Vermelho escuro (localização)
- `EditColored`: Amarelo (edição)
- `SearchCheckColored`: Verde (sucesso/pesquisa)

---

### 3. `src/components/ContractCard.tsx`

#### Importações Atualizadas

- Mantém ícones neutros originais (para uso em botões e ações gerais)
- Adiciona importações dos ícones coloridos específicos

#### Substituições de Ícones no Card

1. **Header do Contrato**
   - `FileText` → `FileTextColored` (azul - documento)

2. **Partes Envolvidas**
   - `User` → `UserColored` (roxo - proprietário)
   - `User2` → `User2Colored` (roxo - locatário)

3. **Informações do Imóvel**
   - `MapPin` → `MapPinColored` (vermelho escuro - localização)

4. **Botão Editar**
   - `Edit` → `EditColored` (amarelo - edição)

5. **Ações Rápidas**
   - `Calendar` → `CalendarColored` (laranja - agendamento)
   - `FileText` → `FileTextColored` (azul - NPS)
   - `SearchCheck` → `SearchCheckColored` (verde - análise)

---

## Resultado Final

### Ícones Neutros (Cinza/Preto)

✅ Todos os ícones em menus, barras de navegação, botões gerais
✅ Ícones em componentes de estatísticas
✅ Ícones em formulários e modais
✅ Ícones de ações (salvar, cancelar, etc.)

### Ícones Coloridos (Por Categoria)

✅ Ícones no card do contrato (ContractCard)
✅ Cada ícone mantém sua cor específica de categoria
✅ Visual mais intuitivo e diferenciado para informações do contrato

---

## Manutenção Futura

### Para Adicionar Novos Ícones Coloridos

1. Adicionar exportação colorida em `iconMapper.ts`:

   ```typescript
   export const NovoIconeColored = withColorColored(PiIcone, 'NovoIcone');
   ```

2. Importar e usar no componente desejado:
   ```typescript
   import { NovoIconeColored } from '@/utils/iconMapper';
   <NovoIconeColored className="h-4 w-4" />
   ```

### Para Alterar Cores de Categoria

Modificar o objeto `iconColorsColored` em `src/utils/iconConfig.ts`

---

---

## 🔧 Correções Aplicadas

### 1. EditColored usando ícone incorreto

**Problema**: `ReferenceError: PiPencil is not defined`  
**Causa**: Tentativa de usar `PiPencil` que não existe no Phosphor Icons  
**Solução**: Alterado para `PiPencilSimple` (o ícone correto importado)  
**Status**: ✅ Corrigido

### 2. Ícones coloridos não apareciam

**Problema**: Ícones nos cards permaneciam neutros (cinza) mesmo usando versões "Colored"  
**Causa**: React Icons usa prop `color` diretamente, não `style={{ color }}`  
**Solução**: Alteradas funções `withColor` e `withColorColored` para usar `color: color` como prop  
**Arquivo**: `src/utils/iconMapper.ts`  
**Status**: ✅ Corrigido

### 3. Botão X do modal difícil de clicar

**Problema**: Área clicável muito pequena no botão de fechar modal  
**Solução**: Aumentado padding `p-1.5` → `p-3` e ícone `h-4 w-4` → `h-5 w-5`  
**Arquivo**: `src/components/ui/dialog.tsx`  
**Status**: ✅ Corrigido

---

**Data da Implementação**: 11 de outubro de 2025  
**Status**: ✅ Implementado, Corrigido e Testado Completamente
