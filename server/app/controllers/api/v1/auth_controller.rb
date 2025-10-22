module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate_request, only: [:register, :login, :confirm_email, :forgot_password, :reset_password]

      # POST /api/v1/auth/register
      def register
        user = User.new(register_params)

        if user.save
          UserMailer.confirmation_email(user).deliver_later
          render json: {
            message: 'Registration successful. Please check your email to confirm your account.',
            user: user_response(user)
          }, status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/auth/login
      def login
        user = User.find_by(email: params[:email]&.downcase)

        if user&.authenticate(params[:password])
          unless user.confirmed?
            return render json: { error: 'Please confirm your email address first' }, status: :unauthorized
          end

          token = JsonWebToken.encode(user_id: user.id)
          render json: {
            token: token,
            user: user_response(user)
          }, status: :ok
        else
          render json: { error: 'Invalid email or password' }, status: :unauthorized
        end
      end

      # GET /api/v1/auth/confirm/:token
      def confirm_email
        user = User.find_by(confirmation_token: params[:token])

        if user
          if user.confirmed?
            render json: { message: 'Email already confirmed' }, status: :ok
          elsif user.confirm!
            token = JsonWebToken.encode(user_id: user.id)
            render json: {
              message: 'Email confirmed successfully',
              token: token,
              user: user_response(user)
            }, status: :ok
          else
            render json: { error: 'Failed to confirm email' }, status: :unprocessable_entity
          end
        else
          render json: { error: 'Invalid confirmation token' }, status: :not_found
        end
      end

      # POST /api/v1/auth/forgot_password
      def forgot_password
        user = User.find_by(email: params[:email]&.downcase)

        if user
          user.generate_reset_password_token
          UserMailer.password_reset_email(user).deliver_later
          render json: { message: 'Password reset instructions sent to your email' }, status: :ok
        else
          # Don't reveal if email exists or not (security best practice)
          render json: { message: 'If that email exists, password reset instructions have been sent' }, status: :ok
        end
      end

      # POST /api/v1/auth/reset_password
      def reset_password
        user = User.find_by(reset_password_token: params[:token])

        if user && user.reset_password_token_valid?
          if user.update(password: params[:password], password_confirmation: params[:password_confirmation])
            user.update(reset_password_token: nil, reset_password_sent_at: nil)
            token = JsonWebToken.encode(user_id: user.id)
            render json: {
              message: 'Password reset successfully',
              token: token,
              user: user_response(user)
            }, status: :ok
          else
            render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
          end
        else
          render json: { error: 'Invalid or expired reset token' }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/auth/me
      def me
        render json: { user: user_response(current_user) }, status: :ok
      end

      private

      def register_params
        params.require(:user).permit(:name, :email, :password, :password_confirmation, :profile_picture, :bio)
      end

      def user_response(user)
        {
          id: user.id,
          name: user.name,
          email: user.email,
          profile_picture: user.profile_picture,
          bio: user.bio,
          confirmed: user.confirmed?,
          created_at: user.created_at
        }
      end
    end
  end
end
