# Doc Forge Buddy

Sistema completo de gestão de contratos imobiliários com geração automatizada de documentos, vistorias detalhadas e análise inteligente via IA.

## 🚀 Stack Tecnológico

- **Frontend**: React 18 + TypeScript
- **Build**: Vite 7
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: TanStack React Query
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Documents**: Handlebars + html2pdf.js + docx
- **AI**: OpenAI API

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Criar arquivo .env na raiz com:
# VITE_SUPABASE_URL=sua_url
# VITE_SUPABASE_ANON_KEY=sua_chave
# VITE_OPENAI_API_KEY=sua_chave_openai

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
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
├── hooks/              # Hooks customizados
├── pages/              # Páginas (lazy loaded)
├── types/              # Tipos TypeScript
├── utils/              # Utilitários
└── integrations/       # Integrações (Supabase, OpenAI)
```

## 📚 Funcionalidades Principais

### Gestão de Contratos

- Criação e edição de contratos
- Templates personalizáveis
- Histórico completo de alterações
- Filtros avançados e busca

### Geração de Documentos

- Templates Handlebars
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

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run build:dev` - Build em modo desenvolvimento
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa ESLint

## 📖 Documentação Técnica

Para detalhes sobre a arquitetura do sistema, padrões de código e decisões técnicas, consulte:

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitetura completa do sistema

## 🔐 Configuração do Supabase

O projeto requer configuração do Supabase com:

- Autenticação (Email/Password)
- Database (PostgreSQL com RLS)
- Storage (Upload de imagens)
- Edge Functions (opcional)

Migrations SQL disponíveis em `supabase/migrations/`

## 🎨 Design System

Baseado em shadcn/ui com componentes customizados:

- Tema consistente (Tailwind)
- Componentes acessíveis (a11y)
- Responsivo (mobile-first)
- Dark mode ready

## 📈 Performance

- Lazy loading de todas as páginas
- Code splitting automático
- React Query para cache inteligente
- Otimização de imagens
- Bundle size otimizado

## 🧪 Testes

```bash
# Executar testes (quando configurado)
npm run test

# Executar com cobertura
npm run test:coverage
```

## 📝 Convenções de Código

- **Componentes**: PascalCase (ex: `DocumentPreview`)
- **Hooks**: camelCase com prefixo `use` (ex: `useDocumentPreview`)
- **Utilitários**: camelCase (ex: `replaceTemplateVariables`)
- **Tipos**: PascalCase (ex: `DocumentFormWizardProps`)

## 🤝 Contribuindo

1. Leia `ARCHITECTURE.md` para entender a estrutura
2. Siga os padrões de código estabelecidos
3. Mantenha componentes pequenos e testáveis
4. Use TypeScript de forma explícita

## 📄 Licença

Proprietary - Todos os direitos reservados

---

**Última atualização**: Outubro de 2025  
**Versão**: 2.0.0
