class JsonWebToken
  SECRET_KEY = ENV.fetch("JWT_SECRET_KEY", Rails.application.credentials.secret_key_base)

  # Encode an access token (short-lived, 24 hours)
  #
  # @param payload [Hash] The data to encode in the token
  # @param exp [Time] Expiration time (default: 24 hours from now)
  # @return [String] The encoded JWT token
  def self.encode(payload, exp = 24.hours.from_now)
    payload[:exp] = exp.to_i
    payload[:type] = "access" # Mark as access token
    JWT.encode(payload, SECRET_KEY)
  end

  # Encode a refresh token (long-lived, 7 days)
  #
  # Refresh tokens are used to obtain new access tokens without requiring
  # the user to log in again. They have a longer expiry but are only valid
  # for the refresh endpoint.
  #
  # @param user_id [Integer] The ID of the user
  # @return [String] The encoded refresh token
  def self.encode_refresh_token(user_id)
    exp = 7.days.from_now
    payload = {
      user_id: user_id,
      type: "refresh",
      exp: exp.to_i,
      jti: SecureRandom.uuid # JWT ID for additional security
    }
    JWT.encode(payload, SECRET_KEY)
  end

  # Decode any JWT token (access or refresh)
  #
  # @param token [String] The JWT token to decode
  # @return [HashWithIndifferentAccess, nil] The decoded payload or nil if invalid
  def self.decode(token)
    decoded = JWT.decode(token, SECRET_KEY)[0]
    HashWithIndifferentAccess.new decoded
  rescue JWT::DecodeError => e
    nil
  end

  # Decode and validate a refresh token
  #
  # @param token [String] The refresh token
  # @return [HashWithIndifferentAccess, nil] The decoded payload if valid, nil otherwise
  def self.decode_refresh_token(token)
    decoded = decode(token)
    # Verify it's actually a refresh token
    decoded if decoded && decoded[:type] == "refresh"
  rescue
    nil
  end
end
