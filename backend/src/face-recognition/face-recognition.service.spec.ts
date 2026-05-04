import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { FaceRecognitionService } from './face-recognition.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('FaceRecognitionService', () => {
  let service: FaceRecognitionService;

  const mockUserId = new Types.ObjectId().toHexString();
  const mockEmail = 'user@example.com';

  const mockUser = {
    _id: mockUserId,
    name: 'John Doe',
    email: mockEmail,
    facePicture: 'https://cloudinary.example.com/face.jpg',
    avatar: 'https://cloudinary.example.com/avatar.jpg',
    isFaceIdEnabled: true,
    password: 'hashed_password',
    select: jest.fn().mockReturnThis(),
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'face.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 102400,
    buffer: Buffer.from('face image content'),
    destination: '',
    filename: 'face.jpg',
    path: '/uploads/face.jpg',
    stream: undefined as any,
  };

  const mockCloudinaryResponse = {
    public_id: 'face-pic-123',
    url: 'http://cloudinary.example.com/face.jpg',
    secure_url: 'https://cloudinary.example.com/face.jpg',
    format: 'jpg',
  };

  const mockUserModel = {
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const mockCloudinaryService = {
    uploadFile: jest.fn().mockResolvedValue(mockCloudinaryResponse),
  };

  function chainable(result: any) {
    const p = Promise.resolve(result) as any;
    p.select = jest.fn().mockReturnValue(p);
    p.exec = jest.fn().mockResolvedValue(result);
    return p;
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    mockUserModel.findOne.mockReturnValue(chainable(mockUser));
    mockUserModel.findByIdAndUpdate.mockReturnValue(chainable(mockUser));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FaceRecognitionService,
        {
          provide: getModelToken('User'),
          useValue: mockUserModel,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    }).compile();

    service = module.get<FaceRecognitionService>(FaceRecognitionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFaceProfile', () => {
    it('should retrieve face profile for user', async () => {
      const result = await service.getFaceProfile(mockEmail);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: mockEmail });
      expect(result).toBeDefined();
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe(mockEmail);
      expect(result.isFaceIdEnabled).toBe(true);
    });

    it('should use facePicture if available', async () => {
      const result = await service.getFaceProfile(mockEmail);

      expect(result.picture).toBe('https://cloudinary.example.com/face.jpg');
    });

    it('should fall back to avatar if facePicture not set', async () => {
      const userWithoutFace = { ...mockUser, facePicture: null };
      mockUserModel.findOne.mockReturnValue(chainable(userWithoutFace));

      const result = await service.getFaceProfile(mockEmail);

      expect(result.picture).toBe('https://cloudinary.example.com/avatar.jpg');
    });

    it('should throw if user not found', async () => {
      mockUserModel.findOne.mockReturnValue(chainable(null));

      await expect(service.getFaceProfile('nonexistent@example.com')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should select only required fields', async () => {
      await service.getFaceProfile(mockEmail);

      const selectSpy = (mockUserModel.findOne as jest.Mock).mock.results[0].value.select;
      expect(selectSpy).toHaveBeenCalledWith('name email facePicture isFaceIdEnabled avatar');
    });
  });

  describe('registerFace', () => {
    it('should upload face image and update user', async () => {
      const result = await service.registerFace(mockUserId, mockFile);

      expect(mockCloudinaryService.uploadFile).toHaveBeenCalledWith(mockFile);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        {
          facePicture: mockCloudinaryResponse.secure_url,
          isFaceIdEnabled: true,
        },
        { new: true }
      );
    });

    it('should return updated user without password', async () => {
      const { password, ...userWithoutPassword } = mockUser;
      mockUserModel.findByIdAndUpdate.mockReturnValueOnce(chainable(userWithoutPassword));

      const result = await service.registerFace(mockUserId, mockFile);

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
    });

    it('should enable face ID for user', async () => {
      await service.registerFace(mockUserId, mockFile);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({ isFaceIdEnabled: true }),
        { new: true }
      );
    });

    it('should handle cloudinary upload errors', async () => {
      mockCloudinaryService.uploadFile.mockRejectedValueOnce(
        new Error('Upload failed')
      );

      await expect(service.registerFace(mockUserId, mockFile)).rejects.toThrow(
        'Upload failed'
      );
    });

    it('should throw if user not found after update', async () => {
      mockUserModel.findByIdAndUpdate.mockReturnValue(chainable(null));

      await expect(service.registerFace(mockUserId, mockFile)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should handle different file types', async () => {
      const pngFile: Express.Multer.File = {
        ...mockFile,
        originalname: 'face.png',
        mimetype: 'image/png',
      };

      await service.registerFace(mockUserId, pngFile);

      expect(mockCloudinaryService.uploadFile).toHaveBeenCalledWith(pngFile);
    });

    it('should update face picture URL correctly', async () => {
      const customCloudinaryResponse = {
        ...mockCloudinaryResponse,
        secure_url: 'https://custom-cloudinary.example.com/custom-face.jpg',
      };
      mockCloudinaryService.uploadFile.mockResolvedValueOnce(customCloudinaryResponse);

      await service.registerFace(mockUserId, mockFile);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          facePicture: 'https://custom-cloudinary.example.com/custom-face.jpg',
        }),
        { new: true }
      );
    });
  });

  describe('disableFaceId', () => {
    it('should disable face ID for user', async () => {
      await service.disableFaceId(mockUserId);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        { isFaceIdEnabled: false },
        { new: true }
      );
    });

    it('should return updated user without password', async () => {
      const { password, ...userWithoutPassword } = mockUser;
      mockUserModel.findByIdAndUpdate.mockReturnValueOnce(chainable(userWithoutPassword));

      const result = await service.disableFaceId(mockUserId);

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
    });

    it('should exclude password from response', async () => {
      mockUserModel.findByIdAndUpdate.mockReturnValue(
        chainable({ ...mockUser, password: undefined })
      );

      const result = await service.disableFaceId(mockUserId);

      expect(result!.password).toBeUndefined();
    });

    it('should handle non-existent users gracefully', async () => {
      mockUserModel.findByIdAndUpdate.mockReturnValue(chainable(null));

      const result = await service.disableFaceId('nonexistent-user-id');

      expect(result).toBeNull();
    });

    it('should return user with isFaceIdEnabled false', async () => {
      const userWithDisabledFace = { ...mockUser, isFaceIdEnabled: false };
      mockUserModel.findByIdAndUpdate.mockReturnValue(chainable(userWithDisabledFace));

      const result = await service.disableFaceId(mockUserId);

      expect(result!.isFaceIdEnabled).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete face registration workflow', async () => {
      // Register face
      await service.registerFace(mockUserId, mockFile);
      expect(mockCloudinaryService.uploadFile).toHaveBeenCalled();

      // Get face profile
      mockUserModel.findOne.mockReturnValue(chainable({ ...mockUser, isFaceIdEnabled: true }));
      const profile = await service.getFaceProfile(mockEmail);
      expect(profile.isFaceIdEnabled).toBe(true);
    });

    it('should handle face registration and disabling', async () => {
      // Register face
      await service.registerFace(mockUserId, mockFile);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({ isFaceIdEnabled: true }),
        { new: true }
      );

      // Disable face
      await service.disableFaceId(mockUserId);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenLastCalledWith(
        mockUserId,
        { isFaceIdEnabled: false },
        { new: true }
      );
    });
  });
});
