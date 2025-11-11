module Api
  module V1
    class ReactionsController < ApplicationController
      before_action :set_reactionable

      # POST /api/v1/posts/:post_id/reactions
      # POST /api/v1/comments/:comment_id/reactions
      # Body: { reaction_type: 'like' | 'love' | 'dislike' }
      def toggle
        unless Reaction::REACTION_TYPES.include?(params[:reaction_type])
          return render json: { error: "Invalid reaction type" }, status: :unprocessable_content
        end

        result = Reaction.toggle(
          user: current_user,
          reactionable: @reactionable,
          reaction_type: params[:reaction_type]
        )

        # Reload to get fresh counter cache value
        @reactionable.reload

        # Create notification only when reaction is added (not changed or removed)
        # This prevents notification spam when users change from like to love, etc.
        if result[:action] == "added" && @reactionable.respond_to?(:user) && @reactionable.user.id != current_user.id
          create_notification_for_reaction(result[:reaction])
        end

        # Broadcast reaction update to relevant channels
        broadcast_reaction_update(result[:action])

        # Build user_reaction response
        user_reaction_data = if result[:reaction]
          {
            id: result[:reaction].id,
            reaction_type: result[:reaction].reaction_type,
            user_id: result[:reaction].user_id,
            created_at: result[:reaction].created_at
          }
        else
          nil
        end

        render json: {
          action: result[:action],
          message: "Reaction #{result[:action]}",
          reactions_count: @reactionable.reactions_count,
          user_reaction: user_reaction_data
        }, status: :ok
      end

      # GET /api/v1/posts/:post_id/reactions
      # GET /api/v1/comments/:comment_id/reactions
      def index
        reactions = @reactionable.reactions.group_by(&:reaction_type)

        render json: {
          reactions: {
            like: reactions["like"]&.count || 0,
            love: reactions["love"]&.count || 0,
            dislike: reactions["dislike"]&.count || 0
          },
          user_reactions: @reactionable.reactions.where(user: current_user).pluck(:reaction_type)
        }, status: :ok
      end

      private

      def set_reactionable
        if params[:post_id]
          @reactionable = Post.find(params[:post_id])
        elsif params[:comment_id]
          @reactionable = Comment.find(params[:comment_id])
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Reactionable not found" }, status: :not_found
      end

      def create_notification_for_reaction(reaction)
        notification_type = reaction.reactionable_type == "Post" ? "reaction_on_post" : "reaction_on_comment"

        Notification.create(
          user: @reactionable.user,
          notifiable: reaction,
          notification_type: notification_type,
          actor: current_user
        )
      end

      def broadcast_reaction_update(action)
        if @reactionable.is_a?(Post)
          # Broadcast post reaction update to posts channel
          ActionCable.server.broadcast("posts_channel", {
            action: "reaction_update",
            post: serialize_post_for_broadcast(@reactionable),
            reaction_action: action
          })
        elsif @reactionable.is_a?(Comment)
          # Broadcast comment reaction update to the post's comments channel
          root_post = @reactionable.root_post
          if root_post
            ActionCable.server.broadcast("post_#{root_post.id}_comments", {
              action: "comment_reaction_update",
              comment: serialize_comment_for_broadcast(@reactionable),
              reaction_action: action
            })
          end
        end
      rescue Redis::CannotConnectError, RedisClient::ConnectionError, EOFError => e
        # Log the error but don't fail the request
        Rails.logger.error("ActionCable broadcast failed: #{e.class} - #{e.message}")
      end

      # Serialize post for broadcast (user-agnostic, excludes user_reaction)
      def serialize_post_for_broadcast(post)
        # Get last 3 comments for preview
        last_three_comments = post.comments
          .where(commentable_type: "Post")
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
                profile_picture: comment.user.avatar_url
              },
              created_at: comment.created_at
            }
          end

        {
          id: post.id,
          title: post.title,
          description: post.description,
          picture: post.image_url,
          user: {
            id: post.user.id,
            name: post.user.name,
            email: post.user.email,
            profile_picture: post.user.avatar_url
          },
          tags: post.tags.map { |t| { id: t.id, name: t.name, color: t.color } },
          reactions_count: post.reactions_count,
          comments_count: post.comments_count,
          last_three_comments: last_three_comments,
          # IMPORTANT: Don't include user_reaction in broadcasts - it's user-specific
          created_at: post.created_at,
          updated_at: post.updated_at
        }
      end

      # Serialize comment for broadcast (user-agnostic, excludes user_reaction)
      def serialize_comment_for_broadcast(comment)
        {
          id: comment.id,
          description: comment.description,
          commentable_type: comment.commentable_type,
          commentable_id: comment.commentable_id,
          user: {
            id: comment.user.id,
            name: comment.user.name,
            profile_picture: comment.user.avatar_url
          },
          reactions_count: comment.reactions_count,
          replies_count: comment.comments_count,
          # IMPORTANT: Don't include user_reaction in broadcasts - it's user-specific
          created_at: comment.created_at,
          updated_at: comment.updated_at
        }
      end
    end
  end
end
