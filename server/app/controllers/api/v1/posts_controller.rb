module Api
  module V1
    class PostsController < ApplicationController
      skip_before_action :authenticate_request, only: [ :index, :show ]
      before_action :set_post, only: [ :show, :update, :destroy ]
      before_action :authorize_post_owner!, only: [ :update, :destroy ]

      # GET /api/v1/posts
      # Supports pagination with ?page=1&per_page=10
      # Supports filtering with ?user_id=1
      # Returns posts with counts and last 3 comments
      def index
        page = params[:page]&.to_i || 1
        per_page = [ params[:per_page]&.to_i || 10, 50 ].min # Max 50 per page

        # Build base query with filters
        base_query = Post.all
        base_query = base_query.where(user_id: params[:user_id]) if params[:user_id].present?

        # Get total count before adding group/select
        total_count = base_query.count

        # Build posts query with includes and counts
        posts = base_query.includes(:user, :tags, comments: :user)
                    .left_joins(:comments, :reactions)
                    .select('posts.*,
                             COUNT(DISTINCT comments.id) as comments_count,
                             COUNT(DISTINCT reactions.id) as reactions_count')
                    .group("posts.id")
                    .order(created_at: :desc)
                    .offset((page - 1) * per_page)
                    .limit(per_page)

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

      # GET /api/v1/posts/:id
      def show
        render json: { post: post_response(@post, include_all_comments: true) }, status: :ok
      end

      # POST /api/v1/posts
      def create
        post = current_user.posts.new(post_params)

        if post.save
          handle_tags(post, params[:tags]) if params[:tags].present?

          # Broadcast new post to PostsChannel
          ActionCable.server.broadcast('posts_channel', {
            action: 'new_post',
            post: post_response(post)
          })

          render json: {
            message: "Post created successfully",
            post: post_response(post)
          }, status: :created
        else
          render json: { errors: post.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PUT /api/v1/posts/:id
      def update
        if @post.update(post_params)
          handle_tags(@post, params[:tags]) if params[:tags].present?

          # Broadcast post update
          ActionCable.server.broadcast('posts_channel', {
            action: 'update_post',
            post: post_response(@post)
          })
          ActionCable.server.broadcast("post_#{@post.id}", {
            action: 'update_post',
            post: post_response(@post)
          })

          render json: {
            message: "Post updated successfully",
            post: post_response(@post)
          }, status: :ok
        else
          render json: { errors: @post.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/posts/:id
      def destroy
        post_id = @post.id
        @post.destroy

        # Broadcast post deletion
        ActionCable.server.broadcast('posts_channel', {
          action: 'delete_post',
          post_id: post_id
        })

        render json: { message: "Post deleted successfully" }, status: :ok
      end

      private

      def set_post
        @post = Post.includes(:user, :tags, comments: :user).find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Post not found" }, status: :not_found
      end

      def authorize_post_owner!
        unless @post.user_id == current_user.id
          render json: { error: "Forbidden: You can only modify your own posts" }, status: :forbidden
        end
      end

      def post_params
        params.require(:post).permit(:title, :description, :picture)
      end

      def handle_tags(post, tag_names)
        # Clear existing tags
        post.post_tags.destroy_all

        # Add new tags
        tag_names.each do |tag_name|
          tag = Tag.find_or_create_by(name: tag_name.downcase)
          post.tags << tag unless post.tags.include?(tag)
        end
      end

      def post_response(post, include_all_comments: false)
        comments_data = if include_all_comments
          post.comments.where(commentable_type: "Post").includes(:user).order(created_at: :desc).map { |c| comment_response(c) }
        else
          post.last_three_comments.map { |c| comment_response(c) }
        end

        {
          id: post.id,
          title: post.title,
          description: post.description,
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
          last_three_comments: comments_data,
          created_at: post.created_at,
          updated_at: post.updated_at
        }
      end

      def comment_response(comment)
        {
          id: comment.id,
          description: comment.description,
          user: {
            id: comment.user.id,
            name: comment.user.name,
            profile_picture: comment.user.profile_picture
          },
          created_at: comment.created_at
        }
      end
    end
  end
end
