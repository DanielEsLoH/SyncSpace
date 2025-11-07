require 'rails_helper'

RSpec.describe 'Api::V1::Comments', type: :request do
  let(:user) { create_confirmed_user }
  let(:other_user) { create_confirmed_user }
  let(:post_owner) { create_confirmed_user }
  let(:post_record) { create(:post, user: post_owner, title: 'Test Post', description: 'Test Description for post') }

  describe 'GET /api/v1/posts/:post_id/comments' do
    let!(:comments) { create_list(:comment, 5, commentable: post_record, user: user, description: 'Test comment on post') }

    context 'with authentication' do
      it 'returns all comments for a post' do
        get "/api/v1/posts/#{post_record.id}/comments", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:comments].size).to eq(5)
      end

      it 'includes comment details with user info' do
        get "/api/v1/posts/#{post_record.id}/comments", headers: auth_headers(user)

        comment = json_response[:comments].first
        expect(comment).to include(
          :id,
          :description,
          :commentable_type,
          :commentable_id,
          :reactions_count,
          :replies_count,
          :created_at,
          :updated_at
        )
        expect(comment[:user]).to include(:id, :name, :profile_picture)
        expect(comment[:commentable_type]).to eq('Post')
        expect(comment[:commentable_id]).to eq(post_record.id)
      end

      it 'returns comments ordered by created_at desc' do
        get "/api/v1/posts/#{post_record.id}/comments", headers: auth_headers(user)

        timestamps = json_response[:comments].map { |c| Time.parse(c[:created_at]) }
        expect(timestamps).to eq(timestamps.sort.reverse)
      end

      it 'includes reactions_count and replies_count' do
        comment = comments.first
        # Create reactions with different users since there's a uniqueness constraint
        3.times do
          reaction_user = create_confirmed_user
          create(:reaction, reactionable: comment, user: reaction_user, reaction_type: 'like')
        end
        create_list(:comment, 2, commentable: comment, user: other_user, description: 'Reply to comment')

        get "/api/v1/posts/#{post_record.id}/comments", headers: auth_headers(user)

        comment_response = json_response[:comments].find { |c| c[:id] == comment.id }
        expect(comment_response[:reactions_count]).to eq(3)
        expect(comment_response[:replies_count]).to eq(2)
      end
    end

    context 'with non-existent post' do
      it 'returns 404 not found' do
        get '/api/v1/posts/99999/comments', headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
        expect(json_response[:error]).to eq('Commentable not found')
      end
    end

    context 'when no comments exist' do
      it 'returns empty array' do
        new_post = create(:post, user: user, title: 'New Post', description: 'New Description for post')
        get "/api/v1/posts/#{new_post.id}/comments", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:comments]).to eq([])
      end
    end
  end

  describe 'GET /api/v1/comments/:comment_id/comments (replies)' do
    let(:parent_comment) { create(:comment, commentable: post_record, user: user, description: 'Parent comment') }
    let!(:replies) { create_list(:comment, 3, commentable: parent_comment, user: other_user, description: 'Reply to parent') }

    context 'with authentication' do
      it 'returns all replies for a comment' do
        get "/api/v1/comments/#{parent_comment.id}/comments", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:comments].size).to eq(3)
      end

      it 'includes reply details' do
        get "/api/v1/comments/#{parent_comment.id}/comments", headers: auth_headers(user)

        reply = json_response[:comments].first
        expect(reply[:commentable_type]).to eq('Comment')
        expect(reply[:commentable_id]).to eq(parent_comment.id)
      end
    end

    context 'with non-existent comment' do
      it 'returns 404 not found' do
        get '/api/v1/comments/99999/comments', headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
        expect(json_response[:error]).to eq('Commentable not found')
      end
    end
  end

  describe 'POST /api/v1/posts/:post_id/comments' do
    let(:comment_params) do
      {
        comment: {
          description: 'This is a test comment on the post'
        }
      }
    end

    context 'with authentication' do
      it 'creates a new comment on post and returns 201' do
        expect {
          post "/api/v1/posts/#{post_record.id}/comments", params: comment_params, headers: auth_headers(user)
        }.to change(Comment, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(json_response[:message]).to eq('Comment created successfully')
        expect(json_response[:comment][:description]).to eq('This is a test comment on the post')
        expect(json_response[:comment][:user][:id]).to eq(user.id)
        expect(json_response[:comment][:commentable_type]).to eq('Post')
        expect(json_response[:comment][:commentable_id]).to eq(post_record.id)
      end

      it 'creates notification for post owner' do
        expect {
          post "/api/v1/posts/#{post_record.id}/comments", params: comment_params, headers: auth_headers(user)
        }.to change(Notification, :count).by(1)

        notification = Notification.last
        expect(notification.user).to eq(post_owner)
        expect(notification.actor).to eq(user)
        expect(notification.notification_type).to eq('comment_on_post')
        expect(notification.notifiable).to eq(Comment.last)
      end

      it 'does not create notification when commenting on own post' do
        expect {
          post "/api/v1/posts/#{post_record.id}/comments", params: comment_params, headers: auth_headers(post_owner)
        }.not_to change(Notification, :count)
      end
    end

    context 'without authentication' do
      it 'returns 401 unauthorized' do
        post "/api/v1/posts/#{post_record.id}/comments", params: comment_params

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with invalid parameters' do
      it 'returns 422 when description is missing' do
        comment_params[:comment][:description] = nil
        post "/api/v1/posts/#{post_record.id}/comments", params: comment_params, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response[:errors]).to include(a_string_matching(/Description/))
      end

      it 'returns 422 when description is empty' do
        comment_params[:comment][:description] = ''
        post "/api/v1/posts/#{post_record.id}/comments", params: comment_params, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response[:errors]).to include(a_string_matching(/Description/))
      end

      it 'returns 422 when description is too long' do
        comment_params[:comment][:description] = 'a' * 2001
        post "/api/v1/posts/#{post_record.id}/comments", params: comment_params, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response[:errors]).to include(a_string_matching(/Description.*too long/))
      end
    end

    context 'with non-existent post' do
      it 'returns 404 not found' do
        post '/api/v1/posts/99999/comments', params: comment_params, headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
        expect(json_response[:error]).to eq('Commentable not found')
      end
    end
  end

  describe 'POST /api/v1/comments/:comment_id/comments (reply)' do
    let(:parent_comment) { create(:comment, commentable: post_record, user: other_user, description: 'Parent comment') }
    let(:reply_params) do
      {
        comment: {
          description: 'This is a reply to the comment'
        }
      }
    end

    context 'with authentication' do
      it 'creates a reply to a comment and returns 201' do
        # Ensure parent_comment exists before the expectation block
        parent_id = parent_comment.id

        expect {
          post "/api/v1/comments/#{parent_id}/comments", params: reply_params, headers: auth_headers(user)
        }.to change(Comment, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(json_response[:message]).to eq('Comment created successfully')
        expect(json_response[:comment][:commentable_type]).to eq('Comment')
        expect(json_response[:comment][:commentable_id]).to eq(parent_comment.id)
      end

      it 'creates notification for parent comment owner' do
        expect {
          post "/api/v1/comments/#{parent_comment.id}/comments", params: reply_params, headers: auth_headers(user)
        }.to change(Notification, :count).by(1)

        notification = Notification.last
        expect(notification.user).to eq(other_user)
        expect(notification.actor).to eq(user)
        expect(notification.notification_type).to eq('reply_to_comment')
      end

      it 'does not create notification when replying to own comment' do
        expect {
          post "/api/v1/comments/#{parent_comment.id}/comments", params: reply_params, headers: auth_headers(other_user)
        }.not_to change(Notification, :count)
      end
    end

    context 'with non-existent comment' do
      it 'returns 404 not found' do
        post '/api/v1/comments/99999/comments', params: reply_params, headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
        expect(json_response[:error]).to eq('Commentable not found')
      end
    end
  end

  describe 'PUT /api/v1/comments/:id' do
    let(:comment) { create(:comment, commentable: post_record, user: user, description: 'Original comment') }
    let(:update_params) do
      {
        comment: {
          description: 'Updated comment description'
        }
      }
    end

    context 'as comment owner' do
      it 'updates the comment and returns 200' do
        put "/api/v1/comments/#{comment.id}", params: update_params, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:message]).to eq('Comment updated successfully')
        expect(json_response[:comment][:description]).to eq('Updated comment description')

        comment.reload
        expect(comment.description).to eq('Updated comment description')
      end
    end

    context 'as different user' do
      it 'returns 403 forbidden' do
        put "/api/v1/comments/#{comment.id}", params: update_params, headers: auth_headers(other_user)

        expect(response).to have_http_status(:forbidden)
        expect(json_response[:error]).to eq('Forbidden: You can only modify your own comments')

        comment.reload
        expect(comment.description).to eq('Original comment')
      end
    end

    context 'without authentication' do
      it 'returns 401 unauthorized' do
        put "/api/v1/comments/#{comment.id}", params: update_params

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with invalid parameters' do
      it 'returns 422 when description is empty' do
        update_params[:comment][:description] = ''
        put "/api/v1/comments/#{comment.id}", params: update_params, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response[:errors]).to include(a_string_matching(/Description/))
      end

      it 'returns 422 when description is too long' do
        update_params[:comment][:description] = 'a' * 2001
        put "/api/v1/comments/#{comment.id}", params: update_params, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response[:errors]).to include(a_string_matching(/Description.*too long/))
      end
    end

    context 'with non-existent comment' do
      it 'returns 404 not found' do
        put '/api/v1/comments/99999', params: update_params, headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
        expect(json_response[:error]).to eq('Comment not found')
      end
    end
  end

  describe 'DELETE /api/v1/comments/:id' do
    let(:comment) { create(:comment, commentable: post_record, user: user, description: 'Comment to delete') }

    context 'as comment owner' do
      it 'deletes the comment and returns 200' do
        comment_id = comment.id

        expect {
          delete "/api/v1/comments/#{comment_id}", headers: auth_headers(user)
        }.to change(Comment, :count).by(-1)

        expect(response).to have_http_status(:ok)
        expect(json_response[:message]).to eq('Comment deleted successfully')
        expect(Comment.find_by(id: comment_id)).to be_nil
      end

      it 'deletes associated replies' do
        create_list(:comment, 3, commentable: comment, user: other_user, description: 'Reply')

        expect {
          delete "/api/v1/comments/#{comment.id}", headers: auth_headers(user)
        }.to change(Comment, :count).by(-4) # comment + 3 replies
      end

      it 'deletes associated reactions' do
        # Create reactions with different users since there's a uniqueness constraint
        2.times do
          reaction_user = create_confirmed_user
          create(:reaction, reactionable: comment, user: reaction_user, reaction_type: 'like')
        end

        expect {
          delete "/api/v1/comments/#{comment.id}", headers: auth_headers(user)
        }.to change(Reaction, :count).by(-2)
      end
    end

    context 'as different user' do
      it 'returns 403 forbidden' do
        # Ensure comment exists before the expectation block
        comment_id = comment.id

        expect {
          delete "/api/v1/comments/#{comment_id}", headers: auth_headers(other_user)
        }.not_to change(Comment, :count)

        expect(response).to have_http_status(:forbidden)
        expect(json_response[:error]).to eq('Forbidden: You can only modify your own comments')
      end
    end

    context 'without authentication' do
      it 'returns 401 unauthorized' do
        delete "/api/v1/comments/#{comment.id}"

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with non-existent comment' do
      it 'returns 404 not found' do
        delete '/api/v1/comments/99999', headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
        expect(json_response[:error]).to eq('Comment not found')
      end
    end
  end

  describe 'nested comment scenarios' do
    it 'can create deeply nested comment threads' do
      comment1 = create(:comment, commentable: post_record, user: user, description: 'Level 1')
      comment2 = create(:comment, commentable: comment1, user: other_user, description: 'Level 2')

      reply_params = { comment: { description: 'Level 3 reply' } }
      post "/api/v1/comments/#{comment2.id}/comments", params: reply_params, headers: auth_headers(user)

      expect(response).to have_http_status(:created)
      comment3 = Comment.last
      expect(comment3.commentable).to eq(comment2)
      expect(comment3.root_post).to eq(post_record)
    end
  end

  describe 'Mention Integration Tests' do
    let(:mentioned_user1) { create_confirmed_user(name: 'alice', email: 'alice@example.com') }
    let(:mentioned_user2) { create_confirmed_user(name: 'bob', email: 'bob@example.com') }
    let(:mentioned_user3) { create_confirmed_user(name: 'charlie', email: 'charlie@example.com') }

    describe 'POST /api/v1/posts/:post_id/comments with mentions' do
      context 'when creating comment with username mentions' do
        it 'creates mention notifications for mentioned users' do
          mentioned_user1
          mentioned_user2

          comment_params = {
            comment: {
              description: 'Hey @alice and @bob, what do you think?'
            }
          }

          expect {
            post "/api/v1/posts/#{post_record.id}/comments", params: comment_params, headers: auth_headers(user)
          }.to change(Notification, :count).by(3) # 2 mentions + 1 comment_on_post

          expect(response).to have_http_status(:created)

          mention_notifications = Notification.where(notification_type: 'mention').order(created_at: :desc).limit(2)
          expect(mention_notifications.map(&:user)).to match_array([mentioned_user1, mentioned_user2])
          expect(mention_notifications.all? { |n| n.actor == user }).to be true
          expect(mention_notifications.all? { |n| n.notifiable_type == 'Comment' }).to be true
        end
      end

      context 'when creating comment with email mentions' do
        it 'creates mention notifications for mentioned users' do
          mentioned_user1

          comment_params = {
            comment: {
              description: 'Thoughts @alice@example.com?'
            }
          }

          expect {
            post "/api/v1/posts/#{post_record.id}/comments", params: comment_params, headers: auth_headers(user)
          }.to change(Notification, :count).by(2) # 1 mention + 1 comment_on_post

          mention_notification = Notification.where(notification_type: 'mention').last
          expect(mention_notification.user).to eq(mentioned_user1)
        end
      end

      context 'when mentioning post owner in comment' do
        it 'creates mention notification in addition to comment_on_post notification' do
          # post_owner should get 2 notifications: comment_on_post and mention
          post_owner.update(name: 'postowner')

          comment_params = {
            comment: {
              description: 'Hey @postowner check this comment'
            }
          }

          expect {
            post "/api/v1/posts/#{post_record.id}/comments", params: comment_params, headers: auth_headers(user)
          }.to change(Notification, :count).by(2)

          notifications = Notification.where(user: post_owner).order(created_at: :desc).limit(2)
          notification_types = notifications.map(&:notification_type)
          expect(notification_types).to match_array(['comment_on_post', 'mention'])
        end
      end

      context 'when mentioning self in comment' do
        it 'does not create mention notification for comment author' do
          user.update(name: 'testuser')

          comment_params = {
            comment: {
              description: 'I am @testuser'
            }
          }

          # Only comment_on_post notification for post owner, no self-mention
          expect {
            post "/api/v1/posts/#{post_record.id}/comments", params: comment_params, headers: auth_headers(user)
          }.to change(Notification, :count).by(1)

          notification = Notification.last
          expect(notification.notification_type).to eq('comment_on_post')
        end
      end

      context 'when mentioning multiple users in comment' do
        it 'creates separate notifications for each mentioned user' do
          mentioned_user1
          mentioned_user2
          mentioned_user3

          comment_params = {
            comment: {
              description: '@alice, @bob, and @charlie please see this comment'
            }
          }

          expect {
            post "/api/v1/posts/#{post_record.id}/comments", params: comment_params, headers: auth_headers(user)
          }.to change(Notification, :count).by(4) # 3 mentions + 1 comment_on_post

          mention_notifications = Notification.where(notification_type: 'mention').order(created_at: :desc).limit(3)
          expect(mention_notifications.map(&:user)).to match_array([mentioned_user1, mentioned_user2, mentioned_user3])
        end
      end
    end

    describe 'POST /api/v1/comments/:comment_id/comments (replies) with mentions' do
      let(:parent_comment) { create(:comment, commentable: post_record, user: other_user, description: 'Parent comment') }

      context 'when creating reply with mentions' do
        it 'creates mention notifications for mentioned users' do
          mentioned_user1
          mentioned_user2

          reply_params = {
            comment: {
              description: 'Replying to mention @alice and @bob'
            }
          }

          expect {
            post "/api/v1/comments/#{parent_comment.id}/comments", params: reply_params, headers: auth_headers(user)
          }.to change(Notification, :count).by(3) # 2 mentions + 1 reply_to_comment

          mention_notifications = Notification.where(notification_type: 'mention').order(created_at: :desc).limit(2)
          expect(mention_notifications.map(&:user)).to match_array([mentioned_user1, mentioned_user2])
        end
      end

      context 'when mentioning parent comment author in reply' do
        it 'creates both mention and reply_to_comment notifications' do
          other_user.update(name: 'othername')

          reply_params = {
            comment: {
              description: 'Hey @othername great point!'
            }
          }

          expect {
            post "/api/v1/comments/#{parent_comment.id}/comments", params: reply_params, headers: auth_headers(user)
          }.to change(Notification, :count).by(2) # 1 mention + 1 reply_to_comment

          notifications = Notification.where(user: other_user).order(created_at: :desc).limit(2)
          notification_types = notifications.map(&:notification_type)
          expect(notification_types).to match_array(['reply_to_comment', 'mention'])
        end
      end
    end

    describe 'PUT /api/v1/comments/:id with mentions' do
      let(:existing_comment) do
        create(:comment, user: user, commentable: post_record, description: 'Original comment')
      end

      context 'when updating comment to add mentions' do
        it 'creates new mention notifications' do
          mentioned_user1
          existing_comment

          update_params = {
            comment: {
              description: 'Updated to mention @alice'
            }
          }

          expect {
            put "/api/v1/comments/#{existing_comment.id}", params: update_params, headers: auth_headers(user)
          }.to change(Notification, :count).by(1)

          notification = Notification.where(notification_type: 'mention').last
          expect(notification.user).to eq(mentioned_user1)
          expect(notification.notifiable).to eq(existing_comment)
        end
      end

      context 'when updating comment with existing mentions' do
        it 'does not create duplicate notifications' do
          mentioned_user1
          comment_with_mention = create(:comment,
            user: user,
            commentable: post_record,
            description: 'Hey @alice'
          )

          # First mention creates notification
          MentionService.process_mentions(comment_with_mention, user)

          # Update should not create duplicate
          update_params = {
            comment: {
              description: 'Still mentioning @alice'
            }
          }

          expect {
            put "/api/v1/comments/#{comment_with_mention.id}", params: update_params, headers: auth_headers(user)
          }.not_to change(Notification, :count)
        end
      end

      context 'when adding new mentions to comment with existing mentions' do
        it 'creates notifications only for newly mentioned users' do
          mentioned_user1
          mentioned_user2

          comment_with_mention = create(:comment,
            user: user,
            commentable: post_record,
            description: 'Hey @alice'
          )

          # First mention
          MentionService.process_mentions(comment_with_mention, user)

          # Add new mention
          update_params = {
            comment: {
              description: 'Hey @alice and now also @bob'
            }
          }

          expect {
            put "/api/v1/comments/#{comment_with_mention.id}", params: update_params, headers: auth_headers(user)
          }.to change(Notification, :count).by(1)

          new_notification = Notification.where(notification_type: 'mention').last
          expect(new_notification.user).to eq(mentioned_user2)
        end
      end
    end

    describe 'End-to-end mention workflow' do
      it 'handles complete workflow: post with mention -> comment with mention -> reply with mention' do
        mentioned_user1
        mentioned_user2
        mentioned_user3

        # Create post with mention
        post_params = {
          post: {
            title: 'Discussion',
            description: 'Hey @alice what do you think?',
            tag_ids: []
          }
        }

        post '/api/v1/posts', params: post_params, headers: auth_headers(user)
        created_post = Post.last

        # Add comment with different mention
        comment_params = {
          comment: {
            description: '@bob has thoughts on this'
          }
        }

        post "/api/v1/posts/#{created_post.id}/comments", params: comment_params, headers: auth_headers(mentioned_user1)
        created_comment = Comment.last

        # Add reply with another mention
        reply_params = {
          comment: {
            description: '@charlie should also see this'
          }
        }

        post "/api/v1/comments/#{created_comment.id}/comments", params: reply_params, headers: auth_headers(mentioned_user2)

        # Verify all mention notifications were created
        mention_notifications = Notification.where(notification_type: 'mention')
        mentioned_users = mention_notifications.map(&:user).uniq
        expect(mentioned_users).to match_array([mentioned_user1, mentioned_user2, mentioned_user3])
      end
    end
  end
end
