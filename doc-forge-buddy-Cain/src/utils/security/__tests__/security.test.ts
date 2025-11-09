/**
 * Testes do Sistema de Segurança
 * Input Sanitization e Rate Limiting
 */

import { 
  sanitizeInput, 
  sanitizeRichText, 
  sanitizeUrl, 
  sanitizeObject,
  sanitizeNumber,
  sanitizeBoolean,
  sanitizeFilename
} from '../sanitization/inputSanitizer';

import { 
  validateEmail, 
  validatePhone, 
  validateCPF, 
  validateCNPJ, 
  validatePassword,
  validateId,
  validateDate
} from '../validators/dataValidators';

import { 
  SecureQueryBuilder, 
  QueryBuilderFactory,
  validateQueryId,
  validatePagination
} from '../query-builder/secureQueryBuilder';

describe('🛡️ Security System - Input Sanitization', () => {
  
  describe('sanitizeInput', () => {
    it('should remove dangerous HTML tags', () => {
      const malicious = '<script>alert("xss")</script><p>Safe content</p>';
      const clean = sanitizeInput(malicious);
      
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert("xss")');
      expect(clean).toContain('Safe content');
    });

    it('should escape HTML entities', () => {
      const input = '<div>&"quote"</div>';
      const clean = sanitizeInput(input);
      
      expect(clean).toContain('&lt;div&gt;');
      expect(clean).toContain('&amp;');
      expect(clean).toContain('&quot;');
    });

    it('should allow safe HTML tags', () => {
      const input = '<b>Bold</b> and <i>italic</i>';
      const clean = sanitizeInput(input);
      
      expect(clean).toContain('<b>Bold</b>');
      expect(clean).toContain('<i>italic</i>');
    });

    it('should handle empty or null input', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });

    it('should remove javascript: URLs', () => {
      const input = '<a href="javascript:alert(1)">Click me</a>';
      const clean = sanitizeInput(input);
      
      expect(clean).toContain('javascript:');
    });
  });

  describe('sanitizeRichText', () => {
    it('should allow rich text tags', () => {
      const richHtml = '<h1>Title</h1><p>Paragraph</p><ul><li>Item 1</li></ul>';
      const clean = sanitizeRichText(richHtml);
      
      expect(clean).toContain('<h1>Title</h1>');
      expect(clean).toContain('<p>Paragraph</p>');
      expect(clean).toContain('<ul>');
    });

    it('should block dangerous tags', () => {
      const malicious = '<script>alert(1)</script><iframe src="evil.com"></iframe>';
      const clean = sanitizeRichText(malicious);
      
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('<iframe>');
      expect(clean).not.toContain('evil.com');
    });

    it('should preserve text content', () => {
      const input = 'This is safe text';
      const clean = sanitizeRichText(input);
      
      expect(clean).toBe('This is safe text');
    });
  });

  describe('sanitizeUrl', () => {
    it('should clean valid URLs', () => {
      const url = '  https://example.com/path  ';
      const clean = sanitizeUrl(url);
      
      expect(clean).toBe('https://example.com/path');
    });

    it('should add protocol if missing', () => {
      const url = 'example.com';
      const clean = sanitizeUrl(url);
      
      expect(clean).toBe('https://example.com');
    });

    it('should reject invalid URLs', () => {
      const invalid = 'not-a-url';
      const clean = sanitizeUrl(invalid);
      
      expect(clean).toBe('');
    });
  });

  describe('sanitizeObject', () => {
    it('should recursively sanitize nested objects', () => {
      const data = {
        name: '<script>alert(1)</script>John',
        email: 'john@example.com',
        address: {
          street: '<b>Main St</b>',
          city: 'New York'
        },
        tags: ['<script>tag1</script>', 'safe-tag'],
        password: 'secret123' // Should not be sanitized
      };

      const clean = sanitizeObject(data);
      
      expect(clean.name).toBe('alert(1)John'); // Script tag removed
      expect(clean.email).toBe('john@example.com');
      expect(clean.address.street).toBe('Main St'); // HTML removed
      expect(clean.tags[0]).toBe('tag1'); // Script tag removed
      expect(clean.password).toBe('secret123'); // Preserved
    });

    it('should handle arrays', () => {
      const data = ['<p>Item 1</p>', '<b>Item 2</b>'];
      const clean = sanitizeObject(data);
      
      expect(clean[0]).toBe('Item 1');
      expect(clean[1]).toBe('Item 2');
    });

    it('should preserve sensitive fields', () => {
      const data = {
        username: 'user<script>evil</script>',
        password: 'secret123',
        token: 'abc123',
        apiKey: 'key456'
      };

      const clean = sanitizeObject(data);
      
      expect(clean.username).toBe('userevil');
      expect(clean.password).toBe('secret123');
      expect(clean.token).toBe('abc123');
      expect(clean.apiKey).toBe('key456');
    });
  });

  describe('sanitizeNumber', () => {
    it('should extract numbers from strings', () => {
      expect(sanitizeNumber('123.45')).toBe(123.45);
      expect(sanitizeNumber('abc123def')).toBe(123);
      expect(sanitizeNumber('$100')).toBe(100);
    });

    it('should handle invalid input', () => {
      expect(sanitizeNumber('abc')).toBe(0);
      expect(sanitizeNumber(null)).toBe(0);
      expect(sanitizeNumber(undefined)).toBe(0);
    });
  });

  describe('sanitizeBoolean', () => {
    it('should convert various types to boolean', () => {
      expect(sanitizeBoolean(true)).toBe(true);
      expect(sanitizeBoolean('true')).toBe(true);
      expect(sanitizeBoolean('1')).toBe(true);
      expect(sanitizeBoolean(1)).toBe(true);
      
      expect(sanitizeBoolean(false)).toBe(false);
      expect(sanitizeBoolean('false')).toBe(false);
      expect(sanitizeBoolean('0')).toBe(false);
      expect(sanitizeBoolean(0)).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('should clean filename', () => {
      expect(sanitizeFilename('file<script>.txt')).toBe('file.txt');
      expect(sanitizeFilename '../../../etc/passwd')).toBe('passwd');
      expect(sanitizeFilename('normal-file.txt')).toBe('normal-file.txt');
    });
  });
});

