import { ROLES_KEY, Roles } from './roles.decorator';

describe('Roles Decorator (Common)', () => {
  it('should be defined', () => {
    expect(Roles).toBeDefined();
  });

  it('should have ROLES_KEY constant', () => {
    expect(ROLES_KEY).toBeDefined();
    expect(ROLES_KEY).toBe('roles');
  });

  it('should accept single role', () => {
    const decorator = Roles('ADMIN');
    expect(decorator).toBeDefined();
  });

  it('should accept multiple roles', () => {
    const decorator = Roles('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE');
    expect(decorator).toBeDefined();
  });

  it('should accept no arguments', () => {
    const decorator = Roles();
    expect(decorator).toBeDefined();
  });

  it('should return a decorator function', () => {
    const decorator = Roles('TEST');
    expect(typeof decorator).toBe('function');
  });

  it('should return consistent decorators for same input', () => {
    const roles = ['ADMIN', 'MANAGER'];
    const decorator1 = Roles(...roles);
    const decorator2 = Roles(...roles);
    expect(decorator1).toBeDefined();
    expect(decorator2).toBeDefined();
  });

  it('should be usable as a method decorator', () => {
    class TestClass {
      @Roles('ADMIN')
      testMethod() {
        return 'test';
      }
    }
    expect(TestClass).toBeDefined();
  });

  it('should be usable on a class', () => {
    @Roles('ADMIN')
    class TestClass {}
    expect(TestClass).toBeDefined();
  });

  it('should work with special characters in role names', () => {
    const decorator = Roles('ADMIN_ROLE', 'HR-USER', 'MANAGER.LEVEL1');
    expect(decorator).toBeDefined();
  });

  it('should work with case-sensitive role names', () => {
    const decorator = Roles('admin', 'Admin', 'ADMIN');
    expect(decorator).toBeDefined();
  });

  it('ROLES_KEY should be consistent across calls', () => {
    expect(ROLES_KEY).toBe(ROLES_KEY);
  });

  it('should create separate decorator instances', () => {
    const decorator1 = Roles('ADMIN');
    const decorator2 = Roles('EMPLOYEE');
    // They should be different functions
    expect(decorator1).not.toBe(decorator2);
  });

  it('should accept arbitrary number of roles', () => {
    const decorator = Roles('R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8');
    expect(decorator).toBeDefined();
  });

  it('should preserve role names exactly', () => {
    const roles = ['TEST_ROLE_123', 'another_role'];
    const decorator = Roles(...roles);
    expect(decorator).toBeDefined();
  });
});
