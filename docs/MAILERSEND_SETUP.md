# MailerSend Configuration - SyncSpace

## Overview

MailerSend is now fully configured and integrated with SyncSpace to send transactional emails for user authentication flows.

**Author**: Daniel E. Londoño
**Service**: MailerSend
**Status**: ✅ Configured and Ready

## Configuration Details

### SMTP Settings
- **Host**: smtp.mailersend.net
- **Port**: 587
- **Authentication**: Plain
- **TLS**: Enabled (STARTTLS)

### Email Templates

Two email templates have been created:

1. **Email Confirmation** (`confirmation_email`)
   - Subject: "Welcome to SyncSpace! Please confirm your email"
   - Purpose: Sent when a new user registers
   - Action: User clicks link to confirm their email address
   - Link format: `http://localhost:3000/confirm-email/:token`

2. **Password Reset** (`password_reset_email`)
   - Subject: "SyncSpace - Reset Your Password"
   - Purpose: Sent when user requests password reset
   - Action: User clicks link to reset their password
   - Link format: `http://localhost:3000/reset-password/:token`
   - Expiration: 2 hours

### Email Formats

Both templates include:
- **HTML version** - Styled with inline CSS for email clients
- **Plain text version** - Fallback for text-only email clients

### Features

✅ **Professional Design**
- Clean, branded layout
- SyncSpace branding with blue/red color scheme
- Responsive design for mobile devices
- Security warnings for password reset

✅ **Dynamic Content**
- User name personalization
- Clickable buttons
- Plain URL fallback
- Dynamic copyright year using `Time.current.year`

✅ **Security**
- Unique tokens for each action
- Expiration time for password reset (2 hours)
- Clear security notices
- No sensitive information in emails

## Email Triggers

### Registration Flow
```ruby
# When user registers
POST /api/v1/auth/register

# Email sent automatically
UserMailer.confirmation_email(user).deliver_later

# User clicks link in email
GET /api/v1/auth/confirm/:token
```

### Password Reset Flow
```ruby
# User requests password reset
POST /api/v1/auth/forgot_password

# Email sent automatically
UserMailer.password_reset_email(user).deliver_later

# User clicks link in email and enters new password
POST /api/v1/auth/reset_password
```

## Environment Variables

Required in `.env`:

```bash
MAILERSEND_API_TOKEN=mlsn.0c0a93b79d6edb1dac58683790d0e275afcf37c12f13f985196ec93b3a4c16b2
MAILERSEND_FROM_EMAIL=no-reply@syncspace.com
CLIENT_URL=http://localhost:3000
```

## Testing Emails

### 1. Test Registration Email

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "name": "Test User",
      "email": "your-email@example.com",
      "password": "password123",
      "password_confirmation": "password123"
    }
  }'
```

Check your email inbox for the confirmation email!

### 2. Test Password Reset Email

```bash
curl -X POST http://localhost:3001/api/v1/auth/forgot_password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com"
  }'
```

Check your email inbox for the password reset email!

## Production Configuration

For production deployment, update the environment variables:

```bash
# Production .env
MAILERSEND_FROM_EMAIL=no-reply@yourdomain.com
CLIENT_URL=https://yourdomain.com
```

And configure production.rb similarly to development.rb (already done).

## Email Delivery

Emails are sent **asynchronously** using `deliver_later` which uses Active Job in the background. This means:

- ✅ API responses are fast (doesn't wait for email to send)
- ✅ Email failures don't affect user experience
- ✅ Emails are queued and sent in the background

## MailerSend Dashboard

Monitor your emails at: https://www.mailersend.com/

You can:
- View sent emails
- Check delivery status
- See open/click rates
- Monitor bounce rates
- View sending statistics

## Troubleshooting

### Email Not Received?

1. **Check spam folder** - Sometimes confirmation emails go to spam
2. **Verify email address** - Make sure the email is correct
3. **Check MailerSend dashboard** - Verify if email was sent
4. **Check Rails logs** - Look for any errors
5. **Test SMTP connection** - Ensure credentials are correct

### Common Issues

**Issue**: Email not sending
**Solution**: Check that `.env` file has the correct `MAILERSEND_API_TOKEN`

**Issue**: Links not working
**Solution**: Verify `CLIENT_URL` in `.env` matches your frontend URL

**Issue**: Token expired
**Solution**: Password reset tokens expire after 2 hours - request a new one

## Email Templates Location

```
server/
└── app/
    └── views/
        └── user_mailer/
            ├── confirmation_email.html.erb
            ├── confirmation_email.text.erb
            ├── password_reset_email.html.erb
            └── password_reset_email.text.erb
```

## Customization

To customize the email templates:

1. Edit the `.html.erb` files for HTML emails
2. Edit the `.text.erb` files for plain text emails
3. Modify colors, text, or layout as needed
4. Restart the Rails server to see changes

## API Token Security

⚠️ **IMPORTANT**: The MailerSend API token in this project is active. For production:

1. Generate a new token with "Sending access" only
2. Store it securely in environment variables
3. Never commit tokens to git
4. Rotate tokens periodically

## Features Not Yet Implemented

Future enhancements:
- Email templates in multiple languages (ES/EN)
- Email tracking (opens, clicks)
- Unsubscribe functionality
- Welcome series emails
- Notification digest emails

---

**Status**: ✅ MailerSend is fully configured and ready to send emails!

All confirmation and password reset emails will be sent automatically through the authentication flow.
