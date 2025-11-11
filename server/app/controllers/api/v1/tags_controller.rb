module Api
  module V1
    class TagsController < ApplicationController
      skip_before_action :authenticate_request

      # GET /api/v1/tags
      def index
        tags = Tag.all

        # Sort by popularity (most used) or alphabetically
        tags = if params[:sort] == "popular"
          tags.order(posts_count: :desc)
        else
          tags.order(:name)
        end

        render json: {
          tags: tags.map { |t| tag_response(t) }
        }, status: :ok
      end

      # GET /api/v1/tags/:id
      def show
        tag = Tag.find(params[:id])
        render json: { tag: tag_response(tag) }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Tag not found" }, status: :not_found
      end

      # GET /api/v1/tags/:id/posts
      def posts
        tag = Tag.find(params[:id])
        page = params[:page]&.to_i || 1
        per_page = [ params[:per_page]&.to_i || 10, 50 ].min

        posts = tag.posts.includes(:user).order(created_at: :desc)

        total_count = posts.count
        posts = posts.offset((page - 1) * per_page).limit(per_page)

        render json: {
          tag: tag_response(tag),
          posts: posts.map { |p| post_summary(p) },
          meta: {
            current_page: page,
            per_page: per_page,
            total_count: total_count,
            total_pages: (total_count.to_f / per_page).ceil
          }
        }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Tag not found" }, status: :not_found
      end

      private

      def tag_response(tag)
        {
          id: tag.id,
          name: tag.name,
          color: tag.color,
          posts_count: tag.posts_count
        }
      end

      def post_summary(post)
        {
          id: post.id,
          title: post.title,
          description: post.description[0..150] + "...",
          user: {
            id: post.user.id,
            name: post.user.name
          },
          created_at: post.created_at
        }
      end
    end
  end
end
