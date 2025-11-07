# Rack::Attack Configuration for SyncSpace
#
# This middleware provides rate limiting and abuse prevention
# to protect the API from brute force attacks and excessive usage.
#
# Documentation: https://github.com/rack/rack-attack

class Rack::Attack
  ### Configure Cache ###
  #
  # Use Rails.cache for storing rate limit data
  # In production, this should be backed by Redis for persistence
  Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new

  ### Throttle Configuration ###

  # Throttle login attempts by IP address
  #
  # Limit: 5 login attempts per IP per minute
  # This prevents brute force password attacks
  throttle("login/ip", limit: 5, period: 1.minute) do |req|
    if req.path == "/api/v1/auth/login" && req.post?
      req.ip
    end
  end

  # Throttle login attempts by email
  #
  # Limit: 5 login attempts per email per minute
  # Additional protection against targeted account attacks
  throttle("login/email", limit: 5, period: 1.minute) do |req|
    if req.path == "/api/v1/auth/login" && req.post?
      # Extract email from request body
      req.params["email"]&.to_s&.downcase&.presence
    end
  end

  # Throttle registration by IP
  #
  # Limit: 3 registrations per IP per 5 minutes
  # Prevents automated account creation
  throttle("register/ip", limit: 3, period: 5.minutes) do |req|
    if req.path == "/api/v1/auth/register" && req.post?
      req.ip
    end
  end

  # Throttle password reset requests
  #
  # Limit: 3 reset requests per hour per email
  # Prevents email flooding and enumeration attacks
  throttle("password_reset/email", limit: 3, period: 1.hour) do |req|
    if req.path == "/api/v1/auth/forgot_password" && req.post?
      req.params["email"]&.to_s&.downcase&.presence
    end
  end

  # Throttle post creation by user
  #
  # Limit: 10 posts per user per minute
  # Prevents spam and excessive content creation
  throttle("posts/user", limit: 10, period: 1.minute) do |req|
    if req.path == "/api/v1/posts" && req.post?
      # Extract user ID from JWT token
      extract_user_id_from_token(req)
    end
  end

  # Throttle comment creation by user
  #
  # Limit: 20 comments per user per minute
  # Prevents comment spam
  throttle("comments/user", limit: 20, period: 1.minute) do |req|
    if (req.path.match?(%r{/api/v1/posts/\d+/comments}) ||
        req.path.match?(%r{/api/v1/comments/\d+/comments})) && req.post?
      extract_user_id_from_token(req)
    end
  end

  # Throttle search requests by IP
  #
  # Limit: 30 searches per IP per minute
  # Prevents search abuse and scraping
  throttle("search/ip", limit: 30, period: 1.minute) do |req|
    if req.path == "/api/v1/search" && req.get?
      req.ip
    end
  end

  # Global request throttle per IP
  #
  # Limit: 300 requests per IP per 5 minutes
  # General protection against API abuse
  throttle("req/ip", limit: 300, period: 5.minutes) do |req|
    req.ip unless req.path.start_with?("/assets")
  end

  ### Custom Response ###
  #
  # Customize the response when rate limit is exceeded
  self.throttled_responder = lambda do |env|
    match_data = env["rack.attack.match_data"] || {}
    retry_after = match_data[:period] || 60
    [
      429, # HTTP 429 Too Many Requests
      {
        "Content-Type" => "application/json",
        "Retry-After" => retry_after.to_s
      },
      [ {
        error: "Rate limit exceeded",
        message: "Too many requests. Please try again later.",
        retry_after: retry_after
      }.to_json ]
    ]
  end

  ### Blocklist & Safelist ###

  # Safelist all requests in test environment
  safelist("allow-test-env") do |req|
    Rails.env.test?
  end

  # Safelist localhost in development
  safelist("allow-localhost") do |req|
    Rails.env.development? && [ "127.0.0.1", "::1" ].include?(req.ip)
  end

  # Example: Block specific IPs (uncomment and add IPs as needed)
  # blocklist('block-bad-actors') do |req|
  #   # Block requests from known malicious IPs
  #   ['192.168.1.1', '10.0.0.1'].include?(req.ip)
  # end

  ### Helper Methods ###

  # Extract user ID from JWT token in Authorization header
  #
  # @param req [Rack::Request] The request object
  # @return [Integer, nil] The user ID or nil if not found
  def self.extract_user_id_from_token(req)
    auth_header = req.get_header("HTTP_AUTHORIZATION")
    return nil unless auth_header

    token = auth_header.split(" ").last
    return nil unless token

    begin
      # Decode JWT token (matches JsonWebToken service)
      secret_key = ENV.fetch("JWT_SECRET_KEY", Rails.application.credentials.secret_key_base)
      decoded = JWT.decode(token, secret_key, true, algorithm: "HS256")
      decoded[0]["user_id"]
    rescue JWT::DecodeError, JWT::ExpiredSignature
      nil
    end
  end

  ### ActiveSupport Notifications ###
  #
  # Log throttled requests for monitoring
  ActiveSupport::Notifications.subscribe("rack.attack") do |name, start, finish, request_id, payload|
    req = payload[:request]

    if [ :throttle, :blocklist ].include?(req.env["rack.attack.match_type"])
      Rails.logger.warn({
        message: "Rate limit exceeded",
        discriminator: req.env["rack.attack.matched"],
        ip: req.ip,
        path: req.path,
        user_agent: req.user_agent,
        timestamp: Time.now.iso8601
      }.to_json)
    end
  end
end
