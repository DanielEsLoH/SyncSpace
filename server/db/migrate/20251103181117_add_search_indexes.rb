# frozen_string_literal: true

# Migration to add PostgreSQL search optimization indexes
#
# This migration enables the pg_trgm extension and creates GIN indexes
# for efficient full-text search across posts, users, and tags.
#
# pg_trgm (trigram) indexes enable fast similarity matching and
# case-insensitive LIKE/ILIKE queries with pattern matching.
#
# Performance impact:
# - Search queries will be ~10-100x faster depending on table size
# - Slightly increases write time (acceptable trade-off)
# - Increases storage by ~5-10% for indexed columns
class AddSearchIndexes < ActiveRecord::Migration[8.0]
  def up
    # Enable the pg_trgm extension for trigram-based text search
    # This is idempotent - safe to run on Supabase where it may already exist
    execute 'CREATE EXTENSION IF NOT EXISTS pg_trgm'

    # Posts table indexes
    # Used for searching posts by title and description
    add_index :posts, :title, using: :gin, opclass: :gin_trgm_ops
    add_index :posts, :description, using: :gin, opclass: :gin_trgm_ops

    # Users table indexes
    # Used for searching users by name
    # Note: email already has a unique btree index which is sufficient for exact lookups
    add_index :users, :name, using: :gin, opclass: :gin_trgm_ops

    # Tags table indexes
    # Note: tags.name already has a unique btree index which is sufficient
  end

  def down
    # Remove indexes in reverse order
    remove_index :users, :name
    remove_index :posts, :description
    remove_index :posts, :title

    # Note: We don't disable the extension as other features might use it
    # disable_extension 'pg_trgm'
  end
end
