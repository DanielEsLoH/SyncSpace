// client/lib/users.ts
import api from './api';
import { UserProfile, PostsResponse } from '@/types';

export const usersService = {
  async getUser(userId: number): Promise<UserProfile> {
    const response = await api.get<{ user: UserProfile }>(`/users/${userId}`);
    return response.data.user;
  },

  async getUserPosts(
    userId: number,
    params?: {
      page?: number;
      per_page?: number;
    }
  ): Promise<PostsResponse> {
    const response = await api.get<PostsResponse>(`/users/${userId}/posts`, {
      params,
    });
    return response.data;
  },

  async updateUser(
    userId: number,
    data: { name?: string; bio?: string; profile_picture?: string | File }
  ): Promise<UserProfile> {
    const formData = new FormData();
    if (data.name) formData.append('user[name]', data.name);
    if (data.bio) formData.append('user[bio]', data.bio);
    if (data.profile_picture) {
      // If profile_picture is a File object, append it directly
      if (data.profile_picture instanceof File) {
        formData.append('user[profile_picture]', data.profile_picture);
      } else {
        // If it's a string (e.g., a URL or base64), handle accordingly.
        // For simplicity, assuming string means "no change" or "clear existing"
        // A more robust solution might involve a specific API for clearing or handling URLs.
        // For now, if it's a string, we'll assume it's not a new file upload.
        // If the backend expects a string for "no change" or "clear", this needs adjustment.
        // For this implementation, we'll only send if it's a File.
      }
    }

    const response = await api.patch<{ user: UserProfile }>(`/users/${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.user;
  },
};

export default usersService;