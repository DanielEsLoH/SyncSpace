# SyncSpace Backend API

Ruby on Rails API backend for SyncSpace - A real-time social blogging platform.

## Stack

- **Ruby** 3.4.5
- **Rails** 8.0.3 (API mode)
- **PostgreSQL** 16
- **Redis** 7 (ActionCable)
- **JWT** Authentication
- **Brevo** Email service

## Quick Start (Docker)

```bash
# Start all services
docker-compose up -d

# Create databases
docker-compose exec web bundle exec rails db:create db:migrate db:seed

# Run tests
docker-compose exec web bin/docker-test

# View logs
docker-compose logs -f web
```

## Development (Local)

```bash
# Install dependencies
bundle install

# Setup database
rails db:create db:migrate db:seed

# Run server
rails server -p 3001

# Run tests
bundle exec rspec
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `JWT_SECRET_KEY` - Secret for JWT tokens
- `BREVO_API_KEY` - Brevo email API key
- `CLIENT_URL` - Frontend application URL

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/confirm/:token` - Email confirmation
- `POST /api/v1/auth/forgot_password` - Request password reset
- `POST /api/v1/auth/reset_password` - Reset password
- `GET /api/v1/auth/me` - Current user info

### Posts
- `GET /api/v1/posts` - List posts
- `POST /api/v1/posts` - Create post
- `GET /api/v1/posts/:id` - Get post
- `PUT /api/v1/posts/:id` - Update post
- `DELETE /api/v1/posts/:id` - Delete post

### Comments
- `GET /api/v1/posts/:post_id/comments` - List comments
- `POST /api/v1/posts/:post_id/comments` - Create comment
- `POST /api/v1/comments/:comment_id/comments` - Reply to comment
- `PUT /api/v1/comments/:id` - Update comment
- `DELETE /api/v1/comments/:id` - Delete comment

### Reactions
- `POST /api/v1/posts/:post_id/reactions` - React to post
- `POST /api/v1/comments/:comment_id/reactions` - React to comment

### Tags
- `GET /api/v1/tags` - List tags
- `POST /api/v1/tags` - Create tag

### Notifications
- `GET /api/v1/notifications` - List notifications
- `PUT /api/v1/notifications/:id/mark_read` - Mark as read
- `PUT /api/v1/notifications/mark_all_read` - Mark all as read

### Users
- `GET /api/v1/users/:id` - Get user profile
- `PUT /api/v1/users/:id` - Update user profile

## WebSocket Channels

- `/cable` - ActionCable endpoint
  - `PostsChannel` - Real-time post updates
  - `CommentsChannel` - Real-time comment updates
  - `NotificationsChannel` - Real-time notifications

## Testing

755 specs with 94.76% coverage.

```bash
# All tests
bundle exec rspec

# Specific file
bundle exec rspec spec/models/user_spec.rb

# With documentation
bundle exec rspec --format documentation
```

## Database Schema

- **users** - User accounts
- **posts** - Blog posts
- **comments** - Comments (polymorphic - on posts or comments)
- **reactions** - Reactions (polymorphic - on posts or comments)
- **tags** - Post tags
- **post_tags** - Post-Tag associations
- **notifications** - User notifications (polymorphic notifiable)
