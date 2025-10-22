require 'rails_helper'

RSpec.describe User, type: :model do
  # Factory validation
  describe 'factory' do
    it 'has a valid factory' do
      user = build(:user, email: 'test@example.com', password: 'password123')
      expect(user).to be_valid
    end
  end

  # Association tests
  describe 'associations' do
    it { should have_many(:posts).dependent(:destroy) }
    it { should have_many(:comments).dependent(:destroy) }
    it { should have_many(:reactions).dependent(:destroy) }
    it { should have_many(:notifications).dependent(:destroy) }
  end

  # Validation tests
  describe 'validations' do
    subject { build(:user, email: 'test@example.com', password: 'password123') }

    # Name validations
    it { should validate_presence_of(:name) }
    it { should validate_length_of(:name).is_at_least(2) }
    it { should validate_length_of(:name).is_at_most(50) }

    # Email validations
    it { should validate_presence_of(:email) }
    it { should validate_uniqueness_of(:email).case_insensitive }

    context 'email format validation' do
      it 'accepts valid email formats' do
        valid_emails = ['user@example.com', 'test.user@example.co.uk', 'user+tag@example.com']
        valid_emails.each do |email|
          user = build(:user, email: email, password: 'password123')
          expect(user).to be_valid
        end
      end

      it 'rejects invalid email formats' do
        invalid_emails = ['invalid', 'invalid@', '@example.com', 'invalid@.com']
        invalid_emails.each do |email|
          user = build(:user, email: email, password: 'password123')
          expect(user).not_to be_valid
          expect(user.errors[:email]).to be_present
        end
      end
    end

    # Password validations
    context 'password validations' do
      it 'validates password length for new records' do
        user = build(:user, email: 'test@example.com', password: '12345')
        expect(user).not_to be_valid
        expect(user.errors[:password]).to include('is too short (minimum is 6 characters)')
      end

      it 'accepts password of minimum length 6' do
        user = build(:user, email: 'test@example.com', password: '123456', password_confirmation: '123456')
        expect(user).to be_valid
      end

      it 'does not validate password length if password is not being changed' do
        user = create(:user, email: 'test@example.com', password: 'password123')
        user.name = 'New Name'
        expect(user).to be_valid
      end

      it 'validates password length when updating password' do
        user = create(:user, email: 'test@example.com', password: 'password123')
        user.password = '12345'
        expect(user).not_to be_valid
        expect(user.errors[:password]).to include('is too short (minimum is 6 characters)')
      end
    end

    # Bio validations
    it { should validate_length_of(:bio).is_at_most(500) }
    it { should allow_value(nil).for(:bio) }
    it { should allow_value('').for(:bio) }

    it 'allows valid bio' do
      user = build(:user, email: 'test@example.com', password: 'password123', bio: 'A short bio')
      expect(user).to be_valid
    end
  end

  # Callback tests
  describe 'callbacks' do
    describe '#downcase_email' do
      it 'downcases email before save' do
        user = create(:user, email: 'TEST@EXAMPLE.COM', password: 'password123')
        expect(user.email).to eq('test@example.com')
      end

      it 'handles mixed case emails' do
        user = create(:user, email: 'TeSt@ExAmPlE.CoM', password: 'password123')
        expect(user.email).to eq('test@example.com')
      end

      it 'handles nil email gracefully' do
        user = User.new(name: 'Test User', email: 'test@example.com', password: 'password123', password_confirmation: 'password123')
        user.email = nil
        user.valid?  # This will trigger the callback
        # The callback should not crash even with nil email
        # However, validation will fail due to presence requirement
        expect(user.errors[:email]).to be_present
      end
    end

    describe '#generate_confirmation_token' do
      it 'generates confirmation token before create' do
        user = create(:user, email: 'test@example.com', password: 'password123')
        expect(user.confirmation_token).to be_present
        expect(user.confirmation_token).to be_a(String)
      end

      it 'sets confirmation_sent_at before create' do
        user = create(:user, email: 'test@example.com', password: 'password123')
        expect(user.confirmation_sent_at).to be_present
        expect(user.confirmation_sent_at).to be_a(Time)
      end

      it 'generates unique confirmation tokens for different users' do
        user1 = create(:user, email: 'user1@example.com', password: 'password123')
        user2 = create(:user, email: 'user2@example.com', password: 'password123')
        expect(user1.confirmation_token).not_to eq(user2.confirmation_token)
      end
    end

    describe '#set_default_profile_picture' do
      it 'sets default profile picture after create when profile_picture is blank' do
        user = create(:user, email: 'test@example.com', password: 'password123', profile_picture: nil, name: 'John Doe')
        expect(user.profile_picture).to be_present
        expect(user.profile_picture).to include('ui-avatars.com')
      end

      it 'includes user name in profile picture URL' do
        user = create(:user, email: 'test@example.com', password: 'password123', profile_picture: nil, name: 'Jane Smith')
        expect(user.profile_picture).to include('Jane')
      end

      it 'does not override existing profile picture' do
        custom_picture = 'https://example.com/custom.jpg'
        user = create(:user, email: 'test@example.com', password: 'password123', profile_picture: custom_picture, name: 'John Doe')
        expect(user.profile_picture).to eq(custom_picture)
      end

      it 'generates colors based on email hash' do
        user = create(:user, email: 'test@example.com', password: 'password123', profile_picture: nil, name: 'Test User')
        # The profile picture should include background and color params derived from email hash
        expect(user.profile_picture).to include('background=')
        expect(user.profile_picture).to include('color=')
        # Verify color and background are hex values from the email hash
        expect(user.profile_picture).to match(/background=[0-9a-f]{6}/)
        expect(user.profile_picture).to match(/color=[0-9a-f]{6}/)
      end
    end
  end

  # Scope tests
  describe 'scopes' do
    let!(:confirmed_user) do
      create(:user, email: 'confirmed@example.com', password: 'password123', confirmed_at: Time.current)
    end
    let!(:unconfirmed_user) do
      create(:user, email: 'unconfirmed@example.com', password: 'password123', confirmed_at: nil)
    end

    describe '.confirmed' do
      it 'returns only confirmed users' do
        expect(User.confirmed).to include(confirmed_user)
        expect(User.confirmed).not_to include(unconfirmed_user)
      end
    end

    describe '.unconfirmed' do
      it 'returns only unconfirmed users' do
        expect(User.unconfirmed).to include(unconfirmed_user)
        expect(User.unconfirmed).not_to include(confirmed_user)
      end
    end
  end

  # Instance method tests
  describe '#confirmed?' do
    it 'returns true when confirmed_at is present' do
      user = build(:user, confirmed_at: Time.current)
      expect(user.confirmed?).to be true
    end

    it 'returns false when confirmed_at is nil' do
      user = build(:user, confirmed_at: nil)
      expect(user.confirmed?).to be false
    end
  end

  describe '#confirm!' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123', confirmed_at: nil) }

    it 'sets confirmed_at timestamp' do
      expect(user.confirmed_at).to be_nil
      user.confirm!
      expect(user.confirmed_at).to be_present
      expect(user.confirmed_at).to be_within(1.second).of(Time.current)
    end

    it 'clears confirmation_token' do
      expect(user.confirmation_token).to be_present
      user.confirm!
      expect(user.confirmation_token).to be_nil
    end

    it 'persists changes to database' do
      user.confirm!
      user.reload
      expect(user.confirmed_at).to be_present
      expect(user.confirmation_token).to be_nil
    end
  end

  describe '#generate_confirmation_token' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }

    it 'generates a new confirmation token' do
      old_token = user.confirmation_token
      user.generate_confirmation_token
      expect(user.confirmation_token).not_to eq(old_token)
    end

    it 'updates confirmation_sent_at' do
      travel_to Time.current + 1.hour do
        user.generate_confirmation_token
        expect(user.confirmation_sent_at).to be_within(1.second).of(Time.current)
      end
    end

    it 'does not persist changes automatically' do
      old_token = user.confirmation_token
      user.generate_confirmation_token
      user.reload
      expect(user.confirmation_token).to eq(old_token)
    end
  end

  describe '#generate_reset_password_token' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }

    it 'generates reset password token' do
      user.generate_reset_password_token
      expect(user.reset_password_token).to be_present
      expect(user.reset_password_token).to be_a(String)
    end

    it 'sets reset_password_sent_at timestamp' do
      user.generate_reset_password_token
      expect(user.reset_password_sent_at).to be_present
      expect(user.reset_password_sent_at).to be_within(1.second).of(Time.current)
    end

    it 'persists changes to database' do
      user.generate_reset_password_token
      user.reload
      expect(user.reset_password_token).to be_present
      expect(user.reset_password_sent_at).to be_present
    end

    it 'generates unique tokens for different invocations' do
      user.generate_reset_password_token
      token1 = user.reset_password_token
      sleep 0.01 # Ensure different tokens
      user.generate_reset_password_token
      token2 = user.reset_password_token
      expect(token1).not_to eq(token2)
    end
  end

  describe '#reset_password_token_valid?' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }

    it 'returns true when token was sent less than 2 hours ago' do
      user.update(reset_password_sent_at: 1.hour.ago)
      expect(user.reset_password_token_valid?).to be true
    end

    it 'returns false when token was sent more than 2 hours ago' do
      user.update(reset_password_sent_at: 3.hours.ago)
      expect(user.reset_password_token_valid?).to be false
    end

    it 'returns false when reset_password_sent_at is nil' do
      user.update(reset_password_sent_at: nil)
      expect(user.reset_password_token_valid?).to be false
    end

    it 'returns true exactly at 2 hours boundary (within grace period)' do
      user.update(reset_password_sent_at: 2.hours.ago + 1.minute)
      expect(user.reset_password_token_valid?).to be true
    end
  end

  # Edge cases and error handling
  describe 'edge cases' do
    describe 'password authentication' do
      it 'authenticates with correct password' do
        user = create(:user, email: 'test@example.com', password: 'password123')
        expect(user.authenticate('password123')).to eq(user)
      end

      it 'fails authentication with incorrect password' do
        user = create(:user, email: 'test@example.com', password: 'password123')
        expect(user.authenticate('wrongpassword')).to be false
      end
    end

    describe 'email uniqueness' do
      it 'enforces case-insensitive uniqueness' do
        create(:user, email: 'test@example.com', password: 'password123')
        duplicate_user = build(:user, email: 'TEST@EXAMPLE.COM', password: 'password123')
        expect(duplicate_user).not_to be_valid
        expect(duplicate_user.errors[:email]).to include('has already been taken')
      end
    end

    describe 'name edge cases' do
      it 'accepts minimum length name' do
        user = build(:user, email: 'test@example.com', password: 'password123', name: 'Jo')
        expect(user).to be_valid
      end

      it 'accepts maximum length name' do
        user = build(:user, email: 'test@example.com', password: 'password123', name: 'a' * 50)
        expect(user).to be_valid
      end

      it 'rejects name below minimum length' do
        user = build(:user, email: 'test@example.com', password: 'password123', name: 'J')
        expect(user).not_to be_valid
        expect(user.errors[:name]).to be_present
      end

      it 'rejects name above maximum length' do
        user = build(:user, email: 'test@example.com', password: 'password123', name: 'a' * 51)
        expect(user).not_to be_valid
        expect(user.errors[:name]).to be_present
      end
    end

    describe 'bio edge cases' do
      it 'accepts bio at maximum length' do
        user = build(:user, email: 'test@example.com', password: 'password123', bio: 'a' * 500)
        expect(user).to be_valid
      end

      it 'rejects bio above maximum length' do
        user = build(:user, email: 'test@example.com', password: 'password123', bio: 'a' * 501)
        expect(user).not_to be_valid
        expect(user.errors[:bio]).to be_present
      end
    end

    describe 'dependent destroy' do
      let(:user) { create(:user, email: 'test@example.com', password: 'password123') }

      it 'destroys associated posts when user is destroyed' do
        post = create(:post, user: user, title: 'Test Post', description: 'Test Description')
        expect { user.destroy }.to change { Post.count }.by(-1)
      end

      it 'destroys associated comments when user is destroyed' do
        post = create(:post, user: user, title: 'Test Post', description: 'Test Description')
        comment = create(:comment, user: user, commentable: post, description: 'Test Comment')
        expect { user.destroy }.to change { Comment.count }.by(-1)
      end

      it 'destroys associated reactions when user is destroyed' do
        post = create(:post, user: user, title: 'Test Post', description: 'Test Description')
        reaction = create(:reaction, user: user, reactionable: post, reaction_type: 'like')
        expect { user.destroy }.to change { Reaction.count }.by(-1)
      end

      it 'destroys associated notifications when user is destroyed' do
        notification = create(:notification, user: user, actor: user, notifiable: user, notification_type: 'mention')
        expect { user.destroy }.to change { Notification.count }.by(-1)
      end
    end
  end
end
