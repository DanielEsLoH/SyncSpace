require 'rails_helper'

RSpec.describe PostTag, type: :model do
  # Factory validation
  describe 'factory' do
    it 'has a valid factory' do
      user = create(:user, email: 'test@example.com', password: 'password123')
      post = create(:post, user: user, title: 'Test Post', description: 'Test Description')
      tag = create(:tag, name: 'ruby', color: '#FF0000')
      post_tag = build(:post_tag, post: post, tag: tag)
      expect(post_tag).to be_valid
    end
  end

  # Association tests
  describe 'associations' do
    it { should belong_to(:post) }
    it { should belong_to(:tag) }

    context 'association behavior' do
      let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
      let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }
      let(:tag) { create(:tag, name: 'ruby', color: '#FF0000') }

      it 'correctly associates post and tag' do
        post_tag = create(:post_tag, post: post, tag: tag)
        expect(post_tag.post).to eq(post)
        expect(post_tag.tag).to eq(tag)
      end

      it 'adds tag to post through association' do
        post_tag = create(:post_tag, post: post, tag: tag)
        expect(post.tags).to include(tag)
      end

      it 'adds post to tag through association' do
        post_tag = create(:post_tag, post: post, tag: tag)
        expect(tag.posts).to include(post)
      end
    end
  end

  # Validation tests
  describe 'validations' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }
    let(:tag) { create(:tag, name: 'ruby', color: '#FF0000') }

    subject { build(:post_tag, post: post, tag: tag) }

    context 'uniqueness validation' do
      it 'validates uniqueness of post_id scoped to tag_id' do
        create(:post_tag, post: post, tag: tag)
        duplicate_post_tag = build(:post_tag, post: post, tag: tag)
        expect(duplicate_post_tag).not_to be_valid
        expect(duplicate_post_tag.errors[:post_id]).to include('already has this tag')
      end

      it 'allows same tag on different posts' do
        post2 = create(:post, user: user, title: 'Another Post', description: 'Another Description')
        create(:post_tag, post: post, tag: tag)
        post_tag2 = build(:post_tag, post: post2, tag: tag)
        expect(post_tag2).to be_valid
      end

      it 'allows different tags on same post' do
        tag2 = create(:tag, name: 'rails', color: '#00FF00')
        create(:post_tag, post: post, tag: tag)
        post_tag2 = build(:post_tag, post: post, tag: tag2)
        expect(post_tag2).to be_valid
      end

      it 'prevents duplicate post-tag combinations' do
        create(:post_tag, post: post, tag: tag)
        expect {
          create(:post_tag, post: post, tag: tag)
        }.to raise_error(ActiveRecord::RecordInvalid)
      end
    end

    context 'required associations' do
      it 'requires a post' do
        post_tag = build(:post_tag, post: nil, tag: tag)
        expect(post_tag).not_to be_valid
      end

      it 'requires a tag' do
        post_tag = build(:post_tag, post: post, tag: nil)
        expect(post_tag).not_to be_valid
      end
    end
  end

  # Edge cases and error handling
  describe 'edge cases' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }
    let(:tag) { create(:tag, name: 'ruby', color: '#FF0000') }

    describe 'cascading deletes' do
      it 'is deleted when post is deleted' do
        post_tag = create(:post_tag, post: post, tag: tag)
        expect { post.destroy }.to change { PostTag.count }.by(-1)
      end

      it 'is deleted when tag is deleted' do
        post_tag = create(:post_tag, post: post, tag: tag)
        expect { tag.destroy }.to change { PostTag.count }.by(-1)
      end

      it 'does not delete post when post_tag is deleted' do
        post_tag = create(:post_tag, post: post, tag: tag)
        expect { post_tag.destroy }.not_to change { Post.count }
      end

      it 'does not delete tag when post_tag is deleted' do
        post_tag = create(:post_tag, post: post, tag: tag)
        expect { post_tag.destroy }.not_to change { Tag.count }
      end
    end

    describe 'multiple tags on single post' do
      it 'allows a post to have multiple tags' do
        tag1 = create(:tag, name: 'ruby', color: '#FF0000')
        tag2 = create(:tag, name: 'rails', color: '#00FF00')
        tag3 = create(:tag, name: 'rspec', color: '#0000FF')

        post_tag1 = create(:post_tag, post: post, tag: tag1)
        post_tag2 = create(:post_tag, post: post, tag: tag2)
        post_tag3 = create(:post_tag, post: post, tag: tag3)

        expect(post.post_tags.count).to eq(3)
        expect(post.tags).to include(tag1, tag2, tag3)
      end
    end

    describe 'multiple posts with same tag' do
      it 'allows a tag to be used on multiple posts' do
        post1 = create(:post, user: user, title: 'Post 1', description: 'Description 1')
        post2 = create(:post, user: user, title: 'Post 2', description: 'Description 2')
        post3 = create(:post, user: user, title: 'Post 3', description: 'Description 3')

        post_tag1 = create(:post_tag, post: post1, tag: tag)
        post_tag2 = create(:post_tag, post: post2, tag: tag)
        post_tag3 = create(:post_tag, post: post3, tag: tag)

        expect(tag.post_tags.count).to eq(3)
        expect(tag.posts).to include(post1, post2, post3)
      end
    end
  end

  # Integration tests
  describe 'integration scenarios' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }

    it 'handles complex many-to-many relationship' do
      # Create multiple posts
      post1 = create(:post, user: user, title: 'Ruby Post', description: 'About Ruby')
      post2 = create(:post, user: user, title: 'Rails Post', description: 'About Rails')
      post3 = create(:post, user: user, title: 'Full Stack Post', description: 'About everything')

      # Create multiple tags
      ruby_tag = create(:tag, name: 'ruby', color: '#FF0000')
      rails_tag = create(:tag, name: 'rails', color: '#00FF00')
      testing_tag = create(:tag, name: 'testing', color: '#0000FF')

      # Create associations
      # Post 1: Ruby tag only
      create(:post_tag, post: post1, tag: ruby_tag)

      # Post 2: Rails tag only
      create(:post_tag, post: post2, tag: rails_tag)

      # Post 3: All three tags
      create(:post_tag, post: post3, tag: ruby_tag)
      create(:post_tag, post: post3, tag: rails_tag)
      create(:post_tag, post: post3, tag: testing_tag)

      # Verify associations
      expect(post1.tags.count).to eq(1)
      expect(post1.tags).to include(ruby_tag)

      expect(post2.tags.count).to eq(1)
      expect(post2.tags).to include(rails_tag)

      expect(post3.tags.count).to eq(3)
      expect(post3.tags).to include(ruby_tag, rails_tag, testing_tag)

      expect(ruby_tag.posts).to include(post1, post3)
      expect(rails_tag.posts).to include(post2, post3)
      expect(testing_tag.posts).to include(post3)
    end

    it 'maintains referential integrity when removing tags' do
      post = create(:post, user: user, title: 'Test', description: 'Test Description')
      tag1 = create(:tag, name: 'tag1', color: '#FF0000')
      tag2 = create(:tag, name: 'tag2', color: '#00FF00')

      post_tag1 = create(:post_tag, post: post, tag: tag1)
      post_tag2 = create(:post_tag, post: post, tag: tag2)

      expect(post.tags.count).to eq(2)

      # Remove one tag association
      post_tag1.destroy

      expect(post.tags.count).to eq(1)
      expect(post.tags).to include(tag2)
      expect(post.tags).not_to include(tag1)
    end

    it 'handles tag removal via post.tags association' do
      post = create(:post, user: user, title: 'Test', description: 'Test Description')
      tag1 = create(:tag, name: 'tag1', color: '#FF0000')
      tag2 = create(:tag, name: 'tag2', color: '#00FF00')

      post.tags << [tag1, tag2]
      expect(post.tags.count).to eq(2)

      # Remove tag using ActiveRecord association
      post.tags.delete(tag1)
      expect(post.tags.count).to eq(1)
      expect(post.tags).to include(tag2)
      expect(PostTag.where(post: post, tag: tag1).exists?).to be false
    end

    it 'handles bulk tag assignment' do
      post = create(:post, user: user, title: 'Test', description: 'Test Description')
      tags = 5.times.map do |i|
        create(:tag, name: "tag#{i}", color: '#FF0000')
      end

      post.tags = tags

      expect(post.tags.count).to eq(5)
      expect(post.tags).to match_array(tags)
      expect(PostTag.where(post: post).count).to eq(5)
    end

    it 'prevents duplicate entries through various creation methods' do
      post = create(:post, user: user, title: 'Test', description: 'Test Description')
      tag = create(:tag, name: 'ruby', color: '#FF0000')

      # Create first association
      create(:post_tag, post: post, tag: tag)

      # Try to create duplicate via direct creation
      expect {
        create(:post_tag, post: post, tag: tag)
      }.to raise_error(ActiveRecord::RecordInvalid)

      # Try to add duplicate via association
      expect {
        post.tags << tag
      }.to raise_error(ActiveRecord::RecordInvalid)

      # Verify only one association exists
      expect(PostTag.where(post: post, tag: tag).count).to eq(1)
    end

    it 'maintains data consistency across database queries' do
      post = create(:post, user: user, title: 'Test', description: 'Test Description')
      tag = create(:tag, name: 'ruby', color: '#FF0000')
      post_tag = create(:post_tag, post: post, tag: tag)

      # Query from different angles
      found_by_post = PostTag.where(post: post).first
      found_by_tag = PostTag.where(tag: tag).first
      found_by_id = PostTag.find(post_tag.id)

      expect(found_by_post).to eq(post_tag)
      expect(found_by_tag).to eq(post_tag)
      expect(found_by_id).to eq(post_tag)
    end
  end
end
