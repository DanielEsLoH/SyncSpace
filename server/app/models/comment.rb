class Comment < ApplicationRecord
  belongs_to :user
  belongs_to :commentable, polymorphic: true, counter_cache: :comments_count

  # A comment can have many replies (comments on this comment)
  has_many :comments, as: :commentable, dependent: :destroy
  has_many :reactions, as: :reactionable, dependent: :destroy
  has_many :notifications, as: :notifiable, dependent: :destroy

  # Callbacks
  before_save :sanitize_content

  # Validations
  validates :description, presence: true, length: { minimum: 1, maximum: 2000 }
  validate :cannot_be_self_parent

  # Scopes
  scope :recent, -> { order(created_at: :desc) }
  scope :with_user, -> { includes(:user) }

  # Instance methods
  # Note: reactions_count now uses counter_cache column directly

  # Alias for better readability - using a method to avoid migration issues
  def replies_count
    comments_count
  end

  # Check if this is a top-level comment (belongs to a post)
  def top_level?
    commentable_type == "Post"
  end

  # Check if this is a reply to another comment
  def reply?
    commentable_type == "Comment"
  end

  # Get the root post (works for nested comments)
  def root_post
    if top_level?
      commentable
    else
      commentable.root_post
    end
  end

  private

  def cannot_be_self_parent
    if commentable_type == "Comment" && commentable_id == id
      errors.add(:commentable, "cannot be itself")
    end
  end

  # Sanitize user input to prevent XSS attacks
  def sanitize_content
    if description.present?
      self.description = ActionController::Base.helpers.sanitize(
        description,
        tags: %w[p br strong em code],
        attributes: []
      )
    end
  end
end
