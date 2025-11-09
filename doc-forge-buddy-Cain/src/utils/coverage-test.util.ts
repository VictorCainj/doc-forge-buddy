import { describe, it, expect } from 'vitest';

function soma(a: number, b: number) {
  return a + b;
}

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