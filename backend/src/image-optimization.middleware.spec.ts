import { Request, Response, NextFunction } from 'express';
import { imageOptimizationMiddleware } from './image-optimization.middleware';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

jest.mock('fs');
jest.mock('sharp');

describe('imageOptimizationMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      method: 'GET',
      path: '/uploads/test.jpg',
      query: {},
      headers: {},
    } as Partial<Request>;

    res = {
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as Partial<Response>;

    next = jest.fn();
  });

  it('should be defined', () => {
    expect(imageOptimizationMiddleware).toBeDefined();
  });

  it('should call next() for non-GET requests', async () => {
    (req as any).method = 'POST';
    await imageOptimizationMiddleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  it('should call next() for non-image files', async () => {
    (req as any).path = '/uploads/document.pdf';
    await imageOptimizationMiddleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should call next() if file does not exist', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    await imageOptimizationMiddleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should call next() for GET request with no width and no webp support', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    await imageOptimizationMiddleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should optimize and serve image in webp format when supported', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (req as any).headers = { accept: 'image/webp' };

    const mockBuffer = Buffer.from('optimized image data');
    const mockSharp = {
      webp: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(mockBuffer),
    };
    (sharp as jest.Mock).mockReturnValue(mockSharp);

    await imageOptimizationMiddleware(req as Request, res as Response, next);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/webp');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=31536000, immutable',
    );
    expect(res.send).toHaveBeenCalledWith(mockBuffer);
  });

  it('should resize image when width query parameter is provided', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (req as any).query = { w: '800' };

    const mockBuffer = Buffer.from('resized image data');
    const mockSharp = {
      resize: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(mockBuffer),
    };
    (sharp as jest.Mock).mockReturnValue(mockSharp);

    await imageOptimizationMiddleware(req as Request, res as Response, next);

    expect(mockSharp.resize).toHaveBeenCalledWith({
      width: 800,
      withoutEnlargement: true,
    });
    expect(res.send).toHaveBeenCalledWith(mockBuffer);
  });

  it('should handle width parameter from query.width', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (req as any).query = { width: '600' };

    const mockBuffer = Buffer.from('resized image');
    const mockSharp = {
      resize: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(mockBuffer),
    };
    (sharp as jest.Mock).mockReturnValue(mockSharp);

    await imageOptimizationMiddleware(req as Request, res as Response, next);

    expect(mockSharp.resize).toHaveBeenCalledWith({
      width: 600,
      withoutEnlargement: true,
    });
  });

  it('should handle invalid width parameter gracefully', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (req as any).query = { w: 'invalid' };

    const mockBuffer = Buffer.from('image data');
    const mockSharp = {
      resize: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(mockBuffer),
    };
    (sharp as jest.Mock).mockReturnValue(mockSharp);

    await imageOptimizationMiddleware(req as Request, res as Response, next);

    expect(mockSharp.resize).not.toHaveBeenCalled();
  });

  it('should handle PNG images', async () => {
    (req as any).path = '/uploads/test.png';
    (req as any).headers = { accept: 'image/webp' };
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    const mockBuffer = Buffer.from('png optimized');
    const mockSharp = {
      webp: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(mockBuffer),
    };
    (sharp as jest.Mock).mockReturnValue(mockSharp);

    await imageOptimizationMiddleware(req as Request, res as Response, next);

    expect(mockSharp.webp).toHaveBeenCalledWith({ quality: 80, effort: 4 });
    expect(res.send).toHaveBeenCalled();
  });

  it('should handle error during image processing', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const mockSharp = {
      toBuffer: jest.fn().mockRejectedValue(new Error('Sharp error')),
    };
    (sharp as jest.Mock).mockReturnValue(mockSharp);

    await imageOptimizationMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
  });

  it('should handle JPEG images', async () => {
    (req as any).path = '/uploads/test.jpeg';
    (req as any).headers = { accept: 'image/webp' };
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    const mockBuffer = Buffer.from('jpeg data');
    const mockSharp = {
      webp: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(mockBuffer),
    };
    (sharp as jest.Mock).mockReturnValue(mockSharp);

    await imageOptimizationMiddleware(req as Request, res as Response, next);

    expect(res.send).toHaveBeenCalledWith(mockBuffer);
  });

  it('should combine width and webp optimization', async () => {
    (req as any).path = '/uploads/test.jpg';
    (req as any).query = { w: '500' };
    (req as any).headers = { accept: 'image/webp' };
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    const mockBuffer = Buffer.from('optimized resized webp');
    const mockSharp = {
      resize: jest.fn().mockReturnThis(),
      webp: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(mockBuffer),
    };
    (sharp as jest.Mock).mockReturnValue(mockSharp);

    await imageOptimizationMiddleware(req as Request, res as Response, next);

    expect(mockSharp.resize).toHaveBeenCalled();
    expect(mockSharp.webp).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(mockBuffer);
  });
});
