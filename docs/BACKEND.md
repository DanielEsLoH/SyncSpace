# SyncSpace Backend Documentation

## Overview

The SyncSpace backend is a Ruby on Rails 8 API that provides authentication, post management, comments, reactions, tags, search, and notifications.

**Author**: Daniel E. Londoño (daniel.esloh@gmail.com)
**Rails Version**: 8.0.3
**Ruby Version**: 3.4.5
**Database**: PostgreSQL 17

## Architecture

- **API-only Rails application** - No views, only JSON responses
- **JWT Authentication** - Stateless authentication with JSON Web Tokens
- **Polymorphic Associations** - Comments and Reactions can belong to multiple models
- **CORS enabled** - Configured for frontend at `http://localhost:3000`
- **RESTful API** - Following REST conventions

## Database Schema

### Users
```ruby
- id (primary key)
- name (string, required)
- email (string, unique, required)
- password_digest (string, required) # bcrypt encrypted
- profile_picture (string, optional)
- bio (text, optional)
- confirmed_at (datetime)
- confirmation_token (string, indexed)
- confirmation_sent_at (datetime)
- reset_password_token (string, indexed)
- reset_password_sent_at (datetime)
- created_at, updated_at
```

### Posts
```ruby
- id (primary key)
- title (string, required, 3-200 chars)
- description (text, required, 10-5000 chars)
- picture (string, optional)
- user_id (foreign key to users, required)
- created_at, updated_at
```

### Comments (Polymorphic)
```ruby
- id (primary key)
- description (text, required, 1-2000 chars)
- user_id (foreign key to users, required)
- commentable_type (string) # 'Post' or 'Comment'
- commentable_id (integer)
- created_at, updated_at
```

### Reactions (Polymorphic)
```ruby
- id (primary key)
- user_id (foreign key to users, required)
- reactionable_type (string) # 'Post' or 'Comment'
- reactionable_id (integer)
- reaction_type (string, required) # 'like', 'love', 'dislike'
- created_at, updated_at

# Unique constraint: [user_id, reactionable_type, reactionable_id, reaction_type]
```

### Tags
```ruby
- id (primary key)
- name (string, unique, required, 2-30 chars)
- color (string, required, hex color format)
- created_at, updated_at
```

### PostTags (Join Table)
```ruby
- id (primary key)
- post_id (foreign key to posts, required)
- tag_id (foreign key to tags, required)
- created_at, updated_at

# Unique constraint: [post_id, tag_id]
```

### Notifications (Polymorphic)
```ruby
- id (primary key)
- user_id (foreign key to users, required) # recipient
- notifiable_type (string) # 'Comment' or 'Reaction'
- notifiable_id (integer)
- notification_type (string, required)
  # 'comment_on_post', 'reply_to_comment', 'mention',
  # 'reaction_on_post', 'reaction_on_comment'
- read_at (datetime, nullable)
- actor_id (foreign key to users, required) # who triggered it
- created_at, updated_at
```

## API Endpoints

### Authentication

#### Register
```
POST /api/v1/auth/register
Body: {
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "profile_picture": "https://...", // optional
    "bio": "My bio" // optional
  }
}
Response: 201 Created
{
  "message": "Registration successful. Please check your email to confirm your account.",
  "user": { ... }
}
```

#### Login
```
POST /api/v1/auth/login
Body: {
  "email": "john@example.com",
  "password": "password123"
}
Response: 200 OK
{
  "token": "eyJhbGc...",
  "user": { ... }
}
```

#### Confirm Email
```
GET /api/v1/auth/confirm/:token
Response: 200 OK
{
  "message": "Email confirmed successfully",
  "token": "eyJhbGc...",
  "user": { ... }
}
```

#### Forgot Password
```
POST /api/v1/auth/forgot_password
Body: {
  "email": "john@example.com"
}
Response: 200 OK
{
  "message": "Password reset instructions sent to your email"
}
```

#### Reset Password
```
POST /api/v1/auth/reset_password
Body: {
  "token": "reset_token_here",
  "password": "newpassword123",
  "password_confirmation": "newpassword123"
}
Response: 200 OK
{
  "message": "Password reset successfully",
  "token": "eyJhbGc...",
  "user": { ... }
}
```

#### Get Current User
```
GET /api/v1/auth/me
Headers: { "Authorization": "Bearer <token>" }
Response: 200 OK
{
  "user": { ... }
}
```

### Posts

