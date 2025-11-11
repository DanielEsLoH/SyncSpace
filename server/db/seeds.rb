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

# Create Daniel's sample posts first
daniel_posts_data = [
  {
    title: "Building a Real-Time Social Platform with Rails and Next.js",
    description: "I recently completed SyncSpace, a modern social platform that demonstrates real-time features using ActionCable and WebSockets.\n\nKey features include:\n- Instant post updates across all clients\n- Real-time comment threads with unlimited nesting\n- Live reaction counts\n- WebSocket-based notification system\n\nThe tech stack includes Rails 8, Next.js 16, PostgreSQL, and Redis. All with 95% test coverage!",
    tags: ["tech", "rails", "nextjs", "showcase"]
  },
  {
    title: "Tips for Optimizing Rails API Performance",
    description: "After working on several Rails API projects, here are my top tips for keeping your API fast and efficient:\n\n1. Use counter caches for frequently accessed counts\n2. Implement strategic eager loading to avoid N+1 queries\n3. Add proper database indexes on foreign keys\n4. Use Redis for caching expensive operations\n5. Consider using Rack::Attack for rate limiting\n\nWhat are your favorite performance optimization techniques?",
    tags: ["rails", "tutorial", "tech"]
  }
]

daniel_posts_data.each_with_index do |post_data, i|
  post = Post.create!(
    title: post_data[:title],
    description: post_data[:description],
    picture: "https://picsum.photos/800/600?random=daniel_#{i}",
    user: daniel
  )

  post_data[:tags].each do |tag_name|
    tag = tags.find { |t| t.name == tag_name }
    post.tags << tag if tag && !post.tags.include?(tag)
  end

  posts << post
end

# Create random posts for other users
18.times do |i|
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

# Add specific comments to Daniel's posts
daniel_first_post = posts.find { |p| p.user == daniel }
if daniel_first_post
  sample_comments = [
    "This looks amazing! How did you handle the WebSocket connection management?",
    "Really impressive work! I'd love to see a blog post about your architecture decisions.",
    "The real-time features are super smooth. What made you choose ActionCable over other WebSocket solutions?"
  ]

  sample_comments.each do |comment_text|
    comment = Comment.create!(
      description: comment_text,
      user: users.reject { |u| u == daniel }.sample,
      commentable: daniel_first_post
    )
    comments << comment

    # Add a reply from Daniel
    reply = Comment.create!(
      description: "Thanks! I chose ActionCable because it integrates seamlessly with Rails and Redis makes it easy to scale horizontally.",
      user: daniel,
      commentable: comment
    )
    comments << reply
  end
end

# Add random comments to other posts
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

      # Occasionally add a second-level reply
      if rand < 0.3
        second_reply = Comment.create!(
          description: Faker::Lorem.sentence(word_count: 8),
          user: users.sample,
          commentable: reply
        )
        comments << second_reply
      end
    end
  end
end

puts "Created #{comments.count} comments (including replies)"

puts "Creating reactions..."
reactions_count = 0

# Add reactions to posts
posts.each do |post|
  # Daniel's posts get more reactions for better demo
  num_reactions = post.user == daniel ? rand(4..6) : rand(1..4)

  num_reactions.times do
    user = users.sample
    # Skip if user is the post owner
    next if user == post.user

    reaction_type = [ 'like', 'love', 'dislike' ].sample

    # Avoid duplicate reactions (one reaction per user per post)
    unless Reaction.exists?(user: user, reactionable: post)
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
      # Skip if user is the comment owner
      next if user == comment.user

      reaction_type = [ 'like', 'love' ].sample # Comments mostly get positive reactions

      unless Reaction.exists?(user: user, reactionable: comment)
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
