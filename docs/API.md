# SyncSpace API Documentation

This document provides a complete reference for the SyncSpace backend REST API.

## Base URL

- **Development**: `http://localhost:8000/api/v1`
- **Production**: `https://your-production-domain.com/api/v1`

## Authentication

All protected endpoints require a JWT in the `Authorization` header.

```
Authorization: Bearer <access_token>
```

- **Access Token**: Short-lived (24 hours), used for API requests.
- **Refresh Token**: Long-lived (7 days), used to obtain new access tokens.

---

## 1. Authentication Endpoints

### `POST /auth/register`
Registers a new user.
- **Request Body**: `{ "user": { "name", "email", "password", "password_confirmation" } }`
- **Response**: `201 Created` with a success message. An email confirmation is sent.

### `POST /auth/login`
Logs in a user.
- **Request Body**: `{ "email", "password" }`
- **Response**: `200 OK` with `token`, `refresh_token`, and `user` object.

### `POST /auth/refresh`
Refreshes an expired access token.
- **Request Body**: `{ "refresh_token" }`
- **Response**: `200 OK` with a new `token` and `refresh_token`.

### `GET /auth/me`
Retrieves the currently authenticated user's profile.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` with the `user` object.

### `POST /auth/forgot_password`
Initiates the password reset process.
- **Request Body**: `{ "email" }`
- **Response**: `200 OK` with a success message.

### `POST /auth/reset_password`
Resets a user's password using a token from email.
- **Request Body**: `{ "token", "password", "password_confirmation" }`
- **Response**: `200 OK` with a success message and new login tokens.

### `GET /auth/confirm/:token`
Confirms a user's email address using a token from email.
- **Response**: `200 OK` with a success message and new login tokens.

---

## 2. Posts Endpoints

### `GET /posts`
Lists all posts, paginated.
- **Query Params**: `page` (number), `per_page` (number).
- **Response**: `200 OK` with `{ "posts": [...], "meta": { ... } }`.

### `GET /posts/:id`
Retrieves a single post by its ID.
- **Response**: `200 OK` with `{ "post": { ... } }`.

### `POST /posts`
Creates a new post. (Requires authentication)
- **Request Body**: `{ "post": { "title", "description", "picture" (optional) }, "tags": ["tag1", "tag2"] (optional) }`
- **Response**: `201 Created` with the new post object.

### `PUT /posts/:id`
Updates an existing post. (Requires authentication, user must be owner)
- **Request Body**: `{ "post": { "title" (optional), "description" (optional) } }`
- **Response**: `200 OK` with the updated post object.

### `DELETE /posts/:id`
Deletes a post. (Requires authentication, user must be owner)
- **Response**: `200 OK` with a success message.

---

## 3. Comments Endpoints

### `GET /posts/:post_id/comments`
Lists all top-level comments for a specific post, paginated.
- **Query Params**: `page`, `per_page`.
- **Response**: `200 OK` with `{ "comments": [...], "meta": { ... } }`.

### `POST /posts/:post_id/comments`
Creates a new top-level comment on a post. (Requires authentication)
- **Request Body**: `{ "comment": { "description" } }`
- **Response**: `201 Created` with the new comment object.

### `GET /comments/:comment_id/comments`
Lists all replies (child comments) for a specific comment, paginated.
- **Query Params**: `page`, `per_page`.
- **Response**: `200 OK` with `{ "comments": [...], "meta": { ... } }`.

### `POST /comments/:comment_id/comments`
Creates a reply to another comment. (Requires authentication)
- **Request Body**: `{ "comment": { "description" } }`
- **Response**: `201 Created` with the new comment object.

### `PUT /comments/:id`
Updates a comment. (Requires authentication, user must be owner)
- **Request Body**: `{ "comment": { "description" } }`
- **Response**: `200 OK` with the updated comment object.

### `DELETE /comments/:id`
Deletes a comment. (Requires authentication, user must be owner)
- **Response**: `200 OK` with a success message.

---

## 4. Reactions Endpoints

### `POST /posts/:post_id/reactions`
Adds, changes, or removes a reaction on a post. (Requires authentication)
- **Request Body**: `{ "reaction_type": "like" | "love" | "dislike" }`
- **Response**: `200 OK` with `{ "action": "added" | "changed" | "removed", "reaction": { ... } }`.

