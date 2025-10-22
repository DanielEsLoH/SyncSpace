module Api
  module V1
    class ReactionsController < ApplicationController
      before_action :set_reactionable

      # POST /api/v1/posts/:post_id/reactions
      # POST /api/v1/comments/:comment_id/reactions
      # Body: { reaction_type: 'like' | 'love' | 'dislike' }
      def toggle
        unless Reaction::REACTION_TYPES.include?(params[:reaction_type])
          return render json: { error: 'Invalid reaction type' }, status: :unprocessable_entity
        end

        result = Reaction.toggle(
          user: current_user,
          reactionable: @reactionable,
          reaction_type: params[:reaction_type]
        )

        # Create notification if reaction was added (not removed)
        if result[:action] == 'added' && @reactionable.respond_to?(:user) && @reactionable.user.id != current_user.id
          create_notification_for_reaction(result[:reaction])
        end

        render json: {
          action: result[:action],
          message: "Reaction #{result[:action]}",
          reactions_count: @reactionable.reactions.count
        }, status: :ok
      end

      # GET /api/v1/posts/:post_id/reactions
      # GET /api/v1/comments/:comment_id/reactions
      def index
        reactions = @reactionable.reactions.includes(:user).group_by(&:reaction_type)

        render json: {
          reactions: {
            like: reactions['like']&.count || 0,
            love: reactions['love']&.count || 0,
            dislike: reactions['dislike']&.count || 0
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
        render json: { error: 'Reactionable not found' }, status: :not_found
      end

      def create_notification_for_reaction(reaction)
        notification_type = reaction.reactionable_type == 'Post' ? 'reaction_on_post' : 'reaction_on_comment'

        Notification.create(
          user: @reactionable.user,
          notifiable: reaction,
          notification_type: notification_type,
          actor: current_user
        )
      end
    end
  end
end
