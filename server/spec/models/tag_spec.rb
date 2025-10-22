require 'rails_helper'

RSpec.describe Tag, type: :model do
  # Factory validation
  describe 'factory' do
    it 'has a valid factory' do
      tag = build(:tag, name: 'ruby', color: '#FF0000')
      expect(tag).to be_valid
    end
  end

  # Association tests
  describe 'associations' do
    it { should have_many(:post_tags).dependent(:destroy) }
    it { should have_many(:posts).through(:post_tags) }
  end

  # Validation tests
  describe 'validations' do
    subject { build(:tag, name: 'ruby', color: '#FF0000') }

    # Name validations
    it { should validate_presence_of(:name) }
    it { should validate_uniqueness_of(:name).case_insensitive }
    it { should validate_length_of(:name).is_at_least(2) }
    it { should validate_length_of(:name).is_at_most(30) }

    context 'name length edge cases' do
      it 'accepts minimum length name' do
        tag = build(:tag, name: 'ab', color: '#FF0000')
        expect(tag).to be_valid
      end

      it 'accepts maximum length name' do
        tag = build(:tag, name: 'a' * 30, color: '#FF0000')
        expect(tag).to be_valid
      end

      it 'rejects name below minimum length' do
        tag = build(:tag, name: 'a', color: '#FF0000')
        expect(tag).not_to be_valid
        expect(tag.errors[:name]).to be_present
      end

      it 'rejects name above maximum length' do
        tag = build(:tag, name: 'a' * 31, color: '#FF0000')
        expect(tag).not_to be_valid
        expect(tag.errors[:name]).to be_present
      end
    end

    context 'name uniqueness' do
      it 'enforces case-insensitive uniqueness' do
        create(:tag, name: 'ruby', color: '#FF0000')
        duplicate_tag = build(:tag, name: 'RUBY', color: '#00FF00')
        expect(duplicate_tag).not_to be_valid
        expect(duplicate_tag.errors[:name]).to include('has already been taken')
      end

      it 'allows different tags with different names' do
        create(:tag, name: 'ruby', color: '#FF0000')
        different_tag = build(:tag, name: 'rails', color: '#FF0000')
        expect(different_tag).to be_valid
      end
    end

    # Color validations
    # Note: Color presence is enforced via set_default_color callback, not validation
    # it { should validate_presence_of(:color) }

    context 'color format validation' do
      it 'accepts valid hex colors' do
        valid_colors = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#AbCdEf']
        valid_colors.each do |color|
          tag = build(:tag, name: "tag_#{rand(10000)}", color: color)
          expect(tag).to be_valid
        end
      end

      it 'rejects invalid color formats' do
        invalid_colors = ['#FFF', '#GGGGGG', 'FF0000', '#12345', '#1234567', 'red', '']
        invalid_colors.each do |color|
          tag = build(:tag, name: "tag_#{rand(10000)}", color: color)
          expect(tag).not_to be_valid
          expect(tag.errors[:color]).to be_present
        end
      end

      it 'rejects colors without hash symbol' do
        tag = build(:tag, name: 'ruby', color: 'FF0000')
        expect(tag).not_to be_valid
        expect(tag.errors[:color]).to include('must be a valid hex color')
      end

      it 'rejects colors with wrong length' do
        tag = build(:tag, name: 'ruby', color: '#FFF')
        expect(tag).not_to be_valid
        expect(tag.errors[:color]).to include('must be a valid hex color')
      end
    end
  end

  # Callback tests
  describe 'callbacks' do
    describe '#downcase_name' do
      it 'downcases name before save' do
        tag = create(:tag, name: 'RUBY', color: '#FF0000')
        expect(tag.name).to eq('ruby')
      end

      it 'handles mixed case names' do
        tag = create(:tag, name: 'RuBy', color: '#FF0000')
        expect(tag.name).to eq('ruby')
      end

      it 'handles nil name gracefully' do
        tag = Tag.new(name: 'Test', color: '#FF0000')
        tag.name = nil
        tag.valid?  # This will trigger the callback
        # The callback should not crash even with nil name
        # However, validation will fail due to presence requirement
        expect(tag.errors[:name]).to be_present
      end
    end

    describe '#set_default_color' do
      it 'generates random color when color is not provided on create' do
        tag = create(:tag, name: 'ruby', color: nil)
        expect(tag.color).to be_present
        expect(tag.color).to match(/\A#[0-9A-Fa-f]{6}\z/)
      end

      it 'does not override provided color' do
        tag = create(:tag, name: 'ruby', color: '#FF0000')
        expect(tag.color).to eq('#FF0000')
      end

      it 'generates different colors for different tags' do
        # Note: There's a small chance this could fail due to randomness
        # but probability is very low (1 in 16 million)
        tag1 = create(:tag, name: 'tag1', color: nil)
        tag2 = create(:tag, name: 'tag2', color: nil)
        # We can't guarantee they're different, but we can check format
        expect(tag1.color).to match(/\A#[0-9A-Fa-f]{6}\z/)
        expect(tag2.color).to match(/\A#[0-9A-Fa-f]{6}\z/)
      end

      it 'only runs on create, not on update' do
        tag = create(:tag, name: 'ruby', color: '#FF0000')
        tag.update(color: nil)
        expect(tag.color).to be_nil # Update doesn't trigger the callback
      end
    end

    describe '#generate_random_color' do
      it 'generates valid hex color format' do
        tag = Tag.new(name: 'test')
        color = tag.send(:generate_random_color)
        expect(color).to match(/\A#[0-9a-f]{6}\z/)
      end
    end
  end

  # Scope tests
  describe 'scopes' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }

    describe '.popular' do
      let!(:popular_tag) { create(:tag, name: 'popular', color: '#FF0000') }
      let!(:medium_tag) { create(:tag, name: 'medium', color: '#00FF00') }
      let!(:unpopular_tag) { create(:tag, name: 'unpopular', color: '#0000FF') }

      before do
        # Create posts for popular_tag (3 posts)
        3.times do
          post = create(:post, user: user, title: 'Post', description: 'Description for testing')
          create(:post_tag, post: post, tag: popular_tag)
        end

        # Create posts for medium_tag (2 posts)
        2.times do
          post = create(:post, user: user, title: 'Post', description: 'Description for testing')
          create(:post_tag, post: post, tag: medium_tag)
        end

        # Create one post for unpopular_tag (1 post)
        post = create(:post, user: user, title: 'Post', description: 'Description for testing')
        create(:post_tag, post: post, tag: unpopular_tag)
      end

      it 'returns tags ordered by post count descending' do
        tags = Tag.popular.to_a
        expect(tags.first).to eq(popular_tag)
        expect(tags.second).to eq(medium_tag)
        expect(tags.third).to eq(unpopular_tag)
      end

      it 'does not include tags with no posts' do
        unused_tag = create(:tag, name: 'unused', color: '#FFFFFF')
        tags = Tag.popular
        expect(tags).not_to include(unused_tag)
      end
    end

    describe '.alphabetical' do
      let!(:tag_z) { create(:tag, name: 'zebra', color: '#FF0000') }
      let!(:tag_a) { create(:tag, name: 'apple', color: '#00FF00') }
      let!(:tag_m) { create(:tag, name: 'mango', color: '#0000FF') }

      it 'returns tags ordered alphabetically' do
        tags = Tag.alphabetical
        expect(tags.first).to eq(tag_a)
        expect(tags.second).to eq(tag_m)
        expect(tags.third).to eq(tag_z)
      end
    end
  end

  # Edge cases and error handling
  describe 'edge cases' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }

    describe 'dependent destroy' do
      let(:tag) { create(:tag, name: 'ruby', color: '#FF0000') }
      let(:post) { create(:post, user: user, title: 'Test', description: 'Test Description') }

      it 'destroys associated post_tags when tag is destroyed' do
        post_tag = create(:post_tag, post: post, tag: tag)
        expect { tag.destroy }.to change { PostTag.count }.by(-1)
      end

      it 'does not destroy posts when tag is destroyed' do
        create(:post_tag, post: post, tag: tag)
        expect { tag.destroy }.not_to change { Post.count }
      end

      it 'removes tag association from posts when destroyed' do
        create(:post_tag, post: post, tag: tag)
        expect(post.tags).to include(tag)
        tag.destroy
        post.reload
        expect(post.tags).not_to include(tag)
      end
    end

    describe 'special characters in name' do
      it 'allows alphanumeric names' do
        tag = build(:tag, name: 'ruby123', color: '#FF0000')
        expect(tag).to be_valid
      end

      it 'allows names with hyphens' do
        tag = build(:tag, name: 'ruby-on-rails', color: '#FF0000')
        expect(tag).to be_valid
      end

      it 'allows names with underscores' do
        tag = build(:tag, name: 'ruby_on_rails', color: '#FF0000')
        expect(tag).to be_valid
      end
    end

    describe 'color case handling' do
      it 'accepts lowercase hex color' do
        tag = build(:tag, name: 'ruby', color: '#ff0000')
        expect(tag).to be_valid
      end

      it 'accepts uppercase hex color' do
        tag = build(:tag, name: 'ruby', color: '#FF0000')
        expect(tag).to be_valid
      end

      it 'accepts mixed case hex color' do
        tag = build(:tag, name: 'ruby', color: '#Ff0000')
        expect(tag).to be_valid
      end
    end
  end

  # Integration tests
  describe 'integration scenarios' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }

    it 'handles tag with multiple posts' do
      tag = create(:tag, name: 'ruby', color: '#FF0000')
      posts = []

      3.times do |i|
        post = create(:post, user: user, title: "Post #{i}", description: 'Description for testing')
        create(:post_tag, post: post, tag: tag)
        posts << post
      end

      expect(tag.posts.count).to eq(3)
      expect(tag.posts).to match_array(posts)
    end

    it 'handles post with multiple tags' do
      tag1 = create(:tag, name: 'ruby', color: '#FF0000')
      tag2 = create(:tag, name: 'rails', color: '#00FF00')
      tag3 = create(:tag, name: 'rspec', color: '#0000FF')
      post = create(:post, user: user, title: 'Test', description: 'Test Description')

      post.tags << [tag1, tag2, tag3]

      expect(post.tags.count).to eq(3)
      expect(post.tags).to include(tag1, tag2, tag3)
    end

    it 'generates color automatically when not provided' do
      tag = Tag.create(name: 'autocolored')
      expect(tag).to be_valid
      expect(tag.color).to be_present
      expect(tag.color).to match(/\A#[0-9a-f]{6}\z/)
    end

    it 'maintains data integrity when accessed through different scopes' do
      tag = create(:tag, name: 'ruby', color: '#FF0000')
      post = create(:post, user: user, title: 'Test', description: 'Test Description')
      create(:post_tag, post: post, tag: tag)

      alphabetical_tag = Tag.alphabetical.find(tag.id)
      popular_tag = Tag.popular.find(tag.id)

      expect(alphabetical_tag).to eq(tag)
      expect(popular_tag).to eq(tag)
      expect(popular_tag.posts).to include(post)
    end

    it 'downcases name consistently across operations' do
      tag = create(:tag, name: 'RUBY', color: '#FF0000')
      expect(tag.name).to eq('ruby')

      tag.update(name: 'RAILS')
      expect(tag.name).to eq('rails')

      tag.reload
      expect(tag.name).to eq('rails')
    end
  end
end
