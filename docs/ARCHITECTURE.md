# SyncSpace: Software Architecture

This document outlines the software architecture for both the frontend and backend of the SyncSpace application. It reflects the final, refactored state of the system, emphasizing a clean separation of concerns, performance, and real-time capabilities.

## 1. Frontend Architecture (Next.js)

The frontend is built using Next.js with the App Router, following a modern, hybrid architecture that leverages both Server Components and Client Components.

### 1.1. Core Principles

- **Server Components by Default**: Pages and non-interactive components are Server Components to leverage server-side rendering, reduce client-side JavaScript, and improve performance.
- **Client Components for Interactivity**: Any component requiring state, effects, or browser-only APIs (e.g., forms, real-time lists) is marked with `'use client'`.
- **Centralized State Management**: Global state is managed via React Context, not a heavy third-party library. This is used for authentication and real-time notifications.
- **Global WebSocket Manager**: A single, global WebSocket client (`/lib/globalWebSocket.ts`) manages all ActionCable subscriptions and dispatches events throughout the application.

### 1.2. Real-Time System Architecture

The real-time system is a critical part of the application. After extensive refactoring, it follows a unified, robust pattern:

```
                               +--------------------------+
                               |   Backend (Rails)        |
                               |   ActionCable Server     |
                               +-------------+------------+
                                             |
                               (WebSocket Connection: /cable)
                                             |
+--------------------------------------------+---------------------------------------------+
|                                     Frontend (Next.js)                                   |
| +--------------------------------------------------------------------------------------+ |
| |                               /lib/globalWebSocket.ts                                | |
| |                                                                                      | |
| |  - Manages a SINGLE WebSocket connection.                                            | |
| |  - Authenticates once with JWT.                                                      | |
| |  - Subscribes to ALL relevant ActionCable channels (Posts, Comments, Notifications). | |
| |  - Receives messages from the server.                                                | |
| |  - Dispatches global window events (e.g., 'ws:post:new', 'ws:notification:new').     | |
| +------------------------------------------+-------------------------------------------+ |
|                                            |                                             |
|               (Listens for window events)  |                                             |
|                           +----------------+------------------+                          |
|                           |                                   |                          |
| +-------------------------v-+                             +---v-----------------------+  |
| | FeedStateContext.tsx    |                             | NotificationsContext.tsx  |  |
| |                         |                             |                           |  |
| | - Listens for 'ws:post:*' events. |                             | - Listens for 'ws:notification:*' events. |
| | - Manages the state of the posts feed. |                             | - Manages notification list and unread count. |
| | - Provides data to any component via useFeedState(). |                             | - Provides data via useNotifications(). |
| +-------------------------+-+                             +-------------+-------------+  |
|                           | |                                           |                |
|                           | | (Consumes context)                        | (Consumes context) |
|                           | |                                           |                |
|                 +---------v v---------+                       +---------v-----------+    |
|                 |   PostFeed.tsx      |                       | NotificationList.tsx|    |
|                 +---------------------+                       +---------------------+    |
|                                                               | NotificationDropdown|    |
|                                                               +---------------------+    |
|                                                                                        |
+----------------------------------------------------------------------------------------+
```

**Key Benefits of this Architecture:**
- **Single Connection**: Prevents multiple, resource-intensive WebSocket connections.
- **Decoupled Logic**: Components don't need to know about WebSockets. They just consume a React context.
- **Centralized Control**: All real-time logic is centralized in the `globalWebSocket` manager and the respective contexts, making it easy to debug and maintain.
- **No State Conflicts**: Components like `NotificationList` and `NotificationDropdown` share the exact same state from `NotificationsContext`, eliminating bugs where they would go out of sync.

### 1.3. Component & Page Structure

- **`/app/(protected)`**: Contains all routes that require authentication. A middleware automatically protects these routes.
- **`/app/[locale]`**: The root layout (`layout.tsx`) in this group sets up global providers, including `AuthProvider` and `NotificationsProvider`.
- **`/components/ui`**: Base UI components from `shadcn/ui`.
- **`/components/{feature}`**: Feature-specific components (e.g., `/components/posts`, `/components/comments`).
- **`/contexts`**: Home to the global state providers (`AuthContext.tsx`, `NotificationsContext.tsx`, `FeedStateContext.tsx`).
- **`/lib`**: Contains the most critical application logic:
    - `api.ts`: Client-side functions for making API calls.
    - `auth.ts`: Client-side authentication logic.
    - `globalWebSocket.ts`: The global WebSocket manager.

## 2. Backend Architecture (Ruby on Rails)

The backend is a stateless, API-only Rails application designed for performance and security.

### 2.1. Core Principles
- **API-Only**: The application is configured in `api_only = true` mode. It does not serve HTML views.
- **Stateless**: Authentication is handled via JWTs, meaning the server does not store session state.
- **Service-Oriented**: Business logic is encapsulated in service objects where appropriate (e.g., `JsonWebToken` service).
- **Convention over Configuration**: Follows Rails conventions for RESTful routing and model-view-controller patterns.
- **Concern-based Code Sharing**: Reusable logic in controllers is shared via Concerns (e.g., `Api::V1::PostSerializable`).

### 2.2. Data Serialization and Caching

- **Centralized Serialization**: To ensure consistency, all post-related JSON responses (for posts, comments, reactions) are generated by methods in the `Api::V1::PostSerializable` concern. This prevents bugs where different endpoints return differently structured data.
- **Counter Caches**: All `*_count` fields on models (`posts`, `comments`) are implemented as counter caches. This avoids slow `COUNT(*)` database queries, making feed generation and data retrieval extremely fast.
- **Version Caching**: The main posts feed uses a cache versioning strategy. When a post is created, updated, or deleted, a global cache key (`posts_cache_version`) is incremented, busting the cache for all users and ensuring fresh data is served.

### 2.3. Real-Time Broadcasting (ActionCable)

- **Model Callbacks**: Broadcasting is triggered from `after_commit` hooks within the ActiveRecord models. This ensures that a WebSocket message is only sent after the database transaction has successfully completed, preventing race conditions.
- **Targeted Streams**: Messages are broadcast to specific, authenticated users or to public streams.
    - `PostsChannel`: Broadcasts public post updates to all connected clients.
    - `CommentsChannel`: Broadcasts comment updates on a specific post to clients viewing that post.
    - `NotificationsChannel`: Broadcasts new notifications to a specific user's private stream.

**Example: Notification Broadcast**
```ruby
# app/models/notification.rb
class Notification < ApplicationRecord
  after_commit :broadcast_notification, on: :create

  private

  def broadcast_notification
    # Broadcasts the new notification ONLY to the recipient user
    NotificationsChannel.broadcast_to(
      self.user,
      {
        action: 'ws:notification:new',
        notification: Api::V1::NotificationsController.new.send(:notification_response, self)
      }
    )
  end
end
```

### 2.4. Database Schema & Performance
- **Polymorphic Associations**: `comments` and `reactions` use polymorphic associations (`commentable` and `reactionable`) to attach to both `Post` and `Comment` models, keeping the schema DRY.
- **GIN Indexes**: The `pg_trgm` extension is used with GIN indexes on text-heavy columns (`posts.title`, `posts.description`, `users.name`). This provides high-performance trigram-based search, which is much faster and more flexible than standard `LIKE` queries.
- **Foreign Key Constraints**: All associations have foreign key constraints at the database level to ensure data integrity.
