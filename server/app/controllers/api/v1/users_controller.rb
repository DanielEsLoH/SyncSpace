module Api
  module V1
    class UsersController < ApplicationController
      skip_before_action :authenticate_request, only: [ :show, :posts, :search ]
      before_action :authenticate_optional, only: [ :show, :posts, :search ]
      before_action :set_user, only: [ :show, :update, :posts, :update_preferences ]
      before_action :authorize_user_update!, only: [ :update, :update_preferences ]

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
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
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
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/users/:id/posts
      def posts
        page = params[:page]&.to_i || 1
        per_page = [ params[:per_page]&.to_i || 10, 50 ].min

        # Get total count first (before group by)
        total_count = @user.posts.count

        # Fetch posts with aggregated counts
        posts = @user.posts
                     .includes(:tags, :reactions, :comments, :user)
                     .left_joins(:comments, :reactions)
                     .select('posts.*,
                             COUNT(DISTINCT comments.id) as comments_count,
                             COUNT(DISTINCT reactions.id) as reactions_count')
                     .group("posts.id")
                     .order("posts.created_at DESC")
                     .offset((page - 1) * per_page)
                     .limit(per_page)

        render json: {
          posts: posts.map { |p| post_response(p) },
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

      def authorize_user_update!
        unless @user.id == current_user.id
          render json: { error: "Forbidden: You can only update your own profile" }, status: :forbidden
        end
      end

      def user_params
        params.require(:user).permit(:name, :profile_picture, :bio)
      end

      def preferences_params
        params.permit(:theme, :language)
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

      def post_response(post)
        # Get current user's reaction if authenticated
        user_reaction = if @current_user
          post.reactions.find_by(user: @current_user)
        else
          nil
        end

        {
          id: post.id,
          title: post.title,
          description: post.description.length > 150 ? "#{post.description[0..149]}..." : post.description,
          picture: post.picture,
          user: {
            id: post.user.id,
            name: post.user.name,
            email: post.user.email,
            profile_picture: post.user.profile_picture
          },
          tags: post.tags.map { |t| { id: t.id, name: t.name, color: t.color } },
          reactions_count: post.try(:reactions_count) || post.reactions.count,
          comments_count: post.try(:comments_count) || post.comments.count,
          user_reaction: user_reaction ? {
            id: user_reaction.id,
            reaction_type: user_reaction.reaction_type,
            user: {
              id: user_reaction.user.id,
              name: user_reaction.user.name,
              profile_picture: user_reaction.user.profile_picture
            },
            reactionable_type: user_reaction.reactionable_type,
            reactionable_id: user_reaction.reactionable_id,
            created_at: user_reaction.created_at
          } : nil,
          created_at: post.created_at,
          updated_at: post.updated_at
        }
      end

      def user_search_result(user)
        {
          id: user.id,
          name: user.name,
          email: user.email,
          profile_picture: user.profile_picture,
          bio: user.bio,
          posts_count: user.posts.count,
          created_at: user.created_at
        }
      end
    end
  end
end
