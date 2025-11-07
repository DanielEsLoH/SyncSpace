import api from './api';
import { Tag } from '@/types';

export const tagsService = {
  // Get all tags
  async getTags(search?: string): Promise<Tag[]> {
    const response = await api.get<{ tags: Tag[] }>('/tags', {
      params: search ? { search } : undefined,
    });
    return response.data.tags;
  },

  // Get a single tag
  async getTag(id: number): Promise<Tag> {
    const response = await api.get<{ tag: Tag }>(`/tags/${id}`);
    return response.data.tag;
  },

  // Create a new tag
  async createTag(data: { name: string; color?: string }): Promise<Tag> {
    const response = await api.post<Tag>('/tags', { tag: data });
    return response.data;
  },

  // Update a tag
  async updateTag(id: number, data: { name?: string; color?: string }): Promise<Tag> {
    const response = await api.patch<Tag>(`/tags/${id}`, { tag: data });
    return response.data;
  },

  // Delete a tag
  async deleteTag(id: number): Promise<void> {
    await api.delete(`/tags/${id}`);
  },

  // Get popular tags
  async getPopularTags(limit: number = 10): Promise<Tag[]> {
    const response = await api.get<{ tags: Tag[] }>('/tags', {
      params: { sort: 'popular' },
    });
    // Limit results on the frontend since backend doesn't support limit parameter
    return response.data.tags.slice(0, limit);
  },
};

export default tagsService;
