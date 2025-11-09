// User fixtures
export const userFixtures = {
  default: {
    id: '1',
    email: 'user@example.com',
    name: 'John Doe',
    role: 'user' as const,
    avatar: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  
  admin: {
    id: '2',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin' as const,
    avatar: 'https://example.com/avatar.jpg',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  
  withProfile: {
    id: '3',
    email: 'profile@example.com',
    name: 'Profile User',
    role: 'user' as const,
    avatar: 'https://example.com/avatar2.jpg',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    profile: {
      phone: '+1234567890',
      address: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
    },
  },
};

// Contract fixtures
export const contractFixtures = {
  default: {
    id: '1',
    locatario: 'João Silva',
    locador: 'Maria Santos',
    endereco: 'Rua das Flores, 123',
    valor: 1000,
    dataInicio: '2024-01-01',
    dataFim: '2024-12-31',
    status: 'ativo' as const,
    tipo: 'residencial' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  
  expired: {
    id: '2',
    locatario: 'Pedro Costa',
    locador: 'Ana Pereira',
    endereco: 'Av. Principal, 456',
    valor: 1500,
    dataInicio: '2023-01-01',
    dataFim: '2023-12-31',
    status: 'expirado' as const,
    tipo: 'comercial' as const,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-12-31T23:59:59Z',
  },
  
  pending: {
    id: '3',
    locatario: 'Maria Oliveira',
    locador: 'Carlos Souza',
    endereco: 'Rua Nova, 789',
    valor: 1200,
    dataInicio: '2024-02-01',
    dataFim: '2025-01-31',
    status: 'pendente' as const,
    tipo: 'residencial' as const,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
};

// Document fixtures
export const documentFixtures = {
  pdf: {
    id: '1',
    nome: 'contrato-principal.pdf',
    tipo: 'pdf',
    tamanho: 1024 * 1024, // 1MB
    url: '/uploads/contrato-principal.pdf',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  
  image: {
    id: '2',
    nome: 'vistoria-1.jpg',
    tipo: 'image',
    tamanho: 512 * 1024, // 512KB
    url: '/uploads/vistoria-1.jpg',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  
  excel: {
    id: '3',
    nome: 'planilha-dados.xlsx',
    tipo: 'excel',
    tamanho: 256 * 1024, // 256KB
    url: '/uploads/planilha-dados.xlsx',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
};

// API Response fixtures
export const apiResponseFixtures = {
  success: {
    success: true,
    data: null,
    message: 'Operation successful',
  },
  
  error: {
    success: false,
    error: 'Error message',
    message: 'Operation failed',
  },
  
  notFound: {
    success: false,
    error: 'Not Found',
    message: 'Resource not found',
  },
  
  unauthorized: {
    success: false,
    error: 'Unauthorized',
    message: 'You are not authorized to perform this action',
  },
};

// Form fixtures
export const formFixtures = {
  contract: {
    locatario: '',
    locador: '',
    endereco: '',
    valor: '',
    dataInicio: '',
    dataFim: '',
    tipo: 'residencial',
  },
  
  user: {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  },
  
  login: {
    email: '',
    password: '',
  },
  
  register: {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  },
};

// Navigation fixtures
export const navigationFixtures = {
  headerItems: [
    { label: 'Dashboard', href: '/', current: true },
    { label: 'Contratos', href: '/contratos', current: false },
    { label: 'Documentos', href: '/documentos', current: false },
    { label: 'Usuários', href: '/usuarios', current: false },
  ],
  
  sidebarItems: [
    { label: 'Dashboard', icon: 'Dashboard', href: '/' },
    { label: 'Contratos', icon: 'FileText', href: '/contratos' },
    { label: 'Documentos', icon: 'Folder', href: '/documentos' },
    { label: 'Relatórios', icon: 'BarChart', href: '/relatorios' },
    { label: 'Configurações', icon: 'Settings', href: '/configuracoes' },
  ],
};

// Accessibility fixtures
export const accessibilityFixtures = {
  buttonLabels: {
    primary: 'Primary action',
    secondary: 'Secondary action',
    destructive: 'Delete item',
    ghost: 'More options',
  },
  
  formLabels: {
    required: 'This field is required',
    optional: 'Optional field',
    error: 'Invalid input',
    success: 'Valid input',
  },
  
  ariaLabels: {
    close: 'Close dialog',
    menu: 'Open navigation menu',
    search: 'Search contracts',
    filter: 'Filter results',
  },
};

// Performance fixtures
export const performanceFixtures = {
  largeDataSet: Array.from({ length: 1000 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    value: Math.random() * 1000,
    createdAt: new Date(2024, 0, 1 + (i % 365)).toISOString(),
  })),
  
  heavyComponent: {
    id: 'heavy-component',
    props: {
      data: Array.from({ length: 500 }, (_, i) => ({
        id: i,
        name: `Complex Data ${i}`,
        nested: {
          level1: {
            level2: {
              level3: `Deep nested value ${i}`,
            },
          },
        },
      })),
    },
  },
};

// Error boundary fixtures
export const errorFixtures = {
  networkError: {
    message: 'Network request failed',
    status: 0,
    name: 'NetworkError',
  },
  
  validationError: {
    message: 'Validation failed',
    errors: {
      field1: 'Field 1 is required',
      field2: 'Field 2 must be a valid email',
      field3: 'Field 3 must be greater than 0',
    },
  },
  
  authError: {
    message: 'Authentication required',
    status: 401,
    code: 'AUTH_REQUIRED',
  },
  
  serverError: {
    message: 'Internal server error',
    status: 500,
    code: 'INTERNAL_ERROR',
  },
};