# Brevo (Sendinblue) API Configuration
SibApiV3Sdk.configure do |config|
  config.api_key["api-key"] = ENV.fetch("BREVO_API_KEY", "")
  config.host = "api.brevo.com"
end

# Register Brevo delivery method
# Explicitly require the class to ensure it's loaded before registration
require Rails.root.join('lib', 'brevo_delivery')
ActionMailer::Base.add_delivery_method :brevo, BrevoDelivery
