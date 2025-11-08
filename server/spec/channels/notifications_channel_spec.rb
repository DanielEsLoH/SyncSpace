require 'rails_helper'

RSpec.describe NotificationsChannel, type: :channel do
  let(:user) { create(:user) }
  let(:other_user) { create(:user) }
  let(:post_record) { create(:post, user: user) }

  describe '#subscribed' do
    context 'with authenticated user' do
      before do
        stub_connection current_user: user
      end

      it 'successfully subscribes to user notifications' do
        subscribe

        expect(subscription).to be_confirmed
        expect(subscription).to have_stream_for(user)
      end
    end

    context 'without authenticated user' do
      before do
        stub_connection current_user: nil
      end

      it 'rejects the subscription' do
        subscribe

        expect(subscription).to be_rejected
      end
    end
  end

  describe '#mark_read' do
    let(:notification) { create(:notification, user: user, actor: other_user, notifiable: post_record) }

    before do
      stub_connection current_user: user
      subscribe
    end

    it 'marks notification as read' do
      expect {
        perform :mark_read, notification_id: notification.id
      }.to change { notification.reload.read? }.from(false).to(true)
    end

    it 'does not mark other users notifications' do
      other_notification = create(:notification, user: other_user, actor: user, notifiable: post_record)

      expect {
        perform :mark_read, notification_id: other_notification.id
      }.not_to change { other_notification.reload.read? }
    end
  end

  describe '#mark_all_read' do
    before do
      stub_connection current_user: user
      subscribe
      create_list(:notification, 3, user: user, actor: other_user, notifiable: post_record)
    end

    it 'marks all user notifications as read' do
      expect {
        perform :mark_all_read
      }.to change { user.notifications.unread.count }.from(3).to(0)
    end
  end

  describe '#unsubscribed' do
    before do
      stub_connection current_user: user
      subscribe
    end

    it 'stops all streams on unsubscribe' do
      unsubscribe

      expect(subscription).not_to have_streams
    end
  end
end
