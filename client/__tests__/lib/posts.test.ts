
import { postsService } from '@/lib/posts';
import api from '@/lib/api';
import { Post, PostsResponse, Reaction, ReactionToggleResponse, PaginatedResponse } from '@/types';

// Mock the api module
jest.mock('@/lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('postsService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockPost: Post = {
    id: 1,
    title: 'Test Post',
    description: 'Test Description',
    author: { id: 1, name: 'Test User' },
    created_at: '2025-01-01T00:00:00Z',
    _count: { likes: 0, comments: 0 },
  };

  // getPosts
  describe('getPosts', () => {
    it('should fetch posts successfully', async () => {
      const mockResponse: PostsResponse = {
        posts: [mockPost],
        meta: { total_pages: 1, current_page: 1, per_page: 10, total_count: 1 },
      };
      mockedApi.get.mockResolvedValue({ data: mockResponse });
      const params = { page: 1, per_page: 10 };
      const result = await postsService.getPosts(params);
      expect(mockedApi.get).toHaveBeenCalledWith('/posts', { params });
      expect(result).toEqual(mockResponse);
    });
  });

  // getPost
  describe('getPost', () => {
    it('should fetch a single post successfully', async () => {
      mockedApi.get.mockResolvedValue({ data: mockPost });
      const result = await postsService.getPost(1);
      expect(mockedApi.get).toHaveBeenCalledWith('/posts/1');
      expect(result).toEqual(mockPost);
    });
  });

  // createPost
  describe('createPost', () => {
    it('should create a post successfully', async () => {
      mockedApi.post.mockResolvedValue({ data: { post: mockPost } });
      const postData = { title: 'Test Post', description: 'Test Description' };
      const result = await postsService.createPost(postData);
      expect(mockedApi.post).toHaveBeenCalledWith('/posts', expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      expect(result).toEqual(mockPost);
    });
  });

  // updatePost
  describe('updatePost', () => {
    it('should update a post successfully', async () => {
      mockedApi.patch.mockResolvedValue({ data: { post: mockPost } });
      const postData = { title: 'Updated Title' };
      const result = await postsService.updatePost(1, postData);
      expect(mockedApi.patch).toHaveBeenCalledWith('/posts/1', expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      expect(result).toEqual(mockPost);
    });
  });

  // deletePost
  describe('deletePost', () => {
    it('should delete a post successfully', async () => {
      mockedApi.delete.mockResolvedValue({});
      await postsService.deletePost(1);
      expect(mockedApi.delete).toHaveBeenCalledWith('/posts/1');
    });
  });

  // reactToPost
  describe('reactToPost', () => {
    it('should add a reaction to a post successfully', async () => {
      const mockResponse: ReactionToggleResponse = { status: 'created', reaction: { id: 1, user_id: 1, reaction_type: 'like' } };
      mockedApi.post.mockResolvedValue({ data: mockResponse });
      const result = await postsService.reactToPost(1, 'like');
      expect(mockedApi.post).toHaveBeenCalledWith('/posts/1/reactions', { reaction_type: 'like' });
      expect(result).toEqual(mockResponse);
    });
  });

  // removeReaction
  describe('removeReaction', () => {
    it('should remove a reaction from a post successfully', async () => {
      mockedApi.delete.mockResolvedValue({});
      await postsService.removeReaction(1, 1);
      expect(mockedApi.delete).toHaveBeenCalledWith('/posts/1/reactions/1');
    });
  });

  // getPostReactions
  describe('getPostReactions', () => {
    it('should fetch post reactions successfully', async () => {
      const mockReactions: Reaction[] = [{ id: 1, user_id: 1, reaction_type: 'like' }];
      mockedApi.get.mockResolvedValue({ data: mockReactions });
      const result = await postsService.getPostReactions(1);
      expect(mockedApi.get).toHaveBeenCalledWith('/posts/1/reactions');
      expect(result).toEqual(mockReactions);
    });
  });

  // getMyPosts
  describe('getMyPosts', () => {
    it("should fetch the current user's posts successfully", async () => {
      const mockResponse: PaginatedResponse<Post> = {
        data: [mockPost],
        meta: { total_pages: 1, current_page: 1, per_page: 10, total_count: 1 },
      };
      mockedApi.get.mockResolvedValue({ data: mockResponse });
      const params = { page: 1, per_page: 10 };
      const result = await postsService.getMyPosts(params);
      expect(mockedApi.get).toHaveBeenCalledWith('/posts/my_posts', { params });
      expect(result).toEqual(mockResponse);
    });
  });

  // getUserPosts
  describe('getUserPosts', () => {
    it("should fetch a specific user's posts successfully", async () => {
      const mockResponse: PaginatedResponse<Post> = {
        data: [mockPost],
        meta: { total_pages: 1, current_page: 1, per_page: 10, total_count: 1 },
      };
      mockedApi.get.mockResolvedValue({ data: mockResponse });
      const params = { page: 1, per_page: 10 };
      const result = await postsService.getUserPosts(1, params);
      expect(mockedApi.get).toHaveBeenCalledWith('/users/1/posts', { params });
      expect(result).toEqual(mockResponse);
    });
  });

  // Error handling
  describe('Error Handling', () => {
    it('should handle API errors for all methods', async () => {
        const error = new Error('API Error');
        mockedApi.get.mockRejectedValue(error);
        mockedApi.post.mockRejectedValue(error);
        mockedApi.patch.mockRejectedValue(error);
        mockedApi.delete.mockRejectedValue(error);

        await expect(postsService.getPosts()).rejects.toThrow('API Error');
        await expect(postsService.getPost(1)).rejects.toThrow('API Error');
        await expect(postsService.createPost({ title: 't', description: 'd' })).rejects.toThrow('API Error');
        await expect(postsService.updatePost(1, { title: 't' })).rejects.toThrow('API Error');
        await expect(postsService.deletePost(1)).rejects.toThrow('API Error');
        await expect(postsService.reactToPost(1, 'like')).rejects.toThrow('API Error');
        await expect(postsService.removeReaction(1, 1)).rejects.toThrow('API Error');
        await expect(postsService.getPostReactions(1)).rejects.toThrow('API Error');
        await expect(postsService.getMyPosts()).rejects.toThrow('API Error');
        await expect(postsService.getUserPosts(1)).rejects.toThrow('API Error');
    });
  });
});
