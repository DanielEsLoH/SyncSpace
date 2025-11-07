require 'rails_helper'

RSpec.describe 'Api::V1::Notifications', type: :request do
  let(:user) { create_confirmed_user }
  let(:other_user) { create_confirmed_user }
  let(:post_record) { create(:post, user: user, title: 'Test Post', description: 'Test Description for post') }

  describe 'GET /api/v1/notifications' do
    let!(:comment) { create(:comment, commentable: post_record, user: other_user, description: 'Test comment') }
    let!(:reaction) { create(:reaction, reactionable: post_record, user: other_user, reaction_type: 'like') }

    let!(:comment_notification) do
      create(:notification,
             user: user,
             actor: other_user,
             notifiable: comment,
             notification_type: 'comment_on_post',
             read_at: nil)
    end

    let!(:reaction_notification) do
      create(:notification,
             user: user,
             actor: other_user,
             notifiable: reaction,
             notification_type: 'reaction_on_post',
             read_at: Time.current - 1.hour)
    end

    context 'with authentication' do
      it 'returns all notifications for current user' do
        get '/api/v1/notifications', headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:notifications].size).to eq(2)
        expect(json_response[:unread_count]).to eq(1)
      end

      it 'includes notification details with actor and notifiable' do
        get '/api/v1/notifications', headers: auth_headers(user)

        notification = json_response[:notifications].first
        expect(notification).to include(
          :id,
          :notification_type,
          :read,
          :actor,
          :notifiable,
          :created_at
        )
        expect(notification[:actor]).to include(:id, :name, :profile_picture)
      end

      it 'includes comment notifiable details' do
        get '/api/v1/notifications', headers: auth_headers(user)

        comment_notif = json_response[:notifications].find { |n| n[:notification_type] == 'comment_on_post' }
        expect(comment_notif[:notifiable]).to include(
          type: 'Comment',
          id: comment.id,
          description: comment.description[0..100],
          post_id: post_record.id
        )
      end

      it 'includes reaction notifiable details' do
        get '/api/v1/notifications', headers: auth_headers(user)

        reaction_notif = json_response[:notifications].find { |n| n[:notification_type] == 'reaction_on_post' }
        expect(reaction_notif[:notifiable]).to include(
          type: 'Reaction',
          id: reaction.id,
          reaction_type: 'like',
          reactionable_type: 'Post',
          reactionable_id: post_record.id
        )
      end

      it 'returns notifications ordered by created_at desc' do
        get '/api/v1/notifications', headers: auth_headers(user)

        timestamps = json_response[:notifications].map { |n| Time.parse(n[:created_at]) }
        expect(timestamps).to eq(timestamps.sort.reverse)
      end

      it 'does not return other users notifications' do
        other_post = create(:post, user: other_user, title: 'Other Post', description: 'Other Description for post')
        other_comment = create(:comment, commentable: other_post, user: user, description: 'My comment')
        create(:notification,
               user: other_user,
               actor: user,
               notifiable: other_comment,
               notification_type: 'comment_on_post')

        get '/api/v1/notifications', headers: auth_headers(user)

        expect(json_response[:notifications].size).to eq(2)
        json_response[:notifications].each do |notification|
          expect(notification[:actor][:id]).to eq(other_user.id)
        end
      end
    end

    context 'filtering by read status' do
      it 'returns only unread notifications' do
        get '/api/v1/notifications', params: { unread: 'true' }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:notifications].size).to eq(1)
        expect(json_response[:notifications].first[:read]).to be false
        expect(json_response[:notifications].first[:notification_type]).to eq('comment_on_post')
      end

      it 'returns only read notifications' do
        get '/api/v1/notifications', params: { read: 'true' }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:notifications].size).to eq(1)
        expect(json_response[:notifications].first[:read]).to be true
        expect(json_response[:notifications].first[:notification_type]).to eq('reaction_on_post')
      end

      it 'returns all notifications when no filter specified' do
        get '/api/v1/notifications', headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:notifications].size).to eq(2)
      end
    end

    context 'with pagination' do
      before do
        create_list(:notification, 25,
                    user: user,
                    actor: other_user,
                    notifiable: comment,
                    notification_type: 'comment_on_post')
      end

      it 'returns paginated results with default values' do
        get '/api/v1/notifications', headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:notifications].size).to eq(20) # default per_page
        expect(json_response[:meta]).to include(
          current_page: 1,
          per_page: 20,
          total_count: 27,
          total_pages: 2
        )
      end

      it 'accepts page and per_page parameters' do
        get '/api/v1/notifications', params: { page: 2, per_page: 10 }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:notifications].size).to eq(10)
        expect(json_response[:meta]).to include(
          current_page: 2,
          per_page: 10,
          total_pages: 3
        )
      end

      it 'limits per_page to maximum of 100' do
        get '/api/v1/notifications', params: { per_page: 200 }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:meta][:per_page]).to eq(100)
      end
    end

    context 'without authentication' do
      it 'returns 401 unauthorized' do
        get '/api/v1/notifications'

        expect(response).to have_http_status(:unauthorized)
        expect(json_response[:error]).to eq('Unauthorized')
      end
    end

    context 'when user has no notifications' do
      it 'returns empty array' do
        new_user = create_confirmed_user
        get '/api/v1/notifications', headers: auth_headers(new_user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:notifications]).to eq([])
        expect(json_response[:unread_count]).to eq(0)
        expect(json_response[:meta][:total_count]).to eq(0)
      end
    end

    context 'unread count' do
      it 'returns correct unread count' do
        create_list(:notification, 5,
                    user: user,
                    actor: other_user,
                    notifiable: comment,
                    notification_type: 'comment_on_post',
                    read_at: nil)

        get '/api/v1/notifications', headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:unread_count]).to eq(6) # 1 existing + 5 new
      end
    end
  end

  describe 'PUT /api/v1/notifications/:id/mark_read' do
    let(:comment) { create(:comment, commentable: post_record, user: other_user, description: 'Test comment') }
    let(:notification) do
      create(:notification,
             user: user,
             actor: other_user,
             notifiable: comment,
             notification_type: 'comment_on_post',
             read_at: nil)
    end

    context 'with authentication' do
      it 'marks notification as read and returns 200' do
        expect(notification.read?).to be false

        patch "/api/v1/notifications/#{notification.id}/read", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:message]).to eq('Notification marked as read')
        expect(json_response[:notification][:read]).to be true

        notification.reload
        expect(notification.read?).to be true
      end

      it 'updates read_at timestamp' do
        freeze_time do
          patch "/api/v1/notifications/#{notification.id}/read", headers: auth_headers(user)

          notification.reload
          expect(notification.read_at).to be_within(1.second).of(Time.current)
        end
      end

      it 'is idempotent (marking already read notification)' do
        notification.update(read_at: 1.hour.ago)

        patch "/api/v1/notifications/#{notification.id}/read", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
      end
    end

    context 'without authentication' do
      it 'returns 401 unauthorized' do
        patch "/api/v1/notifications/#{notification.id}/read"

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'marking another users notification' do
      it 'returns 404 not found' do
        other_notification = create(:notification,
                                     user: other_user,
                                     actor: user,
                                     notifiable: comment,
                                     notification_type: 'comment_on_post')

        patch "/api/v1/notifications/#{other_notification.id}/read", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
        expect(json_response[:error]).to eq('Notification not found')

        other_notification.reload
        expect(other_notification.read?).to be false
      end
    end

    context 'with non-existent notification' do
      it 'returns 404 not found' do
        patch '/api/v1/notifications/99999/read', headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
        expect(json_response[:error]).to eq('Notification not found')
      end
    end
  end

  describe 'PUT /api/v1/notifications/mark_all_read' do
    let(:comment) { create(:comment, commentable: post_record, user: other_user, description: 'Test comment') }
    let!(:unread_notifications) do
      create_list(:notification, 5,
                  user: user,
                  actor: other_user,
                  notifiable: comment,
                  notification_type: 'comment_on_post',
                  read_at: nil)
    end

    let!(:already_read_notification) do
      create(:notification,
             user: user,
             actor: other_user,
             notifiable: comment,
             notification_type: 'comment_on_post',
             read_at: 1.hour.ago)
    end

    context 'with authentication' do
      it 'marks all unread notifications as read and returns 200' do
        expect(user.notifications.unread.count).to eq(5)

        patch '/api/v1/notifications/mark_all_read', headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:message]).to eq('All notifications marked as read')
        expect(json_response[:unread_count]).to eq(0)

        expect(user.notifications.unread.count).to eq(0)
        expect(user.notifications.read.count).to eq(6)
      end

      it 'updates read_at timestamp for all unread notifications' do
        patch '/api/v1/notifications/mark_all_read', headers: auth_headers(user)

        user.notifications.each do |notification|
          notification.reload
          expect(notification.read_at).to be_present
        end
      end

      it 'does not affect other users notifications' do
        other_notification = create(:notification,
                                     user: other_user,
                                     actor: user,
                                     notifiable: comment,
                                     notification_type: 'comment_on_post',
                                     read_at: nil)

        patch '/api/v1/notifications/mark_all_read', headers: auth_headers(user)

        expect(response).to have_http_status(:ok)

        other_notification.reload
        expect(other_notification.read?).to be false
      end

      it 'works when user has no unread notifications' do
        user.notifications.update_all(read_at: Time.current)

        patch '/api/v1/notifications/mark_all_read', headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:unread_count]).to eq(0)
      end

      it 'works when user has no notifications at all' do
        new_user = create_confirmed_user

        patch '/api/v1/notifications/mark_all_read', headers: auth_headers(new_user)

        expect(response).to have_http_status(:ok)
        expect(json_response[:unread_count]).to eq(0)
      end
    end

    context 'without authentication' do
      it 'returns 401 unauthorized' do
        patch '/api/v1/notifications/mark_all_read'

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'notification types' do
    let(:comment) { create(:comment, commentable: post_record, user: other_user, description: 'Test comment') }
    let(:reply) { create(:comment, commentable: comment, user: user, description: 'Reply') }
    let(:reaction) { create(:reaction, reactionable: post_record, user: other_user, reaction_type: 'like') }

    it 'handles comment_on_post notification type' do
      notification = create(:notification,
                            user: user,
                            actor: other_user,
                            notifiable: comment,
                            notification_type: 'comment_on_post')

      get '/api/v1/notifications', headers: auth_headers(user)

      notif = json_response[:notifications].find { |n| n[:id] == notification.id }
      expect(notif[:notification_type]).to eq('comment_on_post')
    end

    it 'handles reply_to_comment notification type' do
      notification = create(:notification,
                            user: other_user,
                            actor: user,
                            notifiable: reply,
                            notification_type: 'reply_to_comment')

      get '/api/v1/notifications', headers: auth_headers(other_user)

      notif = json_response[:notifications].find { |n| n[:id] == notification.id }
      expect(notif[:notification_type]).to eq('reply_to_comment')
    end

    it 'handles reaction_on_post notification type' do
      notification = create(:notification,
                            user: user,
                            actor: other_user,
                            notifiable: reaction,
                            notification_type: 'reaction_on_post')

      get '/api/v1/notifications', headers: auth_headers(user)

      notif = json_response[:notifications].find { |n| n[:id] == notification.id }
      expect(notif[:notification_type]).to eq('reaction_on_post')
    end

    it 'handles reaction_on_comment notification type' do
      comment_reaction = create(:reaction, reactionable: comment, user: user, reaction_type: 'love')
      notification = create(:notification,
                            user: other_user,
                            actor: user,
                            notifiable: comment_reaction,
                            notification_type: 'reaction_on_comment')

      get '/api/v1/notifications', headers: auth_headers(other_user)

      notif = json_response[:notifications].find { |n| n[:id] == notification.id }
      expect(notif[:notification_type]).to eq('reaction_on_comment')
    end
  end
end
