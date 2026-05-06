import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums/role.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const createContext = (user?: any) => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => ({ user })),
    })),
  });

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new RolesGuard(reflector);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    const result = guard.canActivate(createContext());

    expect(result).toBe(true);
  });

  it('allows access for admin users regardless of required roles', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.MANAGER]);

    const result = guard.canActivate(createContext({ role: 'admin' }));

    expect(result).toBe(true);
  });

  it('allows access when user role matches required roles', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.MANAGER, Role.ADMIN]);

    const result = guard.canActivate(createContext({ role: 'manager' }));

    expect(result).toBe(true);
  });

  it('throws when user or role is missing', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    expect(() => guard.canActivate(createContext())).toThrow(
      new ForbiddenException('User not found or role not defined'),
    );
  });

  it('throws when the user role is not allowed', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.HR]);

    expect(() =>
      guard.canActivate(createContext({ role: 'employee' })),
    ).toThrow(ForbiddenException);
  });
});