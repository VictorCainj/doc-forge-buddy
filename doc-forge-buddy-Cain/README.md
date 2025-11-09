# Doc Forge Buddy

![CI](https://github.com/seu-usuario/doc-forge-buddy/workflows/CI/badge.svg)
![Codecov](https://codecov.io/gh/seu-usuario/doc-forge-buddy/branch/main/graph/badge.svg)
![License](https://img.shields.io/badge/license-Proprietary-red)

Sistema completo de gestão de contratos imobiliários com geração automatizada de documentos, vistorias detalhadas e análise inteligente via IA.

## 🚀 Stack Tecnológico

- **Frontend**: React 18 + TypeScript
- **Build**: Vite 7
- **Styling**: Tailwind CSS + shadcn/ui (Material Design 3)
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **State Management**: TanStack React Query + Context API
- **Routing**: React Router v6 (lazy loading)
- **Forms**: React Hook Form + Zod
- **Documents**: Handlebars + html2pdf.js + jspdf + docx
- **AI**: OpenAI API (via Supabase Edge Functions)
- **Testing**: Vitest + Testing Library

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Criar arquivo .env na raiz com:
VITE_SUPABASE_URL=sua_url
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave
VITE_OPENAI_API_KEY=sua_chave_openai

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Build em modo desenvolvimento
npm run build:dev

# Preview do build
npm run preview

# Otimização completa
npm run optimize
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes compartilhados
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── admin/          # Componentes do painel admin
│   └── ...
├── features/           # Organização por domínio
│   ├── contracts/      # Gestão de contratos
│   ├── documents/      # Geração de documentos
│   ├── vistoria/       # Sistema de vistorias
│   └── reports/        # Relatórios e analytics
├── hooks/              # Hooks customizados (40+ hooks)
├── pages/              # Páginas (lazy loaded - 17 páginas)
├── types/              # Tipos TypeScript
├── utils/              # Utilitários
├── templates/          # Templates de documentos (TypeScript)
└── integrations/       # Integrações (Supabase, OpenAI)
```

## 📚 Funcionalidades Principais

### Gestão de Contratos

- Criação e edição de contratos
- Templates personalizáveis
- Histórico completo de alterações
- Filtros avançados e busca

### Geração de Documentos

- Templates Handlebars em TypeScript
- Geração de PDF de alta qualidade
- Ajuste automático de fonte
- Preview em tempo real

### Vistorias Detalhadas

- Upload de imagens otimizado
- Classificação visual de ambientes
- Apontamentos inteligentes via IA
- Exportação completa

### Painel Administrativo

- Gestão de usuários e permissões
- Sistema de auditoria completo
- Métricas e analytics
- Logs de atividades

### Chat IA Avançado

- Assistente inteligente integrado
- Análise semântica de documentos
- Base de conhecimento contextual
- Sugestões personalizadas

## 🔧 Scripts Disponíveis

### Desenvolvimento

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run build:dev` - Build em modo desenvolvimento
- `npm run preview` - Preview do build de produção

### Qualidade e Testes

- `npm run lint` - Executa ESLint
- `npm run lint:fix` - Corrige problemas de linting
- `npm run type-check` - Verificação de tipos TypeScript
- `npm run test` - Executa testes
- `npm run test:watch` - Testes em modo watch
- `npm run test:ui` - Interface de testes
- `npm run test:coverage` - Cobertura de testes

### Análise e Otimização

- `npm run analyze` - Análise do bundle
- `npm run optimize` - Otimização completa (lint + type-check + build)
- `npm run security:audit` - Auditoria de segurança

## 🧪 Testes

O projeto possui configuração completa de testes com Vitest:

```bash
# Executar todos os testes
npm run test

# Executar com cobertura
npm run test:coverage

# Interface visual de testes
npm run test:ui

# Testes em modo watch
npm run test:watch
```

**Cobertura mínima**: 80% statements, 75% branches, 80% functions, 80% lines

## 📖 Documentação Técnica

Para detalhes sobre a arquitetura do sistema, padrões de código e decisões técnicas, consulte:

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitetura completa do sistema
- **[Rules](./.cursor/rules/)** - Guias de desenvolvimento específicos

## 🔐 Configuração do Supabase

O projeto requer configuração do Supabase com:

- Autenticação (Email/Password)
- Database (PostgreSQL com RLS)
- Storage (Upload de imagens)
- Edge Functions (OpenAI proxy)

### Migrations

Migrations SQL disponíveis em `supabase/migrations/`:

- **20241220000000_add_notificacao_rescisao_to_existing_contracts.sql** - Adiciona notificação de rescisão aos contratos
- **20250115000000_optimize_rls_policies.sql** - Otimização de performance RLS (29 políticas)

#### Otimização RLS

A migração `20250115000000_optimize_rls_policies.sql` otimiza 29 políticas de Row Level Security para melhorar a performance em escala, substituindo chamadas diretas a `auth.uid()` por `(select auth.uid())`.

**Aplicar migração:**

```bash
# Via Supabase CLI
supabase db push

# Ou via Dashboard > SQL Editor
# Cole o conteúdo do arquivo e execute
```

**Validar otimização:**

```bash
# Execute o script de validação no SQL Editor
# Arquivo: supabase/migrations/validate_rls_optimization.sql
```

Para mais detalhes, consulte: `supabase/migrations/README_RLS_OPTIMIZATION.md`

## 🎨 Design System

Baseado em **Google Material Design 3** com componentes customizados:

- **Paleta de cores**: `primary`, `success`, `warning`, `error`, `info`, `neutral`
- **Sistema de bordas**: 4px, 8px, 12px, 16px, 20px
- **Elevations**: `elevation-1` a `elevation-5`
- **Componentes acessíveis** (a11y)
- **Responsivo** (mobile-first)
- **Dark mode** ready

## 📈 Performance

- **Lazy loading** de todas as páginas (17 páginas)
- **Code splitting** automático e manual
- **React Query** para cache inteligente
- **Bundle otimizado** com chunks específicos
- **Otimização de imagens**
- **Service Worker** para cache offline

## 🚀 Deploy

### Vercel (Recomendado)

```bash
# Deploy automático via Git
vercel --prod

# Ou usar vercel.json configurado
```

### Build Manual

```bash
# Build otimizado
npm run optimize

# Preview local
npm run preview
```

## 📝 Convenções de Código

- **Componentes**: PascalCase (ex: `DocumentPreview`)
- **Hooks**: camelCase com prefixo `use` (ex: `useDocumentPreview`)
- **Utilitários**: camelCase (ex: `replaceTemplateVariables`)
- **Tipos**: PascalCase (ex: `DocumentFormWizardProps`)

## 🤝 Contribuindo

1. Leia `ARCHITECTURE.md` para entender a estrutura
2. Siga os padrões de código estabelecidos nas [Rules](./.cursor/rules/)
3. Mantenha componentes pequenos e testáveis
4. Use TypeScript de forma explícita
5. Execute testes antes de commitar: `npm run test`

## 📄 Licença

Proprietary - Todos os direitos reservados

---

**Última atualização**: Janeiro de 2025  
**Versão**: 2.0.0
