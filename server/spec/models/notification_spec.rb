require 'rails_helper'

RSpec.describe Notification, type: :model do
  # Factory validation
  describe 'factory' do
    it 'has a valid factory' do
      user = create(:user, email: 'test@example.com', password: 'password123')
      actor = create(:user, email: 'actor@example.com', password: 'password123')
      post = create(:post, user: user, title: 'Test Post', description: 'Test Description')
      notification = build(:notification, user: user, actor: actor, notifiable: post, notification_type: 'mention')
      expect(notification).to be_valid
    end
  end

  # Association tests
  describe 'associations' do
    it { should belong_to(:user) }
    it { should belong_to(:actor).class_name('User') }
    it { should belong_to(:notifiable) }

    context 'polymorphic notifiable association' do
      let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
      let(:actor) { create(:user, email: 'actor@example.com', password: 'password123') }

      it 'can belong to a post' do
        post = create(:post, user: user, title: 'Test', description: 'Test Description')
        notification = create(:notification, user: user, actor: actor, notifiable: post, notification_type: 'mention')
        expect(notification.notifiable_type).to eq('Post')
        expect(notification.notifiable).to eq(post)
      end

      it 'can belong to a comment' do
        post = create(:post, user: user, title: 'Test', description: 'Test Description')
        comment = create(:comment, user: user, commentable: post, description: 'Comment')
        notification = create(:notification, user: user, actor: actor, notifiable: comment, notification_type: 'mention')
        expect(notification.notifiable_type).to eq('Comment')
        expect(notification.notifiable).to eq(comment)
      end

      it 'can belong to a reaction' do
        post = create(:post, user: user, title: 'Test', description: 'Test Description')
        reaction = create(:reaction, user: actor, reactionable: post, reaction_type: 'like')
        notification = create(:notification, user: user, actor: actor, notifiable: reaction, notification_type: 'reaction_on_post')
        expect(notification.notifiable_type).to eq('Reaction')
        expect(notification.notifiable).to eq(reaction)
      end
    end
  end

  # Validation tests
  describe 'validations' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:actor) { create(:user, email: 'actor@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }
    subject { build(:notification, user: user, actor: actor, notifiable: post, notification_type: 'mention') }

    it { should validate_presence_of(:notification_type) }
    it { should validate_inclusion_of(:notification_type).in_array(Notification::NOTIFICATION_TYPES) }

    context 'notification_type validation' do
      it 'accepts valid notification types' do
        Notification::NOTIFICATION_TYPES.each do |type|
          notification = build(:notification, user: user, actor: actor, notifiable: post, notification_type: type)
          expect(notification).to be_valid
        end
      end

      it 'rejects invalid notification types' do
        invalid_types = [ 'invalid', 'foo', 'bar', '' ]
        invalid_types.each do |type|
          notification = build(:notification, user: user, actor: actor, notifiable: post, notification_type: type)
          expect(notification).not_to be_valid
          expect(notification.errors[:notification_type]).to be_present
        end
      end
    end

    context 'required associations' do
      it 'requires a user' do
        notification = build(:notification, user: nil, actor: actor, notifiable: post, notification_type: 'mention')
        expect(notification).not_to be_valid
      end

      it 'requires an actor' do
        notification = build(:notification, user: user, actor: nil, notifiable: post, notification_type: 'mention')
        expect(notification).not_to be_valid
      end

      it 'requires a notifiable' do
        notification = build(:notification, user: user, actor: actor, notifiable: nil, notification_type: 'mention')
        expect(notification).not_to be_valid
      end
    end
  end

  # Scope tests
  describe 'scopes' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:actor) { create(:user, email: 'actor@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }

    let!(:read_notification) do
      create(:notification, user: user, actor: actor, notifiable: post, notification_type: 'mention', read_at: Time.current)
    end
    let!(:unread_notification1) do
      create(:notification, user: user, actor: actor, notifiable: post, notification_type: 'mention', read_at: nil)
    end
    let!(:unread_notification2) do
      create(:notification, user: user, actor: actor, notifiable: post, notification_type: 'mention', read_at: nil)
    end

    describe '.unread' do
      it 'returns only unread notifications' do
        expect(Notification.unread).to include(unread_notification1, unread_notification2)
        expect(Notification.unread).not_to include(read_notification)
        expect(Notification.unread.count).to eq(2)
      end
    end

    describe '.read' do
      it 'returns only read notifications' do
        expect(Notification.read).to include(read_notification)
        expect(Notification.read).not_to include(unread_notification1, unread_notification2)
        expect(Notification.read.count).to eq(1)
      end
    end

    describe '.recent' do
      let!(:older_notification) do
        create(:notification, user: user, actor: actor, notifiable: post, notification_type: 'mention', created_at: 2.hours.ago)
      end
      let!(:newer_notification) do
        create(:notification, user: user, actor: actor, notifiable: post, notification_type: 'mention', created_at: 1.hour.ago)
      end

      it 'returns notifications ordered by created_at descending' do
        notifications = Notification.recent
        expect(notifications.first.created_at).to be > notifications.second.created_at
      end
    end
  end

  # Instance method tests
  describe '#read?' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:actor) { create(:user, email: 'actor@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }

    it 'returns true when read_at is present' do
      notification = build(:notification, user: user, actor: actor, notifiable: post, notification_type: 'mention', read_at: Time.current)
      expect(notification.read?).to be true
    end

    it 'returns false when read_at is nil' do
      notification = build(:notification, user: user, actor: actor, notifiable: post, notification_type: 'mention', read_at: nil)
      expect(notification.read?).to be false
    end
  end

  describe '#unread?' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:actor) { create(:user, email: 'actor@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }

    it 'returns false when read_at is present' do
      notification = build(:notification, user: user, actor: actor, notifiable: post, notification_type: 'mention', read_at: Time.current)
      expect(notification.unread?).to be false
    end

    it 'returns true when read_at is nil' do
      notification = build(:notification, user: user, actor: actor, notifiable: post, notification_type: 'mention', read_at: nil)
      expect(notification.unread?).to be true
    end
  end

  describe '#mark_as_read!' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:actor) { create(:user, email: 'actor@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }
    let(:notification) { create(:notification, user: user, actor: actor, notifiable: post, notification_type: 'mention', read_at: nil) }

    it 'sets read_at timestamp' do
      expect(notification.read_at).to be_nil
      notification.mark_as_read!
      expect(notification.read_at).to be_present
      expect(notification.read_at).to be_within(1.second).of(Time.current)
    end

    it 'persists changes to database' do
      notification.mark_as_read!
      notification.reload
      expect(notification.read_at).to be_present
    end

    it 'does not update read_at if already read' do
      notification.update(read_at: 1.hour.ago)
      original_read_at = notification.read_at
      notification.mark_as_read!
      expect(notification.read_at).to eq(original_read_at)
    end

    it 'changes unread status to read' do
      expect(notification.unread?).to be true
      notification.mark_as_read!
      expect(notification.read?).to be true
    end
  end

  describe '#mark_as_unread!' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:actor) { create(:user, email: 'actor@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }
    let(:notification) { create(:notification, user: user, actor: actor, notifiable: post, notification_type: 'mention', read_at: Time.current) }

    it 'clears read_at timestamp' do
      expect(notification.read_at).to be_present
      notification.mark_as_unread!
      expect(notification.read_at).to be_nil
    end

    it 'persists changes to database' do
      notification.mark_as_unread!
      notification.reload
      expect(notification.read_at).to be_nil
    end

    it 'does not update if already unread' do
      notification.update(read_at: nil)
      expect {
        notification.mark_as_unread!
      }.not_to change { notification.updated_at }
    end

    it 'changes read status to unread' do
      expect(notification.read?).to be true
      notification.mark_as_unread!
      expect(notification.unread?).to be true
    end
  end

  # Class method tests
  describe '.mark_all_as_read' do
    let(:user1) { create(:user, email: 'user1@example.com', password: 'password123') }
    let(:user2) { create(:user, email: 'user2@example.com', password: 'password123') }
    let(:actor) { create(:user, email: 'actor@example.com', password: 'password123') }
    let(:post) { create(:post, user: user1, title: 'Test', description: 'Test Description') }

    let!(:user1_unread1) do
      create(:notification, user: user1, actor: actor, notifiable: post, notification_type: 'mention', read_at: nil)
    end
    let!(:user1_unread2) do
      create(:notification, user: user1, actor: actor, notifiable: post, notification_type: 'mention', read_at: nil)
    end
    let!(:user2_unread) do
      create(:notification, user: user2, actor: actor, notifiable: post, notification_type: 'mention', read_at: nil)
    end

    it 'marks all unread notifications as read for the specified user' do
      Notification.mark_all_as_read(user1)

      user1_unread1.reload
      user1_unread2.reload

      expect(user1_unread1.read?).to be true
      expect(user1_unread2.read?).to be true
    end

    it 'does not affect other users notifications' do
      Notification.mark_all_as_read(user1)

      user2_unread.reload
      expect(user2_unread.unread?).to be true
    end

    it 'returns count of updated notifications' do
      count = Notification.mark_all_as_read(user1)
      expect(count).to eq(2)
    end

    it 'does nothing if user has no unread notifications' do
      user1_unread1.mark_as_read!
      user1_unread2.mark_as_read!

      count = Notification.mark_all_as_read(user1)
      expect(count).to eq(0)
    end
  end

  # Edge cases and error handling
  describe 'edge cases' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:actor) { create(:user, email: 'actor@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }

    describe 'constant NOTIFICATION_TYPES' do
      it 'is defined' do
        expect(Notification::NOTIFICATION_TYPES).to be_a(Array)
      end

      it 'contains expected notification types' do
        expected_types = [ 'comment_on_post', 'reply_to_comment', 'mention', 'reaction_on_post', 'reaction_on_comment' ]
        expect(Notification::NOTIFICATION_TYPES).to match_array(expected_types)
      end

      it 'is frozen to prevent modification' do
        expect(Notification::NOTIFICATION_TYPES).to be_frozen
      end
    end

    describe 'destroying notifiable' do
      it 'destroys notifications when post is destroyed' do
        notification = create(:notification, user: user, actor: actor, notifiable: post, notification_type: 'mention')
        expect { post.destroy }.to change { Notification.count }.by(-1)
      end

      it 'destroys notifications when comment is destroyed' do
        comment = create(:comment, user: user, commentable: post, description: 'Comment')
        notification = create(:notification, user: user, actor: actor, notifiable: comment, notification_type: 'reply_to_comment')
        expect { comment.destroy }.to change { Notification.count }.by(-1)
      end
    end

    describe 'destroying user' do
      it 'destroys notifications when user is destroyed' do
        create(:notification, user: user, actor: actor, notifiable: post, notification_type: 'mention')
        expect { user.destroy }.to change { Notification.count }.by(-1)
      end
    end

    describe 'same user as actor and recipient' do
      it 'allows user to be both actor and recipient' do
        notification = build(:notification, user: user, actor: user, notifiable: post, notification_type: 'mention')
        expect(notification).to be_valid
      end
    end
  end

  # Integration tests
  describe 'integration scenarios' do
    let(:user) { create(:user, email: 'user@example.com', password: 'password123') }
    let(:actor1) { create(:user, email: 'actor1@example.com', password: 'password123') }
    let(:actor2) { create(:user, email: 'actor2@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Popular Post', description: 'A popular post') }

    it 'handles multiple notification types for same user' do
      comment = create(:comment, user: actor1, commentable: post, description: 'Comment')
      reaction = create(:reaction, user: actor2, reactionable: post, reaction_type: 'like')

      notification1 = create(:notification, user: user, actor: actor1, notifiable: comment, notification_type: 'comment_on_post')
      notification2 = create(:notification, user: user, actor: actor2, notifiable: reaction, notification_type: 'reaction_on_post')
      notification3 = create(:notification, user: user, actor: actor1, notifiable: post, notification_type: 'mention')

      expect(user.notifications.count).to eq(3)
      expect(user.notifications.unread.count).to eq(3)
    end

    it 'handles marking notifications as read selectively' do
      notification1 = create(:notification, user: user, actor: actor1, notifiable: post, notification_type: 'mention', read_at: nil)
      notification2 = create(:notification, user: user, actor: actor2, notifiable: post, notification_type: 'mention', read_at: nil)
      notification3 = create(:notification, user: user, actor: actor1, notifiable: post, notification_type: 'mention', read_at: nil)

      # Mark only first notification as read
      notification1.mark_as_read!

      expect(Notification.unread.count).to eq(2)
      expect(Notification.read.count).to eq(1)
    end

    it 'handles complex notification workflow' do
      # Create notifications
      3.times do |i|
        create(:notification, user: user, actor: actor1, notifiable: post, notification_type: 'mention', read_at: nil)
      end

      expect(user.notifications.unread.count).to eq(3)

      # Mark all as read
      Notification.mark_all_as_read(user)
      expect(user.notifications.unread.count).to eq(0)
      expect(user.notifications.read.count).to eq(3)

      # Create new notification
      new_notification = create(:notification, user: user, actor: actor2, notifiable: post, notification_type: 'mention', read_at: nil)
      expect(user.notifications.unread.count).to eq(1)

      # Mark as unread again
      user.notifications.read.first.mark_as_unread!
      expect(user.notifications.unread.count).to eq(2)
    end

    it 'maintains notification ordering by recency' do
      old_notification = create(:notification, user: user, actor: actor1, notifiable: post, notification_type: 'mention', created_at: 2.hours.ago)
      middle_notification = create(:notification, user: user, actor: actor2, notifiable: post, notification_type: 'mention', created_at: 1.hour.ago)
      new_notification = create(:notification, user: user, actor: actor1, notifiable: post, notification_type: 'mention', created_at: Time.current)

      notifications = user.notifications.recent
      expect(notifications.first).to eq(new_notification)
      expect(notifications.second).to eq(middle_notification)
      expect(notifications.third).to eq(old_notification)
    end

    it 'handles notifications for different notifiable types' do
      comment = create(:comment, user: actor1, commentable: post, description: 'Great post!')
      reaction = create(:reaction, user: actor2, reactionable: comment, reaction_type: 'like')

      post_notification = create(:notification, user: user, actor: actor1, notifiable: post, notification_type: 'mention')
      comment_notification = create(:notification, user: user, actor: actor1, notifiable: comment, notification_type: 'comment_on_post')
      reaction_notification = create(:notification, user: user, actor: actor2, notifiable: reaction, notification_type: 'reaction_on_comment')

      expect(user.notifications.count).to eq(3)

      # Verify each notification points to correct notifiable
      expect(post_notification.notifiable).to eq(post)
      expect(comment_notification.notifiable).to eq(comment)
      expect(reaction_notification.notifiable).to eq(reaction)
    end

    it 'maintains data integrity across different query methods' do
      notification = create(:notification, user: user, actor: actor1, notifiable: post, notification_type: 'mention', read_at: nil)

      recent_notification = Notification.recent.find(notification.id)
      unread_notification = Notification.unread.find(notification.id)

      expect(recent_notification).to eq(notification)
      expect(unread_notification).to eq(notification)
      expect(recent_notification.user).to eq(user)
      expect(recent_notification.actor).to eq(actor1)
    end
  end
end
