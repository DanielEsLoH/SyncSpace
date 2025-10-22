require 'rails_helper'

RSpec.describe 'Notification Broadcasting', type: :model do
  let(:user) { create(:user) }
  let(:actor) { create(:user) }
  let(:post_record) { create(:post, user: user) }

  describe 'when notification is created' do
    it 'broadcasts the notification to the user channel' do
      expect {
        Notification.create(
          user: user,
          actor: actor,
          notifiable: post_record,
          notification_type: 'reaction_on_post'
        )
      }.to have_broadcasted_to(user).from_channel(NotificationsChannel)
    end

    it 'includes notification data in broadcast' do
      notification = nil

      expect {
        notification = Notification.create(
          user: user,
          actor: actor,
          notifiable: post_record,
          notification_type: 'comment_on_post'
        )
      }.to have_broadcasted_to(user).from_channel(NotificationsChannel).with { |data|
        expect(data[:action]).to eq('new_notification')
        expect(data[:notification][:id]).to eq(notification.id)
        expect(data[:notification][:notification_type]).to eq('comment_on_post')
        expect(data[:notification][:actor][:id]).to eq(actor.id)
        expect(data[:notification][:actor][:name]).to eq(actor.name)
      }
    end

    it 'includes actor information' do
      notification = nil

      expect {
        notification = Notification.create(
          user: user,
          actor: actor,
          notifiable: post_record,
          notification_type: 'reaction_on_post'
        )
      }.to have_broadcasted_to(user).from_channel(NotificationsChannel).with { |data|
        expect(data[:notification][:actor]).to include(
          id: actor.id,
          name: actor.name,
          profile_picture: actor.profile_picture
        )
      }
    end

    it 'includes notifiable information' do
      notification = nil

      expect {
        notification = Notification.create(
          user: user,
          actor: actor,
          notifiable: post_record,
          notification_type: 'reaction_on_post'
        )
      }.to have_broadcasted_to(user).from_channel(NotificationsChannel).with { |data|
        expect(data[:notification][:notifiable]).to include(
          id: post_record.id,
          type: 'Post'
        )
      }
    end
  end
end
