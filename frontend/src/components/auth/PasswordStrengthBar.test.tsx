import { describe, expect, it } from 'vitest';
import { getPasswordStrength } from './PasswordStrengthBar';

describe('getPasswordStrength', () => {
  it('scores password length and character diversity', () => {
    expect(getPasswordStrength('').score).toBe(0);
    expect(getPasswordStrength('abcdefgh').score).toBe(1);
    expect(getPasswordStrength('abcdefghijkl').score).toBe(2);
    expect(getPasswordStrength('Abcdefghijkl').score).toBe(3);
    expect(getPasswordStrength('Abcdefghijkl1').score).toBe(4);
    expect(getPasswordStrength('Abcdefghijkl1!').score).toBe(5);
  });
});
