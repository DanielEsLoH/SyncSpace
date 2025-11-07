# Service to handle @mention detection and notification creation
# Detects mentions in format: @username or @email
class MentionService
  # Extract mentioned users from text
  # Supports: @username and @email@domain.com
  def self.extract_mentions(text)
    return [] if text.blank?

    mentions = []

    # Pattern for @email (must be checked first to avoid matching email parts as usernames)
    email_pattern = /@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
    # Pattern for @username (alphanumeric + underscore, 3-30 chars)
    username_pattern = /@([a-zA-Z0-9_]{3,30})\b/

    # Find email mentions first and remove them from text for username scanning
    text_for_usernames = text.dup
    text.scan(email_pattern) do |match|
      mentions << match[0]
      # Remove this email from the text to prevent parts being matched as usernames
      text_for_usernames.gsub!("@#{match[0]}", " ")
    end

    # Find username mentions in text with emails removed
    text_for_usernames.scan(username_pattern) do |match|
      mentions << match[0]
    end

    mentions.uniq
  end

  # Find users from mention strings
  def self.find_mentioned_users(mentions)
    return [] if mentions.empty?

    users = []

    mentions.each do |mention|
      if mention.include?("@")
        # It's an email
        user = User.find_by(email: mention)
      else
        # It's a username - match by name (case-insensitive, partial match)
        # First try exact match, then try partial match
        user = User.where("LOWER(name) = ?", mention.downcase).first ||
               User.where("LOWER(name) LIKE ?", "%#{mention.downcase}%").first
      end

      users << user if user
    end

    users.uniq
  end

  # Create mention notifications for all mentioned users
  # mentionable: The Post or Comment that contains mentions
  # actor: The user who created the mention
  def self.create_mention_notifications(mentionable, actor)
    return [] if mentionable.nil? || actor.nil?

    # Determine which field contains the text
    text = if mentionable.respond_to?(:title) && mentionable.respond_to?(:description)
      # For Posts: search in both title and description
      "#{mentionable.title} #{mentionable.description}"
    elsif mentionable.respond_to?(:description)
      # For Comments: only description
      mentionable.description
    else
      nil
    end

    return [] if text.blank?

    # Extract and find mentioned users
    mentions = extract_mentions(text)
    mentioned_users = find_mentioned_users(mentions)

    notifications = []

    mentioned_users.each do |user|
      # Don't notify the actor (person who made the mention)
      next if user.id == actor.id

      # Check if notification already exists to avoid duplicates
      existing = Notification.find_by(
        user: user,
        notifiable: mentionable,
        notification_type: "mention",
        actor: actor
      )

      next if existing

      # Create mention notification
      notification = Notification.create(
        user: user,
        notifiable: mentionable,
        notification_type: "mention",
        actor: actor
      )

      notifications << notification if notification.persisted?
    end

    notifications
  end

  # Process mentions for a newly created or updated mentionable
  # Returns array of created notifications
  def self.process_mentions(mentionable, actor)
    create_mention_notifications(mentionable, actor)
  rescue StandardError => e
    Rails.logger.error("MentionService error: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    []
  end
end
