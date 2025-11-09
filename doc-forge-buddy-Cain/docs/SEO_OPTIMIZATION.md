# SEO & Discoverability Optimizations

## 1. META TAGS DINÂMICAS

// Componente para meta tags dinâmicas
const SEOHead = ({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website' 
}) => {
  return (
    <Head>
      {/* Meta básico */}
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Doc Forge Buddy" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Schema.org */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Doc Forge Buddy",
          "description": description,
          "url": url,
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web"
        })}
      </script>
    </Head>
  );
};

// 2. ESTRUTURA DE HEADING

// Hierarquia clara de headings
const ContractPage = () => (
  <div>
    <SEOHead 
      title="Gerenciar Contratos | Doc Forge Buddy"
      description="Sistema completo para gestão de contratos de locação imobiliária"
    />
    
    <main>
      <h1>Gestão de Contratos</h1> {/* 1 H1 por página */}
      
      <section>
        <h2>Contratos Ativos</h2> {/* H2 */}
        <h3>Próximos Vencimentos</h3> {/* H3 */}
      </section>
      
      <section>
        <h2>Estatísticas</h2> {/* H2 */}
        <h3>Performance Mensal</h3> {/* H3 */}
      </section>
    </main>
  </div>
);

// 3. SCHEMA STRUCTURED DATA

// Schema para contratos
const ContractSchema = ({ contract }) => ({
  "@context": "https://schema.org",
  "@type": "LegalDocument",
  "name": `Contrato de Locação - ${contract.property}`,
  "description": `Contrato de locação do imóvel ${contract.property}`,
  "dateCreated": contract.createdAt,
  "dateModified": contract.updatedAt,
  "legalDocumentType": "Rental Agreement",
  "contract": {
    "@type": "Agreement",
    "party": [
      {
        "@type": "Person",
        "name": contract.locador
      },
      {
        "@type": "Person", 
        "name": contract.locatario
      }
    ]
  }
});

// 4. SITEMAP DINÂMICO

// Gerar sitemap baseado em rotas dinâmicas
const generateSitemap = async () => {
  const routes = [
    '/', '/dashboard', '/contratos', '/vistorias',
    ...(await getDynamicRoutes()) // Contratos, relatórios, etc.
  ];
  
  return `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${routes.map(route => `
      <url>
        <loc>${process.env.NEXT_PUBLIC_BASE_URL}${route}</loc>
        <changefreq>${getChangeFreq(route)}</changefreq>
        <priority>${getPriority(route)}</priority>
      </url>
    `).join('')}
  </urlset>`;
};

// 5. BREADCRUMBS

const Breadcrumbs = ({ items }) => (
  <nav aria-label="Breadcrumb">
    <ol className="flex items-center space-x-2">
      {items.map((item, index) => (
        <li key={index} className="flex items-center">
          {index > 0 && <span className="text-gray-400 mx-2">/</span>}
          {item.href ? (
            <Link href={item.href} className="text-blue-600 hover:underline">
              {item.name}
            </Link>
          ) : (
            <span className="text-gray-600">{item.name}</span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);

// 6. INTERNAL LINKING STRATEGY

// Links contextuais para SEO interno
const RelatedContracts = ({ currentContract }) => {
  const related = useRelatedContracts(currentContract.id);
  
  return (
    <div className="mt-8">
      <h3>Contratos Relacionados</h3>
      <ul>
        {related.map(contract => (
          <li key={contract.id}>
            <Link 
              href={`/contratos/${contract.id}`}
              className="text-blue-600 hover:underline"
            >
              {contract.property} - {contract.locatario}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

// 7. IMAGE SEO

// Otimização para imagens
const OptimizedImage = ({ src, alt, ...props }) => (
  <img
    src={src}
    alt={alt}
    loading="lazy"
    decoding="async"
    {...props}
  />
);

// 8. URL STRUCTURE

// URLs semânticas e SEO-friendly
const routes = {
  contracts: '/contratos',
  contractDetails: '/contratos/[id]',
  newContract: '/contratos/novo',
  reports: '/relatorios',
  dashboard: '/dashboard'
};

// 9. LOADING & ERROR STATES

// Structured data para estados de loading
const LoadingSchema = {
  "@context": "https://schema.org",
  "@type": "WebPageElement",
  "name": "Loading",
  "description": "Content is being loaded"
};

const ErrorSchema = {
  "@context": "https://schema.org", 
  "@type": "ErrorPage",
  "name": "Error",
  "description": "An error occurred"
};