### `POST /comments/:comment_id/reactions`
Toggles a reaction on a comment. (Requires authentication)
- **Request Body**: `{ "reaction_type": "like" | "love" | "dislike" }`
- **Response**: `200 OK` with `{ "action": "added" | "changed" | "removed", "reaction": { ... } }`.

---

## 5. Users & Profiles Endpoints

### `GET /users/:id`
Retrieves a user's public profile and statistics.
- **Response**: `200 OK` with `{ "user": { "id", "name", "bio", "profile_picture", "stats": { ... } } }`.

### `GET /users/:id/posts`
Lists all posts by a specific user, paginated.
- **Query Params**: `page`, `per_page`.
- **Response**: `200 OK` with `{ "posts": [...], "meta": { ... } }`.

### `PUT /users/:id`
Updates a user's own profile. (Requires authentication, user must be owner)
- **Request Body**: `{ "user": { "name" (optional), "bio" (optional), "profile_picture" (optional) } }`
- **Response**: `200 OK` with the updated user object.

### `PATCH /users/:id/preferences`
Updates a user's theme or language preferences. (Requires authentication, user must be owner)
- **Request Body**: `{ "theme": "light" | "dark" | "system" (optional), "language": "en" | "es" (optional) }`
- **Response**: `200 OK` with a success message.

---

## 6. Notifications Endpoints

### `GET /notifications`
Lists notifications for the authenticated user, paginated.
- **Query Params**: `page`, `per_page`, `filter` ("all" or "unread").
- **Response**: `200 OK` with `{ "notifications": [...], "unread_count": number, "meta": { ... } }`.

### `PUT /notifications/:id/mark_read`
Marks a single notification as read. (Requires authentication)
- **Response**: `200 OK` with the updated notification object.

### `PUT /notifications/mark_all_read`
Marks all unread notifications as read for the authenticated user.
- **Response**: `200 OK` with a success message.

---

## 7. Search & Tags Endpoints

### `GET /search`
Performs a full-text search across posts, users, and tags.
- **Query Params**: `q` (the search query).
- **Response**: `200 OK` with `{ "posts": [...], "users": [...], "tags": [...] }`.

### `GET /tags`
Lists all tags, sorted by popularity or alphabetically.
- **Query Params**: `sort` ("popular" or "alphabetical").
- **Response**: `200 OK` with `{ "tags": [...] }`.

### `GET /tags/:id/posts`
Lists all posts associated with a specific tag, paginated.
- **Query Params**: `page`, `per_page`.
- **Response**: `200 OK` with `{ "posts": [...], "meta": { ... } }`.

---

## 8. WebSocket API (ActionCable)

The WebSocket API provides real-time updates.

- **Connection URL**: `ws://localhost:8000/cable`
- **Authentication**: Pass the JWT as a query parameter: `?token=<access_token>`

### Channels & Events

- **`PostsChannel`**:
  - `subscribe`: Stream all public post updates.
  - `ws:post:new`: A new post is created.
  - `ws:post:update`: A post is updated.
  - `ws:post:delete`: A post is deleted.

- **`CommentsChannel`**:
  - `subscribe`: Pass `post_id` to stream comments for a specific post.
  - `ws:comment:new`: A new comment or reply is created.
  - `ws:comment:update`: A comment is updated.
  - `ws:comment:delete`: A comment is deleted.

- **`NotificationsChannel`**:
  - `subscribe`: Stream notifications for the authenticated user.
  - `ws:notification:new`: A new notification is available.
  - `ws:notification:read`: A notification was marked as read.
  - `ws:notification:all-read`: All notifications were marked as read.

---

## 9. Error Responses

- **`401 Unauthorized`**: Missing or invalid JWT.
- **`403 Forbidden`**: Authenticated user does not have permission for the action.
- **`404 Not Found`**: The requested resource does not exist.
- **`422 Unprocessable Entity`**: Validation failed (e.g., invalid email, password too short). The response body will contain an `errors` array.
- **`429 Too Many Requests`**: Rate limit exceeded.