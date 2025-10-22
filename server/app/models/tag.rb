class Tag < ApplicationRecord
  has_many :post_tags, dependent: :destroy
  has_many :posts, through: :post_tags

  # Validations
  validates :name, presence: true, uniqueness: { case_sensitive: false }, length: { minimum: 2, maximum: 30 }
  validates :color, presence: true, format: { with: /\A#[0-9A-Fa-f]{6}\z/, message: "must be a valid hex color" }

  # Callbacks
  before_save :downcase_name
  before_validation :set_default_color, on: :create

  # Scopes
  scope :popular, -> { joins(:posts).group('tags.id').order('COUNT(posts.id) DESC') }
  scope :alphabetical, -> { order(:name) }

  private

  def downcase_name
    self.name = name.downcase if name.present?
  end

  def set_default_color
    self.color ||= generate_random_color
  end

  def generate_random_color
    "#%06x" % (rand * 0xffffff)
  end
end
