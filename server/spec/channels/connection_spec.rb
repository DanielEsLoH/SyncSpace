require 'rails_helper'

RSpec.describe ApplicationCable::Connection, type: :channel do
  let(:user) { create(:user) }
  let(:token) { JWT.encode({ user_id: user.id, exp: 24.hours.from_now.to_i }, ENV.fetch('JWT_SECRET_KEY'), 'HS256') }

  describe '#connect' do
    context 'with valid token in params' do
      it 'successfully connects and identifies user' do
        connect "/cable?token=#{token}"

        expect(connection.current_user).to eq(user)
      end
    end

    context 'with valid token in Sec-WebSocket-Protocol header' do
      it 'successfully connects and identifies user' do
        connect "/cable", headers: { 'Sec-WebSocket-Protocol' => "token-#{token}" }

        expect(connection.current_user).to eq(user)
      end
    end

    context 'with invalid token' do
      it 'rejects the connection' do
        expect {
          connect "/cable?token=invalid_token"
        }.to have_rejected_connection
      end
    end

    context 'with expired token' do
      let(:expired_token) { JWT.encode({ user_id: user.id, exp: 1.hour.ago.to_i }, ENV.fetch('JWT_SECRET_KEY'), 'HS256') }

      it 'rejects the connection' do
        expect {
          connect "/cable?token=#{expired_token}"
        }.to have_rejected_connection
      end
    end

    context 'without token' do
      it 'allows connection with nil user (for public channels)' do
        connect "/cable"

        expect(connection.current_user).to be_nil
      end
    end

    context 'with non-existent user' do
      let(:invalid_user_token) { JWT.encode({ user_id: 99999, exp: 24.hours.from_now.to_i }, ENV.fetch('JWT_SECRET_KEY'), 'HS256') }

      it 'allows connection with nil user' do
        connect "/cable?token=#{invalid_user_token}"

        expect(connection.current_user).to be_nil
      end
    end
  end
end
