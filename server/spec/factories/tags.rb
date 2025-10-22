FactoryBot.define do
  factory :tag do
    sequence(:name) { |n| "tag#{n}" }
    color { "##{SecureRandom.hex(3)}" }
  end
end
