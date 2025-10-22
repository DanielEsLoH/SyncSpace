require 'rails_helper'

RSpec.describe 'Api::V1::Reactions', type: :request do
  let(:user) { create_confirmed_user }
  let(:other_user) { create_confirmed_user }
  let(:post_owner) { create_confirmed_user }
  let(:post_record) { create(:post, user: post_owner, title: 'Test Post', description: 'Test Description for post') }
  let(:comment) { create(:comment, commentable: post_record, user: post_owner, description: 'Test comment') }

  describe 'POST /api/v1/posts/:post_id/reactions' do
    context 'with valid reaction type' do
      it 'adds a like reaction to a post' do
        expect {
          post "/api/v1/posts/#{post_record.id}/reactions",
               params: { reaction_type: 'like' },
               headers: auth_headers(user)
        }.to change(Reaction, :count).by(1)

        expect(response).to have_http_status(:ok)
        expect(json_response[:action]).to eq('added')
        expect(json_response[:message]).to eq('Reaction added')
        expect(json_response[:reactions_count]).to eq(1)

        reaction = Reaction.last
        expect(reaction.user).to eq(user)
        expect(reaction.reactionable).to eq(post_record)
        expect(reaction.reaction_type).to eq('like')
      end

      it 'adds a love reaction to a post' do
        post "/api/v1/posts/#{post_record.id}/reactions",
             params: { reaction_type: 'love' },
             headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:action]).to eq('added')
        expect(Reaction.last.reaction_type).to eq('love')
      end

      it 'adds a dislike reaction to a post' do
        post "/api/v1/posts/#{post_record.id}/reactions",
             params: { reaction_type: 'dislike' },
             headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:action]).to eq('added')
        expect(Reaction.last.reaction_type).to eq('dislike')
      end

      it 'creates notification for post owner' do
        expect {
          post "/api/v1/posts/#{post_record.id}/reactions",
               params: { reaction_type: 'like' },
               headers: auth_headers(user)
        }.to change(Notification, :count).by(1)

        notification = Notification.last
        expect(notification.user).to eq(post_owner)
        expect(notification.actor).to eq(user)
        expect(notification.notification_type).to eq('reaction_on_post')
        expect(notification.notifiable).to eq(Reaction.last)
      end

      it 'does not create notification when reacting to own post' do
        expect {
          post "/api/v1/posts/#{post_record.id}/reactions",
               params: { reaction_type: 'like' },
               headers: auth_headers(post_owner)
        }.not_to change(Notification, :count)
      end
    end

    context 'toggling reactions' do
      it 'removes reaction if already exists (toggle off)' do
        create(:reaction, user: user, reactionable: post_record, reaction_type: 'like')

        expect {
          post "/api/v1/posts/#{post_record.id}/reactions",
               params: { reaction_type: 'like' },
               headers: auth_headers(user)
        }.to change(Reaction, :count).by(-1)

        expect(response).to have_http_status(:ok)
        expect(json_response[:action]).to eq('removed')
        expect(json_response[:message]).to eq('Reaction removed')
      end

      it 'does not create notification when removing reaction' do
        create(:reaction, user: user, reactionable: post_record, reaction_type: 'like')

        expect {
          post "/api/v1/posts/#{post_record.id}/reactions",
               params: { reaction_type: 'like' },
               headers: auth_headers(user)
        }.not_to change(Notification, :count)
      end

      it 'allows user to change reaction type by toggling' do
        create(:reaction, user: user, reactionable: post_record, reaction_type: 'like')

        # Remove 'like'
        post "/api/v1/posts/#{post_record.id}/reactions",
             params: { reaction_type: 'like' },
             headers: auth_headers(user)

        expect(json_response[:action]).to eq('removed')

        # Add 'love'
        post "/api/v1/posts/#{post_record.id}/reactions",
             params: { reaction_type: 'love' },
             headers: auth_headers(user)

        expect(json_response[:action]).to eq('added')
        expect(Reaction.last.reaction_type).to eq('love')
      end
    end

    context 'with invalid reaction type' do
      it 'returns 422 for invalid reaction type' do
        post "/api/v1/posts/#{post_record.id}/reactions",
             params: { reaction_type: 'invalid' },
             headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response[:error]).to eq('Invalid reaction type')
      end

      it 'returns 422 for nil reaction type' do
        post "/api/v1/posts/#{post_record.id}/reactions",
             params: { reaction_type: nil },
             headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response[:error]).to eq('Invalid reaction type')
      end

      it 'returns 422 for empty reaction type' do
        post "/api/v1/posts/#{post_record.id}/reactions",
             params: { reaction_type: '' },
             headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response[:error]).to eq('Invalid reaction type')
      end
    end

    context 'without authentication' do
      it 'returns 401 unauthorized' do
        post "/api/v1/posts/#{post_record.id}/reactions",
             params: { reaction_type: 'like' }

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with non-existent post' do
      it 'returns 404 not found' do
        post '/api/v1/posts/99999/reactions',
             params: { reaction_type: 'like' },
             headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
        expect(json_response[:error]).to eq('Reactionable not found')
      end
    end
  end

  describe 'POST /api/v1/comments/:comment_id/reactions' do
    context 'with valid reaction type' do
      it 'adds a like reaction to a comment' do
        expect {
          post "/api/v1/comments/#{comment.id}/reactions",
               params: { reaction_type: 'like' },
               headers: auth_headers(user)
        }.to change(Reaction, :count).by(1)

        expect(response).to have_http_status(:ok)
        expect(json_response[:action]).to eq('added')

        reaction = Reaction.last
        expect(reaction.reactionable).to eq(comment)
        expect(reaction.reaction_type).to eq('like')
      end

      it 'creates notification for comment owner' do
        expect {
          post "/api/v1/comments/#{comment.id}/reactions",
               params: { reaction_type: 'love' },
               headers: auth_headers(user)
        }.to change(Notification, :count).by(1)

        notification = Notification.last
        expect(notification.user).to eq(post_owner)
        expect(notification.actor).to eq(user)
        expect(notification.notification_type).to eq('reaction_on_comment')
      end

      it 'does not create notification when reacting to own comment' do
        expect {
          post "/api/v1/comments/#{comment.id}/reactions",
               params: { reaction_type: 'like' },
               headers: auth_headers(post_owner)
        }.not_to change(Notification, :count)
      end
    end

    context 'toggling reactions' do
      it 'removes reaction if already exists' do
        create(:reaction, user: user, reactionable: comment, reaction_type: 'like')

        expect {
          post "/api/v1/comments/#{comment.id}/reactions",
               params: { reaction_type: 'like' },
               headers: auth_headers(user)
        }.to change(Reaction, :count).by(-1)

        expect(response).to have_http_status(:ok)
        expect(json_response[:action]).to eq('removed')
      end
    end

    context 'with non-existent comment' do
      it 'returns 404 not found' do
        post '/api/v1/comments/99999/reactions',
             params: { reaction_type: 'like' },
             headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
        expect(json_response[:error]).to eq('Reactionable not found')
      end
    end
  end

  describe 'GET /api/v1/posts/:post_id/reactions' do
    before do
      create(:reaction, user: user, reactionable: post_record, reaction_type: 'like')
      create(:reaction, user: other_user, reactionable: post_record, reaction_type: 'like')
      create(:reaction, user: create_confirmed_user, reactionable: post_record, reaction_type: 'love')
      create(:reaction, user: create_confirmed_user, reactionable: post_record, reaction_type: 'dislike')
    end

    context 'with authentication' do
      it 'returns reaction counts grouped by type' do
        get "/api/v1/posts/#{post_record.id}/reactions", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:reactions]).to include(
          like: 2,
          love: 1,
          dislike: 1
        )
      end

      it 'returns current user reactions' do
        get "/api/v1/posts/#{post_record.id}/reactions", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:user_reactions]).to include('like')
      end

      it 'returns empty user_reactions when user has not reacted' do
        new_user = create_confirmed_user
        get "/api/v1/posts/#{post_record.id}/reactions", headers: auth_headers(new_user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:user_reactions]).to be_empty
      end

      it 'returns 0 for reaction types with no reactions' do
        new_post = create(:post, user: user, title: 'New Post', description: 'New Description for post')
        get "/api/v1/posts/#{new_post.id}/reactions", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:reactions]).to include(
          like: 0,
          love: 0,
          dislike: 0
        )
      end
    end

    context 'with non-existent post' do
      it 'returns 404 not found' do
        get '/api/v1/posts/99999/reactions', headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
        expect(json_response[:error]).to eq('Reactionable not found')
      end
    end
  end

  describe 'GET /api/v1/comments/:comment_id/reactions' do
    before do
      create(:reaction, user: user, reactionable: comment, reaction_type: 'love')
      create(:reaction, user: other_user, reactionable: comment, reaction_type: 'love')
      create(:reaction, user: create_confirmed_user, reactionable: comment, reaction_type: 'like')
    end

    context 'with authentication' do
      it 'returns reaction counts grouped by type' do
        get "/api/v1/comments/#{comment.id}/reactions", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:reactions]).to include(
          like: 1,
          love: 2,
          dislike: 0
        )
      end

      it 'returns current user reactions' do
        get "/api/v1/comments/#{comment.id}/reactions", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:user_reactions]).to include('love')
      end
    end

    context 'with non-existent comment' do
      it 'returns 404 not found' do
        get '/api/v1/comments/99999/reactions', headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
        expect(json_response[:error]).to eq('Reactionable not found')
      end
    end
  end

  describe 'multiple users reacting' do
    it 'handles multiple users reacting to the same post' do
      users = create_list(:user, 5, password: 'password123', confirmed_at: Time.current)

      users.each do |u|
        post "/api/v1/posts/#{post_record.id}/reactions",
             params: { reaction_type: 'like' },
             headers: auth_headers(u)
      end

      expect(post_record.reactions.count).to eq(5)

      get "/api/v1/posts/#{post_record.id}/reactions", headers: auth_headers(user)
      expect(json_response[:reactions][:like]).to eq(5)
    end

    it 'allows same user to react differently to post and comment' do
      post "/api/v1/posts/#{post_record.id}/reactions",
           params: { reaction_type: 'like' },
           headers: auth_headers(user)

      post "/api/v1/comments/#{comment.id}/reactions",
           params: { reaction_type: 'love' },
           headers: auth_headers(user)

      expect(user.reactions.count).to eq(2)
      expect(user.reactions.pluck(:reaction_type)).to match_array(['like', 'love'])
    end
  end

  describe 'reaction type validation' do
    it 'only allows valid reaction types' do
      valid_types = %w[like love dislike]
      invalid_types = %w[angry sad wow haha]

      valid_types.each do |type|
        post "/api/v1/posts/#{post_record.id}/reactions",
             params: { reaction_type: type },
             headers: auth_headers(create_confirmed_user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:action]).to eq('added')
      end

      invalid_types.each do |type|
        post "/api/v1/posts/#{post_record.id}/reactions",
             params: { reaction_type: type },
             headers: auth_headers(create_confirmed_user)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response[:error]).to eq('Invalid reaction type')
      end
    end
  end
end
