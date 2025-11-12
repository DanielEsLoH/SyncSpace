require 'rails_helper'

RSpec.describe BrevoDelivery do
  let(:delivery) { described_class.new({}) }
  let(:mail) do
    UserMailer.confirmation_email(create(:user))
  end

  describe '#deliver!' do
    let(:api_instance) { instance_double(SibApiV3Sdk::TransactionalEmailsApi) }
    let(:mock_result) { double('result', message_id: 'test-message-id-123') }

    before do
      allow(SibApiV3Sdk::TransactionalEmailsApi).to receive(:new).and_return(api_instance)
    end

    context 'when email is successfully sent' do
      before do
        allow(api_instance).to receive(:send_transac_email).and_return(mock_result)
      end

      it 'sends the email via Brevo API' do
        result = delivery.deliver!(mail)

        expect(api_instance).to have_received(:send_transac_email)
        expect(result).to eq(mock_result)
      end

      it 'logs success message' do
        allow(Rails.logger).to receive(:info)

        delivery.deliver!(mail)

        expect(Rails.logger).to have_received(:info).with(/Brevo email sent successfully/)
      end

      it 'includes sender information' do
        expect(api_instance).to receive(:send_transac_email) do |email|
          expect(email.sender[:email]).to eq(mail.from.first)
          mock_result
        end

        delivery.deliver!(mail)
      end

      it 'includes recipient information' do
        expect(api_instance).to receive(:send_transac_email) do |email|
          expect(email.to.first[:email]).to eq(mail.to.first)
          mock_result
        end

        delivery.deliver!(mail)
      end

      it 'includes subject' do
        expect(api_instance).to receive(:send_transac_email) do |email|
          expect(email.subject).to eq(mail.subject)
          mock_result
        end

        delivery.deliver!(mail)
      end

      it 'includes HTML content' do
        expect(api_instance).to receive(:send_transac_email) do |email|
          expect(email.html_content).to be_present
          mock_result
        end

        delivery.deliver!(mail)
      end

      it 'includes text content when available' do
        expect(api_instance).to receive(:send_transac_email) do |email|
          expect(email.text_content).to be_present
          mock_result
        end

        delivery.deliver!(mail)
      end
    end

    context 'when Brevo API returns an error' do
      let(:api_error) { SibApiV3Sdk::ApiError.new('API Error') }

      before do
        allow(api_instance).to receive(:send_transac_email).and_raise(api_error)
        allow(Rails.logger).to receive(:error)
      end

      it 'logs the error' do
        expect {
          delivery.deliver!(mail)
        }.to raise_error(SibApiV3Sdk::ApiError)

        expect(Rails.logger).to have_received(:error).with(/Brevo API Error Details/)
      end

      it 'raises the error' do
        expect {
          delivery.deliver!(mail)
        }.to raise_error(SibApiV3Sdk::ApiError)
      end
    end

    context 'when mail has no text part' do
      let(:html_only_mail) do
        Mail.new do
          from    'test@example.com'
          to      'recipient@example.com'
          subject 'Test Subject'
          body    '<h1>HTML Only</h1>'
        end
      end

      before do
        allow(api_instance).to receive(:send_transac_email).and_return(mock_result)
      end

      it 'sends without text content' do
        expect(api_instance).to receive(:send_transac_email) do |email|
          expect(email.html_content).to be_present
          mock_result
        end

        delivery.deliver!(html_only_mail)
      end
    end

    context 'when sender has no display name' do
      let(:no_name_mail) do
        mail = Mail.new do
          from    'test@example.com'
          to      'recipient@example.com'
          subject 'Test Subject'
          body    'Test body'
        end
        mail
      end

      before do
        allow(api_instance).to receive(:send_transac_email).and_return(mock_result)
      end

      it 'uses default sender name' do
        expect(api_instance).to receive(:send_transac_email) do |email|
          expect(email.sender[:name]).to eq('SyncSpace')
          mock_result
        end

        delivery.deliver!(no_name_mail)
      end
    end
  end
end
