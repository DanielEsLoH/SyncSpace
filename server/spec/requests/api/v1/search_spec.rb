require 'rails_helper'

RSpec.describe 'Api::V1::Search', type: :request do
  let(:user1) { create_confirmed_user(name: 'John Doe', email: 'john@example.com') }
  let(:user2) { create_confirmed_user(name: 'Jane Smith', email: 'jane@example.com') }
  let(:user3) { create_confirmed_user(name: 'Bob Johnson', email: 'bob@example.com') }

  let!(:ruby_tag) { create(:tag, name: 'ruby', color: '#cc0000') }
  let!(:rails_tag) { create(:tag, name: 'rails', color: '#cc0000') }
  let!(:python_tag) { create(:tag, name: 'python', color: '#3776ab') }

  let!(:post1) do
    create(:post, user: user1, title: 'Ruby on Rails Tutorial', description: 'Learn Ruby on Rails framework basics')
  end

  let!(:post2) do
    create(:post, user: user2, title: 'Python Django Guide', description: 'Complete guide to Django web framework')
  end

  let!(:post3) do
    create(:post, user: user3, title: 'JavaScript React Introduction', description: 'Introduction to React library and components')
  end

  let!(:post4) do
    create(:post, user: user1, title: 'Advanced Ruby Patterns', description: 'Design patterns in Ruby programming language')
  end

  before do
    post1.tags << [ruby_tag, rails_tag]
    post2.tags << python_tag
    post4.tags << ruby_tag
  end

  describe 'GET /api/v1/search' do
    context 'without authentication' do
      it 'allows searching without authentication' do
        get '/api/v1/search', params: { q: 'ruby' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts]).to be_an(Array)
      end
    end

    context 'searching by title' do
      it 'returns posts matching title' do
        get '/api/v1/search', params: { title: 'Ruby' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(2)
        titles = json_response[:posts].map { |p| p[:title] }
        expect(titles).to include('Ruby on Rails Tutorial', 'Advanced Ruby Patterns')
      end

      it 'is case insensitive' do
        get '/api/v1/search', params: { title: 'RUBY' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(2)
      end

      it 'performs partial matching' do
        get '/api/v1/search', params: { title: 'Tutorial' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(1)
        expect(json_response[:posts].first[:title]).to eq('Ruby on Rails Tutorial')
      end

      it 'returns empty array when no matches' do
        get '/api/v1/search', params: { title: 'NonExistent' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts]).to eq([])
        expect(json_response[:meta][:total_count]).to eq(0)
      end
    end

    context 'searching by user' do
      it 'returns posts by user name' do
        get '/api/v1/search', params: { user: 'John' }

        expect(response).to have_http_status(:ok)
        # Matches both "John Doe" (2 posts) and "Bob Johnson" (1 post) = 3 posts total
        expect(json_response[:posts].size).to eq(3)
        user_names = json_response[:posts].map { |p| p[:user][:name] }.uniq.sort
        expect(user_names).to match_array(['Bob Johnson', 'John Doe'])
      end

      it 'returns posts by user email' do
        get '/api/v1/search', params: { user: 'jane' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(1)
        expect(json_response[:posts].first[:user][:name]).to eq('Jane Smith')
      end

      it 'handles @ symbol in user search' do
        get '/api/v1/search', params: { user: '@john' }

        expect(response).to have_http_status(:ok)
        # Matches both "John Doe" (2 posts) and "Bob Johnson" (1 post) = 3 posts total
        expect(json_response[:posts].size).to eq(3)
      end

      it 'handles @email format in user search' do
        get '/api/v1/search', params: { user: '@jane' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(1)
      end

      it 'is case insensitive' do
        get '/api/v1/search', params: { user: 'JANE' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(1)
      end

      it 'performs partial matching on name' do
        get '/api/v1/search', params: { user: 'Joh' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(3) # John Doe and Bob Johnson
      end
    end

    context 'searching by tag' do
      it 'returns posts with matching tag' do
        get '/api/v1/search', params: { tag: 'ruby' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(2)
        json_response[:posts].each do |post|
          tag_names = post[:tags].map { |t| t[:name] }
          expect(tag_names).to include('ruby')
        end
      end

      it 'is case insensitive' do
        get '/api/v1/search', params: { tag: 'RUBY' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(2)
      end

      it 'performs partial matching' do
        get '/api/v1/search', params: { tag: 'rail' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(1)
        expect(json_response[:posts].first[:title]).to eq('Ruby on Rails Tutorial')
      end

      it 'returns empty array for non-existent tag' do
        get '/api/v1/search', params: { tag: 'java' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts]).to eq([])
      end
    end

    context 'general search with q parameter' do
      it 'searches across title, description, user name, and tags' do
        get '/api/v1/search', params: { q: 'Ruby' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to be >= 2
      end

      it 'finds posts by description content' do
        get '/api/v1/search', params: { q: 'framework' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(2) # Rails and Django
      end

      it 'finds posts by user name' do
        get '/api/v1/search', params: { q: 'Jane' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(1)
      end

      it 'finds posts by tag name' do
        get '/api/v1/search', params: { q: 'python' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(1)
        expect(json_response[:posts].first[:title]).to eq('Python Django Guide')
      end

      it 'is case insensitive' do
        get '/api/v1/search', params: { q: 'REACT' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(1)
      end
    end

    context 'combining search parameters' do
      it 'combines title and tag search' do
        get '/api/v1/search', params: { title: 'Ruby', tag: 'rails' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(1)
        expect(json_response[:posts].first[:title]).to eq('Ruby on Rails Tutorial')
      end

      it 'combines user and tag search' do
        get '/api/v1/search', params: { user: 'John', tag: 'ruby' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(2)
      end
    end

    context 'with pagination' do
      before do
        create_list(:post, 15, user: user1, title: 'Search Test Post', description: 'Description for search test post')
      end

      it 'returns paginated results with default values' do
        get '/api/v1/search', params: { title: 'Test' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(10)
        expect(json_response[:meta]).to include(
          current_page: 1,
          per_page: 10,
          total_count: 15,
          total_pages: 2
        )
      end

      it 'accepts page and per_page parameters' do
        get '/api/v1/search', params: { title: 'Test', page: 2, per_page: 5 }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(5)
        expect(json_response[:meta]).to include(
          current_page: 2,
          per_page: 5,
          total_pages: 3
        )
      end

      it 'limits per_page to maximum of 50' do
        get '/api/v1/search', params: { title: 'Test', per_page: 100 }

        expect(response).to have_http_status(:ok)
        expect(json_response[:meta][:per_page]).to eq(50)
      end
    end

    context 'search result format' do
      it 'includes post summary with user and tags' do
        get '/api/v1/search', params: { q: 'Ruby' }

        post_result = json_response[:posts].first
        expect(post_result).to include(
          :id,
          :title,
          :description,
          :picture,
          :user,
          :tags,
          :created_at
        )
        expect(post_result[:user]).to include(:id, :name, :profile_picture)
        expect(post_result[:tags]).to be_an(Array)
      end

      it 'includes description excerpt (truncated)' do
        long_description = 'a' * 300
        post = create(:post, user: user1, title: 'Long Post', description: long_description)

        get '/api/v1/search', params: { title: 'Long' }

        post_result = json_response[:posts].first
        expect(post_result[:description].length).to be <= 204 # 200 + '...'
        expect(post_result[:description]).to end_with('...')
      end

      it 'includes tag details with id, name, and color' do
        get '/api/v1/search', params: { tag: 'ruby' }

        post_result = json_response[:posts].first
        ruby_tag_result = post_result[:tags].find { |t| t[:name] == 'ruby' }
        expect(ruby_tag_result).to include(
          :id,
          :name,
          :color
        )
      end
    end

    context 'ordering' do
      it 'returns results ordered by created_at desc' do
        get '/api/v1/search', params: { q: 'Ruby' }

        timestamps = json_response[:posts].map { |p| Time.parse(p[:created_at]) }
        expect(timestamps).to eq(timestamps.sort.reverse)
      end
    end

    context 'edge cases' do
      it 'returns all posts when no search params provided' do
        get '/api/v1/search'

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(4)
        expect(json_response[:meta][:total_count]).to eq(4)
      end

      it 'handles empty search query' do
        get '/api/v1/search', params: { q: '' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(4)
      end

      it 'handles special characters in search' do
        get '/api/v1/search', params: { q: 'Ruby & Rails' }

        expect(response).to have_http_status(:ok)
      end

      it 'returns distinct posts when matching multiple fields' do
        # Post1 matches both in title and tags
        get '/api/v1/search', params: { q: 'Ruby' }

        expect(response).to have_http_status(:ok)
        post_ids = json_response[:posts].map { |p| p[:id] }
        expect(post_ids.uniq).to eq(post_ids) # no duplicates
      end
    end

    context 'with authentication' do
      it 'works with authenticated user' do
        get '/api/v1/search', params: { q: 'Ruby' }, headers: auth_headers(user1)

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts]).to be_an(Array)
      end
    end
  end
end
