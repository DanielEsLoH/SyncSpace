module Api
  module V1
    class CommentsController < ApplicationController
      include Api::V1::PostSerializable

      before_action :set_commentable, only: [ :index, :create ]
      before_action :set_comment, only: [ :update, :destroy ]
      before_action :authorize_comment_owner!, only: [ :update, :destroy ]

      # GET /api/v1/posts/:post_id/comments
      # GET /api/v1/comments/:comment_id/comments (replies)
      def index
        comments = @commentable.comments.includes(:user, :reactions).order(created_at: :desc)

        render json: {
          comments: comments.map { |c| serialize_comment(c, current_user) }
        }, status: :ok
      end

      # POST /api/v1/posts/:post_id/comments
      # POST /api/v1/comments/:comment_id/comments (reply)
      def create
        comment = @commentable.comments.new(comment_params.merge(user: current_user))

        if comment.save
          # Create notification for the commentable owner
          create_notification_for_comment(comment)

          # Create mention notifications for @mentioned users
          MentionService.process_mentions(comment, current_user)

          # Broadcast new comment via ActionCable
          broadcast_comment(comment, "new_comment")

          # If this is a comment on a post, broadcast post update to feed
          if comment.commentable_type == "Post"
            broadcast_post_update(comment.commentable)
          end

          render json: {
            message: "Comment created successfully",
            comment: serialize_comment(comment, current_user)
          }, status: :created
        else
          render json: { errors: comment.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PUT /api/v1/comments/:id
      def update
        if @comment.update(comment_params)
          # Create mention notifications for @mentioned users (in case new mentions were added)
          MentionService.process_mentions(@comment, current_user)

          # Broadcast comment update
          broadcast_comment(@comment, "update_comment")

          render json: {
            message: "Comment updated successfully",
            comment: serialize_comment(@comment, current_user)
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
        post = commentable_type == "Post" ? @comment.commentable : nil
        root_post = @comment.root_post

        @comment.destroy

        # Broadcast comment deletion
        if commentable_type == "Post"
          ActionCable.server.broadcast("post_#{commentable_id}_comments", {
            action: "delete_comment",
            comment_id: comment_id
          })
          # Also broadcast post update to feed
          broadcast_post_update(post) if post
        else
          # This is a reply to a comment
          # Broadcast to the specific comment's replies channel
          ActionCable.server.broadcast("comment_#{commentable_id}_replies", {
            action: "delete_comment",
            comment_id: comment_id
          })

          # ALSO broadcast to the root post's comments channel so all viewers get the update
          if root_post
            ActionCable.server.broadcast("post_#{root_post.id}_comments", {
              action: "delete_comment",
              comment_id: comment_id
            })
            # Update the post's comment count in the feed
            broadcast_post_update(root_post)
          end
        end

        render json: { message: "Comment deleted successfully" }, status: :ok
      end

      private

      def set_commentable
        if params[:post_id]
          @commentable = Post.find(params[:post_id])
        elsif params[:comment_id]
          @commentable = Comment.find(params[:comment_id])
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Commentable not found" }, status: :not_found
      end

      def set_comment
        @comment = Comment.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Comment not found" }, status: :not_found
      end

      def authorize_comment_owner!
        unless @comment.user_id == current_user.id
          render json: { error: "Forbidden: You can only modify your own comments" }, status: :forbidden
        end
      end

      def comment_params
        params.require(:comment).permit(:description)
      end

      def create_notification_for_comment(comment)
        # Determine the recipient
        recipient = if comment.commentable_type == "Post"
          comment.commentable.user
        else # Comment on Comment
          comment.commentable.user
        end

        # Don't notify yourself
        return if recipient.id == current_user.id

        notification_type = comment.commentable_type == "Post" ? "comment_on_post" : "reply_to_comment"

        Notification.create(
          user: recipient,
          notifiable: comment,
          notification_type: notification_type,
          actor: current_user
        )
      end

      def broadcast_comment(comment, action)
        # Broadcast to the appropriate channel based on commentable type
        if comment.commentable_type == "Post"
          # This is a comment on a post
          ActionCable.server.broadcast("post_#{comment.commentable_id}_comments", {
            action: action,
            comment: serialize_comment(comment, current_user)
          })
        else
          # This is a reply to a comment
          # Broadcast to the specific comment's replies channel
          ActionCable.server.broadcast("comment_#{comment.commentable_id}_replies", {
            action: action,
            comment: serialize_comment(comment, current_user)
          })

          # ALSO broadcast to the root post's comments channel so all viewers get the update
          # Find the root post by traversing up the comment chain
          root_post = comment.root_post
          if root_post
            ActionCable.server.broadcast("post_#{root_post.id}_comments", {
              action: action,
              comment: serialize_comment(comment, current_user)
            })
          end
        end
      end

      def broadcast_post_update(post)
        ActionCable.server.broadcast("posts_channel", {
          action: "update_post",
          post: serialize_post(post, current_user)
        })
      end
    end
  end
end
