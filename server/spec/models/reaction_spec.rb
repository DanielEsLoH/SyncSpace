require 'rails_helper'

RSpec.describe Reaction, type: :model do
  # Factory validation
  describe 'factory' do
    it 'has a valid factory for post reaction' do
      user = create(:user, email: 'test@example.com', password: 'password123')
      post = create(:post, user: user, title: 'Test Post', description: 'Test Description')
      reaction = build(:reaction, user: user, reactionable: post, reaction_type: 'like')
      expect(reaction).to be_valid
    end

    it 'has a valid factory for comment reaction' do
      user = create(:user, email: 'test@example.com', password: 'password123')
      post = create(:post, user: user, title: 'Test Post', description: 'Test Description')
      comment = create(:comment, user: user, commentable: post, description: 'Test comment')
      reaction = build(:reaction, user: user, reactionable: comment, reaction_type: 'love')
      expect(reaction).to be_valid
    end
  end

  # Association tests
  describe 'associations' do
    it { should belong_to(:user) }
    it { should belong_to(:reactionable) }

    context 'polymorphic reactionable association' do
      let(:user) { create(:user, email: 'test@example.com', password: 'password123') }

      it 'can belong to a post' do
        post = create(:post, user: user, title: 'Test', description: 'Test Description')
        reaction = create(:reaction, user: user, reactionable: post, reaction_type: 'like')
        expect(reaction.reactionable_type).to eq('Post')
        expect(reaction.reactionable).to eq(post)
      end

      it 'can belong to a comment' do
        post = create(:post, user: user, title: 'Test', description: 'Test Description')
        comment = create(:comment, user: user, commentable: post, description: 'Comment')
        reaction = create(:reaction, user: user, reactionable: comment, reaction_type: 'like')
        expect(reaction.reactionable_type).to eq('Comment')
        expect(reaction.reactionable).to eq(comment)
      end
    end
  end

  # Validation tests
  describe 'validations' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }
    subject { build(:reaction, user: user, reactionable: post, reaction_type: 'like') }

    it { should validate_presence_of(:reaction_type) }
    it { should validate_inclusion_of(:reaction_type).in_array(Reaction::REACTION_TYPES) }

    context 'reaction_type validation' do
      it 'accepts valid reaction types' do
        Reaction::REACTION_TYPES.each do |type|
          reaction = build(:reaction, user: user, reactionable: post, reaction_type: type)
          expect(reaction).to be_valid
        end
      end

      it 'rejects invalid reaction types' do
        invalid_types = [ 'invalid', 'happy', 'sad', '' ]
        invalid_types.each do |type|
          reaction = build(:reaction, user: user, reactionable: post, reaction_type: type)
          expect(reaction).not_to be_valid
          expect(reaction.errors[:reaction_type]).to be_present
        end
      end
    end

    context 'uniqueness validation' do
      it 'validates uniqueness of user_id scoped to reactionable (prevents multiple reactions)' do
        create(:reaction, user: user, reactionable: post, reaction_type: 'like')
        duplicate_reaction = build(:reaction, user: user, reactionable: post, reaction_type: 'like')
        expect(duplicate_reaction).not_to be_valid
        expect(duplicate_reaction.errors[:user_id]).to include('has already reacted to this')
      end

      it 'prevents same user from having multiple reaction types on same reactionable' do
        create(:reaction, user: user, reactionable: post, reaction_type: 'like')
        different_reaction = build(:reaction, user: user, reactionable: post, reaction_type: 'love')
        expect(different_reaction).not_to be_valid
        expect(different_reaction.errors[:user_id]).to include('has already reacted to this')
      end

      it 'allows same user to react with same type on different reactionables' do
        post1 = create(:post, user: user, title: 'Post 1', description: 'Description 1')
        post2 = create(:post, user: user, title: 'Post 2', description: 'Description 2')
        create(:reaction, user: user, reactionable: post1, reaction_type: 'like')
        reaction = build(:reaction, user: user, reactionable: post2, reaction_type: 'like')
        expect(reaction).to be_valid
      end

      it 'allows different users to react with same type on same reactionable' do
        user2 = create(:user, email: 'user2@example.com', password: 'password123')
        create(:reaction, user: user, reactionable: post, reaction_type: 'like')
        reaction = build(:reaction, user: user2, reactionable: post, reaction_type: 'like')
        expect(reaction).to be_valid
      end
    end
  end

  # Scope tests
  describe 'scopes' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }
    let(:user2) { create(:user, email: 'user2@example.com', password: 'password123') }
    let(:user3) { create(:user, email: 'user3@example.com', password: 'password123') }

    let!(:like_reaction) { create(:reaction, user: user, reactionable: post, reaction_type: 'like') }
    let!(:love_reaction) { create(:reaction, user: user2, reactionable: post, reaction_type: 'love') }
    let!(:dislike_reaction) { create(:reaction, user: user3, reactionable: post, reaction_type: 'dislike') }

    describe '.likes' do
      it 'returns only like reactions' do
        expect(Reaction.likes).to include(like_reaction)
        expect(Reaction.likes).not_to include(love_reaction, dislike_reaction)
      end
    end

    describe '.loves' do
      it 'returns only love reactions' do
        expect(Reaction.loves).to include(love_reaction)
        expect(Reaction.loves).not_to include(like_reaction, dislike_reaction)
      end
    end

    describe '.dislikes' do
      it 'returns only dislike reactions' do
        expect(Reaction.dislikes).to include(dislike_reaction)
        expect(Reaction.dislikes).not_to include(like_reaction, love_reaction)
      end
    end

    describe '.for_user' do
      it 'returns reactions for specific user' do
        expect(Reaction.for_user(user.id)).to include(like_reaction)
        expect(Reaction.for_user(user.id)).not_to include(love_reaction, dislike_reaction)
      end

      it 'returns multiple reactions for user if they exist' do
        comment = create(:comment, user: user, commentable: post, description: 'Comment')
        like_reaction2 = create(:reaction, user: user, reactionable: comment, reaction_type: 'love')
        expect(Reaction.for_user(user.id)).to include(like_reaction, like_reaction2)
        expect(Reaction.for_user(user.id).count).to eq(2)
      end
    end
  end

  # Class method tests
  describe '.toggle' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }

    context 'when reaction does not exist' do
      it 'creates a new reaction' do
        expect {
          Reaction.toggle(user: user, reactionable: post, reaction_type: 'like')
        }.to change { Reaction.count }.by(1)
      end

      it 'returns action: added' do
        result = Reaction.toggle(user: user, reactionable: post, reaction_type: 'like')
        expect(result[:action]).to eq('added')
      end

      it 'returns the created reaction' do
        result = Reaction.toggle(user: user, reactionable: post, reaction_type: 'like')
        expect(result[:reaction]).to be_a(Reaction)
        expect(result[:reaction].user).to eq(user)
        expect(result[:reaction].reactionable).to eq(post)
        expect(result[:reaction].reaction_type).to eq('like')
      end

      it 'persists the reaction to the database' do
        result = Reaction.toggle(user: user, reactionable: post, reaction_type: 'like')
        expect(result[:reaction].persisted?).to be true
      end
    end

    context 'when reaction already exists' do
      let!(:existing_reaction) do
        create(:reaction, user: user, reactionable: post, reaction_type: 'like')
      end

      it 'destroys the existing reaction' do
        expect {
          Reaction.toggle(user: user, reactionable: post, reaction_type: 'like')
        }.to change { Reaction.count }.by(-1)
      end

      it 'returns action: removed' do
        result = Reaction.toggle(user: user, reactionable: post, reaction_type: 'like')
        expect(result[:action]).to eq('removed')
      end

      it 'returns nil for reaction' do
        result = Reaction.toggle(user: user, reactionable: post, reaction_type: 'like')
        expect(result[:reaction]).to be_nil
      end

      it 'removes the reaction from the database' do
        Reaction.toggle(user: user, reactionable: post, reaction_type: 'like')
        expect(Reaction.exists?(existing_reaction.id)).to be false
      end
    end

    context 'toggling different reaction types' do
      it 'changes reaction type when user clicks different reaction' do
        Reaction.toggle(user: user, reactionable: post, reaction_type: 'like')
        result = Reaction.toggle(user: user, reactionable: post, reaction_type: 'love')
        expect(result[:action]).to eq('changed')
        expect(result[:reaction].reaction_type).to eq('love')
        expect(Reaction.count).to eq(1)  # Only 1 reaction, not 2
      end

      it 'replaces old reaction when toggling to different type' do
        reaction = Reaction.toggle(user: user, reactionable: post, reaction_type: 'like')[:reaction]
        original_id = reaction.id

        result = Reaction.toggle(user: user, reactionable: post, reaction_type: 'love')

        # Same reaction record, just updated type
        expect(result[:reaction].id).to eq(original_id)
        expect(result[:reaction].reaction_type).to eq('love')
        expect(Reaction.where(user: user, reactionable: post).count).to eq(1)
      end
    end

    context 'toggling on different reactionables' do
      it 'handles reactions on posts' do
        result = Reaction.toggle(user: user, reactionable: post, reaction_type: 'like')
        expect(result[:action]).to eq('added')
        expect(result[:reaction].reactionable_type).to eq('Post')
      end

      it 'handles reactions on comments' do
        comment = create(:comment, user: user, commentable: post, description: 'Comment')
        result = Reaction.toggle(user: user, reactionable: comment, reaction_type: 'like')
        expect(result[:action]).to eq('added')
        expect(result[:reaction].reactionable_type).to eq('Comment')
      end
    end
  end

  # Edge cases and error handling
  describe 'edge cases' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }

    describe 'required associations' do
      it 'requires a user' do
        reaction = build(:reaction, user: nil, reactionable: post, reaction_type: 'like')
        expect(reaction).not_to be_valid
      end

      it 'requires a reactionable' do
        reaction = build(:reaction, user: user, reactionable: nil, reaction_type: 'like')
        expect(reaction).not_to be_valid
      end
    end

    describe 'constant REACTION_TYPES' do
      it 'is defined' do
        expect(Reaction::REACTION_TYPES).to be_a(Array)
      end

      it 'contains expected reaction types' do
        expect(Reaction::REACTION_TYPES).to include('like', 'love', 'dislike')
      end

      it 'is frozen to prevent modification' do
        expect(Reaction::REACTION_TYPES).to be_frozen
      end
    end

    describe 'destroying reactionable' do
      it 'destroys reactions when post is destroyed' do
        reaction = create(:reaction, user: user, reactionable: post, reaction_type: 'like')
        expect { post.destroy }.to change { Reaction.count }.by(-1)
      end

      it 'destroys reactions when comment is destroyed' do
        comment = create(:comment, user: user, commentable: post, description: 'Comment')
        reaction = create(:reaction, user: user, reactionable: comment, reaction_type: 'like')
        expect { comment.destroy }.to change { Reaction.count }.by(-1)
      end
    end

    describe 'destroying user' do
      it 'destroys reactions when user is destroyed' do
        create(:reaction, user: user, reactionable: post, reaction_type: 'like')
        expect { user.destroy }.to change { Reaction.count }.by(-1)
      end
    end
  end

  # Integration tests
  describe 'integration scenarios' do
    let(:user1) { create(:user, email: 'user1@example.com', password: 'password123') }
    let(:user2) { create(:user, email: 'user2@example.com', password: 'password123') }
    let(:user3) { create(:user, email: 'user3@example.com', password: 'password123') }
    let(:post) { create(:post, user: user1, title: 'Popular Post', description: 'A popular post') }

    it 'handles multiple users reacting to the same post' do
      Reaction.toggle(user: user1, reactionable: post, reaction_type: 'like')
      Reaction.toggle(user: user2, reactionable: post, reaction_type: 'like')
      Reaction.toggle(user: user3, reactionable: post, reaction_type: 'love')

      expect(post.reactions.count).to eq(3)
      expect(Reaction.likes.count).to eq(2)
      expect(Reaction.loves.count).to eq(1)
    end

    it 'handles user toggling reactions multiple times' do
      # Add like
      Reaction.toggle(user: user1, reactionable: post, reaction_type: 'like')
      expect(post.reactions.count).to eq(1)

      # Remove like
      Reaction.toggle(user: user1, reactionable: post, reaction_type: 'like')
      expect(post.reactions.count).to eq(0)

      # Add like again
      Reaction.toggle(user: user1, reactionable: post, reaction_type: 'like')
      expect(post.reactions.count).to eq(1)
    end

    it 'handles user changing reaction type' do
      # Add like
      result1 = Reaction.toggle(user: user1, reactionable: post, reaction_type: 'like')
      expect(result1[:action]).to eq('added')
      expect(Reaction.likes.count).to eq(1)

      # Change to love (replaces like, doesn't coexist)
      result2 = Reaction.toggle(user: user1, reactionable: post, reaction_type: 'love')
      expect(result2[:action]).to eq('changed')
      expect(post.reactions.count).to eq(1)  # Only 1 reaction total
      expect(Reaction.likes.count).to eq(0)  # Like was replaced
      expect(Reaction.loves.count).to eq(1)

      # Remove love
      result3 = Reaction.toggle(user: user1, reactionable: post, reaction_type: 'love')
      expect(result3[:action]).to eq('removed')
      expect(post.reactions.count).to eq(0)
    end

    it 'handles reactions across posts and comments' do
      comment = create(:comment, user: user1, commentable: post, description: 'Great post!')

      # React to post
      Reaction.toggle(user: user2, reactionable: post, reaction_type: 'like')
      # React to comment
      Reaction.toggle(user: user2, reactionable: comment, reaction_type: 'like')

      expect(post.reactions.count).to eq(1)
      expect(comment.reactions.count).to eq(1)
      expect(Reaction.for_user(user2.id).count).to eq(2)
    end

    it 'maintains reaction counts when filtered by scope' do
      Reaction.toggle(user: user1, reactionable: post, reaction_type: 'like')
      Reaction.toggle(user: user2, reactionable: post, reaction_type: 'like')
      Reaction.toggle(user: user3, reactionable: post, reaction_type: 'dislike')

      comment = create(:comment, user: user1, commentable: post, description: 'Comment')
      Reaction.toggle(user: user1, reactionable: comment, reaction_type: 'love')

      expect(Reaction.likes.count).to eq(2)
      expect(Reaction.dislikes.count).to eq(1)
      expect(Reaction.loves.count).to eq(1)
      expect(Reaction.count).to eq(4)
    end
  end
end
