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

    begin
      result = api_instance.send_transac_email(send_smtp_email)
      Rails.logger.info "Brevo email sent successfully: #{result.message_id}"
      result
    rescue SibApiV3Sdk::ApiError => e
      Rails.logger.error "Error sending email via Brevo API: #{e.message}"
      raise e
    end
  end
end
