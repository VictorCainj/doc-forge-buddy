# Sistema de Design Visual - Guia de Edição

Este documento explica as classes utilitárias e efeitos visuais disponíveis para fácil customização.

## Classes Utilitárias de Efeitos Visuais

### Cards Premium

#### `.premium-card`

Card padrão com efeitos premium:

- Sombra suave multi-camadas
- Gradiente sutil no hover
- Elevação suave ao passar o mouse
- Transições suaves de 300ms

```tsx
<Card className="premium-card">{/* Conteúdo */}</Card>
```

#### `.elevated-card`

Card com efeito de elevação mais pronunciado:

- Elevação maior no hover
- Animação de bounce suave
- Ideal para cards de estatísticas

```tsx
<div className="elevated-card p-5">{/* Conteúdo */}</div>
```

### Backgrounds

#### `.premium-gradient-bg`

Background profissional com gradiente sutil:

- Gradiente de três pontos
- Cores neutras suaves
- Perfeito para páginas principais

```tsx
<div className="min-h-screen premium-gradient-bg">
  {/* Conteúdo da página */}
</div>
```

#### `.pattern-overlay`

Adiciona padrão de pontos sutil:

- Padrão radial discreto
- Opacidade baixa (50%)
- Não interfere na legibilidade

```tsx
<div className="pattern-overlay">{/* Conteúdo */}</div>
```

### Efeitos de Hover

#### `.glow-on-hover`

Adiciona brilho azul sutil no hover:

- Sombra colorida suave
- Ideal para botões e cards importantes

```tsx
<button className="glow-on-hover">Botão</button>
```

#### `.scale-on-hover`

Escala suavemente ao passar o mouse:

- Scale de 1.02x
- Transição suave
- Ideal para ícones e avatares

```tsx
<div className="scale-on-hover">
  <Icon />
</div>
```

#### `.border-glow`

Adiciona borda com brilho no hover:

- Gradiente multi-colorido
- Aparece apenas no hover
- Perfeito para destacar elementos

```tsx
<div className="border-glow rounded-lg">{/* Conteúdo */}</div>
```

### Ícones

#### `.icon-container`

Container de ícone com efeito de brilho:

- Brilho radial no hover
- Transição suave
- Use com `scale-on-hover` para máximo efeito

```tsx
<div className="icon-container w-14 h-14 bg-neutral-200 rounded-xl">
  <Icon className="h-7 w-7" />
</div>
```

### Texto

#### `.text-gradient`

Texto com gradiente azul:

- Gradiente Material Design
- Apenas para texto importante
- Use com moderação

```tsx
<h1 className="text-gradient">Título Destacado</h1>
```

### Animações

#### `.subtle-pulse`

Animação de pulso sutil:

- 3 segundos de duração
- Muito discreto
- Ideal para elementos importantes

```tsx
<div className="subtle-pulse">{/* Conteúdo */}</div>
```

#### `.shimmer`

Efeito shimmer para loading:

- Animação de 2 segundos
- Ideal para skeletons
- Background com gradiente animado

```tsx
<div className="shimmer w-full h-4 rounded" />
```

## Combinando Efeitos

### Exemplo: Card Premium Completo

```tsx
<Card className="premium-card glow-on-hover scale-on-hover">
  <CardHeader>
    <div className="icon-container w-12 h-12 bg-neutral-200 rounded-lg">
      <Icon className="h-6 w-6" />
    </div>
    <CardTitle className="text-gradient">Título</CardTitle>
  </CardHeader>
  <CardContent>{/* Conteúdo */}</CardContent>
</Card>
```

### Exemplo: Background de Página

```tsx
<div className="min-h-screen premium-gradient-bg pattern-overlay">
  <div className="bg-white/80 backdrop-blur-sm">{/* Header */}</div>
  {/* Conteúdo */}
</div>
```

## Performance

Todos os efeitos são otimizados para performance:

- ✅ Usam apenas CSS (sem JavaScript)
- ✅ Transições com `transform` e `opacity` (GPU accelerated)
- ✅ `will-change` aplicado automaticamente
- ✅ Sem animações pesadas que afetam FPS

## Customização

### Ajustar Intensidade dos Efeitos

Edite `src/index.css` para ajustar:

- **Sombras**: Modifique valores em `.premium-card:hover`
- **Gradientes**: Ajuste opacidades em `.premium-card::before`
- **Duração**: Mude `duration-300` para valores diferentes
- **Cores**: Alterar valores HSL nos gradientes

### Adicionar Novos Efeitos

1. Adicione a classe em `src/index.css` dentro de `@layer utilities`
2. Use `@apply` para combinar classes Tailwind
3. Use `transition-*` para animações suaves
4. Teste performance com DevTools

## Boas Práticas

1. ✅ Use efeitos sutis - menos é mais
2. ✅ Combine no máximo 2-3 efeitos por elemento
3. ✅ Teste em dispositivos móveis
4. ✅ Mantenha consistência visual
5. ✅ Priorize performance sobre efeitos excessivos

## Exemplos de Uso por Página

### Página de Contratos

- Background: `premium-gradient-bg`
- Header: `bg-white/80 backdrop-blur-sm`
- Cards: `premium-card` (automático via componente Card)
- Ícones: `icon-container scale-on-hover`

### Painel Admin

- Background: `premium-gradient-bg`
- Cards de stats: `elevated-card`
- Ícones: `icon-container`

### Formulários

- Cards: `premium-card`
- Inputs: Efeitos padrão do shadcn/ui
- Botões: `glow-on-hover` para ações principais
