# Configure ActionCable Redis adapter with SSL settings for production
Rails.application.config.after_initialize do
  if Rails.env.production? && ENV["REDIS_URL"]&.start_with?("rediss://")
    # Configure ActionCable's Redis connection with SSL parameters
    redis_url = ENV["REDIS_URL"]

    ActionCable.server.config.cable = {
      adapter: "redis",
      url: redis_url,
      ssl_params: { verify_mode: OpenSSL::SSL::VERIFY_NONE }
    }
  end
end
