import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * Provider de tema para o application
 */
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Detectar tema do sistema
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Resolver tema final
  const resolveTheme = (currentTheme: 'light' | 'dark' | 'system') => {
    if (currentTheme === 'system') {
      const systemTheme = getSystemTheme();
      setResolvedTheme(systemTheme);
      return systemTheme;
    }
    setResolvedTheme(currentTheme);
    return currentTheme;
  };

  // Aplicar tema ao documento
  const applyTheme = (themeToApply: 'light' | 'dark') => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(themeToApply);
    
    // Salvar no localStorage
    localStorage.setItem('app-theme', themeToApply);
  };

  // Função para alternar tema
  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
    toast.success(`Tema ${newTheme === 'light' ? 'claro' : 'escuro'} ativado`);
  };

  // Inicializar tema
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(resolveTheme(savedTheme));
    } else {
      applyTheme(resolveTheme(theme));
    }

    // Escutar mudanças no tema do sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme(getSystemTheme());
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Escutar mudanças na preferência do usuário
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(resolveTheme(savedTheme));
    }
  }, []);

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default useTheme;