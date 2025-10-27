# Documentação do Projeto - Doc Forge Buddy

Bem-vindo à documentação do projeto Doc Forge Buddy. Este diretório contém toda a documentação técnica do projeto.

## 📚 Documentos Disponíveis

### Implementação e Status

- **[IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md)** - Status atual da implementação do plano de manutenção e escalabilidade
- **[SPRINT1_SUMMARY.md](./SPRINT1_SUMMARY.md)** - Resumo detalhado do Sprint 1 (Fundação)

### Configuração e Setup

- **[SENTRY_SETUP.md](./SENTRY_SETUP.md)** - Guia completo de configuração do Sentry para error tracking

### Performance

- **[PERFORMANCE_GUIDELINES.md](./PERFORMANCE_GUIDELINES.md)** - Guia completo de otimizações de performance implementadas

### Arquitetura

- **[ARCHITECTURE.md](../ARCHITECTURE.md)** - Visão geral da arquitetura do projeto

## 🎯 Visão Geral do Projeto

O **Doc Forge Buddy** é uma aplicação React moderna para gestão de contratos imobiliários, vistorias e geração de documentos automatizados.

### Stack Tecnológica

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **State Management:** TanStack React Query
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod
- **Testing:** Vitest + Testing Library
- **CI/CD:** GitHub Actions

### Características Principais

- ✅ Gestão completa de contratos imobiliários
- ✅ Vistorias com imagens e apontamentos
- ✅ Geração automática de documentos (PDF, Word)
- ✅ Integração com IA (OpenAI)
- ✅ Sistema de autenticação robusto
- ✅ Dashboard analítico
- ✅ Otimização de performance (virtualização, memoização)
- ✅ Error tracking com Sentry
- ✅ CI/CD automatizado

## 🚀 Início Rápido

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar ambiente de desenvolvimento
npm run dev
```

### Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm run test         # Executa testes
npm run lint         # Executa ESLint
npm run type-check   # Verifica tipos TypeScript
npm run format       # Formata código com Prettier
```

## 📊 Métricas do Projeto

### Qualidade de Código

- ✅ TypeScript strict mode ativado
- ✅ ESLint configurado com regras de qualidade
- ✅ Prettier para formatação consistente
- ✅ Pre-commit hooks com Husky
- ✅ 5 testes unitários implementados

### Performance

- **Bundle Size:** 4.5MB / 1.4MB (gzip)
- **Code Splitting:** Implementado
- **Virtualização:** Listas com react-window
- **Memoização:** React.memo + useMemo/useCallback

### CI/CD

- ✅ GitHub Actions configurado
- ✅ Lint automático em PRs
- ✅ Build automático
- ✅ Security audit

## 📁 Estrutura do Projeto

```
doc-forge-buddy/
├── src/
│   ├── components/      # Componentes React
│   ├── pages/           # Páginas/rotas
│   ├── features/        # Features por domínio
│   ├── hooks/           # Custom hooks
│   ├── services/        # Serviços e lógica de negócio
│   ├── utils/           # Utilitários
│   ├── lib/             # Bibliotecas/configurações
│   ├── types/           # TypeScript types
│   └── test/            # Setup de testes
├── docs/                # Documentação
├── supabase/            # Configuração Supabase
└── .github/             # GitHub Actions
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_OPENAI_API_KEY=your_openai_key
VITE_SENTRY_DSN=your_sentry_dsn
```

### Banco de Dados

O projeto usa Supabase (PostgreSQL) com:
- Row Level Security (RLS) ativado
- Storage para imagens
- Edge Functions para lógica serverless

## 🧪 Testes

```bash
# Executar todos os testes
npm run test

# Executar testes em watch mode
npm run test -- --watch

# Executar testes com coverage
npm run test -- --coverage
```

## 📝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Use TypeScript para tudo
- Siga as convenções de nomenclatura
- Mantenha componentes pequenos e focados
- Adicione testes para novas features
- Documente código complexo

## 🐛 Reportar Bugs

Se encontrar um bug, por favor:
1. Verifique se o bug já foi reportado
2. Abra uma issue com:
   - Descrição clara do bug
   - Passos para reproduzir
   - Comportamento esperado vs. atual
   - Screenshots (se aplicável)

## 📄 Licença

Este projeto é proprietário e confidencial.

---

**Desenvolvido com ❤️ por Doc Forge Buddy Team**
