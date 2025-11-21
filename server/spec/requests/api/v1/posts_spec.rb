require 'rails_helper'

RSpec.describe 'Api::V1::Posts', type: :request do
  let(:user) { create_confirmed_user }
  let(:other_user) { create_confirmed_user }
  let!(:tag1) { create(:tag, name: 'ruby', color: '#cc0000') }
  let!(:tag2) { create(:tag, name: 'rails', color: '#cc0000') }

  describe 'GET /api/v1/posts' do
    let!(:posts) { create_list(:post, 15, user: user, title: 'Test Post', description: 'Test Description for post') }
    let!(:other_posts) { create_list(:post, 5, user: other_user, title: 'Other Post', description: 'Other Description for post') }

    context 'without authentication' do
      it 'returns 401 unauthorized' do
        get '/api/v1/posts'

        expect(response).to have_http_status(:unauthorized)
        expect(json_response[:error]).to eq('Unauthorized')
      end
    end

    context 'with authentication' do
      it 'returns all posts with default pagination' do
        get '/api/v1/posts', headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(10) # default per_page
        expect(json_response[:meta]).to include(
          current_page: 1,
          per_page: 10,
          total_count: 20,
          total_pages: 2
        )
      end

      it 'includes post details with user, tags, and counts' do
        # Use last created post which will be in the first page (ordered by created_at desc)
        post = posts.last
        post.tags << tag1

        get '/api/v1/posts', headers: auth_headers(user)

        post_response = json_response[:posts].find { |p| p[:id] == post.id }
        expect(post_response).to include(
          id: post.id,
          title: post.title,
          description: post.description
        )
        expect(post_response[:user]).to include(
          id: user.id,
          name: user.name,
          email: user.email
        )
        expect(post_response[:tags]).to be_an(Array)
        expect(post_response).to have_key(:reactions_count)
        expect(post_response).to have_key(:comments_count)
        expect(post_response).to have_key(:last_three_comments)
      end
    end

    context 'with pagination' do
      it 'returns specified page and per_page' do
        get '/api/v1/posts', params: { page: 2, per_page: 5 }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(5)
        expect(json_response[:meta]).to include(
          current_page: 2,
          per_page: 5,
          total_count: 20,
          total_pages: 4
        )
      end

      it 'limits per_page to maximum of 50' do
        get '/api/v1/posts', params: { per_page: 100 }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:meta][:per_page]).to eq(50)
      end

      it 'returns empty array for page beyond total pages' do
        get '/api/v1/posts', params: { page: 100 }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts]).to eq([])
      end
    end

    context 'with user_id filter' do
      it 'returns only posts from specified user' do
        get '/api/v1/posts', params: { user_id: user.id }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(10)
        expect(json_response[:meta][:total_count]).to eq(15)
        json_response[:posts].each do |post|
          expect(post[:user][:id]).to eq(user.id)
        end
      end

      it 'returns empty array for user with no posts' do
        new_user = create_confirmed_user
        get '/api/v1/posts', params: { user_id: new_user.id }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts]).to eq([])
        expect(json_response[:meta][:total_count]).to eq(0)
      end
    end

    context 'with comments and reactions' do
      it 'includes reactions_count and comments_count' do
        # Use last created post which will be in the first page (ordered by created_at desc)
        post = posts.last
        # Create reactions with different users since there's a uniqueness constraint
        3.times do |i|
          reaction_user = create_confirmed_user
          create(:reaction, reactionable: post, user: reaction_user, reaction_type: 'like')
        end
        create_list(:comment, 5, commentable: post, user: other_user, description: 'Test comment')

        get '/api/v1/posts', headers: auth_headers(user)

        post_response = json_response[:posts].find { |p| p[:id] == post.id }
        expect(post_response[:reactions_count]).to eq(3)
        expect(post_response[:comments_count]).to eq(5)
      end

      it 'includes last three comments' do
        # Use last created post which will be in the first page (ordered by created_at desc)
        post = posts.last
        comments = create_list(:comment, 5, commentable: post, user: other_user, description: 'Test comment')

        get '/api/v1/posts', headers: auth_headers(user)

        post_response = json_response[:posts].find { |p| p[:id] == post.id }
        expect(post_response[:last_three_comments].size).to eq(3)
        expect(post_response[:last_three_comments].first[:id]).to eq(comments.last.id) # most recent
      end
    end

    context 'ordering' do
      it 'returns posts ordered by created_at desc' do
        get '/api/v1/posts', headers: auth_headers(user)

        timestamps = json_response[:posts].map { |p| Time.parse(p[:created_at]) }
        expect(timestamps).to eq(timestamps.sort.reverse)
      end
    end

    context 'with search parameter' do
      it 'filters posts by title' do
        searchable_post = create(:post, user: user, title: 'Unique Searchable Title', description: 'Some description here')

        get '/api/v1/posts', params: { search: 'Unique Searchable' }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(1)
        expect(json_response[:posts].first[:id]).to eq(searchable_post.id)
      end

      it 'filters posts by description' do
        searchable_post = create(:post, user: user, title: 'Regular Title', description: 'Very unique description content')

        get '/api/v1/posts', params: { search: 'unique description' }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(1)
        expect(json_response[:posts].first[:id]).to eq(searchable_post.id)
      end

      it 'filters posts by user name' do
        special_user = create_confirmed_user(name: 'SpecialSearchUser')
        searchable_post = create(:post, user: special_user, title: 'Post Title', description: 'Post description here')

        get '/api/v1/posts', params: { search: 'SpecialSearch' }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(1)
        expect(json_response[:posts].first[:id]).to eq(searchable_post.id)
      end

      it 'filters posts by tag name' do
        special_tag = create(:tag, name: 'uniquetag', color: '#ff0000')
        searchable_post = create(:post, user: user, title: 'Tagged Post', description: 'Description here')
        searchable_post.tags << special_tag

        get '/api/v1/posts', params: { search: 'uniquetag' }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(1)
        expect(json_response[:posts].first[:id]).to eq(searchable_post.id)
      end

      it 'is case insensitive' do
        searchable_post = create(:post, user: user, title: 'CaseSensitiveTitle', description: 'Description')

        get '/api/v1/posts', params: { search: 'casesensitivetitle' }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts].size).to eq(1)
      end

      it 'returns empty array when no matches' do
        get '/api/v1/posts', params: { search: 'nonexistentsearchterm' }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts]).to eq([])
      end
    end

    context 'with tag_ids filter' do
      it 'filters posts by single tag_id' do
        tagged_post = posts.first
        tagged_post.tags << tag1

        get '/api/v1/posts', params: { tag_ids: tag1.id }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        post_ids = json_response[:posts].map { |p| p[:id] }
        expect(post_ids).to include(tagged_post.id)
        json_response[:posts].each do |post|
          tag_ids = post[:tags].map { |t| t[:id] }
          expect(tag_ids).to include(tag1.id)
        end
      end

      it 'filters posts by multiple tag_ids' do
        tagged_post = posts.first
        tagged_post.tags << tag1

        another_tagged_post = posts.second
        another_tagged_post.tags << tag2

        get '/api/v1/posts', params: { tag_ids: [ tag1.id, tag2.id ] }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        post_ids = json_response[:posts].map { |p| p[:id] }
        expect(post_ids).to include(tagged_post.id, another_tagged_post.id)
      end

      it 'returns empty array when no posts have the tag' do
        new_tag = create(:tag, name: 'newtag', color: '#000000')

        get '/api/v1/posts', params: { tag_ids: new_tag.id }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:posts]).to eq([])
      end
    end
  end

  describe 'GET /api/v1/posts/:id' do
    let(:post) { create(:post, user: user, title: 'Test Post', description: 'Test Description for post') }
    let!(:comments) { create_list(:comment, 5, commentable: post, user: other_user, description: 'Test comment') }

    context 'without authentication' do
      it 'returns 401 unauthorized' do
        get "/api/v1/posts/#{post.id}"

        expect(response).to have_http_status(:unauthorized)
        expect(json_response[:error]).to eq('Unauthorized')
      end
    end

    context 'with authentication' do
      it 'returns post with all details' do
        post.tags << [ tag1, tag2 ]

        get "/api/v1/posts/#{post.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:post]).to include(
          id: post.id,
          title: post.title,
          description: post.description
        )
        expect(json_response[:post][:user]).to include(id: user.id)
        expect(json_response[:post][:tags].size).to eq(2)
      end

      it 'includes all comments for the post' do
        get "/api/v1/posts/#{post.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:post][:last_three_comments].size).to eq(5)
      end

      it 'includes comment details with user' do
        get "/api/v1/posts/#{post.id}", headers: auth_headers(user)

        comment = json_response[:post][:last_three_comments].first
        expect(comment).to include(:id, :description, :created_at)
        expect(comment[:user]).to include(:id, :name, :profile_picture)
      end
    end

    context 'with non-existent post' do
      it 'returns 404 not found' do
        get '/api/v1/posts/99999', headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
        expect(json_response[:error]).to eq('Post not found')
      end
    end
  end

  describe 'POST /api/v1/posts' do
    let(:post_params) do
      {
        post: {
          title: 'New Post Title',
          description: 'This is a new post description with enough characters',
          picture: 'http://example.com/image.jpg'
        },
        tags: [ 'ruby', 'rails', 'testing' ]
      }
    end

    context 'with authentication' do
      it 'creates a new post and returns 201' do
        expect {
          post '/api/v1/posts', params: post_params, headers: auth_headers(user)
        }.to change(Post, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(json_response[:message]).to eq('Post created successfully')
        expect(json_response[:post]).to include(
          title: 'New Post Title',
          description: 'This is a new post description with enough characters'
        )
        expect(json_response[:post][:user][:id]).to eq(user.id)
      end

      it 'creates tags and associates them with post' do
        post '/api/v1/posts', params: post_params, headers: auth_headers(user)

        created_post = Post.last
        expect(created_post.tags.map(&:name)).to match_array([ 'ruby', 'rails', 'testing' ])
      end

      it 'creates new tags if they do not exist' do
        expect {
          post '/api/v1/posts', params: post_params, headers: auth_headers(user)
        }.to change(Tag, :count).by(1) # 'testing' is new, 'ruby' and 'rails' exist

        expect(Tag.find_by(name: 'testing')).to be_present
      end

      it 'uses existing tags if they already exist' do
        tag_count = Tag.count
        params = post_params.dup
        params[:tags] = [ 'ruby', 'rails' ] # existing tags

        post '/api/v1/posts', params: params, headers: auth_headers(user)

        expect(Tag.count).to eq(tag_count) # no new tags created
      end

      it 'creates post without tags' do
        params = post_params.dup
        params.delete(:tags)

        expect {
          post '/api/v1/posts', params: params, headers: auth_headers(user)
        }.to change(Post, :count).by(1)

        expect(Post.last.tags).to be_empty
      end
    end

    context 'without authentication' do
      it 'returns 401 unauthorized' do
        post '/api/v1/posts', params: post_params

        expect(response).to have_http_status(:unauthorized)
        expect(json_response[:error]).to eq('Unauthorized')
      end
    end

    context 'with invalid parameters' do
      it 'returns 422 when title is missing' do
        post_params[:post][:title] = nil
        post '/api/v1/posts', params: post_params, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response[:errors]).to include(a_string_matching(/Title/))
      end

      it 'returns 422 when title is too short' do
        post_params[:post][:title] = 'AB'
        post '/api/v1/posts', params: post_params, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response[:errors]).to include(a_string_matching(/Title.*too short/))
      end

      it 'returns 422 when description is missing' do
        post_params[:post][:description] = nil
        post '/api/v1/posts', params: post_params, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response[:errors]).to include(a_string_matching(/Description/))
      end

      it 'returns 422 when description is too short' do
        post_params[:post][:description] = 'Short'
        post '/api/v1/posts', params: post_params, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response[:errors]).to include(a_string_matching(/Description.*too short/))
      end
    end
  end

  describe 'PUT /api/v1/posts/:id' do
    let(:post_to_update) { create(:post, user: user, title: 'Original Title', description: 'Original description for this post') }
    let(:update_params) do
      {
        post: {
          title: 'Updated Title',
          description: 'Updated description with enough characters'
        },
        tags: [ 'updated', 'tags' ]
      }
    end

    context 'as post owner' do
      it 'updates the post and returns 200' do
        put "/api/v1/posts/#{post_to_update.id}", params: update_params, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:message]).to eq('Post updated successfully')
        expect(json_response[:post][:title]).to eq('Updated Title')
        expect(json_response[:post][:description]).to eq('Updated description with enough characters')

        post_to_update.reload
        expect(post_to_update.title).to eq('Updated Title')
      end

      it 'updates tags by replacing old tags with new ones' do
        post_to_update.tags << [ tag1, tag2 ]

        put "/api/v1/posts/#{post_to_update.id}", params: update_params, headers: auth_headers(user)

        post_to_update.reload
        expect(post_to_update.tags.map(&:name)).to match_array([ 'updated', 'tags' ])
      end

      it 'can update without changing tags' do
        post_to_update.tags << tag1
        params = update_params.dup
        params.delete(:tags)

        put "/api/v1/posts/#{post_to_update.id}", params: params, headers: auth_headers(user)

        post_to_update.reload
        expect(post_to_update.tags).to include(tag1)
      end
    end

    context 'as different user' do
      it 'returns 403 forbidden' do
        put "/api/v1/posts/#{post_to_update.id}", params: update_params, headers: auth_headers(other_user)

        expect(response).to have_http_status(:forbidden)
        expect(json_response[:error]).to eq('Forbidden: You can only modify your own posts')

        post_to_update.reload
        expect(post_to_update.title).to eq('Original Title')
      end
    end

    context 'without authentication' do
      it 'returns 401 unauthorized' do
        put "/api/v1/posts/#{post_to_update.id}", params: update_params

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with invalid parameters' do
      it 'returns 422 when title is too short' do
        update_params[:post][:title] = 'AB'
        put "/api/v1/posts/#{post_to_update.id}", params: update_params, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response[:errors]).to include(a_string_matching(/Title.*too short/))
      end
    end

    context 'with non-existent post' do
      it 'returns 404 not found' do
        put '/api/v1/posts/99999', params: update_params, headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
        expect(json_response[:error]).to eq('Post not found')
      end
    end
  end

  describe 'DELETE /api/v1/posts/:id' do
    let(:post_to_delete) { create(:post, user: user, title: 'Post to Delete', description: 'Description for post to delete') }

    context 'as post owner' do
      it 'deletes the post and returns 200' do
        post_id = post_to_delete.id

        expect {
          delete "/api/v1/posts/#{post_id}", headers: auth_headers(user)
        }.to change(Post, :count).by(-1)

        expect(response).to have_http_status(:ok)
        expect(json_response[:message]).to eq('Post deleted successfully')
        expect(Post.find_by(id: post_id)).to be_nil
      end

      it 'deletes associated comments' do
        create_list(:comment, 3, commentable: post_to_delete, user: other_user, description: 'Test comment')

        expect {
          delete "/api/v1/posts/#{post_to_delete.id}", headers: auth_headers(user)
        }.to change(Comment, :count).by(-3)
      end

      it 'deletes associated reactions' do
        # Create reactions with different users since there's a uniqueness constraint
        3.times do |i|
          reaction_user = create_confirmed_user
          create(:reaction, reactionable: post_to_delete, user: reaction_user, reaction_type: 'like')
        end

        expect {
          delete "/api/v1/posts/#{post_to_delete.id}", headers: auth_headers(user)
        }.to change(Reaction, :count).by(-3)
      end
    end

    context 'as different user' do
      it 'returns 403 forbidden' do
        # Ensure post exists before the expectation block
        post_id = post_to_delete.id

        expect {
          delete "/api/v1/posts/#{post_id}", headers: auth_headers(other_user)
        }.not_to change(Post, :count)

        expect(response).to have_http_status(:forbidden)
        expect(json_response[:error]).to eq('Forbidden: You can only modify your own posts')
      end
    end

    context 'without authentication' do
      it 'returns 401 unauthorized' do
        delete "/api/v1/posts/#{post_to_delete.id}"

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with non-existent post' do
      it 'returns 404 not found' do
        delete '/api/v1/posts/99999', headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
        expect(json_response[:error]).to eq('Post not found')
      end
    end
  end

  describe 'Mention Integration Tests' do
    let(:mentioned_user1) { create_confirmed_user(name: 'alice', email: 'alice@example.com') }
    let(:mentioned_user2) { create_confirmed_user(name: 'bob', email: 'bob@example.com') }
    let(:mentioned_user3) { create_confirmed_user(name: 'charlie', email: 'charlie@example.com') }

    describe 'POST /api/v1/posts with mentions' do
      context 'when creating post with username mentions' do
        it 'creates mention notifications for mentioned users' do
          mentioned_user1
          mentioned_user2

          post_params = {
            post: {
              title: 'Important Update',
              description: 'Hey @alice and @bob, please check this out!',
              tag_ids: [ tag1.id ]
            }
          }

          expect {
            post '/api/v1/posts', params: post_params, headers: auth_headers(user)
          }.to change(Notification, :count).by(2)

          expect(response).to have_http_status(:created)

          notifications = Notification.where(notification_type: 'mention').order(created_at: :desc).limit(2)
          expect(notifications.map(&:user)).to match_array([ mentioned_user1, mentioned_user2 ])
          expect(notifications.all? { |n| n.actor == user }).to be true
          expect(notifications.all? { |n| n.notifiable_type == 'Post' }).to be true
        end
      end

      context 'when creating post with email mentions' do
        it 'creates mention notifications for mentioned users' do
          mentioned_user1

          post_params = {
            post: {
              title: 'Review Request',
              description: 'Please review @alice@example.com',
              tag_ids: [ tag1.id ]
            }
          }

          expect {
            post '/api/v1/posts', params: post_params, headers: auth_headers(user)
          }.to change(Notification, :count).by(1)

          notification = Notification.where(notification_type: 'mention').last
          expect(notification.user).to eq(mentioned_user1)
        end
      end

      context 'when creating post with mentions in title' do
        it 'creates notifications for mentions in both title and description' do
          mentioned_user1
          mentioned_user2

          post_params = {
            post: {
              title: 'For @alice',
              description: 'And also @bob please see this',
              tag_ids: []
            }
          }

          expect {
            post '/api/v1/posts', params: post_params, headers: auth_headers(user)
          }.to change(Notification, :count).by(2)

          notifications = Notification.where(notification_type: 'mention').order(created_at: :desc).limit(2)
          expect(notifications.map(&:user)).to match_array([ mentioned_user1, mentioned_user2 ])
        end
      end

      context 'when mentioning self' do
        it 'does not create notification for the post author' do
          # Set user's name to something that can be mentioned
          user.update(name: 'testuser')

          post_params = {
            post: {
              title: 'Self Mention',
              description: 'I am @testuser',
              tag_ids: []
            }
          }

          expect {
            post '/api/v1/posts', params: post_params, headers: auth_headers(user)
          }.not_to change(Notification, :count)
        end
      end

      context 'when mentioning non-existent users' do
        it 'creates notifications only for existing users' do
          mentioned_user1

          post_params = {
            post: {
              title: 'Mixed Mentions',
              description: '@alice and @nonexistent_user',
              tag_ids: []
            }
          }

          expect {
            post '/api/v1/posts', params: post_params, headers: auth_headers(user)
          }.to change(Notification, :count).by(1)

          notification = Notification.where(notification_type: 'mention').last
          expect(notification.user).to eq(mentioned_user1)
        end
      end

      context 'when mentioning multiple users' do
        it 'creates separate notifications for each mentioned user' do
          mentioned_user1
          mentioned_user2
          mentioned_user3

          post_params = {
            post: {
              title: 'Team Update',
              description: '@alice, @bob, and @charlie please review',
              tag_ids: []
            }
          }

          expect {
            post '/api/v1/posts', params: post_params, headers: auth_headers(user)
          }.to change(Notification, :count).by(3)

          notifications = Notification.where(notification_type: 'mention').order(created_at: :desc).limit(3)
          expect(notifications.map(&:user)).to match_array([ mentioned_user1, mentioned_user2, mentioned_user3 ])
        end
      end

      context 'when mentioning same user multiple times' do
        it 'creates only one notification per user' do
          mentioned_user1

          post_params = {
            post: {
              title: '@alice please see',
              description: 'Hey @alice, this is for @alice',
              tag_ids: []
            }
          }

          expect {
            post '/api/v1/posts', params: post_params, headers: auth_headers(user)
          }.to change(Notification, :count).by(1)
        end
      end
    end

    describe 'PUT /api/v1/posts/:id with mentions' do
      let(:existing_post) do
        create(:post, user: user, title: 'Original', description: 'No mentions', tag_ids: [ tag1.id ])
      end

      context 'when updating post to add mentions' do
        it 'creates new mention notifications' do
          mentioned_user1
          existing_post

          update_params = {
            post: {
              title: 'Updated Title',
              description: 'Now mentioning @alice'
            }
          }

          expect {
            put "/api/v1/posts/#{existing_post.id}", params: update_params, headers: auth_headers(user)
          }.to change(Notification, :count).by(1)

          notification = Notification.where(notification_type: 'mention').last
          expect(notification.user).to eq(mentioned_user1)
          expect(notification.notifiable).to eq(existing_post)
        end
      end

      context 'when updating post with existing mentions' do
        it 'does not create duplicate notifications' do
          mentioned_user1
          post_with_mention = create(:post,
            user: user,
            title: 'Original',
            description: 'Hey @alice',
            tag_ids: [ tag1.id ]
          )

          # First mention creates notification
          MentionService.process_mentions(post_with_mention, user)

          # Update should not create duplicate
          update_params = {
            post: {
              description: 'Still mentioning @alice'
            }
          }

          expect {
            put "/api/v1/posts/#{post_with_mention.id}", params: update_params, headers: auth_headers(user)
          }.not_to change(Notification, :count)
        end
      end

      context 'when adding new mentions to post with existing mentions' do
        it 'creates notifications only for newly mentioned users' do
          mentioned_user1
          mentioned_user2

          post_with_mention = create(:post,
            user: user,
            title: 'Original',
            description: 'Hey @alice',
            tag_ids: [ tag1.id ]
          )

          # First mention
          MentionService.process_mentions(post_with_mention, user)

          # Add new mention
          update_params = {
            post: {
              description: 'Hey @alice and now also @bob'
            }
          }

          expect {
            put "/api/v1/posts/#{post_with_mention.id}", params: update_params, headers: auth_headers(user)
          }.to change(Notification, :count).by(1)

          new_notification = Notification.where(notification_type: 'mention').last
          expect(new_notification.user).to eq(mentioned_user2)
        end
      end
    end
  end
end
