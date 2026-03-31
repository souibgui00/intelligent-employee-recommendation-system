import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
<<<<<<< HEAD
=======
import { AuthService } from './auth.service';
>>>>>>> feature/participation-history-tracking

describe('AuthController', () => {
  let controller: AuthController;

<<<<<<< HEAD
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
=======
  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
>>>>>>> feature/participation-history-tracking
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
