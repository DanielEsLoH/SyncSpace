# SyncSpace API Documentation

Complete REST API reference for the SyncSpace backend.

## Base URL

```
Development: http://localhost:8000/api/v1
Production: https://your-domain.com/api/v1
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Types

- **Access Token**: Short-lived (24 hours), used for API requests
- **Refresh Token**: Long-lived (7 days), used to obtain new access tokens

---

## Authentication Endpoints

### Register User

```http
POST /auth/register
```

**Request Body:**
```json
{
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "bio": "Software developer",
    "profile_picture": "https://example.com/pic.jpg" // optional
  }
}
```

**Response:** `201 Created`
```json
{
  "message": "Registration successful. Please check your email to confirm your account.",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "profile_picture": "https://ui-avatars.com/api/...",
    "bio": "Software developer",
    "confirmed": false,
    "created_at": "2025-11-03T10:00:00Z"
  }
}
```

### Login

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "profile_picture": "https://ui-avatars.com/api/...",
    "bio": "Software developer",
    "confirmed": true,
    "created_at": "2025-11-03T10:00:00Z"
  }
}
```

### Refresh Token

```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Response:** `200 OK`
```json
{
  "token": "new_access_token...",
  "refresh_token": "new_refresh_token...",
  "message": "Tokens refreshed successfully"
}
```

### Forgot Password

```http
POST /auth/forgot_password
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "If that email exists, password reset instructions have been sent"
}
```

### Reset Password

```http
POST /auth/reset_password
```

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "newpassword123",
  "password_confirmation": "newpassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password reset successfully",
  "token": "new_access_token...",
  "refresh_token": "new_refresh_token...",
  "user": { ... }
}
```

### Confirm Email

```http
GET /auth/confirm/:token
```

**Response:** `200 OK`
```json
{
  "message": "Email confirmed successfully",
  "token": "access_token...",
  "refresh_token": "refresh_token...",
  "user": { ... }
}
```

### Get Current User

```http
GET /auth/me
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "profile_picture": "https://ui-avatars.com/api/...",
    "bio": "Software developer",
    "confirmed": true,
    "created_at": "2025-11-03T10:00:00Z"
  }
}
```

---

## Posts Endpoints

### List Posts

