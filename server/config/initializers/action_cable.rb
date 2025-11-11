# Configure ActionCable Redis with SSL support for production
if Rails.env.production?
  require 'action_cable'
  require 'redis-client'

  # Monkeypatch RedisClient::Config to always use VERIFY_NONE for SSL in production
  RedisClient::Config.prepend(Module.new do
    def ssl_context
      @ssl_context ||= begin
        ctx = super
        ctx.verify_mode = OpenSSL::SSL::VERIFY_NONE if ctx
        ctx
      end
    rescue
      # If super fails, create a new context
      ctx = OpenSSL::SSL::SSLContext.new
      ctx.verify_mode = OpenSSL::SSL::VERIFY_NONE
      ctx
    end
  end)
end
