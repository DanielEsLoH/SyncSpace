require 'rails_helper'
require 'support/auth_helpers'

# Create a dummy class to test the concern
class SerializableDummy
  include Api::V1::PostSerializable

  # Make methods accessible for testing
  def public_serialize_post(post, current_user = nil, include_all_comments: false)
    serialize_post(post, current_user, include_all_comments: include_all_comments)
  end

  def public_serialize_comment(comment, current_user = nil)
    serialize_comment(comment, current_user)
  end

  def public_serialize_reaction(reaction)
    serialize_reaction(reaction)
  end
end

RSpec.describe Api::V1::PostSerializable, type: :request do
  include AuthHelpers

  let(:dummy_class) { SerializableDummy.new }
  let(:user) { create_confirmed_user }
  let(:other_user) { create_confirmed_user }
  let(:post) { create(:post, user: user) }

  describe '#serialize_post' do
    context 'when serializing a post' do
      let!(:comments) { create_list(:comment, 5, commentable: post, user: other_user) }
      let!(:reaction) { create(:reaction, reactionable: post, user: other_user, reaction_type: 'like') }

      it 'returns the correct post structure' do
        serialized_post = dummy_class.public_serialize_post(post)
        expect(serialized_post).to include(
          :id,
          :title,
          :description,
          :picture,
          :user,
          :tags,
          :reactions_count,
          :comments_count,
          :last_three_comments,
          :user_reaction,
          :created_at,
          :updated_at
        )
      end

      it 'includes user details' do
        serialized_post = dummy_class.public_serialize_post(post)
        expect(serialized_post[:user]).to eq({
          id: user.id,
          name: user.name,
          email: user.email,
          profile_picture: user.avatar_url
        })
      end

      it 'includes counts for reactions and comments' do
        serialized_post = dummy_class.public_serialize_post(post)
        expect(serialized_post[:reactions_count]).to eq(1)
        expect(serialized_post[:comments_count]).to eq(5)
      end

      it 'includes the last three comments by default' do
        serialized_post = dummy_class.public_serialize_post(post)
        expect(serialized_post[:last_three_comments].size).to eq(3)
      end

      it 'includes all comments when include_all_comments is true' do
        serialized_post = dummy_class.public_serialize_post(post, nil, include_all_comments: true)
        expect(serialized_post[:last_three_comments].size).to eq(5)
      end

      context 'with a current_user' do
        it 'includes the user_reaction if the user has reacted' do
          serialized_post = dummy_class.public_serialize_post(post, other_user)
          expect(serialized_post[:user_reaction]).not_to be_nil
          expect(serialized_post[:user_reaction][:id]).to eq(reaction.id)
        end

        it 'has a nil user_reaction if the user has not reacted' do
          serialized_post = dummy_class.public_serialize_post(post, user)
          expect(serialized_post[:user_reaction]).to be_nil
        end
      end

      context 'without a current_user' do
        it 'has a nil user_reaction' do
          serialized_post = dummy_class.public_serialize_post(post)
          expect(serialized_post[:user_reaction]).to be_nil
        end
      end
    end
  end

  describe '#serialize_comment' do
    let(:comment) { create(:comment, commentable: post, user: user) }
    let!(:reply) { create(:comment, commentable: comment, user: other_user) }
    let!(:reaction) { create(:reaction, reactionable: comment, user: other_user, reaction_type: 'love') }

    it 'returns the correct comment structure' do
      serialized_comment = dummy_class.public_serialize_comment(comment)
      expect(serialized_comment).to include(
        :id,
        :description,
        :commentable_type,
        :commentable_id,
        :user,
        :reactions_count,
        :replies_count,
        :user_reaction,
        :created_at,
        :updated_at
      )
    end

    it 'includes counts for reactions and replies' do
      serialized_comment = dummy_class.public_serialize_comment(comment)
      expect(serialized_comment[:reactions_count]).to eq(1)
      expect(serialized_comment[:replies_count]).to eq(1)
    end

    context 'with a current_user' do
      it 'includes the user_reaction if the user has reacted' do
        serialized_comment = dummy_class.public_serialize_comment(comment, other_user)
        expect(serialized_comment[:user_reaction]).not_to be_nil
        expect(serialized_comment[:user_reaction][:id]).to eq(reaction.id)
      end

      it 'has a nil user_reaction if the user has not reacted' do
        serialized_comment = dummy_class.public_serialize_comment(comment, user)
        expect(serialized_comment[:user_reaction]).to be_nil
      end
    end
  end

  describe '#serialize_reaction' do
    let(:reaction) { create(:reaction, reactionable: post, user: user) }

    it 'returns the correct reaction structure' do
      serialized_reaction = dummy_class.public_serialize_reaction(reaction)
      expect(serialized_reaction).to include(
        :id,
        :reaction_type,
        :user,
        :reactionable_type,
        :reactionable_id,
        :created_at
      )
      expect(serialized_reaction[:user][:id]).to eq(user.id)
    end
  end
end
