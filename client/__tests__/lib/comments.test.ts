
import { commentsService } from '@/lib/comments';
import api from '@/lib/api';
import { Comment, CommentsResponse, ReactionToggleResponse, CommentMutationResponse } from '@/types';

// Mock the api module
jest.mock('@/lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('commentsService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockComment: Comment = {
    id: 1,
    content: 'Test comment',
    author: { id: 1, name: 'Test User' },
    post_id: 1,
    created_at: '2025-01-01T00:00:00Z',
    _count: { likes: 0, comments: 0 },
  };

  const mockCommentsResponse: CommentsResponse = {
    comments: [mockComment],
    meta: { total_pages: 1, current_page: 1, per_page: 10, total_count: 1 },
  };

  const mockMutationResponse: CommentMutationResponse = {
    comment: mockComment,
  };

  // getPostComments
  describe('getPostComments', () => {
    it('should fetch comments for a post successfully', async () => {
      mockedApi.get.mockResolvedValue({ data: mockCommentsResponse });
      const params = { page: 1, per_page: 10 };
      const result = await commentsService.getPostComments(1, params);
      expect(mockedApi.get).toHaveBeenCalledWith('/posts/1/comments', { params });
      expect(result).toEqual(mockCommentsResponse);
    });
  });

  // getCommentReplies
  describe('getCommentReplies', () => {
    it('should fetch replies for a comment successfully', async () => {
      mockedApi.get.mockResolvedValue({ data: mockCommentsResponse });
      const params = { page: 1, per_page: 10 };
      const result = await commentsService.getCommentReplies(1, params);
      expect(mockedApi.get).toHaveBeenCalledWith('/comments/1/comments', { params });
      expect(result).toEqual(mockCommentsResponse);
    });
  });

  // createComment
  describe('createComment', () => {
    it('should create a comment successfully', async () => {
      mockedApi.post.mockResolvedValue({ data: mockMutationResponse });
      const commentData = { content: 'New comment' };
      const result = await commentsService.createComment(1, commentData);
      expect(mockedApi.post).toHaveBeenCalledWith('/posts/1/comments', commentData);
      expect(result).toEqual(mockMutationResponse);
    });
  });

  // createReply
  describe('createReply', () => {
    it('should create a reply successfully', async () => {
      mockedApi.post.mockResolvedValue({ data: mockMutationResponse });
      const replyData = { content: 'New reply' };
      const result = await commentsService.createReply(1, replyData);
      expect(mockedApi.post).toHaveBeenCalledWith('/comments/1/comments', replyData);
      expect(result).toEqual(mockMutationResponse);
    });
  });

  // updateComment
  describe('updateComment', () => {
    it('should update a comment successfully', async () => {
      mockedApi.patch.mockResolvedValue({ data: mockMutationResponse });
      const commentData = { content: 'Updated comment' };
      const result = await commentsService.updateComment(1, commentData);
      expect(mockedApi.patch).toHaveBeenCalledWith('/comments/1', commentData);
      expect(result).toEqual(mockMutationResponse);
    });
  });

  // deleteComment
  describe('deleteComment', () => {
    it('should delete a comment successfully', async () => {
      mockedApi.delete.mockResolvedValue({});
      await commentsService.deleteComment(1);
      expect(mockedApi.delete).toHaveBeenCalledWith('/comments/1');
    });
  });

  // reactToComment
  describe('reactToComment', () => {
    it('should react to a comment successfully', async () => {
      const mockResponse: ReactionToggleResponse = { status: 'created', reaction: { id: 1, user_id: 1, reaction_type: 'like' } };
      mockedApi.post.mockResolvedValue({ data: mockResponse });
      const result = await commentsService.reactToComment(1, 'like');
      expect(mockedApi.post).toHaveBeenCalledWith('/comments/1/reactions', { reaction_type: 'like' });
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

      await expect(commentsService.getPostComments(1)).rejects.toThrow('API Error');
      await expect(commentsService.getCommentReplies(1)).rejects.toThrow('API Error');
      await expect(commentsService.createComment(1, { content: 'c' })).rejects.toThrow('API Error');
      await expect(commentsService.createReply(1, { content: 'c' })).rejects.toThrow('API Error');
      await expect(commentsService.updateComment(1, { content: 'c' })).rejects.toThrow('API Error');
      await expect(commentsService.deleteComment(1)).rejects.toThrow('API Error');
      await expect(commentsService.reactToComment(1, 'like')).rejects.toThrow('API Error');
    });
  });
});
