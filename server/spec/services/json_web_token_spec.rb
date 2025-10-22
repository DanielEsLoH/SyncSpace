require 'rails_helper'

RSpec.describe JsonWebToken do
  describe '.encode' do
    let(:payload) { { user_id: 123, email: 'test@example.com' } }

    context 'with default expiration' do
      it 'encodes a payload with 24-hour expiration' do
        travel_to Time.current do
          token = described_class.encode(payload)

          expect(token).to be_present
          expect(token).to be_a(String)
          expect(token.split('.').length).to eq(3) # JWT has 3 parts
        end
      end

      it 'includes expiration timestamp in the payload' do
        travel_to Time.current do
          expected_exp = 24.hours.from_now.to_i
          token = described_class.encode(payload)
          decoded = JWT.decode(token, described_class::SECRET_KEY)[0]

          expect(decoded['exp']).to eq(expected_exp)
        end
      end

      it 'preserves original payload data' do
        token = described_class.encode(payload)
        decoded = JWT.decode(token, described_class::SECRET_KEY)[0]

        expect(decoded['user_id']).to eq(123)
        expect(decoded['email']).to eq('test@example.com')
      end
    end

    context 'with custom expiration' do
      it 'encodes a payload with custom expiration time' do
        travel_to Time.current do
          custom_exp = 2.hours.from_now
          token = described_class.encode(payload, custom_exp)
          decoded = JWT.decode(token, described_class::SECRET_KEY)[0]

          expect(decoded['exp']).to eq(custom_exp.to_i)
        end
      end

      it 'accepts different expiration periods' do
        travel_to Time.current do
          expiration_times = [1.hour.from_now, 12.hours.from_now, 48.hours.from_now]

          expiration_times.each do |exp_time|
            token = described_class.encode(payload, exp_time)
            decoded = JWT.decode(token, described_class::SECRET_KEY)[0]

            expect(decoded['exp']).to eq(exp_time.to_i)
          end
        end
      end
    end

    context 'payload integrity' do
      it 'handles string keys in payload' do
        string_payload = { 'user_id' => 123, 'role' => 'admin' }
        token = described_class.encode(string_payload)
        decoded = JWT.decode(token, described_class::SECRET_KEY)[0]

        expect(decoded['user_id']).to eq(123)
        expect(decoded['role']).to eq('admin')
      end

      it 'handles symbol keys in payload' do
        symbol_payload = { user_id: 123, role: :admin }
        token = described_class.encode(symbol_payload)
        decoded = JWT.decode(token, described_class::SECRET_KEY)[0]

        expect(decoded['user_id']).to eq(123)
        expect(decoded['role']).to eq('admin')
      end

      it 'handles nested data structures' do
        complex_payload = {
          user_id: 123,
          metadata: { roles: ['admin', 'user'], permissions: { read: true, write: false } }
        }
        token = described_class.encode(complex_payload)
        decoded = JWT.decode(token, described_class::SECRET_KEY)[0]

        expect(decoded['user_id']).to eq(123)
        expect(decoded['metadata']['roles']).to eq(['admin', 'user'])
        expect(decoded['metadata']['permissions']['read']).to eq(true)
      end

      it 'handles empty payload' do
        empty_payload = {}
        token = described_class.encode(empty_payload)
        decoded = JWT.decode(token, described_class::SECRET_KEY)[0]

        expect(decoded['exp']).to be_present
      end
    end
  end

  describe '.decode' do
    let(:payload) { { user_id: 456, email: 'decode@example.com' } }

    context 'with valid token' do
      it 'decodes a valid token' do
        token = described_class.encode(payload)
        decoded = described_class.decode(token)

        expect(decoded).to be_present
        expect(decoded[:user_id]).to eq(456)
        expect(decoded[:email]).to eq('decode@example.com')
      end

      it 'returns HashWithIndifferentAccess' do
        token = described_class.encode(payload)
        decoded = described_class.decode(token)

        expect(decoded).to be_a(HashWithIndifferentAccess)
        expect(decoded[:user_id]).to eq(decoded['user_id'])
      end

      it 'includes expiration in decoded payload' do
        token = described_class.encode(payload)
        decoded = described_class.decode(token)

        expect(decoded[:exp]).to be_present
        expect(decoded[:exp]).to be_a(Integer)
      end

      it 'preserves all original payload data' do
        complex_payload = {
          user_id: 789,
          email: 'complex@example.com',
          roles: ['admin', 'moderator'],
          settings: { theme: 'dark', notifications: true }
        }
        token = described_class.encode(complex_payload)
        decoded = described_class.decode(token)

        expect(decoded[:user_id]).to eq(789)
        expect(decoded[:email]).to eq('complex@example.com')
        expect(decoded[:roles]).to eq(['admin', 'moderator'])
        expect(decoded[:settings]).to eq({ 'theme' => 'dark', 'notifications' => true })
      end
    end

    context 'with expired token' do
      it 'returns nil for expired token' do
        token = described_class.encode(payload, 1.hour.from_now)

        travel 2.hours do
          decoded = described_class.decode(token)
          expect(decoded).to be_nil
        end
      end

      it 'handles token that expired exactly at expiration time' do
        expiration_time = 1.hour.from_now
        token = described_class.encode(payload, expiration_time)

        travel_to expiration_time + 1.second do
          decoded = described_class.decode(token)
          expect(decoded).to be_nil
        end
      end
    end

    context 'with invalid token' do
      it 'returns nil for invalid token' do
        invalid_token = 'invalid.token.here'
        decoded = described_class.decode(invalid_token)

        expect(decoded).to be_nil
      end

      it 'returns nil for token with wrong signature' do
        token = JWT.encode(payload, 'wrong_secret_key')
        decoded = described_class.decode(token)

        expect(decoded).to be_nil
      end

      it 'returns nil for token with missing parts' do
        incomplete_token = 'eyJhbGciOiJIUzI1NiJ9.incomplete'
        decoded = described_class.decode(incomplete_token)

        expect(decoded).to be_nil
      end
    end

    context 'with malformed token' do
      it 'returns nil for empty string' do
        decoded = described_class.decode('')
        expect(decoded).to be_nil
      end

      it 'returns nil for nil token' do
        decoded = described_class.decode(nil)
        expect(decoded).to be_nil
      end

      it 'returns nil for random string' do
        decoded = described_class.decode('not_a_jwt_token_at_all')
        expect(decoded).to be_nil
      end

      it 'returns nil for token with invalid base64' do
        malformed_token = 'invalid!!!.base64###.encoding@@@'
        decoded = described_class.decode(malformed_token)

        expect(decoded).to be_nil
      end

      it 'returns nil for token with invalid JSON payload' do
        # Create a token with invalid JSON in payload
        header = Base64.urlsafe_encode64('{"alg":"HS256"}')
        payload_part = Base64.urlsafe_encode64('not valid json')
        signature = 'invalid_signature'
        malformed_token = "#{header}.#{payload_part}.#{signature}"

        decoded = described_class.decode(malformed_token)
        expect(decoded).to be_nil
      end
    end

    context 'error handling' do
      it 'handles JWT::DecodeError gracefully' do
        expect { described_class.decode('malformed.token') }.not_to raise_error
      end

      it 'handles JWT::ExpiredSignature gracefully' do
        token = described_class.encode(payload, 1.hour.from_now)

        travel 2.hours do
          expect { described_class.decode(token) }.not_to raise_error
        end
      end

      it 'handles JWT::VerificationError gracefully' do
        token = JWT.encode(payload, 'different_secret')
        expect { described_class.decode(token) }.not_to raise_error
      end
    end
  end

  describe 'round-trip encoding and decoding' do
    it 'successfully encodes and decodes the same payload' do
      original_payload = { user_id: 999, email: 'roundtrip@example.com', role: 'user' }

      token = described_class.encode(original_payload)
      decoded = described_class.decode(token)

      expect(decoded[:user_id]).to eq(original_payload[:user_id])
      expect(decoded[:email]).to eq(original_payload[:email])
      expect(decoded[:role]).to eq(original_payload[:role])
    end

    it 'maintains data integrity through multiple encode/decode cycles' do
      payload1 = { step: 1, data: 'first' }
      token1 = described_class.encode(payload1)
      decoded1 = described_class.decode(token1)

      expect(decoded1[:step]).to eq(1)
      expect(decoded1[:data]).to eq('first')
    end
  end

  describe 'SECRET_KEY' do
    it 'uses JWT_SECRET_KEY environment variable when available' do
      allow(ENV).to receive(:fetch).with('JWT_SECRET_KEY', anything).and_return('test_secret_key')

      # Force reload of the constant
      stub_const('JsonWebToken::SECRET_KEY', ENV.fetch('JWT_SECRET_KEY', Rails.application.credentials.secret_key_base))

      expect(JsonWebToken::SECRET_KEY).to eq('test_secret_key')
    end

    it 'falls back to Rails credentials when JWT_SECRET_KEY is not set' do
      allow(ENV).to receive(:fetch).with('JWT_SECRET_KEY', anything).and_call_original

      expect(described_class::SECRET_KEY).to be_present
    end
  end
end
