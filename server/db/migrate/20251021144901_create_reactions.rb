class CreateReactions < ActiveRecord::Migration[8.0]
  def change
    create_table :reactions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :reactionable, polymorphic: true, null: false
      t.string :reaction_type, null: false

      t.timestamps
    end

    add_index :reactions, [:user_id, :reactionable_type, :reactionable_id, :reaction_type],
              unique: true, name: 'index_reactions_on_user_and_reactionable_and_type'
  end
end
