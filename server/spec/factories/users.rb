FactoryBot.define do
  factory :user do
    sequence(:name) { |n| "User #{n}" }
    sequence(:email) { |n| "user#{n}@example.com" }
    password { 'password123' }
    password_confirmation { 'password123' }
    bio { 'This is a test bio for the user profile' }
    confirmed_at { nil }
    confirmation_token { SecureRandom.urlsafe_base64 }
    confirmation_sent_at { Time.current }
    reset_password_token { nil }
    reset_password_sent_at { nil }
  end
end
