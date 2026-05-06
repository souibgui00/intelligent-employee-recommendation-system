import { generatePassword } from './password.util';

describe('generatePassword', () => {
  it('should be defined', () => {
    expect(generatePassword).toBeDefined();
  });

  it('should generate a password with default length of 10', () => {
    const password = generatePassword();
    expect(password).toHaveLength(10);
  });

  it('should generate a password with custom length', () => {
    const password = generatePassword(20);
    expect(password).toHaveLength(20);
  });

  it('should generate a password with length 5', () => {
    const password = generatePassword(5);
    expect(password).toHaveLength(5);
  });

  it('should generate a password containing only allowed characters', () => {
    const allowedChars = /^[ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%]+$/;
    const password = generatePassword();
    expect(password).toMatch(allowedChars);
  });

  it('should generate different passwords on multiple calls', () => {
    const password1 = generatePassword();
    const password2 = generatePassword();
    // With high probability they should be different
    expect(password1 === password2).toBe(false);
  });

  it('should generate a password with at least some variety', () => {
    const passwords = Array.from({ length: 10 }, () => generatePassword(100));
    const uniquePasswords = new Set(passwords);
    expect(uniquePasswords.size).toBeGreaterThan(1);
  });

  it('should handle very small length', () => {
    const password = generatePassword(1);
    expect(password).toHaveLength(1);
    expect(/[ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%]/.test(password)).toBe(true);
  });

  it('should handle large length', () => {
    const password = generatePassword(1000);
    expect(password).toHaveLength(1000);
  });

  it('should contain numbers, letters, or special chars', () => {
    const password = generatePassword(50);
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%]/.test(password);

    // At least one of these should be present
    expect(hasLower || hasUpper || hasNumber || hasSpecial).toBe(true);
  });

  it('should not contain undefined or null characters', () => {
    const password = generatePassword();
    expect(password).not.toContain('undefined');
    expect(password).not.toContain('null');
  });
});
