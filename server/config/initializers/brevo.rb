# Brevo (Sendinblue) API Configuration
SibApiV3Sdk.configure do |config|
  config.api_key["api-key"] = ENV.fetch("BREVO_API_KEY", "")
  config.host = "api.brevo.com"
end

# Register Brevo delivery method
# Load the class first to ensure it's available
Rails.logger.info "Loading BrevoDelivery class..."
require_dependency Rails.root.join('lib', 'brevo_delivery').to_s

Rails.logger.info "Registering Brevo delivery method..."
ActionMailer::Base.add_delivery_method :brevo, BrevoDelivery

Rails.logger.info "Available delivery methods: #{ActionMailer::Base.delivery_methods.keys.inspect}"
