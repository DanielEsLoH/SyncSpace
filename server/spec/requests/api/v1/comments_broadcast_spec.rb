require 'rails_helper'

RSpec.describe 'Comments Broadcasting', type: :request do
  let(:user) { create(:user) }
  let(:post_record) { create(:post, user: user) }
  let(:headers) { { 'Authorization' => "Bearer #{JsonWebToken.encode(user_id: user.id)}" } }

  describe 'POST /api/v1/posts/:post_id/comments' do
    it 'broadcasts new comment to post comments channel' do
      expect {
        post "/api/v1/posts/#{post_record.id}/comments", params: {
          comment: { description: 'Test comment' }
        }, headers: headers
      }.to have_broadcasted_to("post_#{post_record.id}_comments")
    end

    it 'broadcasts with new_comment action' do
      expect {
        post "/api/v1/posts/#{post_record.id}/comments", params: {
          comment: { description: 'Another comment' }
        }, headers: headers
      }.to have_broadcasted_to("post_#{post_record.id}_comments").with { |data|
        expect(data[:action]).to eq('new_comment')
        expect(data[:comment][:description]).to eq('Another comment')
      }
    end
  end

  describe 'POST /api/v1/comments/:comment_id/comments (reply)' do
    let(:parent_comment) { create(:comment, user: user, commentable: post_record) }

    it 'broadcasts reply to comment replies channel' do
      expect {
        post "/api/v1/comments/#{parent_comment.id}/comments", params: {
          comment: { description: 'Reply to comment' }
        }, headers: headers
      }.to have_broadcasted_to("comment_#{parent_comment.id}_replies")
    end

    it 'broadcasts with new_comment action and reply data' do
      expect {
        post "/api/v1/comments/#{parent_comment.id}/comments", params: {
          comment: { description: 'Nested reply' }
        }, headers: headers
      }.to have_broadcasted_to("comment_#{parent_comment.id}_replies").with { |data|
        expect(data[:action]).to eq('new_comment')
        expect(data[:comment][:description]).to eq('Nested reply')
      }
    end
  end

  describe 'PUT /api/v1/comments/:id' do
    let(:comment) { create(:comment, user: user, commentable: post_record) }

    it 'broadcasts comment update to post comments channel' do
      expect {
        put "/api/v1/comments/#{comment.id}", params: {
          comment: { description: 'Updated comment' }
        }, headers: headers
      }.to have_broadcasted_to("post_#{post_record.id}_comments")
    end

    it 'broadcasts with update_comment action' do
      expect {
        put "/api/v1/comments/#{comment.id}", params: {
          comment: { description: 'Modified description' }
        }, headers: headers
      }.to have_broadcasted_to("post_#{post_record.id}_comments").with { |data|
        expect(data[:action]).to eq('update_comment')
        expect(data[:comment][:id]).to eq(comment.id)
      }
    end
  end

  describe 'DELETE /api/v1/comments/:id' do
    context 'deleting comment on post' do
      let(:comment) { create(:comment, user: user, commentable: post_record) }

      it 'broadcasts deletion to post comments channel' do
        comment_id = comment.id

        expect {
          delete "/api/v1/comments/#{comment_id}", headers: headers
        }.to have_broadcasted_to("post_#{post_record.id}_comments")
      end

      it 'broadcasts delete_comment action with comment id' do
        comment_id = comment.id

        expect {
          delete "/api/v1/comments/#{comment_id}", headers: headers
        }.to have_broadcasted_to("post_#{post_record.id}_comments").with { |data|
          expect(data[:action]).to eq('delete_comment')
          expect(data[:comment_id]).to eq(comment_id)
        }
      end
    end

    context 'deleting reply to comment' do
      let(:parent_comment) { create(:comment, user: user, commentable: post_record) }
      let(:reply) { create(:comment, user: user, commentable: parent_comment) }

      it 'broadcasts deletion to comment replies channel' do
        reply_id = reply.id

        expect {
          delete "/api/v1/comments/#{reply_id}", headers: headers
        }.to have_broadcasted_to("comment_#{parent_comment.id}_replies")
      end

      it 'broadcasts delete_comment action with comment id' do
        reply_id = reply.id

        expect {
          delete "/api/v1/comments/#{reply_id}", headers: headers
        }.to have_broadcasted_to("comment_#{parent_comment.id}_replies").with { |data|
          expect(data[:action]).to eq('delete_comment')
          expect(data[:comment_id]).to eq(reply_id)
        }
      end
    end
  end
end
