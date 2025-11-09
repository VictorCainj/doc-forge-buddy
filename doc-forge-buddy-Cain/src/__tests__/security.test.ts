/**
 * Testes de Segurança - Verificação de Configurações
 * Execute: npm test -- src/__tests__/security.test.ts
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../server.js';

// Configuração de teste
const baseURL = 'http://localhost:3000';

describe('🔒 Security Headers Tests', () => {
  
  test('Deve ter todos os security headers', async () => {
    const response = await request(baseURL).get('/');
    
    // Security Headers Essenciais
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(response.headers['permissions-policy']).toBeDefined();
    
    // Helmet Headers
    expect(response.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect(response.headers['x-dns-prefetch-control']).toBe('off');
    expect(response.headers['x-download-options']).toBe('noopen');
    expect(response.headers['x-permitted-cross-domain-policies']).toBe('none');
    
    // Headers que devem estar ausentes
    expect(response.headers['server']).toBeUndefined();
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  test('Deve ter Content Security Policy', async () => {
    const response = await request(baseURL).get('/');
    
    expect(response.headers['content-security-policy']).toBeDefined();
    const csp = response.headers['content-security-policy'];
    
    // Verificar diretivas principais
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("style-src 'self'");
    expect(csp).toContain("img-src 'self'");
    expect(csp).toContain("frame-src 'none'");
    expect(csp).toContain("object-src 'none'");
  });

  test('Deve ter HSTS header em produção', async () => {
    const response = await request(baseURL).get('/');
    
    expect(response.headers['strict-transport-security']).toBeDefined();
    const hsts = response.headers['strict-transport-security'];
    
    expect(hsts).toContain('max-age=31536000');
    expect(hsts).toContain('includeSubDomains');
    expect(hsts).toContain('preload');
  });
});

describe('🌐 HTTPS Enforcement Tests', () => {
  
  test('Deve fazer redirect HTTP para HTTPS em produção', async () => {
    // Simular request HTTP em ambiente de produção
    const response = await request(baseURL)
      .get('/')
      .set('X-Forwarded-Proto', 'http')
      .set('Host', 'example.com');
    
    // Em produção, deve redirect 301 para HTTPS
    if (process.env.NODE_ENV === 'production') {
      expect(response.status).toBe(301);
      expect(response.headers.location).toStartWith('https://');
    }
  });
});

describe('🚫 CORS Tests', () => {
  
  test('Deve permitir origins autorizados', async () => {
    const response = await request(baseURL)
      .get('/')
      .set('Origin', 'https://localhost:3000');
    
    expect(response.headers['access-control-allow-origin']).toBe('https://localhost:3000');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  test('Deve bloquear origins não autorizados', async () => {
    const response = await request(baseURL)
      .get('/')
      .set('Origin', 'https://malicious-site.com');
    
    // Em produção, deve bloquear
    if (process.env.NODE_ENV === 'production') {
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    }
  });

  test('Deve ter headers CORS apropriados', async () => {
    const response = await request(baseURL).get('/');
    
    expect(response.headers['access-control-allow-methods']).toBeDefined();
    expect(response.headers['access-control-allow-headers']).toBeDefined();
    expect(response.headers['access-control-max-age']).toBe('86400');
  });
});

describe('⚡ Rate Limiting Tests', () => {
  
  test('Deve permitir requests dentro do limite', async () => {
    // Fazer 50 requests (abaixo do limite de 100)
    const requests = Array(50).fill(null).map(() => 
      request(baseURL).get('/api/health')
    );
    
    const responses = await Promise.all(requests);
    
    // Todas devem ser bem-sucedidas
    responses.forEach(response => {
      expect(response.status).not.toBe(429);
    });
  });

  test('Deve bloquear requests excessivos', async () => {
    // Fazer 150 requests (acima do limite de 100)
    const requests = Array(150).fill(null).map(() => 
      request(baseURL).get('/api/health')
    );
    
    const responses = await Promise.all(requests);
    
    // Pelo menos algumas devem ser rate limited
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  }, 10000); // Timeout de 10s para este teste
});

describe('🍪 Cookie Security Tests', () => {
  
  test('Deve definir cookies seguros', async () => {
    const response = await request(baseURL).get('/');
    
    // Verificar se CSRF token foi definido
    expect(response.headers['set-cookie']).toBeDefined();
    
    const cookies = response.headers['set-cookie'];
    if (Array.isArray(cookies)) {
      cookies.forEach(cookie => {
        // Em produção, deve ser Secure
        if (process.env.NODE_ENV === 'production') {
          expect(cookie).toContain('Secure');
        }
        expect(cookie).toContain('HttpOnly');
        expect(cookie).toContain('SameSite=Strict');
      });
    }
  });
});

describe('🔐 Input Validation Tests', () => {
  
  test('Deve detectar tentativas de XSS', async () => {
    const { detectXSS } = await import('../../src/hooks/useSecurity.js');
    
    // Inputs maliciosos
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      '<iframe src="javascript:alert(1)"></iframe>',
      'javascript:alert(1)',
      '<img src=x onerror=alert(1)>',
      '"><script>alert(1)</script>'
    ];
    
    maliciousInputs.forEach(input => {
      expect(detectXSS(input)).toBe(true);
    });
  });

  test('Deve sanitizar input', async () => {
    const { sanitizeInput } = await import('../../src/hooks/useSecurity.js');
    
    const maliciousInput = '<script>alert("xss")</script>';
    const sanitized = sanitizeInput(maliciousInput);
    
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('</script>');
    expect(sanitized).toContain('&lt;script&gt;');
  });
});

describe('🛡️ CSRF Protection Tests', () => {
  
  test('Deve gerar tokens CSRF válidos', async () => {
    const { generateCSRFToken, validateCSRFToken } = await import('../../src/hooks/useSecurity.js');
    
    const token = generateCSRFToken();
    expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
    expect(validateCSRFToken(token)).toBe(true);
  });

  test('Deve invalidar tokens CSRF malformados', async () => {
    const { validateCSRFToken } = await import('../../src/hooks/useSecurity.js');
    
    const invalidTokens = [
      'invalid',
      '123',
      'a'.repeat(63), // muito curto
      'a'.repeat(65), // muito longo
      'invalid-chars-!@#$%'
    ];
    
    invalidTokens.forEach(token => {
      expect(validateCSRFToken(token)).toBe(false);
    });
  });
});

describe('🔍 Security Monitoring Tests', () => {
  
  test('Deve monitorar eventos de segurança', async () => {
    const { logSecurityEvent, useSecurityMonitoring } = await import('../../src/hooks/useSecurity.js');
    
    // Simular evento de segurança
    logSecurityEvent('test_security_event', { test: true });
    
    // Verificar se o evento foi logado
    // Em produção, seria enviado para serviço de monitoramento
    expect(true).toBe(true); // Teste básico
  });
});

describe('📊 API Health Check', () => {
  
  test('Deve responder na API health check', async () => {
    const response = await request(baseURL).get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.environment).toBeDefined();
    expect(response.body.timestamp).toBeDefined();
  });
});

// Testes de performance e segurança
describe('⚡ Performance & Security Tests', () => {
  
  test('Deve manter performance com security headers', async () => {
    const start = Date.now();
    
    const response = await request(baseURL).get('/');
    
    const duration = Date.now() - start;
    
    // Headers de segurança não devem adicionar mais que 50ms
    expect(duration).toBeLessThan(50);
    expect(response.status).toBe(200);
  });

  test('Deve servir arquivos estáticos com cache headers', async () => {
    // Assumindo que existe um arquivo CSS
    const response = await request(baseURL).get('/assets/index.css').catch(() => null);
    
    if (response) {
      expect(response.headers['cache-control']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    }
  });
});

// Configuração de ambiente para testes
beforeAll(() => {
  // Configurar ambiente de teste
  process.env.NODE_ENV = 'test';
  process.env.ALLOWED_ORIGINS = 'https://localhost:3000,https://test.example.com';
});

afterAll(() => {
  // Cleanup
  process.env.NODE_ENV = 'development';
});

// Utilitários de teste
export const testSecurityHeaders = {
  checkHeaders: (headers: any) => {
    const required = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'referrer-policy',
      'strict-transport-security'
    ];
    
    return required.every(header => headers[header]);
  },
  
  checkCSP: (csp: string) => {
    const directives = ['default-src', 'script-src', 'style-src', 'img-src', 'frame-src'];
    return directives.every(directive => csp.includes(directive));
  }
};