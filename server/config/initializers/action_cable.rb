# Configure ActionCable Redis with SSL support
Rails.application.configure do
  if Rails.env.production? && ENV["REDIS_URL"]&.start_with?("rediss://")
    config.after_initialize do
      # Configure ActionCable's Redis adapter with SSL params
      ActionCable.server.config.cable = {
        adapter: "redis",
        url: ENV["REDIS_URL"],
        ssl_params: {
          verify_mode: OpenSSL::SSL::VERIFY_NONE
        }
      }
    end
  end
end
