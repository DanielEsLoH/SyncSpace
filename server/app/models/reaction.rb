class Reaction < ApplicationRecord
  belongs_to :user
  belongs_to :reactionable, polymorphic: true, counter_cache: :reactions_count

  # Constants
  REACTION_TYPES = %w[like love dislike].freeze

  # Validations
  validates :reaction_type, presence: true, inclusion: { in: REACTION_TYPES }
  # Ensure a user can only have ONE reaction per reactionable (regardless of type)
  validates :user_id, uniqueness: { scope: [ :reactionable_type, :reactionable_id ],
                                     message: "has already reacted to this" }

  # Scopes
  scope :likes, -> { where(reaction_type: "like") }
  scope :loves, -> { where(reaction_type: "love") }
  scope :dislikes, -> { where(reaction_type: "dislike") }
  scope :for_user, ->(user_id) { where(user_id: user_id) }

  # Class methods
  def self.toggle(user:, reactionable:, reaction_type:)
    # Find ANY existing reaction by this user on this reactionable (regardless of type)
    existing_reaction = find_by(user: user, reactionable: reactionable)

    if existing_reaction
      if existing_reaction.reaction_type == reaction_type
        # Clicking the same reaction type - remove it (toggle off)
        existing_reaction.destroy
        { action: "removed", reaction: nil }
      else
        # Clicking a different reaction type - change it
        existing_reaction.update!(reaction_type: reaction_type)
        { action: "changed", reaction: existing_reaction }
      end
    else
      # No existing reaction - create a new one
      reaction = create!(user: user, reactionable: reactionable, reaction_type: reaction_type)
      { action: "added", reaction: reaction }
    end
  end
end
