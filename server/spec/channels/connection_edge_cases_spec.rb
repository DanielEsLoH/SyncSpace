require 'rails_helper'

RSpec.describe ApplicationCable::Connection, type: :channel do
  let(:user) { create(:user) }
  let(:token) { JWT.encode({ user_id: user.id, exp: 24.hours.from_now.to_i }, ENV.fetch('JWT_SECRET_KEY'), 'HS256') }

  describe '#connect with various token formats' do
    context 'with token containing multiple protocols' do
      it 'extracts token from Sec-WebSocket-Protocol correctly' do
        connect "/cable", headers: { 'Sec-WebSocket-Protocol' => "graphql-ws, token-#{token}" }

        expect(connection.current_user).to eq(user)
      end
    end

    context 'with malformed Sec-WebSocket-Protocol header' do
      it 'allows connection with nil user when token extraction fails' do
        connect "/cable", headers: { 'Sec-WebSocket-Protocol' => "graphql-ws, invalid" }

        expect(connection.current_user).to be_nil
      end
    end

    context 'with both param and header token' do
      it 'prioritizes param token over header' do
        other_user = create(:user)
        other_token = JWT.encode({ user_id: other_user.id, exp: 24.hours.from_now.to_i }, ENV.fetch('JWT_SECRET_KEY'), 'HS256')

        connect "/cable?token=#{token}", headers: { 'Sec-WebSocket-Protocol' => "token-#{other_token}" }

        expect(connection.current_user).to eq(user)
      end
    end
  end
end
