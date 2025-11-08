class NotificationsChannel < ApplicationCable::Channel
  def subscribed
    # Only authenticated users can receive notifications
    if current_user
      stream_for current_user
    else
      reject
    end
  end

  def unsubscribed
    stop_all_streams
  end

  # Mark notification as read via WebSocket
  def mark_read(data)
    return unless current_user

    notification_id = data["notification_id"]
    notification = current_user.notifications.find_by(id: notification_id)

    notification&.mark_as_read!
  end

  # Mark all notifications as read
  def mark_all_read
    return unless current_user

    Notification.mark_all_as_read(current_user)
  end
end