#### List Posts (Paginated)
```
GET /api/v1/posts?page=1&per_page=10&user_id=1
Headers: None required (public endpoint)
Response: 200 OK
{
  "posts": [
    {
      "id": 1,
      "title": "My First Post",
      "description": "...",
      "picture": "https://...",
      "user": { ... },
      "tags": [ ... ],
      "reactions_count": 5,
      "comments_count": 3,
      "last_three_comments": [ ... ],
      "created_at": "2025-10-21T...",
      "updated_at": "2025-10-21T..."
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 10,
    "total_count": 20,
    "total_pages": 2
  }
}
```

#### Get Single Post
```
GET /api/v1/posts/:id
Headers: None required (public endpoint)
Response: 200 OK
{
  "post": {
    "id": 1,
    "title": "...",
    "last_three_comments": [ ... ], // All comments for detail view
    ...
  }
}
```

#### Create Post
```
POST /api/v1/posts
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "post": {
    "title": "My Post Title",
    "description": "Post description...",
    "picture": "https://..." // optional
  },
  "tags": ["tech", "ruby", "rails"] // optional array
}
Response: 201 Created
{
  "message": "Post created successfully",
  "post": { ... }
}
```

#### Update Post
```
PUT /api/v1/posts/:id
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "post": {
    "title": "Updated Title",
    "description": "Updated description"
  },
  "tags": ["tech", "javascript"]
}
Response: 200 OK
{
  "message": "Post updated successfully",
  "post": { ... }
}
Note: Only the post owner can update
```

#### Delete Post
```
DELETE /api/v1/posts/:id
Headers: { "Authorization": "Bearer <token>" }
Response: 200 OK
{
  "message": "Post deleted successfully"
}
Note: Only the post owner can delete
```

### Comments

#### List Comments on Post
```
GET /api/v1/posts/:post_id/comments
Headers: None required
Response: 200 OK
{
  "comments": [
    {
      "id": 1,
      "description": "Great post!",
      "commentable_type": "Post",
      "commentable_id": 1,
      "user": { ... },
      "reactions_count": 2,
      "replies_count": 1,
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

#### List Replies to Comment
```
GET /api/v1/comments/:comment_id/comments
Headers: None required
Response: 200 OK (same structure as above)
```

#### Create Comment on Post
```
POST /api/v1/posts/:post_id/comments
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "comment": {
    "description": "This is my comment"
  }
}
Response: 201 Created
{
  "message": "Comment created successfully",
  "comment": { ... }
}
Note: Creates notification for post owner
```

#### Reply to Comment
```
POST /api/v1/comments/:comment_id/comments
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "comment": {
    "description": "This is my reply"
  }
}
Response: 201 Created
Note: Creates notification for comment owner
```

#### Update Comment
```
PUT /api/v1/comments/:id
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "comment": {
    "description": "Updated comment"
  }
}
Response: 200 OK
Note: Only comment owner can update
```

#### Delete Comment
```
DELETE /api/v1/comments/:id
Headers: { "Authorization": "Bearer <token>" }
Response: 200 OK
Note: Only comment owner can delete
```

### Reactions

#### Toggle Reaction on Post
```
POST /api/v1/posts/:post_id/reactions
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "reaction_type": "like" // or "love" or "dislike"
}
Response: 200 OK
{
  "action": "added", // or "removed" if toggled off
  "message": "Reaction added",
  "reactions_count": 6
}
Note: Clicking again removes the reaction (toggle)
Note: Creates notification for post owner
```

#### Toggle Reaction on Comment
```
POST /api/v1/comments/:comment_id/reactions
(Same structure as above)
```

#### Get Reactions for Post
```
GET /api/v1/posts/:post_id/reactions
Headers: { "Authorization": "Bearer <token>" }
Response: 200 OK
{
  "reactions": {
    "like": 5,
    "love": 2,
    "dislike": 1
  },
  "user_reactions": ["like"] // current user's reactions
}
```

### Search

#### Advanced Search
```
GET /api/v1/search?q=ruby&title=tutorial&user=@daniel&tag=tech&page=1
Headers: None required
Query Parameters:
  - q: general search (searches title, description, username, tags)
  - title: search in post titles only
  - user: search by username or @username or @email
  - tag: search by tag name
  - page, per_page: pagination
Response: 200 OK
{
  "posts": [ ... ],
  "meta": { ... }
}
```

### Notifications

#### List Notifications
```
GET /api/v1/notifications?unread=true&page=1&per_page=20
Headers: { "Authorization": "Bearer <token>" }
Query Parameters:
  - unread: true/false (filter)
  - read: true/false (filter)
  - page, per_page: pagination
