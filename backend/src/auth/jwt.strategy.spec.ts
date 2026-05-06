import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('throws when JWT_SECRET is missing', () => {
    const configService = { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService;

    expect(() => new JwtStrategy(configService)).toThrow('JWT_SECRET is not set');
  });

  it('creates a strategy when JWT_SECRET is configured', () => {
    const configService = { get: jest.fn().mockReturnValue('test-secret') } as unknown as ConfigService;

    const strategy = new JwtStrategy(configService);

    expect(strategy).toBeDefined();
  });

  it('maps JWT payload to user details', async () => {
    const configService = { get: jest.fn().mockReturnValue('test-secret') } as unknown as ConfigService;
    const strategy = new JwtStrategy(configService);

    const result = await strategy.validate({
      sub: 'user-1',
      email: 'user@example.com',
      role: 'EMPLOYEE',
    });

    expect(result).toEqual({
      userId: 'user-1',
      email: 'user@example.com',
      role: 'EMPLOYEE',
    });
  });
});