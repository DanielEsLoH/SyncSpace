require 'rails_helper'

RSpec.describe PostsChannel, type: :channel do
  let(:user) { create(:user) }

  describe '#subscribed' do
    context 'with valid connection' do
      before do
        stub_connection current_user: user
      end

      it 'successfully subscribes to the posts channel' do
        subscribe

        expect(subscription).to be_confirmed
        expect(subscription).to have_stream_from('posts_channel')
      end
    end

    context 'with anonymous connection' do
      before do
        stub_connection current_user: nil
      end

      it 'allows anonymous subscriptions' do
        subscribe

        expect(subscription).to be_confirmed
        expect(subscription).to have_stream_from('posts_channel')
      end
    end
  end

  describe '#follow_post' do
    before do
      stub_connection current_user: user
      subscribe
    end

    it 'subscribes to a specific post stream' do
      perform :follow_post, post_id: 123

      expect(subscription).to have_stream_from('post_123')
    end
  end

  describe '#unfollow_post' do
    before do
      stub_connection current_user: user
      subscribe
      perform :follow_post, post_id: 123
    end

    it 'unsubscribes from a specific post stream' do
      perform :unfollow_post, post_id: 123

      expect(subscription).not_to have_stream_from('post_123')
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
