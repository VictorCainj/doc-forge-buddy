# UX/UI Performance Optimizations

## 1. CRITICAL CSS & FONT LOADING

// 1.1 Critical CSS inline no head
<head>
  <style>
    /* CSS crítico renderizado primeiro */
    .header { 
      display: flex; 
      background: #fff;
    }
    .hero { 
      min-height: 60vh;
      display: flex; 
      align-items: center;
    }
  </style>
</head>

// 1.2 Font loading otimizado
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link 
  href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
  rel="stylesheet"
/>

// CSS para evitar FOUT (Flash of Unstyled Text)
.font-face {
  font-display: swap; /* ou optional para fontes críticas */
}

// 1.3 Theme switching otimizado
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  
  useEffect(() => {
    // Prevenir flash no tema
    const root = document.documentElement;
    root.classList.add('no-transition');
    root.setAttribute('data-theme', theme);
    
    setTimeout(() => {
      root.classList.remove('no-transition');
    }, 100);
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

## 2. INTERACTIVE ELEMENTS

// 2.1 Estados de loading mais responsivos
const Button = ({ loading, children, ...props }) => {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={cn(
        "relative overflow-hidden",
        loading && "cursor-wait",
        !loading && "transition-all duration-200"
      )}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner className="h-4 w-4" />
        </div>
      )}
      <span className={loading ? "opacity-0" : "opacity-100"}>
        {children}
      </span>
    </button>
  );
};

// 2.2 Skeleton loading
const CardSkeleton = () => (
  <div className="animate-pulse bg-gray-100 rounded-lg p-4 space-y-3">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
  </div>
);

// 2.3 Infinite scroll otimizado
const useInfiniteScroll = (callback, hasMore) => {
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const handleScroll = throttle(() => {
      if (!isLoading && hasMore) {
        const { scrollTop, clientHeight, scrollHeight } = 
          document.documentElement;
        
        if (scrollTop + clientHeight >= scrollHeight - 200) {
          callback();
        }
      }
    }, 100);
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [callback, hasMore, isLoading]);
};

## 3. ANIMATION PERFORMANCE

// 3.1 CSS transforms para animações fluidas
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
  will-change: opacity, transform;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

// 3.2 Reduzir animações para usuários com motion preferences
@media (prefers-reduced-motion: reduce) {
  .animate-pulse,
  .animate-bounce,
  .animate-spin {
    animation: none;
  }
  
  * {
    transition-duration: 0.01ms !important;
  }
}

// 3.3 GPU acceleration para listas grandes
.virtualized-list {
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
}
