class Notification < ApplicationRecord
  belongs_to :user
  belongs_to :notifiable, polymorphic: true
  belongs_to :actor, class_name: 'User'

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
    update(read_at: Time.current) unless read?
  end

  def mark_as_unread!
    update(read_at: nil) if read?
  end

  # Class methods
  def self.mark_all_as_read(user)
    unread.where(user: user).update_all(read_at: Time.current)
  end

  private

  def broadcast_notification
    # Broadcast to the user's personal notification channel
    NotificationsChannel.broadcast_to(user, {
      action: 'new_notification',
      notification: notification_data
    })
  end

  def notification_data
    {
      id: id,
      notification_type: notification_type,
      read_at: read_at,
      created_at: created_at,
      actor: {
        id: actor.id,
        name: actor.name,
        profile_picture: actor.profile_picture
      },
      notifiable: {
        id: notifiable.id,
        type: notifiable_type
      }
    }
  end
end
