import api from './api';
import { Comment, CommentsResponse, CreateCommentData, UpdateCommentData, ReactionToggleResponse, CommentMutationResponse } from '@/types';

export const commentsService = {
  // Get comments for a post
  async getPostComments(
    postId: number,
    params?: {
      page?: number;
      per_page?: number;
    }
  ): Promise<CommentsResponse> {
    const response = await api.get<CommentsResponse>(`/posts/${postId}/comments`, {
      params,
    });
    return response.data;
  },

  // Get replies for a comment
  async getCommentReplies(
    commentId: number,
    params?: {
      page?: number;
      per_page?: number;
    }
  ): Promise<CommentsResponse> {
    const response = await api.get<CommentsResponse>(
      `/comments/${commentId}/comments`,
      { params }
    );
    return response.data;
  },

  // Create a comment on a post
  async createComment(postId: number, data: CreateCommentData): Promise<CommentMutationResponse> {
    const response = await api.post<CommentMutationResponse>(`/posts/${postId}/comments`, data);
    return response.data;
  },

  // Create a reply to a comment
  async createReply(
    commentId: number,
    data: CreateCommentData
  ): Promise<CommentMutationResponse> {
    const response = await api.post<CommentMutationResponse>(`/comments/${commentId}/comments`, data);
    return response.data;
  },

  // Update a comment
  async updateComment(
    commentId: number,
    data: UpdateCommentData
  ): Promise<CommentMutationResponse> {
    const response = await api.patch<CommentMutationResponse>(`/comments/${commentId}`, data);
    return response.data;
  },

  // Delete a comment
  async deleteComment(commentId: number): Promise<void> {
    await api.delete(`/comments/${commentId}`);
  },

  // React to a comment (toggle reaction)
  async reactToComment(
    commentId: number,
    reactionType: 'like' | 'love' | 'dislike'
  ): Promise<ReactionToggleResponse> {
    const response = await api.post<ReactionToggleResponse>(
      `/comments/${commentId}/reactions`,
      {
        reaction_type: reactionType,
      }
    );
    return response.data;
  },
};

export default commentsService;
