require 'rails_helper'

RSpec.describe Post, type: :model do
  # Factory validation
  describe 'factory' do
    it 'has a valid factory' do
      user = create(:user, email: 'test@example.com', password: 'password123')
      post = build(:post, user: user, title: 'Test Post', description: 'Test Description with enough characters')
      expect(post).to be_valid
    end
  end

  # Association tests
  describe 'associations' do
    it { should belong_to(:user) }
    it { should have_many(:comments).dependent(:destroy) }
    it { should have_many(:reactions).dependent(:destroy) }
    it { should have_many(:post_tags).dependent(:destroy) }
    it { should have_many(:tags).through(:post_tags) }
  end

  # Validation tests
  describe 'validations' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    subject { build(:post, user: user, title: 'Test Post', description: 'Test Description with enough characters') }

    # Title validations
    it { should validate_presence_of(:title) }
    it { should validate_length_of(:title).is_at_least(3) }
    it { should validate_length_of(:title).is_at_most(200) }

    context 'title length edge cases' do
      it 'accepts minimum length title' do
        post = build(:post, user: user, title: 'abc', description: 'Test Description')
        expect(post).to be_valid
      end

      it 'accepts maximum length title' do
        post = build(:post, user: user, title: 'a' * 200, description: 'Test Description')
        expect(post).to be_valid
      end

      it 'rejects title below minimum length' do
        post = build(:post, user: user, title: 'ab', description: 'Test Description')
        expect(post).not_to be_valid
        expect(post.errors[:title]).to be_present
      end

      it 'rejects title above maximum length' do
        post = build(:post, user: user, title: 'a' * 201, description: 'Test Description')
        expect(post).not_to be_valid
        expect(post.errors[:title]).to be_present
      end
    end

    # Description validations
    it { should validate_presence_of(:description) }
    it { should validate_length_of(:description).is_at_least(10) }
    it { should validate_length_of(:description).is_at_most(5000) }

    context 'description length edge cases' do
      it 'accepts minimum length description' do
        post = build(:post, user: user, title: 'Test', description: 'a' * 10)
        expect(post).to be_valid
      end

      it 'accepts maximum length description' do
        post = build(:post, user: user, title: 'Test', description: 'a' * 5000)
        expect(post).to be_valid
      end

      it 'rejects description below minimum length' do
        post = build(:post, user: user, title: 'Test', description: 'a' * 9)
        expect(post).not_to be_valid
        expect(post.errors[:description]).to be_present
      end

      it 'rejects description above maximum length' do
        post = build(:post, user: user, title: 'Test', description: 'a' * 5001)
        expect(post).not_to be_valid
        expect(post.errors[:description]).to be_present
      end
    end
  end

  # Scope tests
  describe 'scopes' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let!(:older_post) do
      create(:post, user: user, title: 'Older Post', description: 'Older Description', created_at: 2.days.ago)
    end
    let!(:newer_post) do
      create(:post, user: user, title: 'Newer Post', description: 'Newer Description', created_at: 1.day.ago)
    end
    let!(:newest_post) do
      create(:post, user: user, title: 'Newest Post', description: 'Newest Description', created_at: Time.current)
    end

    describe '.recent' do
      it 'returns posts ordered by created_at descending' do
        posts = Post.recent
        expect(posts.first).to eq(newest_post)
        expect(posts.second).to eq(newer_post)
        expect(posts.third).to eq(older_post)
      end
    end

    describe '.with_user' do
      it 'eager loads user association' do
        posts = Post.with_user
        expect(posts.first.association(:user)).to be_loaded
      end

      it 'returns all posts with users' do
        posts = Post.with_user
        expect(posts.count).to eq(3)
        expect(posts.map(&:user).uniq).to eq([ user ])
      end
    end

    describe '.with_counts' do
      before do
        # Add comments and reactions to older_post
        3.times do |i|
          create(:comment, user: user, commentable: older_post, description: "Comment #{i}")
        end
        2.times do
          create(:reaction, user: create(:user, email: "user#{rand(10000)}@example.com", password: 'password123'), reactionable: older_post, reaction_type: 'like')
        end

        # Add one comment to newer_post
        create(:comment, user: user, commentable: newer_post, description: 'Single comment')
      end

      it 'includes comment counts' do
        posts = Post.all.index_by(&:id)
        expect(posts[older_post.id].comments_count.to_i).to eq(3)
        expect(posts[newer_post.id].comments_count.to_i).to eq(1)
        expect(posts[newest_post.id].comments_count.to_i).to eq(0)
      end

      it 'includes reaction counts' do
        posts = Post.all.index_by(&:id)
        expect(posts[older_post.id].reactions_count.to_i).to eq(2)
        expect(posts[newer_post.id].reactions_count.to_i).to eq(0)
      end
    end
  end

  # Instance method tests
  describe '#reactions_count' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test Post', description: 'Test Description') }

    it 'returns 0 when there are no reactions' do
      expect(post.reactions_count).to eq(0)
    end

    it 'returns correct count of reactions' do
      3.times do |i|
        create(:reaction, user: create(:user, email: "user#{i}@example.com", password: 'password123'), reactionable: post, reaction_type: 'like')
      end
      expect(post.reactions_count).to eq(3)
    end

    it 'counts different reaction types' do
      create(:reaction, user: create(:user, email: 'user1@example.com', password: 'password123'), reactionable: post, reaction_type: 'like')
      create(:reaction, user: create(:user, email: 'user2@example.com', password: 'password123'), reactionable: post, reaction_type: 'love')
      create(:reaction, user: create(:user, email: 'user3@example.com', password: 'password123'), reactionable: post, reaction_type: 'dislike')
      expect(post.reactions_count).to eq(3)
    end
  end

  describe '#comments_count' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test Post', description: 'Test Description') }

    it 'returns 0 when there are no comments' do
      expect(post.comments_count).to eq(0)
    end

    it 'returns correct count of comments' do
      5.times do |i|
        create(:comment, user: user, commentable: post, description: "Comment #{i}")
      end
      expect(post.comments_count).to eq(5)
    end

    it 'does not include nested replies in count' do
      comment = create(:comment, user: user, commentable: post, description: 'Top level comment')
      create(:comment, user: user, commentable: comment, description: 'Reply to comment')
      expect(post.comments_count).to eq(1)
    end
  end

  describe '#last_three_comments' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test Post', description: 'Test Description') }

    it 'returns empty array when there are no comments' do
      expect(post.last_three_comments).to be_empty
    end

    it 'returns all comments when there are fewer than 3' do
      comment1 = create(:comment, user: user, commentable: post, description: 'Comment 1')
      comment2 = create(:comment, user: user, commentable: post, description: 'Comment 2')

      comments = post.last_three_comments
      expect(comments.count).to eq(2)
      expect(comments).to include(comment1, comment2)
    end

    it 'returns only the last 3 comments when there are more' do
      5.times do |i|
        create(:comment, user: user, commentable: post, description: "Comment #{i}", created_at: i.hours.ago)
      end

      comments = post.last_three_comments
      expect(comments.count).to eq(3)
    end

    it 'returns comments in descending order by created_at' do
      comment1 = create(:comment, user: user, commentable: post, description: 'Oldest', created_at: 3.hours.ago)
      comment2 = create(:comment, user: user, commentable: post, description: 'Middle', created_at: 2.hours.ago)
      comment3 = create(:comment, user: user, commentable: post, description: 'Newest', created_at: 1.hour.ago)

      comments = post.last_three_comments
      expect(comments.first).to eq(comment3)
      expect(comments.second).to eq(comment2)
      expect(comments.third).to eq(comment1)
    end

    it 'eager loads user association' do
      create(:comment, user: user, commentable: post, description: 'Comment')
      comments = post.last_three_comments
      expect(comments.first.association(:user)).to be_loaded
    end
  end

  # Polymorphic association tests
  describe 'polymorphic associations' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test Post', description: 'Test Description') }

    describe 'as commentable' do
      it 'can have comments' do
        comment = create(:comment, user: user, commentable: post, description: 'Test comment')
        expect(post.comments).to include(comment)
        expect(comment.commentable).to eq(post)
      end
    end

    describe 'as reactionable' do
      it 'can have reactions' do
        reaction = create(:reaction, user: user, reactionable: post, reaction_type: 'like')
        expect(post.reactions).to include(reaction)
        expect(reaction.reactionable).to eq(post)
      end
    end
  end

  # Edge cases and error handling
  describe 'edge cases' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }

    describe 'dependent destroy' do
      let(:post) { create(:post, user: user, title: 'Test Post', description: 'Test Description') }

      it 'destroys associated comments when post is destroyed' do
        comment = create(:comment, user: user, commentable: post, description: 'Test Comment')
        expect { post.destroy }.to change { Comment.count }.by(-1)
      end

      it 'destroys associated reactions when post is destroyed' do
        reaction = create(:reaction, user: user, reactionable: post, reaction_type: 'like')
        expect { post.destroy }.to change { Reaction.count }.by(-1)
      end

      it 'destroys associated post_tags when post is destroyed' do
        tag = create(:tag, name: 'test_tag')
        post_tag = create(:post_tag, post: post, tag: tag)
        expect { post.destroy }.to change { PostTag.count }.by(-1)
      end

      it 'destroys nested comments (replies to comments)' do
        comment = create(:comment, user: user, commentable: post, description: 'Top Comment')
        reply = create(:comment, user: user, commentable: comment, description: 'Reply')
        expect { post.destroy }.to change { Comment.count }.by(-2)
      end
    end

    describe 'user association requirement' do
      it 'requires a user' do
        post = build(:post, user: nil, title: 'Test Post', description: 'Test Description')
        expect(post).not_to be_valid
      end

      it 'is valid with a user' do
        post = build(:post, user: user, title: 'Test Post', description: 'Test Description')
        expect(post).to be_valid
      end
    end

    describe 'picture field' do
      it 'accepts nil picture' do
        post = build(:post, user: user, title: 'Test', description: 'Test Description', picture: nil)
        expect(post).to be_valid
      end

      it 'accepts valid picture URL' do
        post = build(:post, user: user, title: 'Test', description: 'Test Description', picture: 'https://example.com/image.jpg')
        expect(post).to be_valid
        expect(post.picture).to eq('https://example.com/image.jpg')
      end
    end

    describe 'tags association' do
      let(:post) { create(:post, user: user, title: 'Test Post', description: 'Test Description') }

      it 'can have multiple tags' do
        tag1 = create(:tag, name: 'ruby')
        tag2 = create(:tag, name: 'rails')
        tag3 = create(:tag, name: 'rspec')

        post.tags << [ tag1, tag2, tag3 ]
        expect(post.tags.count).to eq(3)
        expect(post.tags).to include(tag1, tag2, tag3)
      end

      it 'can have no tags' do
        expect(post.tags).to be_empty
      end

      it 'does not destroy tags when post is destroyed' do
        tag = create(:tag, name: 'ruby')
        post.tags << tag
        expect { post.destroy }.not_to change { Tag.count }
      end
    end
  end

  # Integration tests
  describe 'integration scenarios' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Popular Post', description: 'A popular post with engagement') }

    it 'handles a post with multiple interactions' do
      # Add tags
      tag1 = create(:tag, name: 'ruby')
      tag2 = create(:tag, name: 'rails')
      post.tags << [ tag1, tag2 ]

      # Add comments
      3.times do |i|
        create(:comment, user: user, commentable: post, description: "Comment #{i}")
      end

      # Add reactions
      2.times do |i|
        other_user = create(:user, email: "user#{i}@example.com", password: 'password123')
        create(:reaction, user: other_user, reactionable: post, reaction_type: 'like')
      end

      expect(post.tags.count).to eq(2)
      expect(post.comments_count).to eq(3)
      expect(post.reactions_count).to eq(2)
    end

    it 'maintains data integrity when accessed through different scopes' do
      post.reload

      recent_post = Post.recent.find(post.id)
      with_user_post = Post.with_user.find(post.id)

      expect(recent_post).to eq(post)
      expect(with_user_post).to eq(post)
      expect(with_user_post.user).to eq(user)
    end
  end
end
