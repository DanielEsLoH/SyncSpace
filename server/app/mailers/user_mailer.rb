class UserMailer < ApplicationMailer
  default from: ENV.fetch('BREVO_FROM_EMAIL', 'no-reply@syncspace.com')

  def confirmation_email(user)
    @user = user
    @confirmation_url = "#{ENV.fetch('CLIENT_URL', 'http://localhost:3000')}/confirm-email/#{user.confirmation_token}"

    mail(
      to: user.email,
      subject: 'Welcome to SyncSpace! Please confirm your email'
    )
  end

  def password_reset_email(user)
    @user = user
    @reset_url = "#{ENV.fetch('CLIENT_URL', 'http://localhost:3000')}/reset-password/#{user.reset_password_token}"

    mail(
      to: user.email,
      subject: 'SyncSpace - Reset Your Password'
    )
  end
end
