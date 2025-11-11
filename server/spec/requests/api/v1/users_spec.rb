require 'rails_helper'

RSpec.describe 'Api::V1::Users', type: :request do
  let(:user) { create_confirmed_user }
  let(:other_user) { create_confirmed_user }

  describe 'GET /api/v1/users/:id' do
    let!(:posts) { create_list(:post, 3, user: user, title: 'User Post', description: 'Description for user post') }
    let!(:reactions) do
      posts.each do |post|
        create(:reaction, reactionable: post, user: other_user, reaction_type: 'like')
      end
    end
    let!(:comments) do
      posts.each do |post|
        create(:comment, commentable: post, user: other_user, description: 'Test comment')
      end
    end

    context 'without authentication' do
      it 'returns user profile with stats' do
        get "/api/v1/users/#{user.id}"

        expect(response).to have_http_status(:ok)
        expect(json_response[:user]).to include(
          id: user.id,
          name: user.name,
          email: user.email,
          profile_picture: user.profile_picture,
          bio: user.bio
        )
        expect(json_response[:user][:created_at]).to be_present
      end

      it 'includes user stats' do
        get "/api/v1/users/#{user.id}"

        expect(response).to have_http_status(:ok)
        expect(json_response[:user][:stats]).to include(
          total_posts: 3,
          total_reactions: 3,
          total_comments: 3
        )
      end

      it 'returns correct stats for user with no activity' do
        new_user = create_confirmed_user

        get "/api/v1/users/#{new_user.id}"

        expect(response).to have_http_status(:ok)
        expect(json_response[:user][:stats]).to include(
          total_posts: 0,
          total_reactions: 0,
          total_comments: 0
        )
      end
    end

    context 'with authentication' do
      it 'returns user profile when authenticated' do
        get "/api/v1/users/#{user.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:user][:id]).to eq(user.id)
      end
    end

    context 'with non-existent user' do
      it 'returns 404 not found' do
        get '/api/v1/users/99999'

        expect(response).to have_http_status(:not_found)
        expect(json_response[:error]).to eq('User not found')
      end
    end

    context 'stats calculation' do
      it 'calculates total_reactions from all user posts' do
        post1 = posts.first
        # Create reactions with different users since there's a uniqueness constraint
        2.times do
          reaction_user = create_confirmed_user
          create(:reaction, reactionable: post1, user: reaction_user, reaction_type: 'love')
        end

        get "/api/v1/users/#{user.id}"

        expect(json_response[:user][:stats][:total_reactions]).to eq(5) # 3 existing + 2 new
      end

      it 'calculates total_comments from all user posts' do
        post1 = posts.first
        create_list(:comment, 2, commentable: post1, user: create_confirmed_user, description: 'New comment')

        get "/api/v1/users/#{user.id}"

        expect(json_response[:user][:stats][:total_comments]).to eq(5) # 3 existing + 2 new
      end
    end
  end

  describe 'PUT /api/v1/users/:id' do
    let(:update_params) do
      {
        user: {
          name: 'Updated Name',
          bio: 'Updated bio description',
          profile_picture: 'http://example.com/new-pic.jpg'
        }
      }
    end

    context 'updating own profile' do
      it 'updates user profile and returns 200' do
        put "/api/v1/users/#{user.id}", params: update_params, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:message]).to eq('Profile updated successfully')
        expect(json_response[:user]).to include(
          name: 'Updated Name',
          bio: 'Updated bio description',
          profile_picture: 'http://example.com/new-pic.jpg'
        )

        user.reload
        expect(user.name).to eq('Updated Name')
        expect(user.bio).to eq('Updated bio description')
      end

      it 'can update only name' do
        put "/api/v1/users/#{user.id}",
            params: { user: { name: 'New Name Only' } },
            headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        user.reload
        expect(user.name).to eq('New Name Only')
      end

      it 'can update only bio' do
        put "/api/v1/users/#{user.id}",
            params: { user: { bio: 'New bio only' } },
            headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        user.reload
        expect(user.bio).to eq('New bio only')
      end

      it 'can update only profile_picture' do
        put "/api/v1/users/#{user.id}",
            params: { user: { profile_picture: 'http://example.com/pic.jpg' } },
            headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        user.reload
        expect(user.profile_picture).to eq('http://example.com/pic.jpg')
      end

      it 'can clear bio by setting to empty string' do
        user.update(bio: 'Existing bio')

        put "/api/v1/users/#{user.id}",
            params: { user: { bio: '' } },
            headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        user.reload
        expect(user.bio).to be_blank
      end
    end

    context 'updating another users profile' do
      it 'returns 403 forbidden' do
        original_name = other_user.name

        put "/api/v1/users/#{other_user.id}", params: update_params, headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
        expect(json_response[:error]).to eq('Forbidden: You can only update your own profile')

        other_user.reload
        expect(other_user.name).to eq(original_name)
      end
    end

    context 'without authentication' do
      it 'returns 401 unauthorized' do
        put "/api/v1/users/#{user.id}", params: update_params

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with invalid parameters' do
      it 'returns 422 when name is too short' do
        put "/api/v1/users/#{user.id}",
            params: { user: { name: 'A' } },
            headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response[:errors]).to include(a_string_matching(/Name.*too short/))
      end

      it 'returns 422 when name is too long' do
        put "/api/v1/users/#{user.id}",
            params: { user: { name: 'a' * 51 } },
            headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response[:errors]).to include(a_string_matching(/Name.*too long/))
      end

      it 'returns 422 when bio is too long' do
        put "/api/v1/users/#{user.id}",
            params: { user: { bio: 'a' * 501 } },
            headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response[:errors]).to include(a_string_matching(/Bio.*too long/))
      end

      it 'returns 422 when name is empty' do
        put "/api/v1/users/#{user.id}",
            params: { user: { name: '' } },
            headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response[:errors]).to include(a_string_matching(/Name/))
      end
    end

    context 'with non-existent user' do
      it 'returns 404 not found' do
        put '/api/v1/users/99999', params: update_params, headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
        expect(json_response[:error]).to eq('User not found')
      end
    end

    context 'restricted fields' do
      it 'does not allow updating email' do
        original_email = user.email

        put "/api/v1/users/#{user.id}",
            params: { user: { email: 'newemail@example.com' } },
            headers: auth_headers(user)

        user.reload
        expect(user.email).to eq(original_email)
      end

      it 'does not allow updating password directly' do
        put "/api/v1/users/#{user.id}",
            params: { user: { password: 'newpassword' } },
            headers: auth_headers(user)

        # Password should not be updated through this endpoint
        expect(user.authenticate('password123')).to be_truthy
      end

      it 'does not allow updating confirmed_at' do
        put "/api/v1/users/#{user.id}",
            params: { user: { confirmed_at: nil } },
            headers: auth_headers(user)

        user.reload
        expect(user.confirmed?).to be true
      end
    end
  end

  describe 'GET /api/v1/users/:id/posts' do
    let!(:posts) { create_list(:post, 15, user: user, title: 'User Post', description: 'Description for user post') }
    let!(:other_posts) { create_list(:post, 3, user: other_user, title: 'Other Post', description: 'Other Description') }

    before do
      tag = create(:tag, name: 'ruby', color: '#cc0000')
      # Add tag to the last post (which will be newest and on first page)
      posts.last.tags << tag
      posts.last.reload
    end

    context 'without authentication' do
      it 'returns user posts with default pagination' do
        get "/api/v1/users/#{user.id}/posts"

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(10)
        expect(json_response[:meta]).to include(
          current_page: 1,
          per_page: 10,
          total_count: 15,
          total_pages: 2
        )
      end

      it 'includes post summary details' do
        get "/api/v1/users/#{user.id}/posts"

        post = json_response[:posts].first
        expect(post).to include(
          :id,
          :title,
          :description,
          :picture,
          :tags,
          :reactions_count,
          :comments_count,
          :created_at
        )
        expect(post[:tags]).to be_an(Array)
      end

      it 'includes tags with details' do
        get "/api/v1/users/#{user.id}/posts"

        post_with_tag = json_response[:posts].find { |p| p[:tags].any? }
        tag = post_with_tag[:tags].first
        expect(tag).to include(:id, :name, :color)
      end

      it 'includes the full description' do
        long_description = 'a' * 200
        post = create(:post, user: user, title: 'Long Post', description: long_description)

        get "/api/v1/users/#{user.id}/posts"

        post_result = json_response[:posts].find { |p| p[:id] == post.id }
        expect(post_result[:description].length).to eq(200)
        expect(post_result[:description]).to eq(long_description)
      end

      it 'returns posts ordered by created_at desc' do
        get "/api/v1/users/#{user.id}/posts"

        timestamps = json_response[:posts].map { |p| Time.parse(p[:created_at]) }
        expect(timestamps).to eq(timestamps.sort.reverse)
      end

      it 'only returns posts for specified user' do
        get "/api/v1/users/#{user.id}/posts"

        expect(json_response[:posts].size).to eq(10)
        expect(json_response[:meta][:total_count]).to eq(15)
      end
    end

    context 'with pagination' do
      it 'accepts page parameter' do
        get "/api/v1/users/#{user.id}/posts", params: { page: 2 }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(5)
        expect(json_response[:meta][:current_page]).to eq(2)
      end

      it 'accepts per_page parameter' do
        get "/api/v1/users/#{user.id}/posts", params: { per_page: 5 }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(5)
        expect(json_response[:meta][:per_page]).to eq(5)
      end

      it 'limits per_page to maximum of 50' do
        get "/api/v1/users/#{user.id}/posts", params: { per_page: 100 }

        expect(response).to have_http_status(:ok)
        expect(json_response[:meta][:per_page]).to eq(50)
      end

      it 'returns empty array for page beyond total pages' do
        get "/api/v1/users/#{user.id}/posts", params: { page: 100 }

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts]).to eq([])
      end
    end

    context 'with authentication' do
      it 'returns user posts when authenticated' do
        get "/api/v1/users/#{user.id}/posts", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(10)
      end
    end

    context 'when user has no posts' do
      it 'returns empty array' do
        new_user = create_confirmed_user

        get "/api/v1/users/#{new_user.id}/posts"

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts]).to eq([])
        expect(json_response[:meta][:total_count]).to eq(0)
      end
    end

    context 'with non-existent user' do
      it 'returns 404 not found' do
        get '/api/v1/users/99999/posts'

        expect(response).to have_http_status(:not_found)
        expect(json_response[:error]).to eq('User not found')
      end
    end

    context 'posts with reactions and comments' do
      it 'includes reactions_count and comments_count' do
        # Use last created post which will be in the first page (ordered by created_at desc)
        post = posts.last
        # Create reactions with different users since there's a uniqueness constraint
        3.times do
          reaction_user = create_confirmed_user
          create(:reaction, reactionable: post, user: reaction_user, reaction_type: 'like')
        end
        create_list(:comment, 5, commentable: post, user: other_user, description: 'Test comment')

        get "/api/v1/users/#{user.id}/posts"

        post_result = json_response[:posts].find { |p| p[:id] == post.id }
        expect(post_result[:reactions_count]).to eq(3)
        expect(post_result[:comments_count]).to eq(5)
      end
    end

    context 'when viewing posts with reactions from the current user' do
      let!(:post_to_react_to) { posts.last } # Use .last as it's guaranteed to be on the first page
      let!(:reaction) { create(:reaction, reactionable: post_to_react_to, user: other_user, reaction_type: 'love') }

      it 'includes the user_reaction in the response' do
        # Make request as 'other_user' who made the reaction
        get "/api/v1/users/#{user.id}/posts", headers: auth_headers(other_user)

        expect(response).to have_http_status(:ok)

        post_result = json_response[:posts].find { |p| p[:id] == post_to_react_to.id }

        expect(post_result[:user_reaction]).not_to be_nil
        expect(post_result[:user_reaction][:id]).to eq(reaction.id)
        expect(post_result[:user_reaction][:reaction_type]).to eq('love')
        expect(post_result[:user_reaction][:reactionable_id]).to eq(post_to_react_to.id)
      end
    end
  end

  describe 'edge cases and data integrity' do
    it 'handles user with very long bio' do
      user.update(bio: 'a' * 500) # max length

      get "/api/v1/users/#{user.id}"

      expect(response).to have_http_status(:ok)
      expect(json_response[:user][:bio].length).to eq(500)
    end

    it 'handles user with special characters in name' do
      user.update(name: "O'Connor-Smith")

      get "/api/v1/users/#{user.id}"

      expect(response).to have_http_status(:ok)
      expect(json_response[:user][:name]).to eq("O'Connor-Smith")
    end

    it 'handles user with nil bio' do
      user.update(bio: nil)

      get "/api/v1/users/#{user.id}"

      expect(response).to have_http_status(:ok)
      expect(json_response[:user][:bio]).to be_nil
    end

    it 'handles user with default profile picture' do
      get "/api/v1/users/#{user.id}"

      expect(response).to have_http_status(:ok)
      expect(json_response[:user][:profile_picture]).to be_present
    end
  end

  describe 'GET /api/v1/users/search' do
    let!(:user1) { create_confirmed_user(name: 'John Doe', email: 'john.doe@example.com') }
    let!(:user2) { create_confirmed_user(name: 'Jane Doe', email: 'jane.doe@example.com') }
    let!(:user3) { create_confirmed_user(name: 'Peter Jones', email: 'peter.jones@example.com') }

    context 'with a query that matches users' do
      it 'returns the matched users' do
        get '/api/v1/users/search', params: { q: 'Doe' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:users].size).to eq(2)
        expect(json_response[:users].map { |u| u[:name] }).to contain_exactly('John Doe', 'Jane Doe')
      end
    end

    context 'with a query that does not match any user' do
      it 'returns an empty array' do
        get '/api/v1/users/search', params: { q: 'Unmatched' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:users]).to be_empty
        expect(json_response[:meta][:total_count]).to eq(0)
      end
    end

    context 'with an empty query' do
      it 'returns an empty array' do
        get '/api/v1/users/search', params: { q: '' }

        expect(response).to have_http_status(:ok)
        expect(json_response[:users]).to be_empty
        expect(json_response[:meta][:total_count]).to eq(0)
      end
    end

    context 'with pagination' do
      before do
        # Create more users to test pagination
        5.times { |i| create_confirmed_user(name: "Doe #{i}") }
      end

      it 'paginates the results' do
        get '/api/v1/users/search', params: { q: 'Doe', per_page: 3 }

        expect(response).to have_http_status(:ok)
        expect(json_response[:users].size).to eq(3)
        expect(json_response[:meta][:total_count]).to eq(7) # 2 original + 5 new
        expect(json_response[:meta][:total_pages]).to eq(3)
        expect(json_response[:meta][:current_page]).to eq(1)
      end

      it 'fetches the second page' do
        get '/api/v1/users/search', params: { q: 'Doe', per_page: 3, page: 2 }

        expect(response).to have_http_status(:ok)
        expect(json_response[:users].size).to eq(3)
        expect(json_response[:meta][:current_page]).to eq(2)
      end
    end
  end

  describe 'PATCH /api/v1/users/:id/preferences' do
    let(:update_params) { { theme: 'dark', language: 'es' } }

    context 'when updating own preferences' do
      it 'updates the preferences and returns a success message' do
        patch "/api/v1/users/#{user.id}/preferences", params: update_params, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:message]).to eq('Preferences updated successfully')
        expect(json_response[:preferences]).to include(theme: 'dark', language: 'es')

        user.reload
        expect(user.theme).to eq('dark')
        expect(user.language).to eq('es')
      end
    end

    context 'when updating another user\'s preferences' do
      it 'returns a forbidden error' do
        patch "/api/v1/users/#{other_user.id}/preferences", params: update_params, headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
        expect(json_response[:error]).to eq('Forbidden: You can only update your own profile')
      end
    end

    context 'with invalid params' do
      it 'does not update the preferences' do
        patch "/api/v1/users/#{user.id}/preferences", params: { unsupported: 'value' }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        user.reload
        expect(user.theme).not_to eq('unsupported')
      end
    end
  end

  describe 'PUT /api/v1/users/profile' do
    let(:update_params) do
      {
        user: {
          name: 'Updated Name',
          bio: 'Updated bio',
          avatar: fixture_file_upload(Rails.root.join('spec/fixtures/files/avatar.png'), 'image/png')
        }
      }
    end

    context 'when authenticated' do
      it 'updates the current user profile' do
        put '/api/v1/users/profile', params: update_params, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:message]).to eq('Profile updated successfully')
        expect(json_response[:user][:name]).to eq('Updated Name')

        user.reload
        expect(user.name).to eq('Updated Name')
        expect(user.bio).to eq('Updated bio')
        expect(user.avatar.attached?).to be(true)
        expect(user.avatar.filename.to_s).to eq('avatar.png')
      end
    end

    context 'when not authenticated' do
      it 'returns an unauthorized error' do
        put '/api/v1/users/profile', params: update_params

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with invalid data' do
      it 'returns an unprocessable entity error' do
        put '/api/v1/users/profile', params: { user: { name: 'a' * 51 } }, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response[:errors]).to include(a_string_matching(/Name.*too long/))
      end
    end
  end
end
