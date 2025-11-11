class BrevoDelivery
  def initialize(values)
    @settings = values
  end

  def deliver!(mail)
    api_instance = SibApiV3Sdk::TransactionalEmailsApi.new

    send_smtp_email = SibApiV3Sdk::SendSmtpEmail.new(
      sender: {
        name: mail[:from].display_names.first || "SyncSpace",
        email: mail.from.first
      },
      to: mail.to.map { |email| { email: email } },
      subject: mail.subject,
      htmlContent: mail.html_part&.body&.decoded || mail.body.decoded
    )

    # Add text content if available
    if mail.text_part
      send_smtp_email.text_content = mail.text_part.body.decoded
    end

    Rails.logger.info "Attempting to send email via Brevo:"
    Rails.logger.info "  From: #{mail.from.first}"
    Rails.logger.info "  To: #{mail.to.join(', ')}"
    Rails.logger.info "  Subject: #{mail.subject}"
    Rails.logger.info "  API Key present: #{ENV['BREVO_API_KEY'].present?}"

    begin
      result = api_instance.send_transac_email(send_smtp_email)
      Rails.logger.info "Brevo email sent successfully: #{result.message_id}"
      result
    rescue SibApiV3Sdk::ApiError => e
      Rails.logger.error "Brevo API Error Details:"
      Rails.logger.error "  Status Code: #{e.code}"
      Rails.logger.error "  Message: #{e.message}"
      Rails.logger.error "  Response Body: #{e.response_body}"
      raise e
    rescue => e
      Rails.logger.error "Unexpected error sending email: #{e.class} - #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      raise e
    end
  end
end
