class User < ApplicationRecord
  has_secure_password

  # Associations
  has_many :posts, dependent: :destroy
  has_many :comments, dependent: :destroy
  has_many :reactions, dependent: :destroy
  has_many :notifications, dependent: :destroy

  # Validations
  validates :name, presence: true, length: { minimum: 2, maximum: 50 }
  validates :email, presence: true, uniqueness: { case_sensitive: false },
            format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 6 }, if: -> { new_record? || password.present? }
  validates :bio, length: { maximum: 500 }, allow_blank: true

  # Callbacks
  before_save :downcase_email
  before_create :generate_confirmation_token
  after_create :set_default_profile_picture

  # Scopes
  scope :confirmed, -> { where.not(confirmed_at: nil) }
  scope :unconfirmed, -> { where(confirmed_at: nil) }

  # Instance methods
  def confirmed?
    confirmed_at.present?
  end

  def confirm!
    update(confirmed_at: Time.current, confirmation_token: nil)
  end

  def generate_confirmation_token
    self.confirmation_token = SecureRandom.urlsafe_base64
    self.confirmation_sent_at = Time.current
  end

  def generate_reset_password_token
    self.reset_password_token = SecureRandom.urlsafe_base64
    self.reset_password_sent_at = Time.current
    save
  end

  def reset_password_token_valid?
    reset_password_sent_at.present? && reset_password_sent_at > 2.hours.ago
  end

  private

  def downcase_email
    self.email = email.downcase if email.present?
  end

  def set_default_profile_picture
    return if profile_picture.present?

    # Generate a unique avatar using UI Avatars API with user's initials
    # This creates a colorful avatar with the user's name
    initials = name.split.map(&:first).join.upcase[0..1]
    # Use a hash of the email to generate a consistent color
    color = Digest::MD5.hexdigest(email)[0..5]
    background = Digest::MD5.hexdigest(email.reverse)[0..5]

    self.profile_picture = "https://ui-avatars.com/api/?name=#{URI.encode_www_form_component(name)}&size=200&background=#{background}&color=#{color}&bold=true"
    save
  end
end
