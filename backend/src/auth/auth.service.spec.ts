import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Session } from './schema/session.schema';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../common/services/email.service';

import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockUserId = new Types.ObjectId().toHexString();
  const mockEmail = 'test@example.com';
  const mockPassword = 'SecurePassword123!';
  const mockHashedPassword = '$2b$10$abcdefghijklmnopqrstuvwxyz';

  const mockUser = {
    _id: mockUserId,
    email: mockEmail,
    name: 'Test User',
    role: 'EMPLOYEE',
    matricule: 'MAT001',
    telephone: '123456789',
    date_embauche: new Date('2023-01-01'),
    department_id: new Types.ObjectId(),
    manager_id: new Types.ObjectId(),
    status: 'active',
    en_ligne: true,
    cvUrl: 'https://example.com/cv.pdf',
    avatar: 'https://example.com/avatar.jpg',
    skills: ['Node.js', 'TypeScript'],
    position: 'Developer',
    jobDescription: 'Full Stack Developer',
    yearsOfExperience: 5,
    location: 'New York',
    isFaceIdEnabled: false,
    password: mockHashedPassword,
    toObject: jest.fn().mockReturnValue({
      _id: mockUserId,
      email: mockEmail,
      name: 'Test User',
      role: 'EMPLOYEE',
    }),
  };

  const mockSession = {
    _id: new Types.ObjectId(),
    userId: mockUserId,
    refreshToken: 'refresh-token-123',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isRevoked: false,
    save: jest.fn().mockResolvedValue(true),
  };

  const mockUsersService = {
    findByEmail: jest.fn().mockResolvedValue(mockUser),
    findOne: jest.fn().mockResolvedValue(mockUser),
    create: jest.fn().mockResolvedValue(mockUser),
    saveResetToken: jest.fn().mockResolvedValue(true),
    findByResetToken: jest.fn().mockResolvedValue(mockUser),
    updatePassword: jest.fn().mockResolvedValue(mockUser),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('jwt-token-123'),
    verify: jest.fn().mockReturnValue({ email: mockEmail, sub: mockUserId, role: 'EMPLOYEE' }),
  };

  const mockSessionModel: any = jest.fn().mockImplementation(() => mockSession);
  mockSessionModel.findOne = jest.fn().mockResolvedValue(mockSession);
  mockSessionModel.findOneAndUpdate = jest.fn().mockResolvedValue(mockSession);
  mockSessionModel.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 2 });

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_REFRESH_EXPIRES_IN: '7d',
        FRONTEND_URL: 'http://localhost:5173',
      };
      return config[key];
    }),
  };

  const mockEmailService = {
    sendResetPasswordEmail: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: getModelToken(Session.name), useValue: mockSessionModel },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('returns user if email and password are valid', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.validateUser(mockEmail, mockPassword);

      expect(result).toBeDefined();
      expect(result.email).toBe(mockEmail);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(mockEmail);
      expect(bcrypt.compare).toHaveBeenCalledWith(mockPassword, mockHashedPassword);
    });

    it('returns null if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null);

      const result = await service.validateUser(mockEmail, mockPassword);

      expect(result).toBeNull();
    });

    it('returns null if password is incorrect', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      const result = await service.validateUser(mockEmail, mockPassword);

      expect(result).toBeNull();
    });

    it('excludes password from returned user object', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.validateUser(mockEmail, mockPassword);

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    it('returns access token, refresh token and user data', async () => {
      const result = await service.login(mockUser);

      expect(result.access_token).toBe('jwt-token-123');
      expect(result.refresh_token).toBe('jwt-token-123');
      expect(result.expiresIn).toBe(900); // 15 minutes
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(mockEmail);
      expect(result.user.role).toBe('EMPLOYEE');
    });

    it('creates JWT payload with correct claims', async () => {
      await service.login(mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockEmail,
        sub: mockUserId,
        role: 'EMPLOYEE',
      });
    });

    it('saves session to database', async () => {
      const saveSpy = jest.spyOn(mockSession, 'save');

      await service.login(mockUser);

      expect(mockSessionModel).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
    });

    it('sets refresh token expiration', async () => {
      await service.login(mockUser);

      const callArg = (mockSessionModel as jest.Mock).mock.calls[0][0];
      expect(callArg.expiresAt).toBeDefined();
      expect(callArg.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('refresh', () => {
    it('returns new access token with valid refresh token', async () => {
      const result = await service.refresh('refresh-token-123');

      expect(result.access_token).toBe('jwt-token-123');
      expect(result.refresh_token).toBe('refresh-token-123');
      expect(result.expiresIn).toBe(900);
    });

    it('throws if refresh token is invalid', async () => {
      mockJwtService.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('throws if session is revoked', async () => {
      mockSessionModel.findOne.mockResolvedValueOnce(null);

      await expect(service.refresh('refresh-token-123')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('throws if session is expired', async () => {
      mockSessionModel.findOne.mockResolvedValueOnce({
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.refresh('refresh-token-123')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('throws if session does not exist', async () => {
      mockSessionModel.findOne.mockResolvedValueOnce(null);

      await expect(service.refresh('refresh-token-123')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('throws if user not found', async () => {
      mockUsersService.findOne.mockResolvedValueOnce(null);

      await expect(service.refresh('refresh-token-123')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('logout', () => {
    it('revokes session', async () => {
      const result = await service.logout('refresh-token-123');

      expect(mockSessionModel.findOneAndUpdate).toHaveBeenCalledWith(
        { refreshToken: 'refresh-token-123' },
        { isRevoked: true },
        { new: true }
      );
      expect(result.message).toBe('Logged out successfully');
    });

    it('throws if session not found', async () => {
      mockSessionModel.findOneAndUpdate.mockResolvedValueOnce(null);

      await expect(service.logout('invalid-token')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('logoutAll', () => {
    it('revokes all active sessions for user', async () => {
      const result = await service.logoutAll(mockUserId);

      expect(mockSessionModel.updateMany).toHaveBeenCalledWith(
        { userId: mockUserId, isRevoked: false },
        { isRevoked: true }
      );
      expect(result.message).toBe('Logged out from all devices');
    });
  });

  describe('register', () => {
    it('creates new user and returns login response', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null);

      const registerDto = {
        email: 'newuser@example.com',
        password: 'NewPassword123!',
        name: 'New User',
      };

      const result = await service.register(registerDto as any);

      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerDto.email,
          role: 'EMPLOYEE',
          status: 'active',
        })
      );
      expect(result.access_token).toBeDefined();
    });

    it('throws if email already exists', async () => {
      const registerDto = {
        email: mockEmail,
        password: 'Password123!',
        name: 'Test User',
      };

      await expect(service.register(registerDto as any)).rejects.toThrow(
        ConflictException
      );
    });

    it('forces EMPLOYEE role for self-registration', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null);

      const registerDto = {
        email: 'admin@example.com',
        password: 'Password123!',
        name: 'Admin User',
        role: 'ADMIN',
      };

      await service.register(registerDto as any);

      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'EMPLOYEE' })
      );
    });
  });

  describe('forgotPassword', () => {
    it('sends reset email if user exists', async () => {
      const result = await service.forgotPassword(mockEmail);

      expect(mockUsersService.saveResetToken).toHaveBeenCalled();
      expect(mockEmailService.sendResetPasswordEmail).toHaveBeenCalled();
      expect(result.message).toBe('Password reset email sent successfully.');
    });

    it('returns safe message if user does not exist', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null);

      const result = await service.forgotPassword('nonexistent@example.com');

      expect(result.message).toContain('If an account');
      expect(mockEmailService.sendResetPasswordEmail).not.toHaveBeenCalled();
    });

    it('creates reset token with expiration', async () => {
      await service.forgotPassword(mockEmail);

      expect(mockUsersService.saveResetToken).toHaveBeenCalledWith(
        mockUserId,
        expect.any(String),
        expect.any(Date)
      );
    });

    it('includes reset link in email', async () => {
      await service.forgotPassword(mockEmail);

      const resetEmailCall = (mockEmailService.sendResetPasswordEmail as jest.Mock).mock.calls[0];
      expect(resetEmailCall[2]).toContain('/reset-password?token=');
    });
  });

  describe('resetPassword', () => {
    it('updates password with valid token', async () => {
      const newPassword = 'NewPassword123!';

      const result = await service.resetPassword('valid-reset-token', newPassword);

      expect(mockUsersService.updatePassword).toHaveBeenCalledWith(
        mockUserId,
        newPassword
      );
      expect(result.message).toContain('reset successfully');
    });

    it('throws if token is invalid', async () => {
      mockUsersService.findByResetToken.mockResolvedValueOnce(null);

      await expect(service.resetPassword('invalid-token', 'NewPass123!')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('faceLogin', () => {
    it('returns login response for user with face ID enabled', async () => {
      const userWithFaceId = { ...mockUser, isFaceIdEnabled: true };
      mockUsersService.findByEmail.mockResolvedValueOnce(userWithFaceId);

      const result = await service.faceLogin(mockEmail);

      expect(result.access_token).toBeDefined();
      expect(result.user).toBeDefined();
    });

    it('throws if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null);

      await expect(service.faceLogin('nonexistent@example.com')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('throws if face ID is not enabled', async () => {
      const userWithoutFaceId = { ...mockUser, isFaceIdEnabled: false };
      mockUsersService.findByEmail.mockResolvedValueOnce(userWithoutFaceId);

      await expect(service.faceLogin(mockEmail)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});
