import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CloudinaryService } from './cloudinary.service';
import { v2 as cloudinary } from 'cloudinary';

jest.mock('cloudinary');

const streamifier = require('streamifier');
jest.mock('streamifier');

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  const mockCloudinaryResponse = {
    public_id: 'public-id-123',
    url: 'http://cloudinary.example.com/image.jpg',
    secure_url: 'https://cloudinary.example.com/image.jpg',
    format: 'jpg',
    resource_type: 'image',
    bytes: 102400,
    width: 800,
    height: 600,
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 102400,
    buffer: Buffer.from('test file content'),
    destination: '',
    filename: 'test-image.jpg',
    path: '/uploads/test-image.jpg',
    stream: undefined as any,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockUploadStream = {
      pipe: jest.fn().mockReturnValue(true),
    };

    // Mock cloudinary's uploader.upload_stream
    (cloudinary.uploader.upload_stream as jest.Mock) = jest
      .fn()
      .mockImplementation((callback) => {
        // Simulate successful upload
        setTimeout(() => {
          callback(null, mockCloudinaryResponse);
        }, 0);
        return mockUploadStream;
      });

    // Mock streamifier
    (streamifier.createReadStream as jest.Mock) = jest
      .fn()
      .mockReturnValue(mockUploadStream);

    const module: TestingModule = await Test.createTestingModule({
      providers: [CloudinaryService],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should successfully upload file to cloudinary', async () => {
      const result = await service.uploadFile(mockFile);

      expect(result).toBeDefined();
      expect(result.public_id).toBe('public-id-123');
      expect(result.secure_url).toBe('https://cloudinary.example.com/image.jpg');
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalled();
    });

    it('should call upload_stream with correct parameters', async () => {
      await service.uploadFile(mockFile);

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalled();
      expect(streamifier.createReadStream).toHaveBeenCalledWith(mockFile.buffer);
    });

    it('should pipe file buffer to upload stream', async () => {
      await service.uploadFile(mockFile);

      const mockStream = (streamifier.createReadStream as jest.Mock).mock.results[0].value;
      expect(mockStream.pipe).toHaveBeenCalled();
    });

    it('should return cloudinary response with all fields', async () => {
      const result = await service.uploadFile(mockFile);

      expect(result).toEqual(
        expect.objectContaining({
          public_id: expect.any(String),
          url: expect.any(String),
          secure_url: expect.any(String),
          format: 'jpg',
          resource_type: 'image',
        })
      );
    });

    it('should handle upload error', async () => {
      const uploadError = new Error('Upload failed');
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementationOnce(
        (callback) => {
          callback(uploadError);
          return { pipe: jest.fn() };
        }
      );

      await expect(service.uploadFile(mockFile)).rejects.toThrow('Upload failed');
    });

    it('should handle missing result from cloudinary', async () => {
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementationOnce(
        (callback) => {
          callback(null, null);
          return { pipe: jest.fn() };
        }
      );

      await expect(service.uploadFile(mockFile)).rejects.toThrow(
        'Cloudinary upload failed: No result returned'
      );
    });

    it('should handle different file types (PDF)', async () => {
      const pdfFile: Express.Multer.File = {
        ...mockFile,
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
      };

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementationOnce(
        (callback) => {
          callback(null, { ...mockCloudinaryResponse, format: 'pdf', resource_type: 'raw' });
          return { pipe: jest.fn() };
        }
      );

      const result = await service.uploadFile(pdfFile);

      expect(result.format).toBe('pdf');
      expect(streamifier.createReadStream).toHaveBeenCalledWith(pdfFile.buffer);
    });

    it('should handle large files', async () => {
      const largeFile: Express.Multer.File = {
        ...mockFile,
        size: 50 * 1024 * 1024, // 50MB
        buffer: Buffer.alloc(50 * 1024 * 1024),
      };

      await service.uploadFile(largeFile);

      expect(streamifier.createReadStream).toHaveBeenCalledWith(largeFile.buffer);
    });

    it('should handle concurrent uploads', async () => {
      const promises = [
        service.uploadFile(mockFile),
        service.uploadFile(mockFile),
        service.uploadFile(mockFile),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledTimes(3);
    });
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });
});
