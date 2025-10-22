module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    def find_verified_user
      # Extract token from connection params or headers
      token = request.params[:token] || extract_token_from_headers

      if token
        begin
          decoded_token = JWT.decode(
            token,
            ENV.fetch('JWT_SECRET_KEY'),
            true,
            { algorithm: 'HS256' }
          )
          user_id = decoded_token[0]['user_id']
          user = User.find_by(id: user_id)

          return user if user
        rescue JWT::DecodeError, JWT::ExpiredSignature
          reject_unauthorized_connection
        end
      end

      # Allow anonymous connections for public channels (like posts feed)
      nil
    end

    def extract_token_from_headers
      # Try to extract from sec-websocket-protocol header
      # This is commonly used for WebSocket authentication
      if request.headers['Sec-WebSocket-Protocol'].present?
        protocols = request.headers['Sec-WebSocket-Protocol'].split(',').map(&:strip)
        # Look for a protocol that starts with 'token-'
        token_protocol = protocols.find { |p| p.start_with?('token-') }
        return token_protocol.gsub('token-', '') if token_protocol
      end

      nil
    end
  end
end
