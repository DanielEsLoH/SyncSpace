# Clear existing data
puts "Clearing existing data..."
Notification.destroy_all
Reaction.destroy_all
PostTag.destroy_all
Comment.destroy_all
Post.destroy_all
Tag.destroy_all
User.destroy_all

puts "Creating users..."
# Create confirmed users
users = []
5.times do |i|
  users << User.create!(
    name: Faker::Name.name,
    email: "user#{i + 1}@example.com",
    password: "password123",
    password_confirmation: "password123",
    bio: Faker::Lorem.paragraph(sentence_count: 2),
    profile_picture: "https://i.pravatar.cc/300?img=#{i + 1}",
    confirmed_at: Time.current
  )
end

# Create Daniel (you)
daniel = User.create!(
  name: "Daniel E. Londoño",
  email: "daniel.esloh@gmail.com",
  password: "password123",
  password_confirmation: "password123",
  bio: "Full-stack developer passionate about building modern web applications",
  profile_picture: "https://i.pravatar.cc/300?img=10",
  confirmed_at: Time.current
)
users << daniel

puts "Created #{users.count} users"

puts "Creating tags..."
tags = [
  Tag.create!(name: "tech", color: "#3B82F6"),
  Tag.create!(name: "ruby", color: "#EF4444"),
  Tag.create!(name: "javascript", color: "#F59E0B"),
  Tag.create!(name: "react", color: "#06B6D4"),
  Tag.create!(name: "rails", color: "#DC2626"),
  Tag.create!(name: "nextjs", color: "#000000"),
  Tag.create!(name: "tutorial", color: "#8B5CF6"),
  Tag.create!(name: "discussion", color: "#10B981"),
  Tag.create!(name: "help", color: "#F97316"),
  Tag.create!(name: "showcase", color: "#EC4899")
]

puts "Created #{tags.count} tags"

puts "Creating posts..."
posts = []
20.times do |i|
  post = Post.create!(
    title: Faker::Lorem.sentence(word_count: 5),
    description: Faker::Lorem.paragraphs(number: 3).join("\n\n"),
    picture: i.even? ? "https://picsum.photos/800/600?random=#{i}" : nil,
    user: users.sample
  )

  # Add random tags (1-3 tags per post)
  rand(1..3).times do
    tag = tags.sample
    post.tags << tag unless post.tags.include?(tag)
  end

  posts << post
end

puts "Created #{posts.count} posts"

puts "Creating comments..."
comments = []
posts.each do |post|
  # Each post gets 2-5 comments
  rand(2..5).times do
    comment = Comment.create!(
      description: Faker::Lorem.paragraph(sentence_count: 2),
      user: users.sample,
      commentable: post
    )
    comments << comment

    # Some comments get replies (nested comments)
    if rand < 0.5
      reply = Comment.create!(
        description: Faker::Lorem.sentence(word_count: 10),
        user: users.sample,
        commentable: comment
      )
      comments << reply
    end
  end
end

puts "Created #{comments.count} comments (including replies)"

puts "Creating reactions..."
reactions_count = 0

# Add reactions to posts
posts.each do |post|
  rand(1..4).times do
    user = users.sample
    reaction_type = [ 'like', 'love', 'dislike' ].sample

    # Avoid duplicate reactions
    unless Reaction.exists?(user: user, reactionable: post, reaction_type: reaction_type)
      Reaction.create!(
        user: user,
        reactionable: post,
        reaction_type: reaction_type
      )
      reactions_count += 1
    end
  end
end

# Add reactions to comments
comments.each do |comment|
  if rand < 0.6 # 60% of comments get reactions
    rand(1..3).times do
      user = users.sample
      reaction_type = [ 'like', 'love' ].sample # Comments mostly get positive reactions

      unless Reaction.exists?(user: user, reactionable: comment, reaction_type: reaction_type)
        Reaction.create!(
          user: user,
          reactionable: comment,
          reaction_type: reaction_type
        )
        reactions_count += 1
      end
    end
  end
end

puts "Created #{reactions_count} reactions"

puts "Creating notifications..."
notifications_count = 0

# Create some notifications for Daniel
daniel_posts = Post.where(user: daniel)
daniel_comments = Comment.where(user: daniel)

# Notifications for comments on Daniel's posts
daniel_posts.each do |post|
  post.comments.where.not(user: daniel).each do |comment|
    Notification.create!(
      user: daniel,
      notifiable: comment,
      notification_type: 'comment_on_post',
      actor: comment.user
    )
    notifications_count += 1
  end
end

# Notifications for reactions on Daniel's posts
daniel_posts.each do |post|
  post.reactions.where.not(user: daniel).limit(3).each do |reaction|
    Notification.create!(
      user: daniel,
      notifiable: reaction,
      notification_type: 'reaction_on_post',
      actor: reaction.user
    )
    notifications_count += 1
  end
end

puts "Created #{notifications_count} notifications"

puts "\n==== Seed Data Summary ===="
puts "Users: #{User.count}"
puts "Posts: #{Post.count}"
puts "Tags: #{Tag.count}"
puts "Comments: #{Comment.count}"
puts "Reactions: #{Reaction.count}"
puts "Notifications: #{Notification.count}"
puts "\n==== Test Credentials ===="
puts "Email: daniel.esloh@gmail.com"
puts "Password: password123"
puts "\nOr use any user1@example.com through user5@example.com with password: password123"
puts "\n=========================="
