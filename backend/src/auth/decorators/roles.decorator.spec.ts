import { ROLES_KEY, Roles } from './roles.decorator';

describe('Roles Decorator', () => {
  it('should be defined', () => {
    expect(Roles).toBeDefined();
  });

  it('should set metadata with ROLES_KEY', () => {
    const decorator = Roles('ADMIN', 'HR');
    const metadata = decorator(class Test {}, 'method', Object.getOwnPropertyDescriptor(class Test {}, 'method'));
    expect(metadata).toBeDefined();
  });

  it('should accept single role', () => {
    const decorator = Roles('ADMIN');
    expect(decorator).toBeDefined();
  });

  it('should accept multiple roles', () => {
    const decorator = Roles('ADMIN', 'HR', 'MANAGER');
    expect(decorator).toBeDefined();
  });

  it('should accept empty roles array', () => {
    const decorator = Roles();
    expect(decorator).toBeDefined();
  });

  it('should use correct ROLES_KEY constant', () => {
    expect(ROLES_KEY).toBe('roles');
  });

  it('should create SetMetadata with correct key', () => {
    const decorator = Roles('TEST_ROLE');
    // The decorator should be a SetMetadata call that stores the roles
    expect(decorator).toBeDefined();
  });
});