```http
GET /posts?page=1&per_page=10
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 10, max: 50)

**Response:** `200 OK`
```json
{
  "posts": [
    {
      "id": 1,
      "title": "My First Post",
      "description": "This is my first post",
      "picture": "https://example.com/image.jpg",
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "profile_picture": "https://ui-avatars.com/api/..."
      },
      "tags": [
        {
          "id": 1,
          "name": "ruby",
          "color": "#FF0000"
        }
      ],
      "reactions_count": 5,
      "comments_count": 3,
      "user_reaction": {
        "id": 1,
        "reaction_type": "like",
        "created_at": "2025-11-03T10:00:00Z"
      },
      "last_three_comments": [...],
      "created_at": "2025-11-03T10:00:00Z",
      "updated_at": "2025-11-03T10:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 10,
    "total_count": 100,
    "total_pages": 10
  }
}
```

### Get Post

```http
GET /posts/:id
```

**Response:** `200 OK`
```json
{
  "post": { ... } // Same structure as list
}
```

### Create Post

```http
POST /posts
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "post": {
    "title": "My New Post",
    "description": "Post content here",
    "picture": "https://example.com/image.jpg", // optional
    "tag_names": ["ruby", "rails", "api"] // optional
  }
}
```

**Response:** `201 Created`
```json
{
  "post": { ... },
  "message": "Post created successfully"
}
```

### Update Post

```http
PUT /posts/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "post": {
    "title": "Updated Title",
    "description": "Updated content",
    "tag_names": ["ruby", "updated"]
  }
}
```

**Response:** `200 OK`

### Delete Post

```http
DELETE /posts/:id
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "Post deleted successfully"
}
```

---

## Comments Endpoints

### List Post Comments

```http
GET /posts/:post_id/comments?page=1&per_page=10
```

**Response:** `200 OK`
```json
{
  "comments": [
    {
      "id": 1,
      "description": "Great post!",
      "user": {
        "id": 1,
        "name": "John Doe",
        "profile_picture": "..."
      },
      "reactions_count": 2,
      "comments_count": 1, // reply count
      "created_at": "2025-11-03T10:00:00Z",
      "updated_at": "2025-11-03T10:00:00Z"
    }
  ],
  "meta": { ... }
}
```

### Create Comment

```http
POST /posts/:post_id/comments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "comment": {
    "description": "This is a comment"
  }
}
```

**Response:** `201 Created`

### List Comment Replies

```http
GET /comments/:comment_id/comments
```

**Response:** `200 OK` - Same structure as post comments

### Create Reply

```http
POST /comments/:comment_id/comments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "comment": {
    "description": "This is a reply"
  }
}
```

**Response:** `201 Created`

### Update Comment

```http
PUT /comments/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "comment": {
    "description": "Updated comment"
  }
}
```

**Response:** `200 OK`

### Delete Comment

```http
DELETE /comments/:id
Authorization: Bearer <token>
```

**Response:** `200 OK`

---

## Reactions Endpoints

### Toggle Post Reaction

```http
POST /posts/:post_id/reactions
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reaction_type": "like" // "like", "love", or "dislike"
}
```

**Response:** `200 OK`
```json
{
  "action": "added", // "added", "changed", or "removed"
  "reaction": {
    "id": 1,
    "reaction_type": "like",
    "user": { ... },
    "created_at": "2025-11-03T10:00:00Z"
  }
}
```

### Get Post Reactions

```http
GET /posts/:post_id/reactions
```

**Response:** `200 OK`
```json
{
  "reactions": [
    {
      "id": 1,
      "reaction_type": "like",
      "user": {
        "id": 1,
        "name": "John Doe",
        "profile_picture": "..."
      },
      "created_at": "2025-11-03T10:00:00Z"
    }
  ]
}
```

### Toggle Comment Reaction

```http
POST /comments/:comment_id/reactions
Authorization: Bearer <token>
```

Same structure as post reactions.

---

## Search Endpoints

### Search

```http
GET /search?q=query&page=1&per_page=10
```

**Query Parameters:**
- `q`: Search query
- `page` (optional): Page number
- `per_page` (optional): Items per page

**Response:** `200 OK`
```json
{
  "posts": [...],
  "meta": { ... }
}
```

---

## Tags Endpoints

### List Tags

```http
GET /tags?sort=popular // or "alphabetical"
```

**Response:** `200 OK`
```json
{
  "tags": [
    {
      "id": 1,
      "name": "ruby",
      "color": "#FF0000",
      "posts_count": 10,
      "created_at": "2025-11-03T10:00:00Z"
    }
  ]
}
```

### Get Tag

```http
GET /tags/:id
```

**Response:** `200 OK`

### Get Tag Posts

```http
GET /tags/:id/posts?page=1&per_page=10
```

**Response:** `200 OK` - Same structure as post list

---

## Notifications Endpoints

### List Notifications

```http
GET /notifications?page=1&per_page=20&filter=unread // or "all"
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "notifications": [
    {
      "id": 1,
      "notification_type": "comment_on_post",
      "message": "John Doe commented on your post",
      "read_at": null,
      "actor": {
        "id": 2,
        "name": "John Doe",
        "profile_picture": "..."
      },
      "notifiable": {
        "id": 1,
        "type": "Comment",
        "description": "Great post!"
      },
      "created_at": "2025-11-03T10:00:00Z"
    }
  ],
  "meta": {
    "unread_count": 5,
    ...
  }
}
```

### Mark Notification as Read

```http
PATCH /notifications/:id/read
Authorization: Bearer <token>
```

**Response:** `200 OK`

### Mark All as Read

```http
PATCH /notifications/mark_all_read
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "All notifications marked as read",
  "count": 5
}
```

---

## Users Endpoints

### Get User Profile

```http
GET /users/:id
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "profile_picture": "...",
    "bio": "Software developer",
    "stats": {
      "total_posts": 10,
      "total_reactions": 50,
      "total_comments": 30
    },
    "created_at": "2025-11-03T10:00:00Z"
  }
}
```

### Update User

```http
PUT /users/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "user": {
    "name": "Updated Name",
    "bio": "Updated bio",
    "profile_picture": "https://example.com/new-pic.jpg"
  }
}
```

**Response:** `200 OK`

### Update User Preferences

```http
PATCH /users/:id/preferences
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "theme": "dark", // "light", "dark", or "system"
  "language": "es" // "en" or "es"
}
```

**Response:** `200 OK`
```json
{
  "message": "Preferences updated successfully",
  "preferences": {
    "theme": "dark",
    "language": "es"
  }
}
```

### Get User Posts

```http
GET /users/:id/posts?page=1&per_page=10
```

**Response:** `200 OK` - Same structure as post list

### Search Users

```http
GET /users/search?q=john&page=1&per_page=10
```

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "profile_picture": "...",
      "bio": "Software developer",
      "posts_count": 10,
      "created_at": "2025-11-03T10:00:00Z"
    }
  ],
  "meta": { ... }
}
```

---

## Error Responses

### Validation Error (422)
```json
{
  "errors": [
    "Email has already been taken",
    "Password is too short (minimum is 6 characters)"
  ]
}
```

### Unauthorized (401)
```json
{
  "error": "Unauthorized"
}
```

### Forbidden (403)
```json
{
  "error": "Forbidden: You can only update your own profile"
}
```

### Not Found (404)
```json
{
  "error": "Post not found"
}
```

### Rate Limit Exceeded (429)
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later."
}
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/auth/login` | 5 requests/minute per IP |
| `/auth/register` | 3 requests/5 minutes per IP |
| `/auth/forgot_password` | 3 requests/hour per email |
| `/posts` (POST) | 10 requests/minute per user |
| `/comments` (POST) | 20 requests/minute per user |
| `/search` | 30 requests/minute per IP |
| Global | 300 requests/5 minutes per IP |

---

## WebSocket Connection

### Connection URL
```
ws://localhost:8000/cable
```

### Authentication
Send token in the connection URL:
```
ws://localhost:8000/cable?token=<access_token>
```

Or in the `Sec-WebSocket-Protocol` header.

### Channels

#### PostsChannel
Subscribe to posts stream:
```javascript
{
  "command": "subscribe",
  "identifier": "{\"channel\":\"PostsChannel\"}"
}
```

#### CommentsChannel
Subscribe to post comments:
```javascript
{
  "command": "subscribe",
  "identifier": "{\"channel\":\"CommentsChannel\",\"post_id\":1}"
}
```

#### NotificationsChannel
Subscribe to user notifications:
```javascript
{
  "command": "subscribe",
  "identifier": "{\"channel\":\"NotificationsChannel\"}"
}
```
