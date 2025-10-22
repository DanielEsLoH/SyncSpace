class CommentsChannel < ApplicationCable::Channel
  def subscribed
    # Client must specify which post they're viewing to receive its comments
    # This prevents unnecessary data transfer
  end

  def unsubscribed
    stop_all_streams
  end

  # Subscribe to comments for a specific post
  def follow_post(data)
    post_id = data['post_id']
    if post_id.present?
      stream_from "post_#{post_id}_comments"
    end
  end

  def unfollow_post(data)
    post_id = data['post_id']
    if post_id.present?
      stop_stream_from "post_#{post_id}_comments"
    end
  end

  # Subscribe to replies for a specific comment
  def follow_comment(data)
    comment_id = data['comment_id']
    if comment_id.present?
      stream_from "comment_#{comment_id}_replies"
    end
  end

  def unfollow_comment(data)
    comment_id = data['comment_id']
    if comment_id.present?
      stop_stream_from "comment_#{comment_id}_replies"
    end
  end
end
