import { Test, TestingModule } from '@nestjs/testing';
import { GoogleStrategy } from './google.strategy';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/role.enum';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let configService: Partial<ConfigService>;
  let usersService: Partial<UsersService>;

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, any> = {
          GOOGLE_CLIENT_ID: 'test-client-id',
          GOOGLE_CLIENT_SECRET: 'test-client-secret',
          GOOGLE_CALLBACK_URL: 'http://localhost:3001/auth/google/callback',
        };
        return config[key];
      }),
    };

    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        { provide: ConfigService, useValue: configService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should throw error when GOOGLE_CLIENT_ID is missing', () => {
    (configService as any).get = jest.fn((key: string) => {
      if (key === 'GOOGLE_CLIENT_ID') return null;
      return 'test-value';
    });

    expect(() => {
      new GoogleStrategy(
        configService as ConfigService,
        usersService as UsersService,
      );
    }).toThrow('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set');
  });

  it('should throw error when GOOGLE_CLIENT_SECRET is missing', () => {
    (configService as any).get = jest.fn((key: string) => {
      if (key === 'GOOGLE_CLIENT_SECRET') return null;
      return 'test-value';
    });

    expect(() => {
      new GoogleStrategy(
        configService as ConfigService,
        usersService as UsersService,
      );
    }).toThrow('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set');
  });

  it('should return null when no email in profile', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

    const result = await strategy.validate('accessToken', 'refreshToken', {
      emails: [],
    } as any);

    expect(result).toBeNull();
  });

  it('should return existing user if found', async () => {
    const existingUser = { _id: 'user-123', email: 'test@example.com', name: 'Test User' };
    (usersService.findByEmail as jest.Mock).mockResolvedValue(existingUser);

    const result = await strategy.validate('accessToken', 'refreshToken', {
      emails: [{ value: 'test@example.com' }],
      displayName: 'Test User',
    } as any);

    expect(result).toEqual(existingUser);
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('should create new user if not found', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
    const newUser = {
      _id: 'new-user-123',
      email: 'newuser@example.com',
      name: 'New User',
      role: Role.EMPLOYEE,
      status: 'active',
      isGoogleUser: true,
    };
    (usersService.create as jest.Mock).mockResolvedValue(newUser);

    const result = await strategy.validate('accessToken', 'refreshToken', {
      emails: [{ value: 'newuser@example.com' }],
      displayName: 'New User',
    } as any);

    expect(result).toEqual(newUser);
    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'newuser@example.com',
        role: Role.EMPLOYEE,
        status: 'active',
        isGoogleUser: true,
      }),
    );
  });

  it('should use profile displayName when available', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
    (usersService.create as jest.Mock).mockResolvedValue({});

    await strategy.validate('accessToken', 'refreshToken', {
      emails: [{ value: 'test@example.com' }],
      displayName: 'Display Name From Profile',
    } as any);

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Display Name From Profile',
      }),
    );
  });

  it('should construct name from given and family names if displayName is not available', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
    (usersService.create as jest.Mock).mockResolvedValue({});

    await strategy.validate('accessToken', 'refreshToken', {
      emails: [{ value: 'test@example.com' }],
      displayName: null,
      name: { givenName: 'John', familyName: 'Doe' },
    } as any);

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'John Doe',
      }),
    );
  });

  it('should use email as name if no displayName or name parts available', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
    (usersService.create as jest.Mock).mockResolvedValue({});

    await strategy.validate('accessToken', 'refreshToken', {
      emails: [{ value: 'test@example.com' }],
      displayName: null,
      name: { givenName: '', familyName: '' },
    } as any);

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test@example.com',
      }),
    );
  });

  it('should create user with GOOGLE prefix in matricule', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
    (usersService.create as jest.Mock).mockResolvedValue({});

    await strategy.validate('accessToken', 'refreshToken', {
      emails: [{ value: 'test@example.com' }],
      displayName: 'Test User',
    } as any);

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        matricule: expect.stringMatching(/^GOOGLE-\d+$/),
      }),
    );
  });

  it('should set isGoogleUser to true for new users', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
    (usersService.create as jest.Mock).mockResolvedValue({});

    await strategy.validate('accessToken', 'refreshToken', {
      emails: [{ value: 'test@example.com' }],
      displayName: 'Test User',
    } as any);

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        isGoogleUser: true,
      }),
    );
  });

  it('should return created user', async () => {
    const createdUser = {
      _id: 'created-user-id',
      email: 'created@example.com',
      isGoogleUser: true,
    };
    (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
    (usersService.create as jest.Mock).mockResolvedValue(createdUser);

    const result = await strategy.validate('accessToken', 'refreshToken', {
      emails: [{ value: 'created@example.com' }],
      displayName: 'Created User',
    } as any);

    expect(result).toEqual(createdUser);
  });

  it('should use givenName only if familyName is missing', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
    (usersService.create as jest.Mock).mockResolvedValue({});

    await strategy.validate('accessToken', 'refreshToken', {
      emails: [{ value: 'test@example.com' }],
      displayName: null,
      name: { givenName: 'John', familyName: '' },
    } as any);

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'John',
      }),
    );
  });

  it('should use familyName only if givenName is missing', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
    (usersService.create as jest.Mock).mockResolvedValue({});

    await strategy.validate('accessToken', 'refreshToken', {
      emails: [{ value: 'test@example.com' }],
      displayName: null,
      name: { givenName: '', familyName: 'Doe' },
    } as any);

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Doe',
      }),
    );
  });
});
