# 📦 Adições ao package.json para Fase 3

**Instruções para adicionar dependências e scripts de teste**

---

## 🔧 DEPENDÊNCIAS A ADICIONAR

### **Copie e adicione em `devDependencies`:**

```json
{
  "devDependencies": {
    "vitest": "^1.0.4",
    "@vitest/ui": "^1.0.4",
    "@vitest/coverage-v8": "^1.0.4",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "jsdom": "^23.0.1",
    "@axe-core/react": "^4.8.2"
  }
}
```

---

## 📝 SCRIPTS A ADICIONAR

### **Copie e adicione em `scripts`:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

---

## 🚀 COMANDOS PARA INSTALAR

### **Opção 1: NPM**
```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @axe-core/react
```

### **Opção 2: Yarn**
```bash
yarn add -D vitest @vitest/ui @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @axe-core/react
```

### **Opção 3: PNPM**
```bash
pnpm add -D vitest @vitest/ui @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @axe-core/react
```

---

## ✅ VERIFICAÇÃO

Após instalar, verifique se os scripts funcionam:

```bash
# Rodar testes
npm run test

# Rodar testes com UI
npm run test:ui

# Rodar testes uma vez
npm run test:run

# Gerar coverage
npm run test:coverage
```

---

## 📊 ESTRUTURA DO PACKAGE.JSON FINAL

```json
{
  "name": "doc-forge-buddy",
  "version": "2.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "...": "outras dependências existentes"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.4",
    "@vitest/ui": "^1.0.4",
    "@vitest/coverage-v8": "^1.0.4",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "jsdom": "^23.0.1",
    "@axe-core/react": "^4.8.2",
    "...": "outras dev dependencies existentes"
  }
}
```

---

**Pronto!** Após seguir esses passos, você pode rodar `npm run test` para executar os testes! 🎉

