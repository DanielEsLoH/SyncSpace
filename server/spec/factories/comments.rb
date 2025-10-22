FactoryBot.define do
  factory :comment do
    description { "This is a test comment description" }
    association :user
    association :commentable, factory: :post
  end
end
