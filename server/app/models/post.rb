class Post < ApplicationRecord
  belongs_to :user
  has_many :comments, as: :commentable, dependent: :destroy
  has_many :reactions, as: :reactionable, dependent: :destroy
  has_many :notifications, as: :notifiable, dependent: :destroy
  has_many :post_tags, dependent: :destroy
  has_many :tags, through: :post_tags

  # Callbacks
  before_save :sanitize_content

  # Validations
  validates :title, presence: true, length: { minimum: 3, maximum: 200 }
  validates :description, presence: true, length: { minimum: 10, maximum: 5000 }

  # Scopes
  scope :recent, -> { order(created_at: :desc) }
  scope :with_user, -> { includes(:user) }
  # Note: with_counts scope removed - now using counter_cache columns directly

  # Instance methods
  # Note: reactions_count and comments_count methods removed - using counter_cache columns

  def last_three_comments
    comments.includes(:user).order(created_at: :desc).limit(3)
  end

  private

  # Sanitize user input to prevent XSS attacks
  def sanitize_content
    # Remove all HTML from title
    self.title = ActionView::Base.full_sanitizer.sanitize(title) if title.present?

    # Allow only safe HTML tags in description
    if description.present?
      self.description = ActionController::Base.helpers.sanitize(
        description,
        tags: %w[p br strong em ul ol li a code pre blockquote],
        attributes: %w[href]
      )
    end
  end
end
