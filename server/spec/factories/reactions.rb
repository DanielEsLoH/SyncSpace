FactoryBot.define do
  factory :reaction do
    association :user
    association :reactionable, factory: :post
    reaction_type { %w[like love dislike].sample }
  end
end
