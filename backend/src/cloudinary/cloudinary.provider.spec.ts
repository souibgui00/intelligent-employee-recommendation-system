import { CloudinaryProvider } from './cloudinary.provider';
import { v2 as cloudinary } from 'cloudinary';

jest.mock('cloudinary');

describe('CloudinaryProvider', () => {
  it('should be defined', () => {
    expect(CloudinaryProvider).toBeDefined();
  });

  it('should have CLOUDINARY as provider key', () => {
    expect(CloudinaryProvider.provide).toBe('CLOUDINARY');
  });

  it('should have useFactory function', () => {
    expect(CloudinaryProvider.useFactory).toBeDefined();
    expect(typeof CloudinaryProvider.useFactory).toBe('function');
  });

  it('should return cloudinary config when useFactory is called', () => {
    const mockConfig = {
      cloud_name: 'dngx0t50o',
      api_key: '746148137783878',
      api_secret: 'feEncQu_X3fPPVJSVwdatxpLExM',
    };

    (cloudinary.config as jest.Mock).mockReturnValue(mockConfig);

    const result = CloudinaryProvider.useFactory();

    expect(cloudinary.config).toHaveBeenCalledWith(mockConfig);
    expect(result).toEqual(mockConfig);
  });

  it('should configure cloudinary with correct credentials', () => {
    CloudinaryProvider.useFactory();

    expect(cloudinary.config).toHaveBeenCalledWith({
      cloud_name: 'dngx0t50o',
      api_key: '746148137783878',
      api_secret: 'feEncQu_X3fPPVJSVwdatxpLExM',
    });
  });

  it('should be a valid NestJS provider object', () => {
    expect(CloudinaryProvider).toHaveProperty('provide');
    expect(CloudinaryProvider).toHaveProperty('useFactory');
  });

  it('should call config once per invocation', () => {
    (cloudinary.config as jest.Mock).mockClear();
    CloudinaryProvider.useFactory();
    expect((cloudinary.config as jest.Mock).mock.calls).toHaveLength(1);
  });

  it('should use string keys for provider and useFactory', () => {
    const keys = Object.keys(CloudinaryProvider);
    expect(keys).toContain('provide');
    expect(keys).toContain('useFactory');
  });
});
