# Animated Sidebar Component

Componente de sidebar animado baseado em Aceternity UI, adaptado para React Router.

## 📦 Dependências

Todas as dependências já estão instaladas no projeto:

- ✅ `framer-motion` (v12.23.12) - Animações
- ✅ `lucide-react` (v0.545.0) - Ícones
- ✅ `react-router-dom` (v6.30.1) - Navegação
- ✅ `tailwind-merge` + `clsx` - Utilitários CSS

## 🎯 Características

- **Animado com Framer Motion**: Transições suaves de expansão/colapso
- **Responsivo**: Versão desktop (hover) e mobile (drawer)
- **Dark Mode**: Suporte completo ao tema escuro
- **Hover Expand**: Desktop expande ao passar o mouse
- **Mobile Drawer**: Menu lateral deslizante no mobile

## 📁 Estrutura de Arquivos

```
src/
├── components/
│   ├── ui/
│   │   └── animated-sidebar.tsx      # Componente principal
│   └── AnimatedSidebarDemo.tsx       # Exemplo de uso
```

## 🚀 Como Usar

### Importação Básica

```typescript
import {
  AnimatedSidebar,
  SidebarBody,
  SidebarLink,
  useSidebar
} from "@/components/ui/animated-sidebar";
```

### Exemplo Mínimo

```tsx
import { useState } from "react";
import { AnimatedSidebar, SidebarBody, SidebarLink } from "@/components/ui/animated-sidebar";
import { Home, Settings } from "lucide-react";

function App() {
  const [open, setOpen] = useState(false);
  
  const links = [
    {
      label: "Home",
      href: "/",
      icon: <Home className="h-5 w-5" />
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />
    }
  ];

  return (
    <div className="flex h-screen">
      <AnimatedSidebar open={open} setOpen={setOpen}>
        <SidebarBody>
          <div className="flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>
        </SidebarBody>
      </AnimatedSidebar>
      
      <main className="flex-1">
        {/* Seu conteúdo aqui */}
      </main>
    </div>
  );
}
```

## 🔧 API do Componente

### `<AnimatedSidebar>`

Componente wrapper principal que fornece o contexto.

**Props:**
- `open?: boolean` - Estado de abertura (controlado)
- `setOpen?: (open: boolean) => void` - Função para controlar o estado
- `animate?: boolean` - Habilita/desabilita animações (padrão: `true`)
- `children: React.ReactNode` - Conteúdo do sidebar

### `<SidebarBody>`

Container para o conteúdo do sidebar. Renderiza versões desktop e mobile.

**Props:**
- Aceita todas as props de `motion.div` do Framer Motion
- `className?: string` - Classes CSS adicionais

### `<SidebarLink>`

Link individual do menu.

**Props:**
```typescript
interface Links {
  label: string;        // Texto do link
  href: string;         // URL de destino
  icon: React.ReactNode; // Ícone (componente React)
}

{
  link: Links;
  className?: string;
  ...props: LinkProps    // Props do react-router-dom Link
}
```

### `useSidebar()`

Hook para acessar o contexto do sidebar.

**Retorna:**
```typescript
{
  open: boolean;                              // Estado atual
  setOpen: (open: boolean) => void;          // Função de controle
  animate: boolean;                          // Estado de animação
}
```

## 💡 Casos de Uso

### 1. Sidebar com Logo e Avatar

```tsx
<AnimatedSidebar open={open} setOpen={setOpen}>
  <SidebarBody className="justify-between gap-10">
    {/* Seção superior com logo e links */}
    <div className="flex flex-col flex-1">
      <Logo />
      <div className="mt-8 flex flex-col gap-2">
        {links.map((link) => (
          <SidebarLink key={link.href} link={link} />
        ))}
      </div>
    </div>
    
    {/* Seção inferior com perfil */}
    <div>
      <SidebarLink
        link={{
          label: "Usuário",
          href: "/profile",
          icon: <img src="avatar.jpg" className="h-7 w-7 rounded-full" />
        }}
      />
    </div>
  </SidebarBody>
</AnimatedSidebar>
```

### 2. Sidebar Sem Animação (Sempre Aberto)

```tsx
<AnimatedSidebar open={true} animate={false}>
  <SidebarBody>
    {/* Conteúdo */}
  </SidebarBody>
</AnimatedSidebar>
```

### 3. Integração com Estado Global

```tsx
// Com Context API ou Zustand
const { sidebarOpen, toggleSidebar } = useAppStore();

<AnimatedSidebar open={sidebarOpen} setOpen={toggleSidebar}>
  <SidebarBody>
    {/* Conteúdo */}
  </SidebarBody>
</AnimatedSidebar>
```

## 🎨 Customização

### Cores e Tema

O componente usa classes Tailwind padrão. Para customizar:

```tsx
<SidebarBody className="bg-primary-500 dark:bg-primary-900">
  {/* Conteúdo */}
</SidebarBody>

<SidebarLink
  link={link}
  className="text-white hover:bg-primary-600"
/>
```

### Largura do Sidebar

Modifique as classes de largura:

```tsx
// Em animated-sidebar.tsx, linha ~97
animate={{
  width: animate ? (open ? "400px" : "80px") : "400px", // Customizado
}}
```

### Comportamento Mobile

O drawer mobile ocupa toda a tela. Para customizar:

```tsx
// Em animated-sidebar.tsx, linha ~133
<motion.div
  className="fixed h-full w-[80%] inset-0 ..." // w-full para w-[80%]
>
```

## 🔄 Diferenças da Versão Original (Next.js)

| Original (Next.js) | Adaptado (React Router) |
|-------------------|-------------------------|
| `import Link from "next/link"` | `import { Link } from "react-router-dom"` |
| `import Image from "next/image"` | `<img>` nativo |
| `<Link href="/">` | `<Link to="/">` |
| Next.js Image otimização | Sem otimização automática |

## 📚 Exemplo Completo

Veja o arquivo `src/components/AnimatedSidebarDemo.tsx` para um exemplo completo funcional.

## ⚠️ Notas Importantes

1. **Performance**: O sidebar usa `framer-motion` para animações. Para melhor performance, evite re-renderizações desnecessárias usando `React.memo()` ou `useMemo()`.

2. **Acessibilidade**: O componente não inclui atributos ARIA. Para melhor acessibilidade, adicione:
   ```tsx
   <AnimatedSidebar>
     <SidebarBody role="navigation" aria-label="Menu principal">
       {/* Conteúdo */}
     </SidebarBody>
   </AnimatedSidebar>
   ```

3. **Mobile**: O overlay do menu mobile usa `z-[100]`. Certifique-se de que não conflita com outros elementos de alto z-index.

4. **Imagens**: Use imagens do Unsplash para testes:
   ```tsx
   src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
   ```

## 🐛 Troubleshooting

**Sidebar não expande no hover:**
- Verifique se `animate={true}` está definido
- Confirme que o estado `open` está sendo atualizado

**Links não navegam:**
- Certifique-se de estar usando `react-router-dom` v6+
- Verifique se os componentes estão dentro de um `<BrowserRouter>`

**Animações não funcionam:**
- Verifique se `framer-motion` está instalado: `npm list framer-motion`
- Confirme que não há conflitos de versão

## 🔗 Recursos

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Lucide React Icons](https://lucide.dev/)
- [React Router v6](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)

