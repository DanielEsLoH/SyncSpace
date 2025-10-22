require 'rails_helper'

RSpec.describe CommentsChannel, type: :channel do
  let(:user) { create(:user) }
  let(:post_record) { create(:post, user: user) }
  let(:comment) { create(:comment, user: user, commentable: post_record) }

  describe '#subscribed' do
    before do
      stub_connection current_user: user
    end

    it 'successfully subscribes without streams initially' do
      subscribe

      expect(subscription).to be_confirmed
    end
  end

  describe '#follow_post' do
    before do
      stub_connection current_user: user
      subscribe
    end

    it 'subscribes to post comments stream' do
      perform :follow_post, post_id: post_record.id

      expect(subscription).to have_stream_from("post_#{post_record.id}_comments")
    end
  end

  describe '#unfollow_post' do
    before do
      stub_connection current_user: user
      subscribe
      perform :follow_post, post_id: post_record.id
    end

    it 'unsubscribes from post comments stream' do
      perform :unfollow_post, post_id: post_record.id

      expect(subscription).not_to have_stream_from("post_#{post_record.id}_comments")
    end
  end

  describe '#follow_comment' do
    before do
      stub_connection current_user: user
      subscribe
    end

    it 'subscribes to comment replies stream' do
      perform :follow_comment, comment_id: comment.id

      expect(subscription).to have_stream_from("comment_#{comment.id}_replies")
    end
  end

  describe '#unfollow_comment' do
    before do
      stub_connection current_user: user
      subscribe
      perform :follow_comment, comment_id: comment.id
    end

    it 'unsubscribes from comment replies stream' do
      perform :unfollow_comment, comment_id: comment.id

      expect(subscription).not_to have_stream_from("comment_#{comment.id}_replies")
    end
  end

  describe '#unsubscribed' do
    before do
      stub_connection current_user: user
      subscribe
      perform :follow_post, post_id: post_record.id
    end

    it 'stops all streams on unsubscribe' do
      unsubscribe

      expect(subscription).not_to have_streams
    end
  end
end