Response: 200 OK
{
  "notifications": [
    {
      "id": 1,
      "notification_type": "comment_on_post",
      "read": false,
      "actor": { ... },
      "notifiable": { ... },
      "created_at": "..."
    }
  ],
  "unread_count": 5,
  "meta": { ... }
}
```

#### Mark Notification as Read
```
PUT /api/v1/notifications/:id/mark_read
Headers: { "Authorization": "Bearer <token>" }
Response: 200 OK
{
  "message": "Notification marked as read",
  "notification": { ... }
}
```

#### Mark All Notifications as Read
```
PUT /api/v1/notifications/mark_all_read
Headers: { "Authorization": "Bearer <token>" }
Response: 200 OK
{
  "message": "All notifications marked as read",
  "unread_count": 0
}
```

### Users

#### Get User Profile
```
GET /api/v1/users/:id
Headers: None required (public endpoint)
Response: 200 OK
{
  "user": {
    "id": 1,
    "name": "Daniel E. Londoño",
    "email": "daniel.esloh@gmail.com",
    "profile_picture": "...",
    "bio": "...",
    "stats": {
      "total_posts": 5,
      "total_reactions": 20,
      "total_comments": 15
    },
    "created_at": "..."
  }
}
```

#### Update User Profile
```
PUT /api/v1/users/:id
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "user": {
    "name": "New Name",
    "profile_picture": "https://...",
    "bio": "Updated bio"
  }
}
Response: 200 OK
Note: Can only update own profile
```

#### Get User's Posts
```
GET /api/v1/users/:id/posts?page=1&per_page=10
Headers: None required
Response: 200 OK
{
  "posts": [ ... ],
  "meta": { ... }
}
```

### Tags

#### List All Tags
```
GET /api/v1/tags?sort=popular
Headers: None required
Query Parameters:
  - sort: "popular" or "alphabetical" (default)
Response: 200 OK
{
  "tags": [
    {
      "id": 1,
      "name": "tech",
      "color": "#3B82F6",
      "posts_count": 15
    }
  ]
}
```

#### Get Tag
```
GET /api/v1/tags/:id
Headers: None required
Response: 200 OK
{
  "tag": { ... }
}
```

#### Get Posts by Tag
```
GET /api/v1/tags/:id/posts?page=1&per_page=10
Headers: None required
Response: 200 OK
{
  "tag": { ... },
  "posts": [ ... ],
  "meta": { ... }
}
```

## Authentication Flow

1. **User registers** → `POST /api/v1/auth/register`
   - Account created with `confirmed_at: nil`
   - Confirmation email sent (when MailerSend is configured)

2. **User confirms email** → `GET /api/v1/auth/confirm/:token`
   - Sets `confirmed_at` to current time
   - Returns JWT token
   - User can now login

3. **User logs in** → `POST /api/v1/auth/login`
   - Validates email + password
   - Checks if account is confirmed
   - Returns JWT token

4. **All protected requests** include:
   ```
   Headers: {
     "Authorization": "Bearer <jwt_token>"
   }
   ```

5. **Token is decoded** in `ApplicationController#authenticate_request`
   - Extracts `user_id` from token
   - Sets `@current_user`
   - Returns 401 if invalid/missing

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden: You can only modify your own posts"
}
```

### 404 Not Found
```json
{
  "error": "Post not found"
}
```

### 422 Unprocessable Entity
```json
{
  "errors": [
    "Title can't be blank",
    "Description is too short (minimum is 10 characters)"
  ]
}
```

## Test Data

Run `rails db:seed` to populate with test data:

**Test Accounts:**
- daniel.esloh@gmail.com / password123
- user1@example.com / password123
- user2@example.com / password123
- user3@example.com / password123
- user4@example.com / password123
- user5@example.com / password123

**Sample Data Created:**
- 6 users
- 20 posts
- 10 tags
- 90+ comments (including nested)
- 140+ reactions
- 18+ notifications

## Development

### Start Server
```bash
cd server
rails server -p 3001
```

### Run Console
```bash
rails console
```

### Run Tests (when written)
```bash
rspec
```

### Database Commands
```bash
rails db:create     # Create database
rails db:migrate    # Run migrations
rails db:seed       # Seed data
rails db:reset      # Drop, create, migrate, seed
```

## Next Steps (To Implement)

1. **ActionCable Channels** for real-time features
2. **MailerSend Integration** for emails
3. **Rate Limiting** with Rack::Attack
4. **Image Upload** with Active Storage + Cloudinary
5. **RSpec Tests** for models and controllers
6. **API Documentation** with Swagger/OpenAPI
7. **Performance Optimization** with caching
8. **Background Jobs** with Solid Queue

## Notes

- All timestamps are in UTC
- Pagination defaults to 10 items per page, max 50
- JWT tokens expire after 24 hours
- Password must be minimum 6 characters
- Email format is validated with RFC 2822
- All string searches use `ILIKE` (case-insensitive)

---

**Backend Status**: ✅ **COMPLETE AND FUNCTIONAL**

All core API endpoints are implemented and tested with seed data.
