class Notification < ApplicationRecord
  belongs_to :user
  belongs_to :notifiable, polymorphic: true
  belongs_to :actor, class_name: "User"

  # Constants
  NOTIFICATION_TYPES = %w[
    comment_on_post
    reply_to_comment
    mention
    reaction_on_post
    reaction_on_comment
  ].freeze

  # Validations
  validates :notification_type, presence: true, inclusion: { in: NOTIFICATION_TYPES }

  # Callbacks
  after_create :broadcast_notification

  # Scopes
  scope :unread, -> { where(read_at: nil) }
  scope :read, -> { where.not(read_at: nil) }
  scope :recent, -> { order(created_at: :desc) }

  # Instance methods
  def read?
    read_at.present?
  end

  def unread?
    read_at.nil?
  end

  def mark_as_read!
    return if read?

    update(read_at: Time.current)
    # Broadcast to the user's personal notification channel
    NotificationsChannel.broadcast_to(user, {
      action: "notification_read",
      notification_id: id
    })
  end

  def mark_as_unread!
    update(read_at: nil) if read?
  end

  # Class methods
  def self.mark_all_as_read(user)
    count = unread.where(user: user).update_all(read_at: Time.current)
    # Broadcast to the user's personal notification channel
    NotificationsChannel.broadcast_to(user, {
      action: "all_notifications_read"
    })
    count
  end

  private

  def broadcast_notification
    # Broadcast to the user's personal notification channel
    NotificationsChannel.broadcast_to(user, {
      action: "new_notification",
      notification: notification_data
    })
  end

  def notification_data
    # Handle case where actor was deleted
    actor_data = if actor
      {
        id: actor.id,
        name: actor.name,
        profile_picture: actor.profile_picture
      }
    else
      {
        id: nil,
        name: "Deleted User",
        profile_picture: nil
      }
    end

    {
      id: id,
      notification_type: notification_type,
      read: read?,
      actor: actor_data,
      notifiable: notifiable_data,
      created_at: created_at
    }
  end

  def notifiable_data
    # Return nil if the notifiable object has been deleted
    return nil if notifiable.nil?

    case notifiable_type
    when "Comment"
      comment = notifiable
      # Additional safety check for associated post
      return nil if comment.root_post.nil?

      {
        type: "Comment",
        id: comment.id,
        description: comment.description[0..100],
        post_id: comment.root_post.id
      }
    when "Reaction"
      reaction = notifiable
      {
        type: "Reaction",
        id: reaction.id,
        reaction_type: reaction.reaction_type,
        reactionable_type: reaction.reactionable_type,
        reactionable_id: reaction.reactionable_id
      }
    when "Post"
      post = notifiable
      {
        type: "Post",
        id: post.id,
        title: post.title,
        description: post.description[0..100]
      }
    else
      nil
    end
  end
end