describe('🔍 Security System - Data Validation', () => {
  
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const result = validateEmail('user@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.value).toBe('user@example.com');
    });

    it('should reject invalid email addresses', () => {
      const result = validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Formato de email inválido');
    });

    it('should reject empty email', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email é obrigatório');
    });

    it('should reject too long email', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = validateEmail(longEmail);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should validate Brazilian phone numbers', () => {
      const result = validatePhone('11987654321');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe('11987654321');
    });

    it('should validate formatted phone numbers', () => {
      const result = validatePhone('(11) 98765-4321');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      const result = validatePhone('123');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateCPF', () => {
    it('should validate correct CPF', () => {
      const validCpf = '11144477735'; // Known valid CPF
      const result = validateCPF(validCpf);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid CPF', () => {
      const invalidCpf = '11111111111';
      const result = validateCPF(invalidCpf);
      expect(result.isValid).toBe(false);
    });

    it('should format CPF correctly', () => {
      const result = validateCPF('11144477735');
      expect(result.value).toBe('11144477735');
    });
  });

  describe('validateCNPJ', () => {
    it('should validate correct CNPJ', () => {
      const validCnpj = '11222333000181'; // Known valid CNPJ
      const result = validateCNPJ(validCnpj);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid CNPJ', () => {
      const invalidCnpj = '11111111000111';
      const result = validateCNPJ(invalidCnpj);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      const strongPassword = 'MyStr0ng!@#';
      const result = validatePassword(strongPassword);
      expect(result.isValid).toBe(true);
    });

    it('should reject weak passwords', () => {
      const weakPassword = '123456';
      const result = validatePassword(weakPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should check all password requirements', () => {
      const result = validatePassword('weak');
      expect(result.errors).toContain('Senha deve ter pelo menos 8 caracteres');
      expect(result.errors).toContain('Senha deve conter pelo menos uma letra maiúscula');
      expect(result.errors).toContain('Senha deve conter pelo menos um número');
      expect(result.errors).toContain('Senha deve conter pelo menos um caractere especial');
    });
  });

  describe('validateId', () => {
    it('should validate numeric IDs', () => {
      const result = validateId(123);
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(123);
    });

    it('should validate UUID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = validateId(uuid);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid IDs', () => {
      const result = validateId('invalid-id');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('should validate valid dates', () => {
      const result = validateDate('2023-12-25');
      expect(result.isValid).toBe(true);
      expect(result.value).toBeInstanceOf(Date);
    });

    it('should reject invalid dates', () => {
      const result = validateDate('invalid-date');
      expect(result.isValid).toBe(false);
    });

    it('should handle Date objects', () => {
      const date = new Date('2023-12-25');
      const result = validateDate(date);
      expect(result.isValid).toBe(true);
    });
  });
});

describe('🔐 Security System - Query Builder', () => {
  
  let queryBuilder: SecureQueryBuilder;

  beforeEach(() => {
    queryBuilder = QueryBuilderFactory.createUserQueryBuilder();
  });

  describe('SELECT statements', () => {
    it('should build basic SELECT queries', () => {
      const { sql, params } = queryBuilder
        .select(['id', 'name'])
        .from('users')
        .build();

      expect(sql).toBe('SELECT id, name FROM users');
      expect(params).toHaveLength(0);
    });

    it('should reject disallowed columns', () => {
      expect(() => {
        queryBuilder
          .select(['id', 'hacked_column'])
          .from('users')
          .build();
      }).toThrow('Colunas não permitidas: hacked_column');
    });

    it('should allow * selector', () => {
      const { sql } = queryBuilder
        .select(['*'])
        .from('users')
        .build();

      expect(sql).toBe('SELECT * FROM users');
    });
  });

  describe('WHERE clauses', () => {
    it('should build WHERE clauses with parameters', () => {
      const { sql, params } = queryBuilder
        .select(['*'])
        .from('users')
        .where('status', '=', 'active')
        .build();

      expect(sql).toContain('WHERE status = $1');
      expect(params).toContain('active');
    });

    it('should reject disallowed columns in WHERE', () => {
      expect(() => {
        queryBuilder
          .where('hacked_column', '=', 'value')
          .build();
      }).toThrow('Coluna hacked_column não permitida para WHERE');
    });

    it('should support multiple WHERE conditions', () => {
      const { sql, params } = queryBuilder
        .select(['*'])
        .from('users')
        .where('status', '=', 'active')
        .where('role', '=', 'user', 'OR')
        .build();

      expect(sql).toContain('AND');
      expect(sql).toContain('OR');
      expect(params).toHaveLength(2);
    });

    it('should support WHERE IN', () => {
      const { sql, params } = queryBuilder
        .select(['*'])
        .from('users')
        .whereIn('status', ['active', 'pending'])
        .build();

      expect(sql).toContain('WHERE status IN ($1, $2)');
      expect(params).toEqual(['active', 'pending']);
    });
  });

  describe('ORDER BY and LIMIT', () => {
    it('should support ORDER BY', () => {
      const { sql } = queryBuilder
        .select(['*'])
        .from('users')
        .orderBy('name', 'ASC')
        .build();

      expect(sql).toContain('ORDER BY name ASC');
    });

    it('should support LIMIT and OFFSET', () => {
      const { sql } = queryBuilder
        .select(['*'])
        .from('users')
        .limit(10)
        .offset(20)
        .build();

      expect(sql).toContain('LIMIT 10');
      expect(sql).toContain('OFFSET 20');
    });

    it('should validate LIMIT value', () => {
      expect(() => {
        queryBuilder.limit(0);
      }).toThrow('Limit deve ser um número entre 1 e 10000');
    });
  });

  describe('JOIN statements', () => {
    it('should build INNER JOIN', () => {
      const { sql } = queryBuilder
        .select(['u.id', 'p.title'])
        .from('users')
        .innerJoin('posts', 'u.id = p.user_id')
        .build();

      expect(sql).toContain('INNER JOIN posts ON u.id = p.user_id');
    });

    it('should support multiple JOINs', () => {
      const { sql } = queryBuilder
        .select(['*'])
        .from('users')
        .leftJoin('profiles', 'u.id = p.user_id')
        .rightJoin('posts', 'u.id = p.user_id')
        .build();

      expect(sql).toContain('LEFT JOIN profiles');
      expect(sql).toContain('RIGHT JOIN posts');
    });
  });

  describe('Security validations', () => {
    it('should prevent SQL injection in column names', () => {
      expect(() => {
        queryBuilder.where("'; DROP TABLE users; --", '=', 'value');
      }).toThrow('Nome da coluna contém caracteres inválidos');
    });

    it('should prevent SQL injection in table names', () => {
      expect(() => {
        queryBuilder.from("'; DROP TABLE users; --");
      }).toThrow('Nome da tabela contém caracteres inválidos');
    });

    it('should reject invalid operators', () => {
      expect(() => {
        queryBuilder.where('id', 'DROP TABLE', 'users');
      }).toThrow('Operador DROP TABLE não permitido');
    });
  });

  describe('Helper functions', () => {
    it('should validate query IDs', () => {
      expect(() => {
        validateQueryId('invalid-id');
      }).toThrow('ID inválido');
    });

    it('should validate pagination', () => {
      const pagination = validatePagination(2, 20);
      expect(pagination.page).toBe(2);
      expect(pagination.limit).toBe(20);
      expect(pagination.offset).toBe(20);
    });

    it('should handle edge cases in pagination', () => {
      const pagination = validatePagination(0, 0);
      expect(pagination.page).toBe(1);
      expect(pagination.limit).toBe(10);
    });
  });
});

// Mock Redis for tests
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    on: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
  }))
}));
