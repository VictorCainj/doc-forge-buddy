# 🧪 Guia de Teste: Copiar Documentos com Imagens

## Como Testar a Nova Funcionalidade

### 1. Iniciar o Projeto

```bash
npm run dev
```

### 2. Gerar um Documento

Navegue para qualquer uma das páginas:

- **Contratos** → Criar documento de rescisão
- **Devolutiva ao Locatário**
- **Devolutiva ao Proprietário**
- **Termo de Recebimento**
- **Análise de Vistoria**

### 3. Clicar em "Copiar"

1. Aguarde o botão mostrar **"Copiando..."** (com spinner)
2. Você verá a mensagem:
   > **"Documento copiado!"**  
   > _"Documento copiado com texto, formatação e imagens! Pronto para colar no e-mail."_

### 4. Colar em um E-mail

Abra seu cliente de e-mail preferido:

#### Gmail (Web)

1. Abra o Gmail
2. Clique em "Escrever"
3. **Ctrl+V** (ou Cmd+V no Mac) no corpo do e-mail
4. ✅ Verifique: Logo da Madia deve aparecer no topo

#### Outlook (Web)

1. Abra o Outlook Web
2. Clique em "Nova mensagem"
3. **Ctrl+V** no corpo do e-mail
4. ✅ Verifique: Logo da Madia deve aparecer no topo

#### Outlook Desktop

1. Abra o Outlook Desktop
2. Nova mensagem
3. **Ctrl+V** no corpo
4. ✅ Verifique: Logo da Madia + formatação completa

---

## ✅ O Que Deve Funcionar

### Documentos com Logo da Madia (13 templates)

Todos os documentos abaixo têm o logo que será convertido:

1. ✅ Termo de Recebimento de Chaves
2. ✅ Devolutiva ao Proprietário
3. ✅ Devolutiva ao Locatário
4. ✅ Devolutiva de Cobrança de Consumo
5. ✅ Notificação de Agendamento
6. ✅ Devolutiva Proprietário (WhatsApp)
7. ✅ Devolutiva Locatário (WhatsApp)
8. ✅ Devolutiva Comercial
9. ✅ Devolutiva Caderninho
10. ✅ Distrato de Contrato de Locação
11. ✅ Termo de Recusa de Assinatura (E-mail)
12. ✅ Termo de Recusa de Assinatura (PDF)
13. ✅ Status de Vistoria (WhatsApp)

### Documentos com Imagens de Exemplo

Template de **Cobrança de Consumo** inclui:

- Imagem de exemplo de conta de energia (CPFL)
- Imagem de exemplo de conta de água (DAEV)

---

## 🎯 Resultado Esperado

### Ao Colar no E-mail Você Deve Ver:

```
┌─────────────────────────────────────────┐
│  [LOGO MADIA]         Valinhos, 12/10/25│
├─────────────────────────────────────────┤
│                                         │
│  TERMO DE RECEBIMENTO DE CHAVES        │
│                                         │
│  Pelo presente, recebemos as chaves... │
│                                         │
│  [Restante do texto formatado]         │
│                                         │
│  _______________________                │
│  ASSINATURA                            │
└─────────────────────────────────────────┘
```

### Detalhes Importantes:

- ✅ Logo da Madia visível no topo (altura 150px)
- ✅ Data alinhada à direita
- ✅ Textos em **negrito** preservados
- ✅ Espaçamentos e margens corretos
- ✅ Fonte Arial aplicada
- ✅ Quebras de linha mantidas

---

## 🔍 Testes Adicionais

### Teste de Performance

1. Copiar documento grande (com múltiplas imagens)
2. Verificar que o spinner aparece
3. Aguardar conversão (deve ser rápida, < 2 segundos)
4. Confirmar cópia bem-sucedida

### Teste de Cache

1. Copiar um documento
2. Copiar o MESMO documento novamente
3. Segunda cópia deve ser mais rápida (imagens em cache)

### Teste de Fallback

Se alguma imagem falhar:

- ⚠️ Documento ainda é copiado
- ⚠️ Imagem que falhou fica como URL
- ✅ Restante funciona normalmente

---

## 🐛 Possíveis Problemas e Soluções

### Problema: Imagem não aparece no e-mail

**Possíveis causas:**

- Bloqueio CORS da imagem externa
- Cliente de e-mail bloqueia imagens embutidas

**Solução:**

- Nossa implementação já trata CORS com fallback
- Se persistir, a imagem aparece como link

### Problema: Botão fica "travado" em "Copiando..."

**Causa:** Timeout na conversão de imagem
**Solução:** Recarregar página (raro)

### Problema: Formatação perdida

**Causa:** Cliente de e-mail não suporta HTML
**Solução:** Nosso fallback copia como texto simples

---

## 📊 Checklist de Teste Completo

### Navegadores

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari

### Clientes de E-mail (Web)

- [ ] Gmail
- [ ] Outlook Web
- [ ] Yahoo Mail

### Clientes de E-mail (Desktop)

- [ ] Outlook Desktop
- [ ] Thunderbird
- [ ] Apple Mail

### Tipos de Documento

- [ ] Termo de Recebimento
- [ ] Devolutiva Locatário
- [ ] Devolutiva Proprietário
- [ ] Devolutiva Cobrança (com imagens de exemplo)

---

## 💡 Dicas

1. **Primeiro teste no Gmail Web** - É o mais fácil e confiável
2. **Aguarde o "Copiando..."** - Mostra que está processando imagens
3. **Cole imediatamente após copiar** - Clipboard tem prazo de validade
4. **Use Ctrl+V**, não botão direito → Colar - Mais confiável

---

## 🎉 Sucesso!

Se você vir o logo da Madia e toda a formatação preservada no e-mail, a funcionalidade está funcionando perfeitamente!

**Próximo passo:** Use normalmente no dia a dia para enviar documentos por e-mail.

---

**Implementado em:** 12 de outubro de 2025  
**Arquivos criados:**

- `src/utils/imageToBase64.ts`
- `IMPLEMENTACAO_COPIAR_DOCUMENTOS.md`
- `TESTE_COPIAR_IMAGENS.md`

**Arquivos modificados:**

- `src/utils/copyTextUtils.ts`
- `src/components/ui/copy-button.tsx`
