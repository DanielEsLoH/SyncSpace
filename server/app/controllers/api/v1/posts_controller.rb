module Api
  module V1
    class PostsController < ApplicationController
      include Api::V1::PostSerializable

      skip_before_action :authenticate_request, only: [ :index, :show, :popular ]
      before_action :authenticate_optional, only: [ :index, :show, :popular ]
      before_action :set_post, only: [ :show, :update, :destroy ]
      before_action :authorize_post_owner!, only: [ :update, :destroy ]

      # GET /api/v1/posts
      def index
        page = params[:page]&.to_i || 1
        per_page = [ params[:per_page]&.to_i || 10, 50 ].min # Max 50 per page

        # Build base query with filters
        base_query = Post.all
        base_query = base_query.where(user_id: params[:user_id]) if params[:user_id].present?

        # Add search functionality
        if params[:search].present?
          search_term = "%#{params[:search]}%"
          base_query = base_query.left_joins(:user, :tags)
                                 .where("posts.title ILIKE ? OR posts.description ILIKE ? OR users.name ILIKE ? OR tags.name ILIKE ?",
                                        search_term, search_term, search_term, search_term)
                                 .distinct
        end

        # Filter by tag IDs if provided
        if params[:tag_ids].present?
          tag_ids = params[:tag_ids].is_a?(Array) ? params[:tag_ids] : [ params[:tag_ids] ]
          base_query = base_query.joins(:post_tags).where(post_tags: { tag_id: tag_ids }).distinct
        end

        # Get total count before adding group/select
        total_count = base_query.count

        # Build posts query with includes and counts
        posts_query = base_query.includes({ user: { avatar_attachment: :blob } }, :tags, image_attachment: :blob)
        # Eager load reactions only when user is authenticated to avoid N+1
        posts_query = posts_query.includes(:reactions) if @current_user
        posts = posts_query.order(created_at: :desc)
                           .offset((page - 1) * per_page)
                           .limit(per_page)

        render json: {
          posts: posts.map { |post| serialize_post(post, @current_user) },
          meta: {
            current_page: page,
            per_page: per_page,
            total_count: total_count,
            total_pages: (total_count.to_f / per_page).ceil
          }
        }, status: :ok
      end

      # GET /api/v1/posts/popular
      # Returns posts ordered by engagement (reactions + comments)
      def popular
        page = params[:page]&.to_i || 1
        per_page = [ params[:per_page]&.to_i || 10, 50 ].min

        # Get total count
        total_count = Post.count

        # Build posts query ordered by engagement (reactions + comments)
        posts_query = Post.includes({ user: { avatar_attachment: :blob } }, :tags, image_attachment: :blob)
        posts_query = posts_query.includes(:reactions) if @current_user

        # Order by total engagement (reactions_count + comments_count) descending
        posts = posts_query.order(Arel.sql("(posts.reactions_count + posts.comments_count) DESC, posts.created_at DESC"))
                           .offset((page - 1) * per_page)
                           .limit(per_page)

        render json: {
          data: posts.map { |post| serialize_post(post, @current_user) },
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
        render json: { post: serialize_post(@post, @current_user, include_all_comments: true) }, status: :ok
      end

      # POST /api/v1/posts
      def create
        post = current_user.posts.new(post_params)

        if post.save
          handle_tags(post, params[:tags]) if params[:tags].present?

          # Create mention notifications for @mentioned users
          MentionService.process_mentions(post, current_user)

          # Broadcast new post to PostsChannel
          ActionCable.server.broadcast("posts_channel", {
            action: "new_post",
            post: serialize_post(post, current_user)
          })

          # Invalidate cache
          Rails.cache.increment("posts_cache_version")

          render json: {
            message: "Post created successfully",
            post: serialize_post(post, current_user)
          }, status: :created
        else
          render json: { errors: post.errors.full_messages }, status: :unprocessable_content
        end
      end

      # PUT /api/v1/posts/:id
      def update
        if @post.update(post_params)
          handle_tags(@post, params[:tags]) if params[:tags].present?

          # Create mention notifications for @mentioned users (in case new mentions were added)
          MentionService.process_mentions(@post, current_user)

          # Broadcast post update
          ActionCable.server.broadcast("posts_channel", {
            action: "update_post",
            post: serialize_post(@post, current_user)
          })
          ActionCable.server.broadcast("post_#{@post.id}", {
            action: "update_post",
            post: serialize_post(@post, current_user)
          })

          # Invalidate cache
          Rails.cache.increment("posts_cache_version")

          render json: {
            message: "Post updated successfully",
            post: serialize_post(@post, current_user)
          }, status: :ok
        else
          render json: { errors: @post.errors.full_messages }, status: :unprocessable_content
        end
      end

      # DELETE /api/v1/posts/:id
      def destroy
        post_id = @post.id
        @post.destroy

        # Broadcast post deletion
        ActionCable.server.broadcast("posts_channel", {
          action: "delete_post",
          post_id: post_id
        })

        render json: { message: "Post deleted successfully" }, status: :ok
      end

      private

      def set_post
        case action_name
        when "show"
          includes_list = [:user, :tags, { comments: :user }]
          includes_list << :reactions if @current_user
          @post = Post.includes(includes_list).find(params[:id])
        when "update"
          @post = Post.includes(:user, :tags).find(params[:id])
        when "destroy"
          @post = Post.includes(comments: [ :comments, :reactions, :notifications ]).find(params[:id])
        else
          @post = Post.find(params[:id])
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Post not found" }, status: :not_found
      end

      def authorize_post_owner!
        unless @post.user_id == current_user.id
          render json: { error: "Forbidden: You can only modify your own posts" }, status: :forbidden
        end
      end

      def post_params
        params.require(:post).permit(:title, :description, :picture, :image)
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
    end
  end
end
