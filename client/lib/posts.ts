import api from './api';
import { Post, PostsResponse, PaginatedResponse, CreatePostData, UpdatePostData, ReactionToggleResponse, Reaction } from '@/types';

export const postsService = {
  // Get posts with pagination and filters
  async getPosts(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    tag_ids?: number[];
    user_id?: number;
  }): Promise<PostsResponse> {
    const response = await api.get<PostsResponse>('/posts', { params });
    return response.data;
  },

  // Get a single post by ID
  async getPost(id: number): Promise<Post> {
    const response = await api.get<Post>(`/posts/${id}`);
    return response.data;
  },

  // Create a new post
  async createPost(data: CreatePostData): Promise<Post> {
    const formData = new FormData();
    formData.append('post[title]', data.title);
    formData.append('post[description]', data.description);

    if (data.picture) {
      // Send as 'image' for Active Storage
      formData.append('post[image]', data.picture);
    }

    if (data.tags && data.tags.length > 0) {
      data.tags.forEach((tagName) => {
        formData.append('tags[]', tagName);
      });
    }

    const response = await api.post<{ post: Post }>('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.post;
  },

  // Update a post
  async updatePost(id: number, data: UpdatePostData): Promise<Post> {
    const formData = new FormData();

    if (data.title) formData.append('post[title]', data.title);
    if (data.description) formData.append('post[description]', data.description);
    if (data.picture) {
      // Send as 'image' for Active Storage
      formData.append('post[image]', data.picture);
    }

    if (data.tags) {
      data.tags.forEach((tagName) => {
        formData.append('tags[]', tagName);
      });
    }

    const response = await api.patch<{ post: Post }>(`/posts/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.post;
  },

  // Delete a post
  async deletePost(id: number): Promise<void> {
    await api.delete(`/posts/${id}`);
  },

  // React to a post (toggle reaction)
  async reactToPost(postId: number, reactionType: 'like' | 'love' | 'dislike'): Promise<ReactionToggleResponse> {
    const response = await api.post<ReactionToggleResponse>(`/posts/${postId}/reactions`, {
      reaction_type: reactionType,
    });
    return response.data;
  },

  // Remove reaction from a post
  async removeReaction(postId: number, reactionId: number): Promise<void> {
    await api.delete(`/posts/${postId}/reactions/${reactionId}`);
  },

  // Get reactions for a post
  async getPostReactions(postId: number): Promise<Reaction[]> {
    const response = await api.get<Reaction[]>(`/posts/${postId}/reactions`);
    return response.data;
  },

  // Get user's own posts
  async getMyPosts(params?: {
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<Post>> {
    const response = await api.get<PaginatedResponse<Post>>('/posts/my_posts', { params });
    return response.data;
  },

  // Get posts by a specific user
  async getUserPosts(userId: number, params?: {
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<Post>> {
    const response = await api.get<PaginatedResponse<Post>>(`/users/${userId}/posts`, { params });
    return response.data;
  },
};

export default postsService;
