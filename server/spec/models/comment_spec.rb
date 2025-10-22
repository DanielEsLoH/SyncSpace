require 'rails_helper'

RSpec.describe Comment, type: :model do
  # Factory validation
  describe 'factory' do
    it 'has a valid factory for post comment' do
      user = create(:user, email: 'test@example.com', password: 'password123')
      post = create(:post, user: user, title: 'Test Post', description: 'Test Description')
      comment = build(:comment, user: user, commentable: post, description: 'Test comment')
      expect(comment).to be_valid
    end

    it 'has a valid factory for comment reply' do
      user = create(:user, email: 'test@example.com', password: 'password123')
      post = create(:post, user: user, title: 'Test Post', description: 'Test Description')
      parent_comment = create(:comment, user: user, commentable: post, description: 'Parent comment')
      reply = build(:comment, user: user, commentable: parent_comment, description: 'Reply comment')
      expect(reply).to be_valid
    end
  end

  # Association tests
  describe 'associations' do
    it { should belong_to(:user) }
    it { should belong_to(:commentable) }
    it { should have_many(:comments).dependent(:destroy) }
    it { should have_many(:reactions).dependent(:destroy) }

    context 'polymorphic commentable association' do
      let(:user) { create(:user, email: 'test@example.com', password: 'password123') }

      it 'can belong to a post' do
        post = create(:post, user: user, title: 'Test', description: 'Test Description')
        comment = create(:comment, user: user, commentable: post, description: 'Comment on post')
        expect(comment.commentable_type).to eq('Post')
        expect(comment.commentable).to eq(post)
      end

      it 'can belong to another comment' do
        post = create(:post, user: user, title: 'Test', description: 'Test Description')
        parent_comment = create(:comment, user: user, commentable: post, description: 'Parent')
        reply = create(:comment, user: user, commentable: parent_comment, description: 'Reply')
        expect(reply.commentable_type).to eq('Comment')
        expect(reply.commentable).to eq(parent_comment)
      end
    end
  end

  # Validation tests
  describe 'validations' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }
    subject { build(:comment, user: user, commentable: post, description: 'Test comment') }

    it { should validate_presence_of(:description) }
    it { should validate_length_of(:description).is_at_least(1) }
    it { should validate_length_of(:description).is_at_most(2000) }

    context 'description length edge cases' do
      it 'accepts minimum length description' do
        comment = build(:comment, user: user, commentable: post, description: 'a')
        expect(comment).to be_valid
      end

      it 'accepts maximum length description' do
        comment = build(:comment, user: user, commentable: post, description: 'a' * 2000)
        expect(comment).to be_valid
      end

      it 'rejects empty description' do
        comment = build(:comment, user: user, commentable: post, description: '')
        expect(comment).not_to be_valid
        expect(comment.errors[:description]).to be_present
      end

      it 'rejects description above maximum length' do
        comment = build(:comment, user: user, commentable: post, description: 'a' * 2001)
        expect(comment).not_to be_valid
        expect(comment.errors[:description]).to be_present
      end
    end

    context 'self-parent validation' do
      it 'prevents comment from being its own parent' do
        comment = create(:comment, user: user, commentable: post)
        comment.commentable_type = 'Comment'
        comment.commentable_id = comment.id

        expect(comment).not_to be_valid
        expect(comment.errors[:commentable]).to include("cannot be itself")
      end
    end
  end

  # Scope tests
  describe 'scopes' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }
    let!(:older_comment) do
      create(:comment, user: user, commentable: post, description: 'Older', created_at: 2.hours.ago)
    end
    let!(:newer_comment) do
      create(:comment, user: user, commentable: post, description: 'Newer', created_at: 1.hour.ago)
    end
    let!(:newest_comment) do
      create(:comment, user: user, commentable: post, description: 'Newest', created_at: Time.current)
    end

    describe '.recent' do
      it 'returns comments ordered by created_at descending' do
        comments = Comment.recent
        expect(comments.first).to eq(newest_comment)
        expect(comments.second).to eq(newer_comment)
        expect(comments.third).to eq(older_comment)
      end
    end

    describe '.with_user' do
      it 'eager loads user association' do
        comments = Comment.with_user
        expect(comments.first.association(:user)).to be_loaded
      end

      it 'returns all comments with users' do
        comments = Comment.with_user
        expect(comments.count).to eq(3)
        expect(comments.map(&:user).uniq).to eq([user])
      end
    end
  end

  # Instance method tests
  describe '#reactions_count' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }
    let(:comment) { create(:comment, user: user, commentable: post, description: 'Test comment') }

    it 'returns 0 when there are no reactions' do
      expect(comment.reactions_count).to eq(0)
    end

    it 'returns correct count of reactions' do
      3.times do |i|
        other_user = create(:user, email: "user#{i}@example.com", password: 'password123')
        create(:reaction, user: other_user, reactionable: comment, reaction_type: 'like')
      end
      expect(comment.reactions_count).to eq(3)
    end

    it 'counts different reaction types' do
      user1 = create(:user, email: 'user1@example.com', password: 'password123')
      user2 = create(:user, email: 'user2@example.com', password: 'password123')
      create(:reaction, user: user1, reactionable: comment, reaction_type: 'like')
      create(:reaction, user: user2, reactionable: comment, reaction_type: 'love')
      expect(comment.reactions_count).to eq(2)
    end
  end

  describe '#replies_count' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }
    let(:comment) { create(:comment, user: user, commentable: post, description: 'Test comment') }

    it 'returns 0 when there are no replies' do
      expect(comment.replies_count).to eq(0)
    end

    it 'returns correct count of replies' do
      5.times do |i|
        create(:comment, user: user, commentable: comment, description: "Reply #{i}")
      end
      expect(comment.replies_count).to eq(5)
    end

    it 'does not count nested replies (replies to replies)' do
      reply = create(:comment, user: user, commentable: comment, description: 'Reply to comment')
      create(:comment, user: user, commentable: reply, description: 'Reply to reply')
      expect(comment.replies_count).to eq(1)
    end
  end

  describe '#top_level?' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }

    it 'returns true when comment belongs to a post' do
      comment = create(:comment, user: user, commentable: post, description: 'Top level')
      expect(comment.top_level?).to be true
    end

    it 'returns false when comment belongs to another comment' do
      parent_comment = create(:comment, user: user, commentable: post, description: 'Parent')
      reply = create(:comment, user: user, commentable: parent_comment, description: 'Reply')
      expect(reply.top_level?).to be false
    end
  end

  describe '#reply?' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }

    it 'returns false when comment belongs to a post' do
      comment = create(:comment, user: user, commentable: post, description: 'Top level')
      expect(comment.reply?).to be false
    end

    it 'returns true when comment belongs to another comment' do
      parent_comment = create(:comment, user: user, commentable: post, description: 'Parent')
      reply = create(:comment, user: user, commentable: parent_comment, description: 'Reply')
      expect(reply.reply?).to be true
    end
  end

  describe '#root_post' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }

    it 'returns the post when comment is top level' do
      comment = create(:comment, user: user, commentable: post, description: 'Top level')
      expect(comment.root_post).to eq(post)
    end

    it 'returns the root post when comment is a reply' do
      parent_comment = create(:comment, user: user, commentable: post, description: 'Parent')
      reply = create(:comment, user: user, commentable: parent_comment, description: 'Reply')
      expect(reply.root_post).to eq(post)
    end

    it 'returns the root post when comment is deeply nested' do
      comment1 = create(:comment, user: user, commentable: post, description: 'Level 1')
      comment2 = create(:comment, user: user, commentable: comment1, description: 'Level 2')
      comment3 = create(:comment, user: user, commentable: comment2, description: 'Level 3')
      expect(comment3.root_post).to eq(post)
    end

    it 'handles multiple levels of nesting' do
      # Create a 5-level deep comment thread
      current_commentable = post
      5.times do |i|
        comment = create(:comment, user: user, commentable: current_commentable, description: "Level #{i + 1}")
        current_commentable = comment
      end
      expect(current_commentable.root_post).to eq(post)
    end
  end

  # Polymorphic association tests
  describe 'polymorphic associations' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }
    let(:comment) { create(:comment, user: user, commentable: post, description: 'Test comment') }

    describe 'as commentable' do
      it 'can have replies (comments on this comment)' do
        reply = create(:comment, user: user, commentable: comment, description: 'Reply')
        expect(comment.comments).to include(reply)
        expect(reply.commentable).to eq(comment)
      end
    end

    describe 'as reactionable' do
      it 'can have reactions' do
        reaction = create(:reaction, user: user, reactionable: comment, reaction_type: 'like')
        expect(comment.reactions).to include(reaction)
        expect(reaction.reactionable).to eq(comment)
      end
    end
  end

  # Edge cases and error handling
  describe 'edge cases' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }

    describe 'dependent destroy' do
      let(:comment) { create(:comment, user: user, commentable: post, description: 'Test comment') }

      it 'destroys associated reactions when comment is destroyed' do
        reaction = create(:reaction, user: user, reactionable: comment, reaction_type: 'like')
        expect { comment.destroy }.to change { Reaction.count }.by(-1)
      end

      it 'destroys nested comments when comment is destroyed' do
        reply = create(:comment, user: user, commentable: comment, description: 'Reply')
        expect { comment.destroy }.to change { Comment.count }.by(-2)
      end

      it 'destroys deeply nested comments' do
        reply1 = create(:comment, user: user, commentable: comment, description: 'Reply 1')
        reply2 = create(:comment, user: user, commentable: reply1, description: 'Reply 2')
        expect { comment.destroy }.to change { Comment.count }.by(-3)
      end
    end

    describe 'required associations' do
      it 'requires a user' do
        comment = build(:comment, user: nil, commentable: post, description: 'Test')
        expect(comment).not_to be_valid
      end

      it 'requires a commentable' do
        comment = build(:comment, user: user, commentable: nil, description: 'Test')
        expect(comment).not_to be_valid
      end
    end

    describe 'circular references' do
      it 'prevents a comment from being its own parent' do
        comment = create(:comment, user: user, commentable: post, description: 'Test')
        comment.commentable = comment
        expect(comment).not_to be_valid
      end
    end
  end

  # Integration tests
  describe 'integration scenarios' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }

    it 'handles a comment thread with multiple levels' do
      # Create a comment thread
      top_comment = create(:comment, user: user, commentable: post, description: 'Top comment')
      reply1 = create(:comment, user: user, commentable: top_comment, description: 'First reply')
      reply2 = create(:comment, user: user, commentable: top_comment, description: 'Second reply')
      nested_reply = create(:comment, user: user, commentable: reply1, description: 'Nested reply')

      expect(top_comment.top_level?).to be true
      expect(top_comment.replies_count).to eq(2)
      expect(reply1.reply?).to be true
      expect(reply1.replies_count).to eq(1)
      expect(nested_reply.root_post).to eq(post)
    end

    it 'handles comments with reactions' do
      comment = create(:comment, user: user, commentable: post, description: 'Popular comment')

      # Add reactions from different users
      3.times do |i|
        other_user = create(:user, email: "user#{i}@example.com", password: 'password123')
        create(:reaction, user: other_user, reactionable: comment, reaction_type: 'like')
      end

      expect(comment.reactions_count).to eq(3)
      expect(comment.reactions.map(&:reaction_type).uniq).to eq(['like'])
    end

    it 'maintains data integrity across different query methods' do
      comment = create(:comment, user: user, commentable: post, description: 'Test')

      recent_comment = Comment.recent.find(comment.id)
      with_user_comment = Comment.with_user.find(comment.id)

      expect(recent_comment).to eq(comment)
      expect(with_user_comment).to eq(comment)
      expect(with_user_comment.user).to eq(user)
    end

    it 'handles complex nested structure with reactions' do
      # Create nested comments
      comment = create(:comment, user: user, commentable: post, description: 'Parent')
      reply = create(:comment, user: user, commentable: comment, description: 'Child')

      # Add reactions to both
      user1 = create(:user, email: 'user1@example.com', password: 'password123')
      user2 = create(:user, email: 'user2@example.com', password: 'password123')
      create(:reaction, user: user1, reactionable: comment, reaction_type: 'like')
      create(:reaction, user: user2, reactionable: reply, reaction_type: 'love')

      expect(comment.reactions_count).to eq(1)
      expect(reply.reactions_count).to eq(1)
      expect(comment.replies_count).to eq(1)
      expect(reply.root_post).to eq(post)
    end
  end
end
