
import { usersService } from '@/lib/users';
import api from '@/lib/api';
import { UserProfile, PostsResponse } from '@/types';

// Mock the api module
jest.mock('@/lib/api', () => ({
  get: jest.fn(),
  patch: jest.fn(),
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('usersService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Tests for getUser
  describe('getUser', () => {
    it('should fetch a user profile successfully', async () => {
      const mockUser: UserProfile = {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        bio: 'A short bio',
        profile_picture_url: 'http://example.com/pic.jpg',
        followers_count: 10,
        following_count: 5,
        posts_count: 2,
      };
      mockedApi.get.mockResolvedValue({ data: { user: mockUser } });

      const user = await usersService.getUser(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/users/1');
      expect(user).toEqual(mockUser);
    });

    it('should throw an error if fetching a user fails', async () => {
      const error = new Error('Failed to fetch');
      mockedApi.get.mockRejectedValue(error);

      await expect(usersService.getUser(1)).rejects.toThrow('Failed to fetch');
      expect(mockedApi.get).toHaveBeenCalledWith('/users/1');
    });
  });

  // Tests for getUserPosts
  describe('getUserPosts', () => {
    it("should fetch a user's posts successfully", async () => {
      const mockPostsResponse: PostsResponse = {
        posts: [
          { id: 1, content: 'Post 1', author: { id: 1, name: 'John Doe' }, created_at: '2025-01-01T12:00:00Z', _count: { likes: 0, comments: 0 } },
          { id: 2, content: 'Post 2', author: { id: 1, name: 'John Doe' }, created_at: '2025-01-02T12:00:00Z', _count: { likes: 0, comments: 0 } },
        ],
        meta: {
          total_pages: 1,
          current_page: 1,
          per_page: 10,
          total_count: 2,
        },
      };
      mockedApi.get.mockResolvedValue({ data: mockPostsResponse });

      const params = { page: 1, per_page: 10 };
      const posts = await usersService.getUserPosts(1, params);

      expect(mockedApi.get).toHaveBeenCalledWith('/users/1/posts', { params });
      expect(posts).toEqual(mockPostsResponse);
    });

    it("should throw an error if fetching a user's posts fails", async () => {
      const error = new Error('Failed to fetch posts');
      mockedApi.get.mockRejectedValue(error);

      await expect(usersService.getUserPosts(1)).rejects.toThrow('Failed to fetch posts');
      expect(mockedApi.get).toHaveBeenCalledWith('/users/1/posts', { params: undefined });
    });
  });

  // Tests for updateUser
  describe('updateUser', () => {
    it('should update a user with name and bio', async () => {
      const updatedUser: UserProfile = {
        id: 1,
        name: 'John Doe Updated',
        email: 'john.doe@example.com',
        bio: 'An updated bio',
        profile_picture_url: 'http://example.com/pic.jpg',
        followers_count: 10,
        following_count: 5,
        posts_count: 2,
      };
      mockedApi.patch.mockResolvedValue({ data: { user: updatedUser } });

      const data = { name: 'John Doe Updated', bio: 'An updated bio' };
      const user = await usersService.updateUser(1, data);

      expect(mockedApi.patch).toHaveBeenCalledWith(
        '/users/1',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(user).toEqual(updatedUser);
    });

    it('should update a user with a profile picture', async () => {
        const updatedUser: UserProfile = {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@example.com',
            bio: 'A short bio',
            profile_picture_url: 'http://example.com/new_pic.jpg',
            followers_count: 10,
            following_count: 5,
            posts_count: 2,
        };
        mockedApi.patch.mockResolvedValue({ data: { user: updatedUser } });

        const file = new File(['dummy content'], 'profile.png', { type: 'image/png' });
        const data = { profile_picture: file };
        const user = await usersService.updateUser(1, data);

        expect(mockedApi.patch).toHaveBeenCalledWith(
            '/users/1',
            expect.any(FormData),
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        expect(user).toEqual(updatedUser);
    });

    it('should throw an error if updating a user fails', async () => {
      const error = new Error('Update failed');
      mockedApi.patch.mockRejectedValue(error);

      const data = { name: 'Test' };
      await expect(usersService.updateUser(1, data)).rejects.toThrow('Update failed');
    });
  });
});
