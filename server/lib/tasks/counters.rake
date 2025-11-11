namespace :counters do
  desc "Reset all counter caches"
  task reset: :environment do
    puts "Resetting User#posts_count..."
    User.find_each do |user|
      User.reset_counters(user.id, :posts)
    end

    puts "Resetting Post#comments_count..."
    Post.find_each do |post|
      Post.reset_counters(post.id, :comments)
    end

    puts "Resetting Post#reactions_count..."
    Post.find_each do |post|
      Post.reset_counters(post.id, :reactions)
    end

    puts "Resetting Comment#reactions_count..."
    Comment.find_each do |comment|
      Comment.reset_counters(comment.id, :reactions)
    end

    puts "Resetting Comment#comments_count..."
    Comment.find_each do |comment|
      Comment.reset_counters(comment.id, :comments)
    end

    puts "Resetting Tag#posts_count..."
    Tag.find_each do |tag|
      Tag.reset_counters(tag.id, :posts)
    end

    puts "Done."
  end
end
