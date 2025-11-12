module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate_request, only: [ :register, :login, :confirm_email, :forgot_password, :reset_password, :refresh ]

      # POST /api/v1/auth/register
      def register
        user = User.new(register_params)

        if user.save
          begin
            # Use deliver_now to catch email errors immediately
            UserMailer.confirmation_email(user).deliver_now
            render json: {
              message: "Registration successful. Please check your email to confirm your account.",
              user: user_response(user)
            }, status: :created
          rescue => e
            Rails.logger.error "Failed to send confirmation email: #{e.message}"
            # User is created but email failed - still return success but with warning
            render json: {
              message: "Registration successful. However, there was an issue sending the confirmation email. Please contact support.",
              user: user_response(user),
              email_error: true
            }, status: :created
          end
        else
          Rails.logger.info "Registration failed: #{user.errors.full_messages.join(', ')}"
          render json: { errors: user.errors.full_messages }, status: :unprocessable_content
        end
      end

      # POST /api/v1/auth/login
      def login
        user = User.find_by(email: params[:email]&.downcase)

        if user&.authenticate(params[:password])
          unless user.confirmed?
            return render json: { error: "Please confirm your email address first" }, status: :unauthorized
          end

          # Generate both access and refresh tokens
          access_token = JsonWebToken.encode(user_id: user.id)
          refresh_token = user.generate_refresh_token!

          render json: {
            token: access_token,
            refresh_token: refresh_token,
            user: user_response(user)
          }, status: :ok
        else
          render json: { error: "Invalid email or password" }, status: :unauthorized
        end
      end

      # GET /api/v1/auth/confirm/:token
      def confirm_email
        user = User.find_by(confirmation_token: params[:token])

        if user
          if user.confirmed?
            render json: { message: "Email already confirmed" }, status: :ok
          elsif user.confirm!
            # Generate both access and refresh tokens
            access_token = JsonWebToken.encode(user_id: user.id)
            refresh_token = user.generate_refresh_token!

            render json: {
              message: "Email confirmed successfully",
              token: access_token,
              refresh_token: refresh_token,
              user: user_response(user)
            }, status: :ok
          else
            render json: { error: "Failed to confirm email" }, status: :unprocessable_content
          end
        else
          render json: { error: "Invalid confirmation token" }, status: :not_found
        end
      end

      # POST /api/v1/auth/forgot_password
      def forgot_password
        user = User.find_by(email: params[:email]&.downcase)

        if user
          user.generate_reset_password_token
          begin
            UserMailer.password_reset_email(user).deliver_now
            render json: { message: "Password reset instructions sent to your email" }, status: :ok
          rescue => e
            Rails.logger.error "Failed to send password reset email: #{e.class} - #{e.message}"
            Rails.logger.error e.backtrace.join("\n")
            render json: { error: "Failed to send email. Please try again later." }, status: :internal_server_error
          end
        else
          render json: { error: "No account found with that email address" }, status: :not_found
        end
      end

      # POST /api/v1/auth/reset_password
      def reset_password
        user = User.find_by(reset_password_token: params[:token])

        if user&.reset_password_token_valid?
          if user.update(password: params[:password], password_confirmation: params[:password_confirmation])
            user.update(reset_password_token: nil, reset_password_sent_at: nil)

            # Generate both access and refresh tokens
            access_token = JsonWebToken.encode(user_id: user.id)
            refresh_token = user.generate_refresh_token!

            render json: {
              message: "Password reset successfully",
              token: access_token,
              refresh_token: refresh_token,
              user: user_response(user)
            }, status: :ok
          else
            render json: { errors: user.errors.full_messages }, status: :unprocessable_content
          end
        else
          render json: { error: "Invalid or expired reset token" }, status: :unprocessable_content
        end
      end

      # GET /api/v1/auth/me
      def me
        render json: { user: user_response(current_user) }, status: :ok
      end

      # POST /api/v1/auth/refresh
      #
      # Exchange a valid refresh token for new access and refresh tokens.
      # This implements rotating refresh tokens for enhanced security.
      #
      # Request body:
      #   { "refresh_token": "eyJhbGciOiJIUzI1..." }
      #
      # Response:
      #   { "token": "new_access_token", "refresh_token": "new_refresh_token" }
      def refresh
        refresh_token = params[:refresh_token]

        unless refresh_token.present?
          return render json: { error: "Refresh token is required" }, status: :bad_request
        end

        # Decode and validate the refresh token
        decoded = JsonWebToken.decode_refresh_token(refresh_token)

        unless decoded
          return render json: { error: "Invalid refresh token" }, status: :unauthorized
        end

        # Find the user and verify the stored refresh token matches
        user = User.find_by(id: decoded[:user_id])

        unless user && user.refresh_token == refresh_token && user.refresh_token_valid?
          return render json: { error: "Refresh token expired or invalid" }, status: :unauthorized
        end

        # Generate new tokens (rotating refresh token)
        new_access_token = JsonWebToken.encode(user_id: user.id)
        new_refresh_token = user.generate_refresh_token!

        render json: {
          token: new_access_token,
          refresh_token: new_refresh_token,
          message: "Tokens refreshed successfully"
        }, status: :ok
      rescue => e
        Rails.logger.error("Refresh token error: #{e.message}")
        render json: { error: "Failed to refresh token" }, status: :internal_server_error
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
          profile_picture: user.avatar_url,
          avatar_url: user.avatar_url,
          bio: user.bio,
          confirmed: user.confirmed?,
          created_at: user.created_at
        }
      end
    end
  end
end
