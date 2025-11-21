module Api
  module V1
    class UsersController < ApplicationController
      include Api::V1::PostSerializable

      skip_before_action :authenticate_request, only: [ :show, :posts, :search ]
      before_action :authenticate_optional, only: [ :show, :posts, :search ]
      before_action :set_user, only: [ :show, :update, :posts, :update_preferences ]
      before_action :authorize_user_update!, only: [ :update, :update_preferences ]
      before_action :set_current_user, only: [ :update_profile ]

      # GET /api/v1/users/search
      def search
        query = params[:q] || ""
        page = params[:page]&.to_i || 1
        per_page = [ params[:per_page]&.to_i || 10, 50 ].min

        if query.blank?
          render json: { users: [], meta: { current_page: page, per_page: per_page, total_count: 0, total_pages: 0 } }
          return
        end

        # Search in name and email
        users = User.where("name ILIKE ? OR email ILIKE ?", "%#{query}%", "%#{query}%")
                    .includes([ :avatar_attachment ])
                    .order(created_at: :desc)

        total_count = users.count
        users = users.offset((page - 1) * per_page).limit(per_page)

        render json: {
          users: users.map { |u| user_search_result(u) },
          meta: {
            current_page: page,
            per_page: per_page,
            total_count: total_count,
            total_pages: (total_count.to_f / per_page).ceil
          }
        }, status: :ok
      end

      # GET /api/v1/users/:id
      def show
        render json: { user: user_response(@user) }, status: :ok
      end

      # PUT /api/v1/users/:id
      def update
        if @user.update(user_params)
          render json: {
            message: "Profile updated successfully",
            user: user_response(@user)
          }, status: :ok
        else
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_content
        end
      end

      # PATCH /api/v1/users/:id/preferences
      def update_preferences
        if @user.update(preferences_params)
          render json: {
            message: "Preferences updated successfully",
            preferences: {
              theme: @user.theme,
              language: @user.language
            }
          }, status: :ok
        else
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_content
        end
      end

      # PUT /api/v1/users/profile
      def update_profile
        if @current_user.update(profile_params)
          render json: {
            message: "Profile updated successfully",
            user: user_response(@current_user)
          }, status: :ok
        else
          render json: { errors: @current_user.errors.full_messages }, status: :unprocessable_content
        end
      end

      # GET /api/v1/users/:id/posts
      def posts
        page = params[:page]&.to_i || 1
        per_page = [ params[:per_page]&.to_i || 10, 50 ].min

        # Get total count first (before group by)
        total_count = @user.posts.count

        # Base query
        posts_query = @user.posts.includes(:tags, { comments: :user }, image_attachment: :blob)

        # Conditionally include reactions if a user is logged in
        posts_query = posts_query.includes(:reactions) if @current_user

        # Fetch posts with aggregated counts
        posts = posts_query.order("posts.created_at DESC")
                           .offset((page - 1) * per_page)
                           .limit(per_page)

        render json: {
          posts: posts.map { |p| serialize_post(p, @current_user) },
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
        render json: { error: "User not found" }, status: :not_found
      end

      def set_current_user
        @current_user = current_user
      end

      def authorize_user_update!
        unless @user.id == current_user.id
          render json: { error: "Forbidden: You can only update your own profile" }, status: :forbidden
        end
      end

      def user_params
        params.require(:user).permit(:name, :profile_picture, :bio, :avatar)
      end

      def profile_params
        params.require(:user).permit(:name, :bio, :avatar)
      end

      def preferences_params
        params.permit(:theme, :language)
      end

      def user_response(user)
        {
          id: user.id,
          name: user.name,
          email: user.email,
          profile_picture: user.avatar_url,
          avatar_url: user.avatar_url,
          bio: user.bio,
          stats: {
            total_posts: user.posts_count,
            total_reactions: user.posts.sum(:reactions_count),
            total_comments: user.posts.sum(:comments_count)
          },
          created_at: user.created_at
        }
      end

      def user_search_result(user)
        {
          id: user.id,
          name: user.name,
          email: user.email,
          profile_picture: user.avatar_url,
          avatar_url: user.avatar_url,
          bio: user.bio,
          posts_count: user.posts_count,
          created_at: user.created_at
        }
      end
    end
  end
end
