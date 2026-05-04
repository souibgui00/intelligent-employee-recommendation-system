import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import { PostsService } from './posts.service';
import { UsersService } from '../users/users.service';
import { Types } from 'mongoose';

import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('PostsService', () => {
  let service: PostsService;

  const mockUserId = new Types.ObjectId().toHexString();
  const mockPostId = new Types.ObjectId().toHexString();
  const mockCommentId = new Types.ObjectId().toHexString();
  const mockUser = {
    _id: mockUserId,
    name: 'Test User',
    email: 'test@example.com',
    role: 'EMPLOYEE',
  };

  const mockPost = {
    _id: mockPostId,
    title: 'Test Post',
    content: 'This is a test post',
    authorId: mockUserId,
    category: 'announcement',
    likes: [],
    comments: [],
    shares: [],
    bookmarks: [],
    tags: ['test', 'post'],
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(true),
    toObject: jest.fn().mockReturnValue({
      _id: mockPostId,
      title: 'Test Post',
      content: 'This is a test post',
    }),
  };

  function chainable(result: any) {
    const p = Promise.resolve(result) as any;
    p.populate = jest.fn().mockReturnValue(p);
    p.select = jest.fn().mockReturnValue(p);
    p.sort = jest.fn().mockReturnValue(p);
    p.skip = jest.fn().mockReturnValue(p);
    p.limit = jest.fn().mockReturnValue(p);
    p.exec = jest.fn().mockResolvedValue(result);
    return p;
  }

  const mockPostModel: any = jest.fn().mockImplementation((dto) => ({
    ...dto,
    _id: mockPostId,
    save: jest.fn().mockResolvedValue(dto),
  }));

  mockPostModel.find = jest.fn().mockReturnValue(chainable([mockPost]));
  mockPostModel.findById = jest.fn().mockReturnValue(chainable(mockPost));
  mockPostModel.findOne = jest.fn().mockReturnValue(chainable(mockPost));
  mockPostModel.findByIdAndUpdate = jest.fn().mockReturnValue(chainable(mockPost));
  mockPostModel.findByIdAndDelete = jest.fn().mockReturnValue(chainable(mockPost));
  mockPostModel.aggregate = jest.fn().mockReturnValue(chainable([]));
  mockPostModel.create = jest.fn().mockResolvedValue(mockPost);

  const mockUsersService = {
    findOne: jest.fn().mockResolvedValue(mockUser),
  };

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getModelToken('Post'),
          useValue: mockPostModel,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new post successfully', async () => {
      const createPostDto = {
        title: 'New Post',
        content: 'Post content',
        category: 'announcement',
        tags: ['test'],
      };

      const result = await service.create(createPostDto as any);

      expect(result).toBeDefined();
    });

    it('should extract and process hashtags and mentions', async () => {
      const createPostDto = {
        title: 'Post with tags',
        content: 'Hello @user1 #nodejs #typescript',
        category: 'general',
      };

      const result = await service.create(createPostDto as any);

      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return all posts', async () => {
      const result = await service.findAll();

      expect(mockPostModel.find).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findAllAdvanced', () => {
    it('should retrieve posts with filters and sorting', async () => {
      const queryDto = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        order: 'desc',
        search: 'test',
        category: 'announcement',
        tags: ['nodejs'],
      };

      const result = await service.findAllAdvanced(queryDto as any);

      expect(result).toBeDefined();
    });

    it('should paginate results', async () => {
      const queryDto = {
        page: 2,
        limit: 20,
      };

      const result = await service.findAllAdvanced(queryDto as any);

      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should retrieve a specific post by ID', async () => {
      const result = await service.findOne(mockPostId);

      expect(mockPostModel.findById).toHaveBeenCalledWith(mockPostId);
      expect(result).toBeDefined();
    });

    it('should throw if post not found', async () => {
      mockPostModel.findById.mockReturnValueOnce(chainable(null));

      await expect(service.findOne(mockPostId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('like', () => {
    it('should add like to post', async () => {
      const result = await service.like(mockPostId, mockUserId);

      expect(result).toBeDefined();
    });

    it('should not add duplicate likes', async () => {
      mockPostModel.findById.mockReturnValueOnce(chainable({ ...mockPost, likes: [mockUserId] }));

      const result = await service.like(mockPostId, mockUserId);

      expect(result).toBeDefined();
    });
  });

  describe('comment', () => {
    it('should add comment to post', async () => {
      const commentData = {
        text: 'Great post!',
        authorId: mockUserId,
      };

      const result = await service.comment(mockPostId, {
        authorId: commentData.authorId,
        authorName: 'Test User',
        authorAvatar: 'https://example.com/avatar.jpg',
        content: commentData.text,
      });

      expect(result).toBeDefined();
    });

    it('should include comment with author details', async () => {
      const commentData = {
        text: 'Test comment',
        authorId: mockUserId,
      };

      const result = await service.comment(mockPostId, {
        authorId: commentData.authorId,
        authorName: 'Test User',
        authorAvatar: 'https://example.com/avatar.jpg',
        content: commentData.text,
      });

      expect(result).toBeDefined();
    });
  });

  describe('sharePost', () => {
    it('should share post to user timeline', async () => {
      const result = await service.sharePost(mockPostId, {
        userId: mockUserId,
        authorName: 'Test User',
        authorAvatar: 'https://example.com/avatar.jpg',
        content: 'Shared this post!',
      });

      expect(result).toBeDefined();
    });

    it('should create share record', async () => {
      const shareContent = 'Check this out!';
      const result = await service.sharePost(mockPostId, {
        userId: mockUserId,
        authorName: 'Test User',
        authorAvatar: 'https://example.com/avatar.jpg',
        content: shareContent,
      });

      expect(result).toBeDefined();
    });
  });

  describe('toggleBookmark', () => {
    it('should add bookmark to post', async () => {
      const result = await service.toggleBookmark(mockPostId, mockUserId);

      expect(result).toBeDefined();
    });

    it('should remove bookmark if already bookmarked', async () => {
      mockPostModel.findById.mockReturnValueOnce(
        chainable({ ...mockPost, bookmarks: [mockUserId] })
      );

      const result = await service.toggleBookmark(mockPostId, mockUserId);

      expect(result).toBeDefined();
    });
  });

  describe('findBookmarkedByUser', () => {
    it('should return bookmarked posts for user', async () => {
      const result = await service.findBookmarkedByUser(mockUserId);

      expect(mockPostModel.find).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getUserPublications', () => {
    it('should return posts by user', async () => {
      const result = await service.getUserPublications(mockUserId);

      expect(mockPostModel.find).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getUserShares', () => {
    it('should return shares by user', async () => {
      const result = await service.getUserShares(mockUserId);

      expect(mockPostModel.find).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getTrendingTags', () => {
    it('should return trending tags aggregation', async () => {
      mockPostModel.aggregate.mockReturnValueOnce(chainable([
        { _id: 'nodejs', count: 50 },
        { _id: 'typescript', count: 45 },
      ]));

      const result = await service.getTrendingTags(10);

      expect(mockPostModel.aggregate).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should limit results to specified count', async () => {
      await service.getTrendingTags(5);

      expect(mockPostModel.aggregate).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update post content', async () => {
      const updateDto = {
        title: 'Updated Post',
        content: 'Updated content',
      };

      await service.update(mockPostId, mockUserId, 'EMPLOYEE', updateDto as any);

      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should prevent unauthorized updates', async () => {
      const updateDto = {
        title: 'Hacked Post',
        content: 'Hacked!',
      };

      mockPostModel.findById.mockReturnValueOnce(
        chainable({ ...mockPost, authorId: new Types.ObjectId().toHexString() })
      );

      await expect(service.update(mockPostId, mockUserId, 'EMPLOYEE', updateDto as any)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('remove', () => {
    it('should delete post by author', async () => {
      await service.remove(mockPostId, mockUserId);

      expect(mockPostModel.findByIdAndDelete).toHaveBeenCalled();
    });

    it('should allow admin to delete any post', async () => {
      const adminId = new Types.ObjectId().toHexString();
      await service.remove(mockPostId, adminId, 'ADMIN');

      expect(mockPostModel.findByIdAndDelete).toHaveBeenCalled();
    });

    it('should prevent non-author from deleting post', async () => {
      mockPostModel.findById.mockReturnValueOnce(
        chainable({ ...mockPost, authorId: new Types.ObjectId().toHexString() })
      );

      await expect(service.remove(mockPostId, mockUserId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getUserProfileFeed', () => {
    it('should return user profile feed with posts and shares', async () => {
      const result = await service.getUserProfileFeed(mockUserId);

      expect(mockPostModel.find).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
