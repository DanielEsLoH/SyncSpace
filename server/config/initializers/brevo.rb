# Brevo (Sendinblue) API Configuration
SibApiV3Sdk.configure do |config|
  config.api_key["api-key"] = ENV.fetch("BREVO_API_KEY", "")
  config.host = "api.brevo.com"
end
