import { cn, priceRange } from '../utils';

describe('cn (class name utility)', () => {
  it('should merge class names', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('should resolve Tailwind conflicts (last wins)', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
  });
});

describe('priceRange', () => {
  it('should format a two-element array as "min-max"', () => {
    expect(priceRange([5, 25])).toBe('5-25');
  });

  it('should format a single-element array as just that value', () => {
    expect(priceRange([10])).toBe('10');
  });

  it('should return empty string for empty array', () => {
    expect(priceRange([])).toBe('');
  });

  it('should return empty string for null/undefined', () => {
    expect(priceRange(null)).toBe('');
    expect(priceRange(undefined)).toBe('');
  });
});