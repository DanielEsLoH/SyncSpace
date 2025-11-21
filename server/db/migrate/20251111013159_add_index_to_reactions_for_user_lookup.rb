class AddIndexToReactionsForUserLookup < ActiveRecord::Migration[8.0]
  def change
    # Add composite index for faster user reaction lookups
    # This index helps queries like: reactions.find_by(user: current_user, reactionable: post)
    add_index :reactions, [ :reactionable_type, :reactionable_id, :user_id ],
              name: 'index_reactions_on_reactionable_and_user'
  end
end
