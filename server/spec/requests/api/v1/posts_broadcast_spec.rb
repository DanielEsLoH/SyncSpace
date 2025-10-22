require 'rails_helper'

RSpec.describe 'Posts Broadcasting', type: :request do
  let(:user) { create(:user) }
  let(:headers) { { 'Authorization' => "Bearer #{JsonWebToken.encode(user_id: user.id)}" } }

  describe 'POST /api/v1/posts' do
    it 'broadcasts new post to posts channel' do
      expect {
        post '/api/v1/posts', params: {
          post: {
            title: 'Test Post',
            description: 'Test Description'
          }
        }, headers: headers
      }.to have_broadcasted_to('posts_channel')
    end

    it 'broadcasts with correct action and post data' do
      expect {
        post '/api/v1/posts', params: {
          post: {
            title: 'Broadcast Test',
            description: 'Testing broadcast functionality'
          }
        }, headers: headers
      }.to have_broadcasted_to('posts_channel').with { |data|
        expect(data[:action]).to eq('new_post')
        expect(data[:post][:title]).to eq('Broadcast Test')
        expect(data[:post][:description]).to eq('Testing broadcast functionality')
      }
    end
  end

  describe 'PUT /api/v1/posts/:id' do
    let!(:post_record) { create(:post, user: user, title: 'Original Title') }

    it 'broadcasts to posts channel when updated' do
      expect {
        put "/api/v1/posts/#{post_record.id}", params: {
          post: { title: 'Updated Title' }
        }, headers: headers
      }.to have_broadcasted_to('posts_channel')
    end

    it 'broadcasts to specific post channel' do
      expect {
        put "/api/v1/posts/#{post_record.id}", params: {
          post: { description: 'Updated Description' }
        }, headers: headers
      }.to have_broadcasted_to("post_#{post_record.id}")
    end

    it 'broadcasts update action with post data' do
      expect {
        put "/api/v1/posts/#{post_record.id}", params: {
          post: { title: 'New Title' }
        }, headers: headers
      }.to have_broadcasted_to('posts_channel').with { |data|
        expect(data[:action]).to eq('update_post')
        expect(data[:post][:id]).to eq(post_record.id)
      }
    end
  end

  describe 'DELETE /api/v1/posts/:id' do
    let!(:post_record) { create(:post, user: user) }

    it 'broadcasts deletion to posts channel' do
      expect {
        delete "/api/v1/posts/#{post_record.id}", headers: headers
      }.to have_broadcasted_to('posts_channel')
    end

    it 'broadcasts delete action with post id' do
      post_id = post_record.id

      expect {
        delete "/api/v1/posts/#{post_id}", headers: headers
      }.to have_broadcasted_to('posts_channel').with { |data|
        expect(data[:action]).to eq('delete_post')
        expect(data[:post_id]).to eq(post_id)
      }
    end
  end
end
