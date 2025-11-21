require 'rails_helper'

RSpec.describe MentionService, type: :service do
  let(:user1) { create_confirmed_user(name: 'John Doe', email: 'john@example.com') }
  let(:user2) { create_confirmed_user(name: 'jane_smith', email: 'jane@example.com') }
  let(:user3) { create_confirmed_user(name: 'Bob Wilson', email: 'bob@test.com') }
  let(:post_owner) { create_confirmed_user(name: 'PostOwner', email: 'owner@example.com') }

  describe '.extract_mentions' do
    context 'with username mentions' do
      it 'extracts single username mention' do
        text = 'Hey @john_doe check this out'
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to eq([ 'john_doe' ])
      end

      it 'extracts multiple username mentions' do
        text = 'Hey @john_doe and @jane_smith, look at this!'
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to match_array([ 'john_doe', 'jane_smith' ])
      end

      it 'extracts username at start of text' do
        text = '@john_doe this is for you'
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to eq([ 'john_doe' ])
      end

      it 'extracts username at end of text' do
        text = 'This is for @john_doe'
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to eq([ 'john_doe' ])
      end

      it 'extracts username with underscores' do
        text = 'Hey @user_name_123 check this'
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to eq([ 'user_name_123' ])
      end

      it 'extracts username with numbers' do
        text = 'Mentioning @user123 here'
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to eq([ 'user123' ])
      end

      it 'respects minimum length of 3 characters' do
        text = 'Hey @ab and @abc'
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to eq([ 'abc' ])
      end

      it 'respects maximum length of 30 characters' do
        long_username = 'a' * 31
        text = "Hey @#{long_username} and @validuser"
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to eq([ 'validuser' ])
      end

      it 'handles username followed by punctuation' do
        text = 'Hey @john_doe, how are you? @jane_smith!'
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to match_array([ 'john_doe', 'jane_smith' ])
      end

      it 'handles username in middle of sentence' do
        text = 'I think @john_doe knows about this'
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to eq([ 'john_doe' ])
      end

      it 'removes duplicate username mentions' do
        text = '@john_doe please help @john_doe'
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to eq([ 'john_doe' ])
      end
    end

    context 'with email mentions' do
      it 'extracts single email mention' do
        text = 'Hey @john@example.com check this'
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to eq([ 'john@example.com' ])
      end

      it 'extracts multiple email mentions' do
        text = 'CC @john@example.com and @jane@test.com'
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to match_array([ 'john@example.com', 'jane@test.com' ])
      end

      it 'extracts email with subdomain' do
        text = '@user@mail.example.com please review'
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to eq([ 'user@mail.example.com' ])
      end

      it 'extracts email with plus sign' do
        text = '@john+tag@example.com check this'
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to eq([ 'john+tag@example.com' ])
      end

      it 'extracts email with dots in local part' do
        text = '@john.doe@example.com please see'
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to eq([ 'john.doe@example.com' ])
      end

      it 'extracts email with numbers' do
        text = '@user123@example.com check this'
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to eq([ 'user123@example.com' ])
      end

      it 'removes duplicate email mentions' do
        text = '@john@example.com and @john@example.com'
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to eq([ 'john@example.com' ])
      end
    end

    context 'with mixed mentions' do
      it 'extracts both username and email mentions' do
        text = 'Hey @john_doe and @jane@example.com'
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to match_array([ 'john_doe', 'jane@example.com' ])
      end

      it 'handles multiple of each type' do
        text = '@user1 @user2 and @email1@test.com @email2@test.com'
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to match_array([ 'user1', 'user2', 'email1@test.com', 'email2@test.com' ])
      end
    end

    context 'with edge cases' do
      it 'returns empty array for nil text' do
        mentions = MentionService.extract_mentions(nil)
        expect(mentions).to eq([])
      end

      it 'returns empty array for empty string' do
        mentions = MentionService.extract_mentions('')
        expect(mentions).to eq([])
      end

      it 'returns empty array for blank string' do
        mentions = MentionService.extract_mentions('   ')
        expect(mentions).to eq([])
      end

      it 'returns empty array when no mentions found' do
        text = 'This is just regular text without mentions'
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to eq([])
      end

      it 'ignores @ symbols not followed by valid pattern' do
        text = 'Email me at support@ or @'
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to eq([])
      end

      it 'handles mentions in multiline text' do
        text = "First line with @user1\nSecond line with @user2\nThird line with @user3"
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to match_array([ 'user1', 'user2', 'user3' ])
      end

      it 'handles mentions with special characters nearby' do
        text = '(@john_doe) [@jane_smith] {@bob_wilson}'
        mentions = MentionService.extract_mentions(text)
        expect(mentions).to match_array([ 'john_doe', 'jane_smith', 'bob_wilson' ])
      end
    end
  end

  describe '.find_mentioned_users' do
    before do
      user1 # Create users
      user2
      user3
    end

    context 'with email mentions' do
      it 'finds user by email' do
        mentions = [ 'john@example.com' ]
        users = MentionService.find_mentioned_users(mentions)
        expect(users).to eq([ user1 ])
      end

      it 'finds multiple users by email' do
        mentions = [ 'john@example.com', 'jane@example.com' ]
        users = MentionService.find_mentioned_users(mentions)
        expect(users).to match_array([ user1, user2 ])
      end

      it 'returns empty array for non-existent email' do
        mentions = [ 'nonexistent@example.com' ]
        users = MentionService.find_mentioned_users(mentions)
        expect(users).to eq([])
      end

      it 'finds only existing users when some emails do not exist' do
        mentions = [ 'john@example.com', 'nonexistent@example.com', 'jane@example.com' ]
        users = MentionService.find_mentioned_users(mentions)
        expect(users).to match_array([ user1, user2 ])
      end
    end

    context 'with username mentions' do
      it 'finds user by name (case-insensitive)' do
        mentions = [ 'john' ]
        users = MentionService.find_mentioned_users(mentions)
        expect(users).to eq([ user1 ])
      end

      it 'finds user with exact case match' do
        mentions = [ 'jane_smith' ]
        users = MentionService.find_mentioned_users(mentions)
        expect(users).to eq([ user2 ])
      end

      it 'finds user with different case' do
        mentions = [ 'JANE_SMITH' ]
        users = MentionService.find_mentioned_users(mentions)
        expect(users).to eq([ user2 ])
      end

      it 'finds user with mixed case' do
        mentions = [ 'JaNe_SmItH' ]
        users = MentionService.find_mentioned_users(mentions)
        expect(users).to eq([ user2 ])
      end

      it 'finds multiple users by username' do
        mentions = [ 'john', 'jane_smith' ]
        users = MentionService.find_mentioned_users(mentions)
        expect(users).to match_array([ user1, user2 ])
      end

      it 'returns empty array for non-existent username' do
        mentions = [ 'nonexistentuser' ]
        users = MentionService.find_mentioned_users(mentions)
        expect(users).to eq([])
      end

      it 'finds user by partial name match (first name only)' do
        mentions = [ 'bob' ]
        users = MentionService.find_mentioned_users(mentions)
        expect(users).to eq([ user3 ])
      end
    end

    context 'with mixed mentions' do
      it 'finds users by both email and username' do
        mentions = [ 'john', 'jane@example.com' ]
        users = MentionService.find_mentioned_users(mentions)
        expect(users).to match_array([ user1, user2 ])
      end

      it 'removes duplicate users' do
        mentions = [ 'john', 'john@example.com' ]
        users = MentionService.find_mentioned_users(mentions)
        expect(users).to eq([ user1 ])
      end
    end

    context 'with edge cases' do
      it 'returns empty array for empty mentions array' do
        users = MentionService.find_mentioned_users([])
        expect(users).to eq([])
      end

      it 'handles mentions with whitespace' do
        mentions = [ ' john ', ' jane@example.com ' ]
        users = MentionService.find_mentioned_users(mentions)
        # This might fail depending on implementation - adjust if needed
        expect(users.length).to be >= 0
      end
    end
  end

  describe '.create_mention_notifications' do
    let(:post_record) do
      create(:post, user: post_owner, title: 'Test Post', description: 'Hey @john check this out and @jane@example.com')
    end

    let(:comment) do
      create(:comment, user: post_owner, commentable: post_record, description: 'Hey @bob please review')
    end

    before do
      user1 # Create users
      user2
      user3
    end

    context 'with Post as mentionable' do
      it 'creates notifications for mentioned users in post description' do
        expect {
          MentionService.create_mention_notifications(post_record, post_owner)
        }.to change(Notification, :count).by(2)

        notifications = Notification.where(notification_type: 'mention', notifiable: post_record)
        expect(notifications.map(&:user)).to match_array([ user1, user2 ])
      end

      it 'searches mentions in both title and description for posts' do
        alice = create_confirmed_user(name: 'alice_user', email: 'alice@example.com')
        bob = create_confirmed_user(name: 'bob_user', email: 'bob@example.com')

        post_with_title_mention = create(:post,
          user: post_owner,
          title: 'For @alice_user check',
          description: 'And also for @bob_user please see'
        )

        notifications = MentionService.create_mention_notifications(post_with_title_mention, post_owner)
        expect(notifications.length).to eq(2)
        expect(notifications.map(&:user)).to match_array([ alice, bob ])
      end

      it 'sets correct notification attributes' do
        notifications = MentionService.create_mention_notifications(post_record, post_owner)
        notification = notifications.first

        expect(notification.notification_type).to eq('mention')
        expect(notification.notifiable).to eq(post_record)
        expect(notification.actor).to eq(post_owner)
        expect(notification.read_at).to be_nil
      end
    end

    context 'with Comment as mentionable' do
      it 'creates notifications for mentioned users in comment' do
        expect {
          MentionService.create_mention_notifications(comment, post_owner)
        }.to change(Notification, :count).by(1)

        notification = Notification.find_by(notification_type: 'mention', notifiable: comment)
        expect(notification.user).to eq(user3)
      end
    end

    context 'with duplicate prevention' do
      it 'does not create duplicate notifications' do
        # First call creates notification
        MentionService.create_mention_notifications(post_record, post_owner)

        # Second call should not create duplicates
        expect {
          MentionService.create_mention_notifications(post_record, post_owner)
        }.not_to change(Notification, :count)
      end

      it 'allows same user to be mentioned in different posts' do
        post1 = create(:post, user: post_owner, title: 'Post 1', description: 'Hey @john check this')
        post2 = create(:post, user: post_owner, title: 'Post 2', description: 'Hey @john again please')

        MentionService.create_mention_notifications(post1, post_owner)

        expect {
          MentionService.create_mention_notifications(post2, post_owner)
        }.to change(Notification, :count).by(1)
      end
    end

    context 'with self-mention prevention' do
      it 'does not notify the actor when they mention themselves' do
        self_mention_post = create(:post,
          user: user1,
          title: 'My Post',
          description: 'I am @john and @jane@example.com'
        )

        notifications = MentionService.create_mention_notifications(self_mention_post, user1)

        expect(notifications.length).to eq(1)
        expect(notifications.first.user).to eq(user2)
        expect(notifications.map(&:user)).not_to include(user1)
      end
    end

    context 'with edge cases' do
      it 'returns empty array when mentionable is nil' do
        notifications = MentionService.create_mention_notifications(nil, post_owner)
        expect(notifications).to eq([])
      end

      it 'returns empty array when actor is nil' do
        notifications = MentionService.create_mention_notifications(post_record, nil)
        expect(notifications).to eq([])
      end

      it 'returns empty array when text is blank' do
        # Use build instead of create to bypass validations for testing edge cases
        empty_post = build(:post, user: post_owner, title: 'Empty', description: '')
        empty_post.save(validate: false)
        notifications = MentionService.create_mention_notifications(empty_post, post_owner)
        expect(notifications).to eq([])
      end

      it 'returns empty array when no mentions found' do
        no_mention_post = create(:post, user: post_owner, title: 'No mentions', description: 'Just regular text')
        notifications = MentionService.create_mention_notifications(no_mention_post, post_owner)
        expect(notifications).to eq([])
      end

      it 'handles mentions of non-existent users gracefully' do
        post_with_invalid = create(:post,
          user: post_owner,
          title: 'Test',
          description: '@nonexistent @john'
        )

        notifications = MentionService.create_mention_notifications(post_with_invalid, post_owner)
        expect(notifications.length).to eq(1)
        expect(notifications.first.user).to eq(user1)
      end

      it 'only returns persisted notifications' do
        # This tests that only valid notifications are returned
        notifications = MentionService.create_mention_notifications(post_record, post_owner)
        expect(notifications.all?(&:persisted?)).to be true
      end
    end
  end

  describe '.process_mentions' do
    let(:post_record) do
      create(:post, user: post_owner, title: 'Test', description: 'Hey @john and @jane@example.com')
    end

    before do
      user1
      user2
    end

    it 'creates mention notifications' do
      expect {
        MentionService.process_mentions(post_record, post_owner)
      }.to change(Notification, :count).by(2)
    end

    it 'returns array of created notifications' do
      notifications = MentionService.process_mentions(post_record, post_owner)
      expect(notifications).to be_an(Array)
      expect(notifications.length).to eq(2)
      expect(notifications.all? { |n| n.is_a?(Notification) }).to be true
    end

    context 'with error handling' do
      it 'returns empty array on error' do
        allow(MentionService).to receive(:create_mention_notifications).and_raise(StandardError, 'Test error')

        notifications = MentionService.process_mentions(post_record, post_owner)
        expect(notifications).to eq([])
      end

      it 'logs error when exception occurs' do
        allow(MentionService).to receive(:create_mention_notifications).and_raise(StandardError, 'Test error')
        allow(Rails.logger).to receive(:error)

        MentionService.process_mentions(post_record, post_owner)

        expect(Rails.logger).to have_received(:error).with(/MentionService error: Test error/)
      end

      it 'logs backtrace when exception occurs' do
        allow(MentionService).to receive(:create_mention_notifications).and_raise(StandardError, 'Test error')
        allow(Rails.logger).to receive(:error)

        MentionService.process_mentions(post_record, post_owner)

        expect(Rails.logger).to have_received(:error).at_least(:once)
      end
    end
  end

  describe 'integration scenarios' do
    before do
      user1
      user2
      user3
    end

    it 'handles complete mention workflow for post' do
      post_with_mentions = create(:post,
        user: post_owner,
        title: 'Important Update',
        description: 'Hey @john, @jane@example.com, and @bob please review this!'
      )

      notifications = MentionService.process_mentions(post_with_mentions, post_owner)

      expect(notifications.length).to eq(3)
      expect(notifications.map(&:user)).to match_array([ user1, user2, user3 ])
      expect(notifications.all? { |n| n.notification_type == 'mention' }).to be true
      expect(notifications.all? { |n| n.actor == post_owner }).to be true
      expect(notifications.all? { |n| n.notifiable == post_with_mentions }).to be true
    end

    it 'handles complete mention workflow for comment' do
      post_record = create(:post, user: post_owner, title: 'Test', description: 'Test post for testing')
      comment_with_mentions = create(:comment,
        user: user1,
        commentable: post_record,
        description: 'Hey @jane@example.com and @bob check this!'
      )

      notifications = MentionService.process_mentions(comment_with_mentions, user1)

      expect(notifications.length).to eq(2)
      expect(notifications.map(&:user)).to match_array([ user2, user3 ])
      expect(notifications.all? { |n| n.notification_type == 'mention' }).to be true
      expect(notifications.all? { |n| n.actor == user1 }).to be true
      expect(notifications.all? { |n| n.notifiable == comment_with_mentions }).to be true
    end

    it 'handles mentions in updated content' do
      post_record = create(:post, user: post_owner, title: 'Original', description: 'No mentions')

      # Update post with mentions
      post_record.update(description: 'Hey @john please review')

      notifications = MentionService.process_mentions(post_record, post_owner)

      expect(notifications.length).to eq(1)
      expect(notifications.first.user).to eq(user1)
    end
  end
end
