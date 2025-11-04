# SyncSpace Backend Documentation

Complete technical documentation for the Ruby on Rails backend API.

**Author**: Daniel E. Londoño (daniel.esloh@gmail.com)
**Rails Version**: 8.0.3
**Ruby Version**: 3.4.5
**Database**: PostgreSQL 17
**Status**: Production Ready ✅

---

## Table of Contents
1. [Architecture](#architecture)
2. [Database Schema](#database-schema)
3. [Authentication](#authentication)
4. [API Endpoints](#api-endpoints)
5. [Real-time Features](#real-time-features)
6. [Security](#security)
7. [Performance](#performance)
8. [Testing](#testing)
9. [Deployment](#deployment)

---

## Architecture

### Design Principles
- **API-only Rails application** - No views, stateless REST API
- **JWT Authentication** - Stateless with rotating refresh tokens
- **Polymorphic Associations** - Comments and Reactions on multiple models
- **Service Objects** - Business logic extraction (JWT, Search)
- **Real-time** - ActionCable for WebSocket connections
- **Security-first** - Rate limiting, sanitization, token rotation

### Tech Stack
- **Framework**: Ruby on Rails 8.0 (API mode)
- **Language**: Ruby 3.4.5
- **Database**: PostgreSQL 17 with pg_trgm extension
- **Cache**: Redis 7 for ActionCable and sessions
- **Authentication**: JWT with bcrypt
- **Email**: MailerSend SMTP
- **Rate Limiting**: Rack::Attack
- **Testing**: RSpec (755 examples, 92% coverage)
- **Code Quality**: SimpleCov, RuboCop

### Folder Structure
```
server/
├── app/
│   ├── channels/           # ActionCable WebSocket channels
│   │   ├── application_cable/
│   │   ├── comments_channel.rb
│   │   ├── notifications_channel.rb
│   │   └── posts_channel.rb
│   ├── controllers/
│   │   └── api/v1/         # Versioned API controllers
│   │       ├── auth_controller.rb
│   │       ├── comments_controller.rb
│   │       ├── notifications_controller.rb
│   │       ├── posts_controller.rb
│   │       ├── reactions_controller.rb
│   │       ├── search_controller.rb
│   │       ├── tags_controller.rb
│   │       └── users_controller.rb
│   ├── models/
│   │   ├── comment.rb
│   │   ├── notification.rb
│   │   ├── post.rb
│   │   ├── post_tag.rb
│   │   ├── reaction.rb
│   │   ├── tag.rb
│   │   └── user.rb
│   ├── mailers/
│   │   └── user_mailer.rb
│   └── services/
│       └── json_web_token.rb
├── config/
│   ├── initializers/
│   │   ├── cors.rb
│   │   └── rack_attack.rb
│   ├── cable.yml
│   ├── database.yml
│   └── routes.rb
├── db/
│   ├── migrate/
│   └── seeds.rb
└── spec/                   # RSpec test suite
```

---

## Database Schema

### Users Table
```ruby
create_table "users" do |t|
  t.string "name", null: false                    # 2-50 chars
  t.string "email", null: false                   # unique, validated
  t.string "password_digest", null: false         # bcrypt hash
  t.text "bio"                                    # max 500 chars
  t.string "profile_picture"                      # URL or auto-generated

  # Email confirmation
  t.datetime "confirmed_at"
  t.string "confirmation_token"
  t.datetime "confirmation_sent_at"

  # Password reset
  t.string "reset_password_token"
  t.datetime "reset_password_sent_at"

  # Refresh tokens (rotating)
  t.string "refresh_token"
  t.datetime "refresh_token_expires_at"

  # User preferences
  t.jsonb "preferences", default: {}, null: false # theme, language

  t.timestamps
end

add_index "users", "email", unique: true
add_index "users", "confirmation_token"
add_index "users", "reset_password_token"
add_index "users", "refresh_token", unique: true
add_index "users", "refresh_token_expires_at"
add_index "users", "name", using: :gin, opclass: :gin_trgm_ops
add_index "users", "preferences", using: :gin
```

**Validations:**
- Name: 2-50 characters
- Email: Valid format, unique
- Password: Minimum 6 characters
- Theme: `light`, `dark`, or `system`
- Language: `en` or `es`

### Posts Table
```ruby
create_table "posts" do |t|
  t.string "title", null: false                   # 3-200 chars
  t.text "description", null: false               # 10-5000 chars
  t.string "picture"                              # optional image URL
  t.bigint "user_id", null: false

  # Counter caches for performance
  t.integer "comments_count", default: 0, null: false
  t.integer "reactions_count", default: 0, null: false

  t.timestamps
end

add_index "posts", "user_id"
add_index "posts", "comments_count"
add_index "posts", "reactions_count"
add_index "posts", "title", using: :gin, opclass: :gin_trgm_ops
add_index "posts", "description", using: :gin, opclass: :gin_trgm_ops
```

**Features:**
- Input sanitization on title (strips all HTML)
- Input sanitization on description (allows safe HTML tags)
- Full-text search with GIN indexes
- Counter cache for performance

### Comments Table (Polymorphic)
```ruby
create_table "comments" do |t|
  t.text "description", null: false               # 1-2000 chars
  t.bigint "user_id", null: false
  t.string "commentable_type", null: false        # 'Post' or 'Comment'
  t.bigint "commentable_id", null: false

  # Counter caches
  t.integer "comments_count", default: 0, null: false  # replies
  t.integer "reactions_count", default: 0, null: false

  t.timestamps
end

add_index "comments", ["commentable_type", "commentable_id"]
add_index "comments", "user_id"
add_index "comments", "comments_count"
add_index "comments", "reactions_count"
```

**Features:**
- Nested comments (unlimited depth)
- Polymorphic association (comments on posts and comments)
- Self-parent prevention validation
- Input sanitization (allows limited HTML)

### Reactions Table (Polymorphic)
```ruby
create_table "reactions" do |t|
  t.bigint "user_id", null: false
  t.string "reactionable_type", null: false       # 'Post' or 'Comment'
  t.bigint "reactionable_id", null: false
  t.string "reaction_type", null: false           # 'like', 'love', 'dislike'

  t.timestamps
end

add_index "reactions", ["reactionable_type", "reactionable_id"]
add_index "reactions", "user_id"
add_index "reactions", ["user_id", "reactionable_type", "reactionable_id", "reaction_type"],
  unique: true, name: "unique_user_reaction"
```

**Features:**
- Three reaction types: like, love, dislike
- Toggle behavior (add/change/remove)
- Uniqueness constraint
- Counter cache for parent records

### Tags Table
```ruby
create_table "tags" do |t|
  t.string "name", null: false                    # 2-30 chars, unique
  t.string "color", null: false                   # hex color

  t.timestamps
end

add_index "tags", "name", unique: true
```

**Features:**
- Auto-generation if not exists
- Custom color generation
- Many-to-many with posts via `post_tags`

### PostTags Table (Join)
```ruby
create_table "post_tags" do |t|
  t.bigint "post_id", null: false
  t.bigint "tag_id", null: false

  t.timestamps
end

add_index "post_tags", ["post_id", "tag_id"], unique: true
add_index "post_tags", "tag_id"
```

### Notifications Table (Polymorphic)
```ruby
create_table "notifications" do |t|
  t.bigint "user_id", null: false                 # recipient
  t.bigint "actor_id", null: false                # who triggered it
  t.string "notifiable_type", null: false         # 'Comment' or 'Reaction'
  t.bigint "notifiable_id", null: false
  t.string "notification_type", null: false       # see types below
  t.string "message"
  t.datetime "read_at"

  t.timestamps
end

add_index "notifications", "user_id"
add_index "notifications", "actor_id"
add_index "notifications", ["notifiable_type", "notifiable_id"]
add_index "notifications", "read_at"
```

**Notification Types:**
- `comment_on_post` - Someone commented on your post
- `reply_to_comment` - Someone replied to your comment
- `reaction_on_post` - Someone reacted to your post
- `reaction_on_comment` - Someone reacted to your comment

---

## Authentication

### JWT Token System

#### Access Tokens
- **Lifetime**: 24 hours
- **Purpose**: API authentication
- **Payload**: `{ user_id, type: 'access', exp }`
- **Header**: `Authorization: Bearer <token>`

#### Refresh Tokens
- **Lifetime**: 7 days
- **Purpose**: Obtain new access tokens
- **Payload**: `{ user_id, type: 'refresh', exp, jti }`
- **Storage**: Database (users.refresh_token)
- **Security**: Rotating tokens (old invalidated on refresh)

### Token Flow

```ruby
# Login - Returns both tokens
POST /api/v1/auth/login
Response: { token, refresh_token, user }

# Access token expires (24h)
# Use refresh token to get new pair
POST /api/v1/auth/refresh
Body: { refresh_token }
Response: { token, refresh_token } # Both new

# Logout - Invalidate refresh token
DELETE /api/v1/auth/logout
```

### Password Security
- **Hashing**: bcrypt with default cost factor (12)
- **Minimum Length**: 6 characters
- **Validation**: Required on creation, optional on update
- **Reset**: Time-limited tokens (2 hours)
- **Email Confirmation**: Required before login

---

## API Endpoints

### Routing Structure
```ruby
Rails.application.routes.draw do
  mount ActionCable.server => '/cable'

  namespace :api do
    namespace :v1 do
      # Authentication
      post 'auth/register'
      post 'auth/login'
      post 'auth/refresh'
      post 'auth/forgot_password'
      post 'auth/reset_password'
      get 'auth/confirm/:token'
      get 'auth/me'

      # Posts & Comments
      resources :posts do
        resources :comments, only: [:index, :create]
        post 'reactions', to: 'reactions#toggle'
        get 'reactions', to: 'reactions#index'
      end

      resources :comments, only: [:update, :destroy] do
        resources :comments, only: [:index, :create]
        post 'reactions', to: 'reactions#toggle'
        get 'reactions', to: 'reactions#index'
      end

      # Search, Tags, Notifications, Users
      get 'search'
      resources :tags, only: [:index, :show] do
        member { get 'posts' }
      end

      resources :notifications, only: [:index] do
        member { patch 'read' }
        collection { patch 'mark_all_read' }
      end

      resources :users, only: [:show, :update] do
        collection { get 'search' }
        member do
          get 'posts'
          patch 'preferences'
        end
      end
    end
  end
end
```

### Pagination
All list endpoints support pagination:
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 10, max: 50)

Example: `GET /api/v1/posts?page=2&per_page=20`

---

## Real-time Features

### ActionCable Channels

#### PostsChannel
```ruby
# Subscribe to posts stream
channel = cable.subscriptions.create("PostsChannel")

# Broadcasts:
# - post_created: { post }
# - post_updated: { post }
# - post_deleted: { post_id }
```

#### CommentsChannel
```ruby
# Subscribe to specific post
channel = cable.subscriptions.create({
  channel: "CommentsChannel",
  post_id: 1
})

# Actions:
# - follow_post: Subscribe to post comments
# - unfollow_post: Unsubscribe
# - follow_comment: Subscribe to comment replies
# - unfollow_comment: Unsubscribe

# Broadcasts:
# - comment_created: { comment }
# - comment_updated: { comment }
# - comment_deleted: { comment_id }
```

#### NotificationsChannel
```ruby
# Subscribe to user notifications
channel = cable.subscriptions.create("NotificationsChannel")

# Broadcasts:
# - notification_created: { notification }
# - notification_read: { notification_id }
# - notifications_count: { unread_count }
```

### WebSocket Authentication
```javascript
// Method 1: Query parameter
ws://localhost:8000/cable?token=<jwt_token>

// Method 2: Sec-WebSocket-Protocol header
Sec-WebSocket-Protocol: Bearer <jwt_token>
```

---

## Security

### Rate Limiting (Rack::Attack)

| Endpoint | Limit | Window |
|----------|-------|--------|
| Login | 5 requests | 1 minute |
| Registration | 3 requests | 5 minutes |
| Password Reset | 3 requests | 1 hour |
| Post Creation | 10 requests | 1 minute |
| Comment Creation | 20 requests | 1 minute |
| Search | 30 requests | 1 minute |
| **Global** | 300 requests | 5 minutes |

### Input Sanitization

**Posts:**
```ruby
# Title: Strips ALL HTML
ActionView::Base.full_sanitizer.sanitize(title)

# Description: Allows safe tags
ActionController::Base.helpers.sanitize(description,
  tags: %w[p br strong em ul ol li a code pre blockquote],
  attributes: %w[href]
)
```

**Comments:**
```ruby
# Allows minimal HTML
ActionController::Base.helpers.sanitize(description,
  tags: %w[p br strong em code],
  attributes: []
)
```

### Security Headers
```ruby
# CORS configuration
config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV.fetch('CLIENT_URL', 'http://localhost:3000')
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options],
      credentials: true
  end
end
```

### Additional Security
- ✅ SQL injection prevention (ActiveRecord parameterization)
- ✅ Mass assignment protection (strong parameters)
- ✅ CSRF tokens (for cookie-based auth)
- ✅ Secure password storage (bcrypt)
- ✅ Token expiration
- ✅ Token rotation
- ✅ Email confirmation required

---

## Performance

### Database Optimization

#### GIN Indexes (Trigram Search)
```ruby
enable_extension 'pg_trgm'

add_index :posts, :title, using: :gin, opclass: :gin_trgm_ops
add_index :posts, :description, using: :gin, opclass: :gin_trgm_ops
add_index :users, :name, using: :gin, opclass: :gin_trgm_ops
```

**Benefits:**
- 10-100x faster ILIKE queries
- Case-insensitive pattern matching
- Similarity searches

#### Counter Caches
```ruby
# Eliminates COUNT(*) queries
belongs_to :commentable, counter_cache: :comments_count
belongs_to :reactionable, counter_cache: :reactions_count
```

**Impact:**
- Instant count retrieval
- Reduced database load
- 5-10x faster feed rendering

#### N+1 Query Prevention
```ruby
# Eager loading
Post.includes(:user, :tags, :reactions, :comments)

# Preload associations
@posts = Post.with_user.includes(:tags)
```

### Redis Caching
```ruby
# ActionCable adapter
config.action_cable.adapter = :redis
config.action_cable.url = ENV.fetch('REDIS_URL', 'redis://localhost:6379/1')
```

---

## Testing

### RSpec Test Suite

**Coverage**: 92.08% (651/707 lines)

**Test Structure:**
```
spec/
├── channels/              # ActionCable channels (6 files)
├── controllers/           # API controllers (8 files)
├── mailers/              # Email mailers (1 file)
├── models/               # ActiveRecord models (8 files)
├── requests/             # Request/integration tests (12 files)
└── rails_helper.rb
```

**Running Tests:**
```bash
# All tests
bundle exec rspec

# Specific file
bundle exec rspec spec/models/user_spec.rb

# With coverage report
bundle exec rspec
open coverage/index.html
```

### Test Configuration
```ruby
# SimpleCov configuration (.simplecov)
SimpleCov.start 'rails' do
  minimum_coverage 70

  add_group 'Controllers', 'app/controllers'
  add_group 'Models', 'app/models'
  add_group 'Services', 'app/services'
  add_group 'Channels', 'app/channels'
  add_group 'Mailers', 'app/mailers'
end
```

---

## Deployment

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/syncspace_production

# Redis
REDIS_URL=redis://host:6379/1

# JWT
JWT_SECRET_KEY=<secure-random-key>

# Email (MailerSend)
MAILERSEND_API_TOKEN=<your-token>
MAILERSEND_FROM_EMAIL=no-reply@syncspace.com

# Frontend URL
CLIENT_URL=https://syncspace.com

# Rate limiting
RACK_ATTACK_ENABLED=true
```

### Docker Deployment

```bash
# Build and start
docker-compose up --build -d

# Run migrations
docker-compose exec web rails db:migrate

# Check logs
docker-compose logs -f web

# Stop services
docker-compose down
```

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Redis connection established
- [ ] SSL/HTTPS enabled
- [ ] CORS origins configured
- [ ] Email service configured (MailerSend)
- [ ] JWT secret key generated (SecureRandom.hex(64))
- [ ] Rate limiting enabled
- [ ] ActionCable configured for production
- [ ] Database connection pool sized appropriately

### Recommended Stack
- **Backend Hosting**: Render.com, Fly.io, or Heroku
- **Database**: Managed PostgreSQL (17+)
- **Cache**: Managed Redis (7+)
- **Email**: MailerSend SMTP

---

## Development Commands

```bash
# Start services
docker-compose up -d

# Database
rails db:create
rails db:migrate
rails db:seed
rails db:reset

# Console
rails console

# Routes
rails routes | grep api

# Tests
bundle exec rspec
bundle exec rspec --format documentation

# Coverage
open coverage/index.html

# Migrations
rails generate migration MigrationName
rails db:migrate
rails db:rollback

# Debugging
rails db        # Database console
rails routes    # Show all routes
```

---

## API Response Format

### Success Response
```json
{
  "post": { ... },
  "message": "Post created successfully"
}
```

### Error Response
```json
{
  "error": "Unauthorized",
  "errors": ["Email has already been taken"]
}
```

### Pagination Meta
```json
{
  "posts": [...],
  "meta": {
    "current_page": 1,
    "per_page": 10,
    "total_count": 100,
    "total_pages": 10
  }
}
```

---

## Maintenance

### Database Maintenance
```bash
# Backup
pg_dump syncspace_production > backup.sql

# Restore
psql syncspace_production < backup.sql

# Analyze tables
rails db:analyze

# Vacuum
VACUUM ANALYZE;
```

### Monitoring
- Check Redis connection: `redis-cli ping`
- Database connections: `SELECT count(*) FROM pg_stat_activity`
- ActionCable connections: Check Redis keys
- Rate limit status: Check Rack::Attack logs

---

## Additional Resources

- [API Documentation](API.md)
- [MailerSend Setup](MAILERSEND_SETUP.md)
- [Main README](../README.md)

**Last Updated**: November 3, 2025
