# Configure ActionCable Redis adapter with SSL settings
Rails.application.configure do
  if Rails.env.production? && ENV["REDIS_URL"]&.start_with?("rediss://")
    # For SSL Redis connections (rediss://), disable certificate verification
    # This is needed for some Redis providers like Render
    config.action_cable.connection_class = -> {
      ActionCable::Connection::Base
    }

    # Configure Redis adapter with SSL parameters
    ActionCable.server.config.cable = {
      adapter: "redis",
      url: ENV["REDIS_URL"],
      ssl_params: { verify_mode: OpenSSL::SSL::VERIFY_NONE }
    }
  end
end
