# Brevo (Sendinblue) API Configuration
SibApiV3Sdk.configure do |config|
  config.api_key["api-key"] = ENV.fetch("BREVO_API_KEY", "")
  config.host = "api.brevo.com"
end

# Register Brevo delivery method
require_dependency Rails.root.join('lib', 'brevo_delivery').to_s
ActionMailer::Base.add_delivery_method :brevo, BrevoDelivery
