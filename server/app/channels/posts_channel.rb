class PostsChannel < ApplicationCable::Channel
  def subscribed
    # Stream all posts for the main feed
    stream_from "posts_channel"
  end

  def unsubscribed
    # Cleanup when channel is unsubscribed
    stop_all_streams
  end

  # Client can call this to request specific post updates
  def follow_post(data)
    post_id = data['post_id']
    stream_from "post_#{post_id}" if post_id.present?
  end

  def unfollow_post(data)
    post_id = data['post_id']
    stop_stream_from "post_#{post_id}" if post_id.present?
  end
end
