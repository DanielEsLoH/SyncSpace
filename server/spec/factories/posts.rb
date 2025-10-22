FactoryBot.define do
  factory :post do
    sequence(:title) { |n| "Test Post Title #{n}" }
    description { "This is a test description for the post. It needs to be at least 10 characters long to pass validation." }
    picture { "https://via.placeholder.com/800x600.png" }
    association :user
  end
end
