<div align="center">

# SyncSpace

**A modern, real-time social platform built with Next.js 16 and Rails 8**

*Share ideas, connect with others, and experience truly synchronized content*

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![Rails](https://img.shields.io/badge/Rails-8.0-red?logo=rubyonrails)](https://rubyonrails.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue?logo=postgresql)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-92%25-brightgreen)](./server/coverage)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[Features](#features) • [Quick Start](#quick-start) • [Architecture](#architecture) • [API Docs](./docs/API.md) • [Contributing](#contributing)

---

</div>

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running with Docker](#running-with-docker-recommended)
  - [Running Locally](#running-locally)
- [Project Structure](#project-structure)
- [Real-Time Architecture](#real-time-architecture)
- [API Documentation](#api-documentation)
- [Development](#development)
  - [Running Tests](#running-tests)
  - [Database Operations](#database-operations)
  - [Code Quality](#code-quality)
- [Security](#security)
- [Performance](#performance)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## Overview

**SyncSpace** is a production-ready, real-time social platform that demonstrates modern full-stack development practices. Built as a technical assessment for Leantech, it showcases:

- **Truly Real-Time**: WebSocket-powered live updates for posts, comments, reactions, and notifications across all connected clients
- **Modern Stack**: Next.js 16 with App Router, React 19, Rails 8, and PostgreSQL 17
- **Type-Safe**: Full TypeScript coverage on the frontend with comprehensive type definitions
- **Well-Tested**: 92% test coverage on the backend with RSpec, Jest on the frontend
- **Production-Ready**: Containerized with Docker, includes rate limiting, XSS protection, and optimized queries
- **Internationalized**: Built-in support for English and Spanish (easily extensible)

---

## Features

### Core Functionality

#### User Management
- **JWT Authentication** with rotating refresh tokens for enhanced security
- **Email Confirmation** flow for new user registration
- **Password Recovery** with secure reset links
- **User Profiles** with customizable avatars, bios, and activity tracking
- **Preferences** for theme (light/dark) and language that persist across sessions

#### Content Creation & Interaction
- **Posts**: Rich text posts with optional cover images, tags, and full CRUD operations
- **Comments**: Unlimited-depth nested commenting system with real-time updates
- **Reactions**: Express yourself with "like", "love", or "dislike" on posts and comments
- **Tagging**: Organize content with auto-colored tags and discover trending topics
- **Search**: Lightning-fast full-text search across posts, users, and tags using PostgreSQL trigrams

#### Real-Time Features
- **Live Feed Updates**: See new posts appear instantly without refreshing
- **Real-Time Comments**: Watch conversations unfold in real-time
- **Live Reactions**: See reaction counts update as they happen
- **Instant Notifications**: Get notified immediately when someone interacts with your content
- **Cross-View Sync**: Changes made in one view instantly reflect in all others

### Advanced Features

- **Dark Mode**: System-aware theme with manual override
- **Internationalization**: Full i18n support with `next-intl` (English/Spanish)
- **Infinite Scroll**: Smooth, paginated content loading
- **Optimistic Updates**: Instant UI feedback before server confirmation
- **Rate Limiting**: Protection against brute-force attacks and API abuse
- **Input Sanitization**: XSS protection on all user-generated content
- **Responsive Design**: Mobile-first design that works beautifully on all screen sizes

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0 | React framework with App Router for SSR, ISR, and optimal performance |
| **React** | 19.2 | UI library with modern hooks and Server Components |
| **TypeScript** | 5.x | Type-safe development with full IntelliSense |
| **Tailwind CSS** | 4.x | Utility-first CSS with custom design system |
| **shadcn/ui** | Latest | Beautiful, accessible component library built on Radix UI |
| **next-intl** | 4.4 | Type-safe internationalization with ICU message format |
| **next-themes** | 0.4 | System-aware theme management |
| **ActionCable** | 8.1 | WebSocket client for real-time communication |
| **React Hook Form** | 7.x | Performant form validation with minimal re-renders |
| **Axios** | 1.13 | Promise-based HTTP client with interceptors |
| **Jest** | 30.x | Testing framework with extensive matchers |
| **React Testing Library** | 16.x | Component testing focused on user behavior |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Ruby on Rails** | 8.0.3 | Modern API-only framework with convention over configuration |
| **Ruby** | 3.4.5 | Latest Ruby with YJIT JIT compiler |
| **PostgreSQL** | 17 | Production-grade relational database with advanced features |
| **Redis** | 7.x | In-memory cache and WebSocket adapter |
| **ActionCable** | 8.0 | WebSocket server for real-time bidirectional communication |
| **JWT** | Latest | Stateless authentication with token rotation |
| **BCrypt** | 3.1 | Secure password hashing with adaptive cost |
| **Rack::Attack** | Latest | Middleware for rate limiting and abuse prevention |
| **pg_trgm** | PostgreSQL ext | Trigram-based fuzzy text search |
| **RSpec** | 7.0 | Behavior-driven testing framework |
| **FactoryBot** | Latest | Fixture replacement for test data generation |
| **SimpleCov** | 0.22 | Code coverage analysis |

### Infrastructure & Services

- **Docker** & **Docker Compose**: Containerization for consistent development and deployment
- **Puma**: Multi-threaded web server optimized for Rails
- **Active Storage**: File upload handling with image processing via libvips
- **Cloudinary**: Cloud-based image storage and CDN for production deployments
- **Brevo (formerly Sendinblue)**: Transactional email service via API for user authentication flows (confirmation & password reset emails)
- **Vercel**: Production frontend hosting with automatic deployments
- **Render**: Production backend hosting with managed PostgreSQL and Redis

---

## Architecture

SyncSpace follows a modern, decoupled architecture with a clear separation between the frontend and backend.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            Next.js 16 (App Router)                    │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │  │
│  │  │   Pages    │  │ Components │  │  Contexts  │     │  │
│  │  └────────────┘  └────────────┘  └────────────┘     │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │      Global WebSocket Manager                │   │  │
│  │  │  (Centralized ActionCable Connection)        │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST & WebSocket (WS)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Rails 8 API)                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   API Controllers                     │  │
│  │        (RESTful endpoints with JWT auth)              │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              ActionCable Channels                     │  │
│  │   (PostsChannel, CommentsChannel, Notifications)      │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           ActiveRecord Models & Services              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
        ┌──────────────┐        ┌─────────────┐
        │  PostgreSQL  │        │    Redis    │
        │   Database   │        │    Cache    │
        └──────────────┘        └─────────────┘
```

For a detailed breakdown of the architecture, including the real-time system, serialization strategies, and caching mechanisms, see [**docs/ARCHITECTURE.md**](./docs/ARCHITECTURE.md).

---

## Quick Start

### Prerequisites

Ensure you have the following installed:

- **Docker** & **Docker Compose** (recommended) - [Install Docker](https://docs.docker.com/get-docker/)
- **OR** for local setup:
  - **Ruby** 3.4.5 - [Install Ruby](https://www.ruby-lang.org/en/documentation/installation/)
  - **Node.js** 18+ - [Install Node.js](https://nodejs.org/)
  - **PostgreSQL** 17 - [Install PostgreSQL](https://www.postgresql.org/download/)
  - **Redis** 7+ - [Install Redis](https://redis.io/download/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DanielEsLoH/SyncSpace.git
   cd SyncSpace
   ```

2. **Configure environment variables**

   **Backend** (`server/.env`):
   ```bash
   cp server/.env.example server/.env
   ```
   Then edit `server/.env` with your settings:
   ```ini
   # For local development: Leave DATABASE_URL and REDIS_URL commented out
   # (uses config/database.yml defaults: localhost PostgreSQL and Redis)

   # JWT Secret (generate with: rails secret)
   JWT_SECRET_KEY=your_super_secret_jwt_key_change_this_in_production

   # Brevo Email Service (API-based transactional emails)
   BREVO_API_KEY=your_brevo_api_key_here
   BREVO_FROM_EMAIL=no-reply@yourdomain.com

   # URLs
   CLIENT_URL=http://localhost:3000,http://localhost:3001
   SERVER_URL=http://localhost:3001

   # Cloudinary (Cloud storage for images)
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

   **Frontend** (`client/.env.local`):
   ```bash
   cp client/.env.example client/.env.local
   ```
   Then edit `client/.env.local` with your settings:
   ```ini
   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
   NEXT_PUBLIC_WS_URL=ws://localhost:3001/cable

   # Backend hostname for Next.js Image Optimization (production only, leave empty for local)
   # NEXT_PUBLIC_BACKEND_HOSTNAME=

   # Cloudinary (Optional - for image uploads)
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
   ```

### Running with Docker (Recommended)

Docker provides the fastest way to get the entire stack running with a single command.

```bash
# Start all services (Rails API, PostgreSQL, Redis)
docker-compose up --build -d

# Initialize the database (first time only)
docker-compose exec web rails db:create db:migrate db:seed

# View logs
docker-compose logs -f web

# In a separate terminal, start the frontend
cd client
npm install
npm run dev
```

**Access the application:**
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:3001](http://localhost:3001)

**Useful Docker commands:**
```bash
# Stop all services
docker-compose down

# Reset database
docker-compose exec web rails db:reset

# Open Rails console
docker-compose exec web rails console

# Run backend tests
docker-compose exec web bundle exec rspec
```

### Running Locally

If you prefer to run services directly without Docker:

**Terminal 1 - PostgreSQL & Redis:**
```bash
# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql@17

# Start Redis
brew services start redis
```

**Terminal 2 - Backend:**
```bash
cd server

# Install dependencies
bundle install

# Setup database
rails db:create db:migrate db:seed

# Start Rails server
rails server -p 3001
```

**Terminal 3 - Frontend:**
```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

**Default Test Accounts** (created by `db:seed`):
- Email: `daniel.esloh@gmail.com` / Password: `password123`
- Email: `user1@example.com` / Password: `password123`
- Email: `user2@example.com` / Password: `password123`
- Email: `user3@example.com` / Password: `password123`
- Email: `user4@example.com` / Password: `password123`
- Email: `user5@example.com` / Password: `password123`

The seed script also creates:
- 20 sample posts with random content and tags
- 10 predefined tags (tech, ruby, javascript, react, rails, nextjs, etc.)
- Multiple comments and nested replies on posts
- Reactions (likes, loves, dislikes) on posts and comments
- Sample notifications for demonstration

---

## Project Structure

```
SyncSpace/
│
├── client/                          # Next.js 16 Frontend Application
│   ├── app/                         # Next.js App Router
│   │   ├── (auth)/                  # Authentication routes (login, register)
│   │   ├── (protected)/             # Protected routes (feed, profile, settings)
│   │   ├── [locale]/                # Internationalized routes
│   │   └── layout.tsx               # Root layout with providers
│   │
│   ├── components/                  # React Components
│   │   ├── ui/                      # Base UI components (shadcn/ui)
│   │   ├── posts/                   # Post-related components (PostCard, PostFeed)
│   │   ├── comments/                # Comment system components
│   │   ├── notifications/           # Notification components
│   │   └── auth/                    # Authentication forms
│   │
│   ├── contexts/                    # React Context Providers
│   │   ├── AuthContext.tsx          # Authentication state
│   │   ├── NotificationsContext.tsx # Real-time notifications
│   │   └── FeedStateContext.tsx     # Feed state management
│   │
│   ├── lib/                         # Core Logic & Utilities
│   │   ├── api.ts                   # API client functions
│   │   ├── auth.ts                  # Authentication utilities
│   │   ├── globalWebSocket.ts       # WebSocket manager (singleton)
│   │   └── posts.ts                 # Post-related utilities
│   │
│   ├── types/                       # TypeScript type definitions
│   ├── public/                      # Static assets
│   └── __tests__/                   # Jest test suites
│
├── server/                          # Ruby on Rails 8 API Backend
│   ├── app/
│   │   ├── channels/                # ActionCable WebSocket channels
│   │   │   ├── posts_channel.rb
│   │   │   ├── comments_channel.rb
│   │   │   └── notifications_channel.rb
│   │   │
│   │   ├── controllers/             # API Controllers
│   │   │   ├── concerns/            # Shared controller logic
│   │   │   └── api/v1/              # API v1 endpoints
│   │   │       ├── auth_controller.rb
│   │   │       ├── posts_controller.rb
│   │   │       ├── comments_controller.rb
│   │   │       ├── reactions_controller.rb
│   │   │       ├── notifications_controller.rb
│   │   │       └── users_controller.rb
│   │   │
│   │   ├── models/                  # ActiveRecord Models
│   │   │   ├── user.rb
│   │   │   ├── post.rb
│   │   │   ├── comment.rb
│   │   │   ├── reaction.rb
│   │   │   ├── tag.rb
│   │   │   └── notification.rb
│   │   │
│   │   ├── services/                # Service Objects
│   │   │   └── json_web_token.rb
│   │   │
│   │   └── mailers/                 # Email templates
│   │
│   ├── config/                      # Rails configuration
│   │   ├── routes.rb                # API routes definition
│   │   └── environments/            # Environment-specific configs
│   │
│   ├── db/                          # Database
│   │   ├── migrate/                 # Database migrations
│   │   ├── seeds.rb                 # Seed data for development
│   │   └── schema.rb                # Current database schema
│   │
│   └── spec/                        # RSpec test suite
│       ├── requests/                # Request specs (integration tests)
│       ├── models/                  # Model specs (unit tests)
│       └── channels/                # Channel specs (WebSocket tests)
│
├── docs/                            # Documentation
│   ├── API.md                       # Complete API reference
│   └── ARCHITECTURE.md              # Detailed architecture guide
│
├── docker-compose.yml               # Docker Compose configuration
└── README.md                        # This file
```

---

## Real-Time Architecture

SyncSpace implements a sophisticated real-time system using **ActionCable** (WebSockets) that ensures all connected clients stay perfectly synchronized.

### How It Works

1. **Single Connection**: Each client establishes one WebSocket connection via the global WebSocket manager (`lib/globalWebSocket.ts`)
2. **Channel Subscriptions**: The client automatically subscribes to relevant channels (Posts, Comments, Notifications)
3. **Server-Side Broadcasting**: When data changes (e.g., new post, comment, reaction), Rails broadcasts updates via `after_commit` callbacks
4. **Client-Side Updates**: The global manager receives broadcasts, dispatches custom events, and React contexts update the UI

### Example: Creating a New Post

```
User creates post → Rails validates & saves → DB commit succeeds
    ↓
after_commit callback triggers → PostsChannel.broadcast_to(...)
    ↓
All connected clients receive message → globalWebSocket dispatches event
    ↓
FeedStateContext listens → Updates posts array → PostFeed re-renders
    ↓
All users see the new post instantly (no refresh needed)
```

### Key Benefits

- **Zero Polling**: No expensive interval-based API requests
- **Sub-Second Latency**: Changes appear across all clients in milliseconds
- **Scalable**: Redis adapter allows horizontal scaling
- **Resilient**: Automatic reconnection with exponential backoff
- **Efficient**: Only relevant data is sent to subscribed clients

For a deep dive into the real-time architecture, see [**docs/ARCHITECTURE.md**](./docs/ARCHITECTURE.md#12-real-time-system-architecture).

---

## API Documentation

### Base URL
- **Development**: `http://localhost:3001/api/v1`
- **Production**: `https://your-domain.com/api/v1`

### Authentication

All protected endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

### Core Endpoints

#### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/auth/register` | Register new user | No |
| `POST` | `/auth/login` | Login and receive tokens | No |
| `POST` | `/auth/refresh` | Refresh access token | No (requires refresh token) |
| `GET` | `/auth/me` | Get current user profile | Yes |
| `DELETE` | `/auth/logout` | Logout and invalidate tokens | Yes |

#### Posts

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/posts` | List posts (paginated, filterable) | No |
| `GET` | `/posts/:id` | Get single post with comments | No |
| `POST` | `/posts` | Create new post | Yes |
| `PUT` | `/posts/:id` | Update post | Yes (owner only) |
| `DELETE` | `/posts/:id` | Delete post | Yes (owner only) |

#### Comments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/posts/:post_id/comments` | Create comment on post | Yes |
| `POST` | `/comments/:comment_id/comments` | Reply to comment | Yes |
| `PUT` | `/comments/:id` | Update comment | Yes (owner only) |
| `DELETE` | `/comments/:id` | Delete comment | Yes (owner only) |

#### Reactions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/posts/:id/reactions` | React to post | Yes |
| `POST` | `/comments/:id/reactions` | React to comment | Yes |
| `DELETE` | `/posts/:id/reactions/:reaction_type` | Remove reaction from post | Yes |

#### Search

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/search?q=query&type=posts` | Search posts | No |
| `GET` | `/search?q=query&type=users` | Search users | No |
| `GET` | `/search?q=query&type=tags` | Search tags | No |

#### Notifications

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/notifications` | List user's notifications | Yes |
| `PUT` | `/notifications/:id/read` | Mark notification as read | Yes |
| `PUT` | `/notifications/read_all` | Mark all as read | Yes |

For complete API documentation with request/response examples, see [**docs/API.md**](./docs/API.md).

---

## Development

### Running Tests

#### Backend Tests (RSpec)

```bash
# Run all tests
cd server
bundle exec rspec

# Run specific test file
bundle exec rspec spec/models/user_spec.rb

# Run with coverage report
COVERAGE=true bundle exec rspec

# View coverage report
open coverage/index.html
```

**Current Coverage**: 92% (see `server/coverage/index.html`)

#### Frontend Tests (Jest)

```bash
# Run all tests
cd client
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Update snapshots
npm test -- -u
```

### Database Operations

```bash
cd server

# Create a new migration
rails generate migration AddColumnToTable column_name:type

# Run pending migrations
rails db:migrate

# Rollback last migration
rails db:rollback

# Rollback multiple migrations
rails db:rollback STEP=3

# Reset database (drop, create, migrate, seed)
rails db:reset

# Open PostgreSQL console
rails dbconsole
```

### Code Quality

#### Backend (RuboCop)

```bash
cd server

# Run linter
bundle exec rubocop

# Auto-fix issues
bundle exec rubocop -a

# Check for security vulnerabilities
bundle exec brakeman
```

#### Frontend (ESLint)

```bash
cd client

# Run linter
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

### Working with ActionCable (WebSockets)

Test WebSocket connections using a tool like [wscat](https://github.com/websockets/wscat):

```bash
# Install wscat
npm install -g wscat

# Connect to local WebSocket server
wscat -c ws://localhost:3001/cable

# Subscribe to a channel (after connection)
{"command":"subscribe","identifier":"{\"channel\":\"PostsChannel\"}"}
```

---

## Security

SyncSpace implements multiple layers of security to protect user data and prevent common vulnerabilities.

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with short-lived access tokens (15 min) and long-lived refresh tokens (7 days)
- **Token Rotation**: Refresh tokens are rotated on each use to prevent replay attacks
- **Secure Password Storage**: BCrypt with adaptive cost factor (automatically increases over time)
- **Email Confirmation**: Users must confirm their email before full account access

### Input Validation & Sanitization
- **XSS Protection**: All user input is sanitized before rendering (both backend and frontend)
- **SQL Injection Prevention**: ActiveRecord parameterized queries prevent SQL injection
- **CSRF Protection**: Rails CSRF tokens on all state-changing requests
- **Strong Parameters**: Explicit allowlisting of accepted parameters in controllers

### Rate Limiting (Rack::Attack)
- **Login Attempts**: Max 5 failed attempts per IP per 20 seconds
- **API Requests**: Max 300 requests per IP per 5 minutes
- **Registration**: Max 5 signups per IP per hour

### CORS Policy
- **Restrictive Origins**: Only allowed frontend domains can make requests
- **Credential Sharing**: Cookies/headers only shared with trusted origins
- **Method Whitelisting**: Only necessary HTTP methods are allowed

### Database Security
- **Foreign Key Constraints**: Prevent orphaned records and maintain referential integrity
- **Index-Only Sensitive Columns**: Password digests never logged or exposed
- **Connection Pooling**: Prevents connection exhaustion attacks

---

## Performance

SyncSpace is optimized for speed and scalability at every layer.

### Database Optimizations
- **Counter Caches**: All `*_count` columns are cached at the database level (posts count, comments count, reactions count)
- **GIN Indexes**: Trigram indexes on text columns enable sub-100ms full-text search
- **Eager Loading**: Strategic use of `includes()` to prevent N+1 queries
- **Connection Pooling**: Puma's multi-threaded server with optimized pool size

### Caching Strategy
- **Redis Caching**: Frequently accessed data cached in Redis for microsecond retrieval
- **Cache Versioning**: Global cache keys invalidated intelligently on updates
- **HTTP Caching**: Proper `ETag` and `Cache-Control` headers for client-side caching

### Frontend Optimizations
- **Server Components**: Default to Server Components to reduce JavaScript bundle size
- **Code Splitting**: Automatic route-based code splitting via Next.js App Router
- **Image Optimization**: Next.js `<Image>` component with automatic WebP conversion and lazy loading
- **Optimistic Updates**: Instant UI feedback before server confirmation

### Real-Time Efficiency
- **Single WebSocket**: One connection per client (not one per feature)
- **Selective Broadcasting**: Only relevant clients receive updates
- **Event Batching**: Multiple updates batched when possible to reduce messages

---

## Deployment

### Docker Deployment (Recommended)

SyncSpace is fully containerized and ready for deployment on any platform that supports Docker.

#### Deploy to Production

1. **Build production images**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Configure production environment**
   ```bash
   # Set production environment variables
   cp server/.env.example server/.env.production
   # Edit server/.env.production with production values
   ```

3. **Run database migrations**
   ```bash
   docker-compose -f docker-compose.prod.yml run web rails db:migrate
   ```

4. **Start services**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

#### Deployment Platforms

**Recommended platforms:**

- **Vercel** (Frontend): Zero-config Next.js deployment with automatic HTTPS and CDN
  ```bash
  # Install Vercel CLI
  npm i -g vercel

  # Deploy from client directory
  cd client
  vercel
  ```

- **Render** (Backend): Managed Rails hosting with PostgreSQL and Redis included
  - Create a new Web Service pointing to your repository
  - Add environment variables from the production list above
  - Render will automatically detect Rails and run migrations

- **Railway**: One-click deployment with automatic HTTPS for both frontend and backend
- **Heroku**: Simple deployment with Heroku Postgres and Redis add-ons
  ```bash
  heroku create your-app-name
  heroku addons:create heroku-postgresql:hobby-dev
  heroku addons:create heroku-redis:hobby-dev
  git push heroku main
  ```

- **AWS ECS/Fargate**: Production-grade with full control
- **DigitalOcean App Platform**: Managed platform with easy scaling

### Environment Variables for Production

Ensure these are set in your production environment:

**Backend (e.g., Render):**
```ini
# Rails environment
RAILS_ENV=production

# Database & Redis
DATABASE_URL=postgresql://user:password@host:5432/syncspace_production
REDIS_URL=redis://user:password@host:6379/0

# Secrets (generate with: rails secret)
SECRET_KEY_BASE=<generate_with_rails_secret>
JWT_SECRET_KEY=<generate_with_rails_secret>

# Brevo Email Service (API-based transactional emails)
BREVO_API_KEY=your_brevo_api_key
BREVO_FROM_EMAIL=no-reply@yourdomain.com

# URLs
CLIENT_URL=https://your-frontend-domain.com
SERVER_URL=https://your-backend-domain.com

# Cloudinary (Cloud storage for images)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**Frontend (e.g., Vercel):**
```ini
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api/v1
NEXT_PUBLIC_WS_URL=wss://your-backend-domain.com/cable

# Backend hostname for Next.js Image Optimization (ActiveStorage images)
NEXT_PUBLIC_BACKEND_HOSTNAME=your-backend-domain.com

# Cloudinary (Optional - for image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

---

## Troubleshooting

### Common Issues

#### WebSocket Connection Fails

**Symptom**: Real-time updates don't work, console shows WebSocket errors

**Solution**:
1. Check that `NEXT_PUBLIC_WS_URL` is correctly set in `client/.env.local`
2. Verify Rails server is running and accessible
3. Check CORS settings in `server/config/initializers/cors.rb`
4. Ensure Redis is running (`redis-cli ping` should return `PONG`)

#### Database Connection Errors

**Symptom**: `ActiveRecord::NoDatabaseError` or connection timeouts

**Solution**:
```bash
# Ensure PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Recreate database
cd server
rails db:drop db:create db:migrate db:seed
```

#### Port Already in Use

**Symptom**: `Address already in use - bind(2) for "127.0.0.1" port 3000`

**Solution**:
```bash
# Find process using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

#### JWT Token Expired

**Symptom**: `401 Unauthorized` errors after some time

**Solution**: The frontend automatically refreshes tokens, but if you're testing the API directly:
```bash
# Use the refresh token to get a new access token
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "your_refresh_token"}'
```

#### Tests Failing

**Symptom**: Random test failures or database-related errors

**Solution**:
```bash
# Reset test database
cd server
RAILS_ENV=test rails db:drop db:create db:migrate

# Clear test cache
rm -rf tmp/cache/

# Run tests again
bundle exec rspec
```

#### Docker Issues

**Symptom**: Containers won't start or build

**Solution**:
```bash
# Clean up Docker
docker-compose down -v  # Remove volumes
docker system prune -a  # Clean up images

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up
```

---

## Contributing

Contributions are welcome! Please follow these guidelines:

### Development Workflow

1. **Fork the repository** and create your branch from `main`
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes** following the code style guides:
   - Backend: Follow Rails conventions and RuboCop rules
   - Frontend: Use TypeScript, follow ESLint rules

3. **Write tests** for your changes:
   - Backend: Add RSpec tests in `server/spec/`
   - Frontend: Add Jest tests in `client/__tests__/`

4. **Ensure all tests pass**:
   ```bash
   # Backend
   cd server && bundle exec rspec

   # Frontend
   cd client && npm test
   ```

5. **Commit your changes** with clear, descriptive messages:
   ```bash
   git commit -m "feat: add user profile editing feature"
   ```

6. **Push to your fork** and submit a Pull Request:
   ```bash
   git push origin feature/amazing-feature
   ```

### Code Style

- **Ruby**: Follow the [Ruby Style Guide](https://rubystyle.guide/)
- **TypeScript/React**: Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- **Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/)

### Pull Request Guidelines

- Provide a clear description of the problem and solution
- Include relevant issue numbers if applicable
- Add screenshots for UI changes
- Ensure CI/CD checks pass
- Request review from maintainers

---

## License

This project was developed as a technical assessment for **Leantech**. All rights reserved.

For licensing inquiries, please contact the author.

---

## Author

**Daniel E. Londoño**

- **Email**: [daniel.esloh@gmail.com](mailto:daniel.esloh@gmail.com)
- **GitHub**: [@DanielEsLoH](https://github.com/DanielEsLoH)
- **LinkedIn**: [Daniel E. Londoño](https://www.linkedin.com/in/daniel-esteban-londoño-henao-b9212b1b9/)

---

<div align="center">

**Built with ❤️ using Next.js 16 and Rails 8**

*If you found this project helpful, please consider giving it a star!*

</div>
