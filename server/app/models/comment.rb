class Comment < ApplicationRecord
  belongs_to :user
  belongs_to :commentable, polymorphic: true

  # A comment can have many replies (comments on this comment)
  has_many :comments, as: :commentable, dependent: :destroy
  has_many :reactions, as: :reactionable, dependent: :destroy
  has_many :notifications, as: :notifiable, dependent: :destroy

  # Validations
  validates :description, presence: true, length: { minimum: 1, maximum: 2000 }
  validate :cannot_be_self_parent

  # Scopes
  scope :recent, -> { order(created_at: :desc) }
  scope :with_user, -> { includes(:user) }

  # Instance methods
  def reactions_count
    reactions.count
  end

  def replies_count
    comments.count
  end

  # Check if this is a top-level comment (belongs to a post)
  def top_level?
    commentable_type == 'Post'
  end

  # Check if this is a reply to another comment
  def reply?
    commentable_type == 'Comment'
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
    if commentable_type == 'Comment' && commentable_id == id
      errors.add(:commentable, "cannot be itself")
    end
  end
end
