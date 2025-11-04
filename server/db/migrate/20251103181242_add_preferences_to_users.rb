# frozen_string_literal: true

# Migration to add user preferences as JSONB column
#
# This allows users to store customizable preferences like theme and language.
# Using JSONB provides flexibility for future preferences without schema changes.
#
# Structure:
# {
#   "theme": "light" | "dark" | "system",
#   "language": "en" | "es"
# }
#
# Performance:
# - JSONB is stored in a binary format (faster than JSON)
# - GIN index allows efficient queries on JSONB keys
# - Minimal storage overhead (~50 bytes per user)
class AddPreferencesToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :preferences, :jsonb, default: {}, null: false

    # Add GIN index for efficient JSONB queries
    add_index :users, :preferences, using: :gin
  end
end
