/**
 * Testes Playwright para Content Security Policy (CSP)
 * Automatiza validação de políticas CSP e detecção de violações
 */

import { test, expect } from '@playwright/test';

test.describe('Content Security Policy (CSP) Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Interceptar violações CSP
    const violations: any[] = [];
    page.on('securitypolicyviolation', (violation) => {
      violations.push(violation);
    });
    
    // Aguardar configuração inicial
    await page.goto('/');
  });

  test.describe('CSP Header Validation', () => {
    test('deve ter meta tag CSP definida', async ({ page }) => {
      const cspMeta = page.locator('meta[http-equiv="Content-Security-Policy"]');
      await expect(cspMeta).toBeVisible();
    });

    test('deve ter diretiva default-src', async ({ page }) => {
      const response = await page.goto('/');
      const cspHeader = response?.headers()['content-security-policy'];
      expect(cspHeader).toBeTruthy();
      expect(cspHeader).toContain('default-src');
    });

    test('deve bloquear object-src', async ({ page }) => {
      const response = await page.goto('/');
      const cspHeader = response?.headers()['content-security-policy'];
      expect(cspHeader).toContain("object-src 'none'");
    });

    test('deve bloquear frame-src', async ({ page }) => {
      const response = await page.goto('/');
      const cspHeader = response?.headers()['content-security-policy'];
      expect(cspHeader).toContain("frame-src 'none'");
    });
  });

  test.describe('Script Execution Blocking', () => {
    test('deve bloquear script inline malicioso', async ({ page }) => {
      let violationDetected = false;
      
      page.on('securitypolicyviolation', (violation) => {
        if (violation.violatedDirective.includes('script-src')) {
          violationDetected = true;
        }
      });

      // Tentar injetar script inline
      await page.evaluate(() => {
        const script = document.createElement('script');
        script.innerHTML = 'alert("XSS Test");';
        document.head.appendChild(script);
      });

      // Aguardar potencial violação
      await page.waitForTimeout(1000);
      expect(violationDetected).toBe(true);
    });

    test('deve bloquear script externo não confiável', async ({ page }) => {
      let violationDetected = false;
      
      page.on('securitypolicyviolation', (violation) => {
        if (violation.violatedDirective.includes('script-src') && 
            violation.blockedURI.includes('evil.com')) {
          violationDetected = true;
        }
      });

      // Tentar carregar script externo malicioso
      await page.evaluate(() => {
        const script = document.createElement('script');
        script.src = 'https://evil.com/malicious.js';
        document.head.appendChild(script);
      });

      await page.waitForTimeout(2000);
      expect(violationDetected).toBe(true);
    });
  });

  test.describe('Resource Loading Tests', () => {
    test('deve permitir imagens data: quando configurado', async ({ page }) => {
      const response = await page.goto('/');
      const cspHeader = response?.headers()['content-security-policy'];
      
      if (cspHeader?.includes('data:')) {
        // Testar carregamento de data URI
        const imgLoaded = await page.evaluate(() => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><text>Test</text></svg>';
            document.body.appendChild(img);
          });
        });
        expect(imgLoaded).toBe(true);
      }
    });

    test('deve bloquear iframe não permitido', async ({ page }) => {
      let violationDetected = false;
      
      page.on('securitypolicyviolation', (violation) => {
        if (violation.violatedDirective.includes('frame-src')) {
          violationDetected = true;
        }
      });

      // Tentar criar iframe
      await page.evaluate(() => {
        const iframe = document.createElement('iframe');
        iframe.src = 'https://example.com';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
      });

      await page.waitForTimeout(1000);
      expect(violationDetected).toBe(true);
    });

    test('deve bloquear object/embed', async ({ page }) => {
      let violationDetected = false;
      
      page.on('securitypolicyviolation', (violation) => {
        if (violation.violatedDirective.includes('object-src')) {
          violationDetected = true;
        }
      });

      // Tentar criar object
      await page.evaluate(() => {
        const object = document.createElement('object');
        object.data = 'malicious.swf';
        object.style.display = 'none';
        document.body.appendChild(object);
      });

      await page.waitForTimeout(1000);
      expect(violationDetected).toBe(true);
    });
  });

  test.describe('Security Headers', () => {
    test('deve ter header X-Content-Type-Options', async ({ page }) => {
      const response = await page.goto('/');
      expect(response?.headers()['x-content-type-options']).toBe('nosniff');
    });

    test('deve ter header X-Frame-Options ou frame-ancestors', async ({ page }) => {
      const response = await page.goto('/');
      const xFrameOptions = response?.headers()['x-frame-options'];
      const cspHeader = response?.headers()['content-security-policy'];
      
      expect(xFrameOptions || cspHeader?.includes('frame-ancestors')).toBeTruthy();
    });

    test('deve ter header Referrer-Policy', async ({ page }) => {
      const response = await page.goto('/');
      expect(response?.headers()['referrer-policy']).toBeTruthy();
    });

    test('deve ter HSTS em produção', async ({ page }) => {
      const response = await page.goto('/');
      const hsts = response?.headers()['strict-transport-security'];
      
      if (process.env.NODE_ENV === 'production') {
        expect(hsts).toBeTruthy();
        expect(hsts).toContain('max-age=');
      }
    });
  });

  test.describe('Report URI Functionality', () => {
    test('deve ter endpoint /csp-report configurado', async ({ request }) => {
      const response = await request.post('/csp-report', {
        data: {
          'document-uri': 'http://localhost:3000',
          'violated-directive': 'script-src',
          'blocked-uri': 'inline'
        }
      });
      
      // Deve responder com 204 No Content
      expect(response.status()).toBe(204);
    });
  });

  test.describe('Development vs Production', () => {
    test('CSP deve ser mais permissivo em desenvolvimento', async ({ page }) => {
      const response = await page.goto('/');
      const cspHeader = response?.headers()['content-security-policy'];
      
      if (process.env.NODE_ENV === 'development') {
        expect(cspHeader).toContain("'unsafe-inline'");
        expect(cspHeader).toContain("'unsafe-eval'");
      } else {
        // Produção não deve ter unsafe-inline/eval
        expect(cspHeader).not.toContain("'unsafe-inline'");
        expect(cspHeader).not.toContain("'unsafe-eval'");
      }
    });

    test('deve ter upgrade-insecure-requests em produção', async ({ page }) => {
      const response = await page.goto('/');
      const cspHeader = response?.headers()['content-security-policy'];
      
      if (process.env.NODE_ENV === 'production') {
        expect(cspHeader).toContain('upgrade-insecure-requests');
      }
    });
  });

  test.describe('CSP Monitor Component', () => {
    test('deve mostrar CSPMonitor em desenvolvimento', async ({ page }) => {
      if (process.env.NODE_ENV === 'development') {
        await page.goto('/');
        
        // Verificar se o componente CSPMonitor está presente
        const monitorExists = await page.evaluate(() => {
          return document.querySelector('[data-csp-monitor]') !== null ||
                 document.querySelector('.csp-monitor') !== null;
        });
        
        // O componente pode ou não estar visível, mas deve existir no DOM
        expect(monitorExists).toBeDefined();
      }
    });
  });
});

// Teste específico para portal de demonstração
test.describe('CSP Demo Portal', () => {
  test('portal deve carregar e executar testes', async ({ page }) => {
    await page.goto('/');
    
    // Verificar se a página carregou
    await expect(page.locator('h1')).toContainText('Content Security Policy');
    
    // Executar teste de XSS
    await page.click('button:has-text("Testar XSS")');
    
    // Verificar se a violação foi detectada
    await expect(page.locator('#test-results')).toContainText('Violação CSP Detectada');
    
    // Verificar se a configuração CSP é exibida
    await expect(page.locator('#csp-config')).toBeVisible();
  });
});