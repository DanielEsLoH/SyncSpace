module Api
  module V1
    class SearchController < ApplicationController
      skip_before_action :authenticate_request, only: [ :index ]

      # GET /api/v1/search
      # Params:
      #   q: general search query
      #   title: search in title
      #   user: search by username or @username or @email
      #   tag: search by tag name
      def index
        posts = Post.includes({ user: { avatar_attachment: :blob } }, :tags).distinct

        # Search by title
        if params[:title].present?
          posts = posts.where("posts.title ILIKE ?", "%#{params[:title]}%")
        end

        # Search by user (@username or @email)
        if params[:user].present?
          user_query = params[:user].gsub("@", "")
          posts = posts.joins(:user).where(
            "users.name ILIKE ? OR users.email ILIKE ?",
            "%#{user_query}%",
            "%#{user_query}%"
          )
        end

        # Search by tag
        if params[:tag].present?
          posts = posts.joins(:tags).where("tags.name ILIKE ?", "%#{params[:tag]}%")
        end

        # General search across multiple fields
        if params[:q].present?
          posts = posts.left_joins(:user, :tags).where(
            "posts.title ILIKE ? OR posts.description ILIKE ? OR users.name ILIKE ? OR tags.name ILIKE ?",
            "%#{params[:q]}%",
            "%#{params[:q]}%",
            "%#{params[:q]}%",
            "%#{params[:q]}%"
          )
        end

        # Pagination
        page = params[:page]&.to_i || 1
        per_page = [ params[:per_page]&.to_i || 10, 50 ].min

        total_count = posts.count
        posts = posts.order(created_at: :desc).offset((page - 1) * per_page).limit(per_page)

        render json: {
          posts: posts.map { |post| post_response(post) },
          meta: {
            current_page: page,
            per_page: per_page,
            total_count: total_count,
            total_pages: (total_count.to_f / per_page).ceil
          }
        }, status: :ok
      end

      private

      def post_response(post)
        {
          id: post.id,
          title: post.title,
          description: post.description.length > 200 ? post.description[0..200] + "..." : post.description,
          picture: post.picture,
          user: {
            id: post.user.id,
            name: post.user.name,
            profile_picture: post.user.avatar_url
          },
          tags: post.tags.map { |t| { id: t.id, name: t.name, color: t.color } },
          reactions_count: post.reactions_count,
          comments_count: post.comments_count,
          created_at: post.created_at,
          updated_at: post.updated_at
        }
      end
    end
  end
end
