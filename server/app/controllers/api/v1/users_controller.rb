module Api
  module V1
    class UsersController < ApplicationController
      skip_before_action :authenticate_request, only: [:show, :posts]
      before_action :set_user, only: [:show, :update, :posts]
      before_action :authorize_user_update!, only: [:update]

      # GET /api/v1/users/:id
      def show
        render json: { user: user_response(@user) }, status: :ok
      end

      # PUT /api/v1/users/:id
      def update
        if @user.update(user_params)
          render json: {
            message: 'Profile updated successfully',
            user: user_response(@user)
          }, status: :ok
        else
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/users/:id/posts
      def posts
        page = params[:page]&.to_i || 1
        per_page = [params[:per_page]&.to_i || 10, 50].min

        posts = @user.posts.includes(:tags).order(created_at: :desc)

        total_count = posts.count
        posts = posts.offset((page - 1) * per_page).limit(per_page)

        render json: {
          posts: posts.map { |p| post_summary(p) },
          meta: {
            current_page: page,
            per_page: per_page,
            total_count: total_count,
            total_pages: (total_count.to_f / per_page).ceil
          }
        }, status: :ok
      end

      private

      def set_user
        @user = User.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'User not found' }, status: :not_found
      end

      def authorize_user_update!
        unless @user.id == current_user.id
          render json: { error: 'Forbidden: You can only update your own profile' }, status: :forbidden
        end
      end

      def user_params
        params.require(:user).permit(:name, :profile_picture, :bio)
      end

      def user_response(user)
        {
          id: user.id,
          name: user.name,
          email: user.email,
          profile_picture: user.profile_picture,
          bio: user.bio,
          stats: {
            total_posts: user.posts.count,
            total_reactions: user.posts.joins(:reactions).count,
            total_comments: user.posts.joins(:comments).count
          },
          created_at: user.created_at
        }
      end

      def post_summary(post)
        {
          id: post.id,
          title: post.title,
          description: post.description[0..150] + '...',
          picture: post.picture,
          tags: post.tags.map { |t| { id: t.id, name: t.name, color: t.color } },
          reactions_count: post.reactions.count,
          comments_count: post.comments.count,
          created_at: post.created_at
        }
      end
    end
  end
end
