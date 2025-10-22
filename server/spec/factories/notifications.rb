FactoryBot.define do
  factory :notification do
    association :user
    association :notifiable, factory: :comment
    notification_type { %w[comment_on_post reply_to_comment reaction_on_post reaction_on_comment].sample }
    read_at { nil }
    association :actor, factory: :user
  end
end
