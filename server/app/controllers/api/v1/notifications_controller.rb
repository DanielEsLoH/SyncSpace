module Api
  module V1
    class NotificationsController < ApplicationController
      # GET /api/v1/notifications
      def index
        notifications = current_user.notifications
                                    .includes(:actor, :notifiable)
                                    .order(created_at: :desc)

        # Filter by read/unread
        notifications = notifications.unread if params[:unread] == "true"
        notifications = notifications.read if params[:read] == "true"

        # Pagination
        page = params[:page]&.to_i || 1
        per_page = [ params[:per_page]&.to_i || 20, 100 ].min

        total_count = notifications.count
        notifications = notifications.offset((page - 1) * per_page).limit(per_page)

        render json: {
          notifications: notifications.map { |n| notification_response(n) },
          unread_count: current_user.notifications.unread.count,
          meta: {
            current_page: page,
            per_page: per_page,
            total_count: total_count,
            total_pages: (total_count.to_f / per_page).ceil
          }
        }, status: :ok
      end

      # PUT /api/v1/notifications/:id/mark_read
      def mark_read
        notification = current_user.notifications.find(params[:id])
        notification.mark_as_read!

        render json: {
          message: "Notification marked as read",
          notification: notification_response(notification)
        }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Notification not found" }, status: :not_found
      end

      # PUT /api/v1/notifications/mark_all_read
      def mark_all_read
        Notification.mark_all_as_read(current_user)

        render json: {
          message: "All notifications marked as read",
          unread_count: 0
        }, status: :ok
      end

      # GET /api/v1/notifications/unread_count
      def unread_count
        count = current_user.notifications.unread.count

        render json: {
          count: count
        }, status: :ok
      end

      private

      def notification_response(notification)
        # Handle case where actor was deleted
        actor_data = if notification.actor
          {
            id: notification.actor.id,
            name: notification.actor.name,
            profile_picture: notification.actor.avatar_url
          }
        else
          {
            id: nil,
            name: "Deleted User",
            profile_picture: nil
          }
        end

        {
          id: notification.id,
          notification_type: notification.notification_type,
          read: notification.read?,
          actor: actor_data,
          notifiable: notifiable_data(notification),
          created_at: notification.created_at
        }
      end

      def notifiable_data(notification)
        # Return nil if the notifiable object has been deleted
        return nil if notification.notifiable.nil?

        case notification.notifiable_type
        when "Comment"
          comment = notification.notifiable
          # Additional safety check for associated post
          return nil if comment.root_post.nil?

          {
            type: "Comment",
            id: comment.id,
            description: comment.description[0..100],
            post_id: comment.root_post.id
          }
        when "Reaction"
          reaction = notification.notifiable
          {
            type: "Reaction",
            id: reaction.id,
            reaction_type: reaction.reaction_type,
            reactionable_type: reaction.reactionable_type,
            reactionable_id: reaction.reactionable_id
          }
        else
          nil
        end
      end
    end
  end
end
