import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
<<<<<<< HEAD
=======
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Session } from './schema/session.schema';
>>>>>>> feature/participation-history-tracking

describe('AuthService', () => {
  let service: AuthService;

<<<<<<< HEAD
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
=======
  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockSessionModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: getModelToken(Session.name), useValue: mockSessionModel },
      ],
>>>>>>> feature/participation-history-tracking
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
