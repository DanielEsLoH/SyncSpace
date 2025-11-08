module Api
  module V1
    module PostSerializable
      extend ActiveSupport::Concern

      def serialize_post(post, current_user = nil, include_all_comments: false)
        # Reload post to ensure all associations and counts are fresh
        post.reload

        comments_data = if include_all_comments
          post.comments.where(commentable_type: "Post").includes(:user).order(created_at: :desc).map { |c| serialize_comment(c) }
        else
          post.last_three_comments.map { |c| serialize_comment(c) }
        end

        user_reaction = if current_user
          post.reactions.find_by(user: current_user)
        else
          nil
        end

        {
          id: post.id,
          title: post.title,
          description: post.description,
          picture: post.image_url,
          user: {
            id: post.user.id,
            name: post.user.name,
            email: post.user.email,
            profile_picture: post.user.avatar_url
          },
          tags: post.tags.map { |t| { id: t.id, name: t.name, color: t.color } },
          reactions_count: post.try(:reactions_count) || post.reactions.count,
          comments_count: post.try(:comments_count) || post.comments.count,
          last_three_comments: comments_data,
          user_reaction: user_reaction ? serialize_reaction(user_reaction) : nil,
          created_at: post.created_at,
          updated_at: post.updated_at
        }
      end

      def serialize_comment(comment, current_user = nil)
        user_reaction = if current_user
          comment.reactions.find_by(user: current_user)
        else
          nil
        end

        {
          id: comment.id,
          description: comment.description,
          commentable_type: comment.commentable_type,
          commentable_id: comment.commentable_id,
          user: {
            id: comment.user.id,
            name: comment.user.name,
            profile_picture: comment.user.avatar_url
          },
          reactions_count: comment.reactions.count,
          replies_count: comment.comments.count,
          user_reaction: user_reaction ? serialize_reaction(user_reaction) : nil,
          created_at: comment.created_at,
          updated_at: comment.updated_at
        }
      end

      def serialize_reaction(reaction)
        {
          id: reaction.id,
          reaction_type: reaction.reaction_type,
          user: {
            id: reaction.user.id,
            name: reaction.user.name,
            profile_picture: reaction.user.avatar_url
          },
          reactionable_type: reaction.reactionable_type,
          reactionable_id: reaction.reactionable_id,
          created_at: reaction.created_at
        }
      end
    end
  end
end
