# Configure Redis SSL settings for production
if Rails.env.production? && ENV["REDIS_URL"]&.start_with?("rediss://")
  require 'redis'

  # Monkey-patch Redis to always use VERIFY_NONE for SSL in production
  module RedisSSLPatch
    def ssl_context(ssl_params)
      ctx = super(ssl_params)
      ctx.verify_mode = OpenSSL::SSL::VERIFY_NONE
      ctx
    end
  end

  RedisClient::RubyConnection.prepend(RedisSSLPatch)
end
