import { describe, it, expect } from 'vitest';
import { soma } from './coverage-test.util';

describe('Coverage Test', () => {
  it('should sum two numbers correctly', () => {
    const result = soma(2, 3);
    expect(result).toBe(5);
  });

  it('should handle negative numbers', () => {
    const result = soma(-1, 1);
    expect(result).toBe(0);
  });

  it('should handle zero', () => {
    const result = soma(0, 0);
    expect(result).toBe(0);
  });
});