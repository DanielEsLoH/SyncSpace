require 'rails_helper'

RSpec.describe UserMailer, type: :mailer do
  describe '#confirmation_email' do
    let(:user) { create(:user, name: 'John Doe', email: 'john@example.com', confirmation_token: 'test-token-123') }
    let(:mail) { described_class.confirmation_email(user) }

    describe 'headers' do
      it 'has the correct subject' do
        expect(mail.subject).to eq('Welcome to SyncSpace! Please confirm your email')
      end

      it 'sends to the user email address' do
        expect(mail.to).to eq([user.email])
      end

      it 'sends from the configured sender email' do
        expected_from = ENV.fetch('BREVO_FROM_EMAIL', 'no-reply@syncspace.com')
        expect(mail.from).to eq([expected_from])
      end

      it 'has the correct content type' do
        expect(mail.content_type).to match(/multipart\/alternative/)
      end
    end

    describe 'body content' do
      let(:html_body) { mail.html_part.body.to_s }
      let(:text_body) { mail.text_part.body.to_s }

      context 'HTML part' do
        it 'includes user name in greeting' do
          expect(html_body).to include("Hi #{user.name}")
        end

        it 'includes welcome message' do
          expect(html_body).to include('Welcome to SyncSpace!')
          expect(html_body).to include('Thank you for registering with SyncSpace')
        end

        it 'includes confirmation URL with token' do
          expected_url = "#{ENV.fetch('CLIENT_URL', 'http://localhost:3000')}/confirm-email/#{user.confirmation_token}"
          expect(html_body).to include(expected_url)
        end

        it 'includes clickable confirmation button' do
          expect(html_body).to include('Confirm My Email')
          expect(html_body).to include('class="button"')
        end

        it 'includes instructions to confirm email' do
          expect(html_body).to include('please confirm your email address')
        end

        it 'includes alternative link text' do
          expect(html_body).to include('Or copy and paste this link into your browser')
        end

        it 'includes security notice for unintended recipients' do
          expect(html_body).to include("If you didn't create an account with SyncSpace, please ignore this email")
        end

        it 'includes team signature' do
          expect(html_body).to include('Best regards')
          expect(html_body).to include('The SyncSpace Team')
        end

        it 'includes current year in footer' do
          expect(html_body).to include("© #{Time.current.year} SyncSpace")
        end

        it 'includes copyright notice' do
          expect(html_body).to include('All rights reserved')
        end

        it 'has proper HTML structure' do
          expect(html_body).to include('<!DOCTYPE html>')
          expect(html_body).to include('<html>')
          expect(html_body).to include('</html>')
        end

        it 'includes styling for professional appearance' do
          expect(html_body).to include('font-family')
          expect(html_body).to include('background-color')
        end

        it 'uses correct brand color for header' do
          expect(html_body).to include('#3B82F6')
        end
      end

      context 'text part' do
        it 'includes user name in greeting' do
          expect(text_body).to include("Hi #{user.name}")
        end

        it 'includes welcome message' do
          expect(text_body).to include('Welcome to SyncSpace!')
        end

        it 'includes confirmation URL' do
          expected_url = "#{ENV.fetch('CLIENT_URL', 'http://localhost:3000')}/confirm-email/#{user.confirmation_token}"
          expect(text_body).to include(expected_url)
        end

        it 'includes current year in footer' do
          expect(text_body).to include(Time.current.year.to_s)
        end
      end
    end

    describe 'URL generation' do
      it 'uses CLIENT_URL environment variable when available' do
        allow(ENV).to receive(:fetch).with('CLIENT_URL', anything).and_return('https://app.syncspace.com')
        mail = described_class.confirmation_email(user)

        expect(mail.html_part.body.to_s).to include('https://app.syncspace.com/confirm-email/')
      end

      it 'falls back to localhost when CLIENT_URL is not set' do
        allow(ENV).to receive(:fetch).with('CLIENT_URL', 'http://localhost:3000').and_return('http://localhost:3000')
        allow(ENV).to receive(:fetch).with('MAILERSEND_FROM_EMAIL', anything).and_call_original
        mail = described_class.confirmation_email(user)

        expect(mail.html_part.body.to_s).to include('http://localhost:3000/confirm-email/')
      end

      it 'includes the user confirmation token in URL' do
        expect(mail.html_part.body.to_s).to include("/confirm-email/#{user.confirmation_token}")
      end
    end

    describe 'dynamic content' do
      it 'updates year dynamically' do
        travel_to Time.zone.local(2024, 1, 1) do
          mail_2024 = described_class.confirmation_email(user)
          expect(mail_2024.html_part.body.to_s).to include('© 2024 SyncSpace')
        end

        travel_to Time.zone.local(2025, 1, 1) do
          mail_2025 = described_class.confirmation_email(user)
          expect(mail_2025.html_part.body.to_s).to include('© 2025 SyncSpace')
        end
      end

      it 'personalizes email with different user names' do
        user1 = create(:user, name: 'Alice Smith')
        user2 = create(:user, name: 'Bob Johnson')

        mail1 = described_class.confirmation_email(user1)
        mail2 = described_class.confirmation_email(user2)

        expect(mail1.html_part.body.to_s).to include('Hi Alice Smith')
        expect(mail2.html_part.body.to_s).to include('Hi Bob Johnson')
      end
    end
  end

  describe '#password_reset_email' do
    let(:user) { create(:user, name: 'Jane Doe', email: 'jane@example.com', reset_password_token: 'reset-token-456') }
    let(:mail) { described_class.password_reset_email(user) }

    describe 'headers' do
      it 'has the correct subject' do
        expect(mail.subject).to eq('SyncSpace - Reset Your Password')
      end

      it 'sends to the user email address' do
        expect(mail.to).to eq([user.email])
      end

      it 'sends from the configured sender email' do
        expected_from = ENV.fetch('BREVO_FROM_EMAIL', 'no-reply@syncspace.com')
        expect(mail.from).to eq([expected_from])
      end

      it 'has the correct content type' do
        expect(mail.content_type).to match(/multipart\/alternative/)
      end
    end

    describe 'body content' do
      let(:html_body) { mail.html_part.body.to_s }
      let(:text_body) { mail.text_part.body.to_s }

      context 'HTML part' do
        it 'includes user name in greeting' do
          expect(html_body).to include("Hi #{user.name}")
        end

        it 'includes password reset heading' do
          expect(html_body).to include('Reset Your Password')
        end

        it 'includes reset request confirmation message' do
          expect(html_body).to include('We received a request to reset your password')
        end

        it 'includes reset URL with token' do
          expected_url = "#{ENV.fetch('CLIENT_URL', 'http://localhost:3000')}/reset-password/#{user.reset_password_token}"
          expect(html_body).to include(expected_url)
        end

        it 'includes clickable reset button' do
          expect(html_body).to include('Reset My Password')
          expect(html_body).to include('class="button"')
        end

        it 'includes instructions to reset password' do
          expect(html_body).to include('Click the button below to reset your password')
        end

        it 'includes alternative link text' do
          expect(html_body).to include('Or copy and paste this link into your browser')
        end

        it 'includes expiration notice' do
          expect(html_body).to include('This password reset link will expire in 2 hours')
        end

        it 'includes security notice in warning box' do
          expect(html_body).to include('Security Notice:')
          expect(html_body).to include('class="warning"')
        end

        it 'includes message for unintended recipients' do
          expect(html_body).to include("If you didn't request a password reset, please ignore this email")
          expect(html_body).to include('your password will remain unchanged')
        end

        it 'includes support contact information' do
          expect(html_body).to include("If you're having trouble resetting your password, please contact our support team")
        end

        it 'includes team signature' do
          expect(html_body).to include('Best regards')
          expect(html_body).to include('The SyncSpace Team')
        end

        it 'includes current year in footer' do
          expect(html_body).to include("© #{Time.current.year} SyncSpace")
        end

        it 'includes copyright notice' do
          expect(html_body).to include('All rights reserved')
        end

        it 'has proper HTML structure' do
          expect(html_body).to include('<!DOCTYPE html>')
          expect(html_body).to include('<html>')
          expect(html_body).to include('</html>')
        end

        it 'includes styling for professional appearance' do
          expect(html_body).to include('font-family')
          expect(html_body).to include('background-color')
        end

        it 'uses correct brand color for header' do
          expect(html_body).to include('#EF4444')
        end

        it 'styles warning box with appropriate colors' do
          expect(html_body).to include('#FEF2F2')
          expect(html_body).to include('border-left: 4px solid #EF4444')
        end
      end

      context 'text part' do
        it 'includes user name in greeting' do
          expect(text_body).to include("Hi #{user.name}")
        end

        it 'includes password reset message' do
          expect(text_body).to include('Reset Your Password')
        end

        it 'includes reset URL' do
          expected_url = "#{ENV.fetch('CLIENT_URL', 'http://localhost:3000')}/reset-password/#{user.reset_password_token}"
          expect(text_body).to include(expected_url)
        end

        it 'includes expiration notice' do
          expect(text_body).to include('2 hours')
        end

        it 'includes current year in footer' do
          expect(text_body).to include(Time.current.year.to_s)
        end
      end
    end

    describe 'URL generation' do
      it 'uses CLIENT_URL environment variable when available' do
        allow(ENV).to receive(:fetch).with('CLIENT_URL', anything).and_return('https://app.syncspace.com')
        mail = described_class.password_reset_email(user)

        expect(mail.html_part.body.to_s).to include('https://app.syncspace.com/reset-password/')
      end

      it 'falls back to localhost when CLIENT_URL is not set' do
        allow(ENV).to receive(:fetch).with('CLIENT_URL', 'http://localhost:3000').and_return('http://localhost:3000')
        allow(ENV).to receive(:fetch).with('MAILERSEND_FROM_EMAIL', anything).and_call_original
        mail = described_class.password_reset_email(user)

        expect(mail.html_part.body.to_s).to include('http://localhost:3000/reset-password/')
      end

      it 'includes the user reset password token in URL' do
        expect(mail.html_part.body.to_s).to include("/reset-password/#{user.reset_password_token}")
      end
    end

    describe 'dynamic content' do
      it 'updates year dynamically' do
        travel_to Time.zone.local(2024, 1, 1) do
          mail_2024 = described_class.password_reset_email(user)
          expect(mail_2024.html_part.body.to_s).to include('© 2024 SyncSpace')
        end

        travel_to Time.zone.local(2025, 1, 1) do
          mail_2025 = described_class.password_reset_email(user)
          expect(mail_2025.html_part.body.to_s).to include('© 2025 SyncSpace')
        end
      end

      it 'personalizes email with different user names' do
        user1 = create(:user, name: 'Charlie Brown')
        user2 = create(:user, name: 'Diana Prince')

        mail1 = described_class.password_reset_email(user1)
        mail2 = described_class.password_reset_email(user2)

        expect(mail1.html_part.body.to_s).to include('Hi Charlie Brown')
        expect(mail2.html_part.body.to_s).to include('Hi Diana Prince')
      end
    end

    describe 'security features' do
      it 'includes expiration time frame' do
        expect(mail.html_part.body.to_s).to include('expire in 2 hours')
      end

      it 'reassures users about ignored requests' do
        expect(mail.html_part.body.to_s).to include('password will remain unchanged')
      end

      it 'visually highlights security notice with warning styling' do
        expect(mail.html_part.body.to_s).to include('class="warning"')
        expect(mail.html_part.body.to_s).to include('<strong>Security Notice:</strong>')
      end
    end
  end

  describe 'mailer configuration' do
    it 'has default from address configured' do
      expect(described_class.default[:from]).to eq(ENV.fetch('BREVO_FROM_EMAIL', 'no-reply@syncspace.com'))
    end
  end

  describe 'email deliverability' do
    let(:user) { create(:user) }

    it 'confirmation_email can be delivered' do
      expect { described_class.confirmation_email(user).deliver_now }.not_to raise_error
    end

    it 'password_reset_email can be delivered' do
      user.update(reset_password_token: 'test-token')
      expect { described_class.password_reset_email(user).deliver_now }.not_to raise_error
    end
  end
end
