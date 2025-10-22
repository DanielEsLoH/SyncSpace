require 'rails_helper'

RSpec.describe 'Api::V1::Tags', type: :request do
  let(:user) { create_confirmed_user }
  let(:other_user) { create_confirmed_user }

  describe 'GET /api/v1/tags' do
    let!(:ruby_tag) { create(:tag, name: 'ruby', color: '#cc0000') }
    let!(:rails_tag) { create(:tag, name: 'rails', color: '#cc0000') }
    let!(:python_tag) { create(:tag, name: 'python', color: '#3776ab') }
    let!(:javascript_tag) { create(:tag, name: 'javascript', color: '#f7df1e') }

    before do
      # Create posts with tags to test popularity
      post1 = create(:post, user: user, title: 'Ruby Post 1', description: 'Description for ruby post 1')
      post2 = create(:post, user: user, title: 'Ruby Post 2', description: 'Description for ruby post 2')
      post3 = create(:post, user: user, title: 'Ruby Post 3', description: 'Description for ruby post 3')
      post4 = create(:post, user: user, title: 'Rails Post', description: 'Description for rails post')
      post5 = create(:post, user: user, title: 'Python Post', description: 'Description for python post')

      post1.tags << ruby_tag
      post2.tags << ruby_tag
      post3.tags << ruby_tag
      post4.tags << rails_tag
      post5.tags << python_tag
    end

    context 'without authentication' do
      it 'returns all tags ordered alphabetically by default' do
        get '/api/v1/tags'

        expect(response).to have_http_status(:ok)
        expect(json_response[:tags].size).to eq(4)

        tag_names = json_response[:tags].map { |t| t[:name] }
        expect(tag_names).to eq(tag_names.sort)
      end

      it 'includes tag details with posts_count' do
        get '/api/v1/tags'

        ruby_tag_response = json_response[:tags].find { |t| t[:name] == 'ruby' }
        expect(ruby_tag_response).to include(
          id: ruby_tag.id,
          name: 'ruby',
          color: '#cc0000',
          posts_count: 3
        )
      end

      it 'returns correct posts_count for each tag' do
        get '/api/v1/tags'

        expect(json_response[:tags].find { |t| t[:name] == 'ruby' }[:posts_count]).to eq(3)
        expect(json_response[:tags].find { |t| t[:name] == 'rails' }[:posts_count]).to eq(1)
        expect(json_response[:tags].find { |t| t[:name] == 'python' }[:posts_count]).to eq(1)
        expect(json_response[:tags].find { |t| t[:name] == 'javascript' }[:posts_count]).to eq(0)
      end
    end

    context 'sorting by popularity' do
      it 'returns tags ordered by posts count desc when sort=popular' do
        get '/api/v1/tags', params: { sort: 'popular' }

        expect(response).to have_http_status(:ok)
        posts_counts = json_response[:tags].map { |t| t[:posts_count] }
        expect(posts_counts).to eq(posts_counts.sort.reverse)

        # Ruby should be first (3 posts)
        expect(json_response[:tags].first[:name]).to eq('ruby')
      end

      it 'includes tags with no posts when sorting by popularity' do
        get '/api/v1/tags', params: { sort: 'popular' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:tags].size).to eq(4)

        # JavaScript should be last (0 posts)
        expect(json_response[:tags].last[:name]).to eq('javascript')
        expect(json_response[:tags].last[:posts_count]).to eq(0)
      end
    end

    context 'sorting alphabetically' do
      it 'returns tags ordered by name when no sort param' do
        get '/api/v1/tags'

        expect(response).to have_http_status(:ok)
        tag_names = json_response[:tags].map { |t| t[:name] }
        expect(tag_names).to eq(['javascript', 'python', 'rails', 'ruby'])
      end

      it 'returns tags ordered by name when sort=alphabetical' do
        get '/api/v1/tags', params: { sort: 'alphabetical' }

        expect(response).to have_http_status(:ok)
        tag_names = json_response[:tags].map { |t| t[:name] }
        expect(tag_names).to eq(tag_names.sort)
      end
    end

    context 'with authentication' do
      it 'returns tags when authenticated' do
        get '/api/v1/tags', headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:tags].size).to eq(4)
      end
    end

    context 'when no tags exist' do
      it 'returns empty array' do
        Tag.destroy_all

        get '/api/v1/tags'

        expect(response).to have_http_status(:ok)
        expect(json_response[:tags]).to eq([])
      end
    end
  end

  describe 'GET /api/v1/tags/:id' do
    let(:tag) { create(:tag, name: 'ruby', color: '#cc0000') }
    let!(:posts) { create_list(:post, 3, user: user, title: 'Ruby Post', description: 'Description for ruby post') }

    before do
      posts.each { |post| post.tags << tag }
    end

    context 'without authentication' do
      it 'returns tag details' do
        get "/api/v1/tags/#{tag.id}"

        expect(response).to have_http_status(:ok)
        expect(json_response[:tag]).to include(
          id: tag.id,
          name: 'ruby',
          color: '#cc0000',
          posts_count: 3
        )
      end

      it 'returns correct posts_count' do
        get "/api/v1/tags/#{tag.id}"

        expect(response).to have_http_status(:ok)
        expect(json_response[:tag][:posts_count]).to eq(3)
      end
    end

    context 'with authentication' do
      it 'returns tag details when authenticated' do
        get "/api/v1/tags/#{tag.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:tag][:id]).to eq(tag.id)
      end
    end

    context 'with non-existent tag' do
      it 'returns 404 not found' do
        get '/api/v1/tags/99999'

        expect(response).to have_http_status(:not_found)
        expect(json_response[:error]).to eq('Tag not found')
      end
    end

    context 'tag with no posts' do
      it 'returns posts_count of 0' do
        new_tag = create(:tag, name: 'unused', color: '#000000')

        get "/api/v1/tags/#{new_tag.id}"

        expect(response).to have_http_status(:ok)
        expect(json_response[:tag][:posts_count]).to eq(0)
      end
    end
  end

  describe 'GET /api/v1/tags/:id/posts' do
    let(:tag) { create(:tag, name: 'ruby', color: '#cc0000') }
    let!(:tagged_posts) { create_list(:post, 15, user: user, title: 'Ruby Post', description: 'Description for ruby post') }
    let!(:other_posts) { create_list(:post, 5, user: other_user, title: 'Python Post', description: 'Description for python post') }

    before do
      tagged_posts.each { |post| post.tags << tag }
    end

    context 'without authentication' do
      it 'returns posts with the tag with default pagination' do
        get "/api/v1/tags/#{tag.id}/posts"

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(10)
        expect(json_response[:meta]).to include(
          current_page: 1,
          per_page: 10,
          total_count: 15,
          total_pages: 2
        )
      end

      it 'includes tag details in response' do
        get "/api/v1/tags/#{tag.id}/posts"

        expect(response).to have_http_status(:ok)
        expect(json_response[:tag]).to include(
          id: tag.id,
          name: 'ruby',
          color: '#cc0000',
          posts_count: 15
        )
      end

      it 'includes post summary details' do
        get "/api/v1/tags/#{tag.id}/posts"

        post = json_response[:posts].first
        expect(post).to include(
          :id,
          :title,
          :description,
          :created_at
        )
        expect(post[:user]).to include(:id, :name)
      end

      it 'includes truncated description' do
        long_description = 'a' * 200
        post = create(:post, user: user, title: 'Long Post', description: long_description)
        post.tags << tag

        get "/api/v1/tags/#{tag.id}/posts"

        post_result = json_response[:posts].find { |p| p[:id] == post.id }
        expect(post_result[:description].length).to be <= 154 # 150 + '...'
        expect(post_result[:description]).to end_with('...')
      end

      it 'returns posts ordered by created_at desc' do
        get "/api/v1/tags/#{tag.id}/posts"

        timestamps = json_response[:posts].map { |p| Time.parse(p[:created_at]) }
        expect(timestamps).to eq(timestamps.sort.reverse)
      end

      it 'only returns posts with the specified tag' do
        get "/api/v1/tags/#{tag.id}/posts"

        expect(json_response[:posts].size).to eq(10)
        expect(json_response[:meta][:total_count]).to eq(15)
      end
    end

    context 'with pagination' do
      it 'accepts page parameter' do
        get "/api/v1/tags/#{tag.id}/posts", params: { page: 2 }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(5)
        expect(json_response[:meta][:current_page]).to eq(2)
      end

      it 'accepts per_page parameter' do
        get "/api/v1/tags/#{tag.id}/posts", params: { per_page: 5 }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(5)
        expect(json_response[:meta][:per_page]).to eq(5)
      end

      it 'limits per_page to maximum of 50' do
        get "/api/v1/tags/#{tag.id}/posts", params: { per_page: 100 }

        expect(response).to have_http_status(:ok)
        expect(json_response[:meta][:per_page]).to eq(50)
      end

      it 'returns empty array for page beyond total pages' do
        get "/api/v1/tags/#{tag.id}/posts", params: { page: 100 }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts]).to eq([])
      end
    end

    context 'with authentication' do
      it 'returns tagged posts when authenticated' do
        get "/api/v1/tags/#{tag.id}/posts", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(10)
      end
    end

    context 'when tag has no posts' do
      it 'returns empty posts array' do
        new_tag = create(:tag, name: 'unused', color: '#000000')

        get "/api/v1/tags/#{new_tag.id}/posts"

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts]).to eq([])
        expect(json_response[:meta][:total_count]).to eq(0)
        expect(json_response[:tag][:posts_count]).to eq(0)
      end
    end

    context 'with non-existent tag' do
      it 'returns 404 not found' do
        get '/api/v1/tags/99999/posts'

        expect(response).to have_http_status(:not_found)
        expect(json_response[:error]).to eq('Tag not found')
      end
    end

    context 'posts by multiple users' do
      it 'returns posts from different users with the same tag' do
        other_user_post = create(:post, user: other_user, title: 'Other Ruby Post', description: 'Description for other ruby post')
        other_user_post.tags << tag

        get "/api/v1/tags/#{tag.id}/posts"

        expect(response).to have_http_status(:ok)
        expect(json_response[:meta][:total_count]).to eq(16)

        user_ids = json_response[:posts].map { |p| p[:user][:id] }.uniq
        expect(user_ids.size).to be > 1
      end
    end

    context 'post with user details' do
      it 'includes user id and name for each post' do
        get "/api/v1/tags/#{tag.id}/posts"

        post = json_response[:posts].first
        expect(post[:user]).to include(
          id: user.id,
          name: user.name
        )
      end
    end
  end

  describe 'tag edge cases' do
    it 'handles tag with special characters in name' do
      tag = create(:tag, name: 'c++', color: '#00599c')

      get "/api/v1/tags/#{tag.id}"

      expect(response).to have_http_status(:ok)
      expect(json_response[:tag][:name]).to eq('c++')
    end

    it 'handles tag with maximum allowed name length' do
      # Maximum is 30 characters
      long_name = 'a' * 30
      tag = create(:tag, name: long_name, color: '#000000')

      get "/api/v1/tags/#{tag.id}"

      expect(response).to have_http_status(:ok)
      expect(json_response[:tag][:name]).to eq(long_name)
    end

    it 'handles tag with hex color code' do
      tag = create(:tag, name: 'ruby', color: '#cc0000')

      get "/api/v1/tags/#{tag.id}"

      expect(response).to have_http_status(:ok)
      expect(json_response[:tag][:color]).to eq('#cc0000')
    end
  end

  describe 'tag posts count accuracy' do
    it 'reflects accurate count after adding posts' do
      tag = create(:tag, name: 'test', color: '#000000')

      get "/api/v1/tags/#{tag.id}"
      expect(json_response[:tag][:posts_count]).to eq(0)

      post = create(:post, user: user, title: 'Test Post', description: 'Description for test post')
      post.tags << tag

      get "/api/v1/tags/#{tag.id}"
      expect(json_response[:tag][:posts_count]).to eq(1)
    end

    it 'reflects accurate count after removing posts' do
      tag = create(:tag, name: 'test', color: '#000000')
      post = create(:post, user: user, title: 'Test Post', description: 'Description for test post')
      post.tags << tag

      get "/api/v1/tags/#{tag.id}"
      expect(json_response[:tag][:posts_count]).to eq(1)

      post.destroy

      get "/api/v1/tags/#{tag.id}"
      expect(json_response[:tag][:posts_count]).to eq(0)
    end
  end

  describe 'posts with multiple tags' do
    it 'returns posts that have the specified tag along with others' do
      ruby_tag = create(:tag, name: 'ruby', color: '#cc0000')
      rails_tag = create(:tag, name: 'rails', color: '#cc0000')

      post = create(:post, user: user, title: 'Rails Post', description: 'Description for rails post')
      post.tags << [ruby_tag, rails_tag]

      get "/api/v1/tags/#{ruby_tag.id}/posts"

      expect(response).to have_http_status(:ok)
      expect(json_response[:posts].size).to eq(1)
      expect(json_response[:posts].first[:id]).to eq(post.id)
    end

    it 'does not duplicate posts when they appear in query' do
      tag = create(:tag, name: 'ruby', color: '#cc0000')
      post = create(:post, user: user, title: 'Ruby Post', description: 'Description for ruby post')
      post.tags << tag

      get "/api/v1/tags/#{tag.id}/posts"

      post_ids = json_response[:posts].map { |p| p[:id] }
      expect(post_ids.uniq).to eq(post_ids)
    end
  end
end
