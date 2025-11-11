require 'rails_helper'

RSpec.describe "Eager Loading Test", type: :model do
  let(:user) { create(:user) }
  let(:post) { create(:post, user: user) }
  let!(:comment) { create(:comment, user: user, commentable: post) }

  it "eager loads user association for comments" do
    comments = Comment.includes(:user).all
    expect(comments.first.association(:user)).to be_loaded
  end

  it "eager loads user association for posts" do
    posts = Post.includes(:user).all
    expect(posts.first.association(:user)).to be_loaded
  end
end
