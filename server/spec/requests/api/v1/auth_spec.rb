require 'rails_helper'

RSpec.describe 'Api::V1::Auth', type: :request do
  let(:user_params) do
    {
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        password_confirmation: 'password123',
        bio: 'Test bio'
      }
    }
  end

  describe 'POST /api/v1/auth/register' do
    context 'with valid parameters' do
      it 'creates a new user and returns 201' do
        expect {
          post '/api/v1/auth/register', params: user_params
        }.to change(User, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(json_response[:message]).to eq('Registration successful. Please check your email to confirm your account.')
        expect(json_response[:user]).to include(
          name: 'John Doe',
          email: 'john@example.com',
          bio: 'Test bio',
          confirmed: false
        )
        expect(json_response[:user][:id]).to be_present
        expect(json_response[:user][:created_at]).to be_present
      end

      it 'sends a confirmation email' do
        expect {
          post '/api/v1/auth/register', params: user_params
        }.to have_enqueued_job(ActionMailer::MailDeliveryJob)

        # Verify the job was enqueued with correct mailer
        expect(ActionMailer::MailDeliveryJob).to have_been_enqueued.with(
          'UserMailer',
          'confirmation_email',
          'deliver_now',
          hash_including(args: [ an_instance_of(User) ])
        )
      end

      it 'creates an unconfirmed user' do
        post '/api/v1/auth/register', params: user_params
        user = User.last
        expect(user.confirmed?).to be false
        expect(user.confirmation_token).to be_present
      end
    end

    context 'with invalid parameters' do
      it 'returns 422 when email is missing' do
        user_params[:user][:email] = nil
        post '/api/v1/auth/register', params: user_params

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response[:errors]).to include(a_string_matching(/Email/))
      end

      it 'returns 422 when password is too short' do
        user_params[:user][:password] = '12345'
        user_params[:user][:password_confirmation] = '12345'
        post '/api/v1/auth/register', params: user_params

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response[:errors]).to include(a_string_matching(/Password.*too short/))
      end

      it 'returns 422 when passwords do not match' do
        user_params[:user][:password_confirmation] = 'different'
        post '/api/v1/auth/register', params: user_params

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response[:errors]).to include(a_string_matching(/Password confirmation/))
      end

      it 'returns 422 when email already exists' do
        create_confirmed_user(email: 'john@example.com')
        post '/api/v1/auth/register', params: user_params

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response[:errors]).to include(a_string_matching(/Email.*taken/))
      end

      it 'returns 422 when name is too short' do
        user_params[:user][:name] = 'J'
        post '/api/v1/auth/register', params: user_params

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response[:errors]).to include(a_string_matching(/Name.*too short/))
      end

      it 'returns 422 when email format is invalid' do
        user_params[:user][:email] = 'invalid-email'
        post '/api/v1/auth/register', params: user_params

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response[:errors]).to include(a_string_matching(/Email.*invalid/))
      end
    end
  end

  describe 'POST /api/v1/auth/login' do
    let!(:confirmed_user) { create_confirmed_user(email: 'test@example.com', password: 'password123') }
    let!(:unconfirmed_user) { create_unconfirmed_user(email: 'unconfirmed@example.com', password: 'password123') }

    context 'with valid credentials' do
      it 'returns JWT token and user data' do
        post '/api/v1/auth/login', params: { email: 'test@example.com', password: 'password123' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:token]).to be_present
        expect(json_response[:user]).to include(
          id: confirmed_user.id,
          name: confirmed_user.name,
          email: confirmed_user.email,
          confirmed: true
        )
      end

      it 'returns valid JWT token that can be decoded' do
        post '/api/v1/auth/login', params: { email: 'test@example.com', password: 'password123' }

        token = json_response[:token]
        decoded = JsonWebToken.decode(token)
        expect(decoded[:user_id]).to eq(confirmed_user.id)
      end

      it 'is case insensitive for email' do
        post '/api/v1/auth/login', params: { email: 'TEST@EXAMPLE.COM', password: 'password123' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:token]).to be_present
      end
    end

    context 'with invalid credentials' do
      it 'returns 401 with wrong password' do
        post '/api/v1/auth/login', params: { email: 'test@example.com', password: 'wrongpassword' }

        expect(response).to have_http_status(:unauthorized)
        expect(json_response[:error]).to eq('Invalid email or password')
        expect(json_response[:token]).to be_nil
      end

      it 'returns 401 with non-existent email' do
        post '/api/v1/auth/login', params: { email: 'nonexistent@example.com', password: 'password123' }

        expect(response).to have_http_status(:unauthorized)
        expect(json_response[:error]).to eq('Invalid email or password')
      end

      it 'returns 401 for unconfirmed user' do
        post '/api/v1/auth/login', params: { email: 'unconfirmed@example.com', password: 'password123' }

        expect(response).to have_http_status(:unauthorized)
        expect(json_response[:error]).to eq('Please confirm your email address first')
        expect(json_response[:token]).to be_nil
      end
    end

    context 'edge cases' do
      it 'handles missing email parameter' do
        post '/api/v1/auth/login', params: { password: 'password123' }

        expect(response).to have_http_status(:unauthorized)
        expect(json_response[:error]).to eq('Invalid email or password')
      end

      it 'handles missing password parameter' do
        post '/api/v1/auth/login', params: { email: 'test@example.com' }

        expect(response).to have_http_status(:unauthorized)
        expect(json_response[:error]).to eq('Invalid email or password')
      end
    end
  end

  describe 'GET /api/v1/auth/confirm/:token' do
    let!(:unconfirmed_user) { create_unconfirmed_user }

    context 'with valid token' do
      it 'confirms the user and returns JWT token' do
        token = unconfirmed_user.confirmation_token
        get "/api/v1/auth/confirm/#{token}"

        expect(response).to have_http_status(:ok)
        expect(json_response[:message]).to eq('Email confirmed successfully')
        expect(json_response[:token]).to be_present
        expect(json_response[:user][:confirmed]).to be true

        unconfirmed_user.reload
        expect(unconfirmed_user.confirmed?).to be true
        expect(unconfirmed_user.confirmation_token).to be_nil
      end

      it 'returns valid JWT token after confirmation' do
        token = unconfirmed_user.confirmation_token
        get "/api/v1/auth/confirm/#{token}"

        jwt_token = json_response[:token]
        decoded = JsonWebToken.decode(jwt_token)
        expect(decoded[:user_id]).to eq(unconfirmed_user.id)
      end
    end

    context 'with already confirmed user' do
      it 'returns 200 with appropriate message' do
        confirmed_user = create_confirmed_user
        token = SecureRandom.urlsafe_base64
        confirmed_user.update(confirmation_token: token)

        get "/api/v1/auth/confirm/#{token}"

        expect(response).to have_http_status(:ok)
        expect(json_response[:message]).to eq('Email already confirmed')
      end
    end

    context 'with invalid token' do
      it 'returns 404 for non-existent token' do
        get '/api/v1/auth/confirm/invalid-token-12345'

        expect(response).to have_http_status(:not_found)
        expect(json_response[:error]).to eq('Invalid confirmation token')
      end
    end
  end

  describe 'POST /api/v1/auth/forgot_password' do
    let!(:user) { create_confirmed_user(email: 'test@example.com') }

    context 'with existing email' do
      it 'generates reset token and sends email' do
        expect {
          post '/api/v1/auth/forgot_password', params: { email: 'test@example.com' }
        }.to have_enqueued_job(ActionMailer::MailDeliveryJob)

        expect(response).to have_http_status(:ok)
        expect(json_response[:message]).to include('Password reset instructions')

        user.reload
        expect(user.reset_password_token).to be_present
        expect(user.reset_password_sent_at).to be_present
      end

      it 'is case insensitive for email' do
        post '/api/v1/auth/forgot_password', params: { email: 'TEST@EXAMPLE.COM' }

        expect(response).to have_http_status(:ok)
        user.reload
        expect(user.reset_password_token).to be_present
      end
    end

    context 'with non-existent email' do
      it 'returns not found error' do
        post '/api/v1/auth/forgot_password', params: { email: 'nonexistent@example.com' }

        expect(response).to have_http_status(:not_found)
        expect(json_response[:error]).to eq('No account found with that email address')
      end

      it 'does not send email for non-existent user' do
        expect {
          post '/api/v1/auth/forgot_password', params: { email: 'nonexistent@example.com' }
        }.not_to have_enqueued_job(ActionMailer::MailDeliveryJob)
      end
    end
  end

  describe 'POST /api/v1/auth/reset_password' do
    let!(:user) { create_confirmed_user }

    before do
      user.generate_reset_password_token
    end

    context 'with valid token and passwords' do
      it 'resets password and returns JWT token' do
        post '/api/v1/auth/reset_password', params: {
          token: user.reset_password_token,
          password: 'newpassword123',
          password_confirmation: 'newpassword123'
        }

        expect(response).to have_http_status(:ok)
        expect(json_response[:message]).to eq('Password reset successfully')
        expect(json_response[:token]).to be_present

        user.reload
        expect(user.authenticate('newpassword123')).to be_truthy
        expect(user.reset_password_token).to be_nil
        expect(user.reset_password_sent_at).to be_nil
      end

      it 'allows login with new password' do
        post '/api/v1/auth/reset_password', params: {
          token: user.reset_password_token,
          password: 'newpassword123',
          password_confirmation: 'newpassword123'
        }

        post '/api/v1/auth/login', params: { email: user.email, password: 'newpassword123' }
        expect(response).to have_http_status(:ok)
      end
    end

    context 'with invalid parameters' do
      it 'returns 422 when passwords do not match' do
        post '/api/v1/auth/reset_password', params: {
          token: user.reset_password_token,
          password: 'newpassword123',
          password_confirmation: 'different'
        }

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response[:errors]).to include(a_string_matching(/Password confirmation/))
      end

      it 'returns 422 when password is too short' do
        post '/api/v1/auth/reset_password', params: {
          token: user.reset_password_token,
          password: '12345',
          password_confirmation: '12345'
        }

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response[:errors]).to include(a_string_matching(/Password.*too short/))
      end

      it 'returns 422 with invalid token' do
        post '/api/v1/auth/reset_password', params: {
          token: 'invalid-token',
          password: 'newpassword123',
          password_confirmation: 'newpassword123'
        }

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response[:error]).to eq('Invalid or expired reset token')
      end

      it 'returns 422 with expired token' do
        user.update(reset_password_sent_at: 3.hours.ago)

        post '/api/v1/auth/reset_password', params: {
          token: user.reset_password_token,
          password: 'newpassword123',
          password_confirmation: 'newpassword123'
        }

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response[:error]).to eq('Invalid or expired reset token')
      end
    end
  end

  describe 'GET /api/v1/auth/me' do
    let!(:user) { create_confirmed_user }

    context 'with valid authentication' do
      it 'returns current user data' do
        get '/api/v1/auth/me', headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:user]).to include(
          id: user.id,
          name: user.name,
          email: user.email,
          confirmed: true
        )
      end
    end

    context 'without authentication' do
      it 'returns 401 unauthorized' do
        get '/api/v1/auth/me'

        expect(response).to have_http_status(:unauthorized)
        expect(json_response[:error]).to eq('Unauthorized')
      end
    end

    context 'with invalid token' do
      it 'returns 401 unauthorized' do
        get '/api/v1/auth/me', headers: { 'Authorization' => 'Bearer invalid-token' }

        expect(response).to have_http_status(:unauthorized)
        expect(json_response[:error]).to eq('Unauthorized')
      end
    end

    context 'with deleted user token' do
      it 'returns 401 when user no longer exists' do
        headers = auth_headers(user)
        user.destroy

        get '/api/v1/auth/me', headers: headers

        expect(response).to have_http_status(:unauthorized)
        expect(json_response[:error]).to eq('User not found')
      end
    end
  end

  describe 'POST /api/v1/auth/refresh' do
    let!(:user) { create_confirmed_user }

    context 'with a valid refresh token' do
      it 'issues a new access token and a new refresh token' do
        refresh_token = user.generate_refresh_token!
        post '/api/v1/auth/refresh', params: { refresh_token: refresh_token }

        expect(response).to have_http_status(:ok)
        expect(json_response[:token]).to be_present
        expect(json_response[:refresh_token]).to be_present
        expect(json_response[:token]).not_to eq(refresh_token)
        expect(json_response[:refresh_token]).not_to eq(refresh_token)
      end
    end

    context 'with a missing refresh token' do
      it 'returns a bad request error' do
        post '/api/v1/auth/refresh', params: { refresh_token: '' }

        expect(response).to have_http_status(:bad_request)
        expect(json_response[:error]).to eq('Refresh token is required')
      end
    end

    context 'with an invalid refresh token' do
      it 'returns an unauthorized error' do
        post '/api/v1/auth/refresh', params: { refresh_token: 'invalid_token' }

        expect(response).to have_http_status(:unauthorized)
        expect(json_response[:error]).to eq('Invalid refresh token')
      end
    end

    context 'with an expired refresh token' do
      it 'returns an unauthorized error' do
        refresh_token = user.generate_refresh_token!
        user.update!(refresh_token_expires_at: 1.hour.ago)
        post '/api/v1/auth/refresh', params: { refresh_token: refresh_token }

        expect(response).to have_http_status(:unauthorized)
        expect(json_response[:error]).to eq('Refresh token expired or invalid')
      end
    end
  end
end
