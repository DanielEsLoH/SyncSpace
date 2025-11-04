# frozen_string_literal: true

# Migration to add refresh token support to users table
#
# Refresh tokens allow for secure, long-lived authentication sessions.
# When an access token expires (24 hours), the refresh token can be used
# to obtain a new access token without requiring the user to log in again.
#
# Security considerations:
# - Refresh tokens have longer expiry (7 days) than access tokens (24 hours)
# - Only one refresh token per user (rotating refresh tokens)
# - Tokens are indexed for fast lookup
# - Expiry time tracked to invalidate old tokens
class AddRefreshTokenToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :refresh_token, :string
    add_column :users, :refresh_token_expires_at, :datetime

    # Add index for fast token lookup
    add_index :users, :refresh_token, unique: true

    # Add index for expiry cleanup queries
    add_index :users, :refresh_token_expires_at
  end
end
