module Api
  module V1
    class CommentsController < ApplicationController
      before_action :set_commentable, only: [:index, :create]
      before_action :set_comment, only: [:update, :destroy]
      before_action :authorize_comment_owner!, only: [:update, :destroy]

      # GET /api/v1/posts/:post_id/comments
      # GET /api/v1/comments/:comment_id/comments (replies)
      def index
        comments = @commentable.comments.includes(:user, :reactions).order(created_at: :desc)

        render json: {
          comments: comments.map { |c| comment_response(c) }
        }, status: :ok
      end

      # POST /api/v1/posts/:post_id/comments
      # POST /api/v1/comments/:comment_id/comments (reply)
      def create
        comment = @commentable.comments.new(comment_params.merge(user: current_user))

        if comment.save
          # Create notification for the commentable owner
          create_notification_for_comment(comment)

          # Broadcast new comment via ActionCable
          broadcast_comment(comment, 'new_comment')

          # If this is a comment on a post, broadcast post update to feed
          if comment.commentable_type == 'Post'
            broadcast_post_update(comment.commentable)
          end

          render json: {
            message: 'Comment created successfully',
            comment: comment_response(comment)
          }, status: :created
        else
          render json: { errors: comment.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PUT /api/v1/comments/:id
      def update
        if @comment.update(comment_params)
          # Broadcast comment update
          broadcast_comment(@comment, 'update_comment')

          render json: {
            message: 'Comment updated successfully',
            comment: comment_response(@comment)
          }, status: :ok
        else
          render json: { errors: @comment.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/comments/:id
      def destroy
        comment_id = @comment.id
        commentable_type = @comment.commentable_type
        commentable_id = @comment.commentable_id
        post = commentable_type == 'Post' ? @comment.commentable : nil

        @comment.destroy

        # Broadcast comment deletion
        if commentable_type == 'Post'
          ActionCable.server.broadcast("post_#{commentable_id}_comments", {
            action: 'delete_comment',
            comment_id: comment_id
          })
          # Also broadcast post update to feed
          broadcast_post_update(post) if post
        else
          ActionCable.server.broadcast("comment_#{commentable_id}_replies", {
            action: 'delete_comment',
            comment_id: comment_id
          })
        end

        render json: { message: 'Comment deleted successfully' }, status: :ok
      end

      private

      def set_commentable
        if params[:post_id]
          @commentable = Post.find(params[:post_id])
        elsif params[:comment_id]
          @commentable = Comment.find(params[:comment_id])
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Commentable not found' }, status: :not_found
      end

      def set_comment
        @comment = Comment.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Comment not found' }, status: :not_found
      end

      def authorize_comment_owner!
        unless @comment.user_id == current_user.id
          render json: { error: 'Forbidden: You can only modify your own comments' }, status: :forbidden
        end
      end

      def comment_params
        params.require(:comment).permit(:description)
      end

      def create_notification_for_comment(comment)
        # Determine the recipient
        recipient = if comment.commentable_type == 'Post'
          comment.commentable.user
        else # Comment on Comment
          comment.commentable.user
        end

        # Don't notify yourself
        return if recipient.id == current_user.id

        notification_type = comment.commentable_type == 'Post' ? 'comment_on_post' : 'reply_to_comment'

        Notification.create(
          user: recipient,
          notifiable: comment,
          notification_type: notification_type,
          actor: current_user
        )
      end

      def broadcast_comment(comment, action)
        # Broadcast to the appropriate channel based on commentable type
        if comment.commentable_type == 'Post'
          # This is a comment on a post
          ActionCable.server.broadcast("post_#{comment.commentable_id}_comments", {
            action: action,
            comment: comment_response(comment)
          })
        else
          # This is a reply to a comment
          ActionCable.server.broadcast("comment_#{comment.commentable_id}_replies", {
            action: action,
            comment: comment_response(comment)
          })
        end
      end

      def broadcast_post_update(post)
        # Reload the post to get fresh comment count and last comments
        post.reload

        # Get last 3 comments for preview
        last_three_comments = post.comments
          .where(commentable_type: 'Post')
          .order(created_at: :desc)
          .limit(3)
          .includes(:user)
          .map do |comment|
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

        # Get current user's reaction if authenticated
        user_reaction = if current_user
          post.reactions.find_by(user: current_user)
        else
          nil
        end

        # Broadcast updated post data to PostsChannel
        ActionCable.server.broadcast('posts_channel', {
          action: 'update_post',
          post: {
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
            reactions_count: post.reactions.count,
            comments_count: post.comments_count,
            last_three_comments: last_three_comments,
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
        })
      end

      def comment_response(comment)
        # Get current user's reaction if authenticated
        user_reaction = if @current_user
          comment.reactions.find_by(user: @current_user)
        else
          nil
        end

        {
          id: comment.id,
          description: comment.description,
          commentable_type: comment.commentable_type,
          commentable_id: comment.commentable_id,
          user: {
            id: comment.user.id,
            name: comment.user.name,
            email: comment.user.email,
            profile_picture: comment.user.profile_picture
          },
          reactions_count: comment.reactions.count,
          replies_count: comment.comments.count,
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
          created_at: comment.created_at,
          updated_at: comment.updated_at
        }
      end
    end
  end
end
