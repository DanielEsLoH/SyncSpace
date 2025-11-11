# Configure ActionCable Redis adapter with SSL settings for production
if Rails.env.production? && ENV["REDIS_URL"]&.start_with?("rediss://")
  # Monkey-patch Redis client to disable SSL verification for Render Redis
  # This applies to all Redis connections including ActionCable broadcasts
  require 'redis-client'

  RedisClient.default_config.ssl_params = { verify_mode: OpenSSL::SSL::VERIFY_NONE }
end
