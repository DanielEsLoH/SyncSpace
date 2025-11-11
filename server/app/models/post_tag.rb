class PostTag < ApplicationRecord
  belongs_to :post
  belongs_to :tag, counter_cache: :posts_count

  # Validations
  validates :post_id, uniqueness: { scope: :tag_id, message: "already has this tag" }
end
