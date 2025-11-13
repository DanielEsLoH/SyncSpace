class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch("BREVO_FROM_EMAIL")
  layout "mailer"
end
