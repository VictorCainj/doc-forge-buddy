# Dependências Necessárias para o Sistema de Segurança

## Dependências Principais

```json
{
  "dependencies": {
    "dompurify": "^3.0.5",
    "isomorphic-dompurify": "^1.13.0",
    "validator": "^13.11.0",
    "express-rate-limit": "^7.1.5",
    "redis": "^4.6.10"
  },
  "optionalDependencies": {
    "rate-limit-redis": "^4.2.0"
  }
}
```

## Comando de Instalação

```bash
npm install dompurify isomorphic-dompurify validator express-rate-limit redis rate-limit-redis
```

## Verificação de Instalação

```bash
npm list dompurify validator express-rate-limit redis
```

## Configuração para Desenvolvimento

```json
{
  "devDependencies": {
    "@types/dompurify": "^3.0.5",
    "@types/validator": "^13.11.7",
    "@types/express-rate-limit": "^5.1.7"
  }
}
```

## Scripts de Teste

```json
{
  "scripts": {
    "test:security": "jest src/utils/security/__tests__/security.test.ts",
    "test:security:coverage": "jest --coverage src/utils/security/__tests__/security.test.ts"
  }
}
```
