class Post < ApplicationRecord
  belongs_to :user
  has_many :comments, as: :commentable, dependent: :destroy
  has_many :reactions, as: :reactionable, dependent: :destroy
  has_many :notifications, as: :notifiable, dependent: :destroy
  has_many :post_tags, dependent: :destroy
  has_many :tags, through: :post_tags

  # Validations
  validates :title, presence: true, length: { minimum: 3, maximum: 200 }
  validates :description, presence: true, length: { minimum: 10, maximum: 5000 }

  # Scopes
  scope :recent, -> { order(created_at: :desc) }
  scope :with_user, -> { includes(:user) }
  scope :with_counts, -> {
    left_joins(:comments, :reactions)
      .select('posts.*, COUNT(DISTINCT comments.id) as comments_count, COUNT(DISTINCT reactions.id) as reactions_count')
      .group('posts.id')
  }

  # Instance methods
  def reactions_count
    reactions.count
  end

  def comments_count
    comments.count
  end

  def last_three_comments
    comments.includes(:user).order(created_at: :desc).limit(3)
  end
end
