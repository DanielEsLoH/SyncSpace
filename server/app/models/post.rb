class Post < ApplicationRecord
  belongs_to :user
  has_many :comments, as: :commentable, dependent: :destroy
  has_many :reactions, as: :reactionable, dependent: :destroy
  has_many :notifications, as: :notifiable, dependent: :destroy
  has_many :post_tags, dependent: :destroy
  has_many :tags, through: :post_tags

  # Active Storage
  has_one_attached :image do |attachable|
    attachable.variant :thumb, resize_to_limit: [ 200, 200 ]
    attachable.variant :medium, resize_to_limit: [ 600, 600 ]
    attachable.variant :large, resize_to_limit: [ 1200, 1200 ]
  end

  # Callbacks
  before_save :sanitize_content

  # Validations
  validates :title, presence: true, length: { minimum: 3, maximum: 200 }
  validates :description, presence: true, length: { minimum: 10, maximum: 5000 }
  validate :image_format, if: -> { image.attached? }
  validate :image_size, if: -> { image.attached? }

  # Scopes
  scope :recent, -> { order(created_at: :desc) }
  scope :with_user, -> { includes(:user) }
  # Note: with_counts scope removed - now using counter_cache columns directly

  # Instance methods
  # Note: reactions_count and comments_count methods removed - using counter_cache columns

  def last_three_comments
    comments.includes(:user).order(created_at: :desc).limit(3)
  end

  # Get image URL with fallback to picture field for backward compatibility
  def image_url(variant: :large)
    if image.attached?
      if variant && image.variable?
        # Generate URL for variant
        Rails.application.routes.url_helpers.url_for(
          image.variant(variant)
        )
      else
        # Generate URL for original image
        Rails.application.routes.url_helpers.url_for(image)
      end
    else
      # Fallback to picture field for backward compatibility
      picture
    end
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

  # Validate image content type
  def image_format
    acceptable_types = [ "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" ]
    unless image.content_type.in?(acceptable_types)
      errors.add(:image, "must be a JPEG, PNG, GIF, or WebP image")
    end
  end

  # Validate image file size (max 10MB for post images)
  def image_size
    max_size = 10.megabytes
    if image.byte_size > max_size
      errors.add(:image, "must be less than #{max_size / 1.megabyte}MB")
    end
  end
end
